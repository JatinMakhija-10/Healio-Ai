-- Migration: Add subscription and usage tracking to profiles
-- Run in Supabase SQL Editor

-- Add subscription columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'plus', 'pro')),
ADD COLUMN IF NOT EXISTS monthly_chat_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS chat_count_reset_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for quick subscription lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_plan);

-- RPC function to increment chat count and check limits atomically
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
    -- Get current user data
    SELECT subscription_plan, monthly_chat_count, chat_count_reset_at
    INTO v_plan, v_count, v_reset_at
    FROM profiles
    WHERE id = p_user_id;
    
    -- Auto-reset if more than 30 days since last reset
    IF v_reset_at IS NULL OR (NOW() - v_reset_at) > INTERVAL '30 days' THEN
        UPDATE profiles 
        SET monthly_chat_count = 0, chat_count_reset_at = NOW()
        WHERE id = p_user_id;
        v_count := 0;
    END IF;
    
    -- Determine limit based on plan
    v_limit := CASE v_plan
        WHEN 'free' THEN 10
        WHEN 'plus' THEN -1  -- unlimited
        WHEN 'pro' THEN -1   -- unlimited
        ELSE 10
    END;
    
    -- Check limit (skip for unlimited plans)
    IF v_limit > 0 AND v_count >= v_limit THEN
        RETURN json_build_object(
            'allowed', false,
            'current_count', v_count,
            'limit', v_limit,
            'plan', v_plan,
            'resets_at', v_reset_at + INTERVAL '30 days'
        );
    END IF;
    
    -- Increment count
    UPDATE profiles 
    SET monthly_chat_count = monthly_chat_count + 1, updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN json_build_object(
        'allowed', true,
        'current_count', v_count + 1,
        'limit', v_limit,
        'plan', v_plan
    );
END;
$$;
