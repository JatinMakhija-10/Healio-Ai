-- ── Migration: Clinical Profile Demographics ─────────────────────────────────
-- Date: 2026-08-13
-- Author: Healio.AI Engineering
-- Audit Ref: Forensic Audit §10, Section 16 (Item 1)
--
-- Description:
--   Establishes explicit, server-authoritative clinical demographic columns
--   on the `profiles` table.
--   Prevents implicit defaulting and separates biological sexAtBirth from
--   display genderIdentity and derived pregnancy capability.

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS sex_at_birth TEXT CHECK (sex_at_birth IN ('male', 'female', 'intersex', 'unknown')) DEFAULT 'unknown',
    ADD COLUMN IF NOT EXISTS gender_identity TEXT,
    ADD COLUMN IF NOT EXISTS pregnancy_capable TEXT CHECK (pregnancy_capable IN ('capable', 'not_applicable', 'unknown')) DEFAULT 'unknown',
    ADD COLUMN IF NOT EXISTS pregnancy_status TEXT CHECK (pregnancy_status IN ('pregnant', 'not_pregnant', 'unknown')) DEFAULT 'unknown',
    ADD COLUMN IF NOT EXISTS age_years INTEGER CHECK (age_years IS NULL OR (age_years >= 0 AND age_years <= 120));

-- Index for demographic queries & analytics
CREATE INDEX IF NOT EXISTS idx_profiles_clinical_demographics
    ON profiles (sex_at_birth, pregnancy_capable);

-- Function to derive default pregnancy_capable when sex_at_birth is updated
CREATE OR REPLACE FUNCTION derive_profile_pregnancy_capacity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sex_at_birth = 'male' THEN
        NEW.pregnancy_capable := 'not_applicable';
        NEW.pregnancy_status := 'not_pregnant';
    ELSIF NEW.sex_at_birth = 'female' AND (NEW.pregnancy_capable IS NULL OR NEW.pregnancy_capable = 'unknown') THEN
        IF NEW.age_years IS NOT NULL AND (NEW.age_years < 11 OR NEW.age_years > 55) THEN
            NEW.pregnancy_capable := 'not_applicable';
        ELSE
            NEW.pregnancy_capable := 'capable';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_derive_pregnancy_capacity ON profiles;
CREATE TRIGGER trg_derive_pregnancy_capacity
    BEFORE INSERT OR UPDATE OF sex_at_birth, age_years ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION derive_profile_pregnancy_capacity();
