import { Bell, LogOut, Home, Users, DollarSign, Shield, Activity, Trash2, ClipboardCheck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Progress } from "@/components/ui/progress";

const AdminOverview = () => {
  const { logout } = useAuth();

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
                    <p className="text-2xl font-bold">124</p>
                    <p className="text-xs text-green-600 mt-1">+12% this month</p>
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
                    <p className="text-2xl font-bold">342</p>
                    <p className="text-xs text-green-600 mt-1">+8% this month</p>
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
                    <p className="text-2xl font-bold">£125K</p>
                    <p className="text-xs text-green-600 mt-1">+15% this month</p>
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
                    <p className="text-2xl font-bold">28</p>
                    <p className="text-xs text-muted-foreground mt-1">Full capacity</p>
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
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Server Uptime</span>
                    <span className="text-sm font-medium">99.9%</span>
                  </div>
                  <Progress value={99.9} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Database Performance</span>
                    <span className="text-sm font-medium">98.5%</span>
                  </div>
                  <Progress value={98.5} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">API Response Time</span>
                    <span className="text-sm font-medium">145ms avg</span>
                  </div>
                  <Progress value={85} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: "New property added", user: "Admin Team", time: "10 mins ago" },
                    { action: "User account created", user: "System", time: "1 hour ago" },
                    { action: "Payment processed", user: "Finance", time: "2 hours ago" },
                    { action: "Maintenance completed", user: "Staff", time: "3 hours ago" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <Activity className="w-4 h-4 mt-1 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.action}</p>
                        <p className="text-xs text-muted-foreground">{item.user} • {item.time}</p>
                      </div>
                    </div>
                  ))}
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
