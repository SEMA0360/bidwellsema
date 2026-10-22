/*
# Create RFP workflow tables (single-tenant, no auth)

1. New Tables
- `knowledge_base` — stores uploaded company assets (past bids, accreditations, case studies, policies, CVs) for RAG retrieval
- `kb_chunks` — text chunks extracted from knowledge base documents for semantic search
- `review_assignments` — SME tagging and review stage tracking per compliance row
- `audit_trail` — version history tracking edits, author signatures, and AI prompt iterations
- `collaborators` — team members with role-based access control

2. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD because the app is single-tenant with no sign-in (intentionally shared data).

3. Notes
- `knowledge_base.documents` stores file metadata; actual file content is chunked into `kb_chunks`
- `review_assignments` tracks multi-stage review: drafted → sme_review → red_team → final_signoff
- `audit_trail` records every edit with author, timestamp, before/after diff, and AI prompt version
- `collaborators` supports roles: admin, bid_manager, reviewer, sme
*/

-- Knowledge Base / Context Vault
CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  document_type text NOT NULL DEFAULT 'other',
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'processed',
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kb" ON knowledge_base;
CREATE POLICY "anon_select_kb" ON knowledge_base FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_kb" ON knowledge_base;
CREATE POLICY "anon_insert_kb" ON knowledge_base FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_kb" ON knowledge_base;
CREATE POLICY "anon_update_kb" ON knowledge_base FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_kb" ON knowledge_base;
CREATE POLICY "anon_delete_kb" ON knowledge_base FOR DELETE
  TO anon, authenticated USING (true);

-- Knowledge Base Chunks (for RAG / semantic search)
CREATE TABLE IF NOT EXISTS kb_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_id uuid NOT NULL REFERENCES knowledge_base(id) ON DELETE CASCADE,
  chunk_index int NOT NULL DEFAULT 0,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kb_chunks" ON kb_chunks;
CREATE POLICY "anon_select_kb_chunks" ON kb_chunks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_kb_chunks" ON kb_chunks;
CREATE POLICY "anon_insert_kb_chunks" ON kb_chunks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_kb_chunks" ON kb_chunks;
CREATE POLICY "anon_update_kb_chunks" ON kb_chunks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_kb_chunks" ON kb_chunks;
CREATE POLICY "anon_delete_kb_chunks" ON kb_chunks FOR DELETE
  TO anon, authenticated USING (true);

-- Review Assignments (SME tagging + multi-stage review)
CREATE TABLE IF NOT EXISTS review_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id text NOT NULL,
  requirement_text text NOT NULL,
  assigned_to text NOT NULL,
  assignee_role text NOT NULL DEFAULT 'sme',
  stage text NOT NULL DEFAULT 'drafted',
  status text NOT NULL DEFAULT 'pending',
  assigned_at timestamptz DEFAULT now(),
  due_date timestamptz,
  completed_at timestamptz,
  notes text
);

ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reviews" ON review_assignments;
CREATE POLICY "anon_select_reviews" ON review_assignments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reviews" ON review_assignments;
CREATE POLICY "anon_insert_reviews" ON review_assignments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reviews" ON review_assignments;
CREATE POLICY "anon_update_reviews" ON review_assignments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reviews" ON review_assignments;
CREATE POLICY "anon_delete_reviews" ON review_assignments FOR DELETE
  TO anon, authenticated USING (true);

-- Audit Trail (version control for edits + AI prompt iterations)
CREATE TABLE IF NOT EXISTS audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  author text NOT NULL DEFAULT 'system',
  version int NOT NULL DEFAULT 1,
  change_summary text,
  before_value jsonb,
  after_value jsonb,
  ai_prompt_version text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_audit" ON audit_trail;
CREATE POLICY "anon_select_audit" ON audit_trail FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_audit" ON audit_trail;
CREATE POLICY "anon_insert_audit" ON audit_trail FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_audit" ON audit_trail;
CREATE POLICY "anon_update_audit" ON audit_trail FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_audit" ON audit_trail;
CREATE POLICY "anon_delete_audit" ON audit_trail FOR DELETE
  TO anon, authenticated USING (true);

-- Collaborators (RBAC)
CREATE TABLE IF NOT EXISTS collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'reviewer',
  department text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_collab" ON collaborators;
CREATE POLICY "anon_select_collab" ON collaborators FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_collab" ON collaborators;
CREATE POLICY "anon_insert_collab" ON collaborators FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_collab" ON collaborators;
CREATE POLICY "anon_update_collab" ON collaborators FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_collab" ON collaborators;
CREATE POLICY "anon_delete_collab" ON collaborators FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kb_chunks_kb_id ON kb_chunks(kb_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_requirement ON review_assignments(requirement_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_stage ON review_assignments(stage);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_email ON collaborators(email);
