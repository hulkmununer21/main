import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageSquare, Mail, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

const NotificationsSMS = () => {
  const notifications = [
    {
      type: "Bin Reminder",
      recipient: "Tom Brown - Room 5, 789 High St",
      message: "Your bin duty is tomorrow. Please ensure bins are put out.",
      channel: "SMS",
      status: "Delivered",
      sentAt: "2024-12-01 09:00",
      deliveredAt: "2024-12-01 09:01"
    },
    {
      type: "Payment Reminder",
      recipient: "Lisa Green - Room 2, 123 Main St",
      message: "Rent payment of £850 is overdue. Please make payment urgently.",
      channel: "SMS + Email",
      status: "Delivered",
      sentAt: "2024-12-01 08:00",
      deliveredAt: "2024-12-01 08:02"
    },
    {
      type: "Inspection Notice",
      recipient: "All Lodgers - 456 River Rd",
      message: "Property inspection scheduled for December 8th at 10:00 AM.",
      channel: "In-App",
      status: "Sent",
      sentAt: "2024-11-30 14:00",
      deliveredAt: null
    },
    {
      type: "Extra Charge Alert",
      recipient: "Mark Johnson - Room 3, 456 River Rd",
      message: "An extra charge of £75 has been added to your account for deep cleaning.",
      channel: "SMS",
      status: "Failed",
      sentAt: "2024-11-29 16:00",
      deliveredAt: null
    },
    {
      type: "Maintenance Update",
      recipient: "Sophie Chen - Room 1, 321 Park Ave",
      message: "Your maintenance request has been completed. Please confirm.",
      channel: "Email",
      status: "Delivered",
      sentAt: "2024-11-28 11:00",
      deliveredAt: "2024-11-28 11:05"
    },
  ];

  const systemAlerts = [
    { alert: "New complaint received from Tom Brown", priority: "High", time: "10 mins ago" },
    { alert: "Bin duty missed at 789 High St - Room 5", priority: "Medium", time: "1 hour ago" },
    { alert: "Payment received: £750 from Mark Johnson", priority: "Low", time: "2 hours ago" },
    { alert: "Inspection report uploaded by John Smith", priority: "Low", time: "3 hours ago" },
  ];

  const smsStats = {
    sent: 156,
    delivered: 142,
    failed: 8,
    pending: 6
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Notifications & SMS Management</h2>
        <p className="text-muted-foreground">Monitor system alerts and communication logs</p>
      </div>

      {/* SMS Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{smsStats.sent}</p>
                <p className="text-sm text-muted-foreground">SMS Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-3 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{smsStats.delivered}</p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 p-3 rounded-full">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{smsStats.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-3 rounded-full">
                <Clock className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{smsStats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Real-time platform notifications and events</CardDescription>
            </div>
            <Button variant="outline">Mark All as Read</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemAlerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <AlertCircle className={`w-4 h-4 mt-1 ${
                  alert.priority === "High" ? "text-destructive" :
                  alert.priority === "Medium" ? "text-secondary" :
                  "text-muted-foreground"
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{alert.alert}</p>
                    <Badge variant={
                      alert.priority === "High" ? "destructive" :
                      alert.priority === "Medium" ? "secondary" :
                      "outline"
                    } className="text-xs">
                      {alert.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
                <Button size="sm" variant="ghost">View</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Communication Logs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Communication Logs</CardTitle>
              <CardDescription>Sent SMS, emails, and in-app notifications</CardDescription>
            </div>
            <Button>
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{notification.type}</h4>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {notification.channel.includes("SMS") && <MessageSquare className="w-3 h-3" />}
                          {notification.channel.includes("Email") && <Mail className="w-3 h-3" />}
                          {notification.channel.includes("In-App") && <Bell className="w-3 h-3" />}
                          {notification.channel}
                        </Badge>
                        <Badge variant={
                          notification.status === "Delivered" ? "default" :
                          notification.status === "Failed" ? "destructive" :
                          "secondary"
                        }>
                          {notification.status === "Delivered" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {notification.status === "Failed" && <XCircle className="w-3 h-3 mr-1" />}
                          {notification.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><span className="font-medium text-foreground">To:</span> {notification.recipient}</p>
                        <p className="text-foreground italic">"{notification.message}"</p>
                        <div className="flex gap-4 text-xs">
                          <p>Sent: {notification.sentAt}</p>
                          {notification.deliveredAt && <p>Delivered: {notification.deliveredAt}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {notification.status === "Failed" ? (
                        <Button size="sm" variant="destructive">Resend</Button>
                      ) : (
                        <Button size="sm" variant="outline">View Details</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsSMS;
