# Domus Servitia - Database Schema Documentation

## Overview

This document provides comprehensive documentation for the Domus Servitia property management system database. The schema is designed for PostgreSQL (Supabase) and supports a multi-role property management platform.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Core Entities](#core-entities)
5. [Business Logic](#business-logic)
6. [Security & RLS](#security--rls)
7. [Implementation Guide](#implementation-guide)
8. [API Integration](#api-integration)
9. [Performance Optimization](#performance-optimization)
10. [Data Migration](#data-migration)

---

## Architecture Overview

### Technology Stack
- **Database**: PostgreSQL 14+ (Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for documents/images)
- **Real-time**: Supabase Realtime subscriptions

### Design Principles
- **Multi-tenancy**: Support for multiple landlords with isolated properties
- **Role-Based Access Control (RBAC)**: 5 distinct user roles with granular permissions
- **Audit Trail**: Complete system logging for compliance
- **Data Integrity**: Foreign key constraints and validation
- **Performance**: Strategic indexing and materialized views
- **Scalability**: Designed to handle thousands of properties and users

---

## Entity Relationship Diagram

### Core Entity Relationships

```
┌─────────────────┐
│  auth.users     │ (Supabase Auth)
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
    ┌────▼─────┐      ┌───▼──────┐
    │user_roles│      │ profiles │ (5 types)
    └────┬─────┘      └──────────┘
         │
    ┌────▼─────────────────────────┐
    │  Role-specific tables:       │
    │  - admin_profiles            │
    │  - staff_profiles            │
    │  - landlord_profiles         │
    │  - lodger_profiles           │
    │  - service_user_profiles     │
    └──────────────────────────────┘

┌─────────────┐      ┌──────────┐      ┌──────────┐
│ landlords   │─────▶│properties│─────▶│  rooms   │
└─────────────┘      └─────┬────┘      └────┬─────┘
                           │                 │
                           │                 │
                      ┌────▼────┐      ┌─────▼─────┐
                      │lodgers  │◀─────│ tenancies │
                      └────┬────┘      └─────┬─────┘
                           │                 │
         ┌─────────────────┼─────────────────┼─────────────────┐
         │                 │                 │                 │
    ┌────▼────┐      ┌─────▼─────┐    ┌────▼──────┐    ┌─────▼────┐
    │payments │      │complaints │    │inspections│    │documents │
    └─────────┘      └───────────┘    └───────────┘    └──────────┘
```

### Key Relationships

1. **User → Profile** (1:1): Each auth user has exactly one profile based on their role
2. **Landlord → Properties** (1:N): Landlords can own multiple properties
3. **Property → Rooms** (1:N): Properties contain multiple rooms
4. **Lodger → Tenancies** (1:N): Lodgers can have multiple tenancy agreements over time
5. **Tenancy → Payments** (1:N): Each tenancy generates multiple rent payments
6. **Property → Inspections** (1:N): Properties undergo multiple inspections
7. **Lodger → Complaints** (1:N): Lodgers can submit multiple complaints

---

## User Roles & Permissions

### Role Hierarchy

```
Admin (Superuser)
├── Staff (Operations)
│   └── Service User (Contractors)
├── Landlord (Property Owners)
└── Lodger (Tenants)
```

### Role Definitions

#### 1. **Admin** (`admin`)
- **Purpose**: System administrators with full access
- **User Count**: 2-5 users
- **Key Permissions**:
  - Full CRUD on all entities
  - User management (create, suspend, delete)
  - System settings configuration
  - Financial reports and billing
  - Role and permission management
  - System logs and audit trails

#### 2. **Staff** (`staff`)
- **Purpose**: Operational staff managing properties and lodgers
- **User Count**: 20-50 users
- **Key Permissions**:
  - View all properties and lodgers
  - Conduct inspections
  - Manage complaints
  - Send notifications (SMS/Email)
  - Process payments
  - Upload documents
  - Assign service users to tasks
  - Manage bin rotation schedules

#### 3. **Landlord** (`landlord`)
- **Purpose**: Property owners managing their portfolio
- **User Count**: 50-200 users
- **Key Permissions**:
  - View own properties only
  - View tenant information for their properties
  - View financial reports (rent payments)
  - View inspection reports
  - View maintenance requests
  - Upload property documents
  - Update property details

#### 4. **Lodger** (`lodger`)
- **Purpose**: Tenants renting rooms
- **User Count**: 500-5000 users
- **Key Permissions**:
  - View own tenancy details
  - Make rent payments
  - View payment history
  - Submit maintenance requests
  - Submit complaints
  - View own documents
  - Upload personal documents
  - View bin duty schedule
  - View inspection reports for their room

#### 5. **Service User** (`service_user`)
- **Purpose**: External contractors (cleaners, inspectors, maintenance)
- **User Count**: 20-100 users
- **Key Permissions**:
  - View assigned tasks only
  - Update task status
  - Upload task completion reports
  - Upload photos and documents
  - View property details for assigned tasks

---

## Core Entities

### 1. Properties

**Purpose**: Represents physical buildings/properties managed by landlords

**Key Fields**:
- `property_name`: Display name (e.g., "Riverside Apartments")
- `address_line1`, `city`, `postcode`: Full address
- `landlord_id`: Owner reference
- `total_rooms`: Number of rentable rooms
- `property_status`: active | inactive | under_maintenance | pending_approval
- `epc_rating`, `epc_expiry`: Energy Performance Certificate
- `gas_safety_expiry`, `electrical_safety_expiry`: Safety certificates
- `bin_collection_day`: Council collection day for bin management
- `images`: Array of property photos

**Business Rules**:
- Cannot be deleted if active tenancies exist
- Safety certificates must be renewed before expiry
- Status automatically set to 'under_maintenance' if inspections find issues

### 2. Rooms

**Purpose**: Individual rentable units within properties

**Key Fields**:
- `property_id`: Parent property
- `room_number`: Unique within property (e.g., "Room 1A")
- `room_type`: single | double | ensuite | studio
- `monthly_rent`: Rent amount
- `deposit_amount`: Security deposit
- `room_status`: available | occupied | under_maintenance | reserved
- `features`: Array of amenities ['desk', 'wardrobe', 'tv']

**Business Rules**:
- Room number must be unique per property
- Status automatically changes to 'occupied' when tenancy starts
- Cannot be deleted if currently occupied
- Rent must be positive value

### 3. Tenancies

**Purpose**: Rental agreements between lodgers and rooms

**Key Fields**:
- `lodger_id`: Tenant reference
- `room_id`: Rented room
- `property_id`: Parent property (denormalized for performance)
- `start_date`, `end_date`: Tenancy period
- `monthly_rent`: Agreed rent amount
- `deposit_amount`: Security deposit amount
- `rent_due_day`: Day of month rent is due (1-31)
- `tenancy_status`: active | pending | ended | terminated | notice_given
- `deposit_scheme_reference`: DPS/TDS reference

**Business Rules**:
- Only one active tenancy per room at a time
- Deposit must be registered with approved scheme
- Rent due day must be between 1-31
- End date must be after start date
- Status changes to 'notice_given' 30 days before lodger moves out

### 4. Payments

**Purpose**: All financial transactions in the system

**Key Fields**:
- `lodger_id`: Payer reference
- `tenancy_id`: Related tenancy (for rent payments)
- `payment_type`: rent | deposit | extra_charge | utility | maintenance | service_fee | refund
- `amount`: Payment amount
- `payment_method`: bank_transfer | cash | card | direct_debit | standing_order
- `payment_reference`: Unique reference (auto-generated)
- `payment_status`: pending | completed | failed | refunded | partially_paid | overdue
- `due_date`: When payment is due
- `payment_date`: When payment was made

**Business Rules**:
- Payment reference auto-generated: `PAY-YYYYMMDD-XXXX`
- Status changes to 'overdue' if not paid within grace period (default 3 days)
- Rent payments automatically generated monthly based on `rent_due_day`
- Receipt URL generated upon completion

### 5. Extra Charges

**Purpose**: Additional charges applied to lodgers

**Key Fields**:
- `lodger_id`: Charged lodger
- `charge_type`: bin_duty_missed | damage | late_payment | cleaning | key_replacement | breach_of_contract | utility_overage | other
- `amount`: Charge amount
- `reason`: Detailed explanation
- `evidence_urls`: Supporting photos/documents
- `charge_status`: pending | paid | disputed | waived | overdue
- `payment_id`: Link to payment once paid

**Business Rules**:
- Default charge for missed bin duty: £20 (configurable in settings)
- Requires admin/staff approval
- Can be disputed by lodger
- Evidence required for charges over £50

### 6. Bin Management

#### Bin Schedules
**Purpose**: Council collection schedules

**Key Fields**:
- `property_id`: Related property
- `bin_type`: general | recycling | garden | food
- `collection_day`: Day of week
- `collection_frequency`: weekly | fortnightly | monthly
- `next_collection_date`: Calculated field

#### Bin Rotations
**Purpose**: Weekly in-house duty rotation

**Key Fields**:
- `property_id`: Property
- `lodger_id`: Assigned lodger
- `week_starting`, `week_ending`: Duty week
- `bin_duty_status`: assigned | completed | missed | excused
- `evidence_photo_url`: Proof of completion
- `charge_applied`: Whether extra charge was added

**Business Rules**:
- Automatic weekly rotation among active lodgers in property
- Reminder SMS sent 1 day before collection day
- If missed, automatic £20 charge applied (configurable)
- Can upload photo proof of completion
- Staff can mark as 'excused' with reason

### 7. Inspections

**Purpose**: Property inspection records

**Key Fields**:
- `property_id`: Inspected property
- `room_id`: Specific room (if applicable)
- `inspector_id`: Staff or service user conducting inspection
- `inspection_type`: routine | move_in | move_out | complaint_followup | maintenance_check | safety_check
- `inspection_status`: scheduled | in_progress | completed | issues_found | passed | failed | cancelled
- `checklist`: JSON array of checklist items
- `photos`: Array of inspection photos
- `overall_rating`: excellent | good | fair | poor
- `next_inspection_date`: Recommended next inspection

**Business Rules**:
- Move-in inspections required for all new tenancies
- Move-out inspections required before returning deposit
- Routine inspections every 3-6 months
- Photos required for 'issues_found' status
- Automatic notification to lodger 2 days before inspection

### 8. Complaints

**Purpose**: Lodger complaint management system

**Key Fields**:
- `lodger_id`: Complainant
- `complaint_category`: maintenance | service_quality | communication | billing | property_condition | staff_conduct | noise | cleanliness | safety | other
- `priority`: low | medium | high | critical
- `subject`, `description`: Complaint details
- `complaint_status`: submitted | under_review | in_progress | resolved | closed | escalated
- `assigned_to`: Staff member handling complaint
- `resolution_notes`: How complaint was resolved
- `lodger_satisfaction`: Rating 1-5

**Business Rules**:
- Auto-assign to property manager if available
- Priority auto-set based on category (safety = critical)
- Auto-escalate to admin if unresolved after 7 days
- SMS notification to lodger upon status changes
- Require resolution notes before closing

### 9. Documents

**Purpose**: Document management for all user types

**Key Fields**:
- `document_type`: tenancy_agreement | id_verification | reference_letter | compliance_certificate | gas_safety | electrical_safety | epc | inventory_report | insurance | other
- `lodger_id`, `landlord_id`, `property_id`: Related entities
- `uploaded_by`: User who uploaded
- `file_url`: Supabase Storage URL
- `document_status`: valid | expiring_soon | expired | pending_review | rejected | archived
- `expiry_date`: For time-limited documents
- `is_verified`: Admin/staff verification

**Business Rules**:
- Gas safety certificate expires after 12 months
- EPC valid for 10 years
- Automatic reminder 30 days before expiry
- Lodgers must verify ID before tenancy starts
- Max file size: 10MB per document
- Supported formats: PDF, JPG, PNG, DOCX

### 10. Maintenance Requests

**Purpose**: Track property maintenance and repairs

**Key Fields**:
- `property_id`, `room_id`: Location
- `lodger_id`: Requester
- `issue_title`, `issue_description`: Problem details
- `maintenance_priority`: low | medium | high | emergency
- `maintenance_status`: submitted | assigned | in_progress | on_hold | completed | cancelled
- `assigned_to`: Staff or service user
- `estimated_cost`, `actual_cost`: Financial tracking
- `evidence_photos`, `completion_photos`: Before/after

**Business Rules**:
- Emergency requests (gas leak, water damage) auto-escalated
- Response time SLA: 24 hours for high priority
- Lodger notification when status changes
- Cost approval required if over £500
- Lodger satisfaction rating upon completion

### 11. Messages

**Purpose**: Internal messaging between users

**Key Fields**:
- `sender_id`, `recipient_id`: Conversation participants
- `subject`, `message_body`: Message content
- `message_status`: sent | delivered | read | archived
- `replied_to_message_id`: Threading support
- `attachments`: Array of file URLs

**Business Rules**:
- Lodgers can message staff/landlords only
- Staff can message all users
- Read receipts tracked
- Attachments max 5MB each
- Messages archived after 1 year

### 12. Notifications

**Purpose**: Multi-channel notification delivery

**Key Fields**:
- `recipient_id`: User receiving notification
- `notification_type`: sms | email | in_app | push
- `priority`: low | medium | high | urgent
- `subject`, `message_body`: Content
- `sent_at`, `delivered_at`, `read_at`: Delivery tracking
- `cost`: SMS cost tracking

**Business Rules**:
- SMS for urgent notifications (rent due, bin duty)
- Email for detailed communications (inspection reports)
- In-app for general updates
- Retry failed SMS up to 3 times
- Track delivery status via webhook

---

## Business Logic

### Automated Processes

#### 1. Rent Payment Generation
**Trigger**: Daily cron job
**Logic**:
1. Find all active tenancies
2. Check if payment due date has passed
3. Generate payment record with status 'pending'
4. Send SMS reminder to lodger
5. Mark as 'overdue' if not paid within grace period

```sql
-- Function to generate monthly rent payments
CREATE OR REPLACE FUNCTION generate_monthly_rent_payments()
RETURNS void AS $$
BEGIN
    INSERT INTO payments (lodger_id, tenancy_id, property_id, room_id, payment_type, amount, due_date, payment_reference, payment_status)
    SELECT 
        t.lodger_id,
        t.id,
        t.property_id,
        t.room_id,
        'rent',
        t.monthly_rent,
        calculate_next_rent_due_date(t.id),
        generate_payment_reference(),
        'pending'
    FROM tenancies t
    WHERE t.tenancy_status = 'active'
    AND NOT EXISTS (
        SELECT 1 FROM payments p 
        WHERE p.tenancy_id = t.id 
        AND p.payment_type = 'rent'
        AND p.due_date = calculate_next_rent_due_date(t.id)
    );
END;
$$ LANGUAGE plpgsql;
```

#### 2. Bin Rotation Assignment
**Trigger**: Weekly (Sunday midnight)
**Logic**:
1. Find all properties with active tenancies
2. Get list of lodgers in each property
3. Rotate duty to next lodger in sequence
4. Create bin_rotation record
5. Send SMS reminder on collection day

```sql
-- Function to rotate bin duties
CREATE OR REPLACE FUNCTION rotate_bin_duties()
RETURNS void AS $$
DECLARE
    prop RECORD;
    lodgers UUID[];
    next_lodger UUID;
    week_start DATE;
    week_end DATE;
BEGIN
    week_start := CURRENT_DATE;
    week_end := CURRENT_DATE + INTERVAL '7 days';
    
    FOR prop IN SELECT id FROM properties WHERE property_status = 'active' LOOP
        -- Get active lodgers in this property
        SELECT ARRAY_AGG(lodger_id ORDER BY random())
        INTO lodgers
        FROM tenancies
        WHERE property_id = prop.id AND tenancy_status = 'active';
        
        IF array_length(lodgers, 1) > 0 THEN
            -- Assign to next lodger
            INSERT INTO bin_rotations (property_id, lodger_id, week_starting, week_ending, bin_duty_status)
            VALUES (prop.id, lodgers[1], week_start, week_end, 'assigned');
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

#### 3. Document Expiry Reminders
**Trigger**: Daily cron job
**Logic**:
1. Find documents expiring in next 30 days
2. Send email reminder to relevant users
3. Mark `renewal_reminder_sent = true`

#### 4. Complaint Auto-Escalation
**Trigger**: Daily cron job
**Logic**:
1. Find complaints in 'in_progress' status older than 7 days
2. Change status to 'escalated'
3. Assign to admin
4. Send notification to lodger

### Validation Rules

#### Tenancy Validation
- Start date cannot be in the past
- End date must be after start date
- Room must be available (status = 'available')
- Lodger must have verified ID documents
- Deposit must be paid before move-in

#### Payment Validation
- Amount must be positive
- Due date must be in the future for new payments
- Payment method must be valid
- Cannot delete completed payments

#### Bin Rotation Validation
- Only one active rotation per lodger per week
- Cannot assign to lodger without active tenancy
- Evidence photo required to mark as completed

---

## Security & RLS

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:

#### Lodger Policies
```sql
-- Lodgers can only view their own data
CREATE POLICY "lodgers_own_data" ON lodger_profiles
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Lodgers can view their own payments
CREATE POLICY "lodgers_own_payments" ON payments
    FOR SELECT USING (
        lodger_id IN (
            SELECT id FROM lodger_profiles WHERE user_id = auth.uid()
        )
    );
```

#### Staff Policies
```sql
-- Staff can view all lodgers
CREATE POLICY "staff_view_all_lodgers" ON lodger_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'staff'
        )
    );

-- Staff can update complaints
CREATE POLICY "staff_update_complaints" ON complaints
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('staff', 'admin')
        )
    );
```

#### Admin Policies
```sql
-- Admins have full access
CREATE POLICY "admin_full_access" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );
```

### Data Encryption
- All sensitive fields (NI numbers, bank details) encrypted at rest
- HTTPS enforced for all API calls
- Supabase handles encryption keys

### Audit Trail
Every action logged in `system_logs`:
- User ID and role
- Action performed (create, update, delete)
- Entity type and ID
- Timestamp
- IP address and user agent

---

## Implementation Guide

### Step 1: Set Up Supabase Project

1. Create new Supabase project
2. Copy the SQL schema from `DATABASE_SCHEMA.sql`
3. Run in Supabase SQL Editor
4. Verify all tables created successfully

### Step 2: Configure Authentication

1. Enable Email/Password auth in Supabase
2. Set up email templates
3. Configure redirect URLs for your domain

### Step 3: Set Up Storage Buckets

Create the following storage buckets:
- `property-images`: Property and room photos
- `inspection-photos`: Inspection evidence
- `documents`: User documents (tenancy agreements, IDs, etc.)
- `avatars`: User profile photos
- `maintenance-photos`: Maintenance request photos

**Bucket Policies**:
```sql
-- Allow authenticated users to upload to avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow users to view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Step 4: Seed Initial Data

Run the seed queries at the end of `DATABASE_SCHEMA.sql` to create:
- Default roles
- Default permissions
- Role-permission mappings
- Notification templates
- System settings

### Step 5: Create First Admin User

```typescript
// Sign up first admin user
const { data, error } = await supabase.auth.signUp({
  email: 'admin@domusservitia.co.uk',
  password: 'secure_password'
});

// Manually insert into admin_profiles and user_roles
```

### Step 6: Test Authentication Flow

1. Sign up as lodger
2. Verify email
3. Login and check role assignment
4. Test ProtectedRoute navigation

---

## API Integration

### Supabase Client Setup

```typescript
// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Common Query Patterns

#### Fetch Lodger's Active Tenancy
```typescript
const { data: tenancy, error } = await supabase
  .from('active_tenancies_view')
  .select('*')
  .eq('lodger_id', lodgerId)
  .single();
```

#### Fetch Payment History
```typescript
const { data: payments, error } = await supabase
  .from('payments')
  .select(`
    *,
    tenancy:tenancies(
      property:properties(property_name),
      room:rooms(room_number)
    )
  `)
  .eq('lodger_id', lodgerId)
  .order('payment_date', { ascending: false });
```

#### Submit Maintenance Request
```typescript
const { data, error } = await supabase
  .from('maintenance_requests')
  .insert([{
    property_id: propertyId,
    room_id: roomId,
    lodger_id: lodgerId,
    issue_title: 'Leaking tap',
    issue_description: 'Kitchen tap leaking constantly',
    maintenance_priority: 'medium',
    evidence_photos: photoUrls
  }]);
```

#### Real-time Subscription for Messages
```typescript
const subscription = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `recipient_id=eq.${userId}`
  }, (payload) => {
    console.log('New message:', payload.new);
  })
  .subscribe();
```

---

## Performance Optimization

### Indexes
All critical foreign keys and query fields are indexed. Key indexes:

- `idx_tenancies_lodger_id`: Fast lodger tenancy lookups
- `idx_payments_payment_date`: Payment history queries
- `idx_complaints_status`: Filter complaints by status
- `idx_bin_rotations_week_starting`: Current week duty lookups

### Materialized Views
Consider creating materialized views for expensive aggregations:

```sql
CREATE MATERIALIZED VIEW landlord_financials_mv AS
SELECT 
    l.id as landlord_id,
    COUNT(DISTINCT p.id) as total_properties,
    COUNT(DISTINCT r.id) as total_rooms,
    COUNT(DISTINCT t.id) as active_tenancies,
    SUM(CASE WHEN pay.payment_status = 'completed' 
        THEN pay.amount ELSE 0 END) as total_revenue_ytd
FROM landlord_profiles l
LEFT JOIN properties p ON l.id = p.landlord_id
LEFT JOIN rooms r ON p.id = r.property_id
LEFT JOIN tenancies t ON r.id = t.room_id AND t.tenancy_status = 'active'
LEFT JOIN payments pay ON t.id = pay.tenancy_id 
    AND pay.payment_date >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY l.id;

-- Refresh daily
CREATE INDEX idx_landlord_financials_mv ON landlord_financials_mv(landlord_id);
```

### Query Optimization Tips

1. **Use views for complex joins**: `active_tenancies_view` eliminates repetitive joins
2. **Paginate large result sets**: Always add `LIMIT` and `OFFSET`
3. **Select only needed columns**: Avoid `SELECT *` in production
4. **Use connection pooling**: Configure Supabase connection limits
5. **Cache frequent queries**: Use React Query or SWR

---

## Data Migration

### Migrating from Existing System

#### Step 1: Export Data
Export from current system in CSV format:
- `lodgers.csv`
- `properties.csv`
- `rooms.csv`
- `tenancies.csv`
- `payments.csv`

#### Step 2: Create Migration Scripts

```sql
-- Example: Import lodgers
COPY lodger_profiles (email, full_name, phone, date_of_birth)
FROM '/path/to/lodgers.csv'
DELIMITER ','
CSV HEADER;

-- Update user_roles after import
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'lodger' FROM lodger_profiles;
```

#### Step 3: Validate Data Integrity

```sql
-- Check for missing required fields
SELECT * FROM lodger_profiles WHERE email IS NULL OR full_name IS NULL;

-- Check for orphaned records
SELECT * FROM tenancies t
LEFT JOIN lodger_profiles l ON t.lodger_id = l.id
WHERE l.id IS NULL;

-- Validate foreign key constraints
SELECT COUNT(*) FROM rooms r
LEFT JOIN properties p ON r.property_id = p.id
WHERE p.id IS NULL;
```

---

## Maintenance & Monitoring

### Daily Tasks
- Run automated payment generation
- Send rent reminders
- Check document expiries
- Auto-escalate old complaints

### Weekly Tasks
- Rotate bin duties
- Send inspection reminders
- Generate weekly reports

### Monthly Tasks
- Archive old messages
- Clean up expired documents
- Review system performance
- Generate financial reports

### Monitoring Queries

```sql
-- Check system health
SELECT 
    'Total Active Tenancies' as metric,
    COUNT(*) as value
FROM tenancies WHERE tenancy_status = 'active'
UNION ALL
SELECT 
    'Overdue Payments',
    COUNT(*)
FROM payments WHERE payment_status = 'overdue'
UNION ALL
SELECT 
    'Unresolved Complaints',
    COUNT(*)
FROM complaints WHERE complaint_status NOT IN ('resolved', 'closed');
```

---

## Support & Troubleshooting

### Common Issues

#### Issue: RLS blocking legitimate queries
**Solution**: Check that user's role is correctly set in `user_roles` table

#### Issue: Payments not auto-generating
**Solution**: Verify `rent_due_day` is set correctly in tenancies

#### Issue: Images not loading
**Solution**: Check storage bucket policies and CORS settings

### Database Backup

Supabase provides automatic daily backups. For manual backup:

```bash
# Export entire database
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

# Export specific table
pg_dump -h db.xxx.supabase.co -U postgres -t payments > payments_backup.sql
```

---

## Next Steps

1. ✅ Review schema and documentation
2. ⬜ Run schema in Supabase SQL Editor
3. ⬜ Configure storage buckets
4. ⬜ Set up authentication
5. ⬜ Seed initial data
6. ⬜ Create first admin user
7. ⬜ Update frontend to use new schema
8. ⬜ Test all user journeys
9. ⬜ Deploy to production

---

## Version History

- **v1.0** (2025-12-09): Initial schema release
  - 23 core tables
  - 5 user roles with RBAC
  - Complete business logic implementation
  - RLS policies for all tables
  - Automated processes (rent, bin rotation, etc.)

---

## Contact

For questions or support regarding the database schema:
- **Technical Lead**: Database Team
- **Email**: tech@domusservitia.co.uk
- **Documentation**: See README.md for project overview
