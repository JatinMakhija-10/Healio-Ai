-- Care Pathways Database Schema
-- Stores evidence-based treatment pathways with Ayurvedic personalization

CREATE TABLE IF NOT EXISTS care_pathways (
  id TEXT PRIMARY KEY,
  condition_name TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('emergency', 'urgent', 'routine', 'self-care')),
  expected_duration JSONB NOT NULL,
  pathway_data JSONB NOT NULL,
  tier INTEGER NOT NULL CHECK (tier IN (1, 2)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_pathways_urgency ON care_pathways(urgency);
CREATE INDEX IF NOT EXISTS idx_pathways_tier ON care_pathways(tier);
CREATE INDEX IF NOT EXISTS idx_pathways_condition ON care_pathways(condition_name);

-- Full-text search on pathway content
CREATE INDEX IF NOT EXISTS idx_pathways_search ON care_pathways USING GIN (pathway_data);

-- Row Level Security
ALTER TABLE care_pathways ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read pathways (public health information)
CREATE POLICY "Anyone can read care pathways" ON care_pathways
  FOR SELECT USING (true);

-- Allow inserts without authentication (for seed script)
-- In production, you may want to restrict this to authenticated users only
CREATE POLICY "Allow insert for seeding" ON care_pathways
  FOR INSERT WITH CHECK (true);

-- Allow updates for authenticated users only
CREATE POLICY "Authenticated users can update pathways" ON care_pathways
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE care_pathways IS 'Evidence-based treatment pathways for medical conditions';
COMMENT ON COLUMN care_pathways.id IS 'Unique identifier matching condition ID';
COMMENT ON COLUMN care_pathways.pathway_data IS 'Complete pathway structure as JSONB including phases, monitoring, red flags, and Ayurvedic modifications';
COMMENT ON COLUMN care_pathways.tier IS 'Priority tier: 1 = must-have, 2 = high priority';
