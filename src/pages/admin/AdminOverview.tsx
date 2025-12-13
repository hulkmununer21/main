import { useState, useEffect } from "react";
import { Bell, LogOut, Home, Users, DollarSign, Shield, Activity, Trash2, ClipboardCheck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface AdminStats {
  total_users: number;
  active_lodgers: number;
  active_landlords: number;
  active_staff: number;
  total_properties: number;
  total_rooms: number;
  occupied_rooms: number;
  total_tenancies: number;
  active_tenancies: number;
  total_revenue: number;
  pending_payments: number;
  overdue_payments: number;
}

interface UserSummary {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  full_name?: string;
  created_at: string;
}

const AdminOverview = () => {
  const { logout } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get admin stats
      const [
        { count: totalLodgers },
        { count: totalLandlords },
        { count: totalStaff },
        { count: totalProperties },
        { count: activeTenancies },
        { count: pendingComplaints },
        { data: roomsData },
        { data: paymentsData },
      ] = await Promise.all([
        supabase.from('lodger_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('landlord_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('staff_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('tenancies').select('*', { count: 'exact', head: true }).eq('tenancy_status', 'active'),
        supabase.from('complaints').select('*', { count: 'exact', head: true }).neq('complaint_status', 'resolved'),
        supabase.from('rooms').select('id, room_status'),
        supabase.from('payments').select('amount_paid, payment_status, due_date'),
      ]);

      const occupiedRooms = roomsData?.filter(r => r.room_status === 'occupied').length || 0;
      const totalRooms = roomsData?.length || 0;
      const totalRevenue = paymentsData?.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;
      const overduePayments = paymentsData?.filter(p => p.payment_status === 'overdue' || (p.due_date && new Date(p.due_date) < new Date())).length || 0;
      
      setStats({
        total_users: (totalLodgers || 0) + (totalLandlords || 0) + (totalStaff || 0),
        active_lodgers: totalLodgers || 0,
        active_landlords: totalLandlords || 0,
        active_staff: totalStaff || 0,
        total_properties: totalProperties || 0,
        total_rooms: totalRooms,
        occupied_rooms: occupiedRooms,
        total_tenancies: activeTenancies || 0,
        active_tenancies: activeTenancies || 0,
        total_revenue: totalRevenue,
        pending_payments: 0,
        overdue_payments: overduePayments,
      });

      // Get recent users
      const { data: usersData } = await supabase
        .from('user_roles')
        .select(`
          *,
          admin_profile:admin_profiles(full_name),
          staff_profile:staff_profiles(full_name),
          landlord_profile:landlord_profiles(full_name),
          lodger_profile:lodger_profiles(full_name),
          service_user_profile:service_user_profiles(full_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentUsers((usersData || []).map((u: any) => ({
        id: u.user_id,
        email: u.email,
        role: u.role_type,
        is_active: u.is_active,
        full_name: u.admin_profile?.full_name || u.staff_profile?.full_name || u.landlord_profile?.full_name || u.lodger_profile?.full_name || u.service_user_profile?.full_name,
        created_at: u.created_at,
      })));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateOccupancyRate = () => {
    if (!stats || stats.total_rooms === 0) return 0;
    return Math.round((stats.occupied_rooms / stats.total_rooms) * 100);
  };

  return (
    <>
      <SEO 
        title="Admin Portal - Domus Dwell Manage"
        description="Complete platform management and oversight"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Complete platform management</p>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Properties</p>
                    <p className="text-2xl font-bold">
                      {loading ? "..." : stats?.total_properties || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {loading ? "" : `${stats?.total_rooms || 0} total rooms`}
                    </p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <Home className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                    <p className="text-2xl font-bold">
                      {loading ? "..." : stats?.total_users || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {loading ? "" : `${stats?.active_lodgers || 0} lodgers, ${stats?.active_landlords || 0} landlords`}
                    </p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
                    <p className="text-2xl font-bold">
                      {loading ? "..." : formatCurrency(stats?.total_revenue || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {loading ? "" : `${stats?.pending_payments || 0} pending payments`}
                    </p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Staff</p>
                    <p className="text-2xl font-bold">
                      {loading ? "..." : stats?.active_staff || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {loading ? "" : `${stats?.active_tenancies || 0} active tenancies`}
                    </p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <Shield className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Occupancy & Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Room Occupancy Rate</span>
                    <span className="text-sm font-medium">
                      {loading ? "..." : `${calculateOccupancyRate()}%`}
                    </span>
                  </div>
                  <Progress value={calculateOccupancyRate()} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {loading ? "" : `${stats?.occupied_rooms || 0} of ${stats?.total_rooms || 0} rooms occupied`}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Active Tenancies</span>
                    <span className="text-sm font-medium">
                      {loading ? "..." : stats?.active_tenancies || 0}
                    </span>
                  </div>
                  <Progress 
                    value={loading || !stats ? 0 : (stats.active_tenancies / stats.total_tenancies) * 100} 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {loading ? "" : `${stats?.total_tenancies || 0} total tenancies`}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Payment Status</span>
                    <span className="text-sm font-medium">
                      {loading ? "..." : `${stats?.overdue_payments || 0} overdue`}
                    </span>
                  </div>
                  <Progress 
                    value={loading || !stats || stats.pending_payments === 0 
                      ? 0 
                      : ((stats.pending_payments - stats.overdue_payments) / stats.pending_payments) * 100
                    } 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {loading ? "" : `${stats?.pending_payments || 0} pending payments`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Loading...
                    </div>
                  ) : recentUsers.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No recent users
                    </div>
                  ) : (
                    recentUsers.map((user) => (
                      <div key={user.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                        <Users className="w-4 h-4 mt-1 text-primary" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{user.full_name || user.email}</p>
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {user.email} • {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Bin Schedule Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 pb-3 border-b">
                  <Calendar className="w-5 h-5 mt-1 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Next Council Collection</p>
                    <p className="text-lg font-semibold text-accent mt-1">Friday, 22nd November 2025</p>
                    <p className="text-xs text-muted-foreground mt-1">General waste & recycling</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Trash2 className="w-5 h-5 mt-1 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">In-House Bin Rotation</p>
                    <p className="text-sm text-muted-foreground mt-1">Lodgers rotate weekly</p>
                    <p className="text-xs text-muted-foreground mt-2">Current rotation: Room 3A this week</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Inspection Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 pb-3 border-b">
                  <Calendar className="w-5 h-5 mt-1 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Next Inspection</p>
                    <p className="text-lg font-semibold text-accent mt-1">Monday, 25th November 2025</p>
                    <p className="text-xs text-muted-foreground mt-1">Properties: Oak Street, Elm Avenue</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-3">Recent Inspections</p>
                  <div className="space-y-2">
                    {[
                      { property: "Oak Street - Room 2B", date: "15 Nov 2025", status: "Passed" },
                      { property: "Elm Avenue - Room 1A", date: "10 Nov 2025", status: "Passed" },
                      { property: "Maple Drive - Room 3C", date: "5 Nov 2025", status: "Action Required" },
                    ].map((inspection, index) => (
                      <div key={index} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{inspection.property}</p>
                          <p className="text-xs text-muted-foreground">{inspection.date}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          inspection.status === "Passed" 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                        }`}>
                          {inspection.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="h-20 md:h-0"></div>
        </div>
      </div>
      <BottomNav role="admin" />
    </>
  );
};

export default AdminOverview;
