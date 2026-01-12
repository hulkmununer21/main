-- Migration: Add Account Suspension Tracking
-- Date: 2026-01-12
-- Description: Adds suspension metadata tracking (uses existing is_active/is_verified fields)

BEGIN;

-- Add suspension tracking metadata to profile tables (excluding admin)
-- Note: Using existing is_active for staff/lodger/service_user, is_verified for landlord

ALTER TABLE staff_profiles 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE lodger_profiles 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE landlord_profiles 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE service_user_profiles 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create suspension audit log
CREATE TABLE IF NOT EXISTS account_suspension_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('suspended', 'reactivated')),
    performed_by UUID NOT NULL,
    performed_by_name VARCHAR(255),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_suspension_logs_user_id ON account_suspension_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_suspension_logs_created_at ON account_suspension_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suspension_logs_action ON account_suspension_logs(action);

-- Add comments
COMMENT ON TABLE account_suspension_logs IS 'Audit trail for account suspension and reactivation actions';
COMMENT ON COLUMN account_suspension_logs.action IS 'Type of action: suspended or reactivated';
COMMENT ON COLUMN account_suspension_logs.performed_by IS 'Admin who performed the action';

COMMIT;
