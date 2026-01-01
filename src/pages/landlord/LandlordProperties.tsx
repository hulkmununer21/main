import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Home, Calendar, ClipboardCheck, DollarSign, MessageSquare, LogOut, 
  Building, Users, Bed, ChevronDown, ChevronUp, AlertCircle, CheckCircle, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/useAuth";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

const LandlordPortal = () => {
  const { logout, user } = useAuth();
  const [currentTab, setCurrentTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // --- DATA STATE ---
  const [properties, setProperties] = useState<any[]>([]);
  const [tenancies, setTenancies] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]); // Only Inspections for now
  const [financials, setFinancials] = useState<{outstanding: number, collected: number}>({ outstanding: 0, collected: 0 });
  
  // Cache for lookup names
  const [inspectorNames, setInspectorNames] = useState<Record<string, string>>({});
  const [lodgerNames, setLodgerNames] = useState<Record<string, any>>({});

  // --- UI STATES ---
  const [expandedPropId, setExpandedPropId] = useState<string | null>(null);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // --- 1. DATA FETCHING ---
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // A. Fetch Properties (With Rooms)
      // Note: If 'rooms(*)' fails with 400, remove it and fetch rooms separately.
      // Assuming FK properties.id -> rooms.property_id exists.
      const { data: props, error: propError } = await supabase
        .from('properties')
        .select(`*, rooms(*)`);
      
      if (propError) throw propError;
      setProperties(props || []);

      const propIds = props?.map(p => p.id) || [];

      if (propIds.length > 0) {
        // B. Fetch Tenancies (RAW - No Joins to avoid 400)
        const { data: tenData } = await supabase
          .from('tenancies')
          .select('*')
          .in('property_id', propIds)
          .eq('tenancy_status', 'active');
        
        const rawTenancies = tenData || [];

        // Manual Join for Lodgers (Safer)
        const lodgerIds = rawTenancies.map((t: any) => t.lodger_id).filter(Boolean);
        const { data: lodgers } = await supabase.from('lodger_profiles').select('id, full_name, email, phone_number').in('id', lodgerIds);
        
        const lodgerMap: Record<string, any> = {};
        lodgers?.forEach((l: any) => lodgerMap[l.id] = l);
        setLodgerNames(lodgerMap);
        setTenancies(rawTenancies);

        // C. Fetch Schedules (Bin)
        const { data: binData } = await supabase
          .from('bin_schedules')
          .select('*, properties(property_name)')
          .in('property_id', propIds)
          .gte('next_collection_date', new Date().toISOString())
          .order('next_collection_date', { ascending: true });
        
        setSchedules(binData || []);

        // D. Fetch Inspections (RAW - No Joins to avoid 400)
        const { data: inspData } = await supabase
          .from('inspections')
          .select('*') // Getting raw IDs
          .in('property_id', propIds)
          .neq('inspection_status', 'scheduled') 
          .order('scheduled_date', { ascending: false });
        
        const rawReports = inspData || [];
        setReports(rawReports);

        // Manual Join for Inspectors
        const staffIds = rawReports.filter((r: any) => r.inspector_type === 'staff').map((r: any) => r.inspector_id);
        const serviceIds = rawReports.filter((r: any) => r.inspector_type === 'service_user').map((r: any) => r.inspector_id);
        
        const iNames: Record<string, string> = {};
        
        if (staffIds.length > 0) {
            const { data: s } = await supabase.from('staff_profiles').select('id, full_name').in('id', staffIds);
            s?.forEach((x: any) => iNames[x.id] = x.full_name);
        }
        if (serviceIds.length > 0) {
            const { data: s } = await supabase.from('service_user_profiles').select('id, full_name').in('id', serviceIds);
            s?.forEach((x: any) => iNames[x.id] = x.full_name);
        }
        setInspectorNames(iNames);

        // E. Financials
        const { data: chargeData } = await supabase
          .from('extra_charges')
          .select('amount, charge_status')
          .in('property_id', propIds);

        const outstanding = chargeData?.filter(c => ['pending', 'overdue'].includes(c.charge_status)).reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
        const collected = chargeData?.filter(c => c.charge_status === 'paid').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
        setFinancials({ outstanding, collected });
      }

    } catch (error) {
      console.error("Error loading landlord data:", error);
      toast.error("Could not load full dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HELPERS ---
  const handleSendMessage = async () => {
    if (!messageBody) return;
    try {
      await supabase.from('notifications').insert({
        recipient_id: user?.id, // Temporary: sending to self for test
        subject: `Landlord Message from ${user?.email}`,
        message_body: messageBody,
        notification_type: 'support',
      });
      toast.success("Message sent.");
      setIsMessageOpen(false);
      setMessageBody("");
    } catch (e) {
      toast.error("Failed to send.");
    }
  };

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
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card px-8 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-semibold capitalize">{navItems.find(n => n.id === currentTab)?.label}</h1>
              <p className="text-sm text-muted-foreground">Portfolio Overview</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setIsMessageOpen(true)}>
                <MessageSquare className="h-4 w-4 mr-2" /> Message Admin
              </Button>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-auto bg-muted/30">
            
            {/* === TAB: OVERVIEW === */}
            {currentTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Building className="h-6 w-6"/></div>
                      <div><p className="text-sm text-muted-foreground">Properties</p><p className="text-2xl font-bold">{properties.length}</p></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600"><Users className="h-6 w-6"/></div>
                      <div><p className="text-sm text-muted-foreground">Active Tenants</p><p className="text-2xl font-bold">{tenancies.length}</p></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600"><AlertCircle className="h-6 w-6"/></div>
                      <div><p className="text-sm text-muted-foreground">Outstanding Charges</p><p className="text-2xl font-bold text-orange-600">£{financials.outstanding}</p></div>
                    </CardContent>
                  </Card>
                </div>
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
                                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Building className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle>{property.property_name}</CardTitle>
                                                    <div className="text-sm text-muted-foreground mt-1">{property.address_line1}, {property.city}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant="outline" className={getOccupancyColor(rooms)}>{occupiedCount} / {rooms.length} Units</Badge>
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
                                                            <div><p className="font-semibold text-sm">Room {room.room_number}</p><p className="text-xs text-muted-foreground">£{room.base_rent}/mo</p></div>
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
                                        <tr>
                                            <th className="h-12 px-4 font-medium">Name</th>
                                            <th className="h-12 px-4 font-medium">Property</th>
                                            <th className="h-12 px-4 font-medium">Contact</th>
                                            <th className="h-12 px-4 font-medium">Rent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tenancies.map((t) => {
                                            const prop = properties.find(p => p.id === t.property_id);
                                            const room = prop?.rooms?.find((r: any) => r.id === t.room_id);
                                            const profile = lodgerNames[t.lodger_id] || {};
                                            return (
                                                <tr key={t.id} className="border-b hover:bg-muted/50">
                                                    <td className="p-4 font-medium">{profile.full_name || 'Unknown'}</td>
                                                    <td className="p-4">
                                                        {prop?.property_name} <Badge variant="outline" className="ml-1 text-xs">Room {room?.room_number}</Badge>
                                                    </td>
                                                    <td className="p-4 text-sm text-muted-foreground">{profile.email}<br/>{profile.phone_number}</td>
                                                    <td className="p-4">£{t.rent_amount}</td>
                                                </tr>
                                            )
                                        })}
                                        {tenancies.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No active tenants found.</td></tr>}
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
                <h2 className="text-2xl font-bold">Inspection History</h2>
                <Card>
                    <CardHeader><CardTitle className="flex gap-2"><ClipboardCheck className="h-5 w-5"/> Recent Inspections</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reports.length === 0 ? <p className="text-sm text-muted-foreground">No reports found.</p> :
                        reports.map((r) => {
                            const prop = properties.find(p => p.id === r.property_id);
                            const room = prop?.rooms?.find((rm: any) => rm.id === r.room_id);
                            return (
                                <div key={r.id} className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedReport(r); setIsReportOpen(true); }}>
                                    <div className="flex justify-between">
                                        <p className="font-medium">{prop?.property_name || "Property"}</p>
                                        <Badge variant={r.inspection_status === 'passed' ? 'default' : 'destructive'} className="capitalize">
                                            {r.inspection_status?.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-end mt-1">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{inspectorNames[r.inspector_id] || "Unknown Inspector"}</p>
                                            {r.room_id ? <Badge variant="outline" className="text-[10px] mt-1">Room {room?.room_number}</Badge> : <Badge variant="outline" className="text-[10px] mt-1">Property Wide</Badge>}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{format(parseISO(r.scheduled_date), 'PP')}</p>
                                    </div>
                                </div>
                            )
                        })}
                      </div>
                    </CardContent>
                </Card>
              </div>
            )}

            {/* === TAB: FINANCIALS === */}
            {currentTab === "financials" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Financial Overview</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle>Extra Charges</CardTitle><CardDescription>Summary across portfolio</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                        <div><p className="text-sm font-medium text-orange-800">Outstanding</p></div>
                        <p className="text-2xl font-bold text-orange-700">£{financials.outstanding.toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-100">
                        <div><p className="text-sm font-medium text-green-800">Collected</p></div>
                        <p className="text-2xl font-bold text-green-700">£{financials.collected.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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

          </main>
        </div>
      </div>

      {/* Message Admin Dialog */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Contact Admin</DialogTitle></DialogHeader>
          <div className="py-4"><Label>Message</Label><Textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} className="mt-2 h-32"/></div>
          <DialogFooter><Button onClick={handleSendMessage}>Send</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Viewer Dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Inspection Details</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Status</span>
                <Badge variant={selectedReport?.inspection_status === 'passed' ? 'default' : 'destructive'} className="capitalize">{selectedReport?.inspection_status?.replace('_', ' ')}</Badge>
            </div>
            {selectedReport?.issues_found && selectedReport.issues_found.length > 0 && (
                <div className="bg-red-50 p-3 rounded border border-red-100">
                    <h4 className="font-semibold text-red-800 mb-2">Issues Found</h4>
                    <ul className="list-disc list-inside text-sm text-red-700">{selectedReport.issues_found.map((issue: string, i: number) => <li key={i}>{issue}</li>)}</ul>
                </div>
            )}
            <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground bg-slate-50 p-3 rounded border">{selectedReport?.overall_notes || "No notes."}</p>
            </div>
            {selectedReport?.photos && selectedReport.photos.length > 0 && (
                <div>
                    <h4 className="font-medium mb-2">Photos</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {selectedReport.photos.map((url: string, index: number) => (
                            <div key={index} className="aspect-video bg-gray-100 rounded overflow-hidden border"><img src={url} className="w-full h-full object-cover" /></div>
                        ))}
                    </div>
                </div>
            )}
          </div>
          <DialogFooter><Button onClick={() => setIsReportOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LandlordPortal;