import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Bell, 
  MessageSquare, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Send,
  Users,
  User,
  Filter,
  Search,
  Plus
} from "lucide-react";

const NotificationsSMS = () => {
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [recipientType, setRecipientType] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [messageType, setMessageType] = useState("sms");
  const [searchUser, setSearchUser] = useState("");

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

  // Mock user list for selection
  const allUsers = [
    { id: "1", name: "Tom Brown", type: "Lodger", phone: "+44 7xxx xxx001", property: "789 High St" },
    { id: "2", name: "Lisa Green", type: "Lodger", phone: "+44 7xxx xxx002", property: "123 Main St" },
    { id: "3", name: "Mark Johnson", type: "Lodger", phone: "+44 7xxx xxx003", property: "456 River Rd" },
    { id: "4", name: "Sophie Chen", type: "Lodger", phone: "+44 7xxx xxx004", property: "321 Park Ave" },
    { id: "5", name: "James Wilson", type: "Landlord", phone: "+44 7xxx xxx005", property: "Multiple" },
    { id: "6", name: "Sarah Adams", type: "Landlord", phone: "+44 7xxx xxx006", property: "789 High St" },
    { id: "7", name: "Mike Davis", type: "Staff", phone: "+44 7xxx xxx007", property: "All" },
    { id: "8", name: "Emma White", type: "Staff", phone: "+44 7xxx xxx008", property: "All" },
  ];

  const messageTemplates = [
    { id: "rent", label: "Rent Reminder", content: "This is a reminder that your rent payment of £[AMOUNT] is due on [DATE]. Please ensure timely payment to avoid any late fees." },
    { id: "bin", label: "Bin Duty Reminder", content: "Your bin duty is scheduled for tomorrow. Please ensure all bins are put out before 7:00 AM." },
    { id: "inspection", label: "Inspection Notice", content: "A property inspection is scheduled for [DATE] at [TIME]. Please ensure access to all areas of the property." },
    { id: "maintenance", label: "Maintenance Update", content: "Your maintenance request has been [STATUS]. [ADDITIONAL_INFO]" },
    { id: "custom", label: "Custom Message", content: "" },
  ];

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
                          user.property.toLowerCase().includes(searchUser.toLowerCase());
    const matchesType = recipientType === "all" || 
                        user.type.toLowerCase() === recipientType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredUsers.map(u => u.id);
    setSelectedUsers(prev => {
      const allSelected = filteredIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !filteredIds.includes(id));
      }
      return [...new Set([...prev, ...filteredIds])];
    });
  };

  const handleSendMessage = () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }
    if (!messageContent.trim()) {
      toast.error("Please enter a message");
      return;
    }

    // Mock send - in production this would call an API
    toast.success(`${messageType.toUpperCase()} sent to ${selectedUsers.length} recipient(s)`);
    setSendDialogOpen(false);
    setSelectedUsers([]);
    setMessageContent("");
  };

  const applyTemplate = (templateId: string) => {
    const template = messageTemplates.find(t => t.id === templateId);
    if (template) {
      setMessageContent(template.content);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Notifications & SMS Management</h2>
          <p className="text-muted-foreground">Send messages and monitor communication logs</p>
        </div>
        <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Send className="w-4 h-4 mr-2" />
              Send New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Notification</DialogTitle>
              <DialogDescription>
                Compose and send SMS, email, or in-app notifications to users
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Message Type */}
              <div className="space-y-2">
                <Label>Message Type</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={messageType === "sms" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setMessageType("sms")}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    SMS
                  </Button>
                  <Button 
                    variant={messageType === "email" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setMessageType("email")}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button 
                    variant={messageType === "inapp" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setMessageType("inapp")}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    In-App
                  </Button>
                  <Button 
                    variant={messageType === "all" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setMessageType("all")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    All Channels
                  </Button>
                </div>
              </div>

              {/* Recipient Selection */}
              <div className="space-y-3">
                <Label>Select Recipients</Label>
                <div className="flex gap-2">
                  <Select value={recipientType} onValueChange={setRecipientType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="lodger">Lodgers</SelectItem>
                      <SelectItem value="landlord">Landlords</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search users..." 
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  <div className="p-2 border-b bg-muted/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.includes(u.id))}
                        onCheckedChange={selectAllFiltered}
                      />
                      <span className="text-sm font-medium">Select All ({filteredUsers.length})</span>
                    </div>
                    <Badge variant="secondary">{selectedUsers.length} selected</Badge>
                  </div>
                  {filteredUsers.map(user => (
                    <div 
                      key={user.id} 
                      className="p-2 flex items-center gap-3 hover:bg-muted/50 cursor-pointer border-b last:border-0"
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <Checkbox checked={selectedUsers.includes(user.id)} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.property} • {user.phone}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{user.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Templates */}
              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="flex flex-wrap gap-2">
                  {messageTemplates.map(template => (
                    <Button 
                      key={template.id}
                      variant="outline" 
                      size="sm"
                      onClick={() => applyTemplate(template.id)}
                    >
                      {template.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-2">
                <Label htmlFor="message">Message Content</Label>
                <Textarea 
                  id="message"
                  placeholder="Type your message here..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="min-h-32"
                />
                <p className="text-xs text-muted-foreground">
                  {messageContent.length} characters • SMS messages over 160 characters will be split
                </p>
              </div>

              {/* Preview */}
              {messageContent && selectedUsers.length > 0 && (
                <Card className="bg-muted/50">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-sm">
                      <span className="font-medium">To:</span> {selectedUsers.length} recipient(s)
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Via:</span> {messageType.toUpperCase()}
                    </p>
                    <p className="text-sm mt-2 italic">"{messageContent}"</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="w-4 h-4 mr-2" />
                Send {messageType === "all" ? "to All Channels" : messageType.toUpperCase()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                <Clock className="w-5 h-5 text-secondary-foreground" />
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
                  alert.priority === "Medium" ? "text-amber-500" :
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">Export</Button>
            </div>
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