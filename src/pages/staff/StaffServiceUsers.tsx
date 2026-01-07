import { useState, useEffect } from "react";
import { 
  Users, Eye, CheckCircle, Clock, Upload, 
  MapPin, Loader2, Image as ImageIcon, Search, Plus, Filter,
  ShieldCheck, FileText, Info, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

// === INTERFACES ===
interface ServiceUser {
  id: string;
  full_name: string;
  service_type: string;
  company_name?: string;
  phone?: string;
  email: string;
  is_active: boolean;
}

interface ServiceTask {
  id: string;
  service_user_id: string;
  task_title: string;
  task_description?: string;
  task_type: string;
  task_status: string;
  priority: string;
  due_date?: string;
  assigned_date?: string;
  properties?: { property_name: string; address_line1: string };
  rooms?: { room_number: string };
  service_user_profiles?: { full_name: string; company_name: string; phone: string };
  assigned_by: string;
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

const StaffServiceUsers = () => {
  const { user } = useAuth();
  
  // Data States
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [serviceUsers, setServiceUsers] = useState<ServiceUser[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [evidenceList, setEvidenceList] = useState<TaskEvidence[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialogs
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false); // ✅ NEW STATE
  
  const [selectedTask, setSelectedTask] = useState<ServiceTask | null>(null);

  // Forms
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
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // 1. Get Staff ID
        const { data: staff, error: staffError } = await supabase
          .from('staff_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (staffError || !staff) throw new Error("Staff profile not found.");
        setStaffId(staff.id);

        // 2. Fetch Tasks assigned ONLY by this staff member
        const { data: tasksData, error: taskError } = await supabase
          .from('service_user_tasks')
          .select(`
            *, 
            properties(property_name, address_line1), 
            rooms(room_number), 
            service_user_profiles(full_name, company_name, phone)
          `)
          .eq('assigned_by', staff.id)
          .order('created_at', { ascending: false });

        if (taskError) throw taskError;
        setTasks(tasksData || []);

        // 3. Fetch Service Users
        const { data: userData } = await supabase.from('service_user_profiles').select('*');
        setServiceUsers(userData || []);

        // 4. Fetch Properties
        const { data: propsData } = await supabase.from('properties').select('id, property_name');
        const { data: roomsData } = await supabase.from('rooms').select('id, property_id, room_number');
        setProperties(propsData || []);
        setRooms(roomsData || []);

      } catch (e) {
        console.error(e);
        toast.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // --- 2. ACTIONS ---

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
        setIsReviewOpen(true);
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
        
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, task_status: 'verified' } : t));
        toast.success("Task verified successfully");
        setIsReviewOpen(false);
    } catch (err: any) {
        toast.error("Verification failed: " + err.message);
    } finally {
        setSubmitting(false);
    }
  };

  const submitAssignTask = async () => {
    if (!taskForm.service_user_id || !taskForm.task_title || !taskForm.property_id || !taskForm.due_date) {
        return toast.error("Please fill all required fields.");
    }
    if (!staffId) return toast.error("Staff ID missing. Try refreshing.");

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
        setIsAssignOpen(false);
        
        // Reload tasks
        const { data: newTasks } = await supabase
          .from('service_user_tasks')
          .select(`*, properties(property_name, address_line1), rooms(room_number), service_user_profiles(full_name, company_name, phone)`)
          .eq('assigned_by', staffId)
          .order('created_at', { ascending: false });
          
        if (newTasks) setTasks(newTasks);

    } catch (err: any) {
        toast.error("Assignment failed: " + err.message);
    } finally {
        setSubmitting(false);
    }
  };

  // --- HELPERS ---
  const getStatusBadge = (s: string) => {
      if (s === 'verified') return <Badge className="bg-blue-600">Verified</Badge>;
      if (s === 'completed') return <Badge className="bg-green-600 hover:bg-green-700">Needs Review</Badge>;
      if (s === 'in_progress') return <Badge className="bg-orange-500">In Progress</Badge>;
      return <Badge variant="secondary">Pending</Badge>;
  };

  const getPriorityBadge = (p: string) => {
    switch(p) {
        case 'urgent': return <Badge variant="destructive">Urgent</Badge>;
        case 'high': return <Badge className="bg-orange-500">High</Badge>;
        default: return <Badge variant="outline" className="capitalize">{p}</Badge>;
    }
  };

  const filteredTasks = tasks.filter(t => 
    (t.task_title || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.service_user_profiles?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingReviewCount = tasks.filter(t => t.task_status === 'completed').length;
  const verifiedCount = tasks.filter(t => t.task_status === 'verified').length;

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

  return (
    <div className="space-y-6">
      
      {/* Header & Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm text-muted-foreground">My Pending Review</p><p className="text-2xl font-bold">{pendingReviewCount}</p></div>
            <div className="bg-orange-100 p-3 rounded-full"><Eye className="h-5 w-5 text-orange-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm text-muted-foreground">Verified by Me</p><p className="text-2xl font-bold">{verifiedCount}</p></div>
            <div className="bg-green-100 p-3 rounded-full"><CheckCircle className="h-5 w-5 text-green-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm text-muted-foreground">My Active Tasks</p><p className="text-2xl font-bold">{tasks.filter(t => t.task_status === 'pending' || t.task_status === 'in_progress').length}</p></div>
            <div className="bg-blue-100 p-3 rounded-full"><Clock className="h-5 w-5 text-blue-600"/></div>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-center p-2">
            <Button onClick={() => setIsAssignOpen(true)} className="h-full w-full bg-primary/90 hover:bg-primary">
                <Plus className="mr-2 h-5 w-5"/> Assign New Task
            </Button>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="review" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="review">Awaiting Review <Badge className="ml-2 bg-orange-500 hover:bg-orange-600">{pendingReviewCount}</Badge></TabsTrigger>
            <TabsTrigger value="all">My Assigned Tasks</TabsTrigger>
        </TabsList>

        {/* TAB 1: AWAITING REVIEW */}
        <TabsContent value="review" className="mt-6">
            <Card>
                <CardHeader><CardTitle>Tasks Ready for Verification</CardTitle><CardDescription>Contractors have marked these as complete.</CardDescription></CardHeader>
                <CardContent>
                    {tasks.filter(t => t.task_status === 'completed').length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">No tasks waiting for review.</p>
                    ) : (
                        <div className="space-y-3">
                            {tasks.filter(t => t.task_status === 'completed').map(task => (
                                <div key={task.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/5">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold">{task.task_title}</h4>
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Completed</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            By {task.service_user_profiles?.full_name} • {task.properties?.property_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Due: {task.due_date ? format(parseISO(task.due_date), 'PPP') : 'N/A'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* ✅ VIEW BUTTON */}
                                        <Button size="sm" variant="ghost" onClick={() => handleViewDetails(task)}>
                                            <FileText className="w-4 h-4 mr-2" /> View Details
                                        </Button>
                                        {/* REVIEW PROOF BUTTON */}
                                        <Button size="sm" onClick={() => handleReviewTask(task)}>
                                            <Eye className="w-4 h-4 mr-2"/> Review Proof
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        {/* TAB 2: ALL TASKS */}
        <TabsContent value="all" className="mt-6">
            <div className="flex gap-4 mb-4">
                <div className="relative flex-1 max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/><Input placeholder="Search tasks..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
            </div>
            <Card>
                <div className="relative w-full overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 border-b"><tr><th className="p-4">Task</th><th className="p-4">Contractor</th><th className="p-4">Location</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead>
                        <tbody>
                            {filteredTasks.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No tasks found.</td></tr>
                            ) : (
                                filteredTasks.map(t => (
                                    <tr key={t.id} className="border-b hover:bg-muted/50">
                                        <td className="p-4 font-medium">{t.task_title}<div className="text-xs text-muted-foreground capitalize">{t.task_type}</div></td>
                                        <td className="p-4">{t.service_user_profiles?.full_name}</td>
                                        <td className="p-4 text-muted-foreground">{t.properties?.property_name} {t.rooms && `(Rm ${t.rooms.room_number})`}</td>
                                        <td className="p-4">{getStatusBadge(t.task_status)}</td>
                                        <td className="p-4 text-right">
                                            {/* ✅ VIEW BUTTON */}
                                            <Button size="sm" variant="ghost" onClick={() => handleViewDetails(t)}>
                                                <Info className="w-4 h-4"/>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </TabsContent>
      </Tabs>

      {/* === ASSIGN TASK MODAL === */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Assign New Task</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
                <div className="space-y-2"><Label>Contractor</Label><Select value={taskForm.service_user_id} onValueChange={v => setTaskForm({...taskForm, service_user_id: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{serviceUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.service_type})</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Title</Label><Input value={taskForm.task_title} onChange={e => setTaskForm({...taskForm, task_title: e.target.value})}/></div>
                    <div className="space-y-2"><Label>Type</Label><Select value={taskForm.task_type} onValueChange={v => setTaskForm({...taskForm, task_type: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="cleaning">Cleaning</SelectItem><SelectItem value="inspection">Inspection</SelectItem></SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Scope</Label><Select value={taskForm.scope} onValueChange={v => setTaskForm({...taskForm, scope: v, room_id: "none"})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="property">Property</SelectItem><SelectItem value="room">Room</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Priority</Label><Select value={taskForm.priority} onValueChange={v => setTaskForm({...taskForm, priority: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label>Property</Label><Select value={taskForm.property_id} onValueChange={v => setTaskForm({...taskForm, property_id: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}</SelectContent></Select></div>
                {taskForm.scope === 'room' && <div className="space-y-2"><Label>Room</Label><Select value={taskForm.room_id} onValueChange={v => setTaskForm({...taskForm, room_id: v})} disabled={!taskForm.property_id}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{rooms.filter(r => r.property_id === taskForm.property_id).map(r => <SelectItem key={r.id} value={r.id}>Rm {r.room_number}</SelectItem>)}</SelectContent></Select></div>}
                <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})}/></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={taskForm.task_description} onChange={e => setTaskForm({...taskForm, task_description: e.target.value})}/></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button><Button onClick={submitAssignTask} disabled={submitting}>Assign</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === REVIEW MODAL (EVIDENCE) === */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Review Task</DialogTitle><DialogDescription>Submitted by {selectedTask?.service_user_profiles?.full_name}</DialogDescription></DialogHeader>
            <div className="space-y-4">
                <div className="bg-muted p-3 rounded text-sm"><span className="font-semibold">{selectedTask?.task_title}</span><br/>{selectedTask?.task_description}</div>
                <h4 className="font-semibold flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Evidence</h4>
                {evidenceList.length === 0 ? <p className="text-sm italic text-muted-foreground">No proof uploaded.</p> : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {evidenceList.map(e => (
                            <div key={e.id} className="border rounded overflow-hidden">
                                {e.file_type === 'image' || (e.file_url && /\.(jpg|jpeg|png|gif|webp)$/i.test(e.file_url)) ? (
                                    <a href={e.file_url} target="_blank"><img src={e.file_url} className="w-full h-32 object-cover"/></a>
                                ) : (
                                    <a href={e.file_url} target="_blank" className="h-32 flex items-center justify-center bg-gray-100 text-blue-600"><FileText/> Doc</a>
                                )}
                                {e.description && <div className="p-1 text-xs bg-white border-t truncate">{e.description}</div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Close</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleVerifyTask} disabled={submitting}>{submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <><ShieldCheck className="w-4 h-4 mr-2"/> Verify</>}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === VIEW DETAILS MODAL (NEW) === */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-xl">
            <DialogHeader>
                <DialogTitle>Task Details</DialogTitle>
                <DialogDescription>ID: {selectedTask?.id}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold">{selectedTask?.task_title}</h2>
                        <span className="text-xs text-muted-foreground uppercase">{selectedTask?.task_type}</span>
                    </div>
                    {selectedTask && getStatusBadge(selectedTask.task_status)}
                </div>

                <div className="bg-muted p-4 rounded-md text-sm">
                    <h4 className="font-semibold mb-1">Description:</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedTask?.task_description || "No description."}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <Label className="text-muted-foreground">Location</Label>
                        <div className="flex items-center gap-1 font-medium"><MapPin className="w-3 h-3"/> {selectedTask?.properties?.property_name}</div>
                        <div className="text-xs text-muted-foreground">{selectedTask?.properties?.address_line1} {selectedTask?.rooms && `(Room ${selectedTask.rooms.room_number})`}</div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Contractor</Label>
                        <div className="font-medium">{selectedTask?.service_user_profiles?.full_name}</div>
                        <div className="text-xs text-muted-foreground">{selectedTask?.service_user_profiles?.company_name}</div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Due Date</Label>
                        <div className="flex items-center gap-1 font-medium"><Calendar className="w-3 h-3"/> {selectedTask?.due_date ? format(parseISO(selectedTask.due_date), 'PPP') : 'N/A'}</div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Priority</Label>
                        <div className="mt-1">{selectedTask && getPriorityBadge(selectedTask.priority)}</div>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default StaffServiceUsers;