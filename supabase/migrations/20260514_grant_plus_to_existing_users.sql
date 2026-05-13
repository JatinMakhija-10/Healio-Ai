-- Grant Healio Plus to all existing users + initial 50 credit grant
-- Run AFTER 20260514_credits_and_usage_rebalance.sql

BEGIN;

-- 1. Upgrade every existing profile to Healio Plus
UPDATE profiles
SET subscription_plan = 'plus',
    credits_balance = COALESCE(credits_balance, 0) + 50,
    credits_monthly_grant = 50,
    credits_granted_at = NOW(),
    updated_at = NOW()
WHERE subscription_plan IS DISTINCT FROM 'pro';  -- don't downgrade any Pro users

-- 2. Log the credit grant in the ledger for audit trail
INSERT INTO credit_transactions (user_id, amount, balance_after, action, description)
SELECT
    id,
    50,
    COALESCE(credits_balance, 0),   -- balance_after already includes the +50 from step 1
    'monthly_grant',
    'Initial Healio Plus grant for existing user'
FROM profiles
WHERE subscription_plan = 'plus';

COMMIT;
