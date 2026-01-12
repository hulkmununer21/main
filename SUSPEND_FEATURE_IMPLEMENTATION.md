# User Account Suspension Feature - Implementation Plan

## 📋 Executive Summary

This document outlines a comprehensive approach to implement a user suspension feature across all user roles (Lodgers, Landlords, Staff, Service Users, and Admins) in the Domus Servitia platform.

---

## 🎯 Current State Analysis

### Database Structure
The system already has `is_active` fields in profile tables:
- ✅ `user_roles.is_active` (BOOLEAN DEFAULT true)
- ✅ `staff_profiles.is_active` (BOOLEAN DEFAULT true) 
- ✅ `lodger_profiles.is_active` (BOOLEAN DEFAULT true)
- ✅ `service_user_profiles.is_active` (BOOLEAN DEFAULT true)
- ⚠️ `landlord_profiles.is_verified` (used for verification, not suspension)
- ❌ `admin_profiles` - **NO** `is_active` field

### Authentication Flow
Current login process in `AuthContext.tsx`:
1. Authenticate with Supabase Auth
2. Fetch role from `user_roles` table
3. Validate expected role
4. Fetch profile from role-specific table
5. Update `last_login` timestamp
6. Store user data in state and localStorage
7. Redirect to role-specific portal

**⚠️ CRITICAL GAP**: No check for `is_active` status during login!

---

## 🔧 Recommended Implementation Strategy

### Phase 1: Database Schema Updates (SQL)

#### 1.1 Add Missing Fields
```sql
-- Add is_active to admin_profiles
ALTER TABLE admin_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add suspension tracking fields to all profile tables
ALTER TABLE admin_profiles 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES admin_profiles(id),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE staff_profiles 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES admin_profiles(id),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE lodger_profiles 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES admin_profiles(id),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE landlord_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES admin_profiles(id),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE service_user_profiles 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES admin_profiles(id),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
```

#### 1.2 Create Suspension Audit Log Table
```sql
CREATE TABLE account_suspension_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(20) NOT NULL, -- 'suspended' or 'reactivated'
    performed_by UUID NOT NULL REFERENCES admin_profiles(id),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suspension_logs_user_id ON account_suspension_logs(user_id);
CREATE INDEX idx_suspension_logs_created_at ON account_suspension_logs(created_at DESC);
```

---

### Phase 2: Authentication Layer Updates

#### 2.1 Update `AuthContext.tsx` Login Function
Add suspension check after profile fetch:

```typescript
// In the login function, after fetching profile:
const profile = await fetchUserProfile(userId, role);

if (!profile) {
  toast.error("User profile not found. Please contact support.");
  throw new Error("User profile not found.");
}

// ✅ NEW: Check if account is suspended
const isActive = profile.is_active ?? true; // Default to true for backwards compatibility
if (!isActive) {
  await supabase.auth.signOut();
  toast.error("Your account has been suspended. Please contact support for assistance.");
  throw new Error("Account suspended");
}

// Continue with existing login flow...
```

#### 2.2 Add Profile Status Check Helper
```typescript
// Add to AuthContext.tsx
const checkAccountStatus = (profile: any): { isActive: boolean; reason?: string } => {
  const isActive = profile.is_active ?? true;
  
  return {
    isActive,
    reason: !isActive ? profile.suspension_reason : undefined
  };
};
```

---

### Phase 3: Admin Portal UI Components

#### 3.1 Create Suspend/Reactivate Button Component
**File**: `/src/components/admin/UserStatusToggle.tsx`

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Ban, CheckCircle, AlertTriangle } from "lucide-react";

interface UserStatusToggleProps {
  userId: string;
  userRole: 'admin' | 'staff' | 'lodger' | 'landlord' | 'service_user';
  currentStatus: boolean;
  userName: string;
  onStatusChange: () => void;
  adminId: string;
}

export const UserStatusToggle = ({ 
  userId, 
  userRole, 
  currentStatus, 
  userName, 
  onStatusChange,
  adminId 
}: UserStatusToggleProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const profileTableMap = {
    admin: 'admin_profiles',
    staff: 'staff_profiles',
    lodger: 'lodger_profiles',
    landlord: 'landlord_profiles',
    service_user: 'service_user_profiles'
  };

  const handleToggle = async () => {
    if (!currentStatus && !reason.trim()) {
      toast.error("Please provide a reason for suspension");
      return;
    }

    setLoading(true);
    try {
      const tableName = profileTableMap[userRole];
      const newStatus = !currentStatus;

      // Update profile table
      const updateData: any = {
        is_active: newStatus,
        suspended_at: newStatus ? null : new Date().toISOString(),
        suspended_by: newStatus ? null : adminId,
        suspension_reason: newStatus ? null : reason,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Update user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ is_active: newStatus })
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Log the action
      await supabase.from('account_suspension_logs').insert({
        user_id: userId,
        action: newStatus ? 'reactivated' : 'suspended',
        performed_by: adminId,
        reason: reason || null
      });

      toast.success(`User ${newStatus ? 'reactivated' : 'suspended'} successfully`);
      setDialogOpen(false);
      setReason("");
      onStatusChange();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={currentStatus ? "destructive" : "default"}
        size="sm"
        onClick={() => setDialogOpen(true)}
      >
        {currentStatus ? (
          <>
            <Ban className="w-4 h-4 mr-2" />
            Suspend
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Reactivate
          </>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {currentStatus ? 'Suspend' : 'Reactivate'} User Account
            </DialogTitle>
            <DialogDescription>
              {currentStatus 
                ? `You are about to suspend ${userName}'s account. They will not be able to log in until reactivated.`
                : `You are about to reactivate ${userName}'s account. They will be able to log in again.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">
                {currentStatus ? 'Reason for Suspension *' : 'Reason for Reactivation (Optional)'}
              </Label>
              <Textarea
                id="reason"
                placeholder={currentStatus 
                  ? "Violation of terms, payment issues, etc." 
                  : "Issue resolved, appeal approved, etc."
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required={currentStatus}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> This action will be logged and can be audited.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={currentStatus ? "destructive" : "default"}
              onClick={handleToggle}
              disabled={loading || (currentStatus && !reason.trim())}
            >
              {loading ? 'Processing...' : currentStatus ? 'Suspend Account' : 'Reactivate Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
```

---

### Phase 4: Integration into Admin Management Pages

#### 4.1 User Management (`UserManagement.tsx`)
Add status column to table and integrate toggle button:

```typescript
// In the table body, add a Status column:
<TableCell>
  <Badge variant={user.is_active ? 'default' : 'destructive'}>
    {user.is_active ? 'Active' : 'Suspended'}
  </Badge>
</TableCell>
<TableCell>
  <UserStatusToggle
    userId={user.user_id}
    userRole={user.role_type}
    currentStatus={user.is_active ?? true}
    userName={user.full_name}
    onStatusChange={loadUsers}
    adminId={(currentUser.profile as any)?.id}
  />
</TableCell>
```

#### 4.2 Staff Management (`StaffManagement.tsx`)
Similar integration:

```typescript
<TableCell>
  <UserStatusToggle
    userId={staff.user_id}
    userRole="staff"
    currentStatus={staff.is_active}
    userName={staff.full_name}
    onStatusChange={loadStaff}
    adminId={(currentUser.profile as any)?.id}
  />
</TableCell>
```

#### 4.3 Service Users (`ServiceUsers.tsx`)
Add to service user cards:

```typescript
<div className="flex gap-2 mt-3">
  <UserStatusToggle
    userId={user.user_id}
    userRole="service_user"
    currentStatus={user.is_active}
    userName={user.full_name}
    onStatusChange={fetchData}
    adminId={staffId}
  />
  {/* Other buttons */}
</div>
```

---

### Phase 5: Admin Dashboard Widget

#### 5.1 Suspension Statistics Card
Add to Admin Dashboard (`AdminDashboard.tsx` or `AdminPortal.tsx`):

```typescript
const [suspensionStats, setSuspensionStats] = useState({
  total: 0,
  recent: 0 // Suspended in last 30 days
});

// In fetchData:
const { data: suspendedUsers } = await supabase
  .from('user_roles')
  .select('*, admin_profiles!inner(*), staff_profiles!inner(*), lodger_profiles!inner(*), landlord_profiles!inner(*), service_user_profiles!inner(*)')
  .eq('is_active', false);

setSuspensionStats({
  total: suspendedUsers?.length || 0,
  recent: suspendedUsers?.filter(u => {
    const profileData = u.admin_profiles?.[0] || u.staff_profiles?.[0] || 
                        u.lodger_profiles?.[0] || u.landlord_profiles?.[0] || 
                        u.service_user_profiles?.[0];
    return profileData?.suspended_at && 
           new Date(profileData.suspended_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }).length || 0
});

// Stats Card:
<Card>
  <CardContent className="p-6">
    <div className="flex items-center gap-3">
      <div className="bg-red-500/10 p-3 rounded-full">
        <Ban className="w-5 h-5 text-red-600" />
      </div>
      <div>
        <p className="text-2xl font-bold">{suspensionStats.total}</p>
        <p className="text-sm text-muted-foreground">Suspended Accounts</p>
        <p className="text-xs text-red-600">{suspensionStats.recent} this month</p>
      </div>
    </div>
  </CardContent>
</Card>
```

---

### Phase 6: Audit Trail & History View

#### 6.1 Create Suspension History Component
**File**: `/src/components/admin/SuspensionHistory.tsx`

```typescript
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { format, parseISO } from "date-fns";

export const SuspensionHistory = ({ userId }: { userId: string }) => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadLogs();
  }, [userId]);

  const loadLogs = async () => {
    const { data } = await supabase
      .from('account_suspension_logs')
      .select('*, admin_profiles(full_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    setLogs(data || []);
  };

  if (logs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Suspension History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <Badge variant={log.action === 'suspended' ? 'destructive' : 'default'}>
                {log.action}
              </Badge>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  By: {log.admin_profiles?.full_name || 'System'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(log.created_at), 'PPP p')}
                </p>
                {log.reason && (
                  <p className="text-sm mt-1 text-muted-foreground italic">
                    Reason: {log.reason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

#### 6.2 Add to User Detail Views
Integrate `<SuspensionHistory userId={viewingUser.user_id} />` in detail dialogs.

---

### Phase 7: User-Facing Feedback

#### 7.1 Enhanced Login Error Message
Already implemented in Phase 2.1, but enhance further:

```typescript
if (!isActive) {
  await supabase.auth.signOut();
  
  const suspensionInfo = profile.suspension_reason 
    ? `\n\nReason: ${profile.suspension_reason}` 
    : '';
  
  toast.error(
    `Your account has been suspended.${suspensionInfo}\n\nPlease contact support at support@domusservitia.co.uk`,
    { duration: 8000 }
  );
  
  throw new Error("Account suspended");
}
```

#### 7.2 Support Contact Page Addition
Add a "Suspended Account" FAQ entry in the support/contact pages.

---

## 📊 Feature Rollout Checklist

### Pre-Deployment
- [ ] Run database migration scripts on staging
- [ ] Test suspension on test accounts for all roles
- [ ] Verify suspension logs are being created
- [ ] Test reactivation flow
- [ ] Ensure suspended users cannot login
- [ ] Verify active sessions are not terminated (optional: implement if needed)

### Deployment
- [ ] Deploy database schema changes
- [ ] Deploy backend/API changes
- [ ] Deploy frontend UI updates
- [ ] Update documentation

### Post-Deployment
- [ ] Monitor suspension logs
- [ ] Train admin staff on new feature
- [ ] Create internal SOP for account suspension
- [ ] Set up alerts for mass suspensions (potential bug)

---

## 🔐 Security Considerations

1. **Admin-Only Access**: Only admins can suspend/reactivate accounts
2. **Audit Trail**: All actions are logged with admin ID and timestamp
3. **Reason Required**: Suspensions require a documented reason
4. **No Self-Suspension**: Admins cannot suspend their own accounts (add validation)
5. **Role Protection**: Super admins should have extra protection (implement if needed)

---

## 🎨 UI/UX Recommendations

### Status Badges
- 🟢 Active: Green badge
- 🔴 Suspended: Red badge with "Suspended" text
- 🟡 Pending: Yellow (for future use)

### Button Colors
- Suspend: Destructive (Red)
- Reactivate: Default (Blue/Primary)

### Confirmation Dialogs
- Always show warnings before suspension
- Display user's full name for confirmation
- Require reason field (mandatory for suspension, optional for reactivation)

---

## 📈 Analytics & Reporting

### Metrics to Track
1. Total suspended accounts by role
2. Suspension reasons (categorized)
3. Average suspension duration
4. Reactivation rate
5. Admins performing most suspensions

### Suggested Reports
- Monthly suspension report
- User status distribution
- Suspension reason analysis

---

## 🔄 Future Enhancements

1. **Auto-Suspension**: For repeated policy violations
2. **Temporary Suspension**: Set expiry date for automatic reactivation
3. **Warning System**: 3-strike system before suspension
4. **Email Notifications**: Notify users when suspended/reactivated
5. **Appeal System**: Allow users to submit appeals
6. **Bulk Operations**: Suspend multiple users at once
7. **Session Termination**: Force logout of suspended users immediately

---

## 📝 Database Migration Script

**File**: `/db/migrations/002_add_suspension_feature.sql`

```sql
-- Migration: Add Account Suspension Feature
-- Date: 2026-01-12
-- Description: Adds suspension tracking to all user profile tables

BEGIN;

-- 1. Add is_active to admin_profiles
ALTER TABLE admin_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Add is_active to landlord_profiles  
ALTER TABLE landlord_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Add suspension tracking fields to all profiles
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'admin_profiles',
            'staff_profiles', 
            'lodger_profiles',
            'landlord_profiles',
            'service_user_profiles'
        ])
    LOOP
        EXECUTE format('
            ALTER TABLE %I 
            ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS suspension_reason TEXT
        ', tbl);
    END LOOP;
END $$;

-- 4. Create suspension audit log
CREATE TABLE IF NOT EXISTS account_suspension_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('suspended', 'reactivated')),
    performed_by UUID NOT NULL REFERENCES admin_profiles(id) ON DELETE SET NULL,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_suspension_logs_user_id ON account_suspension_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_suspension_logs_created_at ON account_suspension_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suspension_logs_action ON account_suspension_logs(action);

-- 6. Add comments
COMMENT ON TABLE account_suspension_logs IS 'Audit trail for account suspension and reactivation actions';
COMMENT ON COLUMN account_suspension_logs.action IS 'Type of action: suspended or reactivated';
COMMENT ON COLUMN account_suspension_logs.performed_by IS 'Admin who performed the action';

COMMIT;
```

---

## 🧪 Testing Scenarios

### Test Case 1: Suspend Lodger Account
1. Admin logs in
2. Navigate to User Management
3. Select active lodger
4. Click "Suspend" button
5. Enter reason "Non-payment of rent"
6. Confirm suspension
7. **Expected**: Badge changes to "Suspended", button changes to "Reactivate"

### Test Case 2: Suspended User Login Attempt
1. Logout as admin
2. Attempt to login as suspended lodger
3. **Expected**: Error toast "Your account has been suspended. Please contact support."
4. User remains on login page

### Test Case 3: Reactivate Account
1. Admin logs in
2. Navigate to suspended user
3. Click "Reactivate"
4. Enter reason (optional)
5. Confirm
6. **Expected**: User can now log in successfully

### Test Case 4: Audit Log Verification
1. After suspension, check `account_suspension_logs` table
2. **Expected**: Record with action='suspended', reason filled, admin ID recorded

### Test Case 5: Multi-Role Testing
- Repeat Test Cases 1-4 for: Staff, Landlord, Service User

---

## 📞 Support & Rollback

### If Issues Arise

**Immediate Rollback Steps**:
```sql
-- Disable suspension check temporarily
-- (Comment out the is_active check in AuthContext.tsx)

-- Reactivate all accounts
UPDATE user_roles SET is_active = true;
UPDATE admin_profiles SET is_active = true;
UPDATE staff_profiles SET is_active = true;
UPDATE lodger_profiles SET is_active = true;
UPDATE landlord_profiles SET is_active = true;
UPDATE service_user_profiles SET is_active = true;
```

### Support Contact
For implementation questions or issues:
- Email: dev@domusservitia.co.uk
- Slack: #dev-account-management

---

## ✅ Summary

This implementation provides:
- ✅ Suspend/reactivate capability for all user roles
- ✅ Comprehensive audit trail
- ✅ Admin-only controls with reason tracking
- ✅ User-friendly UI with confirmation dialogs
- ✅ Login-time suspension enforcement
- ✅ Historical suspension view
- ✅ Database migration scripts ready
- ✅ Testing scenarios defined

**Estimated Implementation Time**: 2-3 days for a single developer

**Priority**: Medium-High (Important for platform governance)

---

*Document Version: 1.0*  
*Last Updated: January 12, 2026*  
*Author: AI Assistant*
