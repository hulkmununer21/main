import { useState, useEffect, useRef } from "react";
import { 
  Bell, User, Send, MessageSquare, Loader2, 
  ChevronLeft, Plus, Clock, Paperclip, File, X, ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

// === TYPES ===
interface Thread {
  id: string;
  participants: string[];
  last_message_preview: string;
  updated_at: string;
  other_user_name: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachments?: { name: string; type: string; url: string }[];
}

const LodgerMessages = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'chat'>('list'); // Mobile toggle
  
  // Data State
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. FETCH THREADS ---
  useEffect(() => {
    if (!user) return;
    
    const fetchThreads = async () => {
      setLoading(true);
      try {
        const { data: threadData, error } = await supabase
          .from('message_threads')
          .select('*')
          .contains('participants', [user.id])
          .order('updated_at', { ascending: false });

        if (error) throw error;

        // Resolve names
        const processed = await Promise.all((threadData || []).map(async (t) => {
            const otherId = t.participants.find((id: string) => id !== user.id);
            let name = "Property Manager";
            
            if (otherId) {
                // Try Admin first, then Staff
                const { data: admin } = await supabase.from('admin_profiles').select('full_name').eq('user_id', otherId).single();
                if (admin) name = admin.full_name;
                else {
                    const { data: staff } = await supabase.from('staff_profiles').select('full_name').eq('user_id', otherId).single();
                    if (staff) name = staff.full_name;
                }
            }
            return { ...t, other_user_name: name };
        }));

        setThreads(processed);
      } catch (error) {
        console.error("Error fetching threads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();

    const sub = supabase.channel('lodger_inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_threads' }, () => fetchThreads())
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [user]);

  // --- 2. OPEN THREAD & FETCH MESSAGES ---
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

    const sub = supabase.channel(`chat:${activeThreadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${activeThreadId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        scrollToBottom();
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [activeThreadId]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // --- 3. ACTIONS ---
  
  const handleStartChat = async () => {
    if (!user) return;
    setLoading(true);

    try {
        // A. Check for existing thread
        if (threads.length > 0) {
            setActiveThreadId(threads[0].id);
            setView('chat');
            setLoading(false);
            return;
        }

        // B. Create new thread
        let { data: admins } = await supabase.from('admin_profiles').select('user_id').limit(1);
        
        if (!admins || admins.length === 0) {
            const { data: staff } = await supabase.from('staff_profiles').select('user_id').limit(1);
            admins = staff;
        }

        if (admins && admins.length > 0) {
            const adminId = admins[0].user_id;
            
            const { data: newThread, error } = await supabase.from('message_threads').insert({
                participants: [user.id, adminId],
                last_message_preview: "Chat started",
                updated_at: new Date().toISOString()
            }).select().single();

            if (error) throw error;
            
            const newThreadObj = { ...newThread, other_user_name: "Property Manager" };
            setThreads([newThreadObj, ...threads]);
            setActiveThreadId(newThread.id);
            setView('chat');
        } else {
            toast.error("No support staff available.");
        }
    } catch (e: any) {
        toast.error("Error starting chat: " + e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const clearAttachment = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !activeThreadId || !user) return;
    setSending(true);

    let attachments = [];
    if (selectedFile) {
        setUploading(true);
        const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filePath = `${activeThreadId}/${Date.now()}_${sanitizedName}`;
        try {
            await supabase.storage.from('chat-attachments').upload(filePath, selectedFile);
            const { data } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
            attachments.push({ name: selectedFile.name, type: selectedFile.type, url: data.publicUrl });
        } catch (e) {
            toast.error("File upload failed");
            setUploading(false);
            setSending(false);
            return;
        }
        setUploading(false);
    }

    try {
        const { error } = await supabase.from('messages').insert({
            thread_id: activeThreadId,
            sender_id: user.id,
            content: newMessage,
            attachments: attachments.length > 0 ? attachments : null
        });

        if (error) throw error;
        setNewMessage("");
        clearAttachment();
        scrollToBottom();
    } catch (e) {
        toast.error("Failed to send");
    } finally {
        setSending(false);
    }
  };

  // --- UI RENDER (Robust Flex Layout) ---
  return (
    <div className="h-[75vh] min-h-[500px] w-full flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden shadow-sm border border-border">
        
        {/* Header */}
        <CardHeader className="border-b py-3 px-4 shrink-0 bg-card flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Back Button (Mobile Only) */}
            <div className={cn("md:hidden", view === 'list' && "hidden")}>
                <Button variant="ghost" size="icon" onClick={() => setView('list')} className="-ml-2">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
            </div>
            
            <CardTitle className="text-lg">
                {view === 'list' ? 'Messages' : threads.find(t => t.id === activeThreadId)?.other_user_name || 'Chat'}
            </CardTitle>
          </div>
          
          {view === 'list' && (
            <Button size="sm" onClick={handleStartChat} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" /> New Chat
            </Button>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex p-0 overflow-hidden">
          
          {/* --- SIDEBAR LIST --- */}
          <div className={cn(
            "w-full md:w-80 border-r flex flex-col bg-muted/10 transition-all",
            view === 'chat' ? "hidden md:flex" : "flex"
          )}>
            {loading ? (
                <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-primary"/></div>
            ) : (
                <ScrollArea className="flex-1">
                    {threads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                            <MessageSquare className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
                            <p className="text-muted-foreground mb-4">No messages yet.</p>
                            <Button variant="outline" onClick={handleStartChat}>Contact Admin</Button>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {threads.map(thread => (
                                <button
                                    key={thread.id}
                                    onClick={() => { setActiveThreadId(thread.id); setView('chat'); }}
                                    className={cn(
                                        "flex items-start gap-3 p-4 text-left border-b hover:bg-muted/50 transition-colors",
                                        activeThreadId === thread.id && "bg-primary/5 border-l-4 border-l-primary"
                                    )}
                                >
                                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="font-medium truncate text-sm">{thread.other_user_name}</span>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(parseISO(thread.updated_at), { addSuffix: false })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{thread.last_message_preview}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            )}
          </div>

          {/* --- CHAT WINDOW --- */}
          <div className={cn(
            "flex-1 flex flex-col bg-background h-full",
            view === 'list' ? "hidden md:flex" : "flex"
          )}>
            {activeThreadId ? (
                <>
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4 max-w-3xl mx-auto">
                            {messages.map((msg) => {
                                const isMe = msg.sender_id === user?.id;
                                return (
                                    <div key={msg.id} className={cn("flex", isMe ? 'justify-end' : 'justify-start')}>
                                        <div className={cn(
                                            "max-w-[85%] md:max-w-[70%] p-3 rounded-lg text-sm shadow-sm", 
                                            isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white border rounded-tl-none'
                                        )}>
                                            {/* Attachments */}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mb-2 space-y-2">
                                                    {msg.attachments.map((att, idx) => (
                                                        <div key={idx}>
                                                            {att.type.startsWith('image') ? (
                                                                <img src={att.url} alt="attachment" className="rounded-md max-h-48 object-cover border" />
                                                            ) : (
                                                                <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/10 p-2 rounded hover:bg-black/20 text-xs underline">
                                                                    <File className="h-4 w-4" /> {att.name}
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                            <p className={cn("text-[10px] mt-1 text-right", isMe ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                                {format(parseISO(msg.created_at), 'p')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="p-3 border-t bg-background">
                        {selectedFile && (
                            <div className="flex items-center gap-3 mb-2 p-2 bg-muted/30 rounded border w-fit">
                                {selectedFile.type.startsWith('image') ? (
                                    <img src={URL.createObjectURL(selectedFile)} className="h-8 w-8 object-cover rounded" />
                                ) : (
                                    <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center"><File className="h-4 w-4 text-gray-500" /></div>
                                )}
                                <div className="text-xs"><p className="font-medium max-w-[100px] truncate">{selectedFile.name}</p></div>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={clearAttachment}><X className="h-3 w-3" /></Button>
                            </div>
                        )}
                        <div className="flex gap-2 items-end max-w-3xl mx-auto">
                            <div className="flex gap-1 pb-1">
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => fileInputRef.current?.click()}>
                                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </div>
                            <Input 
                                placeholder="Type a message..." 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                className="flex-1"
                            />
                            <Button size="icon" onClick={handleSendMessage} disabled={sending || uploading} className="shrink-0">
                                {sending || uploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="hidden md:flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mb-2 opacity-10" />
                    <p>Select a thread to start messaging</p>
                </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default LodgerMessages;