-- Lawyers Dashboard Database Setup
-- Database: qolae_lawyers
-- Purpose: Separate database for Lawyers Dashboard workflow (NOT schema-based)

-- Note: This script should be run AFTER creating the database:
-- CREATE DATABASE qolae_lawyers;
-- \c qolae_lawyers;

-- 1. Lawyers table (core lawyer information)
CREATE TABLE IF NOT EXISTS lawyers (
    id SERIAL PRIMARY KEY,
    pin VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    law_firm VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    workflow_stage INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Cases table (client/patient cases)
CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    lawyer_id INTEGER REFERENCES lawyers(id),
    client_name VARCHAR(255) NOT NULL,
    client_dob DATE,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    client_address TEXT,
    workflow_stage INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. WebAuthn authentication tables
CREATE TABLE IF NOT EXISTS lawyers_keys (
    id SERIAL PRIMARY KEY,
    pin VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_challenges (
    id SERIAL PRIMARY KEY,
    pin VARCHAR(50) NOT NULL,
    challenge TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Email verification table
CREATE TABLE IF NOT EXISTS email_verification (
    id SERIAL PRIMARY KEY,
    pin VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- 5. Workflow stages tracking
CREATE TABLE IF NOT EXISTS workflow_stages (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id),
    stage_number INTEGER NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    data JSONB, -- Store stage-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id),
    document_type VARCHAR(50) NOT NULL, -- 'tob', 'consent', 'medical', etc.
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    encrypted BOOLEAN DEFAULT TRUE
);

-- 7. Consent forms table
CREATE TABLE IF NOT EXISTS consent_forms (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id),
    client_name VARCHAR(255) NOT NULL,
    client_dob DATE,
    client_address TEXT,
    client_phone VARCHAR(50),
    client_email VARCHAR(255),
    ina_consent BOOLEAN,
    progress_review_consent BOOLEAN,
    medical_records_consent BOOLEAN,
    healthcare_communication_consent BOOLEAN,
    legal_reporting_consent BOOLEAN,
    data_protection_consent BOOLEAN,
    withdrawal_rights_consent BOOLEAN,
    recordings_consent BOOLEAN,
    reports_consent BOOLEAN,
    declaration_consent BOOLEAN,
    client_signature TEXT,
    client_signature_date DATE,
    witness_name VARCHAR(255),
    witness_relationship VARCHAR(255),
    witness_signature TEXT,
    witness_signature_date DATE,
    case_manager_name VARCHAR(255),
    case_manager_signature TEXT,
    case_manager_signature_date DATE,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'signed', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    lawyer_id INTEGER REFERENCES lawyers(id),
    case_id INTEGER REFERENCES cases(id),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Lawyer signatures table (GDPR-compliant signature storage)
CREATE TABLE IF NOT EXISTS lawyer_signatures (
    id SERIAL PRIMARY KEY,
    lawyer_id INTEGER REFERENCES lawyers(id) ON DELETE CASCADE,
    pin VARCHAR(50) NOT NULL,
    signature_data TEXT NOT NULL, -- Encrypted base64 signature data
    signature_type VARCHAR(50) DEFAULT 'professional', -- 'professional', 'tob', 'consent'
    file_path VARCHAR(500), -- Optional: path to signature file on disk
    is_active BOOLEAN DEFAULT TRUE, -- Allow multiple signatures, mark active one
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- GDPR compliance fields
    consent_given BOOLEAN DEFAULT TRUE,
    retention_until DATE, -- Auto-delete after this date
    purpose TEXT DEFAULT 'Document signing for legal proceedings',

    -- Security and audit
    encrypted BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0
);

-- 10. Payment tracking table (for future use)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id),
    lawyer_id INTEGER REFERENCES lawyers(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(50) DEFAULT 'direct_banking',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    qbo_invoice_id VARCHAR(100), -- QuickBooks Online invoice ID
    payment_reference VARCHAR(255),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lawyers_pin ON lawyers (pin);
CREATE INDEX IF NOT EXISTS idx_lawyers_email ON lawyers (email);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer_id ON cases (lawyer_id);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_case_id ON workflow_stages (case_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents (case_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_case_id ON consent_forms (case_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_lawyer_id ON audit_logs (lawyer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_case_id ON audit_logs (case_id);
CREATE INDEX IF NOT EXISTS idx_lawyers_keys_pin ON lawyers_keys (pin);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_pin ON auth_challenges (pin);
CREATE INDEX IF NOT EXISTS idx_email_verification_pin ON email_verification (pin);
CREATE INDEX IF NOT EXISTS idx_lawyer_signatures_pin ON lawyer_signatures (pin);
CREATE INDEX IF NOT EXISTS idx_lawyer_signatures_lawyer_id ON lawyer_signatures (lawyer_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_signatures_active ON lawyer_signatures (pin, is_active) WHERE is_active = TRUE;

-- Grant permissions to lawyers_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lawyers_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lawyers_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO lawyers_user; 