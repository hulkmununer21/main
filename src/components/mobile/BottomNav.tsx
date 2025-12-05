import { Home, DollarSign, Wrench, MessageSquare, User, Building2, Users, TrendingUp, ClipboardList, Camera, ShieldCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

type UserRole = "lodger" | "landlord" | "staff" | "admin";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

interface BottomNavProps {
  role: UserRole;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

const roleNavItems: Record<UserRole, NavItem[]> = {
  lodger: [
    { icon: Home, label: "Home", path: "/lodger-portal" },
    { icon: DollarSign, label: "Payments", path: "/lodger-portal/payments" },
    { icon: Wrench, label: "Maintenance", path: "/lodger-portal/maintenance" },
    { icon: MessageSquare, label: "Messages", path: "/lodger-portal/messages" },
    { icon: User, label: "Profile", path: "/lodger-portal/profile" },
  ],
  landlord: [
    { icon: Home, label: "Home", path: "/landlord-portal" },
    { icon: Building2, label: "Properties", path: "/landlord-portal/properties" },
    { icon: Users, label: "Tenants", path: "/landlord-portal/tenants" },
    { icon: TrendingUp, label: "Finance", path: "/landlord-portal/financials" },
    { icon: User, label: "Profile", path: "/landlord-portal/profile" },
  ],
  staff: [
    { icon: Home, label: "Home", path: "/staff-portal" },
    { icon: ClipboardList, label: "Tasks", path: "/staff-portal/tasks" },
    { icon: Camera, label: "Inspections", path: "/staff-portal/inspections" },
    { icon: MessageSquare, label: "Messages", path: "/staff-portal/messages" },
    { icon: User, label: "Profile", path: "/staff-portal/profile" },
  ],
  admin: [
    { icon: Home, label: "Dashboard", path: "/admin-portal" },
    { icon: Users, label: "Users", path: "/admin-portal/users" },
    { icon: Building2, label: "Properties", path: "/admin-portal/properties" },
    { icon: FileText, label: "Reports", path: "/admin-portal/reports" },
    { icon: ShieldCheck, label: "Settings", path: "/admin-portal/settings" },
  ],
};

export const BottomNav = ({ role }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = roleNavItems[role];

  const handleNavClick = (item: NavItem) => {
    navigate(item.path);
  };

  const isActive = (item: NavItem) => {
    return location.pathname === item.path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 safe-area-inset-bottom">
      <nav className="grid grid-cols-5 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <Button
              key={item.label}
              variant="ghost"
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-lg transition-all",
                active && "text-primary bg-primary/10"
              )}
              onClick={() => handleNavClick(item)}
            >
              <Icon className={cn("w-5 h-5", active && "text-primary")} />
              <span className={cn(
                "text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </nav>
    </div>
  );
};
