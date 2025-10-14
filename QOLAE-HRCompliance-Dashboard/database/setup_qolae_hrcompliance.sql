-- ==============================================
-- QOLAE HR COMPLIANCE DATABASE SCHEMA
-- ==============================================
-- Purpose: Secure, isolated storage for HR compliance documents
--          (CVs, references) separate from operational data
-- Author: Liz
-- Date: October 10, 2025
-- Database: qolae_hrcompliance (separate from qolae_readers)
-- Security: Only Case Managers have access, full audit trail
-- ==============================================

-- Create database (run this first if needed)
-- CREATE DATABASE qolae_hrcompliance;

-- Connect to database
-- \c qolae_hrcompliance;

-- ==============================================
-- TABLE 1: READER_COMPLIANCE
-- Main table for reader HR compliance records
-- ==============================================

CREATE TABLE IF NOT EXISTS reader_compliance (
  -- Primary Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_pin VARCHAR(20) UNIQUE NOT NULL, -- Links to readers.reader_pin in qolae_readers
  reader_name VARCHAR(255) NOT NULL,
  reader_type VARCHAR(50) NOT NULL CHECK (reader_type IN ('first_reader', 'second_reader')),
  
  -- CV Document (stored in database as binary data)
  cv_filename VARCHAR(255) NOT NULL,
  cv_mimetype VARCHAR(100) NOT NULL, -- e.g., 'application/pdf'
  cv_data BYTEA NOT NULL, -- Binary CV file data stored in PostgreSQL
  cv_file_size INTEGER, -- In bytes
  cv_uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Professional Reference Details (submitted by reader)
  prof_ref_name VARCHAR(255) NOT NULL,
  prof_ref_title VARCHAR(255) NOT NULL, -- e.g., "Senior Nurse Manager"
  prof_ref_organisation VARCHAR(255) NOT NULL, -- e.g., "Royal Infirmary Edinburgh"
  prof_ref_email VARCHAR(255) NOT NULL,
  prof_ref_phone VARCHAR(50) NOT NULL,
  prof_ref_relationship TEXT NOT NULL, -- e.g., "Former supervisor at X Hospital (2018-2022)"
  
  -- Professional Reference Status
  prof_ref_status VARCHAR(50) DEFAULT 'pending' CHECK (prof_ref_status IN ('pending', 'in_progress', 'received', 'approved')),
  prof_ref_form_filled_by VARCHAR(100), -- 'Liz' (phone call) or 'Referee' (self-filled)
  prof_ref_form_filled_at TIMESTAMP,
  prof_ref_signature_path VARCHAR(500), -- Path to signed reference form
  prof_ref_signature_received_at TIMESTAMP,
  
  -- Character Reference Details (submitted by reader)
  char_ref_name VARCHAR(255) NOT NULL,
  char_ref_relationship VARCHAR(255) NOT NULL, -- e.g., "Academic supervisor", "Colleague"
  char_ref_email VARCHAR(255) NOT NULL,
  char_ref_phone VARCHAR(50) NOT NULL,
  char_ref_known_duration VARCHAR(100) NOT NULL, -- e.g., "5 years"
  
  -- Character Reference Status
  char_ref_status VARCHAR(50) DEFAULT 'pending' CHECK (char_ref_status IN ('pending', 'in_progress', 'received', 'approved')),
  char_ref_form_filled_by VARCHAR(100), -- 'Liz' (phone call) or 'Referee' (self-filled)
  char_ref_form_filled_at TIMESTAMP,
  char_ref_signature_path VARCHAR(500), -- Path to signed reference form
  char_ref_signature_received_at TIMESTAMP,
  
  -- Submission Tracking
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_ip VARCHAR(45), -- Reader's IP address when submitted
  
  -- Case Manager Review & Approval
  reviewed_by VARCHAR(100), -- 'Liz' or other CM name
  reviewed_at TIMESTAMP,
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP,
  approval_notes TEXT, -- CM's notes about the compliance review
  
  -- Audit & Security
  record_locked BOOLEAN DEFAULT FALSE, -- TRUE = approved and sealed, no more edits
  locked_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for reader_compliance
CREATE INDEX idx_reader_compliance_pin ON reader_compliance(reader_pin);
CREATE INDEX idx_reader_compliance_approved ON reader_compliance(approved);
CREATE INDEX idx_reader_compliance_submitted_at ON reader_compliance(submitted_at DESC);
CREATE INDEX idx_prof_ref_status ON reader_compliance(prof_ref_status);
CREATE INDEX idx_char_ref_status ON reader_compliance(char_ref_status);

-- ==============================================
-- TABLE 2: COMPLIANCE_ACCESS_LOG
-- GDPR-compliant audit trail for who accessed what
-- ==============================================

CREATE TABLE IF NOT EXISTS compliance_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What was accessed
  reader_pin VARCHAR(20) NOT NULL,
  compliance_id UUID REFERENCES reader_compliance(id) ON DELETE CASCADE,
  
  -- Who accessed it
  accessed_by VARCHAR(100) NOT NULL, -- 'Liz' or other CM name
  access_type VARCHAR(50) NOT NULL CHECK (access_type IN (
    'view',           -- Viewed compliance record
    'download_cv',    -- Downloaded CV
    'view_reference', -- Viewed reference details
    'send_ref_form',  -- Sent reference form to referee
    'approve',        -- Approved compliance
    'lock'            -- Locked record
  )),
  
  -- Access Details
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Context
  access_notes TEXT -- Optional notes about why accessed
);

-- Indexes for compliance_access_log
CREATE INDEX idx_access_log_reader_pin ON compliance_access_log(reader_pin);
CREATE INDEX idx_access_log_accessed_by ON compliance_access_log(accessed_by);
CREATE INDEX idx_access_log_accessed_at ON compliance_access_log(accessed_at DESC);
CREATE INDEX idx_access_log_access_type ON compliance_access_log(access_type);

-- ==============================================
-- TABLE 3: REFERENCE_FORMS
-- Stores signed reference forms from referees
-- ==============================================

CREATE TABLE IF NOT EXISTS reference_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  reader_pin VARCHAR(20) NOT NULL,
  compliance_id UUID NOT NULL REFERENCES reader_compliance(id) ON DELETE CASCADE,
  reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('professional', 'character')),
  
  -- Referee Details
  referee_name VARCHAR(255) NOT NULL,
  referee_email VARCHAR(255) NOT NULL,
  referee_phone VARCHAR(50) NOT NULL,
  
  -- Form Method
  form_method VARCHAR(50) CHECK (form_method IN ('phone_call', 'email_self_filled')),
  filled_by_cm VARCHAR(100), -- 'Liz' if phone call method
  filled_at TIMESTAMP,
  
  -- Form Content (JSONB for flexibility)
  form_data JSONB, -- Structured reference answers
  
  -- Digital Signature
  signature_path VARCHAR(500), -- Path to signature image
  signature_ip VARCHAR(45), -- Referee's IP when they signed
  signed_at TIMESTAMP,
  
  -- Status
  form_status VARCHAR(50) DEFAULT 'draft' CHECK (form_status IN (
    'draft',          -- CM filling out (phone call)
    'sent_to_referee', -- Emailed to referee for review/signature
    'signed',         -- Referee signed and submitted
    'approved'        -- CM approved the reference
  )),
  
  -- File Storage
  signed_form_pdf_path VARCHAR(500), -- Path to final signed PDF
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for reference_forms
CREATE INDEX idx_reference_forms_reader_pin ON reference_forms(reader_pin);
CREATE INDEX idx_reference_forms_compliance_id ON reference_forms(compliance_id);
CREATE INDEX idx_reference_forms_reference_type ON reference_forms(reference_type);
CREATE INDEX idx_reference_forms_form_status ON reference_forms(form_status);

-- ==============================================
-- FUNCTIONS & TRIGGERS
-- ==============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reader_compliance table
CREATE TRIGGER update_reader_compliance_updated_at
    BEFORE UPDATE ON reader_compliance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for reference_forms table
CREATE TRIGGER update_reference_forms_updated_at
    BEFORE UPDATE ON reference_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-lock compliance record when approved
CREATE OR REPLACE FUNCTION lock_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.approved = TRUE AND OLD.approved = FALSE THEN
        NEW.record_locked = TRUE;
        NEW.locked_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to lock record on approval
CREATE TRIGGER lock_compliance_on_approval
    BEFORE UPDATE ON reader_compliance
    FOR EACH ROW
    EXECUTE FUNCTION lock_on_approval();

-- ==============================================
-- USEFUL QUERIES FOR CASE MANAGERS
-- ==============================================

-- View all pending compliance reviews
-- SELECT 
--   reader_pin,
--   reader_name,
--   reader_type,
--   submitted_at,
--   prof_ref_status,
--   char_ref_status,
--   approved
-- FROM reader_compliance
-- WHERE approved = FALSE
-- ORDER BY submitted_at ASC;

-- View compliance records with both references received
-- SELECT 
--   reader_pin,
--   reader_name,
--   prof_ref_status,
--   char_ref_status,
--   approved
-- FROM reader_compliance
-- WHERE prof_ref_status = 'received'
--   AND char_ref_status = 'received'
--   AND approved = FALSE
-- ORDER BY submitted_at ASC;

-- View all access to a specific reader's compliance
-- SELECT 
--   accessed_by,
--   access_type,
--   accessed_at,
--   access_notes
-- FROM compliance_access_log
-- WHERE reader_pin = 'RDR-XX123456'
-- ORDER BY accessed_at DESC;

-- Count pending references by type
-- SELECT
--   reference_type,
--   form_status,
--   COUNT(*) as count
-- FROM reference_forms
-- WHERE form_status IN ('draft', 'sent_to_referee')
-- GROUP BY reference_type, form_status;

-- ==============================================
-- TABLE 4: NEW_STARTERS
-- New starter onboarding and compliance tracking
-- ==============================================

CREATE TABLE IF NOT EXISTS new_starters (
  -- Primary Identity
  id SERIAL PRIMARY KEY,
  pin VARCHAR(20) UNIQUE NOT NULL, -- Format: NS-{Initials}{6-digits}, e.g., NS-JD123456

  -- Personal Details
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),

  -- Position Details
  role VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  start_date DATE,

  -- Address (submitted via compliance portal)
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  postcode VARCHAR(20),

  -- Emergency Contact
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_relationship VARCHAR(100),

  -- Workflow Status
  status VARCHAR(50) DEFAULT 'pending_compliance' CHECK (status IN (
    'pending_compliance',    -- Invitation sent, awaiting portal submission
    'compliance_submitted',  -- Documents submitted, awaiting review
    'active',               -- Approved and active
    'inactive'              -- Deactivated/left company
  )),

  -- Compliance Tracking
  compliance_submitted BOOLEAN DEFAULT FALSE,
  compliance_submitted_at TIMESTAMP,
  compliance_approved BOOLEAN DEFAULT FALSE,
  compliance_approved_at TIMESTAMP,

  -- Workspace Access (JSONB array of workspace permissions)
  workspace_access JSONB DEFAULT '[]'::jsonb,

  -- Created By (who initiated onboarding)
  created_by VARCHAR(100) DEFAULT 'liz',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for new_starters
CREATE INDEX idx_new_starters_pin ON new_starters(pin);
CREATE INDEX idx_new_starters_email ON new_starters(email);
CREATE INDEX idx_new_starters_status ON new_starters(status);
CREATE INDEX idx_new_starters_compliance_submitted ON new_starters(compliance_submitted);
CREATE INDEX idx_new_starters_created_at ON new_starters(created_at DESC);

-- Trigger for new_starters table
CREATE TRIGGER update_new_starters_updated_at
    BEFORE UPDATE ON new_starters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- TABLE 5: COMPLIANCE
-- Universal compliance tracking for all person types
-- ==============================================

CREATE TABLE IF NOT EXISTS compliance (
  id SERIAL PRIMARY KEY,

  -- Person Identification
  person_type VARCHAR(50) NOT NULL CHECK (person_type IN ('new_starter', 'reader', 'case_manager')),
  person_id INTEGER NOT NULL, -- Links to new_starters.id, readers.id, etc.
  person_name VARCHAR(255) NOT NULL,
  person_email VARCHAR(255) NOT NULL,

  -- Compliance Status
  compliance_status VARCHAR(50) DEFAULT 'pending' CHECK (compliance_status IN (
    'pending',
    'submitted',
    'under_review',
    'approved',
    'rejected',
    'expired'
  )),

  -- Document Tracking (JSONB for flexibility)
  identity_documents JSONB DEFAULT '[]'::jsonb, -- Array of file paths
  utility_bills JSONB DEFAULT '[]'::jsonb,
  qualifications JSONB DEFAULT '[]'::jsonb,

  -- Reference Details (JSONB)
  professional_reference_details JSONB,
  character_reference_details JSONB,

  -- DBS/PVG Checks
  dbs_number VARCHAR(100),
  dbs_issue_date DATE,
  pvg_number VARCHAR(100),
  pvg_issue_date DATE,

  -- Review Process
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  approved_at TIMESTAMP,
  reviewed_by VARCHAR(100), -- 'Liz' or other approver
  notes TEXT, -- Reviewer notes

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for compliance
CREATE INDEX idx_compliance_person_type ON compliance(person_type);
CREATE INDEX idx_compliance_person_id ON compliance(person_id);
CREATE INDEX idx_compliance_status ON compliance(compliance_status);
CREATE INDEX idx_compliance_submitted_at ON compliance(submitted_at DESC);

-- Trigger for compliance table
CREATE TRIGGER update_compliance_updated_at
    BEFORE UPDATE ON compliance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- SCHEMA COMPLETE ✅
-- ==============================================
-- Next Steps:
-- 1. Run this SQL file to create qolae_hrcompliance database
-- 2. Update readers table in qolae_readers with compliance flags
-- 3. Create readers-compliance.ejs (reader submission form) ✅ COMPLETE
-- 4. Create newStarter-compliance.ejs (new starter submission form) ✅ COMPLETE
-- 5. Create reference-form.ejs (referee form)
-- 6. Create hrComplianceRoutes.js in Case Managers Dashboard
-- 7. Add compliance check middleware in Readers Dashboard
-- ==============================================

