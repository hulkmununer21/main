import { Bell, LogOut, ClipboardList, Users, Camera, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Badge } from "@/components/ui/badge";

const StaffOverview = () => {
  const { logout, user } = useAuth();

  return (
    <>
      <SEO 
        title="Staff Portal - Domus Dwell Manage"
        description="Manage tasks, inspections, and lodger communications"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold">Staff Dashboard</h1>
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

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Assigned Tasks</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <ClipboardList className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Managed Lodgers</p>
                    <p className="text-2xl font-bold">15</p>
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
                    <p className="text-sm text-muted-foreground mb-1">Inspections</p>
                    <p className="text-2xl font-bold">5</p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <Camera className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Today's Appointments</p>
                    <p className="text-2xl font-bold">3</p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { task: "Property Inspection", property: "Modern City Centre Studio", time: "10:00 AM", status: "Pending" },
                    { task: "Update Lodger Information", property: "John Smith - Riverside Apartment", time: "2:00 PM", status: "In Progress" },
                    { task: "Maintenance Follow-up", property: "Executive Penthouse", time: "4:30 PM", status: "Pending" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.task}</p>
                        <p className="text-xs text-muted-foreground">{item.property}</p>
                      </div>
                      <Badge variant={item.status === "Pending" ? "secondary" : "default"}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "John Smith", action: "Information updated", time: "2 hours ago" },
                    { name: "Sarah Johnson", action: "Maintenance request", time: "5 hours ago" },
                    { name: "Mike Brown", action: "Contract renewed", time: "1 day ago" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="h-20 md:h-0"></div>
        </div>
      </div>
      <BottomNav role="staff" />
    </>
  );
};

export default StaffOverview;
