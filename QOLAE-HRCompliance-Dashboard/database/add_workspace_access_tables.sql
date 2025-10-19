-- ==============================================
-- QOLAE HR COMPLIANCE DASHBOARD
-- DATABASE: qolae_casemanagers
-- MIGRATION: Add Workspace Access Tables
-- DATE: October 19, 2025
-- PURPOSE: Create tables for flexible workspace access control
-- ==============================================

-- Run on qolae_casemanagers database

-- ==============================================
-- TABLE 1: case_managers
-- PURPOSE: Master registry of case managers with compliance tracking
-- ==============================================
CREATE TABLE IF NOT EXISTS case_managers (
    id SERIAL PRIMARY KEY,
    pin VARCHAR(20) UNIQUE NOT NULL,        -- NS-LC123456 from new_starters
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,    -- Hashed password from 2FA
    status VARCHAR(50) DEFAULT 'pending',   -- pending → approved → active
    compliance_approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- TABLE 2: workspace_access_rules
-- PURPOSE: Granular feature-level access control for case managers
-- ==============================================
CREATE TABLE IF NOT EXISTS workspace_access_rules (
    id SERIAL PRIMARY KEY,
    case_manager_pin VARCHAR(20) REFERENCES case_managers(pin),
    feature VARCHAR(100),                   -- 'create_case', 'edit_case', 'view_reports', etc.
    access_level VARCHAR(50),               -- 'full', 'limited', 'read_only', 'none'
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- INDEXES: Fast lookups on PIN columns
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_case_managers_pin ON case_managers(pin);
CREATE INDEX IF NOT EXISTS idx_workspace_rules_pin ON workspace_access_rules(case_manager_pin);

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================
