-- ============================================================================
-- Admin User Management
-- ----------------------------------------------------------------------------
-- Adds suspension columns to `profiles` so the admin panel can
-- soft-suspend users without deleting their data. Auth ban is handled
-- separately via supabase.auth.admin.updateUserById in the API layer.
-- ============================================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_suspended       BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS suspended_at       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS suspended_reason   TEXT,
    ADD COLUMN IF NOT EXISTS suspended_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Speed up "list suspended users" / "filter active users" queries
CREATE INDEX IF NOT EXISTS profiles_is_suspended_idx
    ON public.profiles (is_suspended)
    WHERE is_suspended = TRUE;

-- ----------------------------------------------------------------------------
-- RLS: only admins can write the suspension columns; everyone reads as today.
-- We add a dedicated policy alongside the existing user-self-update policy.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can update suspension status" ON public.profiles;
CREATE POLICY "Admins can update suspension status"
    ON public.profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

COMMENT ON COLUMN public.profiles.is_suspended      IS 'TRUE if the account is suspended by an admin. Login is also blocked at the auth level via banned_until.';
COMMENT ON COLUMN public.profiles.suspended_at      IS 'Timestamp the account was last suspended.';
COMMENT ON COLUMN public.profiles.suspended_reason  IS 'Human-readable reason shown to admins (and optionally to the user).';
COMMENT ON COLUMN public.profiles.suspended_by      IS 'Admin user that performed the suspension.';
