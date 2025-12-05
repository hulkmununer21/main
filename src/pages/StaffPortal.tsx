import { useState } from "react";
import { ClipboardList, Users, Wrench, Calendar, Bell, User, LogOut, Camera, Send, CheckCircle, Clock, AlertCircle, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import StaffOverview from "./staff/StaffOverview";

const StaffPortal = () => {
  const { logout, user } = useAuth();
  const isMobile = useIsMobile();
  const [currentTab, setCurrentTab] = useState("overview");
  
  // Mobile users get a completely different experience
  if (isMobile) {
    return <StaffOverview />;
  }

  return (
    <>
      <SEO
        title="Staff Portal - Domus Servitia"
        description="Staff portal for managing tasks, maintenance schedules, property inspections, and client communications."
        canonical="https://domusservitia.co.uk/staff-portal"
      />
      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <img src={logo} alt="Domus Servitia" className="h-10 rounded-lg" />
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Staff Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Assigned Tasks</p>
                    <p className="text-2xl font-bold text-foreground">8</p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <ClipboardList className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Managed Lodgers</p>
                    <p className="text-2xl font-bold text-foreground">15</p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Inspections</p>
                    <p className="text-2xl font-bold text-foreground">5</p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <Camera className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Today's Appointments</p>
                    <p className="text-2xl font-bold text-foreground">3</p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="inspections">Inspections</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
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
                        <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
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
                        <div key={index} className="flex items-start gap-3 p-3 border border-border rounded-lg">
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
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Tasks</CardTitle>
                  <CardDescription>Manage your assigned tasks and priorities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { id: 1, title: "Property Inspection - 123 Main St", priority: "High", due: "Today, 10:00 AM", status: "Pending" },
                      { id: 2, title: "Update Lodger Files - John Smith", priority: "Medium", due: "Today, 2:00 PM", status: "In Progress" },
                      { id: 3, title: "Maintenance Follow-up Call", priority: "Medium", due: "Today, 4:30 PM", status: "Pending" },
                      { id: 4, title: "Property Viewing Preparation", priority: "Low", due: "Tomorrow, 9:00 AM", status: "Pending" },
                      { id: 5, title: "Review Maintenance Reports", priority: "High", due: "Tomorrow, 11:00 AM", status: "Pending" },
                    ].map((task) => (
                      <Card key={task.id} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{task.title}</h4>
                                <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"}>
                                  {task.priority}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {task.due}
                                </span>
                                <span className="flex items-center gap-1">
                                  {task.status === "In Progress" ? (
                                    <AlertCircle className="w-3 h-3 text-blue-500" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3" />
                                  )}
                                  {task.status}
                                </span>
                              </div>
                            </div>
                            <Button size="sm">View Details</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inspections Tab */}
            <TabsContent value="inspections" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Inspections</CardTitle>
                  <CardDescription>Schedule and complete property inspections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { property: "Modern City Centre Studio", address: "123 Main St, Manchester", date: "Today, 10:00 AM", status: "Scheduled" },
                      { property: "Riverside Apartment", address: "456 River Rd, Manchester", date: "Tomorrow, 2:00 PM", status: "Scheduled" },
                      { property: "Executive Penthouse", address: "789 High St, Manchester", date: "Dec 20, 9:00 AM", status: "Completed" },
                    ].map((inspection, index) => (
                      <Card key={index} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{inspection.property}</h4>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {inspection.address}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="w-3 h-3" />
                                {inspection.date}
                              </p>
                            </div>
                            <Badge variant={inspection.status === "Completed" ? "default" : "secondary"}>
                              {inspection.status}
                            </Badge>
                          </div>
                          {inspection.status === "Scheduled" && (
                            <div className="flex gap-2">
                              <Button size="sm" className="flex-1">
                                <Camera className="w-4 h-4 mr-2" />
                                Start Inspection
                              </Button>
                              <Button size="sm" variant="outline">Details</Button>
                            </div>
                          )}
                          {inspection.status === "Completed" && (
                            <Button size="sm" variant="outline" className="w-full">
                              View Report
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Messages</CardTitle>
                  <CardDescription>Communication with lodgers and management</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { from: "John Smith", message: "Question about maintenance request", time: "2 hours ago", unread: true },
                      { from: "Property Manager", message: "New task assigned to you", time: "5 hours ago", unread: true },
                      { from: "Sarah Johnson", message: "Thank you for the quick response!", time: "1 day ago", unread: false },
                    ].map((msg, index) => (
                      <Card key={index} className={`border-border ${msg.unread ? "bg-primary/5" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{msg.from}</h4>
                            {msg.unread && <Badge>New</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{msg.message}</p>
                          <p className="text-xs text-muted-foreground">{msg.time}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Button className="w-full mt-4">
                    <Send className="w-4 h-4 mr-2" />
                    New Message
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Manage your account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={user?.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+44 7xxx xxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value="Staff Member" disabled />
                  </div>
                  <Button className="w-full">Save Changes</Button>
                  <Button variant="outline" className="w-full" onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </>
  );
};

export default StaffPortal;
