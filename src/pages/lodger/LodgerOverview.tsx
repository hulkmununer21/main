import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, Calendar, Check, AlertCircle, Clock, Bell, Info, AlertTriangle, ShieldCheck } from "lucide-react";

// === PROPS INTERFACE ===
interface LodgerOverviewProps {
  tenancy: {
    rentAmount: string | number;
    status: string;
    endDate: string;       
    daysUntilRent: number; 
    isOverdue: boolean;    
  };
  extraCharges: any[];
  
  binDuty: {
    isOnDuty: boolean;
    isCompleted: boolean;
    nextDate: string;
    assignedDay: string;
  };
  
  councilBin: {
    type: string;
    nextDate: string;
    daysUntil: string | number;
  };

  notifications: any[];
  onCompleteBinDuty: () => void;
  onMarkNotificationRead: (id: string) => void;
}

const LodgerOverview = ({
  tenancy,
  extraCharges,
  binDuty,
  councilBin,
  notifications,
  onCompleteBinDuty,
  onMarkNotificationRead,
}: LodgerOverviewProps) => {

  const unpaidCharges = extraCharges.filter(c => c.charge_status === 'pending');
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-[1600px]">
      
      {/* 1. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Monthly Rent */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="outline" className="text-xs capitalize">{tenancy.status || "Active"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Monthly Rent</p>
            <p className="text-3xl font-bold">£{tenancy.rentAmount}</p>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <Badge variant="outline" className="text-xs text-green-600">Good Standing</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Account Status</p>
            <p className="text-3xl font-bold">Up to Date</p> 
          </CardContent>
        </Card>

        {/* Next Rent Due */}
        <Card className={tenancy.isOverdue ? "border-red-200 bg-red-50/30" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${tenancy.isOverdue ? "bg-red-100" : "bg-orange-100"}`}>
                {tenancy.isOverdue ? <AlertTriangle className="h-6 w-6 text-red-600" /> : <Clock className="h-6 w-6 text-orange-600" />}
              </div>
              <Badge variant={tenancy.isOverdue ? "destructive" : "outline"} className="text-xs">
                {tenancy.isOverdue ? "Overdue" : "Upcoming"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Rent Due Date</p>
            <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-bold ${tenancy.isOverdue ? "text-red-600" : ""}`}>
                    {tenancy.endDate}
                </p>
            </div>
            <p className={`text-xs mt-1 font-medium ${tenancy.isOverdue ? "text-red-600" : "text-muted-foreground"}`}>
                {tenancy.isOverdue 
                    ? `${Math.abs(tenancy.daysUntilRent)} days overdue` 
                    : `${tenancy.daysUntilRent} days remaining`}
            </p>
          </CardContent>
        </Card>

        {/* Notification Count */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Bell className="h-6 w-6 text-blue-500" />
              </div>
              <Badge variant={unreadCount > 0 ? "default" : "secondary"} className="text-xs">
                {unreadCount > 0 ? "New Alerts" : "All Caught Up"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Unread Alerts</p>
            <p className="text-3xl font-bold">{unreadCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Extra Charges Alert (Visible only if unpaid charges exist) */}
      {unpaidCharges.length > 0 && (
        <Card className="border-red-200 bg-red-50/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-red-900">Outstanding Charges</CardTitle>
                  <CardDescription className="text-red-700">You have {unpaidCharges.length} unpaid bill(s).</CardDescription>
                </div>
              </div>
              <Badge variant="destructive">Action Required</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unpaidCharges.map((charge: any) => (
                <div key={charge.id} className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-white shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900">{charge.reason}</p>
                    </div>
                    <p className="text-sm text-gray-500">Due: {charge.due_date ? new Date(charge.due_date).toLocaleDateString() : "Immediate"}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-red-600">£{charge.amount}</span>
                    {/* Note: This button navigates to Payments tab logic in parent */}
                    <Button variant="destructive" size="sm">Pay Now</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        
        <div className="md:col-span-2 space-y-6">
            
            {/* 3. NOTIFICATIONS CARD */}
            {notifications.length > 0 && (
                <Card className="bg-white border-blue-100 shadow-sm">
                    <CardHeader className="pb-3 bg-blue-50/30 border-b border-blue-100">
                        <div className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg text-blue-900">Recent Notifications</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                        {notifications.map((notif: any) => (
                            <div key={notif.id} className={`p-4 transition-colors ${!notif.is_read ? "bg-blue-50/40" : "hover:bg-gray-50"}`}>
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <h4 className={`text-sm ${!notif.is_read ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                                        {notif.subject || "No Subject"}
                                    </h4>
                                    
                                    {!notif.is_read && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 text-[10px] text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-2 shrink-0"
                                            onClick={() => onMarkNotificationRead(notif.id)}
                                        >
                                            Mark as Read
                                        </Button>
                                    )}
                                </div>
                                <div className="text-sm text-gray-700 leading-relaxed break-words">
                                    {notif.message_body || "No content available."}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-[10px] text-gray-400">
                                        {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                        ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 4. Weekly Bin Duty */}
            <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Weekly Bin Duty</CardTitle>
                    <CardDescription>Your assigned bin collection responsibility</CardDescription>
                </div>
                {binDuty.isOnDuty ? (
                    <Badge variant={binDuty.isCompleted ? "default" : "destructive"} className={binDuty.isCompleted ? "bg-green-600 hover:bg-green-700" : ""}>
                    {binDuty.isCompleted ? "Duty Completed" : "Action Required"}
                    </Badge>
                ) : (
                    <Badge variant="outline">Not Your Turn</Badge>
                )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Next Rotation Change</p>
                        <p className="text-lg font-semibold">{binDuty.nextDate}</p>
                    </div>
                    </div>
                    
                    {binDuty.isOnDuty && !binDuty.isCompleted && (
                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-md">
                        <p className="text-sm font-medium text-orange-700">It is your turn!</p>
                        <p className="text-xs text-muted-foreground">Please take out the bins this week.</p>
                    </div>
                    )}
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium mb-3">Rotation Status</p>
                    <div className="p-4 border rounded-lg bg-muted/20 text-center">
                    <p className="text-sm text-muted-foreground">
                        {binDuty.isOnDuty 
                        ? "You are currently the designated person for bins." 
                        : "Another tenant is currently handling the bins."}
                    </p>
                    </div>
                </div>
                </div>
                
                {binDuty.isOnDuty && !binDuty.isCompleted && (
                    <div className="pt-4 border-t">
                    <Button className="w-full gap-2" onClick={onCompleteBinDuty}>
                        <Check className="h-4 w-4" /> Mark as Completed
                    </Button>
                    </div>
                )}
                
                {binDuty.isOnDuty && binDuty.isCompleted && (
                    <div className="pt-4 border-t bg-green-50/50 -mx-6 -mb-6 p-6 mt-2 border-t-green-100">
                        <div className="flex flex-col items-center justify-center text-center gap-2">
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6 text-green-600" />
                            </div>
                            <h4 className="font-semibold text-green-800">Thank you!</h4>
                            <p className="text-sm text-green-700 max-w-md">
                                You have marked this task as completed. A staff member assigned to your property will verify this shortly.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
            </Card>
        </div>

        {/* 5. Council Bins */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Council Bin Collection</CardTitle>
                <CardDescription>Property-wide schedule</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Next Collection</p>
                <p className="text-lg font-semibold">{councilBin.nextDate}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{councilBin.type}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Countdown</span>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {councilBin.daysUntil === "N/A" ? "N/A" : `In ${councilBin.daysUntil} days`}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LodgerOverview;