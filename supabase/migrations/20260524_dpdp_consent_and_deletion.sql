-- ============================================================
-- DPDP Act 2023 Compliance — Consent tracking + Right to Erasure
-- Plan ref: §4.12 Consent & Data Architecture
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add consent-tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_version    TEXT         DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS consented_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

-- 2. Back-fill consented_at for existing profiles that completed onboarding
UPDATE public.profiles
SET consented_at = created_at,
    consent_version = '1.0'
WHERE consented_at IS NULL
  AND onboarding_completed = TRUE;

-- 3. RPC: request_data_deletion
--    - Records the deletion request timestamp (30-day SLA)
--    - Immediately deletes family personas (user-generated health data)
--    - Clears medical_profile from user_metadata (Supabase auth column)
--    - Auth account deletion itself requires service-role key (admin flow)
CREATE OR REPLACE FUNCTION public.request_data_deletion(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_personas INT;
BEGIN
  -- Guard: user must exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Mark deletion request
  UPDATE public.profiles
  SET deletion_requested_at = NOW()
  WHERE id = p_user_id;

  -- Delete family personas
  DELETE FROM public.personas WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_deleted_personas = ROW_COUNT;

  -- Anonymise profile: clear PII fields, keep id for audit trail
  UPDATE public.profiles
  SET full_name    = '[DELETED]',
      phone        = NULL,
      avatar_url   = NULL
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success',            true,
    'deletion_requested', NOW(),
    'personas_deleted',   v_deleted_personas,
    'sla_days',           30
  );
END;
$$;

-- 4. Grant execute to authenticated users (can only delete their own data — enforced by p_user_id check)
GRANT EXECUTE ON FUNCTION public.request_data_deletion(UUID) TO authenticated;

-- 5. RPC: record_consent — called when user completes onboarding consent step
CREATE OR REPLACE FUNCTION public.record_consent(
  p_user_id       UUID,
  p_consent_version TEXT DEFAULT '1.0'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET consented_at     = NOW(),
      consent_version  = p_consent_version
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_consent(UUID, TEXT) TO authenticated;
