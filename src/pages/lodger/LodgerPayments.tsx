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

const LodgerPayments = () => {
  const { logout, user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const lodgerProfile = user?.profile as LodgerProfile;

  // ✅ Updated Interface to match Supabase Join Response
  interface Payment {
    id: string;
    amount: number; // Changed from amount_paid to amount to match standard schema usually
    payment_date: string;
    payment_status: string;
    payment_method?: string;
    payment_reference?: string;
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
        // ✅ Updated Query to fetch related Property and Room names
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
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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