-- Healio credits v3: prompt-aligned daily regeneration, atomic consumption,
-- compatible ledger aliases, and LLM request attribution.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS credits_plan TEXT DEFAULT 'free'
    CHECK (credits_plan IN ('free', 'plus', 'pro')),
ADD COLUMN IF NOT EXISTS credits_regenerated_at TIMESTAMPTZ;

ALTER TABLE profiles
ALTER COLUMN credits_balance TYPE NUMERIC(10,2)
USING COALESCE(credits_balance, 0)::NUMERIC(10,2);

ALTER TABLE profiles
ALTER COLUMN credits_balance SET DEFAULT 100;

UPDATE profiles
SET credits_plan = COALESCE(subscription_plan, credits_plan, 'free'),
    credits_balance = CASE
        WHEN COALESCE(credits_balance, 0) = 0 THEN 100
        ELSE credits_balance
    END
WHERE credits_plan IS NULL OR credits_balance IS NULL OR credits_balance = 0;

ALTER TABLE credit_transactions
ALTER COLUMN amount TYPE NUMERIC(10,2)
USING amount::NUMERIC(10,2);

ALTER TABLE credit_transactions
ALTER COLUMN balance_after TYPE NUMERIC(10,2)
USING balance_after::NUMERIC(10,2);

ALTER TABLE credit_transactions
ADD COLUMN IF NOT EXISTS delta NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS reason TEXT;

UPDATE credit_transactions
SET delta = COALESCE(delta, amount),
    reason = COALESCE(reason, action)
WHERE delta IS NULL OR reason IS NULL;

ALTER TABLE credit_transactions
DROP CONSTRAINT IF EXISTS credit_transactions_action_check;

ALTER TABLE credit_transactions
ADD CONSTRAINT credit_transactions_action_check
CHECK (action IN (
    'monthly_grant', 'daily_regen', 'top_up', 'purchase',
    'standard_chat', 'rag_query', 'lab_report_analysis',
    'deep_document_analysis', 'tier3_llm_query',
    'consultation', 'pdf_report', 'priority_booking',
    'wellness_snapshot', 'specialist_opinion', 'family_consult',
    'video_consult', 'refund', 'admin_adjust', 'rollover_expired'
));

CREATE TABLE IF NOT EXISTS llm_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    intent TEXT,
    credit_action TEXT,
    latency_ms INTEGER,
    token_count INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_requests_user_created
ON llm_requests(user_id, created_at DESC);

ALTER TABLE llm_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own llm requests" ON llm_requests;
CREATE POLICY "Users can read own llm requests"
    ON llm_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION healio_credit_cost(p_action TEXT, p_plan TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF p_plan = 'pro' THEN
        RETURN 0;
    END IF;

    RETURN CASE p_action
        WHEN 'standard_chat' THEN CASE WHEN p_plan = 'plus' THEN 0.5 ELSE 1 END
        WHEN 'rag_query' THEN CASE WHEN p_plan = 'plus' THEN 1.5 ELSE 3 END
        WHEN 'lab_report_analysis' THEN CASE WHEN p_plan = 'plus' THEN 5 ELSE 10 END
        WHEN 'deep_document_analysis' THEN CASE WHEN p_plan = 'plus' THEN 10 ELSE 20 END
        WHEN 'tier3_llm_query' THEN CASE WHEN p_plan = 'plus' THEN 7 ELSE 15 END
        ELSE NULL
    END;
END;
$$;

CREATE OR REPLACE FUNCTION regenerate_healio_credits(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan TEXT;
    v_balance NUMERIC(10,2);
    v_last TIMESTAMPTZ;
    v_grant NUMERIC(10,2);
    v_cap NUMERIC(10,2);
    v_new_balance NUMERIC(10,2);
    v_delta NUMERIC(10,2);
BEGIN
    SELECT COALESCE(credits_plan, subscription_plan, 'free'),
           COALESCE(credits_balance, 0),
           credits_regenerated_at
    INTO v_plan, v_balance, v_last
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
    v_new_balance := LEAST(v_balance + v_grant, v_cap);
    v_delta := v_new_balance - v_balance;

    UPDATE profiles
    SET credits_balance = v_new_balance,
        credits_regenerated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    IF v_delta > 0 THEN
        INSERT INTO credit_transactions (user_id, amount, delta, balance_after, action, reason, description)
        VALUES (p_user_id, v_delta, v_delta, v_new_balance, 'daily_regen', 'daily_regen',
                'Daily credit regeneration');
    END IF;

    RETURN json_build_object('regenerated', v_delta > 0, 'amount', v_delta, 'balance', v_new_balance, 'plan', v_plan);
END;
$$;

CREATE OR REPLACE FUNCTION consume_healio_credits(
    p_user_id UUID,
    p_action TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan TEXT;
    v_balance NUMERIC(10,2);
    v_cost NUMERIC(10,2);
    v_new_balance NUMERIC(10,2);
BEGIN
    PERFORM regenerate_healio_credits(p_user_id);

    SELECT COALESCE(credits_plan, subscription_plan, 'free'),
           COALESCE(credits_balance, 0)
    INTO v_plan, v_balance
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_plan = 'pro' THEN
        RETURN json_build_object('success', true, 'plan', v_plan, 'required', 0, 'balance_after', v_balance);
    END IF;

    v_cost := healio_credit_cost(p_action, v_plan);
    IF v_cost IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'unknown_action', 'action', p_action);
    END IF;

    IF v_balance < v_cost THEN
        RETURN json_build_object(
            'success', false,
            'error', 'insufficient_credits',
            'required', v_cost,
            'balance', v_balance,
            'plan', v_plan
        );
    END IF;

    v_new_balance := v_balance - v_cost;

    UPDATE profiles
    SET credits_balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO credit_transactions (user_id, amount, delta, balance_after, action, reason, description)
    VALUES (p_user_id, -v_cost, -v_cost, v_new_balance, p_action, p_action,
            'Consumed ' || v_cost || ' Healio credits for ' || p_action);

    RETURN json_build_object(
        'success', true,
        'required', v_cost,
        'balance_after', v_new_balance,
        'plan', v_plan,
        'low_credits', v_new_balance < 10
    );
END;
$$;
