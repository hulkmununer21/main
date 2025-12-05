import { Bell, LogOut, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Badge } from "@/components/ui/badge";

const LandlordFinancials = () => {
  const { logout } = useAuth();

  const transactions = [
    { id: 1, tenant: "John Smith", property: "Modern City Centre Studio", amount: 750, type: "Rent", date: "01 Dec 2024", status: "Completed" },
    { id: 2, tenant: "Sarah Johnson", property: "Riverside Apartment", amount: 950, type: "Rent", date: "01 Dec 2024", status: "Completed" },
    { id: 3, tenant: "Maintenance", property: "Cozy 1-Bed Flat", amount: 150, type: "Expense", date: "28 Nov 2024", status: "Completed" },
    { id: 4, tenant: "John Smith", property: "Modern City Centre Studio", amount: 750, type: "Rent", date: "01 Nov 2024", status: "Completed" },
    { id: 5, tenant: "Insurance", property: "All Properties", amount: 200, type: "Expense", date: "15 Nov 2024", status: "Completed" },
  ];

  const totalIncome = transactions.filter(t => t.type === "Rent").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "Expense").reduce((sum, t) => sum + t.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  return (
    <>
      <SEO 
        title="Financials - Landlord Portal"
        description="View financial reports and transaction history"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold">Financials</h1>
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

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-600 border-0">+12%</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Income</p>
                <p className="text-3xl font-bold">£{totalIncome.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
                    <DollarSign className="h-5 w-5 text-red-600" />
                  </div>
                  <Badge className="bg-red-100 text-red-600 border-0">-8%</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-3xl font-bold">£{totalExpenses.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-600 border-0">+15%</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Net Income</p>
                <p className="text-3xl font-bold">£{netIncome.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${transaction.type === "Rent" ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}>
                        {transaction.type === "Rent" ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.tenant}</p>
                        <p className="text-sm text-muted-foreground">{transaction.property}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.type === "Rent" ? "text-green-600" : "text-red-600"}`}>
                        {transaction.type === "Rent" ? "+" : "-"}£{transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="h-20 md:h-0"></div>
        </div>
      </div>
      <BottomNav role="landlord" />
    </>
  );
};

export default LandlordFinancials;
