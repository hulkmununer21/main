import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Ban, CheckCircle, AlertTriangle } from "lucide-react";

interface UserStatusToggleProps {
  userId: string;
  userRole: 'staff' | 'lodger' | 'landlord' | 'service_user';
  currentStatus: boolean;
  userName: string;
  onStatusChange: () => void;
  adminId: string;
  adminName: string;
}

export const UserStatusToggle = ({ 
  userId, 
  userRole, 
  currentStatus, 
  userName, 
  onStatusChange,
  adminId,
  adminName
}: UserStatusToggleProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const profileTableMap = {
    staff: 'staff_profiles',
    lodger: 'lodger_profiles',
    landlord: 'landlord_profiles',
    service_user: 'service_user_profiles'
  };

  // Landlord uses is_verified, others use is_active
  const statusFieldMap = {
    staff: 'is_active',
    lodger: 'is_active',
    landlord: 'is_verified',
    service_user: 'is_active'
  };

  const handleToggle = async () => {
    if (!currentStatus && !reason.trim()) {
      toast.error("Please provide a reason for suspension");
      return;
    }

    setLoading(true);
    try {
      const tableName = profileTableMap[userRole];
      const statusField = statusFieldMap[userRole];
      const newStatus = !currentStatus;

      // Update profile table
      const updateData: any = {
        [statusField]: newStatus,
        suspended_at: newStatus ? null : new Date().toISOString(),
        suspended_by: newStatus ? null : adminId,
        suspension_reason: newStatus ? null : reason,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Update user_roles table (all use is_active)
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ is_active: newStatus })
        .eq('user_id', userId);

      if (roleError) throw roleError;

      toast.success(`User ${newStatus ? 'reactivated' : 'suspended'} successfully`);
      setDialogOpen(false);
      setReason("");
      onStatusChange();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={currentStatus ? "destructive" : "default"}
        size="sm"
        onClick={() => setDialogOpen(true)}
      >
        {currentStatus ? (
          <>
            <Ban className="w-4 h-4 mr-2" />
            Suspend
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Reactivate
          </>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {currentStatus ? 'Suspend' : 'Reactivate'} User Account
            </DialogTitle>
            <DialogDescription>
              {currentStatus 
                ? `You are about to suspend ${userName}'s account. They will not be able to log in until reactivated.`
                : `You are about to reactivate ${userName}'s account. They will be able to log in again.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">
                {currentStatus ? 'Reason for Suspension *' : 'Reason for Reactivation (Optional)'}
              </Label>
              <Textarea
                id="reason"
                placeholder={currentStatus 
                  ? "Violation of terms, payment issues, etc." 
                  : "Issue resolved, appeal approved, etc."
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required={currentStatus}
                className="min-h-[100px]"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> This action will be logged and can be audited.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant={currentStatus ? "destructive" : "default"}
              onClick={handleToggle}
              disabled={loading || (currentStatus && !reason.trim())}
            >
              {loading ? 'Processing...' : currentStatus ? 'Suspend Account' : 'Reactivate Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
