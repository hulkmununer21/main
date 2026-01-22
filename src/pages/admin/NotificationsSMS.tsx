import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Send, Paperclip, Search, Plus, File, 
  MoreVertical, Phone, Loader2, MessageSquare, 
  Bell, CheckSquare, Square, X, ImageIcon, ClipboardList,
  Smartphone, Mail, LayoutDashboard, User as UserIcon, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { format, formatDistanceToNow, parseISO } from "date-fns";

// === TYPES ===
interface UserProfile {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

interface Thread {
  id: string;
  participants: string[];
  last_message_preview: string;
  updated_at: string;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachments?: { name: string; type: string; url: string }[];
  is_read?: boolean; 
}

interface SentNotification {
  id: string;
  recipient_id: string;
  notification_type: string;
  message_body: string;
  subject?: string;
  created_at: string;
  status: string;
  metadata?: any;
}

const NotificationsSMS = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // --- DATA STATE ---
  const [userDirectory, setUserDirectory] = useState<Record<string, UserProfile>>({});
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  
  // ✅ NEW: State for Unread Signals
  const [unreadThreadIds, setUnreadThreadIds] = useState<Set<string>>(new Set());

  // --- HISTORY STATE ---
  const [notificationHistory, setNotificationHistory] = useState<SentNotification[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // --- UI STATE (CHAT) ---
  const [inputText, setInputText] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // --- FILE HANDLING STATE (UPDATED FOR MULTIPLE) ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Changed from single 'selectedFile' to array 'selectedFiles'
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); 
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Kept for legacy preview logic if needed

  // --- UI STATE (BROADCAST) ---
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastChannel, setBroadcastChannel] = useState<"in_app" | "sms" | "email">("in_app"); 
  const [broadcastRecipients, setBroadcastRecipients] = useState<string[]>([]);
  const [broadcastSubject, setBroadcastSubject] = useState(""); 
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSearchTerm, setBroadcastSearchTerm] = useState("");

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    const initData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const [lodgers, staff, serviceUsers, landlords] = await Promise.all([
          supabase.from('lodger_profiles').select('id, full_name, user_id, email, phone'),
          supabase.from('staff_profiles').select('id, full_name, user_id, email, phone'),
          supabase.from('service_user_profiles').select('id, full_name, user_id, email, phone'),
          supabase.from('landlord_profiles').select('id, full_name, user_id, email, phone'),
        ]);

        const dir: Record<string, UserProfile> = {};
        
        const processUser = (u: any, role: string) => {
            if (u.user_id) {
                dir[u.user_id] = { 
                    id: u.user_id, 
                    name: u.full_name || "Unknown", 
                    role, 
                    email: u.email,
                    phone: u.phone 
                };
            }
        };

        lodgers.data?.forEach(u => processUser(u, 'Lodger'));
        staff.data?.forEach(u => processUser(u, 'Staff'));
        serviceUsers.data?.forEach(u => processUser(u, 'Service User'));
        landlords.data?.forEach(u => processUser(u, 'Landlord'));
        
        dir[user.id] = { id: user.id, name: "Me (Admin)", role: "Admin" }; 
        setUserDirectory(dir);

        const { data: threadData, error } = await supabase
          .from('message_threads')
          .select('*')
          .contains('participants', [user.id])
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setThreads(threadData || []);

        const { data: unreadData } = await supabase
            .from('messages')
            .select('thread_id')
            .eq('is_read', false)
            .neq('sender_id', user.id);
        
        if (unreadData && unreadData.length > 0) {
            const ids = new Set(unreadData.map(m => m.thread_id));
            setUnreadThreadIds(ids);
        }

      } catch (error) {
        console.error("Init Error:", error);
        toast.error("Failed to load messaging system.");
      } finally {
        setLoading(false);
      }
    };

    initData();

    const channel = supabase
      .channel('admin_messaging_global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_threads' }, () => {
         if(user) {
             supabase.from('message_threads')
             .select('*')
             .contains('participants', [user.id])
             .order('updated_at', { ascending: false })
             .then(({ data }) => setThreads(data || []));
         }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id !== user?.id) {
              setUnreadThreadIds(prev => new Set(prev).add(newMsg.thread_id));
          }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // --- 2. FETCH HISTORY ---
  useEffect(() => {
    if (isHistoryOpen) {
        const fetchHistory = async () => {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('subject', 'Admin Notification') 
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (data) setNotificationHistory(data);
        };
        fetchHistory();
    }
  }, [isHistoryOpen]);

  // --- 3. CHAT LOGIC ---
  const openThread = async (threadId: string) => {
    setActiveThreadId(threadId);
    setUnreadThreadIds(prev => { const next = new Set(prev); next.delete(threadId); return next; });

    if(user) {
        await supabase.from('messages').update({ is_read: true }).eq('thread_id', threadId).neq('sender_id', user.id);
    }

    const { data } = await supabase.from('messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
    setMessages(data || []);
    scrollToBottom();

    const messageSub = supabase
      .channel(`chat:${threadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        scrollToBottom();
        if (payload.new.sender_id !== user?.id) {
             supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(messageSub); };
  };

  const scrollToBottom = () => { setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 100); };
  const getOtherParticipant = (thread: Thread) => { if (!user) return null; const otherId = thread.participants.find(id => id !== user.id); return otherId ? userDirectory[otherId] : { name: "Unknown User", role: "Unknown" }; };

  // --- 4. FILE HANDLING (UPDATED TO SUPPORT MULTIPLE) ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files);
        // Basic filter: Max 10MB per file
        const validFiles = newFiles.filter(f => f.size <= 10 * 1024 * 1024);
        
        if (validFiles.length !== newFiles.length) {
            toast.error("Some files were skipped (limit 10MB).");
        }
        setSelectedFiles(prev => [...prev, ...validFiles]);
    }
    // Reset input to allow selecting same file again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAttachments = () => {
    setSelectedFiles([]);
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
    if (!hasText && selectedFiles.length === 0) return;

    let attachments = [];
    setUploading(true);
    
    try {
        // ✅ Updated: Loop through all selected files for Chat
        if (selectedFiles.length > 0) {
            const uploadPromises = selectedFiles.map(async (file) => {
                const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
                const filePath = `${activeThreadId}/${Date.now()}_${sanitizedName}`;
                
                const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, file);
                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
                return { name: file.name, type: file.type, url: data.publicUrl };
            });
            attachments = await Promise.all(uploadPromises);
        }

        const { error } = await supabase.from('messages').insert({
            thread_id: activeThreadId,
            sender_id: user.id,
            content: inputText,
            attachments: attachments.length > 0 ? attachments : null
        });

        if (error) throw error;

        await supabase.from('message_threads')
            .update({ 
                last_message_preview: selectedFiles.length > 0 ? (inputText || `Sent ${selectedFiles.length} attachments`) : inputText,
                updated_at: new Date().toISOString() 
            })
            .eq('id', activeThreadId);

        setInputText("");
        clearAttachments();
    } catch (e: any) {
        toast.error("Failed to send: " + e.message);
    } finally {
        setUploading(false);
    }
  };

  const handleStartChat = async (recipientId: string) => {
    if (!user) return;
    setUploading(true);

    try {
        const { data: existing } = await supabase
            .from('message_threads')
            .select('*')
            .contains('participants', [user.id, recipientId]);

        const found = existing?.find(t => t.participants.length === 2 && t.participants.includes(user.id) && t.participants.includes(recipientId));

        if (found) {
            openThread(found.id); 
            setIsNewChatOpen(false);
            setUploading(false);
            return;
        }

        const recipientName = userDirectory[recipientId]?.name || "User";
        const { data, error } = await supabase.from('message_threads').insert({
            participants: [user.id, recipientId],
            last_message_preview: `Chat started with ${recipientName}`,
            updated_at: new Date().toISOString()
        }).select().single();

        if (error) throw error;

        if (data) {
            setThreads(prev => [data, ...prev]);
            openThread(data.id);
            setIsNewChatOpen(false);
        }
    } catch (e: any) {
        toast.error("Error creating chat: " + e.message);
    } finally {
        setUploading(false);
    }
  };

  // ✅ UPDATED BROADCAST: Loop through files and send ARRAY to backend
  const handleBroadcast = async () => {
    if (broadcastRecipients.length === 0) return toast.error("Select at least one recipient");
    if (broadcastChannel === 'email' && !broadcastSubject.trim()) return toast.error("Email Subject is required");
    if (!broadcastMessage.trim()) return toast.error("Message content is required");
    
    setUploading(true);

    try {
        if (broadcastChannel === 'sms') {
            const targetPhones = broadcastRecipients
                .map(id => userDirectory[id]?.phone)
                .filter(phone => phone && phone.length > 5);

            if (targetPhones.length === 0) throw new Error("No valid phones found.");

            const { data, error } = await supabase.functions.invoke('send-sms', {
                body: { recipients: targetPhones, message: broadcastMessage }
            });

            if (error) throw new Error(error.message);
            if (data?.error) throw new Error(data.error);

            toast.success(`SMS sent to ${data?.count} recipients.`);

        } else if (broadcastChannel === 'email') {
            const targetEmails = broadcastRecipients
                .map(id => userDirectory[id]?.email)
                .filter(email => email && email.includes('@'));

            if (targetEmails.length === 0) throw new Error("No valid emails found.");

            // ✅ LOOP: Upload all selected files
            let attachmentsData: { url: string; name: string; type: string }[] = [];
            
            if (selectedFiles.length > 0) {
                const uploadPromises = selectedFiles.map(async (file) => {
                    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                    const { error: uploadError } = await supabase.storage
                        .from('email-attachments')
                        .upload(fileName, file);
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: urlData } = supabase.storage.from('email-attachments').getPublicUrl(fileName);
                    return { url: urlData.publicUrl, name: file.name, type: file.type };
                });
                attachmentsData = await Promise.all(uploadPromises);
            }

            // ✅ SEND: Pass the ARRAY 'attachments' (plural) to backend
            const { data, error } = await supabase.functions.invoke('send-broadcast', {
                body: { 
                    recipients: targetEmails, 
                    subject: broadcastSubject, 
                    message: broadcastMessage,
                    attachments: attachmentsData // Pass the array here
                }
            });

            if (error) throw new Error(error.message);
            if (data?.error) throw new Error(data.error);

            toast.success(`Email sent successfully!`);

        } else {
            const payloads = broadcastRecipients.map(uid => ({
                recipient_id: uid,
                subject: broadcastSubject || "Admin Notification",
                message_body: broadcastMessage,
                notification_type: 'in_app',
                priority: 'high',
                metadata: {
                    channel: broadcastChannel, 
                    sent_by: user?.id,
                    target_role: userDirectory[uid]?.role,
                    original_subject: broadcastSubject 
                }
            }));

            const { error } = await supabase.from('notifications').insert(payloads);
            if (error) throw error;
            toast.success(`Broadcast sent.`);
        }

        // Cleanup
        setIsBroadcastOpen(false);
        setBroadcastMessage("");
        setBroadcastSubject("");
        setBroadcastRecipients([]);
        setBroadcastChannel('in_app');
        clearAttachments();
    } catch (err: any) {
        toast.error("Failed to send: " + err.message);
    } finally {
        setUploading(false);
    }
  };

  // --- HELPERS ---
  const handleSelectAll = (userIds: string[]) => {
    const unique = new Set([...broadcastRecipients, ...userIds]);
    setBroadcastRecipients(Array.from(unique));
  };

  const handleDeselectAll = (userIds: string[]) => {
    setBroadcastRecipients(prev => prev.filter(id => !userIds.includes(id)));
  };

  const groupedUsers = useMemo(() => {
    const groups: Record<string, UserProfile[]> = { 'Staff': [], 'Lodger': [], 'Service User': [], 'Landlord': [] };
    Object.values(userDirectory).forEach(u => {
        if (u.id !== user?.id) {
            if (groups[u.role]) {
                groups[u.role].push(u);
            } else {
                if(!groups['Other']) groups['Other'] = [];
                groups['Other'].push(u);
            }
        }
    });
    return groups;
  }, [userDirectory, user]);

  const filterUsers = (list: UserProfile[], term: string) => {
      return list.filter(u => u.name.toLowerCase().includes(term.toLowerCase()) || u.email?.toLowerCase().includes(term.toLowerCase()));
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      
      {/* --- SIDEBAR --- */}
      <div className="w-80 border-r flex flex-col bg-gray-50/50">
        <div className="p-4 border-b flex justify-between items-center bg-background">
          <h2 className="font-semibold text-lg">Messages</h2>
          <div className="flex gap-1">
            
            {/* History Button */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" title="Sent History"><ClipboardList className="h-5 w-5" /></Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader><DialogTitle>Broadcast History</DialogTitle></DialogHeader>
                    <div className="flex-1 overflow-auto border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-muted sticky top-0">
                                <tr>
                                    <th className="p-3 text-left font-medium">Recipient</th>
                                    <th className="p-3 text-left font-medium">Channel</th>
                                    <th className="p-3 text-left font-medium">Subject/Message</th>
                                    <th className="p-3 text-left font-medium">Sent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notificationHistory.map(n => (
                                    <tr key={n.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="p-3">{userDirectory[n.recipient_id]?.name || "Unknown"}</td>
                                        <td className="p-3 capitalize"><Badge variant="outline">{n.metadata?.channel || 'In App'}</Badge></td>
                                        <td className="p-3 max-w-xs truncate">
                                            {n.metadata?.original_subject && <span className="font-semibold">{n.metadata.original_subject}: </span>}
                                            {n.message_body}
                                        </td>
                                        <td className="p-3 whitespace-nowrap text-muted-foreground">{format(parseISO(n.created_at), 'MMM d, p')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <DialogFooter><Button onClick={() => setIsHistoryOpen(false)}>Close</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Broadcast Button */}
            <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
                <DialogTrigger asChild><Button size="icon" variant="ghost" title="Broadcast"><Bell className="h-5 w-5" /></Button></DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
                    <DialogHeader><DialogTitle>New Broadcast</DialogTitle><DialogDescription>Send notification, email, or SMS.</DialogDescription></DialogHeader>
                    <div className="space-y-4 py-4">
                        
                        {/* Channel Selector */}
                        <div className="space-y-2">
                            <Label>Delivery Channel</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {['in_app', 'sms', 'email'].map(c => (
                                    <div key={c} onClick={() => setBroadcastChannel(c as any)} className={`cursor-pointer border rounded-md p-3 flex flex-col items-center justify-center gap-2 transition-colors ${broadcastChannel === c ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                                        {c === 'in_app' ? <LayoutDashboard className="h-5 w-5"/> : c === 'sms' ? <Smartphone className="h-5 w-5"/> : <Mail className="h-5 w-5"/>}
                                        <span className="text-xs font-medium capitalize">{c.replace('_', '-')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recipient Selector */}
                        <div className="space-y-2">
                            <Label>Recipients</Label>
                            <Tabs defaultValue="Lodger" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="Lodger">Lodgers</TabsTrigger>
                                    <TabsTrigger value="Staff">Staff</TabsTrigger>
                                    <TabsTrigger value="Service User">Services</TabsTrigger>
                                    <TabsTrigger value="Landlord">Landlords</TabsTrigger>
                                </TabsList>
                                <div className="py-2">
                                    <Input placeholder="Search name..." value={broadcastSearchTerm} onChange={e => setBroadcastSearchTerm(e.target.value)} className="h-8 text-xs" />
                                </div>
                                {Object.entries(groupedUsers).map(([role, users]) => {
                                    const filtered = filterUsers(users, broadcastSearchTerm);
                                    return (
                                        <TabsContent key={role} value={role} className="border rounded-md mt-0">
                                            <div className="flex justify-between items-center p-2 bg-muted/30 border-b">
                                                <span className="text-xs text-muted-foreground">{filtered.length} found</span>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => handleDeselectAll(filtered.map(u => u.id))}>Clear</Button>
                                                    <Button variant="secondary" size="sm" className="h-6 text-xs px-2" onClick={() => handleSelectAll(filtered.map(u => u.id))}>Select All</Button>
                                                </div>
                                            </div>
                                            <ScrollArea className="h-40 p-2">
                                                {filtered.map(u => (
                                                    <div key={u.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded cursor-pointer" onClick={() => setBroadcastRecipients(prev => prev.includes(u.id) ? prev.filter(i => i !== u.id) : [...prev, u.id])}>
                                                        {broadcastRecipients.includes(u.id) ? <CheckSquare className="h-4 w-4 text-primary"/> : <Square className="h-4 w-4 text-muted-foreground"/>}
                                                        <span className="text-sm">{u.name}</span>
                                                    </div>
                                                ))}
                                                {filtered.length === 0 && <p className="text-xs text-center py-4 text-muted-foreground">No users found.</p>}
                                            </ScrollArea>
                                        </TabsContent>
                                    );
                                })}
                            </Tabs>
                            <p className="text-xs text-right text-muted-foreground mt-1">{broadcastRecipients.length} recipients selected</p>
                        </div>
                        
                        {/* Subject Field */}
                        <div className="space-y-2">
                            <Label>
                                {broadcastChannel === 'email' ? "Subject *" : 
                                 broadcastChannel === 'sms' ? "Header (Optional)" : 
                                 "Title (Optional)"}
                            </Label>
                            <Input 
                                value={broadcastSubject} 
                                onChange={e => setBroadcastSubject(e.target.value)} 
                                placeholder={broadcastChannel === 'email' ? "Important Update" : "Notification Title"}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Message Content *</Label>
                            <Textarea 
                                value={broadcastMessage} 
                                onChange={e => setBroadcastMessage(e.target.value)} 
                                placeholder={broadcastChannel === 'sms' ? "Keep it short (160 chars recommended)" : "Type your message..."}
                                className="min-h-[100px]"
                            />
                            {broadcastChannel === 'sms' && broadcastMessage.length > 160 && (
                                <p className="text-xs text-orange-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Long message: may be split into multiple SMS segments.</p>
                            )}
                        </div>

                        {/* ✅ UPDATED: Multiple Attachment UI */}
                        {broadcastChannel === 'email' && (
                            <div className="space-y-2">
                                <Label>Attachments</Label>
                                <div className="space-y-2">
                                    <div className="flex gap-2 items-center">
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            multiple // Allow multiple selection
                                            onChange={handleFileSelect} 
                                        />
                                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                            <Paperclip className="h-4 w-4 mr-2"/> Attach Files
                                        </Button>
                                    </div>
                                    {selectedFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedFiles.map((file, i) => (
                                                <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 border rounded-md text-xs">
                                                    <span className="max-w-[150px] truncate">{file.name}</span>
                                                    <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeFile(i)}/>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBroadcastOpen(false)}>Cancel</Button>
                        <Button onClick={handleBroadcast} disabled={uploading}>
                            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Send Broadcast
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Chat Button */}
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                <DialogTrigger asChild><Button size="icon" variant="ghost"><Plus className="h-5 w-5" /></Button></DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>New Chat</DialogTitle><DialogDescription>Select a user to start a conversation.</DialogDescription></DialogHeader>
                    <Tabs defaultValue="Lodger" className="w-full mt-2">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="Lodger">Lodgers</TabsTrigger>
                            <TabsTrigger value="Staff">Staff</TabsTrigger>
                            <TabsTrigger value="Service User">Services</TabsTrigger>
                            <TabsTrigger value="Landlord">Landlords</TabsTrigger>
                        </TabsList>
                        <div className="py-3">
                            <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search user..." className="pl-8" value={chatSearchTerm} onChange={e => setChatSearchTerm(e.target.value)} /></div>
                        </div>
                        {Object.entries(groupedUsers).map(([role, users]) => {
                            const filtered = filterUsers(users, chatSearchTerm);
                            return (
                                <TabsContent key={role} value={role}>
                                    <ScrollArea className="h-64 border rounded-md p-2">
                                        {filtered.length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">No users found.</p> : 
                                            filtered.map(u => (
                                                <div key={u.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8"><AvatarFallback>{u.name.charAt(0)}</AvatarFallback></Avatar>
                                                        <div><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                                                    </div>
                                                    <Button size="icon" variant="ghost" onClick={() => handleStartChat(u.id)} disabled={uploading}><MessageSquare className="h-4 w-4 text-primary"/></Button>
                                                </div>
                                            ))
                                        }
                                    </ScrollArea>
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="p-3 border-b bg-background">
          <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search threads..." className="pl-8 bg-muted/20" /></div>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {threads.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No conversations.</div> : 
            threads.map((thread) => {
              const otherUser = getOtherParticipant(thread);
              const isActive = activeThreadId === thread.id;
              // ✅ UI: Check if this thread has an unread signal
              const isUnread = unreadThreadIds.has(thread.id);

              return (
                // ✅ UI: Updated logic to open thread properly
                <button key={thread.id} onClick={() => openThread(thread.id)} className={`flex items-start gap-3 p-4 text-left border-b transition-colors hover:bg-muted/50 ${isActive ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}>
                  <Avatar><AvatarImage /><AvatarFallback>{otherUser?.name?.charAt(0)}</AvatarFallback></Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      {/* ✅ UI: Bold text if unread */}
                      <span className={`truncate ${isUnread ? 'font-bold text-foreground' : 'font-medium'}`}>{otherUser?.name || "Unknown"}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDistanceToNow(parseISO(thread.updated_at), { addSuffix: true })}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <p className={`text-sm truncate max-w-[180px] ${isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{thread.last_message_preview}</p>
                        
                        {/* ✅ UI: The Blue Dot Signal */}
                        {isUnread && <div className="h-2.5 w-2.5 bg-blue-600 rounded-full shrink-0 animate-pulse" />}
                    </div>
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
              <div className="flex gap-2">
                  <Button variant="ghost" size="icon" title="Call User"><Phone className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </div>
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
                                {att.type.startsWith('image') ? <img src={att.url} alt="attachment" className="rounded-md max-h-48 object-cover border bg-background" /> : <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/10 p-2 rounded hover:bg-black/20 text-xs"><File className="h-4 w-4" /> {att.name}</a>}
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
              {/* ✅ UPDATED: Multiple Files Preview in Chat Input */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {selectedFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded border w-fit text-xs">
                            <span className="max-w-[120px] truncate">{file.name}</span>
                            <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeFile(i)}/>
                        </div>
                    ))}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <div className="flex gap-2 pb-2">
                    <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
                    <Button variant="outline" size="icon" className={`shrink-0 ${selectedFiles.length > 0 ? 'text-primary border-primary' : ''}`} onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-4 w-4"/></Button>
                </div>
                <Input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} placeholder="Type a message..." className="flex-1 min-h-[2.5rem]" autoFocus />
                <Button onClick={handleSendMessage} disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}</Button>
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