-- =====================================================
-- NEW STARTER DOCUMENTS & REFERENCES TABLES
-- Database: qolae_hrcompliance
-- Purpose: Store compliance documents and reference contacts for new starters
-- Date: October 18, 2025
-- =====================================================

-- TABLE 1: new_starter_documents
-- Stores uploaded compliance documents as binary data (BYTEA) in database
CREATE TABLE IF NOT EXISTS new_starter_documents (
  id SERIAL PRIMARY KEY,
  new_starter_id INTEGER NOT NULL REFERENCES new_starters(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_data BYTEA NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending_review',

  -- Indexes for performance
  CONSTRAINT fk_new_starter_docs FOREIGN KEY (new_starter_id)
    REFERENCES new_starters(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_new_starter_docs ON new_starter_documents(new_starter_id);
CREATE INDEX IF NOT EXISTS idx_new_starter_docs_status ON new_starter_documents(status);
CREATE INDEX IF NOT EXISTS idx_new_starter_docs_type ON new_starter_documents(document_type);

COMMENT ON TABLE new_starter_documents IS 'Stores all compliance documents for new starters as binary data';
COMMENT ON COLUMN new_starter_documents.file_data IS 'Binary file data stored as BYTEA for secure database storage';
COMMENT ON COLUMN new_starter_documents.document_type IS 'Types: proof_of_id, proof_of_address, qualifications, dbs_certificate, professional_registration';

-- TABLE 2: new_starter_references
-- Stores reference contact information (professional and character references)
CREATE TABLE IF NOT EXISTS new_starter_references (
  id SERIAL PRIMARY KEY,
  new_starter_id INTEGER NOT NULL REFERENCES new_starters(id) ON DELETE CASCADE,
  ref_type VARCHAR(50) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  contact_title VARCHAR(255),
  contact_organisation VARCHAR(255),
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  relationship TEXT,
  duration_known VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT fk_new_starter_refs FOREIGN KEY (new_starter_id)
    REFERENCES new_starters(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_new_starter_refs ON new_starter_references(new_starter_id);
CREATE INDEX IF NOT EXISTS idx_new_starter_refs_status ON new_starter_references(status);
CREATE INDEX IF NOT EXISTS idx_new_starter_refs_type ON new_starter_references(ref_type);

COMMENT ON TABLE new_starter_references IS 'Stores reference contact details for new starters';
COMMENT ON COLUMN new_starter_references.ref_type IS 'Types: professional, character';
COMMENT ON COLUMN new_starter_references.status IS 'Status: pending, in_progress, received, approved';

-- Verification queries
-- Run these after migration to verify tables were created correctly:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'new_starter_%';
-- \d new_starter_documents
-- \d new_starter_references
