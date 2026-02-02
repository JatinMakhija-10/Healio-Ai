-- Chat System Migration
-- Creates messages table and storage bucket for attachments

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================

DROP TABLE IF EXISTS messages CASCADE;

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
    media_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_appointment_id ON messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Participants (Doctor/Patient) can view messages for their appointment
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
CREATE POLICY "Participants can view messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.id = messages.appointment_id
            AND (
                a.patient_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM doctors d
                    WHERE d.id = a.doctor_id
                    AND d.user_id = auth.uid()
                )
            )
        )
    );

-- Policy: Participants can insert messages into their appointment
DROP POLICY IF EXISTS "Participants can insert messages" ON messages;
CREATE POLICY "Participants can insert messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.id = messages.appointment_id
            AND (
                a.patient_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM doctors d
                    WHERE d.id = a.doctor_id
                    AND d.user_id = auth.uid()
                )
            )
        )
    );

-- Policy: Participants can update (mark as read) messages
DROP POLICY IF EXISTS "Participants can update messages" ON messages;
CREATE POLICY "Participants can update messages"
    ON messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.id = messages.appointment_id
            AND (
                a.patient_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM doctors d
                    WHERE d.id = a.doctor_id
                    AND d.user_id = auth.uid()
                )
            )
        )
    );

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public access to read files
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat-attachments' );

-- Policy: Authenticated users can upload
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  auth.role() = 'authenticated'
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Doctor Inbox (Appointments with last message)
CREATE OR REPLACE VIEW doctor_inbox_view AS
SELECT
    a.id as appointment_id,
    a.doctor_id,
    a.patient_id,
    p.full_name as patient_name,
    NULL::TEXT as patient_avatar,
    last_msg.content as last_message,
    last_msg.created_at as last_message_time,
    last_msg.type as last_message_type,
    COALESCE(unread_stats.unread_count, 0) as unread_count
FROM appointments a
JOIN doctors d ON d.id = a.doctor_id
JOIN profiles p ON p.id = a.patient_id
LEFT JOIN LATERAL (
    SELECT content, created_at, type
    FROM messages m
    WHERE m.appointment_id = a.id
    ORDER BY created_at DESC
    LIMIT 1
) last_msg ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*) as unread_count
    FROM messages m
    WHERE m.appointment_id = a.id
    AND m.is_read = FALSE
    AND m.sender_id != d.user_id 
) unread_stats ON TRUE;

-- Policy: Doctors can view the inbox view
-- (Views inherit permissions from underlying tables, but since RLS is on tables, we rely on table policies)

