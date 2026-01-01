import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, CreditCard, FileText, MessageSquare, User, LogOut, Wrench, Loader2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { format, parseISO, startOfWeek, differenceInDays, startOfDay } from "date-fns";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";

// === SUB-COMPONENTS ===
import LodgerOverview from "./lodger/LodgerOverview";
import LodgerInspections from "./lodger/LodgerInspections"; 
import LodgerMessages from "./lodger/LodgerMessages"; 
import LodgerDocuments from "./lodger/LodgerDocuments"; // ✅ IMPORTED

// --- INTERFACES ---
interface ExtraCharge { id: string; reason: string; amount: number; due_date: string; created_at: string; charge_status: string; description?: string; }
interface MaintenanceRequest { id: string; title: string; description: string; status: string; priority: string; created_at: string; }
interface PaymentHistory { id: string; payment_date: string; amount: number; payment_method: string; status: string; payment_reference: string; }

interface AppNotification { 
  id: string; 
  recipient_id: string; 
  subject: string; 
  message_body: string; 
  is_read: boolean; 
  created_at: string; 
  read_at?: string;
  notification_type?: string;
}

const LodgerPortal = () => {
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("overview");

  // --- DATA STATE ---
  const [lodgerProfile, setLodgerProfile] = useState<any>(null);
  const [tenancy, setTenancy] = useState<any>(null);
  
  // Lists
  const [charges, setCharges] = useState<ExtraCharge[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRequest[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Logic State
  const [isOnBinDuty, setIsOnBinDuty] = useState(false);
  const [binDutyCompleted, setBinDutyCompleted] = useState(false);
  const [nextRotationDate, setNextRotationDate] = useState<string | null>(null);
  const [councilBin, setCouncilBin] = useState<any>(null);
  
  // Rent Date Logic
  const [nextPaymentDate, setNextPaymentDate] = useState<string>("N/A");
  const [daysUntilRent, setDaysUntilRent] = useState<number>(0);
  const [isRentOverdue, setIsRentOverdue] = useState<boolean>(false);

  // UI State
  const [paymentAmount, setPaymentAmount] = useState("750");
  const [maintenanceIssue, setMaintenanceIssue] = useState("");
  const [maintenanceCategory, setMaintenanceCategory] = useState("");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      if (!user?.id) return;
      
      try {
        const { data: profile } = await supabase.from('lodger_profiles').select('*').eq('user_id', user.id).single();
        if (!profile) throw new Error("Lodger Profile not found.");
        
        if (isMounted) setLodgerProfile(profile);

        const { data: tenancies } = await supabase.from('tenancies').select('*').eq('lodger_id', profile.id);
        const rawTenancies = tenancies || [];
        const activeTenancy = rawTenancies.find((t: any) => t.tenancy_status === 'active') || 
                              rawTenancies.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        if (activeTenancy && isMounted) {
          const [propRes, roomRes, rotationRes, councilRes, chargesRes, maintRes, payRes, notifRes] = await Promise.all([
            supabase.from('properties').select('*').eq('id', activeTenancy.property_id).single(),
            supabase.from('rooms').select('*').eq('id', activeTenancy.room_id).single(),
            supabase.from('in_house_rotation_state').select('*').eq('property_id', activeTenancy.property_id).single(),
            supabase.from('bin_schedules').select('*').eq('property_id', activeTenancy.property_id),
            supabase.from('extra_charges').select('*').eq('lodger_id', profile.id).order('created_at', { ascending: false }),
            supabase.from('maintenance_requests').select('*').eq('lodger_id', profile.id).order('created_at', { ascending: false }),
            supabase.from('payments').select('*').eq('lodger_id', profile.id).order('payment_date', { ascending: false }),
            supabase.from('notifications')
                .select('*')
                .eq('recipient_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)
          ]);

          setTenancy({
            ...activeTenancy,
            properties: propRes.data || { property_name: "Unknown" },
            rooms: roomRes.data || { room_number: "Unknown" }
          });
          
          const rent = activeTenancy.monthly_rent || activeTenancy.rent_amount || "0";
          setPaymentAmount(rent.toString());

          // RENT LOGIC
          if (activeTenancy.end_date) {
            const endDate = parseISO(activeTenancy.end_date);
            const today = startOfDay(new Date());
            const daysLeft = differenceInDays(endDate, today);
            
            setNextPaymentDate(format(endDate, 'do MMM yyyy'));
            setDaysUntilRent(daysLeft);
            setIsRentOverdue(daysLeft < 0);
          } else {
            setNextPaymentDate("No End Date");
            setDaysUntilRent(0);
            setIsRentOverdue(false);
          }

          // BIN LOGIC
          const rotation = rotationRes.data;
          if (rotation) {
            setNextRotationDate(rotation.next_rotation_date);
            if (rotation.current_room_id === activeTenancy.room_id) {
              setIsOnBinDuty(true);
              const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
              const { data: logs } = await supabase.from('bin_rotations').select('id')
                .eq('tenancy_id', activeTenancy.id).eq('bin_duty_status', 'completed').gte('created_at', weekStart);
              if (logs && logs.length > 0) setBinDutyCompleted(true);
            }
          }

          // COUNCIL LOGIC
          const today = new Date();
          const nextCouncil = (councilRes.data || [])
            .filter((s: any) => new Date(s.next_collection_date) >= today)
            .sort((a: any, b: any) => new Date(a.next_collection_date).getTime() - new Date(b.next_collection_date).getTime())[0];
          setCouncilBin(nextCouncil || null);

          setCharges(chargesRes.data || []);
          setMaintenanceHistory(maintRes.data || []);
          setPaymentHistory(payRes.data || []);
          setNotifications(notifRes.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();

    return () => { isMounted = false; };
  }, [user?.id]); 

  // --- ACTIONS ---

  const handleMarkAsRead = async (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', notifId);
  };

  const handleCompleteBinDuty = async () => {
    try {
      const { error } = await supabase.from('bin_rotations').insert({
        property_id: tenancy.property_id,
        room_id: tenancy.room_id,
        tenancy_id: tenancy.id,
        lodger_id: lodgerProfile.id,
        bin_duty_status: 'completed',
        notes: 'Marked via Portal',
        created_at: new Date().toISOString()
      });
      if (error) throw error;
      setBinDutyCompleted(true);
      toast.success("Bin duty marked as completed!");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const handleMaintenanceSubmit = async () => {
    if (!maintenanceIssue || !maintenanceCategory) return toast.error("Fill all fields");
    try {
      await supabase.from('maintenance_requests').insert({
        lodger_id: lodgerProfile.id,
        property_id: tenancy.property_id,
        title: maintenanceCategory,
        description: maintenanceIssue,
        status: 'pending',
        priority: 'medium'
      });
      toast.success("Submitted");
      setIsMaintenanceDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const handlePayCharge = async (chargeId: string, amount: number) => {
    toast.success(`Redirecting to payment gateway for £${amount}...`);
  };

  const handlePaymentMock = () => { toast.success("Payment Gateway not integrated yet."); setIsPaymentDialogOpen(false); };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

  const navigationItems = [
    { id: "overview", label: "Dashboard", icon: Home },
    { id: "inspections", label: "Inspections", icon: ClipboardCheck },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  return (
    <>
      <SEO title="Lodger Portal" description="Manage your tenancy" />
      <div className="min-h-screen bg-background flex">
        <aside className="hidden md:flex w-64 border-r bg-card min-h-screen sticky top-0 flex-col">
          <div className="p-6 border-b">
             <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Domus Logo" className="h-10 w-10 rounded-lg" />
              <div><h2 className="font-bold text-lg">Domus</h2><p className="text-xs text-muted-foreground">Lodger Portal</p></div>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button key={item.id} variant={currentTab === item.id ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3 h-11", currentTab === item.id && "bg-secondary font-medium")} onClick={() => setCurrentTab(item.id)}>
                  <Icon className="h-5 w-5" /> {item.label}
                </Button>
              );
            })}
          </nav>
          <div className="p-4 border-t space-y-1"><Button variant="ghost" className="w-full justify-start gap-3 h-11" onClick={logout}><LogOut className="h-5 w-5" /> Sign Out</Button></div>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card px-8 flex items-center justify-between sticky top-0 z-10">
            <div><h1 className="text-xl font-semibold capitalize">{currentTab}</h1><p className="text-sm text-muted-foreground">Welcome back, {lodgerProfile?.full_name}</p></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
                <div className="text-sm"><p className="font-medium">{tenancy?.properties?.property_name || "No Property"}</p><p className="text-xs text-muted-foreground">{tenancy?.rooms?.room_number || "No Room"}</p></div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-auto bg-muted/30">
            {currentTab === "overview" && (
              <LodgerOverview 
                tenancy={{ 
                    rentAmount: tenancy?.monthly_rent || tenancy?.rent_amount || "0", 
                    status: tenancy?.tenancy_status || "N/A", 
                    endDate: nextPaymentDate,
                    daysUntilRent: daysUntilRent,
                    isOverdue: isRentOverdue
                }}
                extraCharges={charges}
                binDuty={{ 
                    isOnDuty: isOnBinDuty, 
                    isCompleted: binDutyCompleted, 
                    nextDate: nextRotationDate ? format(parseISO(nextRotationDate), 'PP') : "N/A", 
                    assignedDay: "N/A" 
                }}
                councilBin={{ 
                    type: councilBin?.bin_type || "No Schedule", 
                    nextDate: councilBin ? format(parseISO(councilBin.next_collection_date), 'PP') : "N/A", 
                    daysUntil: councilBin ? differenceInDays(parseISO(councilBin.next_collection_date), new Date()) : "N/A" 
                }}
                inspection={{ nextDate: null, status: '', daysUntil: null }}
                notifications={notifications}
                onMarkNotificationRead={handleMarkAsRead}
                onCompleteBinDuty={handleCompleteBinDuty}
              />
            )}

            {currentTab === "inspections" && (
                <LodgerInspections 
                    tenancy={{
                        property_id: tenancy?.property_id,
                        room_id: tenancy?.room_id,
                        rooms: tenancy?.rooms
                    }}
                />
            )}
            
            {currentTab === "payments" && (
                <div className="space-y-8 max-w-[1600px]">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Financials</h2>
                        <Button onClick={() => setIsPaymentDialogOpen(true)}><CreditCard className="mr-2 h-4 w-4"/> Make Rent Payment</Button>
                    </div>

                    {charges.filter(c => c.charge_status === 'pending').length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-red-700">
                                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                Outstanding Bills
                            </h3>
                            <Card className="border-red-100 bg-red-50/10">
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Due Date</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {charges.filter(c => c.charge_status === 'pending').map(charge => (
                                                <tr key={charge.id} className="border-b transition-colors hover:bg-red-50/30">
                                                    <td className="p-4 align-middle font-medium">{charge.reason}</td>
                                                    <td className="p-4 align-middle text-red-600 font-medium">
                                                        {charge.due_date ? format(parseISO(charge.due_date), 'PP') : 'Immediate'}
                                                    </td>
                                                    <td className="p-4 align-middle text-lg font-bold">£{charge.amount}</td>
                                                    <td className="p-4 align-middle text-right">
                                                        <Button size="sm" variant="destructive" onClick={() => handlePayCharge(charge.id, charge.amount)}>Pay Bill</Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Payment History</h3>
                        <Card>
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ref</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {paymentHistory.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No history found.</td></tr> : 
                                        paymentHistory.map(pay => (<tr key={pay.id} className="border-b transition-colors hover:bg-muted/50"><td className="p-4 align-middle">{format(parseISO(pay.payment_date), 'PP')}</td><td className="p-4 align-middle">{pay.payment_reference}</td><td className="p-4 align-middle">£{pay.amount}</td><td className="p-4 align-middle"><Badge variant="outline" className="capitalize">{pay.status}</Badge></td></tr>))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {currentTab === "maintenance" && (
                <div className="space-y-6 max-w-[1600px]">
                    <div className="flex justify-between"><h2 className="text-2xl font-bold">Maintenance</h2><Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}><DialogTrigger asChild><Button><Wrench className="mr-2 h-4 w-4"/> Report Issue</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Report Issue</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Category</Label><Select value={maintenanceCategory} onValueChange={setMaintenanceCategory}><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent><SelectItem value="plumbing">Plumbing</SelectItem><SelectItem value="electrical">Electrical</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div><div><Label>Description</Label><Textarea value={maintenanceIssue} onChange={e=>setMaintenanceIssue(e.target.value)}/></div></div><DialogFooter><Button onClick={handleMaintenanceSubmit}>Submit</Button></DialogFooter></DialogContent></Dialog></div>
                    <Card>
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Issue</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {maintenanceHistory.length === 0 ? <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No requests found.</td></tr> :
                                    maintenanceHistory.map(req => (<tr key={req.id} className="border-b transition-colors hover:bg-muted/50"><td className="p-4 align-middle">{req.title}</td><td className="p-4 align-middle">{format(parseISO(req.created_at), 'PP')}</td><td className="p-4 align-middle"><Badge>{req.status}</Badge></td></tr>))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {currentTab === "messages" && <LodgerMessages />}

            {/* ✅ DOCUMENTS TAB */}
            {currentTab === "documents" && (
                tenancy ? <LodgerDocuments tenancyId={tenancy.id} /> : 
                <div className="flex flex-col items-center justify-center h-[50vh] text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mb-3 opacity-20" />
                    <p>No active tenancy found.</p>
                </div>
            )}
          </main>
        </div>
        
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}><DialogContent><DialogHeader><DialogTitle>Make Payment</DialogTitle></DialogHeader><div className="py-4"><Label>Amount</Label><Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} /></div><DialogFooter><Button onClick={handlePaymentMock}>Confirm</Button></DialogFooter></DialogContent></Dialog>
      </div>
    </>
  );
};

export default LodgerPortal; 
