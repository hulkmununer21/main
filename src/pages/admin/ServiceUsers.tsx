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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, User, Calendar, CheckCircle, Clock, Plus, Pencil, Trash2, Eye, Star, Loader2, Briefcase, MapPin, Search, FileText, Image as ImageIcon, ShieldCheck, Info } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { UserStatusToggle } from "@/components/admin/UserStatusToggle";

// === INTERFACES ===
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
}

interface ServiceTask {
  id: string;
  service_user_id: string;
  property_id?: string;
  room_id?: string;
  task_type: string;
  task_title: string;
  task_description?: string;
  task_status: string;
  priority: string;
  due_date?: string;
  assigned_date?: string;
  completed_date?: string;
  // ✅ Updated Interface to include address
  properties?: { property_name: string; address_line1: string };
  rooms?: { room_number: string };
  service_user_profiles?: { full_name: string; company_name: string };
}

interface TaskEvidence {
  id: string;
  file_url: string;
  file_type: string;
  description: string;
  created_at: string;
}

interface Property { id: string; property_name: string; }
interface Room { id: string; property_id: string; room_number: string; }

const ServiceUsers = () => {
  const { user } = useAuth();
  
  // Data States
  const [serviceUsers, setServiceUsers] = useState<ServiceUser[]>([]);
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Task Management States
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false); 
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false); // ✅ NEW STATE
  
  const [selectedUser, setSelectedUser] = useState<ServiceUser | null>(null);
  const [selectedTask, setSelectedTask] = useState<ServiceTask | null>(null);
  const [evidenceList, setEvidenceList] = useState<TaskEvidence[]>([]);

  // Forms
  const [serviceForm, setServiceForm] = useState({
    full_name: "", email: "", phone: "", password: "", company_name: "",
    service_type: "", certification_number: "", insurance_expiry: "", hourly_rate: "",
  });

  const [taskForm, setTaskForm] = useState({
    service_user_id: "",
    task_title: "",       
    task_description: "", 
    task_type: "maintenance",
    scope: "property",
    property_id: "",
    room_id: "none",
    priority: "medium",
    due_date: ""
  });

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (user) {
        const { data: staffProfile } = await supabase.from('staff_profiles').select('id').eq('user_id', user.id).single();
        if (staffProfile) setStaffId(staffProfile.id);
      }

      // Fetch Users
      const { data: userRoles } = await supabase.from('user_roles').select('*').eq('role', 'service_user');
      const { data: serviceProfiles } = await supabase.from('service_user_profiles').select('*');

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
        };
      });
      setServiceUsers(mergedUsers);

      // Fetch Tasks (Updated with Joins - Added address_line1)
      const { data: tasksData } = await supabase
        .from('service_user_tasks')
        .select(`
            *, 
            properties(property_name, address_line1), 
            rooms(room_number),
            service_user_profiles(full_name, company_name)
        `)
        .order('created_at', { ascending: false });
      setTasks(tasksData || []);

      // Fetch Properties
      const { data: propsData } = await supabase.from('properties').select('id, property_name');
      const { data: roomsData } = await supabase.from('rooms').select('id, property_id, room_number');
      setProperties(propsData || []);
      setRooms(roomsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. ACTIONS ---

  // ✅ NEW HANDLER: View Details
  const handleViewDetails = (task: ServiceTask) => {
    setSelectedTask(task);
    setIsViewDetailsOpen(true);
  };

  const handleReviewTask = async (task: ServiceTask) => {
    setSelectedTask(task);
    try {
        const { data, error } = await supabase.from('service_user_uploads').select('*').eq('task_id', task.id);
        if (error) throw error;
        setEvidenceList(data || []);
        setIsEvidenceOpen(true);
    } catch (err) { toast.error("Failed to load proof."); }
  };

  const handleVerifyTask = async () => {
    if (!selectedTask) return;
    setSubmitting(true);
    try {
        const { error } = await supabase
            .from('service_user_tasks')
            .update({ task_status: 'verified' })
            .eq('id', selectedTask.id);
        if (error) throw error;
        toast.success("Task verified successfully");
        setIsEvidenceOpen(false);
        fetchData(); 
    } catch (err: any) {
        toast.error("Verification failed: " + err.message);
    } finally {
        setSubmitting(false);
    }
  };

  // --- 3. ASSIGNMENT ---
  const openAssignTask = (user?: ServiceUser) => {
    setTaskForm({
        service_user_id: user ? user.id : "",
        task_title: "", task_description: "", task_type: "maintenance",
        scope: "property", property_id: "", room_id: "none", priority: "medium", due_date: ""
    });
    setIsAssignTaskOpen(true);
  };

  const submitTask = async () => {
    if (!taskForm.service_user_id || !taskForm.task_title || !taskForm.property_id || !taskForm.due_date) {
        return toast.error("Please fill in required fields.");
    }
    setSubmitting(true);
    try {
        const payload = {
            service_user_id: taskForm.service_user_id,
            task_title: taskForm.task_title,             
            task_description: taskForm.task_description, 
            task_type: taskForm.task_type,               
            property_id: taskForm.property_id,
            room_id: taskForm.scope === 'room' && taskForm.room_id !== 'none' ? taskForm.room_id : null,
            priority: taskForm.priority,
            task_status: 'pending',
            due_date: new Date(taskForm.due_date).toISOString(),
            assigned_date: new Date().toISOString(),     
            assigned_by: staffId                         
        };
        const { error } = await supabase.from('service_user_tasks').insert(payload);
        if (error) throw error;
        toast.success("Task assigned successfully");
        setIsAssignTaskOpen(false);
        fetchData();
    } catch (err: any) { toast.error("Assignment failed: " + err.message); } finally { setSubmitting(false); }
  };

  // --- 4. USER HANDLERS (Brief) ---
  const handleAddServiceUser = () => { setServiceForm({ full_name: "", email: "", phone: "", password: "", company_name: "", service_type: "", certification_number: "", insurance_expiry: "", hourly_rate: "" }); setSelectedUser(null); setIsAddDialogOpen(true); };
  const handleEditServiceUser = (user: ServiceUser) => { setSelectedUser(user); setServiceForm({ full_name: user.full_name, email: user.email, phone: user.phone || "", password: "", company_name: user.company_name || "", service_type: user.service_type || "", certification_number: user.certification_number || "", insurance_expiry: user.insurance_expiry || "", hourly_rate: user.hourly_rate?.toString() || "" }); setIsEditDialogOpen(true); };
  const handleDeleteClick = (user: ServiceUser) => { setSelectedUser(user); setIsDeleteDialogOpen(true); };
  
  const submitUserForm = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
        if (!selectedUser) {
             const { data: authData, error: authError } = await supabase.auth.signUp({ email: serviceForm.email, password: serviceForm.password });
             if (authError || !authData.user) throw authError;
             await supabase.from('service_user_profiles').insert({ user_id: authData.user.id, email: serviceForm.email, full_name: serviceForm.full_name, phone: serviceForm.phone, company_name: serviceForm.company_name, service_type: serviceForm.service_type, certification_number: serviceForm.certification_number, insurance_expiry: serviceForm.insurance_expiry || null, hourly_rate: serviceForm.hourly_rate ? parseFloat(serviceForm.hourly_rate) : null, total_jobs: 0 });
             await supabase.from('user_roles').insert({ user_id: authData.user.id, role: 'service_user', is_active: true });
        } else {
             await supabase.from('service_user_profiles').update({ full_name: serviceForm.full_name, phone: serviceForm.phone, company_name: serviceForm.company_name, service_type: serviceForm.service_type, certification_number: serviceForm.certification_number, insurance_expiry: serviceForm.insurance_expiry || null, hourly_rate: serviceForm.hourly_rate ? parseFloat(serviceForm.hourly_rate) : null }).eq('user_id', selectedUser.user_id);
        }
        toast.success('Saved successfully'); setIsAddDialogOpen(false); setIsEditDialogOpen(false); fetchData();
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleDeleteConfirm = async () => { if(!selectedUser) return; await supabase.from('user_roles').delete().eq('user_id', selectedUser.user_id); setIsDeleteDialogOpen(false); fetchData(); };

  // --- HELPERS ---
  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'completed': return <Badge className="bg-green-600">Completed</Badge>;
        case 'verified': return <Badge className="bg-blue-600">Verified</Badge>;
        case 'in_progress': return <Badge className="bg-orange-500">In Progress</Badge>;
        default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) return <div className="flex justify-center h-96 items-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold">Service Management</h2><p className="text-muted-foreground">Contractors and Task Tracking</p></div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => openAssignTask()}><Briefcase className="w-4 h-4 mr-2"/> Assign Task</Button>
            <Button onClick={handleAddServiceUser}><Plus className="w-4 h-4 mr-2"/> Add User</Button>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="tasks">Task Management</TabsTrigger>
            <TabsTrigger value="users">Contractors Directory</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
            <div className="flex gap-4 mb-4"><div className="relative flex-1 max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search tasks..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></div>
            <Card>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="h-12 px-4 font-medium text-muted-foreground">Task</th>
                                    <th className="h-12 px-4 font-medium text-muted-foreground">Contractor</th>
                                    <th className="h-12 px-4 font-medium text-muted-foreground">Location</th>
                                    <th className="h-12 px-4 font-medium text-muted-foreground">Due Date</th>
                                    <th className="h-12 px-4 font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 font-medium text-muted-foreground text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.filter(t => t.task_title.toLowerCase().includes(searchTerm.toLowerCase())).map((task) => (
                                    <tr key={task.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 font-medium">{task.task_title}<div className="text-xs text-muted-foreground capitalize">{task.task_type}</div></td>
                                        <td className="p-4">{task.service_user_profiles?.full_name || 'Unassigned'}</td>
                                        <td className="p-4 text-muted-foreground">
                                            <div className="flex items-center gap-1"><MapPin className="h-3 w-3"/> {task.properties?.property_name}</div>
                                            {task.rooms && <div className="text-xs ml-4">Rm {task.rooms.room_number}</div>}
                                        </td>
                                        <td className="p-4">{task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : '-'}</td>
                                        <td className="p-4">{getStatusBadge(task.task_status)}</td>
                                        
                                        {/* ✅ UPDATED ACTION COLUMN */}
                                        <td className="p-4 text-right flex justify-end items-center gap-2">
                                            {/* Details Button - Always Visible */}
                                            <Button size="sm" variant="ghost" onClick={() => handleViewDetails(task)}>
                                                <FileText className="w-4 h-4 mr-2"/> Details
                                            </Button>

                                            {/* Logic for Status Actions */}
                                            {task.task_status === 'completed' ? (
                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleReviewTask(task)}>
                                                    <Eye className="w-3 h-3 mr-2"/> Review
                                                </Button>
                                            ) : task.task_status === 'verified' ? (
                                                <Button size="sm" variant="outline" disabled className="text-green-600 border-green-200 bg-green-50">
                                                    <ShieldCheck className="w-3 h-3 mr-2"/> Verified
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic w-20 text-center">Waiting</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {tasks.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No tasks found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceUsers.map(user => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <div><h4 className="font-bold text-lg">{user.full_name}</h4><p className="text-sm text-muted-foreground">{user.service_type} • {user.company_name}</p></div>
                                <Badge variant={user.is_active ? 'default' : 'secondary'}>{user.is_active ? 'Active' : 'Inactive'}</Badge>
                            </div>
                            <div className="space-y-1 text-sm mt-3"><p className="flex items-center gap-2"><User className="w-3 h-3"/> {user.email}</p><p className="flex items-center gap-2"><Star className="w-3 h-3 text-yellow-500"/> Rating: {user.rating?.toFixed(1) || 'N/A'}</p></div>
                            <div className="flex gap-2 mt-4 pt-3 border-t">
                                <Button size="sm" className="flex-1" variant="outline" onClick={() => openAssignTask(user)}>Assign Task</Button>
                                {staffId && (
                                    <UserStatusToggle
                                        userId={user.user_id}
                                        userRole="service_user"
                                        currentStatus={user.is_active}
                                        userName={user.full_name}
                                        adminId={staffId}
                                        adminName="Admin"
                                        onStatusChange={fetchData}
                                    />
                                )}
                                <Button size="sm" variant="ghost" onClick={() => { setSelectedUser(user); setIsViewDialogOpen(true); }}><Eye className="w-4 h-4"/></Button>
                                <Button size="sm" variant="ghost" onClick={() => handleEditServiceUser(user)}><Pencil className="w-4 h-4"/></Button>
                                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteClick(user)}><Trash2 className="w-4 h-4"/></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabsContent>
      </Tabs>

      {/* === MODALS === */}

      {/* ✅ NEW VIEW DETAILS MODAL */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-xl">
            <DialogHeader>
                <DialogTitle>Task Details</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground uppercase tracking-wider">ID: {selectedTask?.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
                <div className="flex justify-between items-start border-b pb-4">
                    <div>
                        <h2 className="text-lg font-bold">{selectedTask?.task_title}</h2>
                        <Badge variant="outline" className="mt-1">{selectedTask?.task_type}</Badge>
                    </div>
                    {selectedTask && getStatusBadge(selectedTask.task_status)}
                </div>

                <div className="bg-muted p-4 rounded-md text-sm">
                    <h4 className="font-semibold mb-1 flex items-center gap-2"><Info className="w-4 h-4"/> Description & Instructions</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedTask?.task_description || "No specific instructions provided."}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <Label className="text-muted-foreground">Location</Label>
                        <div className="flex items-center gap-1 font-medium mt-1"><MapPin className="w-4 h-4 text-primary"/> {selectedTask?.properties?.property_name}</div>
                        <div className="text-xs text-muted-foreground ml-5">{selectedTask?.properties?.address_line1} {selectedTask?.rooms && `(Rm ${selectedTask.rooms.room_number})`}</div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Assigned To</Label>
                        <div className="flex items-center gap-1 font-medium mt-1"><User className="w-4 h-4 text-primary"/> {selectedTask?.service_user_profiles?.full_name}</div>
                        <div className="text-xs text-muted-foreground ml-5">{selectedTask?.service_user_profiles?.company_name}</div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Due Date</Label>
                        <div className="flex items-center gap-1 font-medium mt-1"><Calendar className="w-4 h-4 text-primary"/> {selectedTask?.due_date ? format(parseISO(selectedTask.due_date), 'PPP') : 'N/A'}</div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Priority</Label>
                        <div className="mt-1"><Badge variant="outline" className="capitalize">{selectedTask?.priority}</Badge></div>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEvidenceOpen} onOpenChange={setIsEvidenceOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Review Task Completion</DialogTitle><DialogDescription>Submitted by {selectedTask?.service_user_profiles?.full_name}</DialogDescription></DialogHeader>
            <div className="space-y-4">
                <div className="bg-muted p-3 rounded text-sm"><p className="font-medium">{selectedTask?.task_title}</p><p className="text-muted-foreground">{selectedTask?.task_description}</p></div>
                <h4 className="font-semibold flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Evidence Uploads</h4>
                {evidenceList.length === 0 ? <p className="text-sm italic text-muted-foreground">No evidence files uploaded.</p> : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {evidenceList.map((file) => (
                            <div key={file.id} className="border rounded overflow-hidden group relative">
                                {file.file_type === 'image' ? <a href={file.file_url} target="_blank" rel="noreferrer"><img src={file.file_url} alt="Proof" className="w-full h-32 object-cover hover:opacity-90 cursor-pointer"/></a> : <a href={file.file_url} target="_blank" rel="noreferrer" className="w-full h-32 flex flex-col items-center justify-center bg-gray-100 text-blue-600 hover:bg-gray-200"><FileText className="w-8 h-8 mb-1"/><span className="text-xs truncate max-w-[80%]">Document</span></a>}
                                {file.description && <div className="p-1 text-xs bg-white border-t truncate" title={file.description}>{file.description}</div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsEvidenceOpen(false)}>Close</Button><Button className="bg-green-600 hover:bg-green-700" onClick={handleVerifyTask} disabled={submitting}>{submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <><ShieldCheck className="w-4 h-4 mr-2"/> Verify & Approve</>}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignTaskOpen} onOpenChange={setIsAssignTaskOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Assign New Task</DialogTitle><DialogDescription>Create a job for a service user.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-2">
                <div className="space-y-2"><Label>Assign To</Label><Select value={taskForm.service_user_id} onValueChange={v => setTaskForm({...taskForm, service_user_id: v})}><SelectTrigger><SelectValue placeholder="Select Contractor"/></SelectTrigger><SelectContent>{serviceUsers.filter(u => u.is_active).map(u => <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.service_type})</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Title</Label><Input placeholder="e.g. Fix Sink" value={taskForm.task_title} onChange={e => setTaskForm({...taskForm, task_title: e.target.value})} /></div><div className="space-y-2"><Label>Type</Label><Select value={taskForm.task_type} onValueChange={v => setTaskForm({...taskForm, task_type: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="cleaning">Cleaning</SelectItem><SelectItem value="inspection">Inspection</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div></div>
                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Scope</Label><Select value={taskForm.scope} onValueChange={v => setTaskForm({...taskForm, scope: v, room_id: "none"})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="property">Property Wide</SelectItem><SelectItem value="room">Specific Room</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Priority</Label><Select value={taskForm.priority} onValueChange={v => setTaskForm({...taskForm, priority: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div></div>
                <div className="space-y-2"><Label>Property</Label><Select value={taskForm.property_id} onValueChange={v => setTaskForm({...taskForm, property_id: v, room_id: "none"})}><SelectTrigger><SelectValue placeholder="Select Property"/></SelectTrigger><SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}</SelectContent></Select></div>
                {taskForm.scope === 'room' && <div className="space-y-2"><Label>Room</Label><Select value={taskForm.room_id} onValueChange={v => setTaskForm({...taskForm, room_id: v})} disabled={!taskForm.property_id}><SelectTrigger><SelectValue placeholder="Select Room"/></SelectTrigger><SelectContent>{rooms.filter(r => r.property_id === taskForm.property_id).map(r => <SelectItem key={r.id} value={r.id}>Room {r.room_number}</SelectItem>)}</SelectContent></Select></div>}
                <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Instructions..." value={taskForm.task_description} onChange={e => setTaskForm({...taskForm, task_description: e.target.value})} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsAssignTaskOpen(false)}>Cancel</Button><Button onClick={submitTask} disabled={submitting}>{submitting ? <Loader2 className="animate-spin w-4 h-4"/> : "Assign Task"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Service User</DialogTitle></DialogHeader>
        <form onSubmit={submitUserForm} className="space-y-4">
            <Input placeholder="Full Name" required value={serviceForm.full_name} onChange={e => setServiceForm({...serviceForm, full_name: e.target.value})} />
            <Input placeholder="Email" type="email" required value={serviceForm.email} onChange={e => setServiceForm({...serviceForm, email: e.target.value})} />
            <Input placeholder="Password" type="password" required value={serviceForm.password} onChange={e => setServiceForm({...serviceForm, password: e.target.value})} />
            <Select value={serviceForm.service_type} onValueChange={v => setServiceForm({...serviceForm, service_type: v})}><SelectTrigger><SelectValue placeholder="Service Type"/></SelectTrigger><SelectContent><SelectItem value="cleaning">Cleaning</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="plumbing">Plumbing</SelectItem><SelectItem value="electrical">Electrical</SelectItem></SelectContent></Select>
            <DialogFooter><Button type="submit" disabled={submitting}>Create</Button></DialogFooter>
        </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete?</AlertDialogTitle><AlertDialogDescription>Action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service User Details</DialogTitle>
            <DialogDescription>{selectedUser?.full_name} - {selectedUser?.company_name}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium mt-1">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium mt-1">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Service Type</Label>
                  <p className="font-medium mt-1 capitalize">{selectedUser.service_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hourly Rate</Label>
                  <p className="font-medium mt-1">£{selectedUser.hourly_rate?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Rating</Label>
                  <p className="font-medium mt-1 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/>
                    {selectedUser.rating?.toFixed(1) || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Jobs</Label>
                  <p className="font-medium mt-1">{selectedUser.total_jobs}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Certification</Label>
                  <p className="font-medium mt-1">{selectedUser.certification_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Insurance Expiry</Label>
                  <p className="font-medium mt-1">{selectedUser.insurance_expiry ? format(parseISO(selectedUser.insurance_expiry), 'PPP') : 'N/A'}</p>
                </div>
              </div>

            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ServiceUsers;