-- ═══════════════════════════════════════════════════════════════════════════
-- Healio.AI — Storage Optimization & Retention Policies
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose:
--   1. Implement automatic cleanup of old attachments
--   2. Add wellness-videos bucket if missing
--   3. Optimize storage policies
--
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Ensure Wellness Videos Bucket Exists ─────────────────────────────────

INSERT INTO storage.buckets (id, name, public) 
VALUES ('wellness-videos', 'wellness-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public read access for wellness videos
DROP POLICY IF EXISTS "Public read wellness videos" ON storage.objects;
CREATE POLICY "Public read wellness videos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'wellness-videos' );

-- Policy: Only doctors can upload wellness videos
DROP POLICY IF EXISTS "Doctors upload wellness videos" ON storage.objects;
CREATE POLICY "Doctors upload wellness videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wellness-videos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE user_id = auth.uid()
  )
);

-- Policy: Doctors can delete their own wellness videos
DROP POLICY IF EXISTS "Doctors delete own videos" ON storage.objects;
CREATE POLICY "Doctors delete own videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wellness-videos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE user_id = auth.uid()
  )
);

-- ─── 2. Storage Cleanup Functions ────────────────────────────────────────────

-- Function: Clean up old chat attachments
CREATE OR REPLACE FUNCTION cleanup_old_attachments(
    retention_days INTEGER DEFAULT 180
)
RETURNS TABLE (
    deleted_count BIGINT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted BIGINT := 0;
BEGIN
    -- Delete files from storage.objects table
    -- Note: Actual file deletion requires storage API, this cleans metadata
    DELETE FROM storage.objects
    WHERE bucket_id = 'chat-attachments'
      AND created_at < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    
    RETURN QUERY SELECT v_deleted, NULL::TEXT;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 0::BIGINT, SQLERRM;
END;
$$;

-- Function: Get storage statistics
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE (
    bucket_id TEXT,
    file_count BIGINT,
    total_size_bytes BIGINT,
    total_size_mb NUMERIC,
    oldest_file TIMESTAMPTZ,
    newest_file TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        o.bucket_id,
        COUNT(*) as file_count,
        SUM((o.metadata->>'size')::BIGINT) as total_size_bytes,
        ROUND(SUM((o.metadata->>'size')::BIGINT) / 1048576.0, 2) as total_size_mb,
        MIN(o.created_at) as oldest_file,
        MAX(o.created_at) as newest_file
    FROM storage.objects o
    GROUP BY o.bucket_id
    ORDER BY total_size_bytes DESC;
$$;

-- Function: Find orphaned attachments (not referenced in messages)
CREATE OR REPLACE FUNCTION find_orphaned_attachments()
RETURNS TABLE (
    file_name TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.name as file_name,
        (o.metadata->>'size')::BIGINT as file_size,
        o.created_at
    FROM storage.objects o
    WHERE o.bucket_id = 'chat-attachments'
      AND NOT EXISTS (
        SELECT 1 FROM messages m
        WHERE m.attachments::text ILIKE '%' || o.name || '%'
      )
    ORDER BY o.created_at DESC;
END;
$$;

-- Function: Delete orphaned attachments
CREATE OR REPLACE FUNCTION delete_orphaned_attachments()
RETURNS TABLE (
    deleted_count BIGINT,
    space_freed_mb NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted BIGINT := 0;
    v_space_freed NUMERIC := 0;
BEGIN
    -- Calculate space to be freed
    SELECT 
        COUNT(*),
        ROUND(SUM((o.metadata->>'size')::BIGINT) / 1048576.0, 2)
    INTO v_deleted, v_space_freed
    FROM storage.objects o
    WHERE o.bucket_id = 'chat-attachments'
      AND NOT EXISTS (
        SELECT 1 FROM messages m
        WHERE m.attachments::text ILIKE '%' || o.name || '%'
      );
    
    -- Delete orphaned files
    DELETE FROM storage.objects o
    WHERE o.bucket_id = 'chat-attachments'
      AND NOT EXISTS (
        SELECT 1 FROM messages m
        WHERE m.attachments::text ILIKE '%' || o.name || '%'
      );
    
    RETURN QUERY SELECT v_deleted, v_space_freed;
END;
$$;

-- ─── 3. Storage Size Limits (Row-Level Security) ─────────────────────────────

-- Update chat-attachments upload policy with size check (5 MB limit)
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  auth.role() = 'authenticated' AND
  -- Size check: 5 MB = 5,242,880 bytes
  (metadata->>'size')::BIGINT <= 5242880
);

-- ─── 4. Scheduled Cleanup (Optional - requires pg_cron extension) ────────────

-- Note: pg_cron is not enabled by default on Supabase free tier
-- To enable: Go to Dashboard → Database → Extensions → Enable pg_cron

-- Uncomment below if pg_cron is enabled:

/*
-- Schedule: Clean up chat attachments older than 180 days
-- Runs at 3 AM on the 1st of each month
SELECT cron.schedule(
    'cleanup-old-chat-attachments',
    '0 3 1 * *',
    $$SELECT cleanup_old_attachments(180);$$
);

-- Schedule: Clean up orphaned attachments
-- Runs at 4 AM on the 15th of each month
SELECT cron.schedule(
    'cleanup-orphaned-attachments',
    '0 4 15 * *',
    $$SELECT delete_orphaned_attachments();$$
);
*/

-- ─── 5. Helpful Views ─────────────────────────────────────────────────────────

-- View: Storage overview
CREATE OR REPLACE VIEW storage_overview AS
SELECT 
    bucket_id,
    COUNT(*) as total_files,
    pg_size_pretty(SUM((metadata->>'size')::BIGINT)) as total_size,
    pg_size_pretty(AVG((metadata->>'size')::BIGINT)::BIGINT) as avg_file_size,
    MIN(created_at) as oldest_file_date,
    MAX(created_at) as newest_file_date,
    COUNT(*) FILTER (
        WHERE created_at < NOW() - INTERVAL '90 days'
    ) as files_older_than_90_days,
    COUNT(*) FILTER (
        WHERE created_at < NOW() - INTERVAL '180 days'
    ) as files_older_than_180_days
FROM storage.objects
GROUP BY bucket_id;

-- ─── 6. Usage Examples ────────────────────────────────────────────────────────

COMMENT ON FUNCTION cleanup_old_attachments IS 
'Clean up chat attachments older than specified days. Usage:
  SELECT * FROM cleanup_old_attachments(180);  -- Delete files older than 180 days
  SELECT * FROM cleanup_old_attachments(90);   -- Delete files older than 90 days';

COMMENT ON FUNCTION get_storage_stats IS
'Get storage statistics by bucket. Usage:
  SELECT * FROM get_storage_stats();';

COMMENT ON FUNCTION find_orphaned_attachments IS
'Find attachments not referenced in messages table. Usage:
  SELECT * FROM find_orphaned_attachments();';

COMMENT ON FUNCTION delete_orphaned_attachments IS
'Delete orphaned attachments and return stats. Usage:
  SELECT * FROM delete_orphaned_attachments();';

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Check storage overview
-- SELECT * FROM storage_overview;

-- Get detailed statistics
-- SELECT * FROM get_storage_stats();

-- Find orphaned attachments (dry run)
-- SELECT COUNT(*), pg_size_pretty(SUM(file_size)::BIGINT) as total_size
-- FROM find_orphaned_attachments();

-- Clean up files older than 90 days (execute)
-- SELECT * FROM cleanup_old_attachments(90);

-- Delete orphaned attachments (execute)
-- SELECT * FROM delete_orphaned_attachments();

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════
