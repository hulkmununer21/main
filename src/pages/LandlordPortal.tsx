import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Home, Calendar, ClipboardCheck, DollarSign, Activity, MessageSquare, LogOut, Building, Wrench, Download, Eye, Check, X, AlertCircle, Camera, ImageIcon, UserCheck, Settings, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/useAuth";
import { toast } from "@/hooks/use-toast";
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
  const [schedules, setSchedules] = useState<any[]>([]);
  const [reports, setReports] = useState<{inspections: any[], cleanings: any[]}>({ inspections: [], cleanings: [] });
  const [financials, setFinancials] = useState<{outstanding: number, collected: number}>({ outstanding: 0, collected: 0 });
  const [serviceLogs, setServiceLogs] = useState<any[]>([]);

  // --- DIALOG STATES ---
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isReportOpen, setIsReportOpen] = useState(false); // Reused for both cleaning & inspection viewing

  // --- 1. DATA FETCHING ---
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // A. Fetch Properties (The Core Link)
      // Assuming RLS filters this to only the Landlord's properties
      const { data: props, error: propError } = await supabase.from('properties').select('*');
      if (propError) throw propError;
      setProperties(props || []);

      const propIds = props?.map(p => p.id) || [];

      if (propIds.length > 0) {
        // B. Fetch Schedules (Bin & Inspection Future Dates)
        const { data: binData } = await supabase
          .from('bin_schedules')
          .select('*, properties(property_name)')
          .in('property_id', propIds)
          .gte('next_collection_date', new Date().toISOString())
          .order('next_collection_date', { ascending: true });
        
        // C. Fetch Reports (Completed Inspections & Cleanings)
        const { data: inspData } = await supabase
          .from('inspection_reports')
          .select('*, properties(property_name)')
          .in('property_id', propIds)
          .order('inspection_date', { ascending: false });

        const { data: cleanData } = await supabase
          .from('cleaning_logs')
          .select('*, properties(property_name)')
          .in('property_id', propIds)
          .order('cleaned_at', { ascending: false });

        // D. Fetch Financials (Aggregated Extra Charges - No Tenant Details)
        const { data: chargeData } = await supabase
          .from('extra_charges')
          .select('amount, charge_status')
          .in('property_id', propIds);

        // E. Service User Activity
        const { data: logData } = await supabase
          .from('service_user_logs') // Assuming table name
          .select('*, properties(property_name)')
          .in('property_id', propIds)
          .order('created_at', { ascending: false })
          .limit(20);

        setSchedules(binData || []);
        setReports({ inspections: inspData || [], cleanings: cleanData || [] });
        setServiceLogs(logData || []);

        // Calculate Financial Aggregates
        const outstanding = chargeData?.filter(c => ['pending', 'overdue'].includes(c.charge_status)).reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
        const collected = chargeData?.filter(c => c.charge_status === 'paid').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
        setFinancials({ outstanding, collected });
      }

    } catch (error) {
      console.error("Error loading landlord data:", error);
      toast({ title: "Error", description: "Could not load property data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HANDLERS ---

  const handleSendMessage = async () => {
    if (!messageBody) return;
    try {
      // Feature 4: Message Admin Only
      await supabase.from('notifications').insert({
        recipient_id: 'admin_uuid_placeholder', // You would typically fetch the admin ID or have a dedicated 'admin_messages' table
        subject: `Landlord Message from ${user?.name}`,
        message_body: messageBody,
        notification_type: 'support',
        is_read: false
      });
      toast({ title: "Sent", description: "Message sent to Administration." });
      setIsMessageOpen(false);
      setMessageBody("");
    } catch (e) {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
    }
  };

  const navItems = [
    { id: "overview", label: "Dashboard", icon: Home },
    { id: "schedules", label: "Schedules", icon: Calendar },
    { id: "reports", label: "Service Reports", icon: ClipboardCheck },
    { id: "financials", label: "Financials", icon: DollarSign },
    { id: "activity", label: "Activity Log", icon: Activity },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Portal...</div>;

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
            
            {/* === TAB 1: OVERVIEW === */}
            {currentTab === "overview" && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Building className="h-6 w-6"/></div>
                      <div><p className="text-sm text-muted-foreground">Properties</p><p className="text-2xl font-bold">{properties.length}</p></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600"><ClipboardCheck className="h-6 w-6"/></div>
                      <div><p className="text-sm text-muted-foreground">Reports This Month</p><p className="text-2xl font-bold">{reports.inspections.length + reports.cleanings.length}</p></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600"><AlertCircle className="h-6 w-6"/></div>
                      <div><p className="text-sm text-muted-foreground">Outstanding Charges</p><p className="text-2xl font-bold text-orange-600">£{financials.outstanding}</p></div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Feature 1: Upcoming Schedules Snippet */}
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Upcoming Schedules</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {schedules.slice(0, 3).map((s, i) => (
                          <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                            <div>
                              <p className="font-medium">{s.properties?.property_name}</p>
                              <p className="text-sm text-muted-foreground">{s.bin_type} Collection</p>
                            </div>
                            <Badge variant="outline">{format(parseISO(s.next_collection_date), 'MMM d')}</Badge>
                          </div>
                        ))}
                        {schedules.length === 0 && <p className="text-sm text-muted-foreground">No upcoming schedules.</p>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Feature 5: Recent Activity Snippet */}
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Recent Service Activity</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {serviceLogs.slice(0, 3).map((log, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="mt-1"><Activity className="h-4 w-4 text-blue-500"/></div>
                            <div>
                              <p className="text-sm font-medium">{log.task_name} <span className="text-muted-foreground">at {log.properties?.property_name}</span></p>
                              <p className="text-xs text-muted-foreground">{format(parseISO(log.created_at), 'PP p')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* === TAB 2: SCHEDULES (Feature 1) === */}
            {currentTab === "schedules" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Bin & Inspection Schedules</h2>
                <Card>
                  <CardHeader><CardTitle>Upcoming Dates</CardTitle></CardHeader>
                  <CardContent>
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm text-left">
                        <thead className="border-b">
                          <tr>
                            <th className="h-12 px-4 font-medium">Property</th>
                            <th className="h-12 px-4 font-medium">Type</th>
                            <th className="h-12 px-4 font-medium">Date</th>
                            <th className="h-12 px-4 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedules.map((s, i) => (
                            <tr key={i} className="border-b hover:bg-muted/50">
                              <td className="p-4">{s.properties?.property_name}</td>
                              <td className="p-4 capitalize">{s.bin_type || "General"}</td>
                              <td className="p-4">{format(parseISO(s.next_collection_date), 'EEEE, d MMMM yyyy')}</td>
                              <td className="p-4"><Badge variant="secondary">Scheduled</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* === TAB 3: REPORTS (Feature 2) === */}
            {currentTab === "reports" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Service Reports</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Inspection Reports */}
                  <Card>
                    <CardHeader><CardTitle className="flex gap-2"><ClipboardCheck className="h-5 w-5"/> Inspections</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reports.inspections.map((r) => (
                          <div key={r.id} className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedReport(r); setIsReportOpen(true); }}>
                            <div className="flex justify-between">
                              <p className="font-medium">{r.properties?.property_name}</p>
                              <Badge variant={r.status === 'Passed' ? 'default' : 'destructive'}>{r.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Inspector: {r.inspector_name}</p>
                            <p className="text-xs text-muted-foreground">{format(parseISO(r.inspection_date), 'PP')}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cleaning Logs */}
                  <Card>
                    <CardHeader><CardTitle className="flex gap-2"><Wrench className="h-5 w-5"/> Cleaning Logs</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reports.cleanings.map((c) => (
                          <div key={c.id} className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedReport(c); setIsReportOpen(true); }}>
                            <div className="flex justify-between">
                              <p className="font-medium">{c.properties?.property_name}</p>
                              <Badge variant="outline">Cleaning</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{c.notes ? "Notes available" : "Routine Clean"}</p>
                            <p className="text-xs text-muted-foreground">{format(parseISO(c.cleaned_at), 'PP')}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* === TAB 4: FINANCIALS (Feature 3 - Aggregated) === */}
            {currentTab === "financials" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Financial Overview</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle>Extra Charges Summary</CardTitle><CardDescription>Aggregated view across all properties</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                        <div>
                          <p className="text-sm font-medium text-orange-800">Total Outstanding</p>
                          <p className="text-xs text-orange-600">Pending & Overdue Charges</p>
                        </div>
                        <p className="text-2xl font-bold text-orange-700">£{financials.outstanding.toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-100">
                        <div>
                          <p className="text-sm font-medium text-green-800">Total Collected</p>
                          <p className="text-xs text-green-600">Paid Extra Charges</p>
                        </div>
                        <p className="text-2xl font-bold text-green-700">£{financials.collected.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Note</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        This summary represents extra charges (damage, cleaning, etc.) levied across your portfolio. 
                        Tenant names are anonymized for this high-level view. For detailed breakdowns, please contact administration.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* === TAB 5: ACTIVITY (Feature 5) === */}
            {currentTab === "activity" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Service User Activity</h2>
                <Card>
                  <CardHeader><CardTitle>Task Log</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {serviceLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Activity className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{log.task_name}</p>
                            <p className="text-sm text-gray-600">Property: {log.properties?.property_name}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{log.status || 'Completed'}</Badge>
                              <span className="text-xs text-muted-foreground flex items-center">{format(parseISO(log.created_at), 'PP p')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
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
          <DialogHeader>
            <DialogTitle>Contact Administration</DialogTitle>
            <DialogDescription>Send a secure message to the property management team.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Message</Label>
            <Textarea 
              value={messageBody} 
              onChange={(e) => setMessageBody(e.target.value)} 
              placeholder="Type your message here..." 
              className="mt-2 h-32"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
            <Button onClick={handleSendMessage}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Viewer Dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              {selectedReport?.properties?.property_name} - {selectedReport?.inspection_date ? "Inspection" : "Cleaning"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Conditional Rendering based on Report Type */}
            {selectedReport?.inspection_date ? (
              <>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Status</span>
                  <Badge variant={selectedReport.status === 'Passed' ? 'default' : 'destructive'}>{selectedReport.status}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Inspector Notes</h4>
                  <p className="text-sm text-muted-foreground bg-slate-50 p-3 rounded border">{selectedReport.overall_notes || "No notes provided."}</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Type</span>
                  <Badge>Cleaning</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Cleaner Notes</h4>
                  <p className="text-sm text-muted-foreground bg-slate-50 p-3 rounded border">{selectedReport?.notes || "Routine clean completed."}</p>
                </div>
              </>
            )}

            {/* Photos Section (Generic for both) */}
            {selectedReport?.photos && Array.isArray(selectedReport.photos) && selectedReport.photos.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Attached Photos</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedReport.photos.map((url: string, index: number) => (
                    <div key={index} className="aspect-video bg-gray-100 rounded overflow-hidden border">
                      <img src={url} alt="Report attachment" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsReportOpen(false)}>Close Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
};

export default LandlordPortal;