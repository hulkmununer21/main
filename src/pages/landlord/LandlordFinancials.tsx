import { useState, useEffect, useCallback } from "react";
import { Bell, LogOut, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";

const LandlordFinancials = () => {
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const landlordProfileId = (user.profile as any)?.id;
      if (!landlordProfileId) {
        setLoading(false);
        return;
      }

      // Fetch properties
      const { data: props } = await supabase
        .from('properties')
        .select('id, property_name')
        .eq('landlord_id', landlordProfileId);
      
      const propIds = props?.map(p => p.id) || [];

      if (propIds.length > 0) {
        // Fetch extra charges (revenue)
        const { data: charges } = await supabase
          .from('extra_charges')
          .select('*')
          .in('property_id', propIds)
          .order('created_at', { ascending: false });

        // Process charges into transactions
        const chargeTransactions = (charges || []).map((c: any) => {
          const property = props?.find(p => p.id === c.property_id);
          return {
            id: c.id,
            tenant: c.charge_type || 'Charge',
            property: property?.property_name || 'Not allocated',
            amount: c.amount || 0,
            type: 'Income',
            date: new Date(c.created_at).toLocaleDateString(),
            status: c.charge_status === 'paid' ? 'Completed' : 'Pending'
          };
        });

        setTransactions(chargeTransactions);

        // Calculate totals
        const income = charges?.filter(c => c.charge_status === 'paid').reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
        setTotalIncome(income);
        setTotalExpenses(0); // No expense tracking in current schema
      }
    } catch (error) {
      console.error("Error loading financials:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const netIncome = totalIncome - totalExpenses;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

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
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions available</p>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${transaction.type === "Income" ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}>
                          {transaction.type === "Income" ? (
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
                        <p className={`font-semibold ${transaction.type === "Income" ? "text-green-600" : "text-red-600"}`}>
                          {transaction.type === "Income" ? "+" : "-"}£{transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                  ))
                )}
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
