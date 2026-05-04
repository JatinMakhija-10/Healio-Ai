-- ============================================================================
-- ENABLE REALTIME ON NOTIFICATIONS TABLE
-- ============================================================================
-- Allows Supabase Realtime to broadcast INSERT/UPDATE events
-- so clients can receive notifications instantly without polling.
--
-- The Header component subscribes to:
--   postgres_changes → INSERT on notifications WHERE user_id = current_user
--
-- This is required for the Realtime channel subscription to work.

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
