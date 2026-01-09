import { useEffect, useState, useRef } from "react";
import { 
  ClipboardList, CheckCircle, AlertCircle, Clock, 
  User, LogOut, ChevronRight, MapPin, Search, Filter, 
  Calendar, Upload, Camera, X, PlayCircle, Loader2, FileText,
  MessageSquare, Send, Paperclip, Plus, ImageIcon // ✅ Added Icons
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // ✅ Added
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { format, parseISO, isPast, isToday, formatDistanceToNow } from "date-fns";
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
  description: string;
  created_at: string;
}

// ✅ Messaging Interfaces
interface Thread {
  id: string;
  participants: string[];
  last_message_preview: string;
  updated_at: string;
  other_user?: { name: string; id: string };
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachments?: { name: string; type: string; url: string }[];
}

interface StaffProfile {
  user_id: string;
  full_name: string;
  position?: string;
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
  
  // ✅ Messaging States
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [sendingMsg, setSendingMsg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null); // Separate ref for chat
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
    fetchThreads(); // ✅ Load threads on mount
    
    // ✅ Realtime Listener for Thread List Updates
    const threadSub = supabase.channel('service_threads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_threads' }, () => fetchThreads(true))
      .subscribe();

    return () => { supabase.removeChannel(threadSub); };
  }, [user]);

  // --- FETCHING LOGIC ---
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: profile } = await supabase.from('service_user_profiles').select('id, full_name').eq('user_id', user?.id).single();
      if (profile) setProfileName(profile.full_name);

      const { data: taskData } = await supabase.from('service_user_tasks')
        .select(`*, properties (property_name, address_line1, postcode), rooms (room_number)`)
        .eq('service_user_id', profile?.id)
        .order('due_date', { ascending: true });

      const allTasks = taskData as Task[] || [];
      setTasks(allTasks);
      setStats({
        pending: allTasks.filter(t => ['pending', 'in_progress'].includes(t.task_status)).length,
        completed: allTasks.filter(t => ['completed', 'verified'].includes(t.task_status)).length,
        overdue: allTasks.filter(t => ['pending', 'in_progress'].includes(t.task_status) && t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))).length
      });
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  // ✅ Fetch Threads
  const fetchThreads = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const { data: rawThreads, error } = await supabase
        .from('message_threads')
        .select('*')
        .contains('participants', [user.id])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Resolve Staff Names
      const otherIds = [...new Set((rawThreads || []).flatMap(t => t.participants).filter(id => id !== user.id))];
      const { data: staffData } = await supabase.from('staff_profiles').select('user_id, full_name').in('user_id', otherIds);
      const { data: adminData } = await supabase.from('admin_profiles').select('user_id, full_name').in('user_id', otherIds);
      
      const nameMap: Record<string, string> = {};
      staffData?.forEach(s => nameMap[s.user_id] = s.full_name);
      adminData?.forEach(a => nameMap[a.user_id] = a.full_name);

      const processed = (rawThreads || []).map(t => {
        const otherId = t.participants.find((id: string) => id !== user.id);
        return {
            ...t,
            other_user: { name: otherId ? (nameMap[otherId] || "Unknown Staff") : "Unknown", id: otherId! }
        };
      });
      setThreads(processed);
    } catch (e) { console.error(e); } finally { if (!silent) setLoading(false); }
  };

  // ✅ Fetch Messages for Active Thread
  useEffect(() => {
    if (!activeThreadId) return;
    const loadMessages = async () => {
        const { data } = await supabase.from('messages').select('*').eq('thread_id', activeThreadId).order('created_at', { ascending: true });
        setMessages(data || []);
        scrollToBottom();
    };
    loadMessages();

    const msgSub = supabase.channel(`chat:${activeThreadId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${activeThreadId}` }, (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
            scrollToBottom();
        })
        .subscribe();

    return () => { supabase.removeChannel(msgSub); };
  }, [activeThreadId]);

  const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  // --- ACTIONS (MESSAGING) ---

  const handleOpenNewChat = async () => {
    // Load staff list
    const { data } = await supabase.from('staff_profiles').select('user_id, full_name, position');
    setStaffList(data || []);
    setIsNewChatOpen(true);
  };

  const handleStartChat = async () => {
    if (!selectedStaffId || !user) return;

    // 1. Check existing thread
    const existing = threads.find(t => t.participants.includes(selectedStaffId));
    if (existing) {
        setActiveThreadId(existing.id);
        setIsNewChatOpen(false);
        return;
    }

    // 2. Create new thread
    try {
        const { data, error } = await supabase.from('message_threads').insert({
            participants: [user.id, selectedStaffId],
            last_message_preview: "Chat started",
            updated_at: new Date().toISOString()
        }).select().single();

        if (error) throw error;
        setIsNewChatOpen(false);
        fetchThreads(true);
        setActiveThreadId(data.id);
        toast.success("Chat started");
    } catch (e: any) { toast.error("Failed to start chat"); }
  };

  const handleSendMessage = async () => {
    if (!activeThreadId || !user) return;
    if (!newMessageText.trim() && !chatFile) return;
    setSendingMsg(true);

    let attachments = [];
    if (chatFile) {
        const path = `${activeThreadId}/${Date.now()}_${chatFile.name}`;
        const { error } = await supabase.storage.from('chat-attachments').upload(path, chatFile);
        if (!error) {
            const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
            attachments.push({ name: chatFile.name, type: chatFile.type, url: data.publicUrl });
        }
    }

    try {
        await supabase.from('messages').insert({
            thread_id: activeThreadId,
            sender_id: user.id,
            content: newMessageText,
            attachments: attachments.length > 0 ? attachments : null
        });
        
        await supabase.from('message_threads').update({
            updated_at: new Date().toISOString(),
            last_message_preview: newMessageText || 'Attachment'
        }).eq('id', activeThreadId);

        setNewMessageText("");
        setChatFile(null);
    } catch (e) { toast.error("Failed to send"); } finally { setSendingMsg(false); }
  };

  // --- ACTIONS (TASKS - Existing Logic) ---
  const openTaskModal = async (task: Task) => {
    setSelectedTask(task); setNewFiles([]); setUploadNote(""); setIsTaskModalOpen(true);
    const { data } = await supabase.from('service_user_uploads').select('*').eq('task_id', task.id).order('created_at', { ascending: false });
    setUploadedFiles(data || []);
  };

  const updateStatus = async (newStatus: string) => {
    if (!selectedTask) return; setUpdating(true);
    try {
      await supabase.from('service_user_tasks').update({ task_status: newStatus, updated_at: new Date().toISOString() }).eq('id', selectedTask.id);
      const updatedTask = { ...selectedTask, task_status: newStatus } as Task;
      setSelectedTask(updatedTask); setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      toast.success(`Status updated`); if (newStatus === 'completed') setIsTaskModalOpen(false);
    } catch (e: any) { toast.error("Error updating status"); } finally { setUpdating(false); }
  };

  const handleFileUpload = async () => {
    if (!selectedTask || newFiles.length === 0) return; setUpdating(true);
    try {
      for (const file of newFiles) {
        const path = `${selectedTask.id}/${Date.now()}_${file.name}`;
        await supabase.storage.from('service-uploads').upload(path, file);
        const { data } = supabase.storage.from('service-uploads').getPublicUrl(path);
        await supabase.from('service_user_uploads').insert({ task_id: selectedTask.id, service_user_id: selectedTask.service_user_id, file_url: data.publicUrl, description: uploadNote || "Evidence" });
      }
      toast.success("Uploaded"); setNewFiles([]); 
      const { data } = await supabase.from('service_user_uploads').select('*').eq('task_id', selectedTask.id); setUploadedFiles(data || []);
    } catch (e) { toast.error("Upload failed"); } finally { setUpdating(false); }
  };

  // --- HELPERS ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-600">Completed</Badge>;
      case 'verified': return <Badge className="bg-blue-600">Verified</Badge>;
      case 'in_progress': return <Badge className="bg-orange-500">In Progress</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };
  const filteredTasks = tasks.filter(t => t.task_title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <SEO title="Service Portal - Domus" description="Manage assigned tasks" />
      <div className="min-h-screen bg-muted/40">
        
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-lg text-primary"><ClipboardList className="h-6 w-6" /><span>Service Portal</span></div>
          <nav className="hidden md:flex items-center gap-6 ml-6 text-sm font-medium text-muted-foreground">
            <Link to="/serviceuser/dashboard" className="text-foreground">Dashboard</Link>
            <Link to="/serviceuser/profile" className="hover:text-primary">My Profile</Link>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden md:block text-sm text-right"><p className="font-medium text-foreground">{profileName || "Service User"}</p><p className="text-xs text-muted-foreground">Contractor</p></div>
            <Button variant="ghost" size="icon" onClick={logout}><LogOut className="h-5 w-5" /></Button>
          </div>
        </header>

        <main className="container py-8 max-w-6xl mx-auto space-y-8">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-orange-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pending}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle className="h-4 w-4 text-green-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.completed}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Overdue</CardTitle><AlertCircle className="h-4 w-4 text-red-500"/></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.overdue}</div></CardContent></Card>
          </div>

          {/* MAIN CONTENT TABS */}
          <Tabs defaultValue="active" className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <TabsList>
                    <TabsTrigger value="active">Active & Pending</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="messages" className="flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Messages</TabsTrigger>
                </TabsList>
                
                {/* Search Bar (Only for Tasks) */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search tasks..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* TAB 1: ACTIVE TASKS */}
            <TabsContent value="active">
                <Card>
                    <CardHeader><CardTitle>Active Jobs</CardTitle><CardDescription>Tasks requiring your attention.</CardDescription></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredTasks.filter(t => !['completed', 'verified'].includes(t.task_status)).length === 0 ? <p className="text-center py-8 text-muted-foreground">No active tasks.</p> :
                            filteredTasks.filter(t => !['completed', 'verified'].includes(t.task_status)).map(task => (
                                <div key={task.id} className="flex justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer bg-white" onClick={() => openTaskModal(task)}>
                                    <div className="flex gap-4">
                                        <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-md border ${isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) ? 'bg-red-50 border-red-200 text-red-700' : 'bg-muted'}`}><span className="text-[10px] font-bold uppercase">{format(parseISO(task.due_date), 'MMM')}</span><span className="text-xl font-bold">{format(parseISO(task.due_date), 'dd')}</span></div>
                                        <div><div className="flex items-center gap-2"><h3 className="font-semibold">{task.task_title}</h3>{getStatusBadge(task.task_status)}</div><div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5"/>{task.properties?.property_name}</div></div>
                                    </div>
                                    <Button size="sm" variant="ghost">Details <ChevronRight className="ml-1 h-4 w-4"/></Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* TAB 2: HISTORY */}
            <TabsContent value="history">
                <Card>
                    <CardHeader><CardTitle>History</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredTasks.filter(t => ['completed', 'verified'].includes(t.task_status)).map(task => (
                                <div key={task.id} className="flex justify-between p-4 border rounded-lg bg-muted/20 opacity-80" onClick={() => openTaskModal(task)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle className="h-5 w-5"/></div>
                                        <div><h3 className="font-medium line-through text-muted-foreground">{task.task_title}</h3></div>
                                    </div>
                                    {getStatusBadge(task.task_status)}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* TAB 3: MESSAGING (NEW) */}
            <TabsContent value="messages">
                <div className="grid md:grid-cols-3 gap-6 h-[600px]">
                    {/* Sidebar List */}
                    <Card className="md:col-span-1 flex flex-col">
                        <CardHeader className="py-4 border-b flex flex-row justify-between items-center">
                            <CardTitle className="text-lg">Conversations</CardTitle>
                            <Button size="sm" variant="ghost" onClick={handleOpenNewChat}><Plus className="h-4 w-4"/></Button>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-2">
                            {threads.length === 0 ? <p className="text-center py-4 text-muted-foreground text-sm">No chats yet.</p> : 
                            threads.map(t => (
                                <div key={t.id} onClick={() => setActiveThreadId(t.id)} className={`p-3 rounded-lg cursor-pointer border mb-2 ${activeThreadId === t.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}>
                                    <div className="flex justify-between"><p className="font-medium text-sm">{t.other_user?.name}</p><span className="text-[10px] text-muted-foreground">{formatDistanceToNow(parseISO(t.updated_at), { addSuffix: true })}</span></div>
                                    <p className="text-xs text-muted-foreground truncate mt-1">{t.last_message_preview}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Chat Area */}
                    <Card className="md:col-span-2 flex flex-col">
                        {activeThreadId ? (
                            <>
                                <CardHeader className="py-4 border-b"><CardTitle className="text-base">{threads.find(t => t.id === activeThreadId)?.other_user?.name}</CardTitle></CardHeader>
                                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
                                        {messages.map(m => {
                                            const isMe = m.sender_id === user?.id;
                                            return (
                                                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white border rounded-tl-none'}`}>
                                                        {m.attachments?.map((a, i) => (
                                                            <div key={i} className="mb-2">{a.type.startsWith('image') ? <img src={a.url} className="rounded max-h-40 border"/> : <a href={a.url} target="_blank" className="underline flex items-center gap-1"><FileText className="h-3 w-3"/> {a.name}</a>}</div>
                                                        ))}
                                                        <p>{m.content}</p>
                                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{format(parseISO(m.created_at), 'HH:mm')}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <div className="p-3 border-t bg-background">
                                        {chatFile && <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded text-xs"><Paperclip className="h-3 w-3"/> {chatFile.name} <X className="h-3 w-3 cursor-pointer" onClick={() => setChatFile(null)}/></div>}
                                        <div className="flex gap-2">
                                            <input type="file" ref={chatFileRef} className="hidden" onChange={e => e.target.files && setChatFile(e.target.files[0])} />
                                            <Button variant="outline" size="icon" onClick={() => chatFileRef.current?.click()}><ImageIcon className="h-4 w-4"/></Button>
                                            <Textarea placeholder="Type message..." className="min-h-[40px] h-[40px] resize-none" value={newMessageText} onChange={e => setNewMessageText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} />
                                            <Button size="icon" onClick={handleSendMessage} disabled={sendingMsg}>{sendingMsg ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><MessageSquare className="h-10 w-10 opacity-20 mb-2"/><p>Select a conversation</p></div>
                        )}
                    </Card>
                </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* TASK MODAL (Existing) */}
        <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{selectedTask?.task_title}</DialogTitle><DialogDescription>{selectedTask?.properties?.address_line1}</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="bg-muted/50 p-4 rounded-lg text-sm"><span className="font-semibold">Instructions:</span><p className="whitespace-pre-wrap">{selectedTask?.task_description}</p></div>
                    {/* ... (Existing Task Action Buttons & Upload Logic) ... */}
                    {selectedTask?.task_status !== 'completed' && selectedTask?.task_status !== 'verified' && (
                        <div className="grid grid-cols-2 gap-3">
                            {selectedTask?.task_status === 'pending' ? 
                                <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => updateStatus('in_progress')} disabled={updating}><PlayCircle className="w-4 h-4 mr-2"/> Start Task</Button> :
                                <Button className="w-full bg-green-600 hover:bg-green-700 col-span-2" onClick={() => updateStatus('completed')} disabled={updating}><CheckCircle className="w-4 h-4 mr-2"/> Mark Completed</Button>
                            }
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm"><Camera className="w-4 h-4"/> Evidence</h3>
                        {selectedTask?.task_status !== 'completed' && selectedTask?.task_status !== 'verified' && (
                            <div className="mb-4 space-y-3 p-4 border border-dashed rounded-lg bg-gray-50/50">
                                <div className="flex flex-col items-center justify-center text-gray-400 cursor-pointer" onClick={() => fileInputRef.current?.click()}><Upload className="w-6 h-6 mb-1"/><span className="text-xs">Upload photos</span></div>
                                <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,.pdf" onChange={e => e.target.files && setNewFiles(Array.from(e.target.files))}/>
                                {newFiles.length > 0 && <div className="space-y-2"><div className="flex gap-2 py-2">{newFiles.map((f,i) => <div key={i} className="text-xs border p-1 rounded">{f.name}</div>)}</div><Button size="sm" onClick={handleFileUpload} disabled={updating}>{updating && <Loader2 className="animate-spin w-3 h-3 mr-2"/>} Upload</Button></div>}
                            </div>
                        )}
                        <div className="space-y-2 max-h-40 overflow-y-auto">{uploadedFiles.map(f => <div key={f.id} className="flex gap-2 text-xs p-2 border rounded"><FileText className="h-4 w-4"/><a href={f.file_url} target="_blank" className="underline truncate flex-1">{f.description}</a></div>)}</div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* NEW CHAT MODAL */}
        <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>New Conversation</DialogTitle></DialogHeader>
                <div className="py-4">
                    <label className="text-sm font-medium mb-2 block">Select Staff Member</label>
                    <Select onValueChange={setSelectedStaffId}>
                        <SelectTrigger><SelectValue placeholder="Choose staff..." /></SelectTrigger>
                        <SelectContent>{staffList.map(s => <SelectItem key={s.user_id} value={s.user_id}>{s.full_name} <span className="text-xs text-muted-foreground">({s.position || 'Staff'})</span></SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <DialogFooter><Button onClick={handleStartChat} disabled={!selectedStaffId}>Start Chat</Button></DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    </>
  );
};

export default ServiceUserDashboard;