-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
-- Creates a database-backed notification system for real-time alerts
-- Replaces client-side only notifications with server-synced events

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'appointment_reminder',
        'new_booking',
        'booking_confirmed',
        'booking_cancelled',
        'patient_message',
        'doctor_message',
        'admin_alert',
        'system',
        'video_call'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: System can insert notifications (via service role or triggers)
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- NOTIFICATION TRIGGER FUNCTIONS
-- ============================================================================

-- Function: Notify patient when appointment is created
CREATE OR REPLACE FUNCTION notify_patient_on_appointment_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
    VALUES (
        NEW.patient_id,
        'new_booking',
        'Appointment Scheduled',
        'Your appointment has been scheduled.',
        '/dashboard/appointments',
        jsonb_build_object('appointment_id', NEW.id, 'scheduled_at', NEW.scheduled_at)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Notify doctor when appointment is created
CREATE OR REPLACE FUNCTION notify_doctor_on_appointment_created()
RETURNS TRIGGER AS $$
DECLARE
    doctor_user_id UUID;
BEGIN
    -- Get the doctor's user_id from the doctors table
    SELECT user_id INTO doctor_user_id
    FROM doctors
    WHERE id = NEW.doctor_id;
    
    IF doctor_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
        VALUES (
            doctor_user_id,
            'new_booking',
            'New Patient Booking',
            'You have a new appointment request.',
            '/doctor/appointments',
            jsonb_build_object('appointment_id', NEW.id, 'scheduled_at', NEW.scheduled_at)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Notify patient when appointment status changes
CREATE OR REPLACE FUNCTION notify_on_appointment_status_change()
RETURNS TRIGGER AS $$
DECLARE
    notification_type TEXT;
    notification_title TEXT;
    notification_message TEXT;
    doctor_user_id UUID;
BEGIN
    -- Only notify if status actually changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Determine notification details based on new status
    CASE NEW.status
        WHEN 'confirmed' THEN
            notification_type := 'booking_confirmed';
            notification_title := 'Appointment Confirmed';
            notification_message := 'Your appointment has been confirmed by the doctor.';
        WHEN 'cancelled_by_doctor' THEN
            notification_type := 'booking_cancelled';
            notification_title := 'Appointment Cancelled';
            notification_message := 'Your appointment has been cancelled by the doctor.';
        WHEN 'cancelled_by_patient' THEN
            notification_type := 'booking_cancelled';
            notification_title := 'Appointment Cancelled';
            notification_message := 'The patient has cancelled the appointment.';
            
            -- Notify doctor instead of patient when patient cancels
            SELECT user_id INTO doctor_user_id FROM doctors WHERE id = NEW.doctor_id;
            IF doctor_user_id IS NOT NULL THEN
                INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
                VALUES (
                    doctor_user_id,
                    notification_type,
                    notification_title,
                    notification_message,
                    '/doctor/appointments',
                    jsonb_build_object('appointment_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
                );
            END IF;
            RETURN NEW;
        WHEN 'completed' THEN
            notification_type := 'system';
            notification_title := 'Appointment Completed';
            notification_message := 'Your appointment has been completed.';
        ELSE
            RETURN NEW; -- Don't notify for other statuses
    END CASE;
    
    -- Notify patient for most status changes (except when patient cancels)
    IF NEW.status != 'cancelled_by_patient' THEN
        INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
        VALUES (
            NEW.patient_id,
            notification_type,
            notification_title,
            notification_message,
            '/dashboard/appointments',
            jsonb_build_object('appointment_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Notify patient and doctor when appointment is created
DROP TRIGGER IF EXISTS trigger_notify_patient_on_appointment_created ON appointments;
CREATE TRIGGER trigger_notify_patient_on_appointment_created
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION notify_patient_on_appointment_created();

DROP TRIGGER IF EXISTS trigger_notify_doctor_on_appointment_created ON appointments;
CREATE TRIGGER trigger_notify_doctor_on_appointment_created
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION notify_doctor_on_appointment_created();

-- Trigger: Notify on appointment status change
DROP TRIGGER IF EXISTS trigger_notify_on_appointment_status_change ON appointments;
CREATE TRIGGER trigger_notify_on_appointment_status_change
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_appointment_status_change();
