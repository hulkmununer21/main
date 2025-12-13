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
import { Shield, User, Activity, Plus, Edit, Search, Eye, Trash2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  position: string;
  employee_id: string;
  hire_date?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  is_active: boolean;
  created_at: string;
  profile?: Record<string, unknown>;
}

interface Assignment {
  id: string;
  staff_id: string;
  property: { id: string; property_name: string };
  role?: string | null;
  assigned_date?: string | null;
  is_primary?: boolean;
}

interface BinScheduleBrief {
  id: string;
  property: { id: string; property_name: string };
  bin_type: string;
  next_collection_date?: string | null;
  collection_frequency?: string | null;
}

const StaffManagement = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, Assignment[]>>({});
  const [schedulesMap, setSchedulesMap] = useState<Record<string, BinScheduleBrief[]>>({});
  const [viewAssignments, setViewAssignments] = useState<Assignment[] | null>(null);
  const [viewSchedules, setViewSchedules] = useState<BinScheduleBrief[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  
  // Form state
  const [staffForm, setStaffForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    position: "",
    employee_id: "",
    hire_date: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      
      // Fetch user roles for staff
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'staff')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch staff profiles
      const { data: staffProfiles, error: profilesError } = await supabase
        .from('staff_profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Merge data
      const mergedStaff: StaffMember[] = (userRoles || []).map((role) => {
        const profile = staffProfiles?.find(p => p.user_id === role.user_id);
        
        return {
          id: profile?.id || role.user_id,
          user_id: role.user_id,
          email: profile?.email || 'N/A',
          full_name: profile?.full_name || 'N/A',
          phone: profile?.phone,
          position: profile?.position || 'N/A',
          employee_id: profile?.employee_id || 'N/A',
          hire_date: profile?.hire_date,
          emergency_contact_name: profile?.emergency_contact_name,
          emergency_contact_phone: profile?.emergency_contact_phone,
          is_active: role.is_active,
          created_at: role.created_at,
          profile: profile || {},
        };
      });

      setStaffMembers(mergedStaff);

      // Build staff profile id list for assignments lookup
      const staffProfileIds = (staffProfiles || []).map((p: any) => p.id).filter(Boolean);

      if (staffProfileIds.length) {
        // Fetch assignments for these staff profiles
        const { data: assignments } = await supabase
          .from('staff_property_assignments')
          .select('id, staff_id, role, assigned_date, is_primary, property:properties(id, property_name)')
          .in('staff_id', staffProfileIds as string[]);

        const map: Record<string, Assignment[]> = {};
        (assignments || []).forEach((a: any) => {
          const arr = map[a.staff_id] || [];
          arr.push({ id: a.id, staff_id: a.staff_id, property: Array.isArray(a.property) ? a.property[0] : a.property, role: a.role, assigned_date: a.assigned_date, is_primary: a.is_primary });
          map[a.staff_id] = arr;
        });
        setAssignmentsMap(map);

        // Fetch bin_schedules assigned to these staff profiles
        const { data: schedules } = await supabase
          .from('bin_schedules')
          .select('id, property:properties(id, property_name), bin_type, next_collection_date, collection_frequency, assigned_staff_id')
          .in('assigned_staff_id', staffProfileIds as string[]);

        const schedMap: Record<string, BinScheduleBrief[]> = {};
        (schedules || []).forEach((s: any) => {
          const sid = s.assigned_staff_id as string;
          const arr = schedMap[sid] || [];
          arr.push({ id: s.id, property: Array.isArray(s.property) ? s.property[0] : s.property, bin_type: s.bin_type, next_collection_date: s.next_collection_date, collection_frequency: s.collection_frequency });
          schedMap[sid] = arr;
        });
        setSchedulesMap(schedMap);
      }
    } catch (error) {
      console.error("Error loading staff:", error);
      toast.error("Failed to load staff members");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = () => {
    setEditingStaff(null);
    setStaffForm({
      full_name: "",
      email: "",
      phone: "",
      password: "",
      position: "",
      employee_id: "",
      hire_date: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
    });
    setDialogOpen(true);
  };

  const handleEditStaff = async (staff: StaffMember) => {
    setEditingStaff(staff);
    
    // Fetch full profile data
    const { data, error } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('user_id', staff.user_id)
      .single();

    if (error) {
      console.error("Error fetching staff profile:", error);
      toast.error("Failed to load staff data");
      return;
    }

    setStaffForm({
      full_name: data.full_name || "",
      email: data.email || "",
      phone: data.phone || "",
      password: "",
      position: data.position || "",
      employee_id: data.employee_id || "",
      hire_date: data.hire_date || "",
      emergency_contact_name: data.emergency_contact_name || "",
      emergency_contact_phone: data.emergency_contact_phone || "",
    });

    setDialogOpen(true);
  };

  const handleViewStaff = async (staff: StaffMember) => {
    // Fetch full profile data
    const { data, error } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('user_id', staff.user_id)
      .single();

    if (error) {
      console.error("Error fetching staff details:", error);
      toast.error("Failed to load staff details");
      return;
    }

    setViewingStaff({
      ...staff,
      email: data.email || staff.email,
      profile: data,
    });
    // load assignments and schedules for this staff profile id (if present)
    const profileId = (data && (data as any).id) as string | undefined;
    if (profileId) {
      const { data: assigns } = await supabase.from('staff_property_assignments').select('id, staff_id, role, assigned_date, is_primary, property:properties(id, property_name)').eq('staff_id', profileId);
      const viewAssigns: Assignment[] = (assigns || []).map((a: any) => ({ id: a.id, staff_id: a.staff_id, property: Array.isArray(a.property) ? a.property[0] : a.property, role: a.role, assigned_date: a.assigned_date, is_primary: a.is_primary }));
      setViewAssignments(viewAssigns);

      const { data: scheds } = await supabase.from('bin_schedules').select('id, property:properties(id, property_name), bin_type, next_collection_date, collection_frequency').eq('assigned_staff_id', profileId);
      const viewScheds: BinScheduleBrief[] = (scheds || []).map((s: any) => ({ id: s.id, property: Array.isArray(s.property) ? s.property[0] : s.property, bin_type: s.bin_type, next_collection_date: s.next_collection_date, collection_frequency: s.collection_frequency }));
      setViewSchedules(viewScheds);
    } else {
      setViewAssignments(null);
      setViewSchedules(null);
    }
    setViewDialogOpen(true);
  };

  const handleDeleteStaff = (userId: string) => {
    setDeleteTarget(userId);
    setDeleteDialogOpen(true);
  };

  const submitForm = async () => {
    try {
      if (editingStaff) {
        // Update existing staff member
        const { error } = await supabase
          .from('staff_profiles')
          .update({
            full_name: staffForm.full_name,
            phone: staffForm.phone || null,
            position: staffForm.position || null,
            employee_id: staffForm.employee_id || null,
            hire_date: staffForm.hire_date || null,
            emergency_contact_name: staffForm.emergency_contact_name || null,
            emergency_contact_phone: staffForm.emergency_contact_phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', editingStaff.user_id);

        if (error) throw error;

        toast.success("Staff member updated successfully");
      } else {
        // Create new staff member
        if (!staffForm.password) {
          toast.error("Password is required for new staff members");
          return;
        }

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: staffForm.email,
          password: staffForm.password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        const userId = authData.user.id;

        // 2. Create staff profile (BEFORE user_roles as per signup pattern)
        const { error: profileError } = await supabase
          .from('staff_profiles')
          .insert({
            user_id: userId,
            email: staffForm.email,
            full_name: staffForm.full_name,
            phone: staffForm.phone || null,
            position: staffForm.position || null,
            employee_id: staffForm.employee_id || `EMP${Date.now()}`,
            hire_date: staffForm.hire_date || new Date().toISOString().split('T')[0],
            emergency_contact_name: staffForm.emergency_contact_name || null,
            emergency_contact_phone: staffForm.emergency_contact_phone || null,
            is_active: true,
          });

        if (profileError) throw profileError;

        // 3. Create user_roles entry (no email column)
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'staff',
            is_active: true,
          });

        if (roleError) throw roleError;

        toast.success("Staff member created successfully");
      }

      setDialogOpen(false);
      loadStaff();
    } catch (error) {
      console.error("Error saving staff member:", error);
      toast.error("Failed to save staff member");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      // Find staff member to get user_id
      const staff = staffMembers.find(s => s.id === deleteTarget);
      if (!staff) throw new Error("Staff member not found");

      // Delete profile first
      const { error: profileError } = await supabase
        .from('staff_profiles')
        .delete()
        .eq('user_id', staff.user_id);

      if (profileError) throw profileError;

      // Delete user_roles entry
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', staff.user_id);

      if (roleError) throw roleError;

      toast.success("Staff member deleted successfully");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      loadStaff();
    } catch (error) {
      console.error("Error deleting staff member:", error);
      toast.error("Failed to delete staff member");
    }
  };

  const filteredStaff = staffMembers.filter((staff) => {
    const matchesSearch =
      staff.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.employee_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && staff.is_active) ||
      (statusFilter === "inactive" && !staff.is_active);

    return matchesSearch && matchesStatus;
  });

  const activeStaffCount = staffMembers.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Staff Management</h2>
          <p className="text-muted-foreground">Manage staff accounts, permissions, and activity</p>
        </div>
        <Button onClick={handleAddStaff}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "..." : staffMembers.length}</p>
                <p className="text-sm text-muted-foreground">Total Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-3 rounded-full">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "..." : activeStaffCount}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-3 rounded-full">
                <User className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "..." : staffMembers.filter(s => !s.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-3 rounded-full">
                <Activity className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "..." : new Set(staffMembers.map(s => s.position)).size}</p>
                <p className="text-sm text-muted-foreground">Positions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Directory */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Staff Directory</CardTitle>
              <CardDescription>All staff members and their details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                    <TableHead>Assigned Properties</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No staff members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => (
                    <TableRow key={staff.id}>
                        <TableCell className="font-medium">{staff.full_name}</TableCell>
                        <TableCell>
                          {(() => {
                            const profileId = (staff.profile as any)?.id as string | undefined;
                            const count = profileId ? (assignmentsMap[profileId]?.length || 0) : 0;
                            return <span className="font-medium">{count}</span>;
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            {staff.email}
                          </div>
                        </TableCell>
                      <TableCell>
                        {staff.phone ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {staff.phone}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{staff.position}</Badge>
                      </TableCell>
                      <TableCell>{staff.employee_id}</TableCell>
                      <TableCell>
                        <Badge variant={staff.is_active ? "default" : "secondary"}>
                          {staff.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStaff(staff)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStaff(staff)}
                            title="Edit Staff"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteStaff(staff.id)}
                            title="Delete Staff"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
            </DialogTitle>
            <DialogDescription>
              {editingStaff ? "Update staff member information" : "Create a new staff account"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                placeholder="John Doe"
                value={staffForm.full_name}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, full_name: e.target.value })
                }
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={staffForm.email}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, email: e.target.value })
                }
                disabled={!!editingStaff}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+44 7000 000000"
                value={staffForm.phone}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, phone: e.target.value })
                }
              />
            </div>

            {!editingStaff && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={staffForm.password}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, password: e.target.value })
                  }
                  required
                />
              </div>
            )}

            {/* Work Information */}
            {editingStaff && <div className="border-t pt-4 mt-2" />}
            <h3 className="font-semibold text-lg">Work Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="position">Position *</Label>
                <Select
                  value={staffForm.position}
                  onValueChange={(value) =>
                    setStaffForm({ ...staffForm, position: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Property Manager">Property Manager</SelectItem>
                    <SelectItem value="Maintenance Coordinator">Maintenance Coordinator</SelectItem>
                    <SelectItem value="Inspector">Inspector</SelectItem>
                    <SelectItem value="Customer Support">Customer Support</SelectItem>
                    <SelectItem value="Finance Officer">Finance Officer</SelectItem>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  placeholder="EMP001"
                  value={staffForm.employee_id}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, employee_id: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input
                id="hire_date"
                type="date"
                value={staffForm.hire_date}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, hire_date: e.target.value })
                }
              />
            </div>

            {/* Emergency Contact */}
            <div className="border-t pt-4 mt-2" />
            <h3 className="font-semibold text-lg">Emergency Contact</h3>
            
            <div className="grid gap-2">
              <Label htmlFor="emergency_contact_name">Name</Label>
              <Input
                id="emergency_contact_name"
                placeholder="Jane Doe"
                value={staffForm.emergency_contact_name}
                onChange={(e) =>
                  setStaffForm({
                    ...staffForm,
                    emergency_contact_name: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="emergency_contact_phone">Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  placeholder="+44 7000 000000"
                  value={staffForm.emergency_contact_phone}
                  onChange={(e) =>
                    setStaffForm({
                      ...staffForm,
                      emergency_contact_phone: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitForm}>
              {editingStaff ? "Update Staff Member" : "Create Staff Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Staff Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Staff Member Details</DialogTitle>
            <DialogDescription>Complete staff profile information</DialogDescription>
          </DialogHeader>

          {viewingStaff && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{viewingStaff.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{viewingStaff.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{viewingStaff.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge variant={viewingStaff.is_active ? 'default' : 'destructive'}>
                      {viewingStaff.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Work Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Position</Label>
                    <p className="font-medium">{viewingStaff.position}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Employee ID</Label>
                    <p className="font-medium">{viewingStaff.employee_id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Hire Date</Label>
                    <p className="font-medium">{viewingStaff.hire_date ? new Date(viewingStaff.hire_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {(viewingStaff.emergency_contact_name || viewingStaff.emergency_contact_phone) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{viewingStaff.emergency_contact_name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium">{viewingStaff.emergency_contact_phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Additional Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p className="font-medium">{new Date(viewingStaff.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Assignments */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Property Assignments</h3>
                {viewAssignments && viewAssignments.length > 0 ? (
                  <div className="space-y-2">
                    {viewAssignments.map(a => (
                      <div key={a.id} className="p-2 border rounded">
                        <p className="font-medium">{a.property.property_name}</p>
                        <p className="text-sm text-muted-foreground">Role: {a.role || 'N/A'} • Assigned: {a.assigned_date ? new Date(a.assigned_date).toLocaleDateString() : 'N/A'} • {a.is_primary ? 'Primary' : 'Secondary'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No property assignments</p>
                )}
              </div>

              {/* Bin schedules assigned to this staff */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Assigned Council Schedules</h3>
                {viewSchedules && viewSchedules.length > 0 ? (
                  <div className="space-y-2">
                    {viewSchedules.map(s => (
                      <div key={s.id} className="p-2 border rounded">
                        <p className="font-medium">{s.property.property_name} — {s.bin_type}</p>
                        <p className="text-sm text-muted-foreground">Next: {s.next_collection_date ? new Date(s.next_collection_date).toLocaleDateString() : 'N/A'} • {s.collection_frequency || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No council schedules assigned</p>
                )}
              </div>
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
            <DialogTitle>Delete Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this staff member? This action cannot be undone.
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

export default StaffManagement;
