import { Bell, LogOut, Building, Users, DollarSign, Wrench, TrendingUp, Plus, AlertCircle, Check, Calendar, Trash2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

const LandlordOverview = () => {
  const { logout, user } = useAuth();

  const properties = [
    { id: 1, name: "Modern City Centre Studio", status: "Occupied", rent: 750 },
    { id: 2, name: "Riverside Apartment", status: "Occupied", rent: 950 },
    { id: 3, name: "Cozy 1-Bed Flat", status: "Available", rent: 650 },
  ];

  const totalMonthlyIncome = properties.filter(p => p.status === "Occupied").reduce((sum, p) => sum + p.rent, 0);
  const occupancyRate = (properties.filter(p => p.status === "Occupied").length / properties.length) * 100;

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
                  <Badge variant="secondary" className="text-xs h-5">3</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Properties</p>
                <p className="text-xl font-bold">{properties.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-4 w-4 text-accent" />
                  <Badge variant="secondary" className="text-xs h-5">{occupancyRate.toFixed(0)}%</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Tenants</p>
                <p className="text-xl font-bold">{properties.filter(p => p.status === "Occupied").length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-4 w-4 text-accent" />
                  <Badge variant="secondary" className="text-xs h-5">+12%</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Income</p>
                <p className="text-xl font-bold">£{totalMonthlyIncome.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Wrench className="h-4 w-4 text-accent" />
                  <Badge variant="destructive" className="text-xs h-5">2</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Pending</p>
                <p className="text-xl font-bold">2</p>
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
                  {properties.map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{property.name}</p>
                        <p className="text-xs text-muted-foreground">£{property.rent}/mo</p>
                      </div>
                      <Badge variant={property.status === "Occupied" ? "default" : "secondary"}>
                        {property.status}
                      </Badge>
                    </div>
                  ))}
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
                  <div className="flex items-start gap-3">
                    <div className="bg-green-500/10 p-2 rounded-full">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payment Received</p>
                      <p className="text-xs text-muted-foreground">John Smith - £750</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-full">
                      <Wrench className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Maintenance Request</p>
                      <p className="text-xs text-muted-foreground">Riverside Apartment</p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-yellow-500/10 p-2 rounded-full">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Lease Expiring Soon</p>
                      <p className="text-xs text-muted-foreground">Modern City Centre Studio</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
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
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Property Inspection</p>
                      <p className="text-xs text-muted-foreground">Tomorrow, 10:00 AM</p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Lease Renewal Meeting</p>
                      <p className="text-xs text-muted-foreground">Dec 20, 2:00 PM</p>
                    </div>
                    <Badge variant="secondary">Scheduled</Badge>
                  </div>
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
