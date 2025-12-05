import { Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNav } from "@/components/mobile/BottomNav";

const LodgerProfile = () => {
  const { logout, user } = useAuth();

  return (
    <>
      <SEO 
        title="Profile - Lodger Portal - Domus Dwell Manage"
        description="Manage your account settings and profile information"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Profile</h1>
                <p className="text-sm text-muted-foreground">Manage your account settings</p>
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

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lodger-name">Full Name</Label>
                <Input id="lodger-name" defaultValue={user?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lodger-email">Email</Label>
                <Input id="lodger-email" type="email" defaultValue={user?.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lodger-phone">Phone Number</Label>
                <Input id="lodger-phone" type="tel" placeholder="+44 7xxx xxxxxx" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lodger-role">Account Type</Label>
                <Input id="lodger-role" value="Lodger" disabled />
              </div>
              <Button className="w-full">Save Changes</Button>
              <Button variant="outline" className="w-full" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Bottom padding for mobile nav */}
          <div className="h-20 md:h-0"></div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav role="lodger" />
    </>
  );
};

export default LodgerProfile;
