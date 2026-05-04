-- Healio Pro tier rules
-- Enforces the same tier logic used by the app at the database boundary.

CREATE OR REPLACE FUNCTION increment_chat_count(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan TEXT;
    v_count INTEGER;
    v_reset_at TIMESTAMPTZ;
    v_limit INTEGER;
BEGIN
    SELECT
        COALESCE(subscription_plan, 'free'),
        COALESCE(monthly_chat_count, 0),
        COALESCE(chat_count_reset_at, NOW())
    INTO v_plan, v_count, v_reset_at
    FROM profiles
    WHERE id = p_user_id;

    IF v_plan IS NULL THEN
        v_plan := 'free';
        v_count := 0;
        v_reset_at := NOW();
    END IF;

    IF v_reset_at IS NULL OR (NOW() - v_reset_at) > INTERVAL '30 days' THEN
        UPDATE profiles
        SET monthly_chat_count = 0, chat_count_reset_at = NOW()
        WHERE id = p_user_id;
        v_count := 0;
        v_reset_at := NOW();
    END IF;

    v_limit := CASE v_plan
        WHEN 'plus' THEN -1
        WHEN 'pro' THEN -1
        ELSE 10
    END;

    IF v_limit > 0 AND v_count >= v_limit THEN
        RETURN json_build_object(
            'allowed', false,
            'current_count', v_count,
            'limit', v_limit,
            'plan', v_plan,
            'resets_at', v_reset_at + INTERVAL '30 days'
        );
    END IF;

    UPDATE profiles
    SET monthly_chat_count = COALESCE(monthly_chat_count, 0) + 1, updated_at = NOW()
    WHERE id = p_user_id;

    RETURN json_build_object(
        'allowed', true,
        'current_count', v_count + 1,
        'limit', v_limit,
        'plan', v_plan,
        'resets_at', v_reset_at + INTERVAL '30 days'
    );
END;
$$;

CREATE OR REPLACE FUNCTION calculate_invoice_amounts()
RETURNS TRIGGER AS $$
DECLARE
    v_subscription_plan TEXT;
BEGIN
    SELECT COALESCE(p.subscription_plan, 'free')
    INTO v_subscription_plan
    FROM doctors d
    JOIN profiles p ON p.id = d.user_id
    WHERE d.id = NEW.doctor_id;

    IF v_subscription_plan = 'pro' THEN
        NEW.platform_fee_percentage := 0;
    ELSIF NEW.platform_fee_percentage IS NULL THEN
        NEW.platform_fee_percentage := 20.00;
    END IF;

    NEW.platform_fee := (NEW.consultation_fee * NEW.platform_fee_percentage / 100);
    NEW.doctor_payout := NEW.consultation_fee - NEW.platform_fee;
    NEW.total_amount := NEW.consultation_fee;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
