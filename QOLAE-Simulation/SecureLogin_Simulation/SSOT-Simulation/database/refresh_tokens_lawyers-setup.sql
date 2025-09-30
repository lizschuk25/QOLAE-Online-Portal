-- Refresh Tokens and Session Management Setup
-- Database: qolae_lawyers
-- Purpose: Track refresh tokens and session extensions for security and compliance

-- 1. Refresh tokens table (for tracking and revocation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    pin VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed refresh token for security
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(100), -- 'logout', 'expired', 'security', 'manual'
    
    -- Session tracking for 12-hour maximum
    session_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_session_time INTEGER DEFAULT 0, -- Total seconds in this session
    extension_count INTEGER DEFAULT 0, -- Number of extensions used
    
    -- Security tracking
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255), -- Optional: for device tracking
    
    -- GDPR compliance
    purpose TEXT DEFAULT 'Secure session management for legal document access',
    retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days') -- Auto-delete after 30 days
);

-- 2. Session extensions table (for detailed tracking)
CREATE TABLE IF NOT EXISTS session_extensions (
    id SERIAL PRIMARY KEY,
    refresh_token_id INTEGER REFERENCES refresh_tokens(id) ON DELETE CASCADE,
    pin VARCHAR(50) NOT NULL,
    extension_reason VARCHAR(100) NOT NULL, -- 'activity', 'manual', 'workflow'
    extension_duration INTEGER NOT NULL, -- Seconds extended
    total_session_time INTEGER NOT NULL, -- Total session time after extension
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Context for extension
    workflow_step VARCHAR(100), -- Which workflow step triggered extension
    user_activity TEXT, -- Description of user activity
    ip_address INET,
    user_agent TEXT
);

-- 3. Token refresh events table (for audit trail)
CREATE TABLE IF NOT EXISTS token_refresh_events (
    id SERIAL PRIMARY KEY,
    refresh_token_id INTEGER REFERENCES refresh_tokens(id) ON DELETE CASCADE,
    pin VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'refresh', 'expired', 'revoked', 'created'
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_duration INTEGER -- Milliseconds for performance tracking
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_pin ON refresh_tokens (pin);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active ON refresh_tokens (pin, is_revoked) WHERE is_revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session ON refresh_tokens (session_started_at);

CREATE INDEX IF NOT EXISTS idx_session_extensions_refresh_token_id ON session_extensions (refresh_token_id);
CREATE INDEX IF NOT EXISTS idx_session_extensions_pin ON session_extensions (pin);
CREATE INDEX IF NOT EXISTS idx_session_extensions_created_at ON session_extensions (created_at);

CREATE INDEX IF NOT EXISTS idx_token_refresh_events_refresh_token_id ON token_refresh_events (refresh_token_id);
CREATE INDEX IF NOT EXISTS idx_token_refresh_events_pin ON token_refresh_events (pin);
CREATE INDEX IF NOT EXISTS idx_token_refresh_events_event_type ON token_refresh_events (event_type);
CREATE INDEX IF NOT EXISTS idx_token_refresh_events_created_at ON token_refresh_events (created_at);

-- Grant permissions to lawyers_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lawyers_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lawyers_user;
