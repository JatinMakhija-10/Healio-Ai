-- Real-time metrics infrastructure for admin dashboard
-- Creates tables and functions for "The Pulse" live monitoring

-- ============================================================================
-- SYSTEM HEALTH TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'partial_outage', 'major_outage')),
    latency_ms INTEGER,
    error_message TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_health_service ON system_health(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_checked_at ON system_health(checked_at DESC);

-- Enable RLS
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view system health
DROP POLICY IF EXISTS "Admins can view system health" ON system_health;
CREATE POLICY "Admins can view system health"
    ON system_health FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- FLAGGED SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS flagged_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    flag_type TEXT NOT NULL CHECK (flag_type IN ('leakage', 'abuse', 'malpractice', 'other')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'urgent')),
    description TEXT,
    flagged_by TEXT DEFAULT 'system', -- 'system', 'user', 'admin'
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flagged_sessions_status ON flagged_sessions(status);
CREATE INDEX IF NOT EXISTS idx_flagged_sessions_severity ON flagged_sessions(severity);
CREATE INDEX IF NOT EXISTS idx_flagged_sessions_created_at ON flagged_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE flagged_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view flagged sessions
DROP POLICY IF EXISTS "Admins can view flagged sessions" ON flagged_sessions;
CREATE POLICY "Admins can view flagged sessions"
    ON flagged_sessions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- AI LATENCY METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_latency_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type TEXT NOT NULL, -- 'diagnosis', 'recommendation', etc.
    latency_ms INTEGER NOT NULL,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_latency_created_at ON ai_latency_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_latency_request_type ON ai_latency_metrics(request_type);

-- Enable RLS
ALTER TABLE ai_latency_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view AI latency metrics
DROP POLICY IF EXISTS "Admins can view ai metrics" ON ai_latency_metrics;
CREATE POLICY "Admins can view ai metrics"
    ON ai_latency_metrics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- MATERIALIZED VIEWS FOR FAST METRICS
-- ============================================================================

-- View: Current System Health Summary
CREATE OR REPLACE VIEW current_system_health AS
SELECT 
    service_name,
    status,
    latency_ms,
    checked_at
FROM (
    SELECT 
        service_name,
        status,
        latency_ms,
        checked_at,
        ROW_NUMBER() OVER (PARTITION BY service_name ORDER BY checked_at DESC) as rn
    FROM system_health
) ranked
WHERE rn = 1;

-- View: Pending Doctors Count
CREATE OR REPLACE VIEW pending_doctors_count AS
SELECT COUNT(*) as count
FROM doctors
WHERE verification_status = 'pending';

-- View: Flagged Sessions Count
CREATE OR REPLACE VIEW flagged_sessions_count AS
SELECT COUNT(*) as count
FROM flagged_sessions
WHERE status = 'pending';

-- View: AI Latency Percentiles (Last 24 hours)
CREATE OR REPLACE VIEW ai_latency_stats AS
SELECT 
    COUNT(*) as total_requests,
    ROUND(AVG(latency_ms)) as avg_latency,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY latency_ms) as p50_latency,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99_latency,
    COUNT(*) FILTER (WHERE NOT success) as error_count
FROM ai_latency_metrics
WHERE created_at > NOW() - INTERVAL '24 hours';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Calculate uptime percentage
CREATE OR REPLACE FUNCTION calculate_uptime(time_window INTERVAL DEFAULT '24 hours')
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_minutes DECIMAL;
    operational_minutes DECIMAL;
BEGIN
    -- Get total minutes in window
    total_minutes := EXTRACT(EPOCH FROM time_window) / 60;
    
    -- Count operational minutes (simplified - assumes health checks every 5 min)
    SELECT COUNT(*) * 5 INTO operational_minutes
    FROM system_health
    WHERE checked_at > NOW() - time_window
    AND status = 'operational';
    
    -- Return percentage
    IF total_minutes > 0 THEN
        RETURN LEAST(100, (operational_minutes / total_minutes) * 100);
    ELSE
        RETURN 100.00;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at for flagged_sessions
DROP TRIGGER IF EXISTS update_flagged_sessions_updated_at ON flagged_sessions;
CREATE TRIGGER update_flagged_sessions_updated_at
    BEFORE UPDATE ON flagged_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA FOR DEMO (Optional - only for local dev)
-- ============================================================================

-- Insert initial health check records
INSERT INTO system_health (service_name, status, latency_ms) VALUES
    ('database', 'operational', 15),
    ('ai_service', 'operational', 42),
    ('supabase', 'operational', 8)
ON CONFLICT DO NOTHING;

-- Insert sample AI latency metrics
INSERT INTO ai_latency_metrics (request_type, latency_ms, success) 
SELECT 
    'diagnosis',
    (random() * 100 + 20)::INTEGER,
    true
FROM generate_series(1, 50)
ON CONFLICT DO NOTHING;
