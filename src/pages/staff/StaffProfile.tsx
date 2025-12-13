import { User, Bell, Lock, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/useAuth";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const StaffProfile = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    binReminders: true,
    inspectionReminders: true,
    complaintsAssigned: true,
    serviceUserUploads: true,
    emailNotifications: true,
  });

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been saved successfully.",
    });
  };

  const handleSavePassword = () => {
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notification Preferences Saved",
      description: "Your notification settings have been updated.",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={user?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
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
          </div>
          <Button onClick={handleSaveProfile}>
            <Save className="w-4 h-4 mr-2" />
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div></div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
          </div>
          <Button onClick={handleSavePassword}>
            <Lock className="w-4 h-4 mr-2" />
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose what notifications you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Bin Duty Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified about upcoming bin duties</p>
              </div>
              <Switch
                checked={notifications.binReminders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, binReminders: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Inspection Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified about scheduled inspections</p>
              </div>
              <Switch
                checked={notifications.inspectionReminders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, inspectionReminders: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Complaints Assigned</p>
                <p className="text-sm text-muted-foreground">Get notified when a complaint is assigned to you</p>
              </div>
              <Switch
                checked={notifications.complaintsAssigned}
                onCheckedChange={(checked) => setNotifications({ ...notifications, complaintsAssigned: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Service User Uploads</p>
                <p className="text-sm text-muted-foreground">Get notified when service users upload content requiring verification</p>
              </div>
              <Switch
                checked={notifications.serviceUserUploads}
                onCheckedChange={(checked) => setNotifications({ ...notifications, serviceUserUploads: checked })}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                />
              </div>
            </div>
          </div>
          
          <Button onClick={handleSaveNotifications}>
            <Save className="w-4 h-4 mr-2" />
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffProfile;
