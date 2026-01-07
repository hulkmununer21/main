import { useState, useEffect, useCallback } from "react";
import { Bell, LogOut, Building, Users, DollarSign, Wrench, TrendingUp, Plus, AlertCircle, Check, Calendar, Trash2, ClipboardCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const LandlordOverview = () => {
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [tenancies, setTenancies] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const landlordProfileId = (user.profile as any)?.id;
      if (!landlordProfileId) {
        toast({ title: "Error", description: "Landlord profile not found" });
        setLoading(false);
        return;
      }

      // Fetch properties for this landlord
      const { data: props } = await supabase
        .from('properties')
        .select('*, rooms(*)')
        .eq('landlord_id', landlordProfileId);
      
      setProperties(props || []);
      const propIds = props?.map(p => p.id) || [];

      if (propIds.length > 0) {
        // Fetch tenancies
        const { data: tenData } = await supabase
          .from('tenancies')
          .select('*')
          .in('property_id', propIds)
          .eq('tenancy_status', 'active');
        setTenancies(tenData || []);

        // Fetch maintenance requests
        const { data: maintData } = await supabase
          .from('maintenance_requests')
          .select('*')
          .in('property_id', propIds)
          .order('created_at', { ascending: false })
          .limit(5);
        setMaintenance(maintData || []);

        // Fetch inspections
        const { data: inspData } = await supabase
          .from('inspections')
          .select('*')
          .in('property_id', propIds)
          .order('scheduled_date', { ascending: true })
          .limit(5);
        setInspections(inspData || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Error", description: "Failed to load dashboard data" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const propertiesWithStatus = properties.map(p => {
    const rooms = p.rooms || [];
    const occupiedRooms = rooms.filter((r: any) => {
      return tenancies.some(t => t.room_id === r.id);
    }).length;
    const totalRooms = rooms.length || 1;
    const status = occupiedRooms === totalRooms ? "Occupied" : occupiedRooms > 0 ? "Partially Occupied" : "Available";
    const monthlyRent = tenancies
      .filter(t => t.property_id === p.id)
      .reduce((sum, t) => sum + (Number(t.monthly_rent) || 0), 0);
    return { ...p, status, rent: monthlyRent, occupiedRooms, totalRooms };
  });

  const totalMonthlyIncome = propertiesWithStatus.reduce((sum, p) => sum + p.rent, 0);
  const totalRooms = propertiesWithStatus.reduce((sum, p) => sum + p.totalRooms, 0);
  const occupiedRooms = propertiesWithStatus.reduce((sum, p) => sum + p.occupiedRooms, 0);
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
  const pendingMaintenance = maintenance.filter(m => m.request_status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const handleAddProperty = () => {
    toast({
      title: "Add Property",
      description: "Opening property form..."
    });
  };

  const handleAddTenant = () => {
    toast({
      title: "Add Tenant",
      description: "Opening tenant form..."
    });
  };

  const handleMaintenance = () => {
    toast({
      title: "Maintenance",
      description: "Opening maintenance requests..."
    });
  };

  const handleViewFinances = () => {
    toast({
      title: "Finances",
      description: "Opening financial reports..."
    });
  };

  const handleViewProperty = (property: any) => {
    toast({
      title: "Property Details",
      description: `Viewing ${property.name}`
    });
  };

  return (
    <>
      <SEO 
        title="Dashboard - Landlord Portal"
        description="Your landlord dashboard overview"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
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

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Building className="h-4 w-4 text-accent" />
                  <Badge variant="secondary" className="text-xs h-5">{properties.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Properties</p>
                <p className="text-xl font-bold">{properties.length || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-4 w-4 text-accent" />
                  <Badge variant="secondary" className="text-xs h-5">{occupancyRate.toFixed(0)}%</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Tenants</p>
                <p className="text-xl font-bold">{tenancies.length || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-4 w-4 text-accent" />
                  <Badge variant="secondary" className="text-xs h-5">Monthly</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Income</p>
                <p className="text-xl font-bold">£{totalMonthlyIncome.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Wrench className="h-4 w-4 text-accent" />
                  <Badge variant={pendingMaintenance > 0 ? "destructive" : "secondary"} className="text-xs h-5">{pendingMaintenance}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Pending</p>
                <p className="text-xl font-bold">{pendingMaintenance}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button className="w-full" onClick={handleAddProperty}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
                <Button variant="outline" className="w-full" onClick={handleAddTenant}>
                  <Users className="h-4 w-4 mr-2" />
                  Add Tenant
                </Button>
                <Button variant="outline" className="w-full" onClick={handleMaintenance}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Maintenance
                </Button>
                <Button variant="outline" className="w-full" onClick={handleViewFinances}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  View Finances
                </Button>
              </CardContent>
            </Card>

            {/* Property Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {propertiesWithStatus.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No properties allocated</p>
                  ) : (
                    propertiesWithStatus.map((property) => (
                      <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{property.property_name || 'Unnamed Property'}</p>
                          <p className="text-xs text-muted-foreground">
                            {property.rent > 0 ? `£${property.rent}/mo` : 'Not allocated'}
                          </p>
                        </div>
                        <Badge variant={property.status === "Occupied" ? "default" : property.status === "Partially Occupied" ? "secondary" : "outline"}>
                          {property.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Occupancy Rate</span>
                    <span className="font-medium">{occupancyRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={occupancyRate} />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenance.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  ) : (
                    maintenance.slice(0, 3).map((item, index) => (
                      <div key={item.id || index} className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          item.request_status === 'completed' ? 'bg-green-500/10' : 
                          item.request_status === 'pending' ? 'bg-yellow-500/10' : 
                          'bg-blue-500/10'
                        }`}>
                          {item.request_status === 'completed' ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : item.request_status === 'pending' ? (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <Wrench className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.issue_type || 'Maintenance Request'}</p>
                          <p className="text-xs text-muted-foreground">{item.description || 'No description'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inspections.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming tasks</p>
                  ) : (
                    inspections.map((inspection) => (
                      <div key={inspection.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Property Inspection</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(inspection.scheduled_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="capitalize">{inspection.inspection_status || 'Scheduled'}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="h-20 md:h-0"></div>
        </div>
      </div>
      <BottomNav role="landlord" />
    </>
  );
};

export default LandlordOverview;
