import { useState, useEffect } from "react";
import { DollarSign, CheckCircle, AlertCircle, Loader2, Calendar as CalendarIcon, FileText, Zap, Search, Pencil, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { toast } from "sonner";
import { format, parseISO, isPast, isSameMonth } from "date-fns";
import { jsPDF } from "jspdf";
import logo from "@/assets/logo.png";

interface Payment {
  id: string;
  lodger_id: string;
  property_id?: string;
  room_id?: string;
  payment_type: string;
  amount: number;
  payment_method?: string;
  due_date: string | null;
  payment_date?: string | null;
  payment_status: 'pending' | 'completed' | 'cancelled' | 'failed' | 'overdue'; 
  payment_reference?: string;
  lodger_profiles?: { full_name: string };
  properties?: { property_name: string };
  rooms?: { room_number: string };
}

const PaymentsBilling = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ received: 0, outstanding: 0, activeInvoices: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModifyOpen, setIsModifyOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<string>("pending");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentRefInput, setPaymentRefInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('payments').select(`*, lodger_profiles(full_name), properties(property_name), rooms(room_number)`).order('due_date', { ascending: false });
      if (error) throw error;
      const fetchedPayments = data as Payment[];
      setPayments(fetchedPayments);

      const now = new Date();
      let received = 0;
      let outstanding = 0;
      fetchedPayments.forEach(p => {
        const val = Number(p.amount) || 0;
        if (p.payment_status === 'completed') {
          const dateToCheck = p.payment_date || (p as any).updated_at;
          if (dateToCheck && isSameMonth(parseISO(dateToCheck), now)) received += val;
        } else if (['pending', 'overdue'].includes(p.payment_status)) {
          outstanding += val;
        }
      });
      setStats({ received, outstanding, activeInvoices: fetchedPayments.filter(p => p.payment_status !== 'completed' && p.payment_status !== 'cancelled').length });
    } catch (err) { console.error(err); toast.error("Failed to load payments."); } finally { setLoading(false); }
  };

  // ✅ FIXED: Robust Receipt Generation (Admin)
  const generateReceipt = (payment: Payment) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxLineWidth = pageWidth - (margin * 2);
    
    let yPos = 20;

    // 1. Logo
    try { 
        doc.addImage(logo, 'PNG', (pageWidth / 2) - 15, yPos, 30, 30); 
        yPos += 35;
    } catch (e) {
        yPos += 10;
    }

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("DEPOSIT RECEIPT", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // 2. Metadata
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    const lineHeight = 7;

    const receiptDate = payment.payment_date ? format(parseISO(payment.payment_date), 'd/MM/yyyy') : format(new Date(), 'd/MM/yyyy');

    doc.text(`Receipt No: ${payment.payment_reference || `DOM/LDG/${new Date().getFullYear()}/${payment.id.substring(0,4)}`}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Date: ${receiptDate}`, margin, yPos);
    yPos += lineHeight;

    const nameText = `Received From: ${payment.lodger_profiles?.full_name || "Lodger"}`;
    doc.text(doc.splitTextToSize(nameText, maxLineWidth), margin, yPos);
    yPos += lineHeight * (doc.splitTextToSize(nameText, maxLineWidth).length);

    const addressText = `Street Address: ${payment.properties?.property_name || "Address on File"}`;
    doc.text(doc.splitTextToSize(addressText, maxLineWidth), margin, yPos);
    yPos += lineHeight * (doc.splitTextToSize(addressText, maxLineWidth).length);

    doc.text(`City, State, Zip: Wolverhampton (Ref Room ${payment.rooms?.room_number || "N/A"})`, margin, yPos);
    yPos += 12;

    // 3. Value
    doc.setFont("times", "bold");
    doc.text("Deposit Value", margin, yPos);
    yPos += lineHeight;
    doc.setFont("times", "normal");
    doc.text(`This receipt is for the deposit of £${Number(payment.amount).toFixed(2)} Great British Pounds in the form of`, margin, yPos);
    yPos += lineHeight;
    
    // 4. Method (Dynamic positioning)
    const method = payment.payment_method?.toLowerCase() || "";
    let currentX = margin;

    // Checkbox 1
    doc.rect(currentX, yPos - 4, 4, 4); 
    if (method.includes('check') || method.includes('cheque')) doc.text("x", currentX + 1, yPos - 1);
    doc.text("Check", currentX + 6, yPos);
    currentX += doc.getTextWidth("Check") + 20; 

    // Checkbox 2
    doc.rect(currentX, yPos - 4, 4, 4);
    if (method.includes('cash')) doc.text("x", currentX + 1, yPos - 1);
    doc.text("Cash Deposit", currentX + 6, yPos);
    currentX += doc.getTextWidth("Cash Deposit") + 20;

    // Checkbox 3
    doc.rect(currentX, yPos - 4, 4, 4);
    if (!method.includes('check') && !method.includes('cash')) doc.text("x", currentX + 1, yPos - 1);
    const otherTextPrefix = "Other: ";
    doc.text(otherTextPrefix, currentX + 6, yPos);
    const otherValue = !method.includes('check') && !method.includes('cash') ? (payment.payment_method || "Transfer") : "________________";
    
    // Ensure "Other" value wraps if needed
    const availableWidth = pageWidth - (currentX + 6 + doc.getTextWidth(otherTextPrefix)) - margin;
    const splitOther = doc.splitTextToSize(otherValue, availableWidth);
    doc.text(splitOther, currentX + 6 + doc.getTextWidth(otherTextPrefix), yPos);
    yPos += 12;

    // 5. Type
    doc.setFont("times", "bold");
    doc.text("Deposit Type", margin, yPos);
    yPos += lineHeight;
    doc.setFont("times", "normal");
    const isRent = payment.payment_type?.toLowerCase() === 'rent';
    doc.text(isRent ? `Payment is for: Rent` : "Deposit is for: Security & Damage", margin, yPos);
    yPos += lineHeight;
    doc.text(`This deposit is  x Refundable  _ Non-Refundable (Condition applied)`, margin, yPos);
    yPos += 12;

    // 6. Legal Text
    const legalText = [
        "This deposit is held in relation to a lodger license agreement and is not subject to the Housing Act 2004 tenancy deposit regulations.",
        `This deposit is associated with the lodging agreement dated ${receiptDate} between the parties.`,
        "This deposit will be refunded at the end of the lodging term, subject to no breach of the agreement or damage to the premises, as detailed in the Lodging Agreement.",
        "Note: The above amount has been received and will be held securely by Domus Manutentio et Servitia Ltd for the duration of the lodger’s stay, subject to the conditions outlined in the Lodging Agreement.",
        "This receipt was automatically generated and issued by Domus Manutentio et Servitia Ltd as confirmation of funds received on the date stated above.",
        "By proceeding with the agreement on the lodging agreement, the lodger acknowledges and agrees to the terms associated with this deposit."
    ];

    doc.setFontSize(10);
    const legalLineHeight = 5;

    legalText.forEach(text => {
        if (yPos > pageHeight - 50) { 
            doc.addPage();
            yPos = 20; 
        }
        const splitText = doc.splitTextToSize(text, maxLineWidth);
        doc.text(splitText, margin, yPos);
        yPos += (splitText.length * legalLineHeight) + 3;
    });

    // 7. Footer
    if (yPos > pageHeight - 45) {
        doc.addPage();
        yPos = 20;
    } else {
        yPos += 5;
    }

    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFont("times", "bold");
    doc.text("Contact Us", margin, yPos);
    yPos += 6;
    doc.setFont("times", "normal");
    doc.text("If you have any questions or concerns, contact:", margin, yPos);
    yPos += 6;
    doc.setFont("times", "bold");
    doc.text("Domus Manutentio et Servitia Ltd", margin, yPos);
    yPos += 5;
    doc.setFont("times", "normal");
    doc.text("Registration No: 16395957", margin, yPos);
    yPos += 5;
    doc.text("Address: Liana Gardens, Wolverhampton WV2 2AD", margin, yPos);
    yPos += 5;
    doc.text("Phone: 01902 214066   Email: info@domusservitia.uk", margin, yPos);

    doc.save(`Receipt_${payment.payment_reference || payment.id}.pdf`);
  };

  const handleOpenModify = (payment: Payment) => {
    setSelectedPayment(payment);
    setStatusUpdate(payment.payment_status);
    setPaymentMethod(payment.payment_method || "Bank Transfer");
    setPaymentRefInput(payment.payment_reference || "");
    setIsModifyOpen(true);
  };

  const handleModifyPayment = async () => {
    if (!selectedPayment) return;
    setSubmitting(true);
    try {
      const updates: any = { payment_status: statusUpdate, updated_at: new Date().toISOString() };
      if (statusUpdate === 'completed') {
        updates.payment_date = new Date().toISOString();
        updates.payment_method = paymentMethod;
        updates.payment_reference = paymentRefInput;
      } else if(statusUpdate === 'pending') {
        updates.payment_date = null;
      }
      const { error } = await supabase.from('payments').update(updates).eq('id', selectedPayment.id);
      if (error) throw error;
      toast.success(`Payment marked as ${statusUpdate}`);
      setIsModifyOpen(false);
      fetchData();
    } catch (err: any) { toast.error("Update failed: " + err.message); } finally { setSubmitting(false); }
  };

  const filteredPayments = payments.filter(p => {
    const term = searchTerm.toLowerCase();
    const lodger = p.lodger_profiles?.full_name?.toLowerCase() || "";
    const ref = p.payment_reference?.toLowerCase() || "";
    const prop = p.properties?.property_name?.toLowerCase() || "";
    return lodger.includes(term) || ref.includes(term) || prop.includes(term);
  });

  const getStatusVariant = (p: Payment) => {
    switch(p.payment_status) {
        case 'completed': return 'default';
        case 'cancelled': return 'secondary';
        case 'failed': return 'destructive';
        case 'pending':
            if (p.due_date && isPast(parseISO(p.due_date)) && !isSameMonth(parseISO(p.due_date), new Date())) return 'destructive';
            return 'outline';
        default: return 'outline';
    }
  };

  const getStatusLabel = (p: Payment) => {
    if (p.payment_status === 'pending' && p.due_date) {
        if (isPast(parseISO(p.due_date)) && !isSameMonth(parseISO(p.due_date), new Date())) return "Overdue";
    }
    return p.payment_status;
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-foreground mb-2">Payments & Billing</h2><p className="text-muted-foreground">Manage rent, deposits, utilities, and payment tracking</p></div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6 flex items-center gap-3"><div className="bg-green-100 p-3 rounded-full text-green-600"><CheckCircle className="w-5 h-5"/></div><div><p className="text-2xl font-bold">£{stats.received.toLocaleString()}</p><p className="text-sm text-muted-foreground">Received This Month</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-3"><div className="bg-red-100 p-3 rounded-full text-red-600"><AlertCircle className="w-5 h-5"/></div><div><p className="text-2xl font-bold">£{stats.outstanding.toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Outstanding</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-3"><div className="bg-blue-100 p-3 rounded-full text-blue-600"><FileText className="w-5 h-5"/></div><div><p className="text-2xl font-bold">{stats.activeInvoices}</p><p className="text-sm text-muted-foreground">Active Invoices</p></div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><CardTitle>Payment Tracking</CardTitle><div className="flex items-center gap-2 w-full md:w-auto"><div className="relative flex-1 md:w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div></div></div></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPayments.length === 0 ? <p className="text-center py-8 text-muted-foreground">No payments found.</p> : 
            filteredPayments.map((payment) => (
              <Card key={payment.id} className="border-border hover:bg-muted/5 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2"><h4 className="font-semibold text-lg">{payment.lodger_profiles?.full_name || "Unknown"}</h4><Badge variant="outline">{payment.payment_type}</Badge><Badge variant={getStatusVariant(payment)} className="capitalize">{getStatusLabel(payment)}</Badge></div>
                      <div className="grid md:grid-cols-2 gap-x-8 gap-y-1 text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground">Property:</span> {payment.properties?.property_name || 'N/A'}</p>
                        <p><span className="font-medium text-foreground">Room:</span> {payment.rooms?.room_number ? `Room ${payment.rooms.room_number}` : 'N/A'}</p>
                        <p><span className="font-medium text-foreground">Amount:</span> <span className="text-lg font-bold text-primary">£{Number(payment.amount).toFixed(2)}</span></p>
                        <p className="flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> Due: {payment.due_date ? format(parseISO(payment.due_date), 'MMM d, yyyy') : 'N/A'}</p>
                        {payment.payment_status === 'completed' && (<div className="flex flex-col"><span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Paid: {payment.payment_date ? format(parseISO(payment.payment_date), 'MMM d') : ''}</span>{payment.payment_reference && <span className="text-xs">Ref: {payment.payment_reference}</span>}</div>)}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        {payment.payment_status === 'completed' && <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => generateReceipt(payment)}><Download className="w-4 h-4 mr-2"/> Receipt</Button>}
                        <Button size="sm" variant="outline" onClick={() => handleOpenModify(payment)}><Pencil className="w-4 h-4 mr-2"/> Modify</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Utility Meter Readings</CardTitle><CardDescription>Track gas, electricity, and water consumption</CardDescription></div><Button variant="outline"><Zap className="w-4 h-4 mr-2" /> Add Reading</Button></div></CardHeader>
        <CardContent><div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">Meter reading integration coming soon.</div></CardContent>
      </Card>
      <Dialog open={isModifyOpen} onOpenChange={setIsModifyOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Update Payment Status</DialogTitle><DialogDescription>Change the status of this transaction.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="bg-muted p-3 rounded text-sm mb-2"><p><strong>Lodger:</strong> {selectedPayment?.lodger_profiles?.full_name}</p><p><strong>Current Status:</strong> <span className="capitalize">{selectedPayment?.payment_status}</span></p></div>
                <div className="space-y-2"><Label>New Status</Label><Select value={statusUpdate} onValueChange={setStatusUpdate}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="completed">Completed (Paid)</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select></div>
                {statusUpdate === 'completed' && (<><div className="space-y-2"><Label>Payment Method</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Bank Transfer">Bank Transfer</SelectItem><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Card">Card</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Reference (Optional)</Label><Input placeholder="e.g. TXN-12345" value={paymentRefInput} onChange={e => setPaymentRefInput(e.target.value)} /></div></>)}
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsModifyOpen(false)}>Cancel</Button><Button onClick={handleModifyPayment} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Update Status</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsBilling;