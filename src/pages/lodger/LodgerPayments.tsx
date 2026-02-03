import { useState, useEffect } from "react";
import { Bell, LogOut, Download, Check, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/mobile/BottomNav";
import { LodgerProfile } from "@/contexts/AuthContextTypes";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { format, parseISO } from "date-fns";
import { jsPDF } from "jspdf";

const LodgerPayments = () => {
  const { logout, user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const lodgerProfile = user?.profile as LodgerProfile;

  // ✅ Updated Interface to match Supabase Join Response
  interface Payment {
    id: string;
    amount: number;
    payment_date: string;
    payment_status: string;
    payment_method?: string;
    payment_reference?: string;
    payment_type?: string; // Added to distinguish Rent vs Deposit
    // Relations
    properties?: {
      property_name: string;
    } | null;
    rooms?: {
      room_number: string;
    } | null;
  }

  useEffect(() => {
    const fetchPayments = async () => {
      if (!lodgerProfile?.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('payments')
          .select(`
            *,
            properties (property_name),
            rooms (room_number)
          `)
          .eq('lodger_id', lodgerProfile.id)
          .order('payment_date', { ascending: false });
        
        if (error) {
          console.error("Error fetching payments:", error);
          toast.error("Could not load payment history.");
        } else {
          setPayments(data as unknown as Payment[] || []);
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [lodgerProfile?.id]);

  // ✅ RECEIPT GENERATION LOGIC
  const generateReceipt = (payment: Payment) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- 1. HEADER & LOGO ---
    // Note: In production, convert your imported 'logo' to base64. 
    // Here we assume 'logo' is a usable path. If it fails, use a base64 string.
    try {
        doc.addImage(logo, 'PNG', (pageWidth / 2) - 15, 10, 30, 30); 
    } catch (e) {
        console.warn("Logo load failed, skipping image");
    }

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("DEPOSIT RECEIPT", pageWidth / 2, 50, { align: "center" });

    // --- 2. METADATA ---
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    
    let yPos = 65;
    const lineHeight = 8;

    doc.text(`Receipt No: ${payment.payment_reference || `DOM/LDG/${new Date().getFullYear()}/${payment.id.substring(0,4)}`}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Date: ${format(parseISO(payment.payment_date), 'd/MM/yyyy')}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Received From: ${lodgerProfile?.full_name || "Lodger"}`, 20, yPos);
    yPos += lineHeight;
    // Assuming address is in profile or using property address
    doc.text(`Street Address: ${payment.properties?.property_name || "Address on File"}`, 20, yPos);
    yPos += lineHeight;
    // Assuming Room as secondary address identifier
    doc.text(`Details: Room ${payment.rooms?.room_number || "N/A"}`, 20, yPos);

    // --- 3. VALUE ---
    yPos += 15;
    doc.setFont("times", "bold");
    doc.text("Deposit Value", 20, yPos);
    doc.setFont("times", "normal");
    yPos += lineHeight;
    doc.text(`This receipt is for the deposit of £${Number(payment.amount).toFixed(2)} Great British Pounds in the form of`, 20, yPos);
    
    // --- 4. PAYMENT METHOD ---
    yPos += lineHeight;
    const method = payment.payment_method?.toLowerCase() || "";
    
    // Checkboxes
    doc.rect(20, yPos - 4, 4, 4); // Box 1
    if (method.includes('check') || method.includes('cheque')) doc.text("x", 21, yPos - 1);
    doc.text("Check", 28, yPos);

    doc.rect(60, yPos - 4, 4, 4); // Box 2
    if (method.includes('cash')) doc.text("x", 61, yPos - 1);
    doc.text("Cash Deposit", 68, yPos);

    doc.rect(110, yPos - 4, 4, 4); // Box 3
    if (!method.includes('check') && !method.includes('cash')) doc.text("x", 111, yPos - 1);
    doc.text(`Other: ${!method.includes('check') && !method.includes('cash') ? (payment.payment_method || "Transfer") : "_______________________"}`, 118, yPos);

    // --- 5. DEPOSIT TYPE ---
    yPos += 15;
    doc.setFont("times", "bold");
    doc.text("Deposit Type", 20, yPos);
    doc.setFont("times", "normal");
    yPos += lineHeight;
    
    // Dynamic text based on payment type (Rent vs Security)
    const isRent = payment.payment_type?.toLowerCase() === 'rent';
    const typeText = isRent ? `Payment is for: Rent (${format(parseISO(payment.payment_date), 'MMMM yyyy')})` : "Deposit is for: Security & Damage";
    doc.text(typeText, 20, yPos);
    
    yPos += lineHeight;
    doc.text(`This deposit is  x Refundable  _ Non-Refundable (Condition applied)`, 20, yPos);

    // --- 6. LEGAL TEXT (Strictly from Doc) ---
    yPos += 15;
    const legalText = [
        "This deposit is held in relation to a lodger license agreement and is not subject to the Housing Act 2004 tenancy deposit regulations.",
        `This deposit is associated with the lodging agreement dated ${format(parseISO(payment.payment_date), 'd/MM/yyyy')} between the parties.`, // Using payment date as proxy if move-in unavailable
        "This deposit will be refunded at the end of the lodging term, subject to no breach of the agreement or damage to the premises, as detailed in the Lodging Agreement.",
        "Note: The above amount has been received and will be held securely by Domus Manutentio et Servitia Ltd for the duration of the lodger’s stay, subject to the conditions outlined in the Lodging Agreement.",
        "This receipt was automatically generated and issued by Domus Manutentio et Servitia Ltd as confirmation of funds received on the date stated above.",
        "By proceeding with the agreement on the lodging agreement, the lodger acknowledges and agrees to the terms associated with this deposit."
    ];

    doc.setFontSize(10);
    legalText.forEach(text => {
        const splitText = doc.splitTextToSize(text, pageWidth - 40);
        doc.text(splitText, 20, yPos);
        yPos += (splitText.length * 5) + 3;
    });

    // --- 7. FOOTER ---
    yPos += 10;
    doc.setFont("times", "bold");
    doc.text("Contact Us", 20, yPos);
    yPos += 6;
    doc.setFont("times", "normal");
    doc.text("If you have any questions or concerns, contact:", 20, yPos);
    yPos += 6;
    doc.setFont("times", "bold");
    doc.text("Domus Manutentio et Servitia Ltd", 20, yPos);
    doc.setFont("times", "normal");
    yPos += 5;
    doc.text("Registration No: 16395957", 20, yPos);
    yPos += 5;
    doc.text("Address: Liana Gardens, Wolverhampton WV2 2AD", 20, yPos);
    yPos += 5;
    doc.text("Phone: 01902 214066   Email: info@domusservitia.uk", 20, yPos);

    // Save
    doc.save(`Receipt_${payment.payment_reference || payment.id}.pdf`);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50"><Check className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50"><XCircle className="h-3 w-3 mr-1" /> Overdue</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  return (
    <>
      <SEO 
        title="Payments - Lodger Portal"
        description="View your payment history and manage rent payments"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Payments</h1>
                <p className="text-sm text-muted-foreground">Financial overview</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Payment History */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View all your transaction records</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 animate-spin mb-2 opacity-50" />
                    <p>Loading history...</p>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No payment records found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/40 transition-all gap-4 bg-card"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                            {payment.payment_date 
                                ? format(parseISO(payment.payment_date), 'dd MMM yyyy')
                                : "Date N/A"}
                            </span>
                            {getPaymentStatusBadge(payment.payment_status)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:gap-4">
                            <span>Ref: {payment.payment_reference || "N/A"}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{payment.payment_method || "Bank Transfer"}</span>
                        </div>

                        {(payment.properties?.property_name || payment.rooms?.room_number) && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <BuildingIcon className="h-3 w-3"/>
                            {payment.properties?.property_name || "Unknown Property"} 
                            {payment.rooms?.room_number ? ` (Room ${payment.rooms.room_number})` : ""}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                        <p className="font-bold text-lg">
                          £{Number(payment.amount).toFixed(2)}
                        </p>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => generateReceipt(payment)}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom padding for mobile nav */}
          <div className="h-20 md:h-0"></div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav role="lodger" />
    </>
  );
};

// Helper Icon Component
const BuildingIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>
);

export default LodgerPayments;