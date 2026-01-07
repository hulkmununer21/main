import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Plus, Edit, Trash2, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  role_type: string;
  is_verified: boolean;
  created_at: string;
  profile?: Record<string, unknown>;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  
  // Form state
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role_type: "lodger",
    // Lodger specific fields
    date_of_birth: "",
    nationality: "",
    passport_number: "",
    ni_number: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    current_address: "",
    previous_address: "",
    city: "",
    postcode: "",
    employment_status: "",
    employer_name: "",
    employer_contact: "",
    monthly_income: "",
    // Landlord specific fields
    company_name: "",
    company_registration: "",
    tax_id: "",
    address: "",
    bank_name: "",
    bank_account_number: "",
    bank_sort_code: "",
    preferred_payment_method: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all user roles for lodgers and landlords
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['lodger', 'landlord'])
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch lodger profiles
      const { data: lodgers, error: lodgersError } = await supabase
        .from('lodger_profiles')
        .select('*');

      if (lodgersError) throw lodgersError;

      // Fetch landlord profiles
      const { data: landlords, error: landlordsError } = await supabase
        .from('landlord_profiles')
        .select('*');

      if (landlordsError) throw landlordsError;

      // Merge data
      const mergedUsers: User[] = (userRoles || []).map((role) => {
        const lodger = lodgers?.find(l => l.user_id === role.user_id);
        const landlord = landlords?.find(l => l.user_id === role.user_id);
        const profile = lodger || landlord;

        // Get verification status from the appropriate profile column
        // lodger_profiles uses is_active, landlord_profiles uses is_verified
        const isVerified = lodger ? lodger.is_active : (landlord ? landlord.is_verified : false);

        return {
          id: profile?.id || role.user_id,
          user_id: role.user_id,
          email: profile?.email || 'N/A',
          full_name: profile?.full_name || 'N/A',
          phone: profile?.phone,
          role_type: role.role,
          is_verified: isVerified,
          created_at: role.created_at,
          profile: profile || {},
        };
      });

      setUsers(mergedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({
      email: "",
      password: "",
      full_name: "",
      phone: "",
      role_type: "lodger",
      date_of_birth: "",
      nationality: "",
      passport_number: "",
      ni_number: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relationship: "",
      current_address: "",
      previous_address: "",
      city: "",
      postcode: "",
      employment_status: "",
      employer_name: "",
      employer_contact: "",
      monthly_income: "",
      company_name: "",
      company_registration: "",
      tax_id: "",
      address: "",
      bank_name: "",
      bank_account_number: "",
      bank_sort_code: "",
      preferred_payment_method: "",
    });
    setDialogOpen(true);
  };

  const handleEditUser = async (user: User) => {
    setEditingUser(user);
    
    // Fetch full profile data based on role
    const tableName = user.role_type === 'lodger' ? 'lodger_profiles' : 'landlord_profiles';
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', user.user_id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load user data");
      return;
    }

    if (user.role_type === 'lodger') {
      setUserForm({
        email: data.email || user.email,
        password: "",
        full_name: data.full_name || "",
        phone: data.phone || "",
        role_type: "lodger",
        date_of_birth: data.date_of_birth || "",
        nationality: data.nationality || "",
        passport_number: data.passport_number || "",
        ni_number: data.ni_number || "",
        emergency_contact_name: data.emergency_contact_name || "",
        emergency_contact_phone: data.emergency_contact_phone || "",
        emergency_contact_relationship: data.emergency_contact_relationship || "",
        current_address: data.current_address || "",
        previous_address: data.previous_address || "",
        city: data.city || "",
        postcode: data.postcode || "",
        employment_status: data.employment_status || "",
        employer_name: data.employer_name || "",
        employer_contact: data.employer_contact || "",
        monthly_income: data.monthly_income?.toString() || "",
        company_name: "",
        company_registration: "",
        tax_id: "",
        address: "",
        bank_name: "",
        bank_account_number: "",
        bank_sort_code: "",
        preferred_payment_method: "",
      });
    } else {
      setUserForm({
        email: data.email || user.email,
        password: "",
        full_name: data.full_name || "",
        phone: data.phone || "",
        role_type: "landlord",
        date_of_birth: "",
        nationality: "",
        passport_number: "",
        ni_number: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        emergency_contact_relationship: "",
        current_address: "",
        previous_address: "",
        city: "",
        postcode: "",
        employment_status: "",
        employer_name: "",
        employer_contact: "",
        monthly_income: "",
        company_name: data.company_name || "",
        company_registration: data.company_registration || "",
        tax_id: data.tax_id || "",
        address: data.address || "",
        bank_name: data.bank_name || "",
        bank_account_number: data.bank_account_number || "",
        bank_sort_code: data.bank_sort_code || "",
        preferred_payment_method: data.preferred_payment_method || "",
      });
    }

    setDialogOpen(true);
  };

  const handleViewUser = async (user: User) => {
    // Fetch full profile data
    const tableName = user.role_type === 'lodger' ? 'lodger_profiles' : 'landlord_profiles';
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', user.user_id)
      .single();

    if (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details");
      return;
    }

    setViewingUser({
      ...user,
      email: data.email || user.email,
      profile: data,
    });
    setViewDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    setDeleteTarget(userId);
    setDeleteDialogOpen(true);
  };

  const submitForm = async () => {
    try {
      if (editingUser) {
        // Update existing user - update all profile fields except email
        const tableName = editingUser.role_type === 'lodger' ? 'lodger_profiles' : 'landlord_profiles';
        
        if (editingUser.role_type === 'lodger') {
          const { error } = await supabase
            .from('lodger_profiles')
            .update({
              full_name: userForm.full_name,
              phone: userForm.phone || null,
              date_of_birth: userForm.date_of_birth || null,
              nationality: userForm.nationality || null,
              passport_number: userForm.passport_number || null,
              ni_number: userForm.ni_number || null,
              emergency_contact_name: userForm.emergency_contact_name || null,
              emergency_contact_phone: userForm.emergency_contact_phone || null,
              emergency_contact_relationship: userForm.emergency_contact_relationship || null,
              current_address: userForm.current_address || null,
              previous_address: userForm.previous_address || null,
              city: userForm.city || null,
              postcode: userForm.postcode || null,
              employment_status: userForm.employment_status || null,
              employer_name: userForm.employer_name || null,
              employer_contact: userForm.employer_contact || null,
              monthly_income: userForm.monthly_income ? parseFloat(userForm.monthly_income) : null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', editingUser.user_id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('landlord_profiles')
            .update({
              full_name: userForm.full_name,
              phone: userForm.phone || null,
              company_name: userForm.company_name || null,
              company_registration: userForm.company_registration || null,
              tax_id: userForm.tax_id || null,
              address: userForm.address || null,
              city: userForm.city || null,
              postcode: userForm.postcode || null,
              bank_name: userForm.bank_name || null,
              bank_account_number: userForm.bank_account_number || null,
              bank_sort_code: userForm.bank_sort_code || null,
              preferred_payment_method: userForm.preferred_payment_method || null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', editingUser.user_id);

          if (error) throw error;
        }

        toast.success("User updated successfully");
      } else {
        // Create new user - following signup.tsx logic
        if (!userForm.password) {
          toast.error("Password is required for new users");
          return;
        }

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userForm.email,
          password: userForm.password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        const userId = authData.user.id;

        // 2. Create profile based on role (BEFORE user_roles as per signup.tsx)
        const profileTable = userForm.role_type === 'lodger' ? 'lodger_profiles' : 'landlord_profiles';
        // lodger_profiles uses is_active, landlord_profiles uses is_verified
        const profileData: any = {
          user_id: userId,
          email: userForm.email,
          full_name: userForm.full_name,
          phone: userForm.phone || null,
        };
        
        if (userForm.role_type === 'lodger') {
          profileData.is_active = true;
        } else {
          profileData.is_verified = true;
        }
        
        const { error: profileError } = await supabase
          .from(profileTable)
          .insert(profileData);

        if (profileError) throw profileError;

        // 3. Create user_roles entry (no email column)
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: userForm.role_type,
            is_active: true,
          });

        if (roleError) throw roleError;

        toast.success("User created successfully");
      }

      setDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      // Find user to get user_id
      const user = users.find(u => u.id === deleteTarget);
      if (!user) throw new Error("User not found");

      // Delete profile first (cascade will handle user_roles)
      const tableName = user.role_type === 'lodger' ? 'lodger_profiles' : 'landlord_profiles';
      const { error: profileError } = await supabase
        .from(tableName)
        .delete()
        .eq('user_id', user.user_id);

      if (profileError) throw profileError;

      // Delete user_roles entry
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.user_id);

      if (roleError) throw roleError;

      // Note: Supabase auth user deletion requires admin privileges
      // You may need to call a backend function for this
      
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role_type === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">User Management</h2>
          <p className="text-muted-foreground">Manage lodgers and landlords</p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-3 rounded-full">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role_type === 'lodger').length}</p>
                <p className="text-sm text-muted-foreground">Total Lodgers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-3 rounded-full">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role_type === 'landlord').length}</p>
                <p className="text-sm text-muted-foreground">Total Landlords</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 p-3 rounded-full">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.is_verified).length}</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>View and manage all lodgers and landlords</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="lodger">Lodgers</SelectItem>
                <SelectItem value="landlord">Landlords</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={user.role_type === 'lodger' ? 'default' : 'secondary'}>
                        {user.role_type === 'lodger' ? 'Lodger' : 'Landlord'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_verified ? 'default' : 'destructive'}>
                        {user.is_verified ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewUser(user)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update user information" : "Create a new lodger or landlord account"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {/* User Type Selection */}
            <div className="grid gap-2">
              <Label htmlFor="role_type">User Type *</Label>
              <Select
                value={userForm.role_type}
                onValueChange={(value) => setUserForm({ ...userForm, role_type: value })}
                disabled={!!editingUser}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lodger">Lodger (Looking for Property)</SelectItem>
                  <SelectItem value="landlord">Landlord (Property Owner)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Full Name */}
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                placeholder="John Doe"
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                disabled={!!editingUser}
                required
              />
            </div>

            {/* Phone Number */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+44 7000 000000"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
              />
            </div>

            {/* Password (only for new users) */}
            {!editingUser && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Additional Fields when Editing */}
            {editingUser && (
              <>
                {/* Lodger-specific fields */}
                {userForm.role_type === 'lodger' && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    <h3 className="font-semibold text-lg">Personal Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={userForm.date_of_birth}
                          onChange={(e) => setUserForm({ ...userForm, date_of_birth: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="nationality">Nationality</Label>
                        <Input
                          id="nationality"
                          value={userForm.nationality}
                          onChange={(e) => setUserForm({ ...userForm, nationality: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="passport_number">Passport Number</Label>
                        <Input
                          id="passport_number"
                          value={userForm.passport_number}
                          onChange={(e) => setUserForm({ ...userForm, passport_number: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="ni_number">NI Number</Label>
                        <Input
                          id="ni_number"
                          value={userForm.ni_number}
                          onChange={(e) => setUserForm({ ...userForm, ni_number: e.target.value })}
                        />
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg pt-4">Address Information</h3>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="current_address">Current Address</Label>
                      <Input
                        id="current_address"
                        value={userForm.current_address}
                        onChange={(e) => setUserForm({ ...userForm, current_address: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="previous_address">Previous Address</Label>
                      <Input
                        id="previous_address"
                        value={userForm.previous_address}
                        onChange={(e) => setUserForm({ ...userForm, previous_address: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={userForm.city}
                          onChange={(e) => setUserForm({ ...userForm, city: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="postcode">Postcode</Label>
                        <Input
                          id="postcode"
                          value={userForm.postcode}
                          onChange={(e) => setUserForm({ ...userForm, postcode: e.target.value })}
                        />
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg pt-4">Emergency Contact</h3>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="emergency_contact_name">Name</Label>
                      <Input
                        id="emergency_contact_name"
                        value={userForm.emergency_contact_name}
                        onChange={(e) => setUserForm({ ...userForm, emergency_contact_name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="emergency_contact_phone">Phone</Label>
                        <Input
                          id="emergency_contact_phone"
                          type="tel"
                          value={userForm.emergency_contact_phone}
                          onChange={(e) => setUserForm({ ...userForm, emergency_contact_phone: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                        <Input
                          id="emergency_contact_relationship"
                          value={userForm.emergency_contact_relationship}
                          onChange={(e) => setUserForm({ ...userForm, emergency_contact_relationship: e.target.value })}
                        />
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg pt-4">Employment Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="employment_status">Employment Status</Label>
                        <Input
                          id="employment_status"
                          value={userForm.employment_status}
                          onChange={(e) => setUserForm({ ...userForm, employment_status: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="employer_name">Employer Name</Label>
                        <Input
                          id="employer_name"
                          value={userForm.employer_name}
                          onChange={(e) => setUserForm({ ...userForm, employer_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="employer_contact">Employer Contact</Label>
                        <Input
                          id="employer_contact"
                          value={userForm.employer_contact}
                          onChange={(e) => setUserForm({ ...userForm, employer_contact: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="monthly_income">Monthly Income (£)</Label>
                        <Input
                          id="monthly_income"
                          type="number"
                          step="0.01"
                          value={userForm.monthly_income}
                          onChange={(e) => setUserForm({ ...userForm, monthly_income: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Landlord-specific fields */}
                {userForm.role_type === 'landlord' && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    <h3 className="font-semibold text-lg">Company Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="company_name">Company Name</Label>
                        <Input
                          id="company_name"
                          value={userForm.company_name}
                          onChange={(e) => setUserForm({ ...userForm, company_name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="company_registration">Company Registration</Label>
                        <Input
                          id="company_registration"
                          value={userForm.company_registration}
                          onChange={(e) => setUserForm({ ...userForm, company_registration: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="tax_id">Tax ID</Label>
                      <Input
                        id="tax_id"
                        value={userForm.tax_id}
                        onChange={(e) => setUserForm({ ...userForm, tax_id: e.target.value })}
                      />
                    </div>

                    <h3 className="font-semibold text-lg pt-4">Address Information</h3>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={userForm.address}
                        onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={userForm.city}
                          onChange={(e) => setUserForm({ ...userForm, city: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="postcode">Postcode</Label>
                        <Input
                          id="postcode"
                          value={userForm.postcode}
                          onChange={(e) => setUserForm({ ...userForm, postcode: e.target.value })}
                        />
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg pt-4">Bank Details</h3>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        value={userForm.bank_name}
                        onChange={(e) => setUserForm({ ...userForm, bank_name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="bank_account_number">Account Number</Label>
                        <Input
                          id="bank_account_number"
                          value={userForm.bank_account_number}
                          onChange={(e) => setUserForm({ ...userForm, bank_account_number: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="bank_sort_code">Sort Code</Label>
                        <Input
                          id="bank_sort_code"
                          value={userForm.bank_sort_code}
                          onChange={(e) => setUserForm({ ...userForm, bank_sort_code: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="preferred_payment_method">Preferred Payment Method</Label>
                      <Select
                        value={userForm.preferred_payment_method}
                        onValueChange={(value) => setUserForm({ ...userForm, preferred_payment_method: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitForm}>
              {editingUser ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Complete profile information</DialogDescription>
          </DialogHeader>

          {viewingUser && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{viewingUser.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{viewingUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{viewingUser.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">User Type</Label>
                    <Badge variant={viewingUser.role_type === 'lodger' ? 'default' : 'secondary'}>
                      {viewingUser.role_type === 'lodger' ? 'Lodger' : 'Landlord'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge variant={viewingUser.is_verified ? 'default' : 'destructive'}>
                      {viewingUser.is_verified ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p className="font-medium">{new Date(viewingUser.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Additional Profile Information */}
              {viewingUser.profile && Object.keys(viewingUser.profile).length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Profile Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(viewingUser.profile).map(([key, value]) => {
                      // Skip certain fields
                      if (['id', 'user_id', 'created_at', 'updated_at', 'is_active', 'is_verified', 'email', 'full_name', 'phone'].includes(key)) {
                        return null;
                      }
                      
                      // Format the key
                      const formattedKey = key.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ');
                      
                      // Format the value
                      const formattedValue = value ? String(value) : 'N/A';
                      
                      return (
                        <div key={key}>
                          <Label className="text-muted-foreground">{formattedKey}</Label>
                          <p className="font-medium">{formattedValue}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
