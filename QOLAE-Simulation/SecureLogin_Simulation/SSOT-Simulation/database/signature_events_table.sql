-- Signature Events Table Creation (UNLESS it already exists on live server)
-- Database: qolae_lawyers
-- Purpose: Create signature_events table for audit trail of signature operations

-- Create signature_events table for tracking signature-related actions (if not exists)
CREATE TABLE IF NOT EXISTS signature_events (
    id SERIAL PRIMARY KEY,
    lawyer_id INTEGER REFERENCES lawyers(id) ON DELETE CASCADE,
    signature_id INTEGER REFERENCES lawyer_signatures(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'signature_saved', 'signature_used', 'signature_deleted'
    metadata JSONB, -- Store event-specific data
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_signature_events_lawyer_id ON signature_events (lawyer_id);
CREATE INDEX IF NOT EXISTS idx_signature_events_signature_id ON signature_events (signature_id);
CREATE INDEX IF NOT EXISTS idx_signature_events_event_type ON signature_events (event_type);
CREATE INDEX IF NOT EXISTS idx_signature_events_created_at ON signature_events (created_at);

-- Grant permissions to lawyers_user
GRANT ALL PRIVILEGES ON TABLE signature_events TO lawyers_user;
GRANT ALL PRIVILEGES ON SEQUENCE signature_events_id_seq TO lawyers_user;

-- Add comment
COMMENT ON TABLE signature_events IS 'Audit trail for signature-related operations (GDPR compliant)';

PRINT '✅ Signature events table created successfully!';
