import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Send, Paperclip, Search, Plus, File, 
  MoreVertical, Phone, Loader2, MessageSquare, 
  Bell, CheckSquare, Square, X, ImageIcon, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { format, formatDistanceToNow, parseISO } from "date-fns";

// === TYPES ===
interface UserProfile {
  id: string;
  name: string;
  role: string;
  avatar_url?: string;
  email?: string;
}

interface Thread {
  id: string;
  participants: string[];
  last_message_preview: string;
  updated_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachments?: { name: string; type: string; url: string }[];
}

interface SentNotification {
  id: string;
  recipient_id: string;
  notification_type: string;
  message_body: string;
  created_at: string;
  status: string;
}

const NotificationsSMS = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // --- DATA STATE ---
  const [userDirectory, setUserDirectory] = useState<Record<string, UserProfile>>({});
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  
  // --- HISTORY STATE ---
  const [notificationHistory, setNotificationHistory] = useState<SentNotification[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // --- UI STATE (CHAT) ---
  const [inputText, setInputText] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // --- FILE HANDLING STATE ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // --- UI STATE (BROADCAST) ---
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastType, setBroadcastType] = useState("in_app");
  const [broadcastRecipients, setBroadcastRecipients] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    const initData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // A. Build Directory
        const [lodgers, staff, serviceUsers] = await Promise.all([
          supabase.from('lodger_profiles').select('id, full_name, user_id, email'),
          supabase.from('staff_profiles').select('id, full_name, user_id, email'),
          supabase.from('service_user_profiles').select('id, full_name, user_id, email'),
        ]);

        const dir: Record<string, UserProfile> = {};
        
        lodgers.data?.forEach((u: any) => { if(u.user_id) dir[u.user_id] = { id: u.user_id, name: u.full_name, role: 'Lodger', email: u.email }; });
        staff.data?.forEach((u: any) => { if(u.user_id) dir[u.user_id] = { id: u.user_id, name: u.full_name, role: 'Staff', email: u.email }; });
        serviceUsers.data?.forEach((u: any) => { if(u.user_id) dir[u.user_id] = { id: u.user_id, name: u.full_name, role: 'Service User', email: u.email }; });
        dir[user.id] = { id: user.id, name: "Me", role: "Admin" }; 
        
        setUserDirectory(dir);

        // B. Fetch Threads
        const { data: threadData, error } = await supabase
          .from('message_threads')
          .select('*')
          .contains('participants', [user.id])
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setThreads(threadData || []);

      } catch (error) {
        console.error("Init Error:", error);
      } finally {
        setLoading(false);
      }
    };

    initData();

    // C. Realtime Inbox Listener
    const threadSubscription = supabase
      .channel('public:message_threads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_threads' }, () => {
         if(user) {
             supabase.from('message_threads')
             .select('*')
             .contains('participants', [user.id])
             .order('updated_at', { ascending: false })
             .then(({ data }) => setThreads(data || []));
         }
      })
      .subscribe();

    return () => { supabase.removeChannel(threadSubscription); };
  }, [user]);

  // --- 2. FETCH HISTORY (When Dialog Opens) ---
  useEffect(() => {
    if (isHistoryOpen) {
        const fetchHistory = async () => {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('subject', 'Admin Notification') // ✅ Filter by fixed subject
                .order('created_at', { ascending: false });
            
            if (data) setNotificationHistory(data);
        };
        fetchHistory();
    }
  }, [isHistoryOpen]);

  // --- 3. CHAT LOGIC ---
  useEffect(() => {
    if (!activeThreadId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', activeThreadId)
        .order('created_at', { ascending: true });
      
      setMessages(data || []);
      scrollToBottom();
    };

    fetchMessages();

    const messageSub = supabase
      .channel(`chat:${activeThreadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${activeThreadId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        scrollToBottom();
      })
      .subscribe();

    return () => { supabase.removeChannel(messageSub); };
  }, [activeThreadId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  const getOtherParticipant = (thread: Thread) => {
    if (!user) return null;
    const otherId = thread.participants.find(id => id !== user.id);
    return otherId ? userDirectory[otherId] : { name: "Unknown", role: "" };
  };

  // --- 4. FILE HANDLING ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }
    }
  };

  const clearAttachment = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- 5. ACTIONS ---

  const handleSendMessage = async () => {
    if (!activeThreadId || !user) {
        toast.error("No active conversation");
        return;
    }
    const hasText = inputText.trim().length > 0;
    if (!hasText && !selectedFile) return;

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
      } catch (e: any) {
        toast.error("Upload failed: " + e.message);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const { error } = await supabase.from('messages').insert({
      thread_id: activeThreadId,
      sender_id: user.id,
      content: inputText,
      attachments: attachments.length > 0 ? attachments : null
    });

    if (error) {
        toast.error("Failed to send message");
    } else {
        setInputText("");
        clearAttachment();
    }
  };

  const handleCreateThread = async () => {
    if (!selectedRecipient || !user) return;
    setUploading(true);

    try {
        const { data: existing } = await supabase
            .from('message_threads')
            .select('*')
            .contains('participants', [user.id, selectedRecipient]);

        const found = existing?.find(t => t.participants.length === 2);

        if (found) {
            setActiveThreadId(found.id);
            setIsNewChatOpen(false);
            setUploading(false);
            return;
        }

        const { data, error } = await supabase.from('message_threads').insert({
            participants: [user.id, selectedRecipient],
            last_message_preview: "Chat started",
            updated_at: new Date().toISOString()
        }).select().single();

        if (error) throw error;

        if (data) {
            setThreads(prev => [data, ...prev]);
            setActiveThreadId(data.id);
            setIsNewChatOpen(false);
        }
    } catch (e: any) {
        toast.error("Error creating chat: " + e.message);
    } finally {
        setUploading(false);
    }
  };

  // ✅ UPDATED BROADCAST HANDLER
  const handleBroadcast = async () => {
    if (broadcastRecipients.length === 0) return toast.error("Select at least one recipient");
    if (!broadcastMessage.trim()) return toast.error("Message is required");
    
    setUploading(true);

    try {
        // Construct Payload with FIXED subject "Admin Notification"
        const payloads = broadcastRecipients.map(uid => ({
            recipient_id: uid,
            subject: "Admin Notification",   // ✅ Fixed Subject
            message_body: broadcastMessage,
            notification_type: broadcastType,
            priority: 'medium', 
                            
            metadata: {},                    
            
        }));

        const { error } = await supabase.from('notifications').insert(payloads);
        
        if (error) {
            console.error("Broadcast Error:", error);
            throw error;
        }

        toast.success(`Broadcast sent to ${broadcastRecipients.length} users`);
        setIsBroadcastOpen(false);
        setBroadcastMessage("");
        setBroadcastRecipients([]);
    } catch (err: any) {
        toast.error("Failed to send: " + err.message);
    } finally {
        setUploading(false);
    }
  };

  // --- RENDER HELPERS ---
  const groupedUsers = useMemo(() => {
    const groups: Record<string, UserProfile[]> = { 'Staff': [], 'Lodger': [], 'Service User': [] };
    Object.values(userDirectory).forEach(u => {
        if (u.id !== user?.id) {
            if (!groups[u.role]) groups[u.role] = [];
            groups[u.role].push(u);
        }
    });
    return groups;
  }, [userDirectory, user]);

  const usersList = useMemo(() => Object.values(userDirectory).filter(u => u.id !== user?.id), [userDirectory, user]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      
      {/* --- SIDEBAR --- */}
      <div className="w-80 border-r flex flex-col bg-muted/10">
        <div className="p-4 border-b flex justify-between items-center bg-background">
          <h2 className="font-semibold text-lg">Messages</h2>
          <div className="flex gap-1">
            
            {/* History Button (New) */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" title="Sent History"><ClipboardList className="h-5 w-5" /></Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Sent Admin Notifications</DialogTitle>
                        <DialogDescription>History of broadcasts sent by administrators.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-muted sticky top-0">
                                <tr>
                                    <th className="p-3 text-left font-medium">Recipient</th>
                                    <th className="p-3 text-left font-medium">Type</th>
                                    <th className="p-3 text-left font-medium">Message</th>
                                    <th className="p-3 text-left font-medium">Sent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notificationHistory.length === 0 ? (
                                    <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No history found.</td></tr>
                                ) : notificationHistory.map(n => {
                                    const recipientName = userDirectory[n.recipient_id]?.name || "Unknown";
                                    return (
                                        <tr key={n.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="p-3">{recipientName}</td>
                                            <td className="p-3 capitalize">{n.notification_type?.replace('_', ' ')}</td>
                                            <td className="p-3 max-w-xs truncate" title={n.message_body}>{n.message_body}</td>
                                            <td className="p-3 whitespace-nowrap text-muted-foreground">{format(parseISO(n.created_at), 'MMM d, p')}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <DialogFooter><Button onClick={() => setIsHistoryOpen(false)}>Close</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Broadcast Button */}
            <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
                <DialogTrigger asChild><Button size="icon" variant="ghost" title="Broadcast"><Bell className="h-5 w-5" /></Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Send Admin Notification</DialogTitle><DialogDescription>This message will be sent with the subject "Admin Notification".</DialogDescription></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Channel</Label>
                            <div className="flex gap-2">
                                {['in_app', 'sms', 'email'].map(t => (
                                    <Button key={t} size="sm" variant={broadcastType === t ? 'default' : 'outline'} onClick={() => setBroadcastType(t)} className="capitalize">
                                        {t.replace('_', ' ')}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Recipients</Label>
                            <ScrollArea className="h-32 border rounded-md p-2">
                                {usersList.map(u => (
                                    <div key={u.id} className="flex items-center gap-2 py-1" onClick={() => setBroadcastRecipients(prev => prev.includes(u.id) ? prev.filter(i => i !== u.id) : [...prev, u.id])}>
                                        {broadcastRecipients.includes(u.id) ? <CheckSquare className="h-4 w-4 text-primary"/> : <Square className="h-4 w-4"/>}
                                        <span className="text-sm cursor-pointer">{u.name} <span className="text-xs text-muted-foreground">({u.role})</span></span>
                                    </div>
                                ))}
                            </ScrollArea>
                            <p className="text-xs text-muted-foreground">{broadcastRecipients.length} selected</p>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Message</Label>
                            <Textarea 
                                value={broadcastMessage} 
                                onChange={e => setBroadcastMessage(e.target.value)} 
                                placeholder="Type your broadcast message..." 
                            />
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleBroadcast} disabled={uploading}>Send Broadcast</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Chat Button */}
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                <DialogTrigger asChild><Button size="icon" variant="ghost"><Plus className="h-5 w-5" /></Button></DialogTrigger>
                <DialogContent>
                <DialogHeader><DialogTitle>New Chat</DialogTitle></DialogHeader>
                <div className="py-4">
                    <Label>Select Recipient</Label>
                    <Select onValueChange={setSelectedRecipient}>
                    <SelectTrigger className="mt-2"><SelectValue placeholder="Select user..." /></SelectTrigger>
                    <SelectContent>
                        {Object.entries(groupedUsers).map(([role, users]) => (
                            users.length > 0 && (
                                <SelectGroup key={role}>
                                    <SelectLabel>{role}s</SelectLabel>
                                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                </SelectGroup>
                            )
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <DialogFooter><Button onClick={handleCreateThread} disabled={!selectedRecipient || uploading}>Start Chat</Button></DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="p-3 border-b bg-background">
          <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search messages..." className="pl-8 bg-muted/20" /></div>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {threads.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No conversations.</div> : 
            threads.map((thread) => {
              const otherUser = getOtherParticipant(thread);
              const isActive = activeThreadId === thread.id;
              return (
                <button key={thread.id} onClick={() => setActiveThreadId(thread.id)} className={`flex items-start gap-3 p-4 text-left border-b transition-colors hover:bg-muted/50 ${isActive ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}>
                  <Avatar><AvatarImage src={otherUser?.avatar_url} /><AvatarFallback>{otherUser?.name?.charAt(0)}</AvatarFallback></Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium truncate">{otherUser?.name || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(parseISO(thread.updated_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{thread.last_message_preview}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* --- MAIN CHAT AREA --- */}
      <div className="flex-1 flex flex-col bg-background">
        {activeThreadId ? (
          <>
            <header className="h-16 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9"><AvatarFallback>{getOtherParticipant(threads.find(t => t.id === activeThreadId)!)?.name?.charAt(0)}</AvatarFallback></Avatar>
                <div>
                  <h3 className="font-semibold text-sm">{getOtherParticipant(threads.find(t => t.id === activeThreadId)!)?.name}</h3>
                  <p className="text-xs text-muted-foreground">{getOtherParticipant(threads.find(t => t.id === activeThreadId)!)?.role}</p>
                </div>
              </div>
              <div className="flex gap-2"><Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5" ref={scrollRef}>
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2 space-y-2">
                          {msg.attachments.map((att, idx) => (
                            <div key={idx}>
                                {att.type.startsWith('image') ? 
                                    <img src={att.url} alt="attachment" className="rounded-md max-h-48 object-cover border" /> : 
                                    <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/10 p-2 rounded hover:bg-black/20 text-xs"><File className="h-4 w-4" /> {att.name}</a>
                                }
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{format(parseISO(msg.created_at), 'p')}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-background border-t">
              {/* Attachment Preview Area */}
              {selectedFile && (
                <div className="flex items-center gap-3 mb-3 p-2 bg-muted/30 rounded border w-fit">
                    {previewUrl ? (
                        <img src={previewUrl} className="h-10 w-10 object-cover rounded" />
                    ) : (
                        <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center"><File className="h-5 w-5 text-gray-500" /></div>
                    )}
                    <div className="text-xs">
                        <p className="font-medium max-w-[150px] truncate">{selectedFile.name}</p>
                        <p className="text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={clearAttachment}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
              )}

              <div className="flex gap-2 items-end">
                <div className="flex gap-2 pb-2">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                    <Button variant="outline" size="icon" className={`shrink-0 ${selectedFile ? 'text-primary border-primary' : ''}`} onClick={() => fileInputRef.current?.click()}>
                        {selectedFile ? <ImageIcon className="h-4 w-4"/> : <Paperclip className="h-4 w-4" />}
                    </Button>
                </div>
                <Input 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} 
                    placeholder="Type a message..." 
                    className="flex-1 min-h-[2.5rem]" 
                    autoFocus 
                />
                <Button onClick={handleSendMessage} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4"><MessageSquare className="h-10 w-10 opacity-20" /></div>
            <h3 className="text-lg font-medium">Select a conversation</h3>
            <p className="text-sm">Choose a thread from the sidebar or start a new chat.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsSMS;