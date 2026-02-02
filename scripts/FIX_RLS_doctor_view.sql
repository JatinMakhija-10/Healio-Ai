-- FIX RLS Policy for Doctors viewing appointments
-- The previous policy was: USING (auth.uid() = doctor_id)
-- But appointments.doctor_id refers to doctors.id (UUID), NOT auth.users.id
-- So we need to look up the doctor_id for the current auth user

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Doctors can view own appointments" ON appointments;

-- Create the refined policy
CREATE POLICY "Doctors can view own appointments"
    ON appointments FOR SELECT
    USING (
        doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- Also ensure specific update policy is correct
DROP POLICY IF EXISTS "Doctors can update own appointments" ON appointments;

CREATE POLICY "Doctors can update own appointments"
    ON appointments FOR UPDATE
    USING (
        doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );
