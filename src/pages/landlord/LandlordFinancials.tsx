import { useState, useEffect, useCallback } from "react";
import { 
  Bell, LogOut, DollarSign, TrendingUp, Loader2, 
  CheckCircle, AlertCircle, FileText, Calendar as CalendarIcon,
  ArrowUpRight, ArrowDownRight, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { format, parseISO } from "date-fns";

// === TYPES ===
interface FinancialRecord {
  id: string;
  type: 'Payment' | 'Charge';
  category: string; // Rent, Late Fee, etc.
  payer_name: string;
  property_name: string;
  room_number?: string;
  amount: number;
  status: string;
  date: string;
  reference?: string;
}

const LandlordFinancials = () => {
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [transactions, setTransactions] = useState<FinancialRecord[]>([]);
  const [stats, setStats] = useState({ 
    totalIncome: 0, 
    outstanding: 0, 
    netIncome: 0 
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Get Landlord ID
      const { data: landlordProfile, error: profileError } = await supabase
        .from('landlord_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !landlordProfile) {
        setLoading(false);
        return;
      }

      // 2. Fetch Landlord's Properties
      const { data: props } = await supabase
        .from('properties')
        .select('id, property_name')
        .eq('landlord_id', landlordProfile.id);
      
      const propIds = props?.map(p => p.id) || [];

      if (propIds.length > 0) {
        // 3. Fetch Payments (Rent, Utilities, etc.)
        const { data: payments } = await supabase
          .from('payments')
          .select('*, lodger_profiles(full_name), properties(property_name), rooms(room_number)')
          .in('property_id', propIds)
          .order('created_at', { ascending: false });

        // 4. Fetch Extra Charges (Ad-hoc revenue)
        const { data: charges } = await supabase
          .from('extra_charges')
          .select('*, properties(property_name)')
          .in('property_id', propIds)
          .order('created_at', { ascending: false });

        // 5. Merge & Normalize Data
        const paymentRecords: FinancialRecord[] = (payments || []).map((p: any) => ({
          id: p.id,
          type: 'Payment',
          category: p.payment_type || 'Rent',
          payer_name: p.lodger_profiles?.full_name || 'Unknown Lodger',
          property_name: p.properties?.property_name || 'Unknown Property',
          room_number: p.rooms?.room_number,
          amount: Number(p.amount),
          status: p.payment_status,
          date: p.payment_date || p.created_at,
          reference: p.payment_reference
        }));

        const chargeRecords: FinancialRecord[] = (charges || []).map((c: any) => ({
          id: c.id,
          type: 'Charge',
          category: c.charge_type || 'Extra Fee',
          payer_name: 'Tenant Charge', // Schema might not link charge directly to lodger name
          property_name: c.properties?.property_name || 'Unknown Property',
          amount: Number(c.amount),
          status: c.charge_status === 'paid' ? 'completed' : c.charge_status, // Normalize status
          date: c.created_at
        }));

        const allTransactions = [...paymentRecords, ...chargeRecords].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setTransactions(allTransactions);

        // 6. Calculate Totals
        const income = allTransactions
          .filter(t => t.status === 'completed' || t.status === 'paid')
          .reduce((sum, t) => sum + t.amount, 0);

        const outstanding = allTransactions
          .filter(t => ['pending', 'overdue', 'failed'].includes(t.status))
          .reduce((sum, t) => sum + t.amount, 0);

        setStats({
          totalIncome: income,
          outstanding: outstanding,
          netIncome: income // Assuming expenses aren't tracked yet
        });
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

  // --- HELPERS ---
  const getStatusVariant = (status: string) => {
    switch(status) {
        case 'completed': 
        case 'paid': return 'default'; // Greenish usually handled by CSS or default variant
        case 'pending': return 'secondary';
        case 'overdue': 
        case 'failed': return 'destructive';
        default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
      if (['completed', 'paid'].includes(status)) return "text-green-600 bg-green-50 border-green-200";
      if (['pending'].includes(status)) return "text-orange-600 bg-orange-50 border-orange-200";
      if (['overdue', 'failed'].includes(status)) return "text-red-600 bg-red-50 border-red-200";
      return "text-gray-600 bg-gray-50 border-gray-200";
  };

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
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold">Financials</h1>
                <p className="text-sm text-muted-foreground">Portfolio Performance</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" onClick={logout}><LogOut className="h-5 w-5" /></Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-600 border-0 pointer-events-none">Received</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Income</p>
                <p className="text-3xl font-bold">£{stats.totalIncome.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <Badge className="bg-red-100 text-red-600 border-0 pointer-events-none">Pending</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Outstanding</p>
                <p className="text-3xl font-bold">£{stats.outstanding.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-600 border-0 pointer-events-none">Net</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Net Income</p>
                <p className="text-3xl font-bold">£{stats.netIncome.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Transaction List */}
          <Card>
            <CardHeader className="border-b bg-muted/20">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <CardTitle>Financial Overview</CardTitle>
                    <CardDescription>All payments and charges across your properties</CardDescription>
                </div>
                <Button variant="outline" size="sm" disabled><Filter className="w-4 h-4 mr-2"/> Filter</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                    <FileText className="h-10 w-10 mb-2 opacity-20" />
                    <p>No financial records found.</p>
                  </div>
                ) : (
                  transactions.map((t) => (
                    <div key={t.id} className="p-4 hover:bg-muted/5 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Left Info */}
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 p-2 rounded-full ${t.type === 'Payment' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                {t.type === 'Payment' ? <ArrowUpRight className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-base">{t.payer_name}</h4>
                                    <Badge variant="outline" className="text-xs">{t.category}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-0.5">
                                    <p className="flex items-center gap-1">
                                        <span className="font-medium text-foreground">{t.property_name}</span>
                                        {t.room_number && <span>(Room {t.room_number})</span>}
                                    </p>
                                    <p className="flex items-center gap-1 text-xs">
                                        <CalendarIcon className="w-3 h-3" /> 
                                        {format(parseISO(t.date), 'PPP')}
                                    </p>
                                    {t.reference && <p className="text-xs">Ref: {t.reference}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Right Info (Amount & Status) */}
                        <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-2 md:gap-1">
                            <div className="text-right">
                                <p className={`text-lg font-bold ${t.type === 'Payment' ? 'text-green-600' : 'text-orange-600'}`}>
                                    £{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <Badge variant="outline" className={`capitalize ${getStatusColor(t.status)}`}>
                                {t.status}
                            </Badge>
                        </div>

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