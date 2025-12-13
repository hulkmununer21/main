import { useState, useEffect } from "react";
import { Bell, User, LogOut, Download, Check, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/mobile/BottomNav";
import { LodgerProfile } from "@/contexts/AuthContextTypes";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const LodgerPayments = () => {
  const { logout, user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const lodgerProfile = user?.profile as LodgerProfile;

  interface Payment {
    id: string;
    amount_paid: number;
    payment_date: string;
    payment_status: string;
    payment_method?: string;
    reference?: string;
    payment_reference?: string;
    property?: {
      property_name: string;
    };
    room?: {
      room_number: string;
    };
  }

  useEffect(() => {
    const fetchPayments = async () => {
      if (!lodgerProfile?.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('lodger_id', lodgerProfile.id)
          .order('payment_date', { ascending: false });
        
        if (error) {
          console.error("Error fetching payments:", error);
          toast({
            title: "Error Loading Payments",
            description: "Could not load payment history. Please try again.",
            variant: "destructive",
          });
        } else {
          setPayments(data || []);
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
    switch (status) {
      case 'paid':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Check className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <SEO 
        title="Payments - Lodger Portal - Domus Dwell Manage"
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
                <p className="text-sm text-muted-foreground">View your payment history</p>
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
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View all your rent payment records</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading payment history...</p>
              ) : payments.length === 0 ? (
                <p className="text-muted-foreground">No payment records found.</p>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-elegant transition-all"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {payment.payment_date 
                            ? new Date(payment.payment_date).toLocaleDateString('en-GB', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric' 
                              })
                            : "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.payment_method || "N/A"} • {payment.payment_reference || "No reference"}
                        </p>
                        {payment.property?.property_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {payment.property.property_name} - Room {payment.room?.room_number || "N/A"}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          £{payment.amount_paid?.toFixed(2) || "0.00"}
                        </p>
                        {getPaymentStatusBadge(payment.payment_status)}
                      </div>
                      <Button variant="ghost" size="sm" className="ml-4" title="Download Receipt">
                        <Download className="h-4 w-4" />
                      </Button>
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

export default LodgerPayments;
