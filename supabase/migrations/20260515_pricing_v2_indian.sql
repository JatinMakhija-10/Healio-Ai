-- Migration: Pricing v2 — Aggressive India-market tiers
-- Rebalances Free/Plus/Pro limits, adds billing_cycle, credit rollover, expanded credit actions.
-- Run AFTER 20260514_credits_and_usage_rebalance.sql.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Add billing cycle + rollover columns
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'month'
    CHECK (billing_cycle IN ('month', 'year')),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_renews_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS credits_rollover_cap INTEGER DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Expand credit_transactions action whitelist
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE credit_transactions
DROP CONSTRAINT IF EXISTS credit_transactions_action_check;

ALTER TABLE credit_transactions
ADD CONSTRAINT credit_transactions_action_check
CHECK (action IN (
    'monthly_grant', 'top_up', 'consultation', 'pdf_report',
    'priority_booking', 'wellness_snapshot', 'specialist_opinion',
    'family_consult', 'lab_report_analysis', 'video_consult',
    'refund', 'admin_adjust', 'rollover_expired'
));

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Rebalanced increment_chat_count — v2 limits (Free: 15/mo, 4/day, 60s)
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

    -- v2 LIMITS
    v_monthly_limit := CASE v_plan
        WHEN 'free' THEN 15
        WHEN 'plus' THEN -1
        WHEN 'pro'  THEN -1
        ELSE 15
    END;

    v_daily_limit := CASE v_plan
        WHEN 'free' THEN 4
        WHEN 'plus' THEN -1
        WHEN 'pro'  THEN -1
        ELSE 4
    END;

    v_cooldown := CASE v_plan
        WHEN 'free' THEN 60
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

    -- Daily limit check — try credits fallback
    IF v_daily_limit > 0 AND v_daily_count >= v_daily_limit THEN
        IF v_credits >= 1 THEN
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
                'allowed', true, 'used_credit', true,
                'credits_remaining', v_credits - 1,
                'current_count', v_monthly_count + 1,
                'daily_count', v_daily_count + 1,
                'plan', v_plan
            );
        END IF;

        RETURN json_build_object(
            'allowed', false, 'code', 'DAILY_LIMIT',
            'daily_count', v_daily_count, 'daily_limit', v_daily_limit,
            'credits_balance', v_credits, 'plan', v_plan
        );
    END IF;

    -- Monthly limit check — try credits fallback
    IF v_monthly_limit > 0 AND v_monthly_count >= v_monthly_limit THEN
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
                'allowed', true, 'used_credit', true,
                'credits_remaining', v_credits - 1,
                'current_count', v_monthly_count + 1,
                'plan', v_plan
            );
        END IF;

        RETURN json_build_object(
            'allowed', false, 'code', 'MONTHLY_LIMIT',
            'current_count', v_monthly_count, 'limit', v_monthly_limit,
            'credits_balance', v_credits, 'plan', v_plan,
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
        'allowed', true, 'used_credit', false,
        'current_count', v_monthly_count + 1,
        'daily_count', v_daily_count + 1,
        'limit', v_monthly_limit, 'daily_limit', v_daily_limit,
        'credits_balance', v_credits, 'plan', v_plan
    );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Refreshed get_usage_summary with v2 limits
-- ═══════════════════════════════════════════════════════════════════════════════
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
    v_billing_cycle TEXT;
    v_renews_at TIMESTAMPTZ;
BEGIN
    SELECT subscription_plan,
           COALESCE(monthly_chat_count, 0),
           COALESCE(daily_chat_count, 0),
           chat_count_reset_at,
           COALESCE(credits_balance, 0),
           last_chat_at,
           COALESCE(billing_cycle, 'month'),
           subscription_renews_at
    INTO v_plan, v_monthly_count, v_daily_count, v_reset_at,
         v_credits, v_last_chat, v_billing_cycle, v_renews_at
    FROM profiles
    WHERE id = p_user_id;

    IF COALESCE((SELECT daily_chat_reset_at FROM profiles WHERE id = p_user_id), CURRENT_DATE) < CURRENT_DATE THEN
        UPDATE profiles SET daily_chat_count = 0, daily_chat_reset_at = CURRENT_DATE WHERE id = p_user_id;
        v_daily_count := 0;
    END IF;

    IF v_reset_at IS NULL OR (NOW() - v_reset_at) > INTERVAL '30 days' THEN
        UPDATE profiles SET monthly_chat_count = 0, chat_count_reset_at = NOW() WHERE id = p_user_id;
        v_monthly_count := 0;
        v_reset_at := NOW();
    END IF;

    RETURN json_build_object(
        'plan', COALESCE(v_plan, 'free'),
        'billing_cycle', v_billing_cycle,
        'monthly_used', v_monthly_count,
        'monthly_limit', CASE COALESCE(v_plan, 'free')
            WHEN 'free' THEN 15
            ELSE -1
        END,
        'daily_used', v_daily_count,
        'daily_limit', CASE COALESCE(v_plan, 'free')
            WHEN 'free' THEN 4
            ELSE -1
        END,
        'credits_balance', v_credits,
        'resets_at', COALESCE(v_reset_at, NOW()) + INTERVAL '30 days',
        'renews_at', v_renews_at,
        'last_chat_at', v_last_chat
    );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. Plan-aware monthly credit grant (Plus=40, Pro=120) with rollover cap
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION grant_monthly_credits(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan TEXT;
    v_granted_at TIMESTAMPTZ;
    v_current_balance INTEGER;
    v_grant_amount INTEGER;
    v_rollover_cap INTEGER;
    v_target_balance INTEGER;
    v_actual_grant INTEGER;
    v_new_balance INTEGER;
BEGIN
    SELECT subscription_plan, credits_granted_at, COALESCE(credits_balance, 0)
    INTO v_plan, v_granted_at, v_current_balance
    FROM profiles WHERE id = p_user_id;

    IF v_plan NOT IN ('plus', 'pro') THEN
        RETURN json_build_object('granted', false, 'reason', 'Not a paid subscriber');
    END IF;

    IF v_granted_at IS NOT NULL AND (NOW() - v_granted_at) < INTERVAL '30 days' THEN
        RETURN json_build_object('granted', false, 'reason', 'Already granted this period');
    END IF;

    -- Plan-specific grant + rollover cap
    IF v_plan = 'plus' THEN
        v_grant_amount := 40;
        v_rollover_cap := 120;
    ELSE -- 'pro'
        v_grant_amount := 120;
        v_rollover_cap := 360;
    END IF;

    -- Enforce rollover cap: balance after grant cannot exceed cap
    v_target_balance := LEAST(v_current_balance + v_grant_amount, v_rollover_cap);
    v_actual_grant := v_target_balance - v_current_balance;

    IF v_actual_grant <= 0 THEN
        UPDATE profiles SET credits_granted_at = NOW(), credits_monthly_grant = v_grant_amount,
                            credits_rollover_cap = v_rollover_cap
        WHERE id = p_user_id;
        RETURN json_build_object('granted', false, 'reason', 'Rollover cap reached',
                                 'balance', v_current_balance, 'cap', v_rollover_cap);
    END IF;

    UPDATE profiles
    SET credits_balance = v_target_balance,
        credits_granted_at = NOW(),
        credits_monthly_grant = v_grant_amount,
        credits_rollover_cap = v_rollover_cap,
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING credits_balance INTO v_new_balance;

    INSERT INTO credit_transactions (user_id, amount, balance_after, action, description)
    VALUES (p_user_id, v_actual_grant, v_new_balance, 'monthly_grant',
            'Monthly grant (' || v_plan || ') — ' || v_actual_grant || ' of ' || v_grant_amount ||
            ' added (cap: ' || v_rollover_cap || ')');

    RETURN json_build_object(
        'granted', true,
        'amount_granted', v_actual_grant,
        'amount_eligible', v_grant_amount,
        'new_balance', v_new_balance,
        'rollover_cap', v_rollover_cap
    );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. Backfill existing users — set rollover caps based on current plan
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE profiles
SET credits_rollover_cap = CASE subscription_plan
    WHEN 'plus' THEN 120
    WHEN 'pro'  THEN 360
    ELSE 0
END
WHERE credits_rollover_cap IS NULL OR credits_rollover_cap = 0;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. Helper: spend_credits_for_action — looks up cost and spends
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION spend_credits_for_action(
    p_user_id UUID,
    p_action TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cost INTEGER;
BEGIN
    v_cost := CASE p_action
        WHEN 'consultation'         THEN 1
        WHEN 'wellness_snapshot'    THEN 2
        WHEN 'family_consult'       THEN 2
        WHEN 'pdf_report'           THEN 3
        WHEN 'priority_booking'     THEN 5
        WHEN 'specialist_opinion'   THEN 5
        WHEN 'lab_report_analysis'  THEN 10
        WHEN 'video_consult'        THEN 50
        ELSE NULL
    END;

    IF v_cost IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Unknown action: ' || p_action);
    END IF;

    RETURN spend_credits(p_user_id, v_cost, p_action, 'Used ' || v_cost || ' credits for ' || p_action);
END;
$$;
