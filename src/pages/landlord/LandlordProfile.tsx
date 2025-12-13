import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LandlordProfile = () => {
  const { logout, user } = useAuth();

  return (
    <>
      <SEO 
        title="Profile - Landlord Portal"
        description="Manage your account settings"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold">Profile</h1>
                <p className="text-sm text-muted-foreground">Manage account settings</p>
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

          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your landlord account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="landlord-name">Full Name</Label>
                <Input id="landlord-name" defaultValue={user?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="landlord-email">Email</Label>
                <Input id="landlord-email" type="email" defaultValue={user?.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="landlord-phone">Phone Number</Label>
                <Input id="landlord-phone" type="tel" placeholder="+44 7xxx xxxxxx" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="landlord-company">Company Name</Label>
                <Input id="landlord-company" placeholder="Property Management Company" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="landlord-role">Account Type</Label>
                <Input id="landlord-role" value="Landlord" disabled />
              </div>
              <Button className="w-full">Save Changes</Button>
              <Button variant="outline" className="w-full" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          <div className="h-20 md:h-0"></div>
        </div>
      </div>
      <BottomNav role="landlord" />
    </>
  );
};

export default LandlordProfile;
