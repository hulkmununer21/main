import { useState, useEffect } from "react";
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
  FileStack,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import PropertyManagement from "./admin/PropertyManagement";
import UserManagement from "./admin/UserManagement";

const AdminPortal = () => {
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("overview");
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [editedSettings, setEditedSettings] = useState<{ [key: string]: any }>({});
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordChanging, setPasswordChanging] = useState(false);

  // Fetch system settings
  useEffect(() => {
    if (currentTab === "settings") {
      fetchSystemSettings();
    }
  }, [currentTab]);

  const fetchSystemSettings = async () => {
    setSettingsLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("category", { ascending: true })
        .order("setting_key", { ascending: true });

      if (error) throw error;
      setSystemSettings(data || []);
      
      // Initialize edited settings
      const initialEdits: { [key: string]: any } = {};
      data?.forEach((setting) => {
        initialEdits[setting.id] = setting.setting_value;
      });
      setEditedSettings(initialEdits);
    } catch (error: any) {
      console.error("Error fetching system settings:", error);
      toast({
        title: "Error",
        description: "Failed to load system settings.",
        variant: "destructive",
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSettingChange = (settingId: string, value: any) => {
    setEditedSettings((prev) => ({
      ...prev,
      [settingId]: value,
    }));
  };

  const saveSystemSetting = async (settingId: string) => {
    setSettingsSaving(true);
    try {
      const setting = systemSettings.find((s) => s.id === settingId);
      if (!setting) return;

      let valueToSave = editedSettings[settingId];

      // Convert boolean to string for storage
      if (setting.setting_type === "boolean") {
        valueToSave = valueToSave.toString();
      }

      // Check if user exists in admin_profiles
      const { data: adminProfile } = await supabase
        .from("admin_profiles")
        .select("id")
        .eq("id", user?.id)
        .single();

      const updateData: any = {
        setting_value: valueToSave,
        updated_at: new Date().toISOString(),
      };

      // Only add updated_by if user exists in admin_profiles
      if (adminProfile) {
        updateData.updated_by = user?.id;
      }

      const { error } = await supabase
        .from("system_settings")
        .update(updateData)
        .eq("id", settingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${setting.setting_key} updated successfully.`,
      });

      // Refresh settings
      await fetchSystemSettings();
    } catch (error: any) {
      console.error("Error updating setting:", error);
      toast({
        title: "Error",
        description: "Failed to update setting.",
        variant: "destructive",
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  const saveAllSettings = async () => {
    setSettingsSaving(true);
    try {
      // Check if user exists in admin_profiles
      const { data: adminProfile } = await supabase
        .from("admin_profiles")
        .select("id")
        .eq("id", user?.id)
        .single();

      const updates = systemSettings.map((setting) => {
        let valueToSave = editedSettings[setting.id];
        
        // Convert boolean to string for storage
        if (setting.setting_type === "boolean") {
          valueToSave = valueToSave.toString();
        }

        const updateData: any = {
          id: setting.id,
          setting_value: valueToSave,
          updated_at: new Date().toISOString(),
        };

        // Only add updated_by if user exists in admin_profiles
        if (adminProfile) {
          updateData.updated_by = user?.id;
        }

        return updateData;
      });

      for (const update of updates) {
        const { error } = await supabase
          .from("system_settings")
          .update(update)
          .eq("id", update.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "All settings updated successfully.",
      });

      // Refresh settings
      await fetchSystemSettings();
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  // Group settings by category
  const groupedSettings = systemSettings.reduce((acc: { [key: string]: any[] }, setting) => {
    const category = setting.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {});

  const handlePasswordChange = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setPasswordChanging(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password changed successfully.",
      });

      // Clear password fields
      setPasswordForm({
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setPasswordChanging(false);
    }
  };

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
            {currentTab === "users" && <UserManagement />}

            {/* Properties Section */}
            {currentTab === "properties" && <PropertyManagement />}

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

            {/* Settings Section */}
            {currentTab === "settings" && (
              <div className="space-y-6">
                {/* System Settings Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>System Settings</CardTitle>
                      <CardDescription>Configure platform settings and preferences</CardDescription>
                    </div>
                    <Button 
                      onClick={saveAllSettings} 
                      disabled={settingsSaving || settingsLoading}
                      className="ml-auto"
                    >
                      {settingsSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save All
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {settingsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : systemSettings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No system settings found. Please add settings to the database.
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {Object.entries(groupedSettings).map(([category, settings]: [string, any[]]) => (
                          <div key={category} className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                              <h3 className="text-lg font-semibold">{category}</h3>
                              <Badge variant="secondary">{settings.length}</Badge>
                            </div>
                            <div className="grid gap-6">
                              {settings.map((setting) => (
                                <div 
                                  key={setting.id} 
                                  className="grid gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-1">
                                      <Label htmlFor={setting.id} className="text-base font-medium">
                                        {setting.setting_key}
                                      </Label>
                                      {setting.description && (
                                        <p className="text-sm text-muted-foreground">
                                          {setting.description}
                                        </p>
                                      )}
                                    </div>
                                    <Badge variant="outline" className="shrink-0">
                                      {setting.setting_type}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {setting.setting_type === "boolean" ? (
                                      <div className="flex items-center space-x-2">
                                        <Switch
                                          id={setting.id}
                                          checked={editedSettings[setting.id] === "true" || editedSettings[setting.id] === true}
                                          onCheckedChange={(checked) => 
                                            handleSettingChange(setting.id, checked)
                                          }
                                          disabled={settingsSaving}
                                        />
                                        <Label htmlFor={setting.id} className="text-sm">
                                          {editedSettings[setting.id] === "true" || editedSettings[setting.id] === true ? "Enabled" : "Disabled"}
                                        </Label>
                                      </div>
                                    ) : setting.setting_type === "number" ? (
                                      <Input
                                        id={setting.id}
                                        type="number"
                                        value={editedSettings[setting.id] || ""}
                                        onChange={(e) => 
                                          handleSettingChange(setting.id, e.target.value)
                                        }
                                        disabled={settingsSaving}
                                        className="flex-1"
                                      />
                                    ) : setting.setting_value && setting.setting_value.length > 100 ? (
                                      <Textarea
                                        id={setting.id}
                                        value={editedSettings[setting.id] || ""}
                                        onChange={(e) => 
                                          handleSettingChange(setting.id, e.target.value)
                                        }
                                        disabled={settingsSaving}
                                        className="flex-1 min-h-[100px]"
                                        rows={4}
                                      />
                                    ) : (
                                      <Input
                                        id={setting.id}
                                        type="text"
                                        value={editedSettings[setting.id] || ""}
                                        onChange={(e) => 
                                          handleSettingChange(setting.id, e.target.value)
                                        }
                                        disabled={settingsSaving}
                                        className="flex-1"
                                      />
                                    )}
                                    
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => saveSystemSetting(setting.id)}
                                      disabled={settingsSaving || editedSettings[setting.id] === setting.setting_value}
                                    >
                                      {settingsSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Save className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>

                                  {setting.updated_at && (
                                    <p className="text-xs text-muted-foreground">
                                      Last updated: {new Date(setting.updated_at).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Admin Profile Card */}
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
                  </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your account password</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                        }
                        disabled={passwordChanging}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                        }
                        disabled={passwordChanging}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handlePasswordChange}
                      disabled={passwordChanging}
                    >
                      {passwordChanging ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
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
