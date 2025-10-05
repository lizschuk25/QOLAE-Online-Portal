-- TOB Workflow Columns Migration
-- Database: qolae_lawyers
-- Purpose: Add missing columns for TOB (Terms of Business) workflow to lawyers table

-- Add missing columns to lawyers table for TOB workflow (clean column approach)
ALTER TABLE lawyers 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_preference VARCHAR(10),
ADD COLUMN IF NOT EXISTS tob_step_1_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS tob_step_2_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS tob_step_3_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS tob_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tob_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS tob_viewed_details BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Update workflow_stage to VARCHAR type to support string values instead of INTEGER
ALTER TABLE lawyers 
ALTER COLUMN workflow_stage TYPE VARCHAR(50);

-- Set default value for workflow_stage
ALTER TABLE lawyers 
ALTER COLUMN workflow_stage SET DEFAULT 'pending';

-- Add indexes for the new columns for better performance
CREATE INDEX IF NOT EXISTS idx_lawyers_email_preference ON lawyers (email_preference);
CREATE INDEX IF NOT EXISTS idx_lawyers_tob_completed ON lawyers (tob_completed);
CREATE INDEX IF NOT EXISTS idx_lawyers_tob_step_1 ON lawyers (tob_step_1_completed_at);
CREATE INDEX IF NOT EXISTS idx_lawyers_tob_step_2 ON lawyers (tob_step_2_completed_at);
CREATE INDEX IF NOT EXISTS idx_lawyers_tob_step_3 ON lawyers (tob_step_3_completed_at);
CREATE INDEX IF NOT EXISTS idx_lawyers_password_setup ON lawyers (password_setup_completed);

-- Update any existing workflow_stage values from INTEGER to VARCHAR
UPDATE lawyers 
SET workflow_stage = CASE 
    WHEN workflow_stage::INTEGER = 1 THEN 'pending'
    WHEN workflow_stage::INTEGER = 2 THEN 'setup_required'
    WHEN workflow_stage::INTEGER = 3 THEN 'active'
    WHEN workflow_stage::INTEGER = 4 THEN 'completed'
    ELSE 'pending'
END 
WHERE workflow_stage ~ '^[0-9]+$'; -- Only update numeric values

-- Add comment to document the new columns
COMMENT ON COLUMN lawyers.email_preference IS 'User preference for email notifications (yes/no)';
COMMENT ON COLUMN lawyers.tob_step_1_completed_at IS 'Timestamp when Step 1 (Email Preferences) was completed';
COMMENT ON COLUMN lawyers.tob_step_2_completed_at IS 'Timestamp when Step 2 (Digital Signature) was completed';
COMMENT ON COLUMN lawyers.tob_step_3_completed_at IS 'Timestamp when Step 3 (Document Preview) was completed';
COMMENT ON COLUMN lawyers.tob_completed IS 'Boolean flag indicating if TOB workflow is fully completed';
COMMENT ON COLUMN lawyers.tob_completed_at IS 'Timestamp when TOB workflow was completed';
-- Using clean column approach instead of JSONB step_data
COMMENT ON COLUMN lawyers.password_setup_completed IS 'Boolean flag indicating if password setup is completed';

SELECT '✅ Migration completed successfully! Added TOB workflow columns to lawyers table.' as status;
