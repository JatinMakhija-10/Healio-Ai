-- View: Patient Inbox (Appointments with last message)
-- We drop the view first to allow changing column types/order without "cannot change name of view column" errors
DROP VIEW IF EXISTS patient_inbox_view;

CREATE OR REPLACE VIEW patient_inbox_view WITH (security_invoker = true) AS
SELECT
    a.id as appointment_id,
    a.created_at as appointment_created_at,
    a.doctor_id,
    a.patient_id,
    p.full_name as doctor_name,
    NULL::TEXT as doctor_avatar,
    last_msg.content as last_message,
    last_msg.created_at as last_message_time,
    last_msg.type as last_message_type,
    COALESCE(unread_stats.unread_count, 0) as unread_count,
    COALESCE(last_msg.created_at, a.created_at) as latest_activity_at
FROM appointments a
JOIN doctors d ON d.id = a.doctor_id
JOIN profiles p ON p.id = d.user_id
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
    AND m.sender_id != a.patient_id 
) unread_stats ON TRUE;
