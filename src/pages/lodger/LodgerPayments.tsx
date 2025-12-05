import { Bell, User, LogOut, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/mobile/BottomNav";

const LodgerPayments = () => {
  const { logout, user } = useAuth();

  const payments = [
    { date: "01 Dec 2024", amount: "£750.00", status: "Paid", method: "Card", reference: "PAY-2024-12-001" },
    { date: "01 Nov 2024", amount: "£750.00", status: "Paid", method: "Bank Transfer", reference: "PAY-2024-11-001" },
    { date: "01 Oct 2024", amount: "£750.00", status: "Paid", method: "Card", reference: "PAY-2024-10-001" },
    { date: "01 Sep 2024", amount: "£750.00", status: "Paid", method: "Card", reference: "PAY-2024-09-001" },
    { date: "01 Aug 2024", amount: "£750.00", status: "Paid", method: "Bank Transfer", reference: "PAY-2024-08-001" },
  ];

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
              <div className="space-y-4">
                {payments.map((payment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-elegant transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{payment.date}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.method} • {payment.reference}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{payment.amount}</p>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        {payment.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-4">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
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
