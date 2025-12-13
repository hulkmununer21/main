# Domus Servitia - Database Integration Guide

## ✅ Completed Steps

### Phase 1: Authentication System Setup (COMPLETED)

**Files Updated:**
1. ✅ `/src/contexts/AuthContextTypes.ts` - All profile interfaces match schema
2. ✅ `/src/contexts/AuthContext.tsx` - Updated login/signup functions
3. ✅ `/src/pages/Signup.tsx` - Changed from first_name/last_name to full_name

**Changes Made:**
- All profile interfaces now match DATABASE_SCHEMA.sql exactly
- Login function updates `last_login` timestamp
- Login uses `full_name` from profile for display
- Signup requires `full_name` field
- Better error handling with toast notifications
- Profile validation before setting user state

---

## 🚀 Next Steps: Database Setup

### Step 1: Run the Schema in Supabase (15 minutes)

1. **Go to your Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/nagzgahnvwpagvnylawh
   - Navigate to: SQL Editor

2. **Create New Query**
   - Click "+ New Query"
   - Name it: "Domus Schema Setup"

3. **Copy and Run Schema**
   - Open `/workspaces/main/DATABASE_SCHEMA.sql`
   - Copy the ENTIRE file (all 1281 lines)
   - Paste into Supabase SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify Tables Created**
   - Go to "Table Editor" in Supabase
   - You should see 23+ tables including:
     - `user_roles`
     - `admin_profiles`
     - `staff_profiles`
     - `landlord_profiles`
     - `lodger_profiles`
     - `service_user_profiles`
     - `properties`
     - `rooms`
     - `tenancies`
     - `payments`
     - etc.

**Expected Output:**
```
Success. No rows returned
```

---

### Step 2: Set Up Storage Buckets (10 minutes)

1. **Go to Storage in Supabase**
   - Navigate to: Storage → Buckets

2. **Create the Following Buckets:**

   **a) property-images**
   ```
   - Name: property-images
   - Public: Yes
   - File size limit: 10MB
   - Allowed MIME types: image/*
   ```

   **b) inspection-photos**
   ```
   - Name: inspection-photos
   - Public: No
   - File size limit: 10MB
   - Allowed MIME types: image/*
   ```

   **c) documents**
   ```
   - Name: documents
   - Public: No
   - File size limit: 10MB
   - Allowed MIME types: application/pdf, image/*
   ```

   **d) avatars**
   ```
   - Name: avatars
   - Public: Yes
   - File size limit: 2MB
   - Allowed MIME types: image/*
   ```

   **e) maintenance-photos**
   ```
   - Name: maintenance-photos
   - Public: No
   - File size limit: 10MB
   - Allowed MIME types: image/*
   ```

3. **Set Up Storage Policies**
   - For each bucket, add RLS policies:

   **For avatars (public uploads):**
   ```sql
   CREATE POLICY "Authenticated users can upload avatars"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'avatars');

   CREATE POLICY "Users can view all avatars"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'avatars');

   CREATE POLICY "Users can update own avatar"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

   **For documents (private):**
   ```sql
   CREATE POLICY "Users can upload own documents"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'documents' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );

   CREATE POLICY "Users can view own documents"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (
     bucket_id = 'documents' 
     AND (
       auth.uid()::text = (storage.foldername(name))[1]
       OR EXISTS (
         SELECT 1 FROM user_roles 
         WHERE user_id = auth.uid() 
         AND role IN ('admin', 'staff')
       )
     )
   );
   ```

---

### Step 3: Create Your First Admin User (5 minutes)

1. **Sign Up via Supabase Auth UI**
   - Go to: Authentication → Users
   - Click "Add user"
   - Email: `admin@domusservitia.co.uk`
   - Password: (create a secure password)
   - Auto Confirm User: Yes
   - Click "Create user"

2. **Get the User ID**
   - Copy the UUID from the created user

3. **Insert Admin Profile**
   - Go to: SQL Editor
   - Run this query (replace `USER_ID_HERE` with the UUID):

   ```sql
   -- Insert user role
   INSERT INTO user_roles (user_id, role, is_active)
   VALUES ('USER_ID_HERE', 'admin', true);

   -- Insert admin profile
   INSERT INTO admin_profiles (
     user_id, 
     email, 
     full_name, 
     phone, 
     department, 
     is_super_admin
   )
   VALUES (
     'USER_ID_HERE',
     'admin@domusservitia.co.uk',
     'System Administrator',
     '+44 7000 000000',
     'IT & Operations',
     true
   );
   ```

4. **Test Admin Login**
   - Go to your app: http://localhost:5173/login
   - Login with admin credentials
   - Should redirect to `/admin-portal`

---

### Step 4: Create Test Data (10 minutes)

**Create a Test Landlord:**
```sql
-- 1. Create Supabase auth user first (use Auth UI)
-- Then run this with the user_id:

INSERT INTO user_roles (user_id, role, is_active)
VALUES ('LANDLORD_USER_ID', 'landlord', true);

INSERT INTO landlord_profiles (
  user_id,
  email,
  full_name,
  phone,
  company_name,
  is_verified
)
VALUES (
  'LANDLORD_USER_ID',
  'landlord@test.com',
  'John Smith',
  '+44 7001 000000',
  'Smith Properties Ltd',
  true
);
```

**Create a Test Property:**
```sql
INSERT INTO properties (
  landlord_id,
  property_name,
  address_line1,
  city,
  postcode,
  property_type,
  total_rooms,
  property_status,
  bin_collection_day
)
VALUES (
  (SELECT id FROM landlord_profiles WHERE email = 'landlord@test.com'),
  'Riverside Apartments',
  '123 River Street',
  'Manchester',
  'M1 1AA',
  'apartment',
  5,
  'active',
  'Wednesday'
);
```

**Create Test Rooms:**
```sql
INSERT INTO rooms (
  property_id,
  room_number,
  room_name,
  room_type,
  monthly_rent,
  deposit_amount,
  room_status
)
VALUES 
  (
    (SELECT id FROM properties WHERE property_name = 'Riverside Apartments'),
    '1A',
    'Ensuite Double Room',
    'ensuite',
    750.00,
    750.00,
    'available'
  ),
  (
    (SELECT id FROM properties WHERE property_name = 'Riverside Apartments'),
    '2A',
    'Standard Single Room',
    'single',
    600.00,
    600.00,
    'available'
  );
```

**Create a Test Lodger:**
```sql
-- 1. Create Supabase auth user first (use Auth UI)
-- Then run this:

INSERT INTO user_roles (user_id, role, is_active)
VALUES ('LODGER_USER_ID', 'lodger', true);

INSERT INTO lodger_profiles (
  user_id,
  email,
  full_name,
  phone,
  date_of_birth,
  nationality,
  is_active
)
VALUES (
  'LODGER_USER_ID',
  'lodger@test.com',
  'Sarah Johnson',
  '+44 7002 000000',
  '1995-06-15',
  'British',
  true
);
```

**Create a Test Tenancy:**
```sql
INSERT INTO tenancies (
  lodger_id,
  room_id,
  property_id,
  start_date,
  monthly_rent,
  deposit_amount,
  deposit_paid,
  rent_due_day,
  tenancy_status
)
VALUES (
  (SELECT id FROM lodger_profiles WHERE email = 'lodger@test.com'),
  (SELECT id FROM rooms WHERE room_number = '1A' LIMIT 1),
  (SELECT id FROM properties WHERE property_name = 'Riverside Apartments'),
  '2025-01-01',
  750.00,
  750.00,
  true,
  1,
  'active'
);
```

**Create Test Payment:**
```sql
INSERT INTO payments (
  tenancy_id,
  lodger_id,
  property_id,
  room_id,
  payment_type,
  amount,
  payment_method,
  payment_reference,
  payment_date,
  due_date,
  payment_status
)
VALUES (
  (SELECT id FROM tenancies WHERE lodger_id = (SELECT id FROM lodger_profiles WHERE email = 'lodger@test.com') LIMIT 1),
  (SELECT id FROM lodger_profiles WHERE email = 'lodger@test.com'),
  (SELECT id FROM properties WHERE property_name = 'Riverside Apartments'),
  (SELECT id FROM rooms WHERE room_number = '1A' LIMIT 1),
  'rent',
  750.00,
  'bank_transfer',
  'PAY-20251201-0001',
  '2025-12-01',
  '2025-12-01',
  'completed'
);
```

---

## 📋 Testing Checklist

After setup, test these flows:

### Authentication Tests
- [ ] Admin can login and access `/admin-portal`
- [ ] Landlord can login and access `/landlord-portal`
- [ ] Lodger can login and access `/lodger-portal`
- [ ] Staff can login and access `/staff-portal`
- [ ] Service User can login and access `/serviceuser/dashboard`
- [ ] New lodger can sign up with full_name
- [ ] New landlord can sign up with full_name
- [ ] Logout works correctly
- [ ] Page refresh maintains login session

### Profile Display Tests
- [ ] User's full_name displays in portal header
- [ ] Avatar placeholder shows if no avatar_url
- [ ] Last login timestamp updates on each login

---

## 🔄 Next Phase: Portal Data Integration

Once authentication is working, we'll update each portal to use real data:

### Phase 2: Lodger Portal (Priority 1)
Files to update:
- `/src/pages/LodgerPortal.tsx`
- `/src/pages/lodger/LodgerOverview.tsx`
- `/src/pages/lodger/LodgerPayments.tsx`
- `/src/pages/lodger/LodgerMaintenance.tsx`
- `/src/pages/lodger/LodgerMessages.tsx`
- `/src/pages/lodger/LodgerProfile.tsx`

### Phase 3: Landlord Portal (Priority 2)
Files to update:
- `/src/pages/LandlordPortal.tsx`
- `/src/pages/landlord/*`

### Phase 4: Staff Portal (Priority 3)
Files to update:
- `/src/pages/StaffPortal.tsx`
- `/src/pages/staff/*`

### Phase 5: Admin Portal (Priority 4)
Files to update:
- `/src/pages/AdminPortal.tsx`
- `/src/pages/admin/*`

### Phase 6: Service User Portal (Priority 5)
Files to update:
- `/src/pages/serviceuser/*`

---

## 🛠 Helper Functions to Create

Create `/src/lib/queries.ts` for common database queries:

```typescript
import { supabase } from "./supabaseClient";

// Get lodger's active tenancy
export const getLodgerActiveTenancy = async (lodgerId: string) => {
  const { data, error } = await supabase
    .from('tenancies')
    .select(`
      *,
      room:rooms(*),
      property:properties(*)
    `)
    .eq('lodger_id', lodgerId)
    .eq('tenancy_status', 'active')
    .single();
  
  return { data, error };
};

// Get lodger's payment history
export const getLodgerPayments = async (lodgerId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      property:properties(property_name),
      room:rooms(room_number)
    `)
    .eq('lodger_id', lodgerId)
    .order('payment_date', { ascending: false });
  
  return { data, error };
};

// Get landlord's properties
export const getLandlordProperties = async (landlordId: string) => {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      rooms(*)
    `)
    .eq('landlord_id', landlordId);
  
  return { data, error };
};

// Add more helper functions as needed...
```

---

## 📞 Need Help?

If you encounter issues:
1. Check Supabase logs (Logs → Postgres Logs)
2. Check browser console for errors
3. Verify RLS policies are not blocking queries
4. Check that user_roles table has correct entries

---

## 🎯 Current Status

**COMPLETED:**
- ✅ Database schema created (DATABASE_SCHEMA.sql)
- ✅ AuthContext updated to match schema
- ✅ Signup form updated (full_name field)
- ✅ Profile interfaces match database structure
- ✅ Login updates last_login timestamp

**READY FOR:**
- ⬜ Run schema in Supabase
- ⬜ Create storage buckets
- ⬜ Create first admin user
- ⬜ Create test data
- ⬜ Test authentication flows

**NEXT:**
- Update portal pages to use real data (one portal at a time)

---

**Let me know when you've completed the database setup steps and we'll move on to integrating real data into the portals!** 🚀
