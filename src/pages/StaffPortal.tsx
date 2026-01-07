import { useState } from "react";
import { 
  LayoutDashboard, Building2, Trash2, Camera, Sparkles, 
  AlertTriangle, Users, MessageSquare, User, Bell, LogOut,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import StaffDashboard from "./staff/StaffDashboard";
import StaffProperties from "./staff/StaffProperties";
import StaffBinDuties from "./staff/StaffBinDuties";
import StaffInspections from "./staff/StaffInspections";
import StaffCleaning from "./staff/StaffCleaning";
import StaffComplaints from "./staff/StaffComplaints";
import StaffServiceUsers from "./staff/StaffServiceUsers";
import StaffMessages from "./staff/StaffMessages";
import StaffProfile from "./staff/StaffProfile";

const StaffPortal = () => {
  const { logout, user } = useAuth();
  const [currentTab, setCurrentTab] = useState("dashboard");

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "properties", label: "Properties Assigned", icon: Building2 },
    { id: "bin-duties", label: "Bin Duties", icon: Trash2 },
    { id: "inspections", label: "Inspections", icon: Camera },
    { id: "cleaning", label: "Cleaning & Maintenance", icon: Sparkles },
    { id: "complaints", label: "Complaints", icon: AlertTriangle },
    { id: "service-users", label: "Service Users Tasks", icon: Users },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "profile", label: "Profile Settings", icon: User },
  ];

  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <StaffDashboard />;
      case "properties":
        return <StaffProperties />;
      case "bin-duties":
        return <StaffBinDuties />;
      case "inspections":
        return <StaffInspections />;
      case "cleaning":
        return <StaffCleaning />;
      case "complaints":
        return <StaffComplaints />;
      case "service-users":
        return <StaffServiceUsers />;
      case "messages":
        return <StaffMessages />;
      case "profile":
        return <StaffProfile />;
      default:
        return <StaffDashboard />;
    }
  };

  return (
    <>
      <SEO
        title="Staff Portal - Domus Servitia"
        description="Staff portal for managing operational tasks, inspections, bin duties, and property maintenance."
        canonical="https://domusservitia.co.uk/staff-portal"
      />
      <div className="min-h-screen bg-muted/30 flex w-full">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r-2 border-border flex-shrink-0 h-screen sticky top-0 flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-border">
            <img src={logo} alt="Domus Servitia" className="h-10 rounded-lg" />
            <p className="text-xs text-muted-foreground mt-2">Staff Portal</p>
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
                    <span className="font-medium text-sm">{item.label}</span>
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
                {navItems.find(item => item.id === currentTab)?.label || "Dashboard"}
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.name}
              </p>
            </div>

            {renderContent()}
          </div>
        </main>
      </div>
    </>
  );
};

export default StaffPortal;
