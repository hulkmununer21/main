import { useState } from "react";
import { Bell, User, LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNav } from "@/components/mobile/BottomNav";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { LodgerProfile as LodgerProfileType } from "@/contexts/AuthContextTypes";

const LodgerProfile = () => {
  const { logout, user } = useAuth();
  const lodgerProfile = user?.profile as LodgerProfileType;

  const [fullName, setFullName] = useState(lodgerProfile?.full_name || "");
  const [phone, setPhone] = useState(lodgerProfile?.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(lodgerProfile?.date_of_birth || "");
  const [emergencyContactName, setEmergencyContactName] = useState(lodgerProfile?.emergency_contact_name || "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(lodgerProfile?.emergency_contact_phone || "");
  const [saving, setSaving] = useState(false);

  const handleSaveChanges = async () => {
    if (!lodgerProfile?.id) {
      toast({
        title: "Error",
        description: "Unable to update profile. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('lodger_profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
          emergency_contact_name: emergencyContactName || null,
          emergency_contact_phone: emergencyContactPhone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', lodgerProfile.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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
                <Input 
                  id="lodger-name" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lodger-email">Email</Label>
                <Input 
                  id="lodger-email" 
                  type="email" 
                  value={lodgerProfile?.email || user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lodger-phone">Phone Number</Label>
                <Input 
                  id="lodger-phone" 
                  type="tel" 
                  placeholder="+44 7xxx xxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lodger-dob">Date of Birth</Label>
                <Input 
                  id="lodger-dob" 
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency-name">Emergency Contact Name</Label>
                <Input 
                  id="emergency-name"
                  placeholder="Contact name"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency-phone">Emergency Contact Phone</Label>
                <Input 
                  id="emergency-phone" 
                  type="tel" 
                  placeholder="+44 7xxx xxxxxx"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lodger-role">Account Type</Label>
                <Input 
                  id="lodger-role" 
                  value="Lodger" 
                  disabled 
                  className="bg-muted"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleSaveChanges}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
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
