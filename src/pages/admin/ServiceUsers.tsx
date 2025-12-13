import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Wrench, User, Calendar, CheckCircle, Clock, AlertCircle, Plus, Pencil, Trash2, Eye, Star, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface ServiceUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  company_name?: string;
  service_type?: string;
  certification_number?: string;
  insurance_expiry?: string;
  hourly_rate?: number;
  rating?: number;
  total_jobs?: number;
  is_active: boolean;
  created_at: string;
  profile?: Record<string, unknown>;
}

interface ServiceTask {
  id: string;
  service_user_id: string;
  property_id?: string;
  task_type: string;
  task_title: string;
  task_description?: string;
  task_status: string;
  due_date?: string;
  assigned_date?: string;
  completed_date?: string;
  cost?: number;
  rating?: number;
  service_user?: Record<string, unknown>;
  property?: Record<string, unknown>;
}

const ServiceUsers = () => {
  const [serviceUsers, setServiceUsers] = useState<ServiceUser[]>([]);
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ServiceUser | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    company_name: "",
    service_type: "",
    certification_number: "",
    insurance_expiry: "",
    hourly_rate: "",
  });

  // Fetch service users and tasks
  useEffect(() => {
    fetchServiceUsers();
    fetchTasks();
  }, []);

  const fetchServiceUsers = async () => {
    try {
      setLoading(true);

      // Fetch user_roles with role='service_user'
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'service_user')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch all service_user_profiles
      const { data: serviceProfiles, error: profilesError } = await supabase
        .from('service_user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Merge data
      const mergedUsers: ServiceUser[] = (userRoles || []).map((role) => {
        const profile = serviceProfiles?.find(p => p.user_id === role.user_id);
        
        return {
          id: profile?.id || role.user_id,
          user_id: role.user_id,
          email: profile?.email || 'N/A',
          full_name: profile?.full_name || 'N/A',
          phone: profile?.phone,
          company_name: profile?.company_name,
          service_type: profile?.service_type,
          certification_number: profile?.certification_number,
          insurance_expiry: profile?.insurance_expiry,
          hourly_rate: profile?.hourly_rate,
          rating: profile?.rating,
          total_jobs: profile?.total_jobs || 0,
          is_active: role.is_active,
          created_at: role.created_at,
          profile: profile || {},
        };
      });

      setServiceUsers(mergedUsers);
    } catch (error: unknown) {
      console.error('Error fetching service users:', error);
      toast.error('Failed to load service users');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      // Fetch all service user tasks
      const { data, error } = await supabase
        .from('service_user_tasks')
        .select('*')
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: unknown) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleAddServiceUser = () => {
    setServiceForm({
      full_name: "",
      email: "",
      phone: "",
      password: "",
      company_name: "",
      service_type: "",
      certification_number: "",
      insurance_expiry: "",
      hourly_rate: "",
    });
    setSelectedUser(null);
    setIsAddDialogOpen(true);
  };

  const handleEditServiceUser = (user: ServiceUser) => {
    setSelectedUser(user);
    setServiceForm({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || "",
      password: "", // Don't load password
      company_name: user.company_name || "",
      service_type: user.service_type || "",
      certification_number: user.certification_number || "",
      insurance_expiry: user.insurance_expiry || "",
      hourly_rate: user.hourly_rate?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleViewServiceUser = (user: ServiceUser) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (user: ServiceUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      setSubmitting(true);

      // Delete from user_roles (will cascade to service_user_profiles)
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      if (rolesError) throw rolesError;

      // Also delete from auth.users
      const { error: authError } = await supabase.auth.admin.deleteUser(selectedUser.user_id);
      if (authError) console.error('Auth delete error:', authError);

      toast.success('Service user deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchServiceUsers();
    } catch (error: unknown) {
      console.error('Error deleting service user:', error);
      toast.error('Failed to delete service user');
    } finally {
      setSubmitting(false);
    }
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceForm.full_name || !serviceForm.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      if (selectedUser) {
        // UPDATE EXISTING SERVICE USER
        const { error: profileError } = await supabase
          .from('service_user_profiles')
          .update({
            full_name: serviceForm.full_name,
            phone: serviceForm.phone,
            company_name: serviceForm.company_name,
            service_type: serviceForm.service_type,
            certification_number: serviceForm.certification_number,
            insurance_expiry: serviceForm.insurance_expiry || null,
            hourly_rate: serviceForm.hourly_rate ? parseFloat(serviceForm.hourly_rate) : null,
          })
          .eq('user_id', selectedUser.user_id);

        if (profileError) throw profileError;

        toast.success('Service user updated successfully');
        setIsEditDialogOpen(false);
      } else {
        // CREATE NEW SERVICE USER
        if (!serviceForm.password) {
          toast.error('Password is required for new service users');
          return;
        }

        // Step 1: Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: serviceForm.email,
          password: serviceForm.password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        const user_id = authData.user.id;

        // Step 2: Create service_user_profiles entry
        const { error: profileError } = await supabase
          .from('service_user_profiles')
          .insert({
            user_id,
            email: serviceForm.email,
            full_name: serviceForm.full_name,
            phone: serviceForm.phone,
            company_name: serviceForm.company_name,
            service_type: serviceForm.service_type,
            certification_number: serviceForm.certification_number,
            insurance_expiry: serviceForm.insurance_expiry || null,
            hourly_rate: serviceForm.hourly_rate ? parseFloat(serviceForm.hourly_rate) : null,
            is_active: true,
            total_jobs: 0,
          });

        if (profileError) throw profileError;

        // Step 3: Create user_roles entry
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id,
            role: 'service_user',
            is_active: true,
          });

        if (roleError) throw roleError;

        toast.success('Service user created successfully');
        setIsAddDialogOpen(false);
      }

      fetchServiceUsers();
    } catch (error: unknown) {
      console.error('Error submitting service user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save service user');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate stats
  const activeTasks = tasks.filter(t => t.task_status === 'in_progress' || t.task_status === 'assigned').length;
  const completedTasks = tasks.filter(t => t.task_status === 'completed').length;
  const serviceTypes = [...new Set(serviceUsers.map(u => u.service_type).filter(Boolean))].length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Service User Management</h2>
        <p className="text-muted-foreground">Manage cleaners, contractors, and service providers</p>
      </div>

      {/* Service Users Directory */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Service Users Directory</CardTitle>
              <CardDescription>All registered service providers and contractors</CardDescription>
            </div>
            <Button onClick={handleAddServiceUser}>
              <Plus className="w-4 h-4 mr-2" />
              Add Service User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {serviceUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No service users found. Add your first service provider.</p>
          ) : (
            <div className="space-y-3">
              {serviceUsers.map((user) => {
                const userTasks = tasks.filter(t => t.service_user_id === user.id);
                const userActiveTasks = userTasks.filter(t => t.task_status === 'in_progress' || t.task_status === 'assigned').length;
                const userCompletedTasks = userTasks.filter(t => t.task_status === 'completed').length;

                return (
                  <Card key={user.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{user.full_name}</h4>
                            {user.service_type && <Badge variant="outline">{user.service_type}</Badge>}
                            {user.company_name && <Badge variant="secondary">{user.company_name}</Badge>}
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {user.rating && (
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>{user.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                            <p>Email: {user.email}</p>
                            <p>Phone: {user.phone || 'N/A'}</p>
                            <p><span className="font-medium text-foreground">{userActiveTasks}</span> active tasks</p>
                            <p><span className="font-medium text-foreground">{user.total_jobs}</span> total jobs</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewServiceUser(user)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditServiceUser(user)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(user)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Tasks */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Assigned Tasks</CardTitle>
              <CardDescription>Track work assigned to service users</CardDescription>
            </div>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              View Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tasks assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 10).map((task) => {
                const taskUser = serviceUsers.find(u => u.id === task.service_user_id);
                
                return (
                  <Card key={task.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{task.task_title}</h4>
                            <Badge variant={
                              task.task_status === "completed" ? "default" :
                              task.task_status === "in_progress" ? "secondary" :
                              "outline"
                            }>
                              {task.task_status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {task.task_status === "in_progress" && <Clock className="w-3 h-3 mr-1" />}
                              {task.task_status}
                            </Badge>
                            {task.rating && (
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>{task.rating}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {task.task_description && (
                              <p className="font-medium text-foreground">{task.task_description}</p>
                            )}
                            <p>Task Type: {task.task_type}</p>
                            <p>Service User: {taskUser?.full_name || 'N/A'}</p>
                            {task.cost && <p>Cost: £{task.cost.toFixed(2)}</p>}
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {task.due_date && `Due: ${new Date(task.due_date).toLocaleDateString()}`}
                              {task.assigned_date && ` | Assigned: ${new Date(task.assigned_date).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {task.task_status === "pending" && (
                            <Button size="sm">Assign</Button>
                          )}
                          {task.task_status === "in_progress" && (
                            <Button size="sm">View Progress</Button>
                          )}
                          {task.task_status === "completed" && (
                            <Button size="sm" variant="outline">View Report</Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{serviceUsers.length}</p>
                <p className="text-sm text-muted-foreground">Total Service Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-3 rounded-full">
                <Clock className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeTasks}</p>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-3 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTasks}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-3 rounded-full">
                <Wrench className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{serviceTypes}</p>
                <p className="text-sm text-muted-foreground">Service Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Service User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Service User</DialogTitle>
            <DialogDescription>Create a new service provider account</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm}>
            <div className="space-y-4 py-4">
              {/* Basic Information */}
              <div className="space-y-2">
                <h4 className="font-medium">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-full_name">Full Name *</Label>
                    <Input
                      id="add-full_name"
                      value={serviceForm.full_name}
                      onChange={(e) => setServiceForm({...serviceForm, full_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-email">Email *</Label>
                    <Input
                      id="add-email"
                      type="email"
                      value={serviceForm.email}
                      onChange={(e) => setServiceForm({...serviceForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-phone">Phone Number</Label>
                    <Input
                      id="add-phone"
                      type="tel"
                      value={serviceForm.phone}
                      onChange={(e) => setServiceForm({...serviceForm, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-password">Password *</Label>
                    <Input
                      id="add-password"
                      type="password"
                      value={serviceForm.password}
                      onChange={(e) => setServiceForm({...serviceForm, password: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div className="space-y-2">
                <h4 className="font-medium">Service Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-company_name">Company Name</Label>
                    <Input
                      id="add-company_name"
                      value={serviceForm.company_name}
                      onChange={(e) => setServiceForm({...serviceForm, company_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-service_type">Service Type</Label>
                    <Select value={serviceForm.service_type} onValueChange={(value) => setServiceForm({...serviceForm, service_type: value})}>
                      <SelectTrigger id="add-service_type">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="gardening">Gardening</SelectItem>
                        <SelectItem value="painting">Painting</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-certification_number">Certification Number</Label>
                    <Input
                      id="add-certification_number"
                      value={serviceForm.certification_number}
                      onChange={(e) => setServiceForm({...serviceForm, certification_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-insurance_expiry">Insurance Expiry</Label>
                    <Input
                      id="add-insurance_expiry"
                      type="date"
                      value={serviceForm.insurance_expiry}
                      onChange={(e) => setServiceForm({...serviceForm, insurance_expiry: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-hourly_rate">Hourly Rate (£)</Label>
                    <Input
                      id="add-hourly_rate"
                      type="number"
                      step="0.01"
                      value={serviceForm.hourly_rate}
                      onChange={(e) => setServiceForm({...serviceForm, hourly_rate: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Service User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Service User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service User</DialogTitle>
            <DialogDescription>Update service provider information</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm}>
            <div className="space-y-4 py-4">
              {/* Basic Information */}
              <div className="space-y-2">
                <h4 className="font-medium">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-full_name">Full Name *</Label>
                    <Input
                      id="edit-full_name"
                      value={serviceForm.full_name}
                      onChange={(e) => setServiceForm({...serviceForm, full_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email (Cannot be changed)</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={serviceForm.email}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone Number</Label>
                    <Input
                      id="edit-phone"
                      type="tel"
                      value={serviceForm.phone}
                      onChange={(e) => setServiceForm({...serviceForm, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div className="space-y-2">
                <h4 className="font-medium">Service Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-company_name">Company Name</Label>
                    <Input
                      id="edit-company_name"
                      value={serviceForm.company_name}
                      onChange={(e) => setServiceForm({...serviceForm, company_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-service_type">Service Type</Label>
                    <Select value={serviceForm.service_type} onValueChange={(value) => setServiceForm({...serviceForm, service_type: value})}>
                      <SelectTrigger id="edit-service_type">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="gardening">Gardening</SelectItem>
                        <SelectItem value="painting">Painting</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-certification_number">Certification Number</Label>
                    <Input
                      id="edit-certification_number"
                      value={serviceForm.certification_number}
                      onChange={(e) => setServiceForm({...serviceForm, certification_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-insurance_expiry">Insurance Expiry</Label>
                    <Input
                      id="edit-insurance_expiry"
                      type="date"
                      value={serviceForm.insurance_expiry}
                      onChange={(e) => setServiceForm({...serviceForm, insurance_expiry: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-hourly_rate">Hourly Rate (£)</Label>
                    <Input
                      id="edit-hourly_rate"
                      type="number"
                      step="0.01"
                      value={serviceForm.hourly_rate}
                      onChange={(e) => setServiceForm({...serviceForm, hourly_rate: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Service User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Service User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service User Details</DialogTitle>
            <DialogDescription>View complete service provider information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">BASIC INFORMATION</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Full Name</p>
                    <p className="font-medium">{selectedUser.full_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={selectedUser.is_active ? "default" : "secondary"}>
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">SERVICE INFORMATION</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Company Name</p>
                    <p className="font-medium">{selectedUser.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Service Type</p>
                    <p className="font-medium">{selectedUser.service_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Certification Number</p>
                    <p className="font-medium">{selectedUser.certification_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Insurance Expiry</p>
                    <p className="font-medium">
                      {selectedUser.insurance_expiry ? new Date(selectedUser.insurance_expiry).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Hourly Rate</p>
                    <p className="font-medium">{selectedUser.hourly_rate ? `£${selectedUser.hourly_rate.toFixed(2)}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Jobs</p>
                    <p className="font-medium">{selectedUser.total_jobs}</p>
                  </div>
                  {selectedUser.rating && (
                    <div>
                      <p className="text-muted-foreground">Rating</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <p className="font-medium">{selectedUser.rating.toFixed(1)} / 5.0</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">ACCOUNT INFORMATION</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(selectedUser.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">User ID</p>
                    <p className="font-mono text-xs">{selectedUser.user_id}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.full_name}</strong>? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={submitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceUsers;
