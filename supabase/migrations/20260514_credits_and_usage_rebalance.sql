-- Migration: Credits system + rebalanced usage limits
-- Adds prepaid credits, daily usage tracking, cooldown, and credit transaction history

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Add credits + daily tracking columns to profiles
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_monthly_grant INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_granted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS daily_chat_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_chat_reset_at DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS last_chat_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_credits ON profiles(credits_balance) WHERE credits_balance > 0;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Credit transaction ledger (audit trail)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN (
        'monthly_grant', 'top_up', 'consultation', 'pdf_report',
        'priority_booking', 'wellness_snapshot', 'refund', 'admin_adjust'
    )),
    description TEXT,
    pack_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id, created_at DESC);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own credit transactions" ON credit_transactions;
CREATE POLICY "Users can read own credit transactions"
    ON credit_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Rebalanced increment_chat_count — now with daily limits + cooldown
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION increment_chat_count(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan TEXT;
    v_monthly_count INTEGER;
    v_daily_count INTEGER;
    v_reset_at TIMESTAMPTZ;
    v_daily_reset DATE;
    v_last_chat TIMESTAMPTZ;
    v_credits INTEGER;
    v_monthly_limit INTEGER;
    v_daily_limit INTEGER;
    v_cooldown INTEGER;
BEGIN
    SELECT subscription_plan, monthly_chat_count, chat_count_reset_at,
           COALESCE(daily_chat_count, 0), COALESCE(daily_chat_reset_at, CURRENT_DATE),
           last_chat_at, COALESCE(credits_balance, 0)
    INTO v_plan, v_monthly_count, v_reset_at,
         v_daily_count, v_daily_reset,
         v_last_chat, v_credits
    FROM profiles
    WHERE id = p_user_id;

    -- Auto-reset monthly if >30 days
    IF v_reset_at IS NULL OR (NOW() - v_reset_at) > INTERVAL '30 days' THEN
        UPDATE profiles
        SET monthly_chat_count = 0, chat_count_reset_at = NOW()
        WHERE id = p_user_id;
        v_monthly_count := 0;
    END IF;

    -- Auto-reset daily count
    IF v_daily_reset < CURRENT_DATE THEN
        UPDATE profiles
        SET daily_chat_count = 0, daily_chat_reset_at = CURRENT_DATE
        WHERE id = p_user_id;
        v_daily_count := 0;
    END IF;

    -- Determine limits based on plan
    v_monthly_limit := CASE v_plan
        WHEN 'free' THEN 5
        WHEN 'plus' THEN -1
        WHEN 'pro'  THEN -1
        ELSE 5
    END;

    v_daily_limit := CASE v_plan
        WHEN 'free' THEN 2
        WHEN 'plus' THEN -1
        WHEN 'pro'  THEN -1
        ELSE 2
    END;

    v_cooldown := CASE v_plan
        WHEN 'free' THEN 30
        ELSE 0
    END;

    -- Cooldown check (free tier only)
    IF v_cooldown > 0 AND v_last_chat IS NOT NULL THEN
        IF EXTRACT(EPOCH FROM (NOW() - v_last_chat)) < v_cooldown THEN
            RETURN json_build_object(
                'allowed', false,
                'code', 'COOLDOWN',
                'cooldown_remaining', CEIL(v_cooldown - EXTRACT(EPOCH FROM (NOW() - v_last_chat))),
                'plan', v_plan
            );
        END IF;
    END IF;

    -- Daily limit check
    IF v_daily_limit > 0 AND v_daily_count >= v_daily_limit THEN
        -- Check if user has credits to spend instead
        IF v_credits >= 1 THEN
            -- Deduct 1 credit for the consultation
            UPDATE profiles
            SET credits_balance = credits_balance - 1,
                daily_chat_count = daily_chat_count + 1,
                monthly_chat_count = monthly_chat_count + 1,
                last_chat_at = NOW(),
                updated_at = NOW()
            WHERE id = p_user_id;

            INSERT INTO credit_transactions (user_id, amount, balance_after, action, description)
            VALUES (p_user_id, -1, v_credits - 1, 'consultation', 'Daily limit exceeded — used 1 credit');

            RETURN json_build_object(
                'allowed', true,
                'used_credit', true,
                'credits_remaining', v_credits - 1,
                'current_count', v_monthly_count + 1,
                'daily_count', v_daily_count + 1,
                'plan', v_plan
            );
        END IF;

        RETURN json_build_object(
            'allowed', false,
            'code', 'DAILY_LIMIT',
            'daily_count', v_daily_count,
            'daily_limit', v_daily_limit,
            'credits_balance', v_credits,
            'plan', v_plan
        );
    END IF;

    -- Monthly limit check
    IF v_monthly_limit > 0 AND v_monthly_count >= v_monthly_limit THEN
        -- Check if user has credits
        IF v_credits >= 1 THEN
            UPDATE profiles
            SET credits_balance = credits_balance - 1,
                monthly_chat_count = monthly_chat_count + 1,
                daily_chat_count = daily_chat_count + 1,
                last_chat_at = NOW(),
                updated_at = NOW()
            WHERE id = p_user_id;

            INSERT INTO credit_transactions (user_id, amount, balance_after, action, description)
            VALUES (p_user_id, -1, v_credits - 1, 'consultation', 'Monthly limit exceeded — used 1 credit');

            RETURN json_build_object(
                'allowed', true,
                'used_credit', true,
                'credits_remaining', v_credits - 1,
                'current_count', v_monthly_count + 1,
                'plan', v_plan
            );
        END IF;

        RETURN json_build_object(
            'allowed', false,
            'code', 'MONTHLY_LIMIT',
            'current_count', v_monthly_count,
            'limit', v_monthly_limit,
            'credits_balance', v_credits,
            'plan', v_plan,
            'resets_at', v_reset_at + INTERVAL '30 days'
        );
    END IF;

    -- All checks passed — increment
    UPDATE profiles
    SET monthly_chat_count = monthly_chat_count + 1,
        daily_chat_count = daily_chat_count + 1,
        last_chat_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN json_build_object(
        'allowed', true,
        'used_credit', false,
        'current_count', v_monthly_count + 1,
        'daily_count', v_daily_count + 1,
        'limit', v_monthly_limit,
        'daily_limit', v_daily_limit,
        'credits_balance', v_credits,
        'plan', v_plan
    );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Credit management functions
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add credits (top-up or monthly grant)
CREATE OR REPLACE FUNCTION add_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_action TEXT DEFAULT 'top_up',
    p_description TEXT DEFAULT NULL,
    p_pack_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    IF p_amount <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Amount must be positive');
    END IF;

    UPDATE profiles
    SET credits_balance = COALESCE(credits_balance, 0) + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING credits_balance INTO v_new_balance;

    IF v_new_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;

    INSERT INTO credit_transactions (user_id, amount, balance_after, action, description, pack_id)
    VALUES (p_user_id, p_amount, v_new_balance, p_action, p_description, p_pack_id);

    RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- Spend credits for a feature
CREATE OR REPLACE FUNCTION spend_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_action TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    SELECT COALESCE(credits_balance, 0) INTO v_current_balance
    FROM profiles WHERE id = p_user_id;

    IF v_current_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;

    IF v_current_balance < p_amount THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'required', p_amount,
            'available', v_current_balance
        );
    END IF;

    v_new_balance := v_current_balance - p_amount;

    UPDATE profiles
    SET credits_balance = v_new_balance, updated_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO credit_transactions (user_id, amount, balance_after, action, description)
    VALUES (p_user_id, -p_amount, v_new_balance, p_action, p_description);

    RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- Get user usage summary (for billing dashboard)
CREATE OR REPLACE FUNCTION get_usage_summary(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan TEXT;
    v_monthly_count INTEGER;
    v_daily_count INTEGER;
    v_reset_at TIMESTAMPTZ;
    v_credits INTEGER;
    v_last_chat TIMESTAMPTZ;
BEGIN
    SELECT subscription_plan,
           COALESCE(monthly_chat_count, 0),
           COALESCE(daily_chat_count, 0),
           chat_count_reset_at,
           COALESCE(credits_balance, 0),
           last_chat_at
    INTO v_plan, v_monthly_count, v_daily_count, v_reset_at, v_credits, v_last_chat
    FROM profiles
    WHERE id = p_user_id;

    -- Auto-reset daily if stale
    IF COALESCE((SELECT daily_chat_reset_at FROM profiles WHERE id = p_user_id), CURRENT_DATE) < CURRENT_DATE THEN
        UPDATE profiles SET daily_chat_count = 0, daily_chat_reset_at = CURRENT_DATE WHERE id = p_user_id;
        v_daily_count := 0;
    END IF;

    -- Auto-reset monthly if stale
    IF v_reset_at IS NULL OR (NOW() - v_reset_at) > INTERVAL '30 days' THEN
        UPDATE profiles SET monthly_chat_count = 0, chat_count_reset_at = NOW() WHERE id = p_user_id;
        v_monthly_count := 0;
        v_reset_at := NOW();
    END IF;

    RETURN json_build_object(
        'plan', COALESCE(v_plan, 'free'),
        'monthly_used', v_monthly_count,
        'monthly_limit', CASE COALESCE(v_plan, 'free')
            WHEN 'free' THEN 5
            ELSE -1
        END,
        'daily_used', v_daily_count,
        'daily_limit', CASE COALESCE(v_plan, 'free')
            WHEN 'free' THEN 2
            ELSE -1
        END,
        'credits_balance', v_credits,
        'resets_at', COALESCE(v_reset_at, NOW()) + INTERVAL '30 days',
        'last_chat_at', v_last_chat
    );
END;
$$;

-- Monthly credit grant for Plus/Pro subscribers (call from cron or on login)
CREATE OR REPLACE FUNCTION grant_monthly_credits(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan TEXT;
    v_granted_at TIMESTAMPTZ;
    v_grant_amount INTEGER;
    v_result JSON;
BEGIN
    SELECT subscription_plan, credits_granted_at
    INTO v_plan, v_granted_at
    FROM profiles WHERE id = p_user_id;

    IF v_plan NOT IN ('plus', 'pro') THEN
        RETURN json_build_object('granted', false, 'reason', 'Not a paid subscriber');
    END IF;

    -- Only grant once per 30-day period
    IF v_granted_at IS NOT NULL AND (NOW() - v_granted_at) < INTERVAL '30 days' THEN
        RETURN json_build_object('granted', false, 'reason', 'Already granted this period');
    END IF;

    v_grant_amount := 50; -- PLUS_MONTHLY_CREDITS

    SELECT add_credits(p_user_id, v_grant_amount, 'monthly_grant',
        'Monthly credit grant for ' || v_plan || ' plan') INTO v_result;

    UPDATE profiles SET credits_granted_at = NOW(), credits_monthly_grant = v_grant_amount
    WHERE id = p_user_id;

    RETURN json_build_object('granted', true, 'amount', v_grant_amount, 'result', v_result);
END;
$$;
