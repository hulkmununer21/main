# 🗺️ Domus Servitia - Database Integration Roadmap

**Version:** 1.0  
**Created:** December 10, 2025  
**Status:** In Progress  

---

## 📊 Overview

This roadmap outlines the complete integration of Supabase database queries across all user portals (Lodger, Landlord, Staff, Admin, Service User). The work is divided into 4 major sections based on priority and complexity.

### Current Status
- ✅ **Phase 1 Complete:** Authentication System (100%)
- ✅ **Phase 2 Complete:** Lodger Portal Integration (100%)
- 🔄 **Phase 3 In Progress:** Service User Portal Redesign (0%)
- ⏳ **Phase 4 Pending:** Landlord Portal Integration (0%)
- ⏳ **Phase 5 Pending:** Staff Portal Integration (0%)
- ⏳ **Phase 6 Pending:** Admin Portal Integration (0%)

---

## 🎯 Section 1: Foundation & Lodger Portal (COMPLETED ✅)

**Timeline:** 2 days  
**Priority:** Critical  
**Status:** ✅ Complete

### 1.1 Authentication System ✅
**Files:**
- ✅ `/src/contexts/AuthContext.tsx` - Enhanced error handling, profile fetching
- ✅ `/src/contexts/AuthContextTypes.ts` - All 5 profile interfaces
- ✅ `/src/pages/Signup.tsx` - Updated to use full_name
- ✅ `/src/pages/AdminLogin.tsx` - Fixed login function call
- ✅ `/src/pages/StaffLogin.tsx` - Fixed login function call

**Features Implemented:**
- ✅ Role-based authentication with profile lookup
- ✅ Automatic role detection from database
- ✅ Last login timestamp updates
- ✅ Profile data loading for all 5 roles
- ✅ Error handling with detailed console logging

### 1.2 Lodger Portal Integration ✅
**Files:**
- ✅ `/src/pages/lodger/LodgerOverview.tsx` - Dashboard with real data
- ✅ `/src/pages/lodger/LodgerPayments.tsx` - Payment history
- ✅ `/src/pages/lodger/LodgerMaintenance.tsx` - Maintenance requests
- ✅ `/src/pages/lodger/LodgerProfile.tsx` - Profile management
- ⚠️ `/src/pages/lodger/LodgerMessages.tsx` - Not integrated (low priority)

**Database Queries Used:**
- ✅ `getLodgerActiveTenancy()` - Fetch tenancy with property/room details
- ✅ `getLodgerPayments()` - Payment history with status
- ✅ `getLodgerDocuments()` - Document list
- ✅ `getLodgerMaintenanceRequests()` - Maintenance tracking
- ✅ `createMaintenanceRequest()` - Submit new requests
- ✅ Direct Supabase update for profile changes

**Features Implemented:**
- ✅ Real-time tenancy details (property, room, rent)
- ✅ Payment history with status badges
- ✅ Maintenance request submission & tracking
- ✅ Profile editing with validation
- ✅ Loading states and error handling
- ✅ Stats calculations (on-time payments, total paid)

---

## 🔧 Section 2: Service User Portal Redesign (IN PROGRESS 🔄)

**Timeline:** 2 days  
**Priority:** High  
**Status:** 🔄 0% Complete

### 2.1 Service User Pages Analysis

**Current Issues:**
- Basic mock data with no database integration
- Missing key features from database schema
- Not aligned with actual service_user functionality
- No task management integration
- No upload functionality for reports

**Database Tables to Integrate:**
```sql
- service_user_profiles (id, user_id, email, full_name, company_name, service_type, etc.)
- service_user_tasks (assigned tasks with status tracking)
- service_user_uploads (reports, certificates, photos)
- maintenance_requests (where assignee_type='service_user')
- inspections (where inspector_type='service_user')
- cleaning_records (where cleaner_type='service_user')
```

### 2.2 Service User Portal - Implementation Plan

#### File: `/src/pages/serviceuser/ServiceUserDashboard.tsx`
**Status:** 🔄 To Redesign  
**Priority:** Critical

**Features to Implement:**
1. **Stats Cards:**
   - Active Tasks (from service_user_tasks WHERE status IN ('assigned', 'in_progress'))
   - Completed Tasks This Month
   - Pending Uploads
   - Upcoming Inspections

2. **Recent Tasks Widget:**
   - List of assigned tasks with property details
   - Status indicators (Pending, In Progress, Completed)
   - Due dates with urgency badges

3. **Quick Actions:**
   - View All Tasks
   - Upload Report
   - View Earnings
   - Update Availability

**Database Queries Needed:**
```typescript
- getServiceUserTasks(serviceUserId: string)
- getServiceUserStats(serviceUserId: string)
- getServiceUserUpcomingInspections(serviceUserId: string)
```

#### File: `/src/pages/serviceuser/ServiceUserTasks.tsx`
**Status:** 🔄 To Redesign  
**Priority:** High

**Features to Implement:**
1. **Task List View:**
   - Filter by status (All, Pending, In Progress, Completed)
   - Sort by due date, priority, property
   - Task cards showing:
     * Task type (Cleaning, Inspection, Maintenance, Repair)
     * Property name and address
     * Due date and urgency
     * Description and requirements
     * Assigned by (staff name)

2. **Task Details Modal:**
   - Full task description
   - Property and room details
   - Contact information (staff/landlord)
   - Upload section for completion reports
   - Status update buttons (Start, Complete, Issue)

3. **Task Actions:**
   - Mark as started
   - Upload photos/reports
   - Mark as completed
   - Report issues/delays

**Database Queries Needed:**
```typescript
- getServiceUserTasks(serviceUserId: string, filters?)
- getTaskDetails(taskId: string)
- updateTaskStatus(taskId: string, status: string)
- uploadTaskReport(taskId: string, files: File[])
```

#### File: `/src/pages/serviceuser/ServiceUserUploads.tsx`
**Status:** 🔄 To Redesign  
**Priority:** Medium

**Features to Implement:**
1. **Upload Interface:**
   - Select task from dropdown
   - Upload multiple files (photos, PDFs, documents)
   - Add notes/description
   - Preview uploaded files

2. **Upload History:**
   - List all uploads by task
   - Download previously uploaded files
   - View upload dates and status

3. **Required Documents:**
   - Insurance certificates (track expiry)
   - Gas/Electrical certifications
   - DBS checks (for some service types)

**Database Queries Needed:**
```typescript
- getServiceUserUploads(serviceUserId: string)
- createServiceUserUpload(data: UploadData)
- getRequiredDocuments(serviceUserId: string)
```

#### File: `/src/pages/serviceuser/ServiceUserProfile.tsx`
**Status:** 🔄 To Redesign  
**Priority:** Low

**Features to Implement:**
1. **Profile Information:**
   - Full name, email, phone
   - Company name (if applicable)
   - Service type (Cleaner, Plumber, Electrician, etc.)
   - Certification number
   - Insurance expiry date
   - Hourly rate
   - Rating (read-only)

2. **Editable Fields:**
   - Phone number
   - Company name
   - Service type
   - Certification number
   - Insurance expiry
   - Hourly rate

3. **Stats Display:**
   - Total jobs completed
   - Average rating
   - Member since date

**Database Queries Needed:**
```typescript
- Direct Supabase update to service_user_profiles
- getServiceUserStats(serviceUserId: string)
```

### 2.3 New Query Functions to Create

**File:** `/src/lib/queries.ts`

Add the following functions:

```typescript
// SERVICE USER QUERIES

export const getServiceUserTasks = async (serviceUserId: string, filters?: {
  status?: string;
  sortBy?: 'due_date' | 'created_at';
}) => {
  let query = supabase
    .from('service_user_tasks')
    .select(`
      *,
      property:properties(property_name, address_line1, postcode),
      room:rooms(room_number)
    `)
    .eq('service_user_id', serviceUserId);

  if (filters?.status) {
    query = query.eq('task_status', filters.status);
  }

  query = query.order(filters?.sortBy || 'due_date', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

export const getServiceUserStats = async (serviceUserId: string) => {
  // Get task counts
  const { count: activeCount } = await supabase
    .from('service_user_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('service_user_id', serviceUserId)
    .in('task_status', ['assigned', 'in_progress']);

  const { count: completedCount } = await supabase
    .from('service_user_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('service_user_id', serviceUserId)
    .eq('task_status', 'completed');

  return {
    data: {
      activeTasks: activeCount || 0,
      completedTasks: completedCount || 0,
    },
    error: null
  };
};

export const getServiceUserUploads = async (serviceUserId: string) => {
  const { data, error } = await supabase
    .from('service_user_uploads')
    .select(`
      *,
      task:service_user_tasks(task_type, description)
    `)
    .eq('service_user_id', serviceUserId)
    .order('uploaded_date', { ascending: false });

  return { data, error };
};

export const createServiceUserUpload = async (uploadData: {
  service_user_id: string;
  task_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  notes?: string;
}) => {
  const { data, error } = await supabase
    .from('service_user_uploads')
    .insert(uploadData)
    .select()
    .single();

  return { data, error };
};

export const updateTaskStatus = async (taskId: string, status: string) => {
  const { data, error } = await supabase
    .from('service_user_tasks')
    .update({ 
      task_status: status,
      ...(status === 'completed' && { completed_date: new Date().toISOString() })
    })
    .eq('id', taskId)
    .select()
    .single();

  return { data, error };
};
```

### 2.4 Service User Routing Update

**File:** `/src/App.tsx`

Ensure these routes exist:
```typescript
<Route path="/serviceuser/dashboard" element={
  <ProtectedRoute allowedRoles={["service_user"]}>
    <ServiceUserDashboard />
  </ProtectedRoute>
} />
<Route path="/serviceuser/tasks" element={
  <ProtectedRoute allowedRoles={["service_user"]}>
    <ServiceUserTasks />
  </ProtectedRoute>
} />
<Route path="/serviceuser/uploads" element={
  <ProtectedRoute allowedRoles={["service_user"]}>
    <ServiceUserUploads />
  </ProtectedRoute>
} />
<Route path="/serviceuser/profile" element={
  <ProtectedRoute allowedRoles={["service_user"]}>
    <ServiceUserProfile />
  </ProtectedRoute>
} />
```

### 2.5 Service User - Acceptance Criteria

- [ ] Dashboard shows real task counts and stats
- [ ] Tasks page displays all assigned tasks with filters
- [ ] Can update task status (Start, Complete)
- [ ] Can upload reports and photos for tasks
- [ ] Profile page displays and updates service user data
- [ ] All data comes from Supabase (no mock data)
- [ ] Loading states and error handling
- [ ] Mobile responsive design
- [ ] No TypeScript errors

---

## 🏢 Section 3: Landlord Portal Integration

**Timeline:** 3 days  
**Priority:** High  
**Status:** ⏳ Pending (0% Complete)

### 3.1 Landlord Portal Pages

**Files to Update:**
1. `/src/pages/landlord/LandlordOverview.tsx` - Dashboard
2. `/src/pages/landlord/LandlordProperties.tsx` - Property management
3. `/src/pages/landlord/LandlordTenants.tsx` - Tenant list
4. `/src/pages/landlord/LandlordFinancials.tsx` - Financial reports
5. `/src/pages/landlord/LandlordProfile.tsx` - Profile management

### 3.2 Database Integration Requirements

**Tables Involved:**
```sql
- landlord_profiles
- properties (WHERE landlord_id = current_landlord)
- rooms (through properties)
- tenancies (through properties)
- payments (through tenancies)
- maintenance_requests (through properties)
- inspections (through properties)
- documents (landlord-specific)
```

### 3.3 Landlord Queries to Implement

**File:** `/src/lib/queries.ts`

```typescript
// LANDLORD QUERIES

export const getLandlordProperties = async (landlordId: string) => {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      rooms(count)
    `)
    .eq('landlord_id', landlordId)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const getLandlordTenancies = async (landlordId: string) => {
  const { data, error } = await supabase
    .from('tenancies')
    .select(`
      *,
      lodger:lodger_profiles(full_name, email, phone),
      property:properties(property_name, address_line1),
      room:rooms(room_number)
    `)
    .in('property_id', 
      supabase.from('properties').select('id').eq('landlord_id', landlordId)
    )
    .order('start_date', { ascending: false });

  return { data, error };
};

export const getLandlordPayments = async (landlordId: string, filters?: {
  startDate?: string;
  endDate?: string;
}) => {
  let query = supabase
    .from('payments')
    .select(`
      *,
      lodger:lodger_profiles(full_name),
      property:properties(property_name)
    `)
    .in('property_id',
      supabase.from('properties').select('id').eq('landlord_id', landlordId)
    );

  if (filters?.startDate) query = query.gte('payment_date', filters.startDate);
  if (filters?.endDate) query = query.lte('payment_date', filters.endDate);

  query = query.order('payment_date', { ascending: false });

  const { data, error } = await query;
  return { data, error };
};

export const getLandlordMaintenanceRequests = async (landlordId: string) => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      property:properties(property_name, address_line1),
      room:rooms(room_number),
      lodger:lodger_profiles(full_name, phone)
    `)
    .in('property_id',
      supabase.from('properties').select('id').eq('landlord_id', landlordId)
    )
    .order('reported_date', { ascending: false });

  return { data, error };
};

export const createProperty = async (propertyData: PropertyData) => {
  const { data, error } = await supabase
    .from('properties')
    .insert(propertyData)
    .select()
    .single();

  return { data, error };
};

export const createRoom = async (roomData: RoomData) => {
  const { data, error } = await supabase
    .from('rooms')
    .insert(roomData)
    .select()
    .single();

  return { data, error };
};
```

### 3.4 Landlord Portal Features

#### LandlordOverview.tsx
- [ ] Property count and occupancy rate
- [ ] Monthly revenue stats
- [ ] Pending maintenance requests count
- [ ] Recent payments list
- [ ] Overdue rent alerts
- [ ] Quick actions (Add Property, View Tenants)

#### LandlordProperties.tsx
- [ ] List all properties with occupancy status
- [ ] Add new property
- [ ] Edit property details
- [ ] View rooms per property
- [ ] Add/Edit rooms
- [ ] Property documents
- [ ] Maintenance history per property

#### LandlordTenants.tsx
- [ ] List all tenants across properties
- [ ] Tenant details (contact, tenancy dates)
- [ ] Payment status per tenant
- [ ] Filter by property
- [ ] Contact tenant functionality

#### LandlordFinancials.tsx
- [ ] Revenue summary (monthly, yearly)
- [ ] Payment breakdown by property
- [ ] Outstanding payments
- [ ] Expense tracking (maintenance, repairs)
- [ ] Profit/Loss summary
- [ ] Export reports

#### LandlordProfile.tsx
- [ ] Edit profile (full_name, phone, company_name)
- [ ] Bank details (for payments)
- [ ] Company registration info
- [ ] Tax ID
- [ ] Preferred payment method

---

## 👥 Section 4: Staff & Admin Portals Integration

**Timeline:** 4 days  
**Priority:** Medium  
**Status:** ⏳ Pending (0% Complete)

### 4.1 Staff Portal Integration

**Files to Update:**
1. `/src/pages/staff/StaffOverview.tsx` - Dashboard
2. `/src/pages/staff/StaffInspections.tsx` - Inspection scheduling
3. `/src/pages/staff/StaffComplaints.tsx` - Complaint management
4. `/src/pages/staff/StaffBinRotation.tsx` - Bin duty management
5. `/src/pages/staff/StaffProfile.tsx` - Profile management

**Database Tables:**
```sql
- staff_profiles
- inspections
- cleaning_records
- bin_rotations
- complaints
- maintenance_requests (assign to service users)
- notifications (send to lodgers/landlords)
- documents (upload/manage)
```

**Staff Queries Needed:**
```typescript
- getStaffInspections(staffId: string)
- getStaffComplaints(filters?)
- getBinRotationSchedule(propertyId?: string)
- assignMaintenanceTask(maintenanceId: string, serviceUserId: string)
- createInspection(inspectionData)
- updateComplaintStatus(complaintId: string, status: string)
- sendNotification(userId: string, message: string, type: string)
```

**Staff Features:**
- [ ] View assigned inspections
- [ ] Schedule new inspections
- [ ] Manage complaints (assign, resolve)
- [ ] Track bin rotation compliance
- [ ] Assign maintenance tasks to service users
- [ ] Send notifications to lodgers/landlords
- [ ] Upload documents
- [ ] View all properties and rooms

### 4.2 Admin Portal Integration

**Files to Update:**
1. `/src/pages/admin/AdminOverview.tsx` - Main dashboard
2. `/src/pages/admin/UserManagement.tsx` - All users
3. `/src/pages/admin/PropertyManagement.tsx` - All properties
4. `/src/pages/admin/ComplaintManagement.tsx` - System-wide complaints
5. `/src/pages/admin/DocumentManagement.tsx` - All documents
6. `/src/pages/admin/ExtraCharges.tsx` - Extra charges management
7. `/src/pages/admin/BinManagement.tsx` - Bin duty oversight
8. `/src/pages/admin/ServiceUsers.tsx` - Service user management
9. `/src/pages/admin/NotificationsSMS.tsx` - Bulk notifications
10. `/src/pages/admin/RolePermissions.tsx` - User roles & permissions
11. `/src/pages/admin/Reports.tsx` - Analytics & reports

**Database Tables (Admin has access to ALL):**
```sql
- All profile tables (admin, staff, landlord, lodger, service_user)
- properties, rooms, tenancies
- payments, extra_charges
- inspections, cleaning_records, bin_rotations
- complaints, maintenance_requests
- documents, service_user_uploads
- notifications, messages
- audit_logs
```

**Admin Queries Needed:**
```typescript
// User Management
- getAllUsers(role?: string, filters?)
- createUser(userData)
- updateUserRole(userId: string, role: string)
- deactivateUser(userId: string)

// Property Management
- getAllProperties(filters?)
- createPropertyWithRooms(propertyData, roomsData)
- updatePropertyStatus(propertyId: string, status: string)

// Financial
- getSystemWidePayments(filters?)
- getExtraCharges(filters?)
- createExtraCharge(chargeData)
- waiveExtraCharge(chargeId: string)

// Complaints
- getAllComplaints(filters?)
- escalateComplaint(complaintId: string)
- assignComplaint(complaintId: string, staffId: string)

// Reports & Analytics
- getDashboardStats()
- getOccupancyReport()
- getPaymentReport(dateRange)
- getMaintenanceReport()
- getComplaintReport()

// Notifications
- sendBulkNotification(userIds: string[], message: string, type: string)
- getNotificationHistory()
```

**Admin Features:**
- [ ] System-wide dashboard (total users, properties, revenue)
- [ ] Create/edit/delete users (all roles)
- [ ] Manage all properties and rooms
- [ ] Approve/reject new landlord properties
- [ ] View and resolve complaints
- [ ] Generate financial reports
- [ ] Export data (payments, users, complaints)
- [ ] Send bulk SMS/email notifications
- [ ] Manage extra charges (add, waive, dispute)
- [ ] Audit log viewer
- [ ] System settings and configuration

---

## 📋 Implementation Checklist

### Phase 1: Foundation ✅
- [x] Database schema created and documented
- [x] Authentication system updated
- [x] Profile interfaces match database
- [x] Login/logout functionality tested
- [x] Query helper file created (`/src/lib/queries.ts`)

### Phase 2: Lodger Portal ✅
- [x] LodgerOverview.tsx integrated
- [x] LodgerPayments.tsx integrated
- [x] LodgerMaintenance.tsx integrated
- [x] LodgerProfile.tsx integrated
- [x] All queries tested
- [x] Error handling implemented
- [x] Loading states added

### Phase 3: Service User Portal 🔄
- [ ] Analyze current service user pages
- [ ] Create service user query functions
- [ ] Redesign ServiceUserDashboard.tsx
- [ ] Implement ServiceUserTasks.tsx
- [ ] Implement ServiceUserUploads.tsx
- [ ] Update ServiceUserProfile.tsx
- [ ] Test all service user features
- [ ] Mobile responsive testing

### Phase 4: Landlord Portal ⏳
- [ ] Create landlord query functions
- [ ] LandlordOverview.tsx integration
- [ ] LandlordProperties.tsx integration
- [ ] LandlordTenants.tsx integration
- [ ] LandlordFinancials.tsx integration
- [ ] LandlordProfile.tsx integration
- [ ] Property creation flow
- [ ] Room management
- [ ] Test all landlord features

### Phase 5: Staff Portal ⏳
- [ ] Create staff query functions
- [ ] StaffOverview.tsx integration
- [ ] StaffInspections.tsx integration
- [ ] StaffComplaints.tsx integration
- [ ] StaffBinRotation.tsx integration
- [ ] StaffProfile.tsx integration
- [ ] Test inspection scheduling
- [ ] Test complaint assignment

### Phase 6: Admin Portal ⏳
- [ ] Create admin query functions
- [ ] AdminOverview.tsx integration
- [ ] UserManagement.tsx integration
- [ ] PropertyManagement.tsx integration
- [ ] ComplaintManagement.tsx integration
- [ ] DocumentManagement.tsx integration
- [ ] ExtraCharges.tsx integration
- [ ] BinManagement.tsx integration
- [ ] ServiceUsers.tsx integration
- [ ] NotificationsSMS.tsx integration
- [ ] RolePermissions.tsx integration
- [ ] Reports.tsx integration
- [ ] Test bulk operations
- [ ] Test reports generation

---

## 🎯 Success Metrics

### Code Quality
- [ ] Zero TypeScript errors across all files
- [ ] All database queries use type-safe functions
- [ ] Error handling on all async operations
- [ ] Loading states for all data fetching
- [ ] Form validation before submissions

### User Experience
- [ ] Fast page loads (<2s for data-heavy pages)
- [ ] Clear error messages
- [ ] Success toasts for actions
- [ ] Mobile responsive (all breakpoints)
- [ ] Accessible (ARIA labels, keyboard nav)

### Data Integrity
- [ ] All foreign key relationships respected
- [ ] No orphaned records created
- [ ] Proper timestamp updates (created_at, updated_at)
- [ ] RLS policies enforced
- [ ] Audit logs for critical operations

### Testing
- [ ] Manual testing of all user flows
- [ ] Edge case testing (empty states, errors)
- [ ] Multi-role testing (different permissions)
- [ ] Mobile device testing (iOS & Android)
- [ ] Performance testing (large datasets)

---

## 🚀 Deployment Strategy

### Pre-Deployment Checklist
- [ ] All environment variables set
- [ ] Database schema applied to production
- [ ] Test data removed
- [ ] RLS policies enabled
- [ ] Storage buckets created
- [ ] Backup strategy in place

### Rollout Plan
1. **Week 1:** Deploy Lodger & Service User portals (completed Phase 2 & 3)
2. **Week 2:** Deploy Landlord portal (Phase 4)
3. **Week 3:** Deploy Staff portal (Phase 5)
4. **Week 4:** Deploy Admin portal & full system testing (Phase 6)

### Post-Deployment
- [ ] Monitor error logs
- [ ] Track query performance
- [ ] User feedback collection
- [ ] Bug fixes and optimizations
- [ ] Documentation updates

---

## 📚 Resources

- **Database Schema:** `/workspaces/main/DATABASE_SCHEMA.sql`
- **Query Helpers:** `/src/lib/queries.ts`
- **Auth Context:** `/src/contexts/AuthContext.tsx`
- **Integration Guide:** `/workspaces/main/INTEGRATION_GUIDE.md`
- **Supabase Dashboard:** https://supabase.com/dashboard/project/nagzgahnvwpagvnylawh

---

## 📞 Support & Questions

If you encounter issues during implementation:
1. Check browser console for detailed error logs
2. Review Supabase logs (Logs → Postgres Logs)
3. Verify RLS policies are not blocking queries
4. Confirm user has proper role in `user_roles` table
5. Check profile exists in corresponding profile table

---

**Last Updated:** December 10, 2025  
**Next Milestone:** Complete Section 2 (Service User Portal Redesign)
