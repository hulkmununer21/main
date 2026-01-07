import { useEffect, useState } from "react";
import { 
  User, Lock, Loader2, Phone, Mail, Save 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// === INTERFACE ===
// Removed address fields to match schema
interface ServiceProfile {
  id: string;
  full_name: string;
  company_name: string;
  service_type: string;
  phone: string;
}

const ServiceUserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ServiceProfile | null>(null);

  const [passwords, setPasswords] = useState({ new: "", confirm: "" });

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        // ✅ FIXED: Removed address columns from query
        const { data, error } = await supabase
          .from('service_user_profiles')
          .select('id, full_name, company_name, service_type, phone')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!profile || !user) return;
    setSaving(true);

    try {
      // ✅ FIXED: Removed address columns from update
      const { error } = await supabase
        .from('service_user_profiles')
        .update({
          full_name: profile.full_name,
          company_name: profile.company_name,
          service_type: profile.service_type,
          phone: profile.phone,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success("Profile updated successfully.");
    } catch (err: any) {
      toast.error("Update failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      return toast.error("Passwords do not match.");
    }
    if (passwords.new.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      toast.success("Password updated successfully.");
      setPasswords({ new: "", confirm: "" });
    } catch (err: any) {
      toast.error("Password update failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/serviceuser/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">My Profile</h1>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="details" className="space-y-6">
          
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="details">Basic Info</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid gap-6">
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary"/> Identification</CardTitle>
                  <CardDescription>Your contact and business identification details.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={profile.full_name || ""} onChange={e => setProfile({...profile, full_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input value={profile.company_name || ""} onChange={e => setProfile({...profile, company_name: e.target.value})} placeholder="e.g. ABC Plumbing Ltd" />
                  </div>
                  <div className="space-y-2">
                    <Label>Service Type</Label>
                    <Input value={profile.service_type || ""} onChange={e => setProfile({...profile, service_type: e.target.value})} placeholder="e.g. Electrician" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" value={profile.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end pb-10">
                <Button size="lg" onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
              </div>

            </div>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-primary"/> Change Password</CardTitle>
                <CardDescription>Update your login password securely.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                    <Label>Email Address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" value={user?.email || ""} disabled className="bg-gray-100" />
                    </div>
                    <p className="text-xs text-muted-foreground">Email is managed by Administrator.</p>
                </div>

                <div className="pt-4 space-y-4 border-t">
                    <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} placeholder="******" />
                    </div>
                    <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <Input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} placeholder="******" />
                    </div>
                    <Button onClick={handleChangePassword} disabled={saving || !passwords.new} className="w-full">
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                    </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default ServiceUserProfile;