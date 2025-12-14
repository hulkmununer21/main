import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, AlertCircle, CheckCircle, Clock, Plus, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { jsPDF } from "jspdf";

// === INTERFACES ===

interface ExtraCharge {
  id: string;
  lodger_id: string;
  property_id: string;
  tenancy_id: string;
  amount: number;
  charge_type: string;
  charge_status: 'pending' | 'paid' | 'waived' | 'overdue' | 'disputed';
  due_date: string;
  created_at: string;
  reason: string;
  evidence_urls: string[];
  lodger_profiles?: { full_name: string; email?: string };
  properties?: { property_name: string; address_line1?: string; postcode?: string };
  payments?: { 
    payment_reference: string; 
    payment_date: string; 
    payment_method: string; 
  } | null;
}

interface ActiveTenancyOption {
  id: string;
  lodger_id: string;
  user_id: string; // The Auth User ID (Required for Notification)
  property_id: string;
  room_id: string;
  lodger_name: string;
  property_name: string;
  room_number: string;
}

const CHARGE_TYPE_MAP: Record<string, string> = {
  "Missed Bin Duty": "bin_duty_missed",
  "Damage to Property": "damage",
  "Deep Cleaning Required": "cleaning",
  "Lost Key Replacement": "key_replacement",
  "Late Payment Fee": "late_payment",
  "Breach of Contract": "breach_of_contract",
  "Utility Overage": "utility_overage",
  "Other": "other"
};

const CHARGE_REASONS = Object.keys(CHARGE_TYPE_MAP);

// === COMPONENT ===

const ExtraCharges = () => {
  const [charges, setCharges] = useState<ExtraCharge[]>([]);
  const [activeTenancies, setActiveTenancies] = useState<ActiveTenancyOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chargeForm, setChargeForm] = useState({
    tenancy_id: "",
    amount: "",
    charge_type: "",
    due_date: format(new Date().setDate(new Date().getDate() + 7), 'yyyy-MM-dd'),
    description: ""
  });

  // --- DATA FETCHING ---

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Charges
      const { data: chargesData, error: chargesError } = await supabase
        .from('extra_charges')
        .select(`
          *,
          lodger_profiles (full_name, email),
          properties (property_name, address_line1, postcode),
          payments (payment_reference, payment_date, payment_method)
        `)
        .order('created_at', { ascending: false });

      if (chargesError) throw chargesError;

      // 2. Fetch Active Tenancies AND the linked user_id
      // We need user_id to send notifications to the right person
      const { data: tenancyData, error: tenancyError } = await supabase
        .from('tenancies')
        .select(`
          id,
          lodger_id,
          property_id,
          room_id,
          lodger_profiles!inner (full_name, user_id), 
          properties (property_name),
          rooms (room_number)
        `)
        .eq('tenancy_status', 'active');

      if (tenancyError) throw tenancyError;

      const formattedTenancies: ActiveTenancyOption[] = (tenancyData || []).map((t: any) => {
        // Handle potential array vs object returns from Supabase joins
        const profile = Array.isArray(t.lodger_profiles) ? t.lodger_profiles[0] : t.lodger_profiles;
        const prop = Array.isArray(t.properties) ? t.properties[0] : t.properties;
        const room = Array.isArray(t.rooms) ? t.rooms[0] : t.rooms;

        return {
          id: t.id,
          lodger_id: t.lodger_id,
          user_id: profile?.user_id, // This is the UUID we need for notifications
          property_id: t.property_id,
          room_id: t.room_id,
          lodger_name: profile?.full_name || "Unknown",
          property_name: prop?.property_name || "Unknown",
          room_number: room?.room_number || "N/A",
        };
      });

      const formattedCharges: ExtraCharge[] = (chargesData || []).map((c: any) => ({
        ...c,
        lodger_profiles: Array.isArray(c.lodger_profiles) ? c.lodger_profiles[0] : c.lodger_profiles,
        properties: Array.isArray(c.properties) ? c.properties[0] : c.properties,
        payments: Array.isArray(c.payments) ? c.payments[0] : c.payments,
      }));

      setCharges(formattedCharges);
      setActiveTenancies(formattedTenancies);

    } catch (error: any) {
      console.error("Error fetching charges data:", error);
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // --- RECEIPT GENERATION LOGIC ---
  const generateReceipt = (charge: ExtraCharge) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(22);
    doc.text("PAYMENT RECEIPT", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text("Domus Servitia Property Management", pageWidth / 2, 28, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(20, 35, pageWidth - 20, 35);

    const paymentRef = charge.payments?.payment_reference || "N/A";
    const paymentDate = charge.payments?.payment_date 
      ? format(new Date(charge.payments.payment_date), 'dd MMM yyyy') 
      : format(new Date(), 'dd MMM yyyy');
    
    doc.setFontSize(12);
    doc.text(`Receipt #: ${paymentRef}`, 20, 50);
    doc.text(`Date: ${paymentDate}`, pageWidth - 70, 50);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Received From:", 20, 65);
    doc.setFont("helvetica", "normal");
    doc.text(charge.lodger_profiles?.full_name || "Lodger", 20, 72);
    
    doc.setFont("helvetica", "bold");
    doc.text("Property:", pageWidth - 70, 65);
    doc.setFont("helvetica", "normal");
    const address = charge.properties?.address_line1 || charge.properties?.property_name || "";
    doc.text(address, pageWidth - 70, 72);
    if (charge.properties?.postcode) {
        doc.text(charge.properties.postcode, pageWidth - 70, 77);
    }

    const startY = 90;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, startY, pageWidth - 40, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.text("Description", 25, startY + 7);
    doc.text("Amount", pageWidth - 40, startY + 7, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.text(charge.reason || charge.charge_type, 25, startY + 20);
    doc.text(`£${charge.amount.toFixed(2)}`, pageWidth - 40, startY + 20, { align: "right" });

    doc.setLineWidth(0.5);
    doc.line(20, startY + 30, pageWidth - 20, startY + 30);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL PAID", pageWidth - 70, startY + 40);
    doc.text(`£${charge.amount.toFixed(2)}`, pageWidth - 40, startY + 40, { align: "right" });

    doc.setFontSize(14);
    doc.setTextColor(0, 128, 0); 
    doc.text("PAID IN FULL", pageWidth / 2, startY + 60, { align: "center" });
    
    doc.save(`Receipt_${paymentRef}.pdf`);
    toast.success("Receipt generated");
  };


  // --- HANDLERS ---

  const handleAddCharge = async () => {
    if (!chargeForm.tenancy_id || !chargeForm.amount || !chargeForm.charge_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const selectedTenancy = activeTenancies.find(t => t.id === chargeForm.tenancy_id);
      if (!selectedTenancy) throw new Error("Invalid tenancy selected");

      const dbChargeType = CHARGE_TYPE_MAP[chargeForm.charge_type];
      const chargeReason = chargeForm.description || chargeForm.charge_type;

      // 1. Create the Charge
      const payload = {
        lodger_id: selectedTenancy.lodger_id,
        property_id: selectedTenancy.property_id,
        tenancy_id: selectedTenancy.id,
        amount: parseFloat(chargeForm.amount),
        charge_type: dbChargeType, 
        reason: chargeReason, 
        charge_status: 'pending',
        due_date: chargeForm.due_date,
        created_at: new Date().toISOString()
      };

      const { error: chargeError } = await supabase.from('extra_charges').insert(payload);
      if (chargeError) throw chargeError;

      // 2. CREATE NOTIFICATION FOR LODGER
      if (selectedTenancy.user_id) {
        console.log("Attempting to send notification to:", selectedTenancy.user_id);
        
        const { error: notifError } = await supabase.from('notifications').insert({
            recipient_id: selectedTenancy.user_id, // From tenancy query
            subject: 'New Extra Charge Added',
            message_body: `A new charge of £${chargeForm.amount} for "${chargeReason}" has been added to your account.`,
            notification_type: 'in_app', // Required
            priority: 'medium', // Likely Required
            
            created_at: new Date().toISOString()
        });
        
        if (notifError) {
            console.error("Failed to send notification:", notifError);
            toast.error("Charge created, but notification failed: " + notifError.message);
        } else {
            console.log("Notification sent successfully");
        }
      } else {
          console.warn("Could not send notification: No user_id found for this lodger.");
          toast.warning("Charge created, but lodger has no linked user account for notifications.");
      }

      toast.success("Charge added successfully");
      setDialogOpen(false);
      setChargeForm({
        tenancy_id: "",
        amount: "",
        charge_type: "",
        due_date: format(new Date().setDate(new Date().getDate() + 7), 'yyyy-MM-dd'),
        description: ""
      });
      fetchData();

    } catch (error: any) {
      console.error("Add Charge Error:", error);
      toast.error("Failed to add charge: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (charge: ExtraCharge, newStatus: string) => {
    if (newStatus === 'paid') {
      setSaving(true);
      try {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); 
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); 
        const paymentRef = `PAY-${dateStr}-${randomSuffix}`;

        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .insert({
            tenancy_id: charge.tenancy_id || null,
            lodger_id: charge.lodger_id,
            property_id: charge.property_id,
            amount: charge.amount,
            payment_type: 'extra_charge',
            payment_status: 'completed',
            payment_date: new Date().toISOString(),
            payment_method: 'bank_transfer', 
            payment_reference: paymentRef,
            description: `Payment for charge: ${charge.reason || charge.charge_type}` 
          })
          .select('id')
          .single();

        if (paymentError) throw paymentError;

        const { error: updateError } = await supabase
          .from('extra_charges')
          .update({ 
            charge_status: 'paid',
            payment_id: paymentData.id 
          })
          .eq('id', charge.id);

        if (updateError) throw updateError;

        toast.success(`Payment recorded (Ref: ${paymentRef})`);
        fetchData();

      } catch (error: any) {
        console.error("Payment creation failed:", error);
        toast.error("Failed to record payment: " + error.message);
      } finally {
        setSaving(false);
      }
    } 
    else {
      try {
        const { error } = await supabase
          .from('extra_charges')
          .update({ charge_status: newStatus })
          .eq('id', charge.id);

        if (error) throw error;
        toast.success(`Charge marked as ${newStatus}`);
        fetchData();
      } catch (error: any) {
        toast.error("Update failed: " + error.message);
      }
    }
  };

  const handleDeleteCharge = async (chargeId: string) => {
    if (!window.confirm("Are you sure you want to delete this charge?")) return;
    try {
      const { error } = await supabase.from('extra_charges').delete().eq('id', chargeId);
      if (error) throw error;
      toast.success("Charge deleted");
      fetchData();
    } catch (error: any) {
      toast.error("Delete failed: " + error.message);
    }
  };

  // --- RENDERING ---

  const totalOutstanding = charges
    .filter(c => ['pending', 'overdue', 'disputed'].includes(c.charge_status))
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalPaid = charges
    .filter(c => c.charge_status === 'paid')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Charges...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Extra Charges System</h2>
          <p className="text-muted-foreground">Manage additional charges for lodgers</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Charge
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 p-3 rounded-full">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">£{totalOutstanding.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-3 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">£{totalPaid.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Paid (All Time)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{charges.length}</p>
                <p className="text-sm text-muted-foreground">Total Charges</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Charges List */}
      <Card>
        <CardHeader>
          <CardTitle>All Extra Charges</CardTitle>
          <CardDescription>Recent charge history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {charges.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No extra charges found.</p>
            ) : (
                charges.map((charge) => {
                    const lodgerName = charge.lodger_profiles?.full_name || "Unknown Lodger";
                    const propertyName = charge.properties?.property_name || "Unknown Property";

                    let badgeVariant: "destructive" | "default" | "secondary" = "secondary";
                    if (['pending', 'overdue'].includes(charge.charge_status)) badgeVariant = "destructive";
                    else if (charge.charge_status === 'paid') badgeVariant = "default";

                    return (
                      <Card key={charge.id} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{lodgerName}</h4>
                                <Badge variant={badgeVariant} className="capitalize">
                                  {charge.charge_status.replace(/_/g, ' ')}
                                </Badge>
                                {charge.charge_status === 'paid' && (
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-6 gap-1 text-xs"
                                        onClick={() => generateReceipt(charge)}
                                    >
                                        <FileText className="w-3 h-3" /> Receipt
                                    </Button>
                                )}
                              </div>
                              <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground mt-2">
                                <p><span className="font-medium text-foreground">Property:</span> {propertyName}</p>
                                <p><span className="font-medium text-foreground">Reason:</span> {charge.reason}</p>
                                <p><span className="font-medium text-foreground">Amount:</span> <span className="text-lg font-bold text-primary">£{charge.amount}</span></p>
                                <p className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Due: {new Date(charge.due_date).toLocaleDateString()}
                                </p>
                                <p>Added: {new Date(charge.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 ml-4">
                              {['pending', 'overdue', 'disputed'].includes(charge.charge_status) && (
                                <>
                                  <Button size="sm" onClick={() => handleUpdateStatus(charge, 'paid')} disabled={saving}>
                                    {saving ? "..." : "Mark Paid"}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(charge, 'waived')} disabled={saving}>
                                    Waive
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteCharge(charge.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charge Reasons Reference & Dialog Components */}
      <Card>
        <CardHeader>
          <CardTitle>Common Charge Reasons</CardTitle>
          <CardDescription>Standard categories for extra charges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {CHARGE_REASONS.map((reason, index) => (
              <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-secondary/80" onClick={() => {
                  setChargeForm(f => ({ ...f, charge_type: reason }));
                  setDialogOpen(true);
              }}>
                {reason}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Charge Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Charge</DialogTitle>
            <DialogDescription>Create a charge record for an active lodger.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Select Lodger (Active Tenancy)</label>
                <Select 
                    value={chargeForm.tenancy_id} 
                    onValueChange={(v) => setChargeForm(f => ({ ...f, tenancy_id: v }))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Search lodger..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                        {activeTenancies.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                                {t.lodger_name} — {t.property_name} ({t.room_number})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Charge Reason</label>
                <Select 
                    value={chargeForm.charge_type} 
                    onValueChange={(v) => setChargeForm(f => ({ ...f, charge_type: v }))}
                >
                    <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                    <SelectContent>
                        {CHARGE_REASONS.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Description / Details</label>
                <Input 
                    placeholder="Specific details (optional)" 
                    value={chargeForm.description}
                    onChange={e => setChargeForm(f => ({ ...f, description: e.target.value }))}
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Amount (£)</label>
                <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00"
                    value={chargeForm.amount}
                    onChange={e => setChargeForm(f => ({ ...f, amount: e.target.value }))}
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input 
                    type="date"
                    value={chargeForm.due_date}
                    onChange={e => setChargeForm(f => ({ ...f, due_date: e.target.value }))}
                />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCharge} disabled={saving}>
                {saving ? "Creating..." : "Create Charge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ExtraCharges;