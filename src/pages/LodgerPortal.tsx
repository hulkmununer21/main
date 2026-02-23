import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, CreditCard, FileText, MessageSquare, User, LogOut, Wrench, Loader2, ClipboardCheck, Lock, Save, Download, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import { jsPDF } from "jspdf"; 

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
  due_date?: string; // Added to support rent invoice description
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
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null); 

  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ 
    full_name: "", email: "", phone: "",
    emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relationship: ""
  });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // --- RECEIPT GENERATION (UPDATED) ---
  const generateReceipt = (payment: PaymentHistory) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxLineWidth = pageWidth - (margin * 2);
    
    const isDeposit = payment.payment_type?.toLowerCase() === 'deposit';
    const receiptDate = payment.payment_date ? format(parseISO(payment.payment_date), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy');
    const receiptNo = payment.payment_reference || `DOM/LDG/${new Date().getFullYear()}/${payment.id.substring(0,4)}`;
    const lodgerName = lodgerProfile?.full_name || "Lodger";
    const propertyAddress = tenancy?.properties?.property_name || payment.properties?.property_name || "Address on File";
    const roomNumber = tenancy?.rooms?.room_number || payment.rooms?.room_number || "N/A";
    
    let yPos = 20;

    // ==========================================
    // BRANCH 1: DEPOSIT RECEIPT (Strict Legal Format)
    // ==========================================
    if (isDeposit) {
      try { doc.addImage(logo, 'PNG', (pageWidth / 2) - 18, yPos, 36, 36); yPos += 40; } catch (e) { yPos += 10; }

      doc.setFont("times", "bold");
      doc.setFontSize(14); 
      doc.text("DEPOSIT RECEIPT", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      doc.setFont("times", "normal");
      doc.setFontSize(12); 
      const lineHeight = 6; 

      doc.text(`Receipt No: ${receiptNo}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Date: ${receiptDate}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Received From: ${lodgerName}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Street Address: ${propertyAddress}`, margin, yPos); 
      yPos += lineHeight;
      doc.text(`Details: Room ${roomNumber}`, margin, yPos);
      yPos += 10; 

      doc.setFont("times", "bold");
      doc.text("Deposit Value", margin, yPos);
      yPos += lineHeight;
      doc.setFont("times", "normal");
      doc.text(`This receipt is for the deposit of £${Number(payment.amount).toFixed(2)} Great British Pounds in the form of`, margin, yPos);
      yPos += lineHeight;
      
      const method = payment.payment_method?.toLowerCase() || "";
      let checkX = margin;
      
      doc.rect(checkX, yPos - 4, 4, 4); 
      if (method.includes('check') || method.includes('cheque')) doc.text("x", checkX + 1, yPos - 1);
      doc.text("Check", checkX + 6, yPos);
      
      checkX += 40;
      doc.rect(checkX, yPos - 4, 4, 4);
      if (method.includes('cash')) doc.text("x", checkX + 1, yPos - 1);
      doc.text("Cash Deposit", checkX + 6, yPos);

      checkX += 50;
      doc.rect(checkX, yPos - 4, 4, 4);
      if (!method.includes('check') && !method.includes('cash')) doc.text("x", checkX + 1, yPos - 1);
      doc.text(`Other: ${!method.includes('check') && !method.includes('cash') ? (payment.payment_method || "Transfer") : "________________"}`, checkX + 6, yPos);
      yPos += 10;

      doc.setFont("times", "bold");
      doc.text("Deposit Type", margin, yPos);
      yPos += lineHeight;
      doc.setFont("times", "normal");
      doc.text("Deposit is for: Security & Damage", margin, yPos);
      yPos += lineHeight;
      
      // Refundable checkbox section
      doc.text("This deposit is", margin, yPos);
      let refundCheckX = margin + 32;
      
      // Refundable checkbox (checked by default)
      doc.rect(refundCheckX, yPos - 4, 4, 4);
      doc.text("x", refundCheckX + 1, yPos - 1);
      doc.text("Refundable", refundCheckX + 6, yPos);
      
      // Non-Refundable checkbox (unchecked)
      refundCheckX += 35;
      doc.rect(refundCheckX, yPos - 4, 4, 4);
      doc.text("Non-Refundable (Condition applied)", refundCheckX + 6, yPos);
      yPos += 10;

      const legalText = [
          "This deposit is held in relation to a lodger license agreement and is not subject to the Housing Act 2004 tenancy deposit regulations.",
          `This deposit is associated with the lodging agreement dated ${receiptDate} between the parties.`,
          "This deposit will be refunded at the end of the lodging term, subject to no breach of the agreement or damage to the premises, as detailed in the Lodging Agreement.",
          "Note: The above amount has been received and will be held securely by Domus Manutentio et Servitia Ltd for the duration of the lodger’s stay, subject to the conditions outlined in the Lodging Agreement.",
          "This receipt was automatically generated and issued by Domus Manutentio et Servitia Ltd as confirmation of funds received on the date stated above.",
          "By proceeding with the agreement on the lodging agreement, the lodger acknowledges and agrees to the terms associated with this deposit."
      ];

      legalText.forEach(text => {
          if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
          doc.text(text, margin, yPos, { maxWidth: maxLineWidth, align: "justify" });
          const dim = doc.getTextDimensions(text, { maxWidth: maxLineWidth });
          yPos += dim.h + 3; 
      });

      if (yPos > pageHeight - 45) { doc.addPage(); yPos = 20; } else { yPos += 5; }

      doc.setDrawColor(200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      doc.setFont("times", "bold");
      doc.text("Contact Us", margin, yPos);
      yPos += lineHeight;
      doc.setFont("times", "normal");
      doc.text("If you have any questions or concerns, contact:", margin, yPos);
      yPos += lineHeight;
      doc.setFont("times", "bold");
      doc.text("Domus Manutentio et Servitia Ltd", margin, yPos);
      yPos += lineHeight;
      doc.setFont("times", "normal");
      doc.text("Registration No: 16395957", margin, yPos);
      yPos += lineHeight;
      doc.text("Address: Liana Gardens, Wolverhampton WV2 2AD", margin, yPos);
      yPos += lineHeight;
      doc.text("Phone: 01902 214066   Email: info@domusservitia.uk", margin, yPos);

    } 
    // ==========================================
    // BRANCH 2: GENERAL INVOICE (Rent, Utilities, Extra Charges)
    // ==========================================
    else {
      try { doc.addImage(logo, 'PNG', (pageWidth / 2) - 20, yPos, 40, 40); yPos += 45; } catch (e) { yPos += 10; }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("PAYMENT RECEIPT", pageWidth / 2, yPos, { align: "center" });
      yPos += 8;
      
      doc.setFontSize(12);
      doc.text("Domus Manutentio et Servitia Ltd", pageWidth / 2, yPos, { align: "center" });
      yPos += 20;

      // Metadata Layout
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Receipt #:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(receiptNo, margin + 25, yPos);
      
      doc.setFont("helvetica", "bold");
      doc.text("Date:", pageWidth - 70, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(receiptDate, pageWidth - 40, yPos);
      yPos += 8;

      doc.setFont("helvetica", "bold");
      doc.text("Received From:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(lodgerName, margin + 30, yPos);
      yPos += 8;

      doc.setFont("helvetica", "bold");
      doc.text("Property:", margin, yPos);
      doc.setFont("helvetica", "normal");
      const fullAddress = `${propertyAddress}\nRoom ${roomNumber}`;
      doc.text(fullAddress, margin + 20, yPos);
      yPos += 15;

      // Table Header
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPos, maxLineWidth, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.text("Description", margin + 5, yPos + 7);
      doc.text("Amount", pageWidth - margin - 30, yPos + 7);
      yPos += 10;

      // Table Row Data
      doc.setFont("helvetica", "normal");
      
      let descriptionLabel = "Payment";
      if (payment.payment_type === 'rent') descriptionLabel = `Lodging Fee / Rent - ${format(parseISO(payment.due_date || payment.payment_date || new Date().toISOString()), 'MMMM yyyy')}`;
      else if (payment.payment_type === 'extra_charge') descriptionLabel = "Extra Charge / Penalty";
      else if (payment.payment_type === 'utility') descriptionLabel = "Utility Bill Contribution";
      else if (payment.payment_type) descriptionLabel = payment.payment_type.replace('_', ' ').toUpperCase();

      doc.text(descriptionLabel, margin + 5, yPos + 8);
      doc.text(`£${Number(payment.amount).toFixed(2)}`, pageWidth - margin - 30, yPos + 8);
      yPos += 20;

      // Line Separator
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Totals & Paid Stamp
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("TOTAL", pageWidth - margin - 50, yPos);
      doc.text(`£${Number(payment.amount).toFixed(2)}`, pageWidth - margin - 30, yPos);
      
      yPos += 15;
      if (['paid', 'completed'].includes(payment.payment_status?.toLowerCase())) {
          doc.setTextColor(0, 150, 0); 
          doc.setFontSize(16);
          doc.text("PAID IN FULL", pageWidth - margin - 60, yPos);
          doc.setTextColor(0, 0, 0); 
      }

      yPos += 40;

      // New Footer Format
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Contact Us", margin, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.text("If you have any questions or concerns, contact:", margin, yPos);
      yPos += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Domus Manutentio et Servitia Ltd", margin, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 5;
      doc.text("Registration No: 16395957", margin, yPos);
      yPos += 5;
      doc.text("Address: Liana Gardens, Wolverhampton WV2 2AD", margin, yPos);
      yPos += 5;
      doc.text("Phone: 01902 214066   Email: info@domusservitia.uk", margin, yPos);
    }

    doc.save(`Receipt_${receiptNo}.pdf`);
  };

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
      
      // ✅ Look for 'active' or 'pending' as the current tenancy
      const activeTenancy = rawTenancies.find((t: any) => t.tenancy_status === 'active' || t.tenancy_status === 'pending') || 
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
        
        // Safely check if end_date exists before parsing
        if (activeTenancy.end_date) {
          try {
              const endDate = parseISO(activeTenancy.end_date);
              const today = startOfDay(new Date());
              const daysLeft = differenceInDays(endDate, today);
              setNextPaymentDate(format(endDate, 'do MMM yyyy'));
              setDaysUntilRent(daysLeft);
              setIsRentOverdue(daysLeft < 0);
          } catch(e) {
              setNextPaymentDate("Invalid Date");
              setDaysUntilRent(0);
              setIsRentOverdue(false);
          }
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

  // ✅ SIMULATE PAYMENT
  const handleSimulatePayment = async (paymentId: string, amount: number, paymentType: string) => {
    setProcessingPaymentId(paymentId);
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const { error } = await supabase.from('payments')
            .update({ 
                payment_status: 'completed', 
                payment_method: 'Card (Online)', 
                payment_date: new Date().toISOString() 
            })
            .eq('id', paymentId);

        if (error) throw error;

        toast.success(`${paymentType === 'deposit' ? 'Deposit' : 'Rent'} of £${amount} successful!`);
        
        await fetchAllData(); 
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

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': 
      case 'completed': return <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Pending</Badge>;
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

  const pendingPayments = paymentHistory.filter(p => ['pending', 'overdue'].includes(p.payment_status.toLowerCase()));
  const historyPayments = paymentHistory.filter(p => !['pending', 'overdue'].includes(p.payment_status.toLowerCase()));

  const isPendingTenancy = tenancy?.tenancy_status === 'pending';
  const pendingDepositPayment = pendingPayments.find(p => p.payment_type === 'deposit');

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
        
        {/* Sidebar - HIDDEN IF PENDING */}
        {!isPendingTenancy && (
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
        )}

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-card px-8 flex items-center justify-between sticky top-0 z-10">
            {isPendingTenancy ? (
                <div><h1 className="text-xl font-semibold">Account Setup</h1><p className="text-sm text-muted-foreground">Action Required</p></div>
            ) : (
                <div><h1 className="text-xl font-semibold capitalize">{currentTab}</h1><p className="text-sm text-muted-foreground">Welcome back, {lodgerProfile?.full_name}</p></div>
            )}
            
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
              {isPendingTenancy && (
                  <Button variant="ghost" size="icon" onClick={logout}><LogOut className="h-5 w-5 text-muted-foreground" /></Button>
              )}
            </div>
          </header>

          <main className="flex-1 p-8 overflow-auto bg-muted/30 flex justify-center">
            
            {/* ✅ THE PENDING TENANCY BLOCKER SCREEN */}
            {isPendingTenancy ? (
                <div className="max-w-md w-full mt-12">
                    <Card className="border-border shadow-lg">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto bg-yellow-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                <ShieldAlert className="h-8 w-8 text-yellow-600" />
                            </div>
                            <CardTitle className="text-2xl">Activate Your Tenancy</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Welcome to Domus! You have been assigned to <strong>Room {tenancy?.rooms?.room_number}</strong> at <strong>{tenancy?.properties?.property_name}</strong>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="bg-muted p-4 rounded-lg border">
                                <p className="text-sm text-muted-foreground mb-2">To complete your onboarding and gain full access to your Lodger Portal, you must pay your Security Deposit.</p>
                                
                                {pendingDepositPayment ? (
                                    <div className="flex justify-between items-end border-t border-border pt-4 mt-4">
                                        <div>
                                            <p className="text-sm font-medium">Security Deposit</p>
                                            <p className="text-xs text-muted-foreground">Due: Immediate</p>
                                        </div>
                                        <p className="text-2xl font-bold">£{pendingDepositPayment.amount}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-500 font-medium">Deposit invoice not found. Please contact administration.</p>
                                )}
                            </div>

                            {pendingDepositPayment && (
                                <Button 
                                    className="w-full h-12 text-lg bg-gradient-gold text-primary shadow-gold" 
                                    onClick={() => handleSimulatePayment(pendingDepositPayment.id, pendingDepositPayment.amount, 'deposit')}
                                    disabled={processingPaymentId === pendingDepositPayment.id}
                                >
                                    {processingPaymentId === pendingDepositPayment.id ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Lock className="h-5 w-5 mr-2" />}
                                    Pay Security Deposit
                                </Button>
                            )}
                            <p className="text-xs text-center text-muted-foreground">Your first month's rent will be due on your move-in date ({tenancy?.start_date ? format(parseISO(tenancy.start_date), 'do MMM') : "N/A"}).</p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
            
            /* --- NORMAL ACTIVE TENANCY CONTENT --- */
            <div className="w-full">
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
                                                            <td className="p-4 align-middle text-red-600 font-medium">{pay.due_date ? format(parseISO(pay.due_date), 'PP') : 'Immediate'}</td>
                                                            <td className="p-4 align-middle font-mono text-xs text-muted-foreground">{pay.payment_reference}</td>
                                                            <td className="p-4 align-middle"><Badge variant="outline">{pay.payment_type}</Badge></td>
                                                            <td className="p-4 align-middle font-bold">£{pay.amount}</td>
                                                            <td className="p-4 align-middle">{getStatusBadge(pay.payment_status)}</td>
                                                            <td className="p-4 align-middle text-right">
                                                                <Button 
                                                                    size="sm" 
                                                                    className="bg-green-600 hover:bg-green-700 text-white" 
                                                                    onClick={() => handleSimulatePayment(pay.id, pay.amount, pay.payment_type)}
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
                                                            <td className="p-4 align-middle font-medium">{pay.payment_date ? format(parseISO(pay.payment_date), 'PP') : 'N/A'}</td>
                                                            <td className="p-4 align-middle text-sm font-mono text-muted-foreground">{pay.payment_reference || "N/A"}</td>
                                                            <td className="p-4 align-middle"><Badge variant="outline">{pay.payment_type || "Rent"}</Badge></td>
                                                            <td className="p-4 align-middle text-sm text-muted-foreground">{pay.payment_method || "Transfer"}</td>
                                                            <td className="p-4 align-middle font-bold">£{pay.amount}</td>
                                                            <td className="p-4 align-middle">{getStatusBadge(pay.payment_status)}</td>
                                                            <td className="p-4 align-middle text-right"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => generateReceipt(pay)}><Download className="h-4 w-4"/></Button></td>
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
            </div>
            )}
          </main>
        </div>
        
        {/* Payment Dialog */}
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