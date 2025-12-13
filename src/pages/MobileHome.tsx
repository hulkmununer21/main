import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { Card } from "@/components/ui/card";
import { Home, Building2, Users, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { BottomNav } from "@/components/mobile/BottomNav";

const MobileHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user, navigate]);

  if (!user) return null;

  const roleConfig = {
    lodger: {
      title: "Your Portal",
      icon: Home,
      description: "Manage your tenancy, payments, and maintenance requests",
      color: "from-blue-500 to-cyan-500",
      route: "/lodger-portal"
    },
    landlord: {
      title: "Property Management",
      icon: Building2,
      description: "Monitor properties, tenants, and financial performance",
      color: "from-purple-500 to-pink-500",
      route: "/landlord-portal"
    },
    staff: {
      title: "Staff Dashboard",
      icon: Users,
      description: "Handle tasks, inspections, and lodger management",
      color: "from-orange-500 to-red-500",
      route: "/staff-portal"
    },
    admin: {
      title: "Admin Control",
      icon: ShieldCheck,
      description: "Full system access and management capabilities",
      color: "from-green-500 to-emerald-500",
      route: "/admin-portal"
    }
  };

  const config = roleConfig[user.role];
  const RoleIcon = config.icon;

  return (
    <>
      <SEO 
        title="Dashboard - Domus Servitia"
        description="Access your Domus Servitia dashboard"
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <Button 
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={logout}
              >
                Sign Out
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <RoleIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm capitalize">{user.role}</p>
                <h2 className="text-xl font-semibold">{user.name}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 -mt-12 relative z-10 pb-20">
          {/* Quick Access Card */}
          <Card 
            className="p-6 mb-6 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50"
            onClick={() => navigate(config.route)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                  <RoleIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{config.title}</h3>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Active Tasks</p>
              <p className="text-2xl font-bold">12</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Notifications</p>
              <p className="text-2xl font-bold">3</p>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Dashboard accessed</p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-muted mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Profile updated</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-muted mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Login successful</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav role={user.role} />
    </>
  );
};

export default MobileHome;
