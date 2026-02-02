-- FIX Missing RLS Policies for Booking
-- The 'appointments' table was missing an INSERT policy for patients

-- 1. Allow patients to book appointments
DROP POLICY IF EXISTS "Patients can book appointments" ON appointments;
CREATE POLICY "Patients can book appointments"
    ON appointments FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

-- 2. Allow doctors to book appointments (optional, for manual scheduling)
DROP POLICY IF EXISTS "Doctors can book appointments" ON appointments;
CREATE POLICY "Doctors can book appointments"
    ON appointments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM doctors
            WHERE doctors.id = appointments.doctor_id
            AND doctors.user_id = auth.uid()
        )
    );

-- 3. Verify the policies
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'appointments';
