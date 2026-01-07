import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Home, Calendar, ClipboardCheck, DollarSign, MessageSquare, LogOut, 
  Building, Users, Bed, ChevronDown, ChevronUp, AlertCircle, Loader2,
  TrendingUp, Send, Paperclip, X, File, ChevronLeft, UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/useAuth";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { format, parseISO, formatDistanceToNow } from "date-fns";

// === TYPES ===
interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  attachments?: { name: string; type: string; url: string }[];
}

interface Thread {
  id: string;
  last_message_preview: string;
  updated_at: string;
  other_user?: { name: string; role: string; id: string };
}

const LandlordPortal = () => {
  const { logout, user } = useAuth();
  const [currentTab, setCurrentTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // --- DASHBOARD DATA STATE ---
  const [properties, setProperties] = useState<any[]>([]);
  const [tenancies, setTenancies] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [financials, setFinancials] = useState<{outstanding: number, collected: number}>({ outstanding: 0, collected: 0 });
  const [inspectorNames, setInspectorNames] = useState<Record<string, string>>({});

  // --- UI STATES ---
  const [expandedPropId, setExpandedPropId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // --- CHAT WIDGET STATE ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatView, setChatView] = useState<'list' | 'chat' | 'start'>('list');
  const [chatLoading, setChatLoading] = useState(false);
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [adminContact, setAdminContact] = useState<{id: string, name: string} | null>(null);
  
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. DATA FETCHING (DASHBOARD) ---
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get landlord profile ID first
      const landlordProfileId = (user.profile as any)?.id;
      if (!landlordProfileId) {
        toast.error("Landlord profile not found");
        setLoading(false);
        return;
      }

      const { data: props, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', landlordProfileId);
      if (propError) throw propError;
      
      const propIds = props?.map(p => p.id) || [];
      let activeTenancies: any[] = [];
      let finalProperties = props || [];

      if (propIds.length > 0) {
        const { data: rooms } = await supabase.from('rooms').select('*').in('property_id', propIds);
        const { data: tenData } = await supabase.from('tenancies').select('*').in('property_id', propIds).eq('tenancy_status', 'active');
        const rawTenancies = tenData || [];

        activeTenancies = rawTenancies.map((t: any) => ({ ...t, final_rent: t.monthly_rent || 0 }));
        setTenancies(activeTenancies);

        finalProperties = finalProperties.map(p => {
            const pRooms = rooms?.filter(r => r.property_id === p.id) || [];
            const pTenants = activeTenancies.filter((t: any) => t.property_id === p.id);
            const updatedRooms = pRooms.map(r => {
                const tenancy = pTenants.find((t: any) => t.room_id === r.id);
                return { 
                    ...r, status: tenancy ? 'occupied' : 'available', display_rent: tenancy ? tenancy.monthly_rent : r.base_rent
                };
            });
            const totalIncome = pTenants.reduce((sum, t) => sum + (Number(t.monthly_rent) || 0), 0);
            return { ...p, rooms: updatedRooms, active_tenants: pTenants, total_income: totalIncome };
        });

        const { data: binData } = await supabase.from('bin_schedules').select('*, properties(property_name)').in('property_id', propIds).gte('next_collection_date', new Date().toISOString()).order('next_collection_date', { ascending: true });
        setSchedules(binData || []);

        const { data: inspData } = await supabase.from('inspections').select('*').in('property_id', propIds).neq('inspection_status', 'scheduled').order('scheduled_date', { ascending: false });
        const rawReports = inspData || [];
        setReports(rawReports);
        
        // Resolve Inspectors (Simplified for brevity, same logic as before)
        const staffIds = rawReports.filter((r: any) => r.inspector_type === 'staff').map((r: any) => r.inspector_id);
        if (staffIds.length > 0) {
            const { data: s } = await supabase.from('staff_profiles').select('id, full_name').in('id', staffIds);
            const iMap: any = {};
            s?.forEach((x: any) => iMap[x.id] = x.full_name);
            setInspectorNames(iMap);
        }

        const { data: chargeData } = await supabase.from('extra_charges').select('amount, charge_status').in('property_id', propIds);
        const outstanding = chargeData?.filter(c => ['pending', 'overdue'].includes(c.charge_status)).reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
        const collected = chargeData?.filter(c => c.charge_status === 'paid').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
        setFinancials({ outstanding, collected });
      }
      setProperties(finalProperties);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- 2. CHAT WIDGET LOGIC ---

  // A. Load Thread List
  const loadThreadList = async () => {
    if (!user) return;
    setChatLoading(true);
    try {
        // 1. Get Threads
        const { data: threadData } = await supabase
            .from('message_threads')
            .select('*')
            .contains('participants', [user.id])
            .order('updated_at', { ascending: false });

        if (threadData && threadData.length > 0) {
            // 2. Process Threads (Find other user name)
            const processed = await Promise.all(threadData.map(async (t) => {
                const otherId = t.participants.find((id: string) => id !== user.id);
                // Try fetching Admin name
                let name = "Support";
                let role = "Admin";
                if (otherId) {
                    const { data: admin } = await supabase.from('admin_profiles').select('full_name').eq('user_id', otherId).single();
                    if (admin) name = admin.full_name;
                    else {
                        const { data: staff } = await supabase.from('staff_profiles').select('full_name').eq('user_id', otherId).single();
                        if (staff) { name = staff.full_name; role = "Staff"; }
                    }
                }
                return { ...t, other_user: { name, role, id: otherId } };
            }));
            
            setThreads(processed);
            setChatView('list');
        } else {
            // 3. No threads -> Go to Start Screen
            await prepareStartScreen();
        }
    } catch (e) {
        console.error(e);
    } finally {
        setChatLoading(false);
    }
  };

  // B. Prepare Start Screen (Fetch Admin)
  const prepareStartScreen = async () => {
    try {
        const { data: admins } = await supabase.from('admin_profiles').select('user_id, full_name').limit(1);
        if (admins && admins.length > 0) {
            setAdminContact({ id: admins[0].user_id, name: admins[0].full_name });
            setChatView('start');
        } else {
            // Fallback to Staff if no admin table
            const { data: staff } = await supabase.from('staff_profiles').select('user_id, full_name').limit(1);
            if (staff && staff.length > 0) {
                setAdminContact({ id: staff[0].user_id, name: staff[0].full_name });
                setChatView('start');
            }
        }
    } catch (e) { console.error(e); }
  };

  // C. Start New Chat
  const handleStartChat = async () => {
    if (!user || !adminContact) return;
    setChatLoading(true);
    try {
        const { data, error } = await supabase.from('message_threads').insert({
            participants: [user.id, adminContact.id],
            last_message_preview: "Chat started",
            updated_at: new Date().toISOString()
        }).select().single();

        if (error) throw error;
        if (data) openThread(data.id);
    } catch (e: any) {
        toast.error("Error starting chat");
        setChatLoading(false);
    }
  };

  // D. Open a Thread (Enter Chat View)
  const openThread = async (threadId: string) => {
    setActiveThreadId(threadId);
    setChatView('chat');
    setChatLoading(true);
    
    // Load Messages
    const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
    
    setMessages(msgs || []);
    setChatLoading(false);
    scrollToBottom();

    // Subscribe
    const channel = supabase.channel(`chat:${threadId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` }, (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
            scrollToBottom();
        })
        .subscribe();
        
    return () => supabase.removeChannel(channel);
  };

  // Initialize Widget
  useEffect(() => {
    if (isChatOpen) loadThreadList();
  }, [isChatOpen]);


  // --- CHAT ACTIONS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const clearAttachment = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !activeThreadId || !user) return;
    setUploading(true);

    let attachments = [];
    if (selectedFile) {
        const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filePath = `${activeThreadId}/${Date.now()}_${sanitizedName}`;
        try {
            await supabase.storage.from('chat-attachments').upload(filePath, selectedFile);
            const { data } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
            attachments.push({ name: selectedFile.name, type: selectedFile.type, url: data.publicUrl });
        } catch (e) { toast.error("Upload failed"); setUploading(false); return; }
    }

    await supabase.from('messages').insert({
        thread_id: activeThreadId,
        sender_id: user.id,
        content: newMessage,
        attachments: attachments.length > 0 ? attachments : null
    });
    
    // Update thread preview
    await supabase.from('message_threads').update({ 
        last_message_preview: newMessage || "Attachment sent",
        updated_at: new Date().toISOString()
    }).eq('id', activeThreadId);

    setNewMessage("");
    clearAttachment();
    setUploading(false);
    scrollToBottom();
  };

  const scrollToBottom = () => { setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100); };

  // --- HELPERS (UI) ---
  const getOccupancyColor = (rooms: any[]) => {
    if (!rooms) return "bg-gray-100";
    const total = rooms.length;
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    if (total === 0) return "bg-gray-100 text-gray-600";
    if (occupied === total) return "bg-green-100 text-green-700";
    if (occupied === 0) return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const navItems = [
    { id: "overview", label: "Dashboard", icon: Home },
    { id: "properties", label: "Properties", icon: Building },
    { id: "tenants", label: "Tenants", icon: Users },
    { id: "schedules", label: "Schedules", icon: Calendar },
    { id: "reports", label: "Service Reports", icon: ClipboardCheck },
    { id: "financials", label: "Financials", icon: DollarSign },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <>
      <SEO title="Landlord Portal" description="Property Management Overview" />
      <div className="min-h-screen bg-background flex">
        
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card min-h-screen sticky top-0 flex flex-col">
          <div className="p-6 border-b">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Domus Logo" className="h-10 w-10 rounded-lg" />
              <div><h2 className="font-bold text-lg">Domus</h2><p className="text-xs text-muted-foreground">Landlord Portal</p></div>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Button key={item.id} variant={currentTab === item.id ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3 h-11", currentTab === item.id && "bg-secondary font-medium")} onClick={() => setCurrentTab(item.id)}>
                <item.icon className="h-5 w-5" /> {item.label}
              </Button>
            ))}
          </nav>
          <div className="p-4 border-t space-y-1">
            <Button variant="ghost" className="w-full justify-start gap-3" onClick={logout}><LogOut className="h-5 w-5" /> Sign Out</Button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative">
          <header className="h-16 border-b bg-card px-8 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-semibold capitalize">{navItems.find(n => n.id === currentTab)?.label}</h1>
              <p className="text-sm text-muted-foreground">Portfolio Overview</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setIsChatOpen(true)}>
                <MessageSquare className="h-4 w-4 mr-2" /> Message Admin
              </Button>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-auto bg-muted/30 pb-24">
            {/* === TAB: OVERVIEW === */}
            {currentTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card><CardContent className="p-6 flex items-center gap-4"><div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Building className="h-6 w-6"/></div><div><p className="text-sm text-muted-foreground">Properties</p><p className="text-2xl font-bold">{properties.length}</p></div></CardContent></Card>
                  <Card><CardContent className="p-6 flex items-center gap-4"><div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600"><Users className="h-6 w-6"/></div><div><p className="text-sm text-muted-foreground">Active Tenants</p><p className="text-2xl font-bold">{tenancies.length}</p></div></CardContent></Card>
                  <Card><CardContent className="p-6 flex items-center gap-4"><div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600"><AlertCircle className="h-6 w-6"/></div><div><p className="text-sm text-muted-foreground">Outstanding</p><p className="text-2xl font-bold text-orange-600">£{financials.outstanding}</p></div></CardContent></Card>
                </div>
                {/* Reports Snippet */}
                <Card>
                    <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {reports.length === 0 ? <p className="text-sm text-muted-foreground">No recent activity.</p> : 
                            reports.slice(0, 3).map(r => {
                                const prop = properties.find(p => p.id === r.property_id);
                                return (
                                    <div key={r.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                                        <div>
                                            <p className="font-medium">{prop?.property_name || 'Property'}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{r.inspection_type?.replace('_', ' ')}</p>
                                        </div>
                                        <Badge variant={r.inspection_status === 'passed' ? 'default' : 'destructive'} className="capitalize">{r.inspection_status?.replace('_', ' ')}</Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
              </div>
            )}

            {/* === TAB: PROPERTIES === */}
            {currentTab === "properties" && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">My Properties</h2>
                    <div className="grid gap-6">
                        {properties.map((property) => {
                            const rooms = property.rooms || [];
                            const occupiedCount = rooms.filter((r: any) => r.status === 'occupied').length;
                            const isExpanded = expandedPropId === property.id;
                            return (
                                <Card key={property.id} className="transition-all hover:shadow-md">
                                    <CardHeader className="cursor-pointer" onClick={() => setExpandedPropId(isExpanded ? null : property.id)}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center"><Building className="h-6 w-6 text-primary" /></div>
                                                <div><CardTitle>{property.property_name}</CardTitle><div className="text-sm text-muted-foreground mt-1">{property.address_line1}, {property.city}</div></div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right hidden md:block"><div className="flex items-center gap-1 text-green-700 font-medium"><TrendingUp className="h-4 w-4" /> <span>£{property.total_income}/mo</span></div><p className="text-xs text-muted-foreground text-right">Income</p></div>
                                                <div className="text-right"><Badge variant="outline" className={getOccupancyColor(rooms)}>{occupiedCount} / {rooms.length} Units</Badge></div>
                                                {isExpanded ? <ChevronUp className="h-5 w-5"/> : <ChevronDown className="h-5 w-5"/>}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    {isExpanded && (
                                        <CardContent className="border-t bg-muted/20 pt-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {rooms.sort((a: any,b: any) => a.room_number.localeCompare(b.room_number)).map((room: any) => (
                                                    <div key={room.id} className="bg-background border rounded-lg p-3 flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center"><Bed className="h-4 w-4" /></div>
                                                            <div><p className="font-semibold text-sm">Room {room.room_number}</p><p className="text-xs text-muted-foreground">£{room.display_rent}/mo</p></div>
                                                        </div>
                                                        <Badge variant={room.status === 'occupied' ? 'default' : 'secondary'}>{room.status}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* === TAB: TENANTS === */}
            {currentTab === "tenants" && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Active Tenants</h2>
                    <Card>
                        <CardContent className="p-0">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <thead className="border-b bg-muted/50">
                                        <tr><th className="h-12 px-4">Property / Room</th><th className="h-12 px-4">Start Date</th><th className="h-12 px-4">End Date</th><th className="h-12 px-4">Monthly Rent</th></tr>
                                    </thead>
                                    <tbody>
                                        {tenancies.map((t) => {
                                            const prop = properties.find(p => p.id === t.property_id);
                                            const room = prop?.rooms?.find((r: any) => r.id === t.room_id);
                                            return (
                                                <tr key={t.id} className="border-b hover:bg-muted/50">
                                                    <td className="p-4">{prop?.property_name || 'Unknown'} {room && <Badge variant="outline" className="ml-2 text-xs">Room {room.room_number}</Badge>}</td>
                                                    <td className="p-4 text-sm">{format(parseISO(t.start_date), 'dd MMM yyyy')}</td>
                                                    <td className="p-4 text-sm">{t.end_date ? format(parseISO(t.end_date), 'dd MMM yyyy') : 'Ongoing'}</td>
                                                    <td className="p-4 font-medium">£{t.final_rent}</td>
                                                </tr>
                                            )
                                        })}
                                        {tenancies.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No active tenants.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* === TAB: SCHEDULES === */}
            {currentTab === "schedules" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Schedules</h2>
                <Card>
                  <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm text-left">
                        <thead className="border-b"><tr><th className="h-12 px-4">Property</th><th className="h-12 px-4">Type</th><th className="h-12 px-4">Date</th></tr></thead>
                        <tbody>
                          {schedules.map((s, i) => (
                            <tr key={i} className="border-b hover:bg-muted/50">
                              <td className="p-4">{s.properties?.property_name}</td>
                              <td className="p-4 capitalize">{s.bin_type || "General"}</td>
                              <td className="p-4">{format(parseISO(s.next_collection_date), 'EEE, d MMM')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* === TAB: REPORTS === */}
            {currentTab === "reports" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Service Reports</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="flex gap-2"><ClipboardCheck className="h-5 w-5"/> Inspections</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reports.length === 0 ? <p className="text-sm text-muted-foreground">No inspections found.</p> :
                        reports.map((r) => {
                            const prop = properties.find(p => p.id === r.property_id);
                            return (
                                <div key={r.id} className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedReport(r); setIsReportOpen(true); }}>
                                    <div className="flex justify-between">
                                        <p className="font-medium">{prop?.property_name || "Property"}</p>
                                        <Badge variant={r.inspection_status === 'passed' ? 'default' : 'destructive'} className="capitalize">{r.inspection_status?.replace('_', ' ')}</Badge>
                                    </div>
                                    <div className="flex justify-between items-end mt-1">
                                        <p className="text-sm text-muted-foreground capitalize">{r.inspection_type?.replace('_', ' ')}</p>
                                        <p className="text-xs text-muted-foreground">{format(parseISO(r.scheduled_date), 'PP')}</p>
                                    </div>
                                </div>
                            )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* === TAB: FINANCIALS === */}
            {currentTab === "financials" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Financial Overview</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card><CardHeader><CardTitle>Extra Charges</CardTitle><CardDescription>Summary across portfolio</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-100"><div><p className="text-sm font-medium text-orange-800">Outstanding</p></div><p className="text-2xl font-bold text-orange-700">£{financials.outstanding.toFixed(2)}</p></div>
                      <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-100"><div><p className="text-sm font-medium text-green-800">Collected</p></div><p className="text-2xl font-bold text-green-700">£{financials.collected.toFixed(2)}</p></div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* === SMART CHAT WIDGET (Multi-View) === */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {isChatOpen && (
            <Card className="w-[360px] h-[520px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 duration-300 border-primary/20">
                <CardHeader className="bg-primary text-primary-foreground py-3 rounded-t-xl flex flex-row items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        {chatView === 'chat' && <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => setChatView('list')}><ChevronLeft className="h-4 w-4"/></Button>}
                        <div>
                            <CardTitle className="text-base">{chatView === 'chat' ? 'Chat' : 'Messages'}</CardTitle>
                            <CardDescription className="text-primary-foreground/80 text-xs">{chatView === 'chat' ? 'Direct line to admin' : 'Your conversations'}</CardDescription>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={() => setIsChatOpen(false)}><X className="h-4 w-4" /></Button>
                </CardHeader>
                
                <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-background">
                    {chatLoading ? <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div> : (
                        <>
                            {/* --- VIEW 1: THREAD LIST --- */}
                            {chatView === 'list' && (
                                <ScrollArea className="flex-1 p-2">
                                    <div className="space-y-1">
                                        {threads.map(t => (
                                            <div key={t.id} onClick={() => openThread(t.id)} className="p-3 hover:bg-muted rounded-lg cursor-pointer flex justify-between items-start border-b last:border-0">
                                                <div>
                                                    <p className="font-medium text-sm">{t.other_user?.name || "Support"}</p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{t.last_message_preview}</p>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(parseISO(t.updated_at), { addSuffix: false })}</span>
                                            </div>
                                        ))}
                                        {threads.length === 0 && (
                                            <div className="text-center py-10">
                                                <p className="text-muted-foreground text-sm mb-4">No conversations yet.</p>
                                                <Button onClick={prepareStartScreen} variant="outline" size="sm">Refresh</Button>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            )}

                            {/* --- VIEW 2: START SCREEN --- */}
                            {chatView === 'start' && (
                                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"><UserCircle className="h-8 w-8 text-primary" /></div>
                                    <h3 className="font-semibold text-lg mb-1">Contact Support</h3>
                                    {adminContact ? (
                                        <>
                                            <p className="text-sm text-muted-foreground mb-6">Chat with <strong>{adminContact.name}</strong></p>
                                            <Button onClick={handleStartChat} className="w-full"><MessageSquare className="w-4 h-4 mr-2" /> Start Chat</Button>
                                        </>
                                    ) : <p className="text-sm text-destructive">No Admin contacts found.</p>}
                                </div>
                            )}

                            {/* --- VIEW 3: ACTIVE CHAT --- */}
                            {chatView === 'chat' && (
                                <>
                                    <ScrollArea className="flex-1 p-4">
                                        <div className="space-y-4">
                                            {messages.map(msg => {
                                                const isMe = msg.sender_id === user?.id;
                                                return (
                                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={cn("max-w-[80%] rounded-lg p-2 text-sm", isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none")}>
                                                            {msg.attachments && msg.attachments.length > 0 && (
                                                                <div className="mb-2 space-y-2">
                                                                    {msg.attachments.map((att: any, idx: number) => (
                                                                        <div key={idx}>
                                                                            {att.type.startsWith('image') ? <img src={att.url} className="rounded-md max-h-32 object-cover border" /> : <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/10 p-2 rounded hover:bg-black/20 text-xs text-white/90 underline"><File className="h-4 w-4" /> {att.name}</a>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {msg.content}
                                                            <p className={cn("text-[10px] mt-1 text-right", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>{format(parseISO(msg.created_at), 'HH:mm')}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </ScrollArea>
                                    <div className="p-3 border-t bg-background">
                                        {selectedFile && (
                                            <div className="flex items-center gap-3 mb-2 p-2 bg-muted/30 rounded border w-fit">
                                                {selectedFile.type.startsWith('image') ? <img src={URL.createObjectURL(selectedFile)} className="h-8 w-8 object-cover rounded" /> : <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center"><File className="h-4 w-4 text-gray-500" /></div>}
                                                <div className="text-xs"><p className="font-medium max-w-[100px] truncate">{selectedFile.name}</p></div>
                                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={clearAttachment}><X className="h-3 w-3" /></Button>
                                            </div>
                                        )}
                                        <div className="flex gap-2 items-center">
                                            <div className="flex gap-1">
                                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-4 w-4 text-muted-foreground" /></Button>
                                            </div>
                                            <Input placeholder="Type message..." className="h-9 text-sm" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                                            <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSendMessage} disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}</Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        )}
        {!isChatOpen && (
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform" onClick={() => setIsChatOpen(true)}>
                <MessageSquare className="h-6 w-6" />
            </Button>
        )}
      </div>

      {/* Report Viewer Dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Inspection Details</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Status</span>
                <Badge variant={selectedReport?.inspection_status === 'passed' ? 'default' : 'destructive'} className="capitalize">{selectedReport?.inspection_status?.replace('_', ' ')}</Badge>
            </div>
            {/* ... Report Content ... */}
          </div>
          <DialogFooter><Button onClick={() => setIsReportOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LandlordPortal;