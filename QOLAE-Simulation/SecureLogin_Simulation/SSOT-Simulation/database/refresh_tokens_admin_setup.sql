-- Refresh Tokens and Session Management Setup for qolae_admin
-- Database: qolae_admin
-- Purpose: Track refresh tokens and session extensions for SSOT authentication

-- 1. Refresh tokens table (for tracking and revocation)
CREATE TABLE IF NOT EXISTS "RefreshToken" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin TEXT NOT NULL,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE, -- Hashed refresh token for security
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW(),
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revoked_reason TEXT, -- 'logout', 'expired', 'security', 'manual'
    
    -- Session tracking for 12-hour maximum
    session_started_at TIMESTAMP DEFAULT NOW(),
    total_session_time INTEGER DEFAULT 0, -- Total seconds in this session
    extension_count INTEGER DEFAULT 0, -- Number of extensions used
    
    -- Security tracking
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT -- Optional: for device tracking
);

-- 2. Session extensions table (for detailed tracking)
CREATE TABLE IF NOT EXISTS "SessionExtension" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refresh_token_id UUID REFERENCES "RefreshToken"(id) ON DELETE CASCADE,
    pin TEXT NOT NULL,
    extension_reason TEXT NOT NULL, -- 'activity', 'manual', 'workflow'
    extension_duration INTEGER NOT NULL, -- Seconds extended
    total_session_time INTEGER NOT NULL, -- Total session time after extension
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Context for extension
    workflow_step TEXT, -- Which workflow step triggered extension
    user_activity TEXT, -- Description of user activity
    ip_address INET,
    user_agent TEXT
);

-- 3. Token refresh events table (for audit trail)
CREATE TABLE IF NOT EXISTS "TokenRefreshEvent" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refresh_token_id UUID REFERENCES "RefreshToken"(id) ON DELETE CASCADE,
    pin TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'refresh', 'expired', 'revoked', 'created'
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_duration INTEGER -- Milliseconds for performance tracking
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "RefreshToken_pin_idx" ON "RefreshToken"("pin");
CREATE INDEX IF NOT EXISTS "RefreshToken_token_hash_idx" ON "RefreshToken"("token_hash");
CREATE INDEX IF NOT EXISTS "RefreshToken_expires_at_idx" ON "RefreshToken"("expires_at");
CREATE INDEX IF NOT EXISTS "RefreshToken_active_idx" ON "RefreshToken"("pin", "is_revoked") WHERE "is_revoked" = FALSE;
CREATE INDEX IF NOT EXISTS "RefreshToken_session_idx" ON "RefreshToken"("session_started_at");

CREATE INDEX IF NOT EXISTS "SessionExtension_refresh_token_id_idx" ON "SessionExtension"("refresh_token_id");
CREATE INDEX IF NOT EXISTS "SessionExtension_pin_idx" ON "SessionExtension"("pin");
CREATE INDEX IF NOT EXISTS "SessionExtension_created_at_idx" ON "SessionExtension"("created_at");

CREATE INDEX IF NOT EXISTS "TokenRefreshEvent_refresh_token_id_idx" ON "TokenRefreshEvent"("refresh_token_id");
CREATE INDEX IF NOT EXISTS "TokenRefreshEvent_pin_idx" ON "TokenRefreshEvent"("pin");
CREATE INDEX IF NOT EXISTS "TokenRefreshEvent_event_type_idx" ON "TokenRefreshEvent"("event_type");
CREATE INDEX IF NOT EXISTS "TokenRefreshEvent_created_at_idx" ON "TokenRefreshEvent"("created_at");
