-- ============================================================
-- Wellness Videos Table
-- Doctors / yoga practitioners upload videos for patients
-- ============================================================

CREATE TABLE IF NOT EXISTS wellness_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'other'
        CHECK (category IN ('yoga', 'ayurveda', 'naturopathy', 'meditation', 'exercise', 'nutrition', 'siddha', 'unani', 'homeopathy', 'other')),
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    is_published BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast patient-side queries
CREATE INDEX IF NOT EXISTS idx_wellness_videos_published
    ON wellness_videos (is_published, category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wellness_videos_doctor
    ON wellness_videos (doctor_id);

-- Enable RLS
ALTER TABLE wellness_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Doctors can manage their own videos (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Doctors can view own videos" ON wellness_videos;
CREATE POLICY "Doctors can view own videos"
    ON wellness_videos FOR SELECT
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Doctors can insert own videos" ON wellness_videos;
CREATE POLICY "Doctors can insert own videos"
    ON wellness_videos FOR INSERT
    WITH CHECK (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Doctors can update own videos" ON wellness_videos;
CREATE POLICY "Doctors can update own videos"
    ON wellness_videos FOR UPDATE
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Doctors can delete own videos" ON wellness_videos;
CREATE POLICY "Doctors can delete own videos"
    ON wellness_videos FOR DELETE
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

-- Policy: All authenticated users can view published videos
DROP POLICY IF EXISTS "Anyone can view published videos" ON wellness_videos;
CREATE POLICY "Anyone can view published videos"
    ON wellness_videos FOR SELECT
    USING (is_published = true);

-- Policy: Admins can view ALL videos (published + unpublished) for moderation
DROP POLICY IF EXISTS "Admins can view all videos" ON wellness_videos;
CREATE POLICY "Admins can view all videos"
    ON wellness_videos FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Policy: Admins can update any video (publish/unpublish moderation)
DROP POLICY IF EXISTS "Admins can update any video" ON wellness_videos;
CREATE POLICY "Admins can update any video"
    ON wellness_videos FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Policy: Admins can delete any video
DROP POLICY IF EXISTS "Admins can delete any video" ON wellness_videos;
CREATE POLICY "Admins can delete any video"
    ON wellness_videos FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Policy: Any authenticated user can increment view count
DROP POLICY IF EXISTS "Authenticated users can increment views" ON wellness_videos;
CREATE POLICY "Authenticated users can increment views"
    ON wellness_videos FOR UPDATE
    USING (is_published = true)
    WITH CHECK (is_published = true);
