-- Arovia.AI Credit System Redesign (v4): 2-Phase Reserve-Capture-Release,
-- Dual-Bucket Balances (subscription vs purchased), Configurable Pricing Matrix,
-- Idempotency Key Deduplication, and No-Cost Clinical Safety Tier.

-- 1. Extend profiles with dual credit buckets
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_credits NUMERIC(10,2) DEFAULT 100,
ADD COLUMN IF NOT EXISTS purchased_credits NUMERIC(10,2) DEFAULT 0;

UPDATE profiles
SET subscription_credits = COALESCE(credits_balance, 100),
    purchased_credits = 0
WHERE subscription_credits IS NULL;

-- 2. Pricing Matrix Table
CREATE TABLE IF NOT EXISTS credit_action_costs (
    action TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    base_cost NUMERIC(10,2) NOT NULL DEFAULT 1.0,
    per_1k_tokens NUMERIC(10,4) NOT NULL DEFAULT 0.0,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (action, plan)
);

ALTER TABLE credit_action_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read on credit action costs" ON credit_action_costs;
CREATE POLICY "Public read on credit action costs"
    ON credit_action_costs FOR SELECT
    USING (true);

-- Insert default action costs
INSERT INTO credit_action_costs (action, plan, base_cost, per_1k_tokens) VALUES
    ('standard_chat', 'free', 1.0, 0.0),
    ('standard_chat', 'plus', 0.5, 0.0),
    ('standard_chat', 'pro', 0.0, 0.0),
    ('rag_query', 'free', 3.0, 0.0),
    ('rag_query', 'plus', 1.5, 0.0),
    ('rag_query', 'pro', 0.0, 0.0),
    ('lab_report_analysis', 'free', 10.0, 0.0),
    ('lab_report_analysis', 'plus', 5.0, 0.0),
    ('lab_report_analysis', 'pro', 0.0, 0.0),
    ('deep_document_analysis', 'free', 20.0, 0.0),
    ('deep_document_analysis', 'plus', 10.0, 0.0),
    ('deep_document_analysis', 'pro', 0.0, 0.0),
    ('tier3_llm_query', 'free', 15.0, 0.0),
    ('tier3_llm_query', 'plus', 7.0, 0.0),
    ('tier3_llm_query', 'pro', 0.0, 0.0),
    ('safety_triage', 'free', 0.0, 0.0),
    ('safety_triage', 'plus', 0.0, 0.0),
    ('safety_triage', 'pro', 0.0, 0.0)
ON CONFLICT (action, plan) DO UPDATE
SET base_cost = EXCLUDED.base_cost,
    per_1k_tokens = EXCLUDED.per_1k_tokens;

-- 3. Credit Holds & Idempotency Table
CREATE TABLE IF NOT EXISTS credit_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    idempotency_key TEXT,
    reserved_amount NUMERIC(10,2) NOT NULL,
    captured_amount NUMERIC(10,2),
    status TEXT NOT NULL CHECK (status IN ('reserved', 'captured', 'released', 'expired')),
    sub_drawn NUMERIC(10,2) NOT NULL DEFAULT 0,
    pur_drawn NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_reservations_idempotency
ON credit_reservations(user_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_credit_reservations_user_status
ON credit_reservations(user_id, status);

ALTER TABLE credit_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own credit reservations" ON credit_reservations;
CREATE POLICY "Users can read own credit reservations"
    ON credit_reservations FOR SELECT
    USING (auth.uid() = user_id);

-- 4. Updated Daily Regeneration Function for Dual Buckets
CREATE OR REPLACE FUNCTION regenerate_healio_credits(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan TEXT;
    v_sub_balance NUMERIC(10,2);
    v_pur_balance NUMERIC(10,2);
    v_last TIMESTAMPTZ;
    v_grant NUMERIC(10,2);
    v_cap NUMERIC(10,2);
    v_new_sub NUMERIC(10,2);
    v_delta NUMERIC(10,2);
    v_total_balance NUMERIC(10,2);
BEGIN
    SELECT COALESCE(credits_plan, subscription_plan, 'free'),
           COALESCE(subscription_credits, credits_balance, 0),
           COALESCE(purchased_credits, 0),
           credits_regenerated_at
    INTO v_plan, v_sub_balance, v_pur_balance, v_last
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_plan = 'pro' THEN
        RETURN json_build_object('regenerated', false, 'plan', v_plan, 'reason', 'pro_unlimited');
    END IF;

    IF v_last IS NOT NULL AND v_last::date >= CURRENT_DATE THEN
        RETURN json_build_object('regenerated', false, 'plan', v_plan, 'reason', 'already_regenerated_today');
    END IF;

    v_grant := CASE v_plan WHEN 'plus' THEN 50 ELSE 10 END;
    v_cap := CASE v_plan WHEN 'plus' THEN 500 ELSE 100 END;
    v_new_sub := LEAST(v_sub_balance + v_grant, v_cap);
    v_delta := v_new_sub - v_sub_balance;
    v_total_balance := v_new_sub + v_pur_balance;

    UPDATE profiles
    SET subscription_credits = v_new_sub,
        purchased_credits = v_pur_balance,
        credits_balance = v_total_balance,
        credits_regenerated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    IF v_delta > 0 THEN
        INSERT INTO credit_transactions (user_id, amount, delta, balance_after, action, reason, description)
        VALUES (p_user_id, v_delta, v_delta, v_total_balance, 'daily_regen', 'daily_regen',
                'Daily credit regeneration');
    END IF;

    RETURN json_build_object('regenerated', v_delta > 0, 'amount', v_delta, 'balance', v_total_balance, 'plan', v_plan);
END;
$$;

-- 5. Reserve Credits Function (Phase 1 Hold)
CREATE OR REPLACE FUNCTION reserve_arovia_credits(
    p_user_id UUID,
    p_action TEXT,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing RECORD;
    v_plan TEXT;
    v_sub_balance NUMERIC(10,2);
    v_pur_balance NUMERIC(10,2);
    v_total_balance NUMERIC(10,2);
    v_cost NUMERIC(10,2);
    v_sub_drawn NUMERIC(10,2) := 0;
    v_pur_drawn NUMERIC(10,2) := 0;
    v_new_sub NUMERIC(10,2);
    v_new_pur NUMERIC(10,2);
    v_reservation_id UUID;
BEGIN
    -- 1. Idempotency Check
    IF p_idempotency_key IS NOT NULL THEN
        SELECT * INTO v_existing
        FROM credit_reservations
        WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;

        IF FOUND THEN
            RETURN json_build_object(
                'success', true,
                'reservation_id', v_existing.id,
                'status', v_existing.status,
                'held_amount', v_existing.reserved_amount,
                'idempotency_hit', true
            );
        END IF;
    END IF;

    -- 2. Regenerate Daily Credits
    PERFORM regenerate_healio_credits(p_user_id);

    -- 3. Lock Profile
    SELECT COALESCE(credits_plan, subscription_plan, 'free'),
           COALESCE(subscription_credits, 0),
           COALESCE(purchased_credits, 0)
    INTO v_plan, v_sub_balance, v_pur_balance
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

    v_total_balance := v_sub_balance + v_pur_balance;

    -- 4. Clinical Safety Tier Bypass or Pro Tier Free
    IF p_action = 'safety_triage' OR v_plan = 'pro' THEN
        INSERT INTO credit_reservations (user_id, action, idempotency_key, reserved_amount, captured_amount, status, sub_drawn, pur_drawn)
        VALUES (p_user_id, p_action, p_idempotency_key, 0, 0, 'captured', 0, 0)
        RETURNING id INTO v_reservation_id;

        RETURN json_build_object(
            'success', true,
            'reservation_id', v_reservation_id,
            'held_amount', 0,
            'balance_after', v_total_balance,
            'plan', v_plan,
            'bypassed', true
        );
    END IF;

    -- 5. Cost Lookup from Matrix
    SELECT base_cost INTO v_cost
    FROM credit_action_costs
    WHERE action = p_action AND plan = v_plan;

    IF v_cost IS NULL THEN
        -- Fallback default cost lookup
        v_cost := CASE p_action
            WHEN 'standard_chat' THEN 1.0
            WHEN 'rag_query' THEN 3.0
            WHEN 'lab_report_analysis' THEN 10.0
            WHEN 'deep_document_analysis' THEN 20.0
            WHEN 'tier3_llm_query' THEN 15.0
            ELSE 1.0
        END;
    END IF;

    IF v_total_balance < v_cost THEN
        RETURN json_build_object(
            'success', false,
            'error', 'insufficient_credits',
            'required', v_cost,
            'balance', v_total_balance,
            'plan', v_plan
        );
    END IF;

    -- 6. Draw Hold from Sub Bucket first, then Purchased Bucket
    IF v_sub_balance >= v_cost THEN
        v_sub_drawn := v_cost;
        v_pur_drawn := 0;
    ELSE
        v_sub_drawn := v_sub_balance;
        v_pur_drawn := v_cost - v_sub_balance;
    END IF;

    v_new_sub := v_sub_balance - v_sub_drawn;
    v_new_pur := v_pur_balance - v_pur_drawn;

    UPDATE profiles
    SET subscription_credits = v_new_sub,
        purchased_credits = v_new_pur,
        credits_balance = v_new_sub + v_new_pur,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 7. Create Reservation Record
    INSERT INTO credit_reservations (user_id, action, idempotency_key, reserved_amount, status, sub_drawn, pur_drawn)
    VALUES (p_user_id, p_action, p_idempotency_key, v_cost, 'reserved', v_sub_drawn, v_pur_drawn)
    RETURNING id INTO v_reservation_id;

    RETURN json_build_object(
        'success', true,
        'reservation_id', v_reservation_id,
        'held_amount', v_cost,
        'balance_after', v_new_sub + v_new_pur,
        'plan', v_plan
    );
END;
$$;

-- 6. Capture Credits Function (Phase 2 Success)
CREATE OR REPLACE FUNCTION capture_arovia_credits(
    p_reservation_id UUID,
    p_token_count INT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_res RECORD;
    v_per_1k NUMERIC(10,4);
    v_final_cost NUMERIC(10,2);
    v_refund NUMERIC(10,2) := 0;
    v_user_plan TEXT;
    v_sub_bal NUMERIC(10,2);
    v_pur_bal NUMERIC(10,2);
    v_total_bal NUMERIC(10,2);
BEGIN
    SELECT * INTO v_res
    FROM credit_reservations
    WHERE id = p_reservation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'reservation_not_found');
    END IF;

    IF v_res.status = 'captured' THEN
        RETURN json_build_object('success', true, 'status', 'already_captured', 'captured_amount', v_res.captured_amount);
    END IF;

    IF v_res.status != 'reserved' THEN
        RETURN json_build_object('success', false, 'error', 'invalid_reservation_status', 'status', v_res.status);
    END IF;

    -- Look up token pricing if applicable
    v_final_cost := v_res.reserved_amount;

    IF p_token_count IS NOT NULL AND p_token_count > 0 THEN
        SELECT COALESCE(credits_plan, subscription_plan, 'free') INTO v_user_plan
        FROM profiles WHERE id = v_res.user_id;

        SELECT per_1k_tokens INTO v_per_1k
        FROM credit_action_costs
        WHERE action = v_res.action AND plan = v_user_plan;

        IF v_per_1k IS NOT NULL AND v_per_1k > 0 THEN
            v_final_cost := ROUND(v_res.reserved_amount + ((p_token_count / 1000.0) * v_per_1k), 2);
        END IF;
    END IF;

    -- Adjust refund if final_cost < reserved_amount
    IF v_final_cost < v_res.reserved_amount THEN
        v_refund := v_res.reserved_amount - v_final_cost;

        SELECT COALESCE(subscription_credits, 0), COALESCE(purchased_credits, 0)
        INTO v_sub_bal, v_pur_bal
        FROM profiles WHERE id = v_res.user_id FOR UPDATE;

        -- Return refund to purchased first if drawn from purchased, else subscription
        IF v_res.pur_drawn > 0 THEN
            v_pur_bal := v_pur_bal + LEAST(v_refund, v_res.pur_drawn);
            v_sub_bal := v_sub_bal + GREATEST(0, v_refund - v_res.pur_drawn);
        ELSE
            v_sub_bal := v_sub_bal + v_refund;
        END IF;

        v_total_bal := v_sub_bal + v_pur_bal;

        UPDATE profiles
        SET subscription_credits = v_sub_bal,
            purchased_credits = v_pur_bal,
            credits_balance = v_total_bal,
            updated_at = NOW()
        WHERE id = v_res.user_id;
    ELSE
        SELECT COALESCE(subscription_credits, 0) + COALESCE(purchased_credits, 0) INTO v_total_bal
        FROM profiles WHERE id = v_res.user_id;
    END IF;

    UPDATE credit_reservations
    SET captured_amount = v_final_cost,
        status = 'captured',
        updated_at = NOW()
    WHERE id = p_reservation_id;

    IF v_final_cost > 0 THEN
        INSERT INTO credit_transactions (user_id, amount, delta, balance_after, action, reason, description)
        VALUES (v_res.user_id, -v_final_cost, -v_final_cost, v_total_bal, v_res.action, 'captured',
                'Captured ' || v_final_cost || ' credits for ' || v_res.action);
    END IF;

    RETURN json_build_object('success', true, 'captured_amount', v_final_cost, 'balance_after', v_total_bal);
END;
$$;

-- 7. Release Credits Function (Phase 2 Error/Timeout Refund)
CREATE OR REPLACE FUNCTION release_arovia_credits(
    p_reservation_id UUID,
    p_reason TEXT DEFAULT 'request_failed'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_res RECORD;
    v_sub_bal NUMERIC(10,2);
    v_pur_bal NUMERIC(10,2);
    v_total_bal NUMERIC(10,2);
BEGIN
    SELECT * INTO v_res
    FROM credit_reservations
    WHERE id = p_reservation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'reservation_not_found');
    END IF;

    IF v_res.status = 'released' THEN
        RETURN json_build_object('success', true, 'status', 'already_released');
    END IF;

    IF v_res.status != 'reserved' THEN
        RETURN json_build_object('success', false, 'error', 'cannot_release_status', 'status', v_res.status);
    END IF;

    IF v_res.reserved_amount > 0 THEN
        SELECT COALESCE(subscription_credits, 0), COALESCE(purchased_credits, 0)
        INTO v_sub_bal, v_pur_bal
        FROM profiles WHERE id = v_res.user_id FOR UPDATE;

        v_sub_bal := v_sub_bal + v_res.sub_drawn;
        v_pur_bal := v_pur_bal + v_res.pur_drawn;
        v_total_bal := v_sub_bal + v_pur_bal;

        UPDATE profiles
        SET subscription_credits = v_sub_bal,
            purchased_credits = v_pur_bal,
            credits_balance = v_total_bal,
            updated_at = NOW()
        WHERE id = v_res.user_id;

        INSERT INTO credit_transactions (user_id, amount, delta, balance_after, action, reason, description)
        VALUES (v_res.user_id, v_res.reserved_amount, v_res.reserved_amount, v_total_bal, 'refund', p_reason,
                'Released hold of ' || v_res.reserved_amount || ' credits for ' || v_res.action || ' (' || p_reason || ')');
    ELSE
        SELECT COALESCE(subscription_credits, 0) + COALESCE(purchased_credits, 0) INTO v_total_bal
        FROM profiles WHERE id = v_res.user_id;
    END IF;

    UPDATE credit_reservations
    SET status = 'released',
        updated_at = NOW()
    WHERE id = p_reservation_id;

    RETURN json_build_object('success', true, 'released_amount', v_res.reserved_amount, 'balance_after', v_total_bal);
END;
$$;
