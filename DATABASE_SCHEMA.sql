-- ============================================================================
-- DOMUS SERVITIA - PRODUCTION DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0
-- Database: PostgreSQL (Supabase)
-- Created: December 9, 2025
-- 
-- This schema supports a comprehensive property management system with:
-- - Multi-role user management (Admin, Staff, Landlord, Lodger, Service User)
-- - Property and room management
-- - Tenancy tracking
-- - Payment processing
-- - Bin rotation management
-- - Inspection scheduling
-- - Complaint management
-- - Document management
-- - Maintenance requests
-- - Messaging system
-- - Notifications (SMS, Email, In-app)
-- - Audit logging
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'staff', 'landlord', 'lodger', 'service_user');
CREATE TYPE property_status AS ENUM ('active', 'inactive', 'under_maintenance', 'pending_approval');
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'under_maintenance', 'reserved');
CREATE TYPE tenancy_status AS ENUM ('active', 'pending', 'ended', 'terminated', 'notice_given');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'partially_paid', 'overdue');
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'cash', 'card', 'direct_debit', 'standing_order');
CREATE TYPE payment_type AS ENUM ('rent', 'deposit', 'extra_charge', 'utility', 'maintenance', 'service_fee', 'refund');
CREATE TYPE charge_type AS ENUM ('bin_duty_missed', 'damage', 'late_payment', 'cleaning', 'key_replacement', 'breach_of_contract', 'utility_overage', 'other');
CREATE TYPE charge_status AS ENUM ('pending', 'paid', 'disputed', 'waived', 'overdue');
CREATE TYPE inspection_type AS ENUM ('routine', 'move_in', 'move_out', 'complaint_followup', 'maintenance_check', 'safety_check');
CREATE TYPE inspection_status AS ENUM ('scheduled', 'in_progress', 'completed', 'issues_found', 'passed', 'failed', 'cancelled');
CREATE TYPE bin_type AS ENUM ('general', 'recycling', 'garden', 'food');
CREATE TYPE bin_duty_status AS ENUM ('assigned', 'completed', 'missed', 'excused');
CREATE TYPE complaint_category AS ENUM ('maintenance', 'service_quality', 'communication', 'billing', 'property_condition', 'staff_conduct', 'noise', 'cleanliness', 'safety', 'other');
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE complaint_status AS ENUM ('submitted', 'under_review', 'in_progress', 'resolved', 'closed', 'escalated');
CREATE TYPE document_type AS ENUM ('tenancy_agreement', 'id_verification', 'reference_letter', 'compliance_certificate', 'gas_safety', 'electrical_safety', 'epc', 'inventory_report', 'insurance', 'passport', 'driving_license', 'bank_statement', 'utility_bill', 'other');
CREATE TYPE document_status AS ENUM ('valid', 'expiring_soon', 'expired', 'pending_review', 'rejected', 'archived');
CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'emergency');
CREATE TYPE maintenance_status AS ENUM ('submitted', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled');
CREATE TYPE task_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold');
CREATE TYPE notification_type AS ENUM ('sms', 'email', 'in_app', 'push');
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read', 'archived');
CREATE TYPE log_level AS ENUM ('info', 'warning', 'error', 'critical');

-- ============================================================================
-- CORE USER TABLES
-- ============================================================================

-- User Roles (links to Supabase Auth users)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Admin Profiles
CREATE TABLE admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    is_super_admin BOOLEAN DEFAULT false,
    avatar_url TEXT,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Staff Profiles
CREATE TABLE staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    position VARCHAR(100),
    employee_id VARCHAR(50) UNIQUE,
    hire_date DATE,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Landlord Profiles
CREATE TABLE landlord_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company_name VARCHAR(255),
    company_registration VARCHAR(50),
    tax_id VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    postcode VARCHAR(20),
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_sort_code VARCHAR(20),
    preferred_payment_method payment_method,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Lodger Profiles
CREATE TABLE lodger_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    nationality VARCHAR(100),
    passport_number VARCHAR(50),
    ni_number VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    current_address TEXT,
    city VARCHAR(100),
    postcode VARCHAR(20),
    previous_address TEXT,
    employment_status VARCHAR(50),
    employer_name VARCHAR(255),
    employer_contact VARCHAR(20),
    monthly_income DECIMAL(10,2),
    avatar_url TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Service User Profiles (External contractors/cleaners/maintenance)
CREATE TABLE service_user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company_name VARCHAR(255),
    service_type VARCHAR(100), -- 'cleaning', 'maintenance', 'inspection', 'gardening', etc.
    certification_number VARCHAR(50),
    insurance_expiry DATE,
    hourly_rate DECIMAL(10,2),
    rating DECIMAL(3,2), -- Average rating out of 5
    total_jobs INTEGER DEFAULT 0,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================================
-- PROPERTY MANAGEMENT
-- ============================================================================

-- Properties
CREATE TABLE properties (
    
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landlord_id UUID NOT NULL REFERENCES landlord_profiles(id) ON DELETE RESTRICT,
    property_name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    county VARCHAR(100),
    postcode VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'United Kingdom',
    property_type VARCHAR(50), -- 'house', 'flat', 'studio', 'apartment', etc.
    total_rooms INTEGER NOT NULL,
    total_bathrooms INTEGER,
    total_floors INTEGER,
    parking_available BOOLEAN DEFAULT false,
    garden_available BOOLEAN DEFAULT false,
    furnished BOOLEAN DEFAULT true,
    pet_friendly BOOLEAN DEFAULT false,
    smoking_allowed BOOLEAN DEFAULT false,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    epc_rating VARCHAR(2), -- A-G
    epc_expiry DATE,
    gas_safety_expiry DATE,
    electrical_safety_expiry DATE,
    property_status property_status DEFAULT 'active',
    monthly_service_charge DECIMAL(10,2),
    council_tax_band VARCHAR(2),
    bin_collection_day VARCHAR(20), -- 'Monday', 'Tuesday', etc.
    notes TEXT,
    images TEXT[], -- Array of image URLs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    room_name VARCHAR(100),
    floor_number INTEGER,
    room_type VARCHAR(50), -- 'single', 'double', 'ensuite', 'studio', etc.
    size_sqm DECIMAL(6,2),
    has_ensuite BOOLEAN DEFAULT false,
    has_window BOOLEAN DEFAULT true,
    furnished BOOLEAN DEFAULT true,
    monthly_rent DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL,
    room_status room_status DEFAULT 'available',
    available_from DATE,
    features TEXT[], -- Array of features ['desk', 'wardrobe', 'tv', etc.]
    images TEXT[], -- Array of image URLs
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(property_id, room_number)
);

CREATE TABLE bin_duty_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    lodger_id UUID REFERENCES lodger_profiles(id) ON DELETE SET NULL,
    duty_date DATE NOT NULL,
    status bin_duty_status NOT NULL, -- assigned, completed, missed, excused
    completed_by UUID REFERENCES lodger_profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    missed_reason TEXT,
    charge_applied BOOLEAN DEFAULT FALSE,
    charge_id UUID REFERENCES extra_charges(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Property Assignments
CREATE TABLE staff_property_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    role VARCHAR(100), -- 'property_manager', 'cleaner', 'maintenance', etc.
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, property_id)
);

-- ============================================================================
-- TENANCY MANAGEMENT
-- ============================================================================

-- Tenancies
CREATE TABLE tenancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lodger_id UUID NOT NULL REFERENCES lodger_profiles(id) ON DELETE RESTRICT,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    tenancy_agreement_doc_id UUID, -- Link to documents table
    start_date DATE NOT NULL,
    end_date DATE,
    notice_period_days INTEGER DEFAULT 30,
    notice_given_date DATE,
    monthly_rent DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL,
    deposit_paid BOOLEAN DEFAULT false,
    deposit_held_by VARCHAR(100), -- 'DPS', 'TDS', 'MyDeposits', etc.
    deposit_scheme_reference VARCHAR(100),
    rent_due_day INTEGER NOT NULL DEFAULT 1, -- Day of month rent is due
    payment_method payment_method,
    utilities_included BOOLEAN DEFAULT false,
    internet_included BOOLEAN DEFAULT true,
    tenancy_status tenancy_status DEFAULT 'pending',
    move_in_inspection_id UUID, -- Link to inspections table
    move_out_inspection_id UUID, -- Link to inspections table
    special_terms TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FINANCIAL MANAGEMENT
-- ============================================================================

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
    lodger_id UUID NOT NULL REFERENCES lodger_profiles(id) ON DELETE RESTRICT,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    payment_type payment_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method,
    payment_reference VARCHAR(100) UNIQUE,
    transaction_id VARCHAR(255),
    payment_date DATE NOT NULL,
    due_date DATE,
    payment_status payment_status DEFAULT 'pending',
    processed_by UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
    receipt_url TEXT,
    invoice_url TEXT,
    notes TEXT,
    metadata JSONB, -- For storing additional payment gateway data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extra Charges
CREATE TABLE extra_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lodger_id UUID NOT NULL REFERENCES lodger_profiles(id) ON DELETE RESTRICT,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
    charge_type charge_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    charge_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    charge_status charge_status DEFAULT 'pending',
    reason TEXT NOT NULL,
    evidence_urls TEXT[], -- Photos/documents supporting the charge
    dispute_notes TEXT,
    approved_by UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    bin_duty_id UUID, -- If related to missed bin duty
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BIN MANAGEMENT SYSTEM
-- ============================================================================

-- Bin Collection Schedules (Council collection days)
CREATE TABLE bin_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    bin_type bin_type NOT NULL,
    collection_day VARCHAR(20) NOT NULL, -- 'Monday', 'Tuesday', etc.
    collection_frequency VARCHAR(50), -- 'weekly', 'fortnightly', 'monthly'
    next_collection_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bin Rotation (Weekly in-house rotation among lodgers)
CREATE TABLE bin_rotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    lodger_id UUID NOT NULL REFERENCES lodger_profiles(id) ON DELETE CASCADE,
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
    week_starting DATE NOT NULL,
    week_ending DATE NOT NULL,
    bin_duty_status bin_duty_status DEFAULT 'assigned',
    completed_at TIMESTAMPTZ,
    evidence_photo_url TEXT,
    verified_by UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    missed_reason TEXT,
    charge_applied BOOLEAN DEFAULT false,
    extra_charge_id UUID REFERENCES extra_charges(id) ON DELETE SET NULL,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INSPECTION MANAGEMENT
-- ============================================================================

-- Inspections
CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
    inspector_id UUID, -- Can be staff_id or service_user_id
    inspector_type VARCHAR(20), -- 'staff' or 'service_user'
    inspection_type inspection_type NOT NULL,
    scheduled_date TIMESTAMPTZ NOT NULL,
    completed_date TIMESTAMPTZ,
    inspection_status inspection_status DEFAULT 'scheduled',
    overall_rating VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'
    passed BOOLEAN,
    checklist JSONB, -- Array of checklist items with status
    photos TEXT[], -- Array of photo URLs
    issues_found TEXT[],
    recommendations TEXT[],
    overall_notes TEXT,
    next_inspection_date DATE,
    report_url TEXT,
    created_by UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cleaning Records (Can be part of inspections or standalone)
CREATE TABLE cleaning_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    cleaner_id UUID, -- staff_id or service_user_id
    cleaner_type VARCHAR(20), -- 'staff' or 'service_user'
    cleaning_date TIMESTAMPTZ NOT NULL,
    cleaning_type VARCHAR(50), -- 'routine', 'deep_clean', 'move_out', 'emergency'
    areas_cleaned TEXT[], -- Array of areas
    tasks_completed TEXT[], -- Array of tasks
    products_used TEXT[],
    time_taken_minutes INTEGER,
    before_photos TEXT[],
    after_photos TEXT[],
    cost DECIMAL(10,2),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meter Readings (Utilities tracking)
CREATE TABLE meter_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    meter_type VARCHAR(50) NOT NULL, -- 'electricity', 'gas', 'water'
    reading_value DECIMAL(10,2) NOT NULL,
    reading_date DATE NOT NULL,
    read_by UUID, -- lodger_id or staff_id
    reader_type VARCHAR(20), -- 'lodger', 'staff'
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COMPLAINT MANAGEMENT
-- ============================================================================

-- Complaints
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lodger_id UUID NOT NULL REFERENCES lodger_profiles(id) ON DELETE RESTRICT,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
    complaint_category complaint_category NOT NULL,
    priority complaint_priority DEFAULT 'medium',
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    complaint_status complaint_status DEFAULT 'submitted',
    submitted_date TIMESTAMPTZ DEFAULT NOW(),
    assigned_to UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    assigned_date TIMESTAMPTZ,
    resolution_date TIMESTAMPTZ,
    resolution_notes TEXT,
    evidence_urls TEXT[], -- Photos/documents
    internal_notes TEXT, -- Staff-only notes
    lodger_satisfaction INTEGER CHECK (lodger_satisfaction >= 1 AND lodger_satisfaction <= 5),
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    escalated BOOLEAN DEFAULT false,
    escalated_to UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
    escalated_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaint Updates (Thread/history)
CREATE TABLE complaint_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type user_role NOT NULL,
    update_text TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- Internal notes vs. visible to lodger
    attachments TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DOCUMENT MANAGEMENT
-- ============================================================================

-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    lodger_id UUID REFERENCES lodger_profiles(id) ON DELETE SET NULL,
    landlord_id UUID REFERENCES landlord_profiles(id) ON DELETE SET NULL,
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    uploader_type user_role NOT NULL,
    document_type document_type NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    document_status document_status DEFAULT 'valid',
    uploaded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    renewal_reminder_sent BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
    verified_date TIMESTAMPTZ,
    rejection_reason TEXT,
    version INTEGER DEFAULT 1,
    replaces_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MAINTENANCE MANAGEMENT
-- ============================================================================

-- Maintenance Requests
CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    lodger_id UUID REFERENCES lodger_profiles(id) ON DELETE SET NULL,
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
    issue_title VARCHAR(255) NOT NULL,
    issue_description TEXT NOT NULL,
    maintenance_priority maintenance_priority DEFAULT 'medium',
    maintenance_status maintenance_status DEFAULT 'submitted',
    reported_date TIMESTAMPTZ DEFAULT NOW(),
    assigned_to UUID, -- staff_id or service_user_id
    assignee_type VARCHAR(20), -- 'staff' or 'service_user'
    assigned_date TIMESTAMPTZ,
    scheduled_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    evidence_photos TEXT[], -- Before photos
    completion_photos TEXT[], -- After photos
    work_description TEXT,
    parts_used TEXT[],
    time_taken_hours DECIMAL(5,2),
    lodger_rating INTEGER CHECK (lodger_rating >= 1 AND lodger_rating <= 5),
    notes TEXT,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SERVICE USER TASK MANAGEMENT
-- ============================================================================

-- Service User Tasks
CREATE TABLE service_user_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_user_id UUID NOT NULL REFERENCES service_user_profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    task_type VARCHAR(100) NOT NULL, -- 'cleaning', 'inspection', 'maintenance', 'gardening', etc.
    task_title VARCHAR(255) NOT NULL,
    task_description TEXT,
    task_status task_status DEFAULT 'pending',
    assigned_by UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    assigned_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    started_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    estimated_duration_hours DECIMAL(5,2),
    actual_duration_hours DECIMAL(5,2),
    cost DECIMAL(10,2),
    checklist JSONB, -- Array of subtasks
    before_photos TEXT[],
    after_photos TEXT[],
    notes TEXT,
    completion_notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service User Uploads (Reports, certifications, etc.)
CREATE TABLE service_user_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_user_id UUID NOT NULL REFERENCES service_user_profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES service_user_tasks(id) ON DELETE CASCADE,
    upload_type VARCHAR(100), -- 'report', 'certificate', 'invoice', 'photo', etc.
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    description TEXT,
    uploaded_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MESSAGING SYSTEM
-- ============================================================================

-- Messages (Internal messaging between users)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type user_role NOT NULL,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_type user_role NOT NULL,
    subject VARCHAR(255),
    message_body TEXT NOT NULL,
    message_status message_status DEFAULT 'sent',
    read_at TIMESTAMPTZ,
    replied_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
    attachments TEXT[],
    is_system_message BOOLEAN DEFAULT false,
    priority notification_priority DEFAULT 'medium',
    archived_by_sender BOOLEAN DEFAULT false,
    archived_by_recipient BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATION SYSTEM
-- ============================================================================

-- Notifications (SMS, Email, In-app, Push)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    priority notification_priority DEFAULT 'medium',
    subject VARCHAR(255),
    message_body TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed BOOLEAN DEFAULT false,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    related_entity_type VARCHAR(50), -- 'payment', 'inspection', 'complaint', etc.
    related_entity_id UUID,
    metadata JSONB, -- For storing gateway-specific data
    cost DECIMAL(6,4), -- Cost of sending (for SMS)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(100) UNIQUE NOT NULL,
    template_type notification_type NOT NULL,
    subject VARCHAR(255),
    body_template TEXT NOT NULL, -- Can use placeholders like {{lodger_name}}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROLE-BASED ACCESS CONTROL (RBAC)
-- ============================================================================

-- Roles (Predefined roles)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name user_role UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT true, -- System roles can't be deleted
    user_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(100) NOT NULL, -- 'users', 'properties', 'inspections', etc.
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Permissions (Many-to-many)
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

-- System Settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50), -- 'string', 'number', 'boolean', 'json'
    category VARCHAR(100), -- 'billing', 'notifications', 'maintenance', etc.
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Can be accessed by non-admin users
    updated_by UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Alerts (Real-time alerts for admins/staff)
CREATE TABLE system_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(100) NOT NULL, -- 'payment_overdue', 'document_expiring', 'complaint_escalated', etc.
    alert_title VARCHAR(255) NOT NULL,
    alert_message TEXT NOT NULL,
    severity VARCHAR(20), -- 'info', 'warning', 'error', 'critical'
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUDIT & LOGGING
-- ============================================================================

-- System Logs (Audit trail)
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_type user_role,
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', etc.
    entity_type VARCHAR(100), -- 'lodger', 'payment', 'property', etc.
    entity_id UUID,
    log_level log_level DEFAULT 'info',
    message TEXT,
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    request_method VARCHAR(10),
    response_status INTEGER,
    metadata JSONB, -- Additional context data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity History (User-friendly activity feed)
CREATE TABLE activity_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- 'payment_made', 'inspection_completed', etc.
    activity_title VARCHAR(255) NOT NULL,
    activity_description TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    icon VARCHAR(50), -- Icon name for UI
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- User indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_lodger_profiles_user_id ON lodger_profiles(user_id);
CREATE INDEX idx_lodger_profiles_email ON lodger_profiles(email);
CREATE INDEX idx_staff_profiles_user_id ON staff_profiles(user_id);
CREATE INDEX idx_landlord_profiles_user_id ON landlord_profiles(user_id);

-- Property indexes
CREATE INDEX idx_properties_landlord_id ON properties(landlord_id);
CREATE INDEX idx_properties_status ON properties(property_status);
CREATE INDEX idx_properties_postcode ON properties(postcode);
CREATE INDEX idx_rooms_property_id ON rooms(property_id);
CREATE INDEX idx_rooms_status ON rooms(room_status);

-- Tenancy indexes
CREATE INDEX idx_tenancies_lodger_id ON tenancies(lodger_id);
CREATE INDEX idx_tenancies_room_id ON tenancies(room_id);
CREATE INDEX idx_tenancies_property_id ON tenancies(property_id);
CREATE INDEX idx_tenancies_status ON tenancies(tenancy_status);
CREATE INDEX idx_tenancies_start_date ON tenancies(start_date);
CREATE INDEX idx_tenancies_end_date ON tenancies(end_date);

-- Payment indexes
CREATE INDEX idx_payments_lodger_id ON payments(lodger_id);
CREATE INDEX idx_payments_tenancy_id ON payments(tenancy_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_reference ON payments(payment_reference);

-- Charge indexes
CREATE INDEX idx_extra_charges_lodger_id ON extra_charges(lodger_id);
CREATE INDEX idx_extra_charges_status ON extra_charges(charge_status);
CREATE INDEX idx_extra_charges_charge_date ON extra_charges(charge_date);

-- Bin management indexes
CREATE INDEX idx_bin_schedules_property_id ON bin_schedules(property_id);
CREATE INDEX idx_bin_rotations_property_id ON bin_rotations(property_id);
CREATE INDEX idx_bin_rotations_lodger_id ON bin_rotations(lodger_id);
CREATE INDEX idx_bin_rotations_week_starting ON bin_rotations(week_starting);
CREATE INDEX idx_bin_rotations_status ON bin_rotations(bin_duty_status);

-- Inspection indexes
CREATE INDEX idx_inspections_property_id ON inspections(property_id);
CREATE INDEX idx_inspections_room_id ON inspections(room_id);
CREATE INDEX idx_inspections_status ON inspections(inspection_status);
CREATE INDEX idx_inspections_scheduled_date ON inspections(scheduled_date);
CREATE INDEX idx_cleaning_records_property_id ON cleaning_records(property_id);
CREATE INDEX idx_cleaning_records_cleaning_date ON cleaning_records(cleaning_date);

-- Complaint indexes
CREATE INDEX idx_complaints_lodger_id ON complaints(lodger_id);
CREATE INDEX idx_complaints_property_id ON complaints(property_id);
CREATE INDEX idx_complaints_status ON complaints(complaint_status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX idx_complaint_updates_complaint_id ON complaint_updates(complaint_id);

-- Document indexes
CREATE INDEX idx_documents_lodger_id ON documents(lodger_id);
CREATE INDEX idx_documents_property_id ON documents(property_id);
CREATE INDEX idx_documents_landlord_id ON documents(landlord_id);
CREATE INDEX idx_documents_status ON documents(document_status);
CREATE INDEX idx_documents_expiry_date ON documents(expiry_date);
CREATE INDEX idx_documents_uploaded_date ON documents(uploaded_date);

-- Maintenance indexes
CREATE INDEX idx_maintenance_property_id ON maintenance_requests(property_id);
CREATE INDEX idx_maintenance_lodger_id ON maintenance_requests(lodger_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(maintenance_status);
CREATE INDEX idx_maintenance_priority ON maintenance_requests(maintenance_priority);

-- Message indexes
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_status ON messages(message_status);

-- Notification indexes
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

-- Service user indexes
CREATE INDEX idx_service_user_tasks_service_user_id ON service_user_tasks(service_user_id);
CREATE INDEX idx_service_user_tasks_property_id ON service_user_tasks(property_id);
CREATE INDEX idx_service_user_tasks_status ON service_user_tasks(task_status);

-- System indexes
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_system_logs_action ON system_logs(action);
CREATE INDEX idx_system_logs_entity_type ON system_logs(entity_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlord_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lodger_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE bin_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bin_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_user_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;

-- Example RLS Policies (Add more specific policies as needed)

-- Lodgers can view their own profile
CREATE POLICY "Lodgers can view own profile" ON lodger_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Lodgers can update their own profile
CREATE POLICY "Lodgers can update own profile" ON lodger_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin and Staff can view all lodger profiles
CREATE POLICY "Admin and Staff can view all lodger profiles" ON lodger_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'staff')
        )
    );

-- Lodgers can view their own payments
CREATE POLICY "Lodgers can view own payments" ON payments
    FOR SELECT USING (
        lodger_id IN (
            SELECT id FROM lodger_profiles WHERE user_id = auth.uid()
        )
    );

-- Admin can view all data
CREATE POLICY "Admin full access" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON admin_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_profiles_updated_at BEFORE UPDATE ON staff_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_landlord_profiles_updated_at BEFORE UPDATE ON landlord_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lodger_profiles_updated_at BEFORE UPDATE ON lodger_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_user_profiles_updated_at BEFORE UPDATE ON service_user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenancies_updated_at BEFORE UPDATE ON tenancies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extra_charges_updated_at BEFORE UPDATE ON extra_charges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert default roles
INSERT INTO roles (role_name, display_name, description, is_system_role) VALUES
    ('admin', 'Administrator', 'Full system access and control', true),
    ('staff', 'Staff Member', 'Operational tasks and property management', true),
    ('landlord', 'Landlord', 'Property owner with portfolio management', true),
    ('lodger', 'Lodger', 'Tenant with personal account access', true),
    ('service_user', 'Service User', 'External contractor with task access', true);

-- Insert default permissions
INSERT INTO permissions (permission_name, module, description) VALUES
    -- User Management
    ('view_all_users', 'users', 'View all user accounts'),
    ('create_users', 'users', 'Create new user accounts'),
    ('edit_users', 'users', 'Edit user information'),
    ('delete_users', 'users', 'Delete user accounts'),
    ('suspend_users', 'users', 'Suspend/unsuspend user accounts'),
    
    -- Property Management
    ('view_all_properties', 'properties', 'View all properties'),
    ('view_own_properties', 'properties', 'View only owned properties'),
    ('add_properties', 'properties', 'Add new properties'),
    ('edit_properties', 'properties', 'Edit property details'),
    ('delete_properties', 'properties', 'Delete properties'),
    
    -- Inspections
    ('schedule_inspections', 'inspections', 'Schedule property inspections'),
    ('conduct_inspections', 'inspections', 'Conduct inspections'),
    ('view_inspection_reports', 'inspections', 'View inspection reports'),
    ('upload_inspection_photos', 'inspections', 'Upload inspection photos'),
    
    -- Bin Management
    ('set_bin_rotation', 'bin_management', 'Set bin duty rotation'),
    ('send_bin_reminders', 'bin_management', 'Send bin duty reminders'),
    ('view_bin_logs', 'bin_management', 'View bin duty logs'),
    ('apply_bin_charges', 'bin_management', 'Apply charges for missed duties'),
    
    -- Payments
    ('process_payments', 'payments', 'Process payment transactions'),
    ('view_all_payments', 'payments', 'View all payment data'),
    ('view_own_payments', 'payments', 'View own payment history'),
    ('generate_invoices', 'payments', 'Generate payment invoices'),
    ('add_charges', 'payments', 'Add extra charges'),
    
    -- Complaints
    ('view_all_complaints', 'complaints', 'View all complaints'),
    ('view_own_complaints', 'complaints', 'View own complaints'),
    ('submit_complaints', 'complaints', 'Submit new complaints'),
    ('assign_complaints', 'complaints', 'Assign complaints to staff'),
    ('resolve_complaints', 'complaints', 'Resolve complaints'),
    
    -- Documents
    ('upload_documents', 'documents', 'Upload documents'),
    ('view_all_documents', 'documents', 'View all documents'),
    ('view_own_documents', 'documents', 'View own documents'),
    ('delete_documents', 'documents', 'Delete documents'),
    ('verify_documents', 'documents', 'Verify document authenticity'),
    
    -- Notifications
    ('send_sms', 'notifications', 'Send SMS notifications'),
    ('send_emails', 'notifications', 'Send email notifications'),
    ('view_notification_logs', 'notifications', 'View notification history'),
    
    -- System
    ('view_system_logs', 'system', 'View system audit logs'),
    ('manage_system_settings', 'system', 'Manage system settings'),
    ('manage_roles', 'system', 'Manage roles and permissions');

-- Assign permissions to roles (Admin gets all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'admin';

-- Staff permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'staff'
AND p.permission_name IN (
    'view_all_users', 'view_all_properties', 'schedule_inspections', 'conduct_inspections',
    'view_inspection_reports', 'upload_inspection_photos', 'set_bin_rotation',
    'send_bin_reminders', 'view_bin_logs', 'apply_bin_charges', 'view_all_payments',
    'view_all_complaints', 'assign_complaints', 'resolve_complaints',
    'upload_documents', 'view_all_documents', 'send_sms', 'send_emails'
);

-- Landlord permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'landlord'
AND p.permission_name IN (
    'view_own_properties', 'add_properties', 'edit_properties',
    'view_inspection_reports', 'view_all_payments', 'view_all_documents'
);

-- Lodger permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'lodger'
AND p.permission_name IN (
    'view_own_payments', 'view_own_complaints', 'submit_complaints',
    'view_own_documents', 'upload_documents'
);

-- Service User permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'service_user'
AND p.permission_name IN (
    'conduct_inspections', 'upload_inspection_photos', 'upload_documents'
);

-- Insert default notification templates
INSERT INTO notification_templates (template_name, template_type, subject, body_template) VALUES
    ('rent_reminder', 'sms', 'Rent Due Reminder', 'Hi {{lodger_name}}, your rent of £{{amount}} is due on {{due_date}}. Please ensure payment is made on time. - Domus Servitia'),
    ('bin_duty_reminder', 'sms', 'Bin Duty Reminder', 'Hi {{lodger_name}}, you have bin duty this week starting {{week_start}}. Please remember to put bins out on {{collection_day}}. - Domus Servitia'),
    ('inspection_scheduled', 'email', 'Inspection Scheduled', 'Dear {{lodger_name}},\n\nAn inspection has been scheduled for {{property_name}} on {{inspection_date}} at {{inspection_time}}.\n\nPlease ensure the property is accessible.\n\nBest regards,\nDomus Servitia'),
    ('payment_received', 'email', 'Payment Confirmation', 'Dear {{lodger_name}},\n\nWe have received your payment of £{{amount}} for {{payment_type}}.\n\nReference: {{reference}}\n\nThank you!\nDomus Servitia'),
    ('complaint_received', 'email', 'Complaint Received', 'Dear {{lodger_name}},\n\nWe have received your complaint regarding "{{subject}}".\n\nReference: {{complaint_id}}\n\nA member of our team will review it shortly.\n\nBest regards,\nDomus Servitia'),
    ('document_expiring', 'email', 'Document Expiring Soon', 'Hi {{lodger_name}},\n\nYour {{document_type}} is expiring on {{expiry_date}}. Please upload a renewed copy.\n\nBest regards,\nDomus Servitia');

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
    ('rent_payment_grace_period_days', '3', 'number', 'billing', 'Number of days after due date before payment is overdue'),
    ('bin_duty_charge_amount', '20.00', 'number', 'bin_management', 'Default charge amount for missed bin duty'),
    ('document_expiry_reminder_days', '30', 'number', 'documents', 'Days before expiry to send reminder'),
    ('sms_enabled', 'true', 'boolean', 'notifications', 'Enable SMS notifications'),
    ('email_enabled', 'true', 'boolean', 'notifications', 'Enable email notifications'),
    ('auto_bin_rotation', 'true', 'boolean', 'bin_management', 'Automatically rotate bin duties weekly'),
    ('inspection_reminder_days', '2', 'number', 'inspections', 'Days before inspection to send reminder'),
    ('complaint_auto_escalate_days', '7', 'number', 'complaints', 'Days before unresolved complaint is escalated'),
    ('maintenance_response_time_hours', '24', 'number', 'maintenance', 'Expected response time for maintenance requests');

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active Tenancies View
CREATE VIEW active_tenancies_view AS
SELECT 
    t.*,
    l.full_name as lodger_name,
    l.email as lodger_email,
    l.phone as lodger_phone,
    r.room_number,
    r.room_name,
    p.property_name,
    p.address_line1,
    p.postcode
FROM tenancies t
JOIN lodger_profiles l ON t.lodger_id = l.id
JOIN rooms r ON t.room_id = r.id
JOIN properties p ON t.property_id = p.id
WHERE t.tenancy_status = 'active';

-- Payment Summary View
CREATE VIEW payment_summary_view AS
SELECT 
    lodger_id,
    COUNT(*) as total_payments,
    SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_paid,
    SUM(CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END) as total_pending,
    SUM(CASE WHEN payment_status = 'overdue' THEN amount ELSE 0 END) as total_overdue,
    MAX(payment_date) as last_payment_date
FROM payments
GROUP BY lodger_id;

-- Bin Duty Compliance View
CREATE VIEW bin_duty_compliance_view AS
SELECT 
    lodger_id,
    COUNT(*) as total_duties,
    SUM(CASE WHEN bin_duty_status = 'completed' THEN 1 ELSE 0 END) as completed_duties,
    SUM(CASE WHEN bin_duty_status = 'missed' THEN 1 ELSE 0 END) as missed_duties,
    ROUND(
        (SUM(CASE WHEN bin_duty_status = 'completed' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as compliance_rate
FROM bin_rotations
GROUP BY lodger_id;

-- Property Occupancy View
CREATE VIEW property_occupancy_view AS
SELECT 
    p.id as property_id,
    p.property_name,
    p.total_rooms,
    COUNT(DISTINCT r.id) as total_defined_rooms,
    COUNT(DISTINCT CASE WHEN r.room_status = 'occupied' THEN r.id END) as occupied_rooms,
    COUNT(DISTINCT CASE WHEN r.room_status = 'available' THEN r.id END) as available_rooms,
    ROUND(
        (COUNT(DISTINCT CASE WHEN r.room_status = 'occupied' THEN r.id END)::DECIMAL / 
         NULLIF(COUNT(DISTINCT r.id), 0)) * 100, 
        2
    ) as occupancy_rate
FROM properties p
LEFT JOIN rooms r ON p.id = r.property_id
GROUP BY p.id, p.property_name, p.total_rooms;

-- ============================================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================================================

-- Function to calculate next rent due date
CREATE OR REPLACE FUNCTION calculate_next_rent_due_date(tenancy_id UUID)
RETURNS DATE AS $$
DECLARE
    due_day INTEGER;
    last_payment DATE;
    next_due DATE;
BEGIN
    SELECT t.rent_due_day, MAX(p.payment_date)
    INTO due_day, last_payment
    FROM tenancies t
    LEFT JOIN payments p ON p.tenancy_id = t.id AND p.payment_type = 'rent'
    WHERE t.id = tenancy_id
    GROUP BY t.rent_due_day;
    
    IF last_payment IS NULL THEN
        -- No payments yet, use start date
        SELECT start_date INTO last_payment FROM tenancies WHERE id = tenancy_id;
    END IF;
    
    next_due := (last_payment + INTERVAL '1 month')::DATE;
    next_due := DATE_TRUNC('month', next_due) + (due_day - 1) * INTERVAL '1 day';
    
    RETURN next_due;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate payment reference
CREATE OR REPLACE FUNCTION generate_payment_reference()
RETURNS TEXT AS $$
DECLARE
    ref TEXT;
BEGIN
    ref := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE properties IS 'Physical properties/buildings managed by landlords';
COMMENT ON TABLE rooms IS 'Individual rentable rooms within properties';
COMMENT ON TABLE tenancies IS 'Rental agreements between lodgers and landlords';
COMMENT ON TABLE payments IS 'All payment transactions (rent, deposits, charges, etc.)';
COMMENT ON TABLE extra_charges IS 'Additional charges applied to lodgers (missed bin duty, damages, etc.)';
COMMENT ON TABLE bin_schedules IS 'Council bin collection schedules per property';
COMMENT ON TABLE bin_rotations IS 'Weekly in-house bin duty rotation among lodgers';
COMMENT ON TABLE inspections IS 'Property inspection records';
COMMENT ON TABLE complaints IS 'Lodger complaint tickets';
COMMENT ON TABLE documents IS 'Document management system for all user types';
COMMENT ON TABLE maintenance_requests IS 'Maintenance and repair requests';
COMMENT ON TABLE messages IS 'Internal messaging between users';
COMMENT ON TABLE notifications IS 'Notification delivery system (SMS, email, in-app, push)';
COMMENT ON TABLE system_logs IS 'Audit trail of all system actions';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
