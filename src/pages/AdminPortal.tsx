import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Home,
  Settings,
  DollarSign,
  FileText,
  MessageSquare,
  Activity,
  Bell,
  User,
  LogOut,
  TrendingUp,
  Shield,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Trash,
  ClipboardCheck,
  Wrench,
  CreditCard,
  FolderOpen,
  UserCog,
  FileStack,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import AdminOverview from "./admin/AdminOverview";
import BinManagement from "./admin/BinManagement";
import InspectionManagement from "./admin/InspectionManagement";
import ExtraCharges from "./admin/ExtraCharges";
import ServiceUsers from "./admin/ServiceUsers";
import StaffManagement from "./admin/StaffManagement";
import PaymentsBilling from "./admin/PaymentsBilling";
import NotificationsSMS from "./admin/NotificationsSMS";
import ComplaintManagement from "./admin/ComplaintManagement";
import DocumentManagement from "./admin/DocumentManagement";
import RolePermissions from "./admin/RolePermissions";
import SystemLogs from "./admin/SystemLogs";

const AdminPortal = () => {
  const { logout, user } = useAuth();
  const [currentTab, setCurrentTab] = useState("overview");

  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "properties", label: "Properties", icon: Home },
    { id: "bins", label: "Bin Management", icon: Trash },
    { id: "inspections", label: "Inspections", icon: ClipboardCheck },
    { id: "charges", label: "Extra Charges", icon: CreditCard },
    { id: "service-users", label: "Service Users", icon: Wrench },
    { id: "staff", label: "Staff", icon: Shield },
    { id: "payments", label: "Payments & Billing", icon: DollarSign },
    { id: "notifications", label: "Notifications & SMS", icon: Bell },
    { id: "complaints", label: "Complaints", icon: MessageSquare },
    { id: "documents", label: "Documents", icon: FolderOpen },
    { id: "permissions", label: "Role Permissions", icon: UserCog },
    { id: "logs", label: "System Logs", icon: FileStack },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <SEO
        title="Admin Portal - Domus Servitia"
        description="Administrative control panel for managing users, properties, staff, financial reports, and system settings."
        canonical="https://domusservitia.co.uk/admin-portal"
      />
      <div className="min-h-screen bg-muted/30 flex w-full">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r-2 border-border flex-shrink-0 h-screen sticky top-0 flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-border">
            <img src={logo} alt="Domus Servitia" className="h-10 rounded-lg" />
          </div>
          
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                      currentTab === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-border space-y-1 flex-shrink-0">
            <Button variant="ghost" className="w-full justify-start" size="lg">
              <Bell className="w-5 h-5 mr-3" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start" size="lg" onClick={logout}>
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="container mx-auto px-8 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Complete platform management and oversight
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Properties</p>
                      <p className="text-2xl font-bold text-foreground">124</p>
                      <p className="text-xs text-green-600 mt-1">+12% this month</p>
                    </div>
                    <div className="bg-accent/10 p-3 rounded-full">
                      <Home className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                      <p className="text-2xl font-bold text-foreground">342</p>
                      <p className="text-xs text-green-600 mt-1">+8% this month</p>
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
                      <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-foreground">£125K</p>
                      <p className="text-xs text-green-600 mt-1">+15% this month</p>
                    </div>
                    <div className="bg-accent/10 p-3 rounded-full">
                      <DollarSign className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Staff</p>
                      <p className="text-2xl font-bold text-foreground">28</p>
                      <p className="text-xs text-muted-foreground mt-1">Full capacity</p>
                    </div>
                    <div className="bg-accent/10 p-3 rounded-full">
                      <Shield className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overview Section */}
            {currentTab === "overview" && (
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
            )}

            {/* Users Section */}
            {currentTab === "users" && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>Manage all system users</CardDescription>
                    </div>
                    <Button>Add User</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "John Smith", email: "john@example.com", role: "Lodger", status: "Active" },
                      { name: "Sarah Wilson", email: "sarah@example.com", role: "Landlord", status: "Active" },
                      { name: "Mike Johnson", email: "mike@example.com", role: "Staff", status: "Active" },
                      { name: "Emma Davis", email: "emma@example.com", role: "Lodger", status: "Pending" },
                    ].map((user, index) => (
                      <Card key={index} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold">{user.name}</h4>
                                <Badge variant={user.role === "Lodger" ? "default" : user.role === "Landlord" ? "secondary" : "outline"}>
                                  {user.role}
                                </Badge>
                                <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                                  {user.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Properties Section */}
            {currentTab === "properties" && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Property Management</CardTitle>
                      <CardDescription>Oversee all properties in the system</CardDescription>
                    </div>
                    <Button>Add Property</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Modern City Centre Studio", address: "123 Main St, Manchester", status: "Occupied", rent: "£750/mo" },
                      { name: "Riverside Apartment", address: "456 River Rd, Manchester", status: "Available", rent: "£850/mo" },
                      { name: "Executive Penthouse", address: "789 High St, Manchester", status: "Occupied", rent: "£1,200/mo" },
                      { name: "Garden View Flat", address: "321 Park Ave, Manchester", status: "Maintenance", rent: "£700/mo" },
                    ].map((property, index) => (
                      <Card key={index} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{property.name}</h4>
                                <Badge variant={property.status === "Occupied" ? "default" : property.status === "Available" ? "secondary" : "outline"}>
                                  {property.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                                <MapPin className="w-3 h-3" />
                                {property.address}
                              </p>
                              <p className="text-sm font-medium text-primary">{property.rent}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm">View</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reports Section */}
            {currentTab === "reports" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Reports</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-between">
                      <span>Monthly Revenue Report</span>
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      <span>Expense Summary</span>
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      <span>Payment Analytics</span>
                      <FileText className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Operational Reports</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-between">
                      <span>Property Occupancy</span>
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      <span>Maintenance History</span>
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      <span>User Activity</span>
                      <FileText className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* New Module Sections */}
            {currentTab === "bins" && <BinManagement />}
            {currentTab === "inspections" && <InspectionManagement />}
            {currentTab === "charges" && <ExtraCharges />}
            {currentTab === "service-users" && <ServiceUsers />}
            {currentTab === "staff" && <StaffManagement />}
            {currentTab === "payments" && <PaymentsBilling />}
            {currentTab === "notifications" && <NotificationsSMS />}
            {currentTab === "complaints" && <ComplaintManagement />}
            {currentTab === "documents" && <DocumentManagement />}
            {currentTab === "permissions" && <RolePermissions />}
            {currentTab === "logs" && <SystemLogs />}

            {/* Settings Section */}
            {currentTab === "settings" && (
              <div className="space-y-6">
                <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure platform settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input id="company" defaultValue="Domus Servitia" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input id="support-email" type="email" defaultValue="support@domusservitia.co.uk" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-phone">Support Phone</Label>
                    <Input id="support-phone" type="tel" defaultValue="+44 xxx xxxx xxxx" />
                  </div>
                  <Button className="w-full">Save Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Admin Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-name">Full Name</Label>
                    <Input id="admin-name" defaultValue={user?.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input id="admin-email" type="email" defaultValue={user?.email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-role">Role</Label>
                    <Input id="admin-role" value="Administrator" disabled />
                  </div>
                  <Button className="w-full">Update Profile</Button>
                  <Button variant="outline" className="w-full" onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminPortal;
