# Admin Portal Database Integration Analysis

## Current Status Overview

### ✅ Already Integrated with Real Database
1. **AdminOverview.tsx** - ✅ COMPLETE
   - Uses `getAdminStats()`, `getAllUsers()`, `getAllProperties()`
   - Displays real metrics: total users, properties, revenue, occupancy rates
   - Shows recent users from database

2. **StaffManagement.tsx** - ✅ COMPLETE
   - Uses `getAllStaff()`, `createStaffMember()`, `updateStaffMember()`
   - Full CRUD operations with database
   - Search and filter functionality

3. **PropertyManagement.tsx** - ✅ COMPLETE
   - Uses `getAllProperties()`, `getPropertyRooms()`, `createProperty()`, `updateProperty()`, `deleteProperty()`
   - Room management with `createRoom()`, `updateRoom()`, `deleteRoom()`
   - Full property and room CRUD operations

4. **BinManagement.tsx** - ✅ COMPLETE
   - Uses `getCurrentBinDuties()`, `getMissedBinDuties()`, `getCouncilBinSchedules()`
   - CRUD operations: `updateBinDutyStatus()`, `createBinDutyCharge()`, `sendBinDutyReminder()`
   - Displays current week rotations, council schedules, and missed duties with charges

### ❌ Still Using Mock/Dummy Data (Need Integration)

#### 2. **InspectionManagement.tsx** - 🔴 HIGH PRIORITY
**Mock Data:**
```typescript
const inspections = [
  { property: "123 Main St", room: "Room 2", date: "2024-12-10", ... }
];
const completedInspections = [...];
```

**Database Tables Available:**
- `inspections` - full inspection records
- `properties`, `rooms` - location info
- `staff_profiles`, `service_user_profiles` - inspectors
- `documents` - inspection reports

**Required Queries:**
```typescript
- getAllInspections(filters: { status?, type?, date_range? })
- getUpcomingInspections()
- getCompletedInspections()
- createInspection(data)
- updateInspection(inspectionId, data)
- uploadInspectionReport(inspectionId, fileUrl)
```

---

#### 3. **ExtraCharges.tsx** - 🟡 MEDIUM PRIORITY
**Mock Data:**
```typescript
const charges = [
  { lodger: "Tom Brown", property: "789 High St", reason: "Bin Duty Missed", ... }
];
```

**Database Tables Available:**
- `extra_charges` - all extra charges
- `lodger_profiles` - lodger info
- `rooms`, `properties` - location
- `payments` - payment tracking

**Required Queries:**
```typescript
- getAllExtraCharges(filters: { status?, lodger_id?, date_range? })
- createExtraCharge(data)
- updateExtraCharge(chargeId, data)
- waiveCharge(chargeId)
- getChargesByLodger(lodgerId)
```

---

#### 4. **ComplaintManagement.tsx** - 🟡 MEDIUM PRIORITY
**Mock Data:**
```typescript
const complaints = [
  { lodger: "Tom Brown", category: "Maintenance", subject: "Leaking tap", ... }
];
```

**Database Tables Available:**
- `complaints` - full complaint records
- `lodger_profiles` - lodger info
- `staff_profiles` - assigned staff
- `properties`, `rooms` - location
- `complaint_responses` - response tracking

**Required Queries:**
```typescript
- getAllComplaints(filters: { status?, priority?, category? })
- getComplaintDetails(complaintId)
- updateComplaintStatus(complaintId, status)
- assignComplaintToStaff(complaintId, staffId)
- addComplaintResponse(complaintId, response)
```

---

#### 5. **DocumentManagement.tsx** - 🟡 MEDIUM PRIORITY
**Mock Data:**
```typescript
const documents = [
  { lodger: "Tom Brown", type: "Tenancy Agreement", filename: "...", ... }
];
```

**Database Tables Available:**
- `documents` - all documents
- `lodger_profiles` - document owners
- `properties`, `rooms` - related properties
- Document types: tenancy agreements, ID verification, certificates, etc.

**Required Queries:**
```typescript
- getAllDocuments(filters: { type?, status?, user_id? })
- getExpiringDocuments(days: number)
- uploadDocument(data)
- updateDocumentStatus(documentId, status)
- deleteDocument(documentId)
- getDocumentsByLodger(lodgerId)
```

---

#### 6. **ServiceUsers.tsx** - 🟡 MEDIUM PRIORITY
**Mock Data:**
```typescript
const serviceUsers = [
  { name: "James Wilson", type: "Cleaner", phone: "...", ... }
];
const assignedTasks = [...];
```

**Database Tables Available:**
- `service_user_profiles` - service user info
- `service_user_tasks` - task assignments
- `properties` - task locations

**Required Queries:**
```typescript
- getAllServiceUsers(filters: { type?, is_active? })
- getServiceUserDetails(userId)
- createServiceUser(data)
- updateServiceUser(userId, data)
- getServiceUserTasks(userId)
- createServiceUserTask(data)
- updateTaskStatus(taskId, status)
```

---

#### 7. **PaymentsBilling.tsx** - 🟡 MEDIUM PRIORITY
**Mock Data:**
```typescript
const payments = [
  { lodger: "Tom Brown", property: "789 High St", amount: "£750", ... }
];
```

**Database Tables Available:**
- `payments` - all payment records
- `lodger_profiles` - payers
- `tenancies` - rent amounts
- `extra_charges` - additional charges

**Required Queries:**
```typescript
- getAllPayments(filters: { status?, type?, date_range? })
- getOverduePayments()
- getPendingPayments()
- recordPayment(data)
- updatePaymentStatus(paymentId, status)
- generatePaymentReport(dateRange)
```

---

#### 8. **NotificationsSMS.tsx** - 🟢 LOW PRIORITY
**Mock Data:**
```typescript
const notifications = [
  { recipient: "Tom Brown", message: "...", type: "SMS", ... }
];
const allUsers = [...];  // For sending notifications
```

**Database Tables Available:**
- `notifications` - all notifications
- `lodger_profiles`, `landlord_profiles`, `staff_profiles` - recipients
- `notification_templates` - message templates

**Required Queries:**
```typescript
- getAllNotifications(filters: { type?, status?, date_range? })
- getUsersForNotification(role?)
- sendNotification(data)
- sendBulkNotifications(recipients[], message)
- getNotificationTemplates()
```

---

#### 9. **RolePermissions.tsx** - 🟢 LOW PRIORITY
**Mock Data:**
```typescript
const roles = [...];
const permissions = [...];
```

**Database Tables Available:**
- `user_roles` - user role assignments
- Admin, Staff, Landlord, Lodger, Service User roles

**Required Queries:**
```typescript
- getAllRoles()
- getRolePermissions(role)
- updateRolePermissions(role, permissions)
- getUsersByRole(role)
```

---

#### 10. **SystemLogs.tsx** - 🟢 LOW PRIORITY
**Mock Data:**
```typescript
const logs = [
  { timestamp: "...", user: "...", action: "...", ... }
];
```

**Database Tables Available:**
- `audit_logs` - system activity logs
- Log levels: info, warning, error, critical

**Required Queries:**
```typescript
- getSystemLogs(filters: { level?, user_id?, action?, date_range? })
- getRecentErrors()
- getCriticalLogs()
- logActivity(data)
```

---

## Implementation Priority Order

### Phase 1: Core Operations (Week 1)
1. ✅ AdminOverview - DONE
2. ✅ StaffManagement - DONE  
3. ✅ PropertyManagement - DONE
4. 🔴 **BinManagement** - Start here
5. 🔴 **InspectionManagement** - Next

### Phase 2: Financial & User Management (Week 2)
6. 🟡 **ExtraCharges**
7. 🟡 **PaymentsBilling**
8. 🟡 **ComplaintManagement**

### Phase 3: Documents & Service Users (Week 3)
9. 🟡 **DocumentManagement**
10. 🟡 **ServiceUsers**

### Phase 4: Supporting Features (Week 4)
11. 🟢 **NotificationsSMS**
12. 🟢 **RolePermissions**
13. 🟢 **SystemLogs**

---

## Next Steps - BinManagement Implementation

### Step 1: Add Query Functions to `/src/lib/queries.ts`
```typescript
// Bin Rotation Queries
export const getBinRotationSchedules = async (propertyId?: string) => { ... }
export const getBinDuties = async (filters) => { ... }
export const getMissedBinDuties = async () => { ... }
export const updateBinDutyStatus = async (dutyId, status) => { ... }
export const createBinDutyCharge = async (data) => { ... }
```

### Step 2: Update BinManagement.tsx Component
- Replace mock data arrays with state
- Add useEffect to load real data
- Implement CRUD operations
- Add loading states and error handling

### Step 3: Test with Real Data
- Verify data loads correctly
- Test updates and status changes
- Ensure charges are created properly

---

## Summary Statistics

- **Total Admin Pages:** 13
- **✅ Integrated:** 3 (AdminOverview, StaffManagement, PropertyManagement)
- **❌ Need Integration:** 10
- **High Priority:** 2 (BinManagement, InspectionManagement)
- **Medium Priority:** 5 (ExtraCharges, PaymentsBilling, ComplaintManagement, DocumentManagement, ServiceUsers)
- **Low Priority:** 3 (NotificationsSMS, RolePermissions, SystemLogs)

**Current Progress:** 23% Complete (3/13 pages)
**Estimated Time to Complete:** 3-4 weeks for full integration
