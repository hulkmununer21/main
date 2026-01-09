import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, CreditCard, FileText, MessageSquare, User, LogOut, Wrench, Loader2, ClipboardCheck, Lock, Save, Download, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import LodgerDocuments from "./lodger/LodgerDocuments"; 
import LodgerMaintenance from "./lodger/LodgerMaintenance";

// --- INTERFACES ---
interface ExtraCharge { id: string; reason: string; amount: number; due_date: string; created_at: string; charge_status: string; description?: string; }
interface PaymentHistory { 
  id: string; 
  payment_date: string; 
  amount: number; 
  payment_method: string; 
  payment_status: string; 
  payment_reference: string;
  payment_type: string;
  properties?: { property_name: string };
  rooms?: { room_number: string };
}
interface AppNotification { id: string; recipient_id: string; subject: string; message_body: string; is_read: boolean; created_at: string; read_at?: string; notification_type?: string; }

const LodgerPortal = () => {
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("overview");

  // --- DATA STATE ---
  const [lodgerProfile, setLodgerProfile] = useState<any>(null);
  const [tenancy, setTenancy] = useState<any>(null);
  
  // Lists
  const [charges, setCharges] = useState<ExtraCharge[]>([]);
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
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null); // ✅ For simulation

  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ 
    full_name: "", email: "", phone: "",
    emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relationship: ""
  });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // --- DATA FETCHING ---
  const fetchAllData = async () => {
    if (!user?.id) return;
    try {
      const { data: profile } = await supabase.from('lodger_profiles').select('*').eq('user_id', user.id).single();
      if (!profile) throw new Error("Lodger Profile not found.");
      
      setLodgerProfile(profile);
      setProfileForm({
          full_name: profile.full_name || "",
          email: profile.email || user.email || "",
          phone: profile.phone || "",
          emergency_contact_name: profile.emergency_contact_name || "",
          emergency_contact_phone: profile.emergency_contact_phone || "",
          emergency_contact_relationship: profile.emergency_contact_relationship || ""
      });

      const { data: tenancies } = await supabase.from('tenancies').select('*').eq('lodger_id', profile.id);
      const rawTenancies = tenancies || [];
      const activeTenancy = rawTenancies.find((t: any) => t.tenancy_status === 'active') || 
                            rawTenancies.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (activeTenancy) {
        const [propRes, roomRes, rotationRes, councilRes, chargesRes, payRes, notifRes] = await Promise.all([
          supabase.from('properties').select('*').eq('id', activeTenancy.property_id).single(),
          supabase.from('rooms').select('*').eq('id', activeTenancy.room_id).single(),
          supabase.from('in_house_rotation_state').select('*').eq('property_id', activeTenancy.property_id).single(),
          supabase.from('bin_schedules').select('*').eq('property_id', activeTenancy.property_id),
          supabase.from('extra_charges').select('*').eq('lodger_id', profile.id).order('created_at', { ascending: false }),
          supabase.from('payments').select(`*, properties(property_name), rooms(room_number)`).eq('lodger_id', profile.id).order('payment_date', { ascending: false }),
          supabase.from('notifications').select('*').eq('recipient_id', user.id).order('created_at', { ascending: false }).limit(5)
        ]);

        setTenancy({
          ...activeTenancy,
          properties: propRes.data || { property_name: "Unknown" },
          rooms: roomRes.data || { room_number: "Unknown" }
        });
        
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

        const rotation = rotationRes.data;
        if (rotation) {
          setNextRotationDate(rotation.next_rotation_date);
          if (rotation.current_room_id === activeTenancy.room_id) {
            setIsOnBinDuty(true);
            const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
            const { data: logs } = await supabase.from('bin_rotations').select('id').eq('tenancy_id', activeTenancy.id).eq('bin_duty_status', 'completed').gte('created_at', weekStart);
            if (logs && logs.length > 0) setBinDutyCompleted(true);
          }
        }

        const today = new Date();
        const nextCouncil = (councilRes.data || []).filter((s: any) => new Date(s.next_collection_date) >= today).sort((a: any, b: any) => new Date(a.next_collection_date).getTime() - new Date(b.next_collection_date).getTime())[0];
        setCouncilBin(nextCouncil || null);

        setCharges(chargesRes.data || []);
        setPaymentHistory(payRes.data || []);
        setNotifications(notifRes.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user?.id]); 

  // --- ACTIONS ---
  const handleMarkAsRead = async (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', notifId);
  };

  const handleCompleteBinDuty = async () => {
    try {
      const { error } = await supabase.from('bin_rotations').insert({ property_id: tenancy.property_id, room_id: tenancy.room_id, tenancy_id: tenancy.id, lodger_id: lodgerProfile.id, bin_duty_status: 'completed', notes: 'Marked via Portal', created_at: new Date().toISOString() });
      if (error) throw error;
      setBinDutyCompleted(true);
      toast.success("Bin duty marked as completed!");
    } catch (error: any) { toast.error("Error: " + error.message); }
  };

  const handlePayCharge = async (chargeId: string, amount: number) => {
    toast.success(`Redirecting to payment gateway for £${amount}...`);
  };

  // ✅ SIMULATE RENT PAYMENT
  const handleSimulateRentPayment = async (paymentId: string, amount: number) => {
    setProcessingPaymentId(paymentId);
    try {
        // 1. Simulate Delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. Update DB
        const { error } = await supabase.from('payments')
            .update({ 
                payment_status: 'paid', 
                payment_method: 'Card (Online)', 
                payment_date: new Date().toISOString() 
            })
            .eq('id', paymentId);

        if (error) throw error;

        toast.success(`Payment of £${amount} successful!`);
        fetchAllData(); // Refresh list to move it to history
    } catch (error: any) {
        toast.error("Payment failed: " + error.message);
    } finally {
        setProcessingPaymentId(null);
    }
  };

  const handlePaymentMock = () => { toast.success("Payment Gateway not integrated yet."); setIsPaymentDialogOpen(false); };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
        const { error } = await supabase.from('lodger_profiles').update({ 
                full_name: profileForm.full_name,
                phone: profileForm.phone,
                emergency_contact_name: profileForm.emergency_contact_name,
                emergency_contact_phone: profileForm.emergency_contact_phone,
                emergency_contact_relationship: profileForm.emergency_contact_relationship
            }).eq('user_id', user.id);
        if (error) throw error;
        setLodgerProfile((prev: any) => ({ ...prev, full_name: profileForm.full_name }));
        toast.success("Profile details updated.");
    } catch (error: any) { toast.error("Profile update failed: " + error.message); } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error("Passwords do not match.");
    if (passwordForm.newPassword.length < 6) return toast.error("Password must be at least 6 characters.");
    setSavingProfile(true);
    try {
        const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
        if (error) throw error;
        toast.success("Password changed successfully.");
        setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error: any) { toast.error("Password change failed: " + error.message); } finally { setSavingProfile(false); }
  };

  // Helper for Payment Status Badge
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Pending</Badge>;
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

  // Filter Payments
  const pendingPayments = paymentHistory.filter(p => ['pending', 'overdue'].includes(p.payment_status.toLowerCase()));
  const historyPayments = paymentHistory.filter(p => !['pending', 'overdue'].includes(p.payment_status.toLowerCase()));

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
        {/* Sidebar */}
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
          {/* Header */}
          <header className="h-16 border-b bg-card px-8 flex items-center justify-between sticky top-0 z-10">
            <div><h1 className="text-xl font-semibold capitalize">{currentTab}</h1><p className="text-sm text-muted-foreground">Welcome back, {lodgerProfile?.full_name}</p></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pl-4 border-l">
                <div 
                    className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => setIsProfileOpen(true)}
                >
                    <User className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm"><p className="font-medium">{tenancy?.properties?.property_name || "No Property"}</p><p className="text-xs text-muted-foreground">{tenancy?.rooms?.room_number || "No Room"}</p></div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-auto bg-muted/30">
            {currentTab === "overview" && (
              <LodgerOverview 
                tenancy={{ rentAmount: tenancy?.monthly_rent || tenancy?.rent_amount || "0", status: tenancy?.tenancy_status || "N/A", endDate: nextPaymentDate, daysUntilRent: daysUntilRent, isOverdue: isRentOverdue }}
                extraCharges={charges}
                binDuty={{ isOnDuty: isOnBinDuty, isCompleted: binDutyCompleted, nextDate: nextRotationDate ? format(parseISO(nextRotationDate), 'PP') : "N/A", assignedDay: "N/A" }}
                councilBin={{ type: councilBin?.bin_type || "No Schedule", nextDate: councilBin ? format(parseISO(councilBin.next_collection_date), 'PP') : "N/A", daysUntil: councilBin ? differenceInDays(parseISO(councilBin.next_collection_date), new Date()) : "N/A" }}
                inspection={{ nextDate: null, status: '', daysUntil: null }}
                notifications={notifications}
                onMarkNotificationRead={handleMarkAsRead}
                onCompleteBinDuty={handleCompleteBinDuty}
              />
            )}

            {currentTab === "inspections" && <LodgerInspections tenancy={{ property_id: tenancy?.property_id, room_id: tenancy?.room_id, rooms: tenancy?.rooms }} />}
            
            {/* ✅ PAYMENTS TAB (UPDATED WITH SUB-TABS) */}
            {currentTab === "payments" && (
                <div className="space-y-8 max-w-[1600px]">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Financials</h2>
                    </div>

                    <Tabs defaultValue="pending" className="w-full">
                        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                            <TabsTrigger value="pending">To Pay</TabsTrigger>
                            <TabsTrigger value="history">History</TabsTrigger>
                        </TabsList>

                        {/* TAB 1: PENDING PAYMENTS & BILLS */}
                        <TabsContent value="pending" className="space-y-6 mt-6">
                            
                            {/* Outstanding Bills (Extra Charges) */}
                            {charges.filter(c => c.charge_status === 'pending').length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold flex items-center gap-2 text-red-700"><AlertCircle className="h-5 w-5"/> Outstanding Bills</h3>
                                    <Card className="border-red-100 bg-red-50/10">
                                        <div className="relative w-full overflow-auto">
                                            <table className="w-full caption-bottom text-sm">
                                                <thead className="[&_tr]:border-b"><tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Due Date</th><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th><th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th></tr></thead>
                                                <tbody className="[&_tr:last-child]:border-0">
                                                    {charges.filter(c => c.charge_status === 'pending').map(charge => (
                                                        <tr key={charge.id} className="border-b transition-colors hover:bg-red-50/30">
                                                            <td className="p-4 align-middle font-medium">{charge.reason}</td>
                                                            <td className="p-4 align-middle text-red-600 font-medium">{charge.due_date ? format(parseISO(charge.due_date), 'PP') : 'Immediate'}</td>
                                                            <td className="p-4 align-middle text-lg font-bold">£{charge.amount}</td>
                                                            <td className="p-4 align-middle text-right"><Button size="sm" variant="destructive" onClick={() => handlePayCharge(charge.id, charge.amount)}>Pay Bill</Button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* Pending Rent Payments */}
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-700"><AlertCircle className="h-5 w-5"/> Pending Rent</h3>
                                <Card>
                                    <div className="relative w-full overflow-auto">
                                        <table className="w-full caption-bottom text-sm">
                                            <thead className="[&_tr]:border-b"><tr className="border-b transition-colors hover:bg-muted/50"><th className="h-12 px-4 text-left">Due Date</th><th className="h-12 px-4 text-left">Reference</th><th className="h-12 px-4 text-left">Type</th><th className="h-12 px-4 text-left">Amount</th><th className="h-12 px-4 text-left">Status</th><th className="h-12 px-4 text-right">Action</th></tr></thead>
                                            <tbody className="[&_tr:last-child]:border-0">
                                                {pendingPayments.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No pending payments.</td></tr> : 
                                                pendingPayments.map(pay => (
                                                    <tr key={pay.id} className="border-b transition-colors hover:bg-muted/50">
                                                        <td className="p-4 align-middle text-red-600 font-medium">{format(parseISO(pay.payment_date), 'PP')}</td>
                                                        <td className="p-4 align-middle font-mono text-xs text-muted-foreground">{pay.payment_reference}</td>
                                                        <td className="p-4 align-middle"><Badge variant="outline">{pay.payment_type}</Badge></td>
                                                        <td className="p-4 align-middle font-bold">£{pay.amount}</td>
                                                        <td className="p-4 align-middle">{getStatusBadge(pay.payment_status)}</td>
                                                        <td className="p-4 align-middle text-right">
                                                            <Button 
                                                                size="sm" 
                                                                className="bg-green-600 hover:bg-green-700 text-white" 
                                                                onClick={() => handleSimulateRentPayment(pay.id, pay.amount)}
                                                                disabled={processingPaymentId === pay.id}
                                                            >
                                                                {processingPaymentId === pay.id ? <Loader2 className="h-4 w-4 animate-spin"/> : "Pay Now"}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* TAB 2: COMPLETED HISTORY */}
                        <TabsContent value="history" className="mt-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700"><CheckCircle className="h-5 w-5"/> Payment History</h3>
                                <Card>
                                    <div className="relative w-full overflow-auto">
                                        <table className="w-full caption-bottom text-sm">
                                            <thead className="[&_tr]:border-b">
                                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date Paid</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Reference</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Method</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Receipt</th>
                                                </tr>
                                            </thead>
                                            <tbody className="[&_tr:last-child]:border-0">
                                                {historyPayments.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No history found.</td></tr> : 
                                                historyPayments.map(pay => (
                                                    <tr key={pay.id} className="border-b transition-colors hover:bg-muted/50">
                                                        <td className="p-4 align-middle font-medium">{format(parseISO(pay.payment_date), 'PP')}</td>
                                                        <td className="p-4 align-middle text-sm font-mono text-muted-foreground">{pay.payment_reference || "N/A"}</td>
                                                        <td className="p-4 align-middle"><Badge variant="outline">{pay.payment_type || "Rent"}</Badge></td>
                                                        <td className="p-4 align-middle text-sm text-muted-foreground">{pay.payment_method || "Transfer"}</td>
                                                        <td className="p-4 align-middle font-bold">£{pay.amount}</td>
                                                        <td className="p-4 align-middle">{getStatusBadge(pay.payment_status)}</td>
                                                        <td className="p-4 align-middle text-right"><Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4"/></Button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {currentTab === "maintenance" && <LodgerMaintenance />}
            {currentTab === "messages" && <LodgerMessages />}
            {currentTab === "documents" && (
                tenancy ? <LodgerDocuments tenancyId={tenancy.id} /> : 
                <div className="flex flex-col items-center justify-center h-[50vh] text-center text-muted-foreground"><FileText className="h-12 w-12 mb-3 opacity-20" /><p>No active tenancy found.</p></div>
            )}
          </main>
        </div>
        
        {/* Payment Dialog (Hidden but logic kept if needed) */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}><DialogContent><DialogHeader><DialogTitle>Make Payment</DialogTitle></DialogHeader><div className="py-4"><Label>Amount</Label><Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} /></div><DialogFooter><Button onClick={handlePaymentMock}>Confirm</Button></DialogFooter></DialogContent></Dialog>

        {/* Profile Modal */}
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Profile Management</DialogTitle><DialogDescription>Update your personal details.</DialogDescription></DialogHeader>
                <Tabs defaultValue="details" className="mt-2">
                    <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="details">My Details</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger></TabsList>
                    <TabsContent value="details" className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-2"><label className="text-sm font-medium">Full Name</label><Input value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} /></div>
                        <div className="space-y-2"><label className="text-sm font-medium">Email (Read Only)</label><Input value={profileForm.email} disabled className="bg-muted" /></div>
                        <div className="space-y-2"><label className="text-sm font-medium">Phone Number</label><Input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} /></div>
                        <div className="border-t pt-4 mt-4"><h4 className="text-sm font-semibold mb-3 text-muted-foreground">Emergency Contact</h4><div className="space-y-3"><div className="space-y-2"><label className="text-xs font-medium">Contact Name</label><Input value={profileForm.emergency_contact_name} onChange={e => setProfileForm({...profileForm, emergency_contact_name: e.target.value})} placeholder="e.g. John Doe" /></div><div className="space-y-2"><label className="text-xs font-medium">Relationship</label><Input value={profileForm.emergency_contact_relationship} onChange={e => setProfileForm({...profileForm, emergency_contact_relationship: e.target.value})} placeholder="e.g. Parent" /></div><div className="space-y-2"><label className="text-xs font-medium">Phone Number</label><Input value={profileForm.emergency_contact_phone} onChange={e => setProfileForm({...profileForm, emergency_contact_phone: e.target.value})} placeholder="+44 7..." /></div></div></div>
                        <Button className="w-full mt-4" onClick={handleUpdateProfile} disabled={savingProfile}>{savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2"/>} Save Changes</Button>
                    </TabsContent>
                    <TabsContent value="security" className="space-y-4 py-4"><div className="space-y-2"><label className="text-sm font-medium">New Password</label><Input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} /></div><div className="space-y-2"><label className="text-sm font-medium">Confirm New Password</label><Input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} /></div><Button className="w-full" variant="destructive" onClick={handleChangePassword} disabled={savingProfile}>{savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Lock className="h-4 w-4 mr-2"/>} Update Password</Button></TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default LodgerPortal;