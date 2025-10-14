-- ==============================================
-- ADD READERS TABLE TO QOLAE_HRCOMPLIANCE
-- ==============================================
-- Purpose: Add readers master registry to qolae_hrcompliance database
-- Date: October 14, 2025
-- Note: This consolidates reader registration into HR Compliance database
-- Migrated from qolae_readers schema (simplified for registration workflow)
-- ==============================================

-- \c qolae_hrcompliance;

-- ==============================================
-- TABLE: READERS (Master Registry)
-- ==============================================
-- Stores reader identity, authentication, NDA status
-- Used during registration workflow by Case Managers
-- Links to reader_compliance table for CV/references
-- ==============================================

CREATE TABLE IF NOT EXISTS readers (
  -- Primary Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_pin VARCHAR(20) UNIQUE NOT NULL, -- e.g., "RDR-JS123456"

  -- Personal Information
  reader_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),

  -- Reader Classification
  reader_type VARCHAR(50) NOT NULL CHECK (reader_type IN ('first_reader', 'second_reader')),
  specialization VARCHAR(255), -- For medical readers (e.g., "Registered Nurse", "Physician")

  -- Medical Professional Verification (for second readers only)
  registration_body VARCHAR(50), -- 'NMC', 'GMC', 'Other'
  registration_number VARCHAR(50), -- e.g., '12A3456E'
  registration_verified BOOLEAN DEFAULT FALSE,
  registration_verified_at TIMESTAMP,

  -- Payment Configuration
  payment_rate DECIMAL(10, 2) DEFAULT 50.00, -- £50.00 for first reader, £75-100 for second

  -- Registration Workflow Status
  status VARCHAR(50) DEFAULT 'pending_nda' CHECK (status IN (
    'pending_nda',        -- PIN generated, NDA not yet sent
    'invited',            -- NDA sent, awaiting reader action
    'nda_signed',         -- NDA signed, awaiting compliance submission
    'compliance_pending', -- Compliance submitted, awaiting review
    'approved',           -- Fully approved, portal access granted
    'on_hold',            -- Temporary hold
    'suspended'           -- Suspended from platform
  )),

  -- NDA Workflow
  nda_generated BOOLEAN DEFAULT FALSE,
  nda_generated_at TIMESTAMP,
  nda_pdf_path VARCHAR(500), -- Path: /central-repository/final-nda/NDA_{PIN}.pdf
  nda_signed BOOLEAN DEFAULT FALSE,
  nda_signed_at TIMESTAMP,
  nda_signed_pdf_path VARCHAR(500), -- Path: /central-repository/signed-nda/NDA_{PIN}_Signed.pdf

  -- Invitation Tracking
  invitation_sent BOOLEAN DEFAULT FALSE,
  invited_at TIMESTAMP,
  invitation_email_sent BOOLEAN DEFAULT FALSE,

  -- Portal Access (after approval)
  portal_access_granted BOOLEAN DEFAULT FALSE,
  portal_access_granted_at TIMESTAMP,

  -- Created By (Case Manager who registered)
  created_by VARCHAR(255) NOT NULL DEFAULT 'liz',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for readers table
CREATE INDEX IF NOT EXISTS idx_readers_reader_pin ON readers(reader_pin);
CREATE INDEX IF NOT EXISTS idx_readers_email ON readers(email);
CREATE INDEX IF NOT EXISTS idx_readers_reader_type ON readers(reader_type);
CREATE INDEX IF NOT EXISTS idx_readers_status ON readers(status);
CREATE INDEX IF NOT EXISTS idx_readers_nda_signed ON readers(nda_signed);
CREATE INDEX IF NOT EXISTS idx_readers_invited_at ON readers(invited_at DESC);

-- Trigger for readers table (reuse existing function)
DROP TRIGGER IF EXISTS update_readers_updated_at ON readers;
CREATE TRIGGER update_readers_updated_at
    BEFORE UPDATE ON readers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- LINK TO EXISTING READER_COMPLIANCE TABLE
-- ==============================================
-- The reader_pin in reader_compliance references readers.reader_pin
-- This maintains the separation:
-- - readers table = registration workflow
-- - reader_compliance table = CV upload & references workflow
-- ==============================================

COMMENT ON TABLE readers IS 'Master registry for reader registration workflow (PIN generation, NDA, invitations)';
COMMENT ON TABLE reader_compliance IS 'Reader compliance documents (CV, references) - links to readers table via reader_pin';

-- ==============================================
-- COMPLETED ✅
-- ==============================================
-- To apply this migration:
-- 1. Connect to qolae_hrcompliance database
-- 2. Run: psql -U hrcompliance_user -d qolae_hrcompliance -f add_readers_table.sql
-- ==============================================
