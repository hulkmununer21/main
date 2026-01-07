import { useEffect, useState, useRef } from "react";
import { 
  ClipboardList, CheckCircle, AlertCircle, Clock, 
  User, LogOut, ChevronRight, MapPin, Search, Filter, 
  Calendar, Upload, Camera, X, PlayCircle, Loader2, FileText 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { format, parseISO, isPast, isToday } from "date-fns";
import { useNavigate, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// === INTERFACES ===
interface Task {
  id: string;
  service_user_id: string;
  task_title: string;
  task_description: string;
  task_type: string;
  task_status: 'pending' | 'in_progress' | 'completed' | 'verified' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  property_id: string;
  properties?: { property_name: string; address_line1: string; postcode: string } | null;
  rooms?: { room_number: string } | null;
}

interface UploadedFile {
  id: string;
  file_url: string;
  // Removed file_type from interface
  description: string;
  created_at: string;
}

const ServiceUserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Data States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [stats, setStats] = useState({ pending: 0, completed: 0, overdue: 0 });
  const [searchTerm, setSearchTerm] = useState("");

  // Modal & Action States
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploadNote, setUploadNote] = useState("");
  const [updating, setUpdating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const { data: profile, error: profileError } = await supabase
        .from('service_user_profiles')
        .select('id, full_name')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) throw new Error("Profile not found");
      setProfileName(profile.full_name);

      const { data: taskData, error: taskError } = await supabase
        .from('service_user_tasks')
        .select(`
          *,
          properties (property_name, address_line1, postcode),
          rooms (room_number)
        `)
        .eq('service_user_id', profile.id)
        .order('due_date', { ascending: true });

      if (taskError) throw taskError;

      const allTasks = taskData as Task[] || [];
      setTasks(allTasks);

      setStats({
        pending: allTasks.filter(t => t.task_status === 'pending' || t.task_status === 'in_progress').length,
        completed: allTasks.filter(t => t.task_status === 'completed' || t.task_status === 'verified').length,
        overdue: allTasks.filter(t => 
          (t.task_status === 'pending' || t.task_status === 'in_progress') && 
          t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))
        ).length
      });

    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- TASK MODAL LOGIC ---

  const openTaskModal = async (task: Task) => {
    setSelectedTask(task);
    setNewFiles([]);
    setUploadNote("");
    setIsTaskModalOpen(true);
    
    const { data } = await supabase
      .from('service_user_uploads')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false });
      
    setUploadedFiles(data || []);
  };

  const updateStatus = async (newStatus: string) => {
    if (!selectedTask) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('service_user_tasks')
        .update({ task_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedTask.id);

      if (error) throw error;
      
      const updatedTask = { ...selectedTask, task_status: newStatus } as Task;
      setSelectedTask(updatedTask);
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      
      if (newStatus === 'completed') {
        setIsTaskModalOpen(false);
      }
    } catch (err: any) {
      toast.error("Update failed: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedTask || newFiles.length === 0) return toast.error("Please select a file first.");
    setUpdating(true);

    try {
      for (const file of newFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedTask.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('service-uploads')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('service-uploads')
          .getPublicUrl(fileName);

        // ✅ FIX: Removed 'file_type'
        const { error: dbError } = await supabase.from('service_user_uploads').insert({
          task_id: selectedTask.id,
          service_user_id: selectedTask.service_user_id,
          file_url: urlData.publicUrl,
          description: uploadNote || "Task evidence"
        });

        if (dbError) throw dbError;
      }

      toast.success("Files uploaded successfully");
      setNewFiles([]);
      setUploadNote("");
      
      const { data } = await supabase.from('service_user_uploads').select('*').eq('task_id', selectedTask.id);
      setUploadedFiles(data || []);

    } catch (err: any) {
      console.error(err);
      toast.error("Upload failed: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // --- HELPERS ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-600 hover:bg-green-700">Completed</Badge>;
      case 'verified': return <Badge className="bg-blue-600 hover:bg-blue-700">Verified</Badge>;
      case 'in_progress': return <Badge className="bg-orange-500 hover:bg-orange-600">In Progress</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
        case 'urgent': return "text-red-600 border-red-200 bg-red-50";
        case 'high': return "text-orange-600 border-orange-200 bg-orange-50";
        default: return "text-muted-foreground border-border";
    }
  };

  // Helper to check if file is image based on URL extension
  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const filteredTasks = tasks.filter(t => {
    if (!t) return false;
    const term = (searchTerm || "").toLowerCase();
    const title = (t.task_title || "").toLowerCase();
    const propName = (t.properties?.property_name || "").toLowerCase();
    return title.includes(term) || propName.includes(term);
  });

  return (
    <>
      <SEO title="Service Portal - Domus" description="Manage assigned tasks" />
      
      <div className="min-h-screen bg-muted/40">
        
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <ClipboardList className="h-6 w-6" />
            <span>Service Portal</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 ml-6 text-sm font-medium text-muted-foreground">
            <Link to="/serviceuser/dashboard" className="text-foreground hover:text-primary transition-colors">Dashboard</Link>
            <Link to="/serviceuser/profile" className="hover:text-primary transition-colors">My Profile</Link>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden md:block text-sm text-right">
                <p className="font-medium text-foreground">{profileName || "Service User"}</p>
                <p className="text-xs text-muted-foreground">Contractor</p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full bg-muted" onClick={() => navigate('/serviceuser/profile')}>
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} title="Sign Out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="container py-8 max-w-6xl mx-auto space-y-8">
          
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Jobs waiting for action</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">Total jobs finished</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                <p className="text-xs text-muted-foreground">Jobs past due date</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold tracking-tight">Assigned Tasks</h2>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9 bg-background"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                </div>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="active">Active & Pending</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Jobs</CardTitle>
                            <CardDescription>Click on a task to view details and upload proof.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {filteredTasks.filter(t => t.task_status !== 'completed' && t.task_status !== 'verified').length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                        No active tasks found.
                                    </div>
                                ) : (
                                    filteredTasks
                                    .filter(t => t.task_status !== 'completed' && t.task_status !== 'verified')
                                    .map(task => (
                                        <div 
                                            key={task.id} 
                                            className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer bg-white"
                                            onClick={() => openTaskModal(task)}
                                        >
                                            <div className="flex items-start gap-4">
                                                {task.due_date && (
                                                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-md border ${isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) ? 'bg-red-50 border-red-200 text-red-700' : 'bg-muted text-muted-foreground'}`}>
                                                        <span className="text-[10px] font-bold uppercase">{format(parseISO(task.due_date), 'MMM')}</span>
                                                        <span className="text-xl font-bold">{format(parseISO(task.due_date), 'dd')}</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold group-hover:text-primary transition-colors">{task.task_title || "Untitled"}</h3>
                                                        {getStatusBadge(task.task_status)}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        <span>{task.properties?.property_name || "Unknown Property"} {task.rooms ? `(Rm ${task.rooms.room_number})` : ''}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="outline" className={`text-[10px] font-normal ${getPriorityColor(task.priority)}`}>
                                                            {task.priority ? task.priority.toUpperCase() : "NORMAL"} PRIORITY
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded capitalize">{task.task_type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 sm:mt-0 self-end sm:self-center">
                                                <Button size="sm" variant="ghost">View Details <ChevronRight className="ml-1 h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job History</CardTitle>
                            <CardDescription>Previously completed work.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {filteredTasks.filter(t => t.task_status === 'completed' || t.task_status === 'verified').length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                        No history found.
                                    </div>
                                ) : (
                                    filteredTasks
                                    .filter(t => t.task_status === 'completed' || t.task_status === 'verified')
                                    .map(task => (
                                        <div 
                                            key={task.id} 
                                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-muted/20 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                            onClick={() => openTaskModal(task)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                    <CheckCircle className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium line-through text-muted-foreground">{task.task_title || "Untitled"}</h3>
                                                    {task.due_date && <p className="text-sm text-muted-foreground">{format(parseISO(task.due_date), 'PPP')}</p>}
                                                </div>
                                            </div>
                                            <div className="mt-2 sm:mt-0">
                                                {getStatusBadge(task.task_status)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* === TASK DETAILS MODAL === */}
        <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center pr-8">
                        <span>{selectedTask?.task_title}</span>
                        {selectedTask && getStatusBadge(selectedTask.task_status)}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 pt-1">
                        <MapPin className="w-4 h-4"/> 
                        {selectedTask?.properties?.address_line1}, {selectedTask?.properties?.postcode} {selectedTask?.rooms && `(Room ${selectedTask.rooms.room_number})`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    
                    {/* Instructions */}
                    <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-1">
                        <span className="font-semibold text-foreground">Instructions:</span>
                        <p className="text-muted-foreground whitespace-pre-wrap">{selectedTask?.task_description || "No description provided."}</p>
                        <div className="pt-2 flex gap-4 text-xs font-medium text-muted-foreground">
                            <span>Type: {selectedTask?.task_type}</span>
                            <span>Due: {selectedTask?.due_date ? format(parseISO(selectedTask.due_date), 'PPP') : 'N/A'}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {selectedTask?.task_status !== 'completed' && selectedTask?.task_status !== 'verified' && (
                        <div className="grid grid-cols-2 gap-3">
                            {selectedTask?.task_status === 'pending' ? (
                                <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => updateStatus('in_progress')} disabled={updating}>
                                    {updating ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <PlayCircle className="w-4 h-4 mr-2"/>}
                                    Start Task
                                </Button>
                            ) : (
                                <Button className="w-full bg-green-600 hover:bg-green-700 col-span-2" onClick={() => updateStatus('completed')} disabled={updating}>
                                    {updating ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <CheckCircle className="w-4 h-4 mr-2"/>}
                                    Mark Completed
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Evidence Upload Section */}
                    <div>
                        <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                            <Camera className="w-4 h-4 text-gray-500" /> Evidence & Proof
                        </h3>

                        {/* File Input Area */}
                        {selectedTask?.task_status !== 'completed' && selectedTask?.task_status !== 'verified' && (
                            <div className="mb-4 space-y-3 p-4 border border-dashed rounded-lg bg-gray-50/50">
                                <div 
                                    className="flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="w-6 h-6 mb-1" />
                                    <span className="text-xs">Click to upload photos/docs</span>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    multiple 
                                    accept="image/*,.pdf" 
                                    onChange={e => e.target.files && setNewFiles(Array.from(e.target.files))}
                                />

                                {/* Preview Selected Files */}
                                {newFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex gap-2 overflow-x-auto py-2">
                                            {newFiles.map((file, i) => (
                                                <div key={i} className="relative w-16 h-16 shrink-0 group">
                                                    {file.type.startsWith('image/') ? (
                                                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded border" />
                                                    ) : (
                                                        <div className="w-full h-full bg-white flex items-center justify-center rounded border text-[10px] text-center p-1 overflow-hidden">{file.name}</div>
                                                    )}
                                                    <button onClick={() => setNewFiles(f => f.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3"/></button>
                                                </div>
                                            ))}
                                        </div>
                                        <Textarea 
                                            placeholder="Note (optional)..." 
                                            value={uploadNote} 
                                            onChange={e => setUploadNote(e.target.value)} 
                                            className="h-20 text-xs"
                                        />
                                        <Button size="sm" onClick={handleFileUpload} disabled={updating} className="w-full">
                                            {updating && <Loader2 className="animate-spin w-3 h-3 mr-2"/>} Upload Evidence
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Existing Uploads List */}
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {uploadedFiles.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">No proof uploaded yet.</p>
                            ) : (
                                uploadedFiles.map((file) => (
                                    <div key={file.id} className="flex items-center gap-3 p-2 border rounded bg-white">
                                        <div className="w-10 h-10 bg-gray-100 rounded shrink-0 overflow-hidden flex items-center justify-center text-gray-400">
                                            {/* ✅ CHECK EXTENSION TO DETERMINE TYPE */}
                                            {isImage(file.file_url) ? 
                                              <img src={file.file_url} className="w-full h-full object-cover" /> : 
                                              <FileText className="w-5 h-5"/>
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{file.description || "Uploaded File"}</p>
                                            <p className="text-[10px] text-gray-400">{format(parseISO(file.created_at), 'd MMM, HH:mm')}</p>
                                        </div>
                                        <a href={file.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">View</a>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>

      </div>
    </>
  );
};

export default ServiceUserDashboard;