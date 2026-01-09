import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Send, User, Users, Clock, Loader2, 
  Paperclip, File, X, ImageIcon, Plus 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { toast } from "sonner";
import { format, formatDistanceToNow, parseISO } from "date-fns";

// === TYPES ===
interface Thread {
  id: string;
  participants: string[];
  last_message_preview: string;
  updated_at: string;
  subject?: string;
  other_user?: {
    name: string;
    role: 'Admin' | 'Service User' | 'Unknown';
    id: string;
  };
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachments?: { name: string; type: string; url: string }[]; 
  is_read: boolean;
}

interface ServiceUserProfile {
  user_id: string;
  full_name: string;
  service_type?: string;
}

const StaffMessages = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false); 
  
  // Data Buckets
  const [adminThreads, setAdminThreads] = useState<Thread[]>([]);
  const [serviceUserThreads, setServiceUserThreads] = useState<Thread[]>([]);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  
  // New Chat State
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [serviceUsersList, setServiceUsersList] = useState<ServiceUserProfile[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  
  // UI State
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null); 
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); 

  // --- 1. FETCH THREADS (Updated for Silent Refresh) ---
  const fetchThreads = async (isBackground = false) => {
    if (!user) return;
    if (!isBackground) setLoading(true); // ✅ Only load spinner on first fetch

    try {
      const { data: threads, error } = await supabase
        .from('message_threads')
        .select('*')
        .contains('participants', [user.id])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const rawThreads = threads || [];
      const allParticipantIds = [...new Set(
          rawThreads.flatMap(t => t.participants).filter(id => id !== user.id)
      )];
      
      const [adminRes, suRes] = await Promise.all([
        supabase.from('admin_profiles').select('user_id, full_name').in('user_id', allParticipantIds),
        supabase.from('service_user_profiles').select('user_id, full_name').in('user_id', allParticipantIds)
      ]);

      const profileMap: Record<string, { name: string, role: 'Admin' | 'Service User' }> = {};
      adminRes.data?.forEach((p: any) => { profileMap[p.user_id] = { name: p.full_name, role: 'Admin' }; });
      suRes.data?.forEach((p: any) => { profileMap[p.user_id] = { name: p.full_name, role: 'Service User' }; });

      const admins: Thread[] = [];
      const serviceUsers: Thread[] = [];

      rawThreads.forEach(t => {
        const otherId = t.participants.find((id: string) => id !== user.id);
        const profile = otherId ? profileMap[otherId] : null;
        
        if (profile) {
            const enhancedThread = { ...t, other_user: { ...profile, id: otherId! } };
            if (profile.role === 'Admin') admins.push(enhancedThread);
            else if (profile.role === 'Service User') serviceUsers.push(enhancedThread);
        }
      });

      setAdminThreads(admins);
      setServiceUserThreads(serviceUsers);

    } catch (error) {
      console.error("Error fetching threads", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // ✅ Realtime Listener for Threads
  useEffect(() => {
    fetchThreads();
    const threadSub = supabase
      .channel('staff_threads')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'message_threads' }, 
        () => { fetchThreads(true); } // ✅ Pass true for silent update
      )
      .subscribe();
    return () => { supabase.removeChannel(threadSub); };
  }, [user]);

  // --- 2. FETCH MESSAGES & REALTIME CHAT ---
  useEffect(() => {
    if (!activeThreadId) return;
    
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('thread_id', activeThreadId).order('created_at', { ascending: true });
      setActiveMessages(data || []);
      scrollToBottom();
    };
    fetchMessages();

    const msgSub = supabase
      .channel(`staff_chat:${activeThreadId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${activeThreadId}` }, 
        (payload) => {
          setActiveMessages(prev => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      ).subscribe();

    return () => { supabase.removeChannel(msgSub); };
  }, [activeThreadId]);

  const scrollToBottom = () => { setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100); };

  // --- 3. LOAD SERVICE USERS ---
  const loadServiceUsers = async () => {
    const { data } = await supabase.from('service_user_profiles').select('user_id, full_name, service_type').order('full_name');
    setServiceUsersList(data || []);
  };

  // --- 4. START CHAT ---
  const handleStartChat = async () => {
    if (!selectedRecipient || !user) return;
    
    const existing = serviceUserThreads.find(t => t.other_user?.id === selectedRecipient);
    if (existing) {
        setActiveThreadId(existing.id);
        setIsNewChatOpen(false);
        return;
    }

    try {
        const { data, error } = await supabase.from('message_threads').insert({
            participants: [user.id, selectedRecipient],
            last_message_preview: "Chat started",
            updated_at: new Date().toISOString()
        }).select().single();

        if (error) throw error;
        
        toast.success("New conversation started");
        setIsNewChatOpen(false);
        fetchThreads(true); 
        setActiveThreadId(data.id); 
    } catch (e: any) {
        toast.error("Failed to start chat");
    }
  };

  // --- 5. SEND MESSAGE (UPDATED) ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]); };
  const clearAttachment = () => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

  const handleSendMessage = async () => {
    if (!activeThreadId || !user) return;
    if (!newMessageText.trim() && !selectedFile) return;
    setSending(true);
    let attachments = [];

    if (selectedFile) {
        setUploading(true);
        const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filePath = `${activeThreadId}/${Date.now()}_${sanitizedName}`;
        try {
            const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, selectedFile);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
            attachments.push({ name: selectedFile.name, type: selectedFile.type, url: data.publicUrl });
        } catch (e: any) { toast.error("Upload failed"); setUploading(false); setSending(false); return; }
        setUploading(false);
    }

    try {
      // 1. Insert Message
      const { error } = await supabase.from('messages').insert({ 
        thread_id: activeThreadId, 
        sender_id: user.id, 
        content: newMessageText, 
        attachments: attachments.length > 0 ? attachments : null 
      });
      if (error) throw error;

      // 2. ✅ Update Thread Timestamp & Preview (Important for Realtime sorting)
      await supabase.from('message_threads').update({
        updated_at: new Date().toISOString(),
        last_message_preview: newMessageText || 'Attachment sent'
      }).eq('id', activeThreadId);

      setNewMessageText(""); 
      clearAttachment();
    } catch (error) { 
      toast.error("Failed to send"); 
    } finally { 
      setSending(false); 
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const messageProps = { activeThreadId, setActiveThreadId, messages: activeMessages, currentUserId: user?.id, messageText: newMessageText, setNewMessageText, handleSendMessage, sending, messagesEndRef, selectedFile, handleFileSelect, clearAttachment, fileInputRef, uploading };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="admin" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="admin" className="flex items-center gap-2"><User className="w-4 h-4" /> Admin <Badge variant="secondary" className="ml-1">{adminThreads.length}</Badge></TabsTrigger>
          <TabsTrigger value="service-users" className="flex items-center gap-2"><Users className="w-4 h-4" /> Service Users <Badge variant="secondary" className="ml-1">{serviceUserThreads.length}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="mt-6">
          <MessageInterface threads={adminThreads} title="Admin Conversations" {...messageProps} />
        </TabsContent>

        <TabsContent value="service-users" className="mt-6">
          <MessageInterface 
            threads={serviceUserThreads} 
            title="Service User Conversations" 
            onNewChat={() => { loadServiceUsers(); setIsNewChatOpen(true); }}
            showNewChatButton={true}
            {...messageProps} 
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Start New Chat</DialogTitle></DialogHeader>
            <div className="py-4">
                <label className="text-sm font-medium mb-2 block">Select Service User</label>
                <Select onValueChange={setSelectedRecipient}>
                    <SelectTrigger><SelectValue placeholder="Search user..." /></SelectTrigger>
                    <SelectContent>
                        {serviceUsersList.map(u => (
                            <SelectItem key={u.user_id} value={u.user_id}>
                                {u.full_name} <span className="text-muted-foreground text-xs">({u.service_type || "General"})</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewChatOpen(false)}>Cancel</Button>
                <Button onClick={handleStartChat} disabled={!selectedRecipient}>Start Chat</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MessageInterface = ({ 
  threads, activeThreadId, setActiveThreadId, messages, currentUserId, 
  messageText, setNewMessageText, handleSendMessage, sending, messagesEndRef, title,
  selectedFile, handleFileSelect, clearAttachment, fileInputRef, uploading,
  onNewChat, showNewChatButton 
}: any) => {
  
  const activeThreadData = threads.find((t: Thread) => t.id === activeThreadId);

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader className="py-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{title}</CardTitle>
            {showNewChatButton && <Button size="sm" variant="outline" onClick={onNewChat}><Plus className="w-4 h-4" /></Button>}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {threads.length === 0 ? <p className="text-sm text-center text-muted-foreground py-8">No messages found.</p> :
            threads.map((thread: Thread) => (
              <div key={thread.id} className={`p-3 border rounded-lg cursor-pointer transition-colors ${activeThreadId === thread.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50"}`} onClick={() => setActiveThreadId(thread.id)}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{thread.other_user?.name}</p>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">{thread.other_user?.role}</span>
                </div>
                <p className="text-sm font-medium text-foreground truncate">{thread.subject || "Conversation"}</p>
                <p className="text-xs text-muted-foreground truncate">{thread.last_message_preview}</p>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{formatDistanceToNow(parseISO(thread.updated_at), { addSuffix: true })}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 flex flex-col">
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-lg">
            {activeThreadData ? (
                <div className="flex flex-col"><span>{activeThreadData.other_user?.name}</span><span className="text-xs font-normal text-muted-foreground">{activeThreadData.other_user?.role}</span></div>
            ) : "Select a conversation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {activeThreadId ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                {messages.map((msg: Message) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] p-3 rounded-lg text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"}`}>
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mb-2 space-y-2">{msg.attachments.map((att, idx) => (<div key={idx}>{att.type.startsWith('image') ? <img src={att.url} alt="attachment" className="rounded-md max-h-48 object-cover border" /> : <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/10 p-2 rounded hover:bg-black/20 text-xs text-white/90 underline"><File className="h-4 w-4" /> {att.name}</a>}</div>))}</div>
                                )}
                                <p>{msg.content}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{format(parseISO(msg.created_at), 'p')}</p>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 bg-background border-t">
                {selectedFile && (
                    <div className="flex items-center gap-3 mb-3 p-2 bg-muted/30 rounded border w-fit">
                        {selectedFile.type.startsWith('image') ? <img src={URL.createObjectURL(selectedFile)} className="h-10 w-10 object-cover rounded" /> : <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center"><File className="h-5 w-5 text-gray-500" /></div>}
                        <div className="text-xs"><p className="font-medium max-w-[150px] truncate">{selectedFile.name}</p><p className="text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p></div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={clearAttachment} type="button"><X className="h-3 w-3" /></Button>
                    </div>
                )}
                <div className="flex gap-2 items-end">
                    <div className="flex gap-2 pb-2">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                        <Button variant="outline" size="icon" className={`shrink-0 ${selectedFile ? 'text-primary border-primary' : ''}`} onClick={() => fileInputRef.current?.click()} type="button"><ImageIcon className="h-4 w-4"/> : <Paperclip className="h-4 w-4" /></Button>
                    </div>
                    <Textarea placeholder="Type your message..." value={messageText} onChange={(e) => setNewMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} className="min-h-[60px] resize-none"/>
                    {/* ✅ type="button" prevents form submission refresh */}
                    <Button className="self-end h-[60px] w-[60px]" onClick={handleSendMessage} disabled={sending || uploading} type="button">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground"><MessageSquare className="w-12 h-12 mb-2 opacity-20" /><p>Select a thread to start chatting</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffMessages;