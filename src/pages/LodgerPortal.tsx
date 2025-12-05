import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, CreditCard, FileText, MessageSquare, Bell, User, LogOut, Download, Eye, Wrench, Calendar, Send, Check, AlertCircle, TrendingUp, Clock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import LodgerOverview from "./lodger/LodgerOverview";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const LodgerPortal = () => {
  const { logout, user } = useAuth();
  const isMobile = useIsMobile();
  const [currentTab, setCurrentTab] = useState("overview");
  const [paymentAmount, setPaymentAmount] = useState("750");
  const [maintenanceIssue, setMaintenanceIssue] = useState("");
  const [maintenanceCategory, setMaintenanceCategory] = useState("");
  const [messageText, setMessageText] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [binDutyCompleted, setBinDutyCompleted] = useState(false);
  const [selectedExtraCharge, setSelectedExtraCharge] = useState<number | null>(null);
  const [isExtraChargeDialogOpen, setIsExtraChargeDialogOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [isDocumentViewOpen, setIsDocumentViewOpen] = useState(false);
  const [viewingMessage, setViewingMessage] = useState<any>(null);
  const [isMessageViewOpen, setIsMessageViewOpen] = useState(false);
  const [viewingInspection, setViewingInspection] = useState<any>(null);
  const [isInspectionViewOpen, setIsInspectionViewOpen] = useState(false);
  
  // Mobile users get a completely different experience
  if (isMobile) {
    return <LodgerOverview />;
  }

  // Mock data
  const documents = [
    { id: 1, name: "Tenancy Agreement", type: "Contract", date: "2024-01-15", size: "2.4 MB", status: "Signed" },
    { id: 2, name: "Inventory Report", type: "Report", date: "2024-01-20", size: "1.8 MB", status: "Completed" },
    { id: 3, name: "Payment Receipt - Dec", type: "Receipt", date: "2024-12-01", size: "245 KB", status: "Completed" },
    { id: 4, name: "Energy Certificate", type: "Certificate", date: "2024-01-10", size: "890 KB", status: "Valid" },
    { id: 5, name: "Property Insurance", type: "Insurance", date: "2024-01-05", size: "1.2 MB", status: "Active" },
  ];

  const payments = [
    { id: 1, date: "2024-12-01", amount: 750, method: "Bank Transfer", status: "Paid", reference: "REF-12001" },
    { id: 2, date: "2024-11-01", amount: 750, method: "Bank Transfer", status: "Paid", reference: "REF-11001" },
    { id: 3, date: "2024-10-01", amount: 750, method: "Bank Transfer", status: "Paid", reference: "REF-10001" },
    { id: 4, date: "2024-09-01", amount: 750, method: "Bank Transfer", status: "Paid", reference: "REF-09001" },
    { id: 5, date: "2025-01-01", amount: 750, method: "Pending", status: "Due", reference: "REF-01001" },
  ];

  const messages = [
    { id: 1, from: "Property Manager", subject: "Maintenance Update", preview: "Your recent maintenance request has been...", date: "2 hours ago", unread: true },
    { id: 2, from: "Accounts Team", subject: "Payment Confirmation", preview: "Thank you for your payment of £750...", date: "1 day ago", unread: false },
    { id: 3, from: "Admin", subject: "Important Notice", preview: "Please be advised that scheduled maintenance...", date: "3 days ago", unread: false },
    { id: 4, from: "Property Manager", subject: "Contract Renewal", preview: "Your tenancy agreement is coming up for renewal...", date: "5 days ago", unread: false },
  ];

  // Bin duty data
  const binDutyInfo = {
    room: "Room 3",
    assignedDay: "Monday",
    nextBinDay: "Monday, 25th Nov 2025",
    lastCompleted: "Monday, 18th Nov 2025",
    rotationSchedule: [
      { room: "Room 1", day: "Tuesday" },
      { room: "Room 2", day: "Wednesday" },
      { room: "Room 3", day: "Monday" },
      { room: "Room 4", day: "Thursday" },
      { room: "Room 5", day: "Friday" },
    ]
  };

  // Council collection data
  const councilCollectionInfo = {
    nextCollectionDate: "Thursday, 28th Nov 2025",
    daysUntil: 8,
    collectionType: "General Waste & Recycling"
  };

  // Inspection data
  const upcomingInspection = {
    date: "Friday, 29th Nov 2025",
    time: "10:00 AM - 12:00 PM",
    inspector: "Sarah Johnson",
    inspectorRole: "Property Manager",
    type: "Routine Property Inspection",
    hoursUntil: 48,
    notes: "Please ensure common areas are tidy and your room is accessible."
  };

  // Extra charges data
  const extraCharges = [
    {
      id: 1,
      reason: "Missed Bin Duty Fee",
      amount: 15,
      dueDate: "2025-11-30",
      status: "unpaid",
      dateAdded: "2025-11-22",
      description: "Missed bin duty on Monday, 18th Nov 2025"
    },
    {
      id: 2,
      reason: "Late Cleanup Fee",
      amount: 25,
      dueDate: "2025-12-05",
      status: "unpaid",
      dateAdded: "2025-11-20",
      description: "Common area left untidy after use"
    }
  ];

  // Service updates data - completed tasks and inspections
  const completedCleaningTasks = [
    {
      id: 1,
      date: "2025-11-22",
      cleaner: "John Smith",
      areas: ["Kitchen", "Living Room", "Bathroom 1", "Hallway"],
      notes: "Deep cleaned all common areas. Kitchen appliances sanitized.",
      duration: "3 hours",
      status: "completed"
    },
    {
      id: 2,
      date: "2025-11-19",
      cleaner: "Sarah Wilson",
      areas: ["Kitchen", "Bathroom 1", "Bathroom 2"],
      notes: "Regular weekly cleaning completed.",
      duration: "2 hours",
      status: "completed"
    },
    {
      id: 3,
      date: "2025-11-15",
      cleaner: "John Smith",
      areas: ["All Common Areas"],
      notes: "Monthly deep clean performed.",
      duration: "4 hours",
      status: "completed"
    }
  ];

  const completedInspections = [
    {
      id: 1,
      date: "2025-11-20",
      inspector: "Sarah Johnson",
      type: "Routine Property Inspection",
      findings: "Property in good condition. Minor wear on kitchen cabinet doors noted.",
      rating: "Satisfactory",
      reportUrl: "#",
      uploadedBy: "Property Manager"
    },
    {
      id: 2,
      date: "2025-10-15",
      inspector: "Mike Brown",
      type: "Safety Inspection",
      findings: "All safety equipment functioning properly. Fire alarms tested and operational.",
      rating: "Excellent",
      reportUrl: "#",
      uploadedBy: "Staff Member"
    }
  ];

  const maintenanceRequests = [
    { id: 1, issue: "Leaking tap in bathroom", status: "In Progress", date: "2024-12-10", priority: "Medium", assignedTo: "John Smith" },
    { id: 2, issue: "Heating not working properly", status: "Completed", date: "2024-11-28", priority: "High", assignedTo: "Sarah Johnson" },
    { id: 3, issue: "Light bulb replacement needed", status: "Pending", date: "2024-12-12", priority: "Low", assignedTo: "Unassigned" },
    { id: 4, issue: "Door handle loose", status: "Scheduled", date: "2024-12-08", priority: "Low", assignedTo: "Mike Brown" },
  ];

  const handlePayment = () => {
    toast({
      title: "Payment Initiated",
      description: `Processing payment of £${paymentAmount}. You'll receive a confirmation shortly.`,
    });
    setIsPaymentDialogOpen(false);
  };

  const handleMaintenanceSubmit = () => {
    if (!maintenanceIssue || !maintenanceCategory) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Request Submitted",
      description: "Your maintenance request has been submitted successfully.",
    });
    setMaintenanceIssue("");
    setMaintenanceCategory("");
    setIsMaintenanceDialogOpen(false);
  };

  const handleSendMessage = () => {
    if (!messageText) {
      toast({
        title: "Message Empty",
        description: "Please enter a message before sending.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Message Sent",
      description: "Your message has been sent to property management.",
    });
    setMessageText("");
    setIsMessageDialogOpen(false);
  };

  const handleExtraChargePayment = (chargeId: number) => {
    const charge = extraCharges.find(c => c.id === chargeId);
    if (!charge) return;
    
    toast({
      title: "Payment Initiated",
      description: `Processing payment of £${charge.amount} for ${charge.reason}.`,
    });
    setIsExtraChargeDialogOpen(false);
    setSelectedExtraCharge(null);
  };

  const handleViewDocument = (document: any) => {
    setViewingDocument(document);
    setIsDocumentViewOpen(true);
  };

  const handleDownloadDocument = (document: any) => {
    toast({
      title: "Download Started",
      description: `Downloading ${document.name}...`,
    });
  };

  const handleViewMessage = (message: any) => {
    setViewingMessage(message);
    setIsMessageViewOpen(true);
  };

  const handleViewInspection = (inspection: any) => {
    setViewingInspection(inspection);
    setIsInspectionViewOpen(true);
  };

  const handleDownloadInspectionReport = (inspection: any) => {
    toast({
      title: "Download Started",
      description: `Downloading inspection report from ${inspection.date}...`,
    });
  };

  const navigationItems = [
    { id: "overview", label: "Dashboard", icon: Home },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "service-updates", label: "Service Updates", icon: Check },
  ];

  return (
    <>
      <SEO 
        title="Lodger Portal - Domus"
        description="Access your tenancy information, make payments, and manage maintenance requests."
      />
      <div className="min-h-screen bg-background flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r bg-card min-h-screen sticky top-0 flex flex-col">
          <div className="p-6 border-b">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Domus Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h2 className="font-bold text-lg">Domus</h2>
                <p className="text-xs text-muted-foreground">Lodger Portal</p>
              </div>
            </Link>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentTab === item.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11",
                    currentTab === item.id && "bg-secondary font-medium"
                  )}
                  onClick={() => setCurrentTab(item.id)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
          
          <div className="p-4 border-t space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
              asChild
            >
              <Link to="/lodger/profile">
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
              onClick={logout}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b bg-card px-8 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-semibold">
                {navigationItems.find(item => item.id === currentTab)?.label}
              </h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full"></span>
              </Button>
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">Lodger</p>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-8 overflow-auto bg-muted/30">
            {currentTab === "overview" && (
              <div className="space-y-6 max-w-[1600px]">
                {/* Stats Overview */}
                <div className="grid grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Home className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Monthly Rent</p>
                      <p className="text-3xl font-bold">£750</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <Check className="h-6 w-6 text-green-500" />
                        </div>
                        <Badge variant="outline" className="text-xs text-green-600">On Time</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                      <p className="text-3xl font-bold">Paid</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <Clock className="h-6 w-6 text-orange-500" />
                        </div>
                        <Badge variant="outline" className="text-xs">Due Soon</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Next Payment</p>
                      <p className="text-3xl font-bold">15 days</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <MessageSquare className="h-6 w-6 text-blue-500" />
                        </div>
                        <Badge variant="default" className="text-xs">{messages.filter(m => m.unread).length} New</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Messages</p>
                      <p className="text-3xl font-bold">{messages.length}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Extra Charges Alert */}
                {extraCharges.length > 0 && (
                  <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Extra Fees Due</CardTitle>
                            <CardDescription>Additional charges separate from your monthly rent</CardDescription>
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {extraCharges.filter(c => c.status === 'unpaid').length} Unpaid
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {extraCharges.map((charge) => (
                          <div key={charge.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{charge.reason}</p>
                                {charge.status === 'unpaid' && (
                                  <Badge variant="destructive" className="text-xs">Unpaid</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{charge.description}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Added: {new Date(charge.dateAdded).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                <span>•</span>
                                <span>Due: {new Date(charge.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 ml-6">
                              <div className="text-right">
                                <p className="text-2xl font-bold">£{charge.amount}</p>
                              </div>
                              <Dialog open={isExtraChargeDialogOpen && selectedExtraCharge === charge.id} onOpenChange={(open) => {
                                setIsExtraChargeDialogOpen(open);
                                if (!open) setSelectedExtraCharge(null);
                              }}>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => setSelectedExtraCharge(charge.id)}
                                  >
                                    Pay Now
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Pay Extra Charge</DialogTitle>
                                    <DialogDescription>Confirm payment for this additional fee</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="p-4 rounded-lg border bg-muted/50">
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-sm text-muted-foreground">Reason</span>
                                          <span className="text-sm font-medium">{charge.reason}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm text-muted-foreground">Amount</span>
                                          <span className="text-lg font-bold">£{charge.amount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm text-muted-foreground">Due Date</span>
                                          <span className="text-sm font-medium">
                                            {new Date(charge.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{charge.description}</p>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsExtraChargeDialogOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button onClick={() => handleExtraChargePayment(charge.id)}>
                                      Confirm Payment
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          You will receive SMS and email notifications when new fees are added
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Upcoming Inspection Alert */}
                {upcomingInspection && (
                  <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="h-6 w-6 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">Upcoming Inspection Scheduled</h3>
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              In {upcomingInspection.hoursUntil} hours
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{upcomingInspection.type}</p>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground mb-1">Date</p>
                              <p className="font-medium">{upcomingInspection.date}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Time</p>
                              <p className="font-medium">{upcomingInspection.time}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Inspector</p>
                              <p className="font-medium">{upcomingInspection.inspector}</p>
                              <p className="text-xs text-muted-foreground">{upcomingInspection.inspectorRole}</p>
                            </div>
                          </div>
                          {upcomingInspection.notes && (
                            <div className="mt-3 pt-3 border-t border-amber-500/20">
                              <p className="text-xs text-muted-foreground">{upcomingInspection.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Property Details & Quick Actions */}
                <div className="grid grid-cols-3 gap-6">
                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle>Property Details</CardTitle>
                      <CardDescription>123 High Street, London, M1 1AA</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex justify-between py-3 border-b">
                            <span className="text-sm text-muted-foreground">Room Type</span>
                            <span className="text-sm font-medium">Single Room</span>
                          </div>
                          <div className="flex justify-between py-3 border-b">
                            <span className="text-sm text-muted-foreground">Move-in Date</span>
                            <span className="text-sm font-medium">January 15, 2024</span>
                          </div>
                          <div className="flex justify-between py-3">
                            <span className="text-sm text-muted-foreground">Deposit Paid</span>
                            <span className="text-sm font-medium">£750.00</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between py-3 border-b">
                            <span className="text-sm text-muted-foreground">Furnishing</span>
                            <span className="text-sm font-medium">Fully Furnished</span>
                          </div>
                          <div className="flex justify-between py-3 border-b">
                            <span className="text-sm text-muted-foreground">Contract End</span>
                            <span className="text-sm font-medium">January 14, 2025</span>
                          </div>
                          <div className="flex justify-between py-3">
                            <span className="text-sm text-muted-foreground">Property Manager</span>
                            <span className="text-sm font-medium">Sarah Johnson</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full justify-start gap-2">
                            <CreditCard className="h-4 w-4" />
                            Make Payment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Make a Payment</DialogTitle>
                            <DialogDescription>Enter payment amount</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="amount">Amount (£)</Label>
                              <Input
                                id="amount"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="750"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handlePayment}>Process Payment</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full justify-start gap-2">
                            <Wrench className="h-4 w-4" />
                            Report Issue
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Report Maintenance Issue</DialogTitle>
                            <DialogDescription>Describe the issue</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="category">Category</Label>
                              <Select value={maintenanceCategory} onValueChange={setMaintenanceCategory}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="plumbing">Plumbing</SelectItem>
                                  <SelectItem value="electrical">Electrical</SelectItem>
                                  <SelectItem value="heating">Heating</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="issue">Describe the Issue</Label>
                              <Textarea
                                id="issue"
                                placeholder="Please provide details..."
                                value={maintenanceIssue}
                                onChange={(e) => setMaintenanceIssue(e.target.value)}
                                className="min-h-[100px]"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleMaintenanceSubmit}>Submit Request</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setCurrentTab("documents")}>
                        <FileText className="h-4 w-4" />
                        View Documents
                      </Button>

                      <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setCurrentTab("messages")}>
                        <MessageSquare className="h-4 w-4" />
                        Send Message
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Weekly Bin Duty */}
                <div className="grid grid-cols-3 gap-6">
                  <Card className="col-span-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Weekly Bin Duty</CardTitle>
                          <CardDescription>Your assigned bin collection responsibility</CardDescription>
                        </div>
                        <Badge variant={binDutyCompleted ? "default" : "outline"} className="text-xs">
                          {binDutyCompleted ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Next Bin Day</p>
                              <p className="text-lg font-semibold">{binDutyInfo.nextBinDay}</p>
                            </div>
                          </div>
                          <Separator />
                          <div className="pt-2">
                            <p className="text-xs text-muted-foreground mb-1">Your Assigned Day</p>
                            <p className="text-sm font-medium">{binDutyInfo.assignedDay}</p>
                          </div>
                          <div className="pt-1">
                            <p className="text-xs text-muted-foreground mb-1">Last Completed</p>
                            <p className="text-sm font-medium">{binDutyInfo.lastCompleted}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium mb-3">Weekly Rotation Schedule</p>
                          <div className="space-y-2">
                            {binDutyInfo.rotationSchedule.map((schedule) => (
                              <div 
                                key={schedule.room} 
                                className={cn(
                                  "flex justify-between items-center p-2 rounded-lg border",
                                  schedule.room === binDutyInfo.room && "bg-primary/5 border-primary/20"
                                )}
                              >
                                <span className={cn(
                                  "text-sm",
                                  schedule.room === binDutyInfo.room ? "font-medium" : "text-muted-foreground"
                                )}>
                                  {schedule.room}
                                  {schedule.room === binDutyInfo.room && " (You)"}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {schedule.day}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {!binDutyCompleted && (
                        <div className="pt-4 border-t">
                          <Button 
                            className="w-full gap-2"
                            onClick={() => {
                              setBinDutyCompleted(true);
                              toast({
                                title: "Bin Duty Completed",
                                description: "Thank you for completing your bin duty this week!",
                              });
                            }}
                          >
                            <Check className="h-4 w-4" />
                            Mark as Completed
                          </Button>
                        </div>
                      )}

                      {binDutyCompleted && (
                        <div className="pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>You've completed this week's bin duty. Great job!</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Council Bin Collection</CardTitle>
                          <CardDescription>Property-wide collection schedule</CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Informational
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">Next Collection Date</p>
                          <p className="text-lg font-semibold">{councilCollectionInfo.nextCollectionDate}</p>
                          <p className="text-xs text-muted-foreground mt-1">{councilCollectionInfo.collectionType}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Countdown</span>
                        </div>
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          In {councilCollectionInfo.daysUntil} days
                        </Badge>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          The designated person will take bins to the road. No action required from you.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Reminders</CardTitle>
                      <CardDescription>Upcoming notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
                        <div className="flex items-start gap-2">
                          <Bell className="h-4 w-4 text-amber-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Bin Day Reminder</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              You'll receive an in-app notification and SMS reminder the day before your bin duty.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg border">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Next Reminder</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Sunday, 24th Nov 2025 at 6:00 PM
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest transactions and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { icon: Check, color: "green", title: "Payment Received", desc: "£750 - December rent", time: "2 days ago" },
                        { icon: AlertCircle, color: "blue", title: "Maintenance Update", desc: "Tap repair scheduled for tomorrow", time: "5 days ago" },
                        { icon: FileText, color: "purple", title: "Document Signed", desc: "Tenancy agreement updated", time: "1 week ago" },
                      ].map((activity, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                          <div className={`bg-${activity.color}-500/10 p-2 rounded-full`}>
                            <activity.icon className={`h-4 w-4 text-${activity.color}-500`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">{activity.desc}</p>
                          </div>
                          <span className="text-sm text-muted-foreground">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Service Updates */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Recent Service Updates</CardTitle>
                        <CardDescription>Latest cleaning and inspection reports</CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentTab("service-updates")}
                      >
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {completedCleaningTasks.slice(0, 2).map((task, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                          <div className="bg-green-500/10 p-2 rounded-full">
                            <Check className="h-4 w-4 text-green-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">Cleaning Completed</p>
                            <p className="text-sm text-muted-foreground">
                              {task.areas.slice(0, 2).join(", ")} by {task.cleaner}
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(task.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      ))}
                      {completedInspections.slice(0, 1).map((inspection, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                          <div className="bg-blue-500/10 p-2 rounded-full">
                            <FileText className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{inspection.type}</p>
                            <p className="text-sm text-muted-foreground">
                              By {inspection.inspector} - {inspection.rating}
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(inspection.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentTab === "payments" && (
              <div className="space-y-6 max-w-[1600px]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Payment History</h2>
                    <p className="text-sm text-muted-foreground">Track all rent payments</p>
                  </div>
                  <Button onClick={() => setIsPaymentDialogOpen(true)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Make Payment
                  </Button>
                </div>

                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.date}</TableCell>
                          <TableCell className="text-muted-foreground">{payment.reference}</TableCell>
                          <TableCell className="font-semibold">£{payment.amount}</TableCell>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell>
                            <Badge
                              variant={payment.status === "Paid" ? "default" : payment.status === "Due" ? "destructive" : "outline"}
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Download Started",
                                  description: `Downloading receipt for ${payment.reference}...`,
                                });
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>

                {/* Extra Charges Section */}
                {extraCharges.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold">Extra Charges</h2>
                        <p className="text-sm text-muted-foreground">Additional fees separate from monthly rent</p>
                      </div>
                      <Badge variant="destructive">
                        {extraCharges.filter(c => c.status === 'unpaid').length} Unpaid
                      </Badge>
                    </div>

                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date Added</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {extraCharges.map((charge) => (
                            <TableRow key={charge.id}>
                              <TableCell className="font-medium">
                                {new Date(charge.dateAdded).toLocaleDateString('en-GB')}
                              </TableCell>
                              <TableCell className="font-semibold">{charge.reason}</TableCell>
                              <TableCell className="text-muted-foreground max-w-xs truncate">
                                {charge.description}
                              </TableCell>
                              <TableCell className="font-bold">£{charge.amount}</TableCell>
                              <TableCell>
                                {new Date(charge.dueDate).toLocaleDateString('en-GB')}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={charge.status === "unpaid" ? "destructive" : "default"}
                                >
                                  {charge.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {charge.status === 'unpaid' && (
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedExtraCharge(charge.id);
                                      setIsExtraChargeDialogOpen(true);
                                    }}
                                  >
                                    Pay Now
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </>
                )}
              </div>
            )}

            {currentTab === "documents" && (
              <div className="space-y-6 max-w-[1600px]">
                <div>
                  <h2 className="text-2xl font-semibold">Documents</h2>
                  <p className="text-sm text-muted-foreground">Access all your tenancy documents</p>
                </div>

                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.name}</TableCell>
                          <TableCell className="text-muted-foreground">{doc.type}</TableCell>
                          <TableCell>{doc.date}</TableCell>
                          <TableCell className="text-muted-foreground">{doc.size}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{doc.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewDocument(doc)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownloadDocument(doc)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {currentTab === "messages" && (
              <div className="space-y-6 max-w-[1600px]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Messages</h2>
                    <p className="text-sm text-muted-foreground">Communicate with property management</p>
                  </div>
                  <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Send className="h-4 w-4 mr-2" />
                        New Message
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Message</DialogTitle>
                        <DialogDescription>Send a message to property management</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="message">Your Message</Label>
                          <Textarea
                            id="message"
                            placeholder="Type your message here..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            className="min-h-[150px]"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendMessage}>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4">
                  {messages.map((message) => (
                    <Card 
                      key={message.id} 
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        message.unread && "border-primary/50 bg-primary/5"
                      )}
                      onClick={() => handleViewMessage(message)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-semibold">{message.from}</p>
                              {message.unread && <Badge variant="default" className="text-xs">New</Badge>}
                            </div>
                            <p className="font-medium text-sm mb-1">{message.subject}</p>
                            <p className="text-sm text-muted-foreground">{message.preview}</p>
                          </div>
                          <span className="text-sm text-muted-foreground ml-4">{message.date}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentTab === "maintenance" && (
              <div className="space-y-6 max-w-[1600px]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Maintenance Requests</h2>
                    <p className="text-sm text-muted-foreground">Track and submit maintenance issues</p>
                  </div>
                  <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Wrench className="h-4 w-4 mr-2" />
                        New Request
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Report Maintenance Issue</DialogTitle>
                        <DialogDescription>Describe the issue</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select value={maintenanceCategory} onValueChange={setMaintenanceCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="plumbing">Plumbing</SelectItem>
                              <SelectItem value="electrical">Electrical</SelectItem>
                              <SelectItem value="heating">Heating</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="issue">Describe the Issue</Label>
                          <Textarea
                            id="issue"
                            placeholder="Please provide details..."
                            value={maintenanceIssue}
                            onChange={(e) => setMaintenanceIssue(e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleMaintenanceSubmit}>Submit Request</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Issue</TableHead>
                        <TableHead>Date Reported</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.issue}</TableCell>
                          <TableCell>{request.date}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                request.priority === "High" && "border-red-500 text-red-500",
                                request.priority === "Medium" && "border-orange-500 text-orange-500",
                                request.priority === "Low" && "border-green-500 text-green-500"
                              )}
                            >
                              {request.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{request.assignedTo}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                request.status === "Completed" ? "default" :
                                request.status === "In Progress" ? "secondary" :
                                "outline"
                              }
                            >
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {currentTab === "service-updates" && (
              <div className="space-y-6 max-w-[1600px]">
                <div>
                  <h2 className="text-2xl font-semibold">Service Updates</h2>
                  <p className="text-sm text-muted-foreground">View completed cleaning tasks and property inspections</p>
                </div>

                {/* Completed Cleaning Tasks */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Completed Cleaning Tasks</h3>
                  </div>
                  
                  <div className="grid gap-4">
                    {completedCleaningTasks.map((task) => (
                      <Card key={task.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="default" className="bg-green-500">
                                  <Check className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(task.date).toLocaleDateString('en-GB', { 
                                    weekday: 'long', 
                                    day: 'numeric', 
                                    month: 'long', 
                                    year: 'numeric' 
                                  })}
                                </span>
                              </div>
                              <p className="font-semibold text-lg mb-1">Cleaned by {task.cleaner}</p>
                              <p className="text-sm text-muted-foreground mb-3">Duration: {task.duration}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium mb-2">Areas Cleaned:</p>
                              <div className="flex flex-wrap gap-2">
                                {task.areas.map((area, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {area}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {task.notes && (
                              <div className="pt-3 border-t">
                                <p className="text-sm font-medium mb-1">Notes:</p>
                                <p className="text-sm text-muted-foreground">{task.notes}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Completed Inspections */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Completed Inspections</h3>
                  </div>
                  
                  <div className="grid gap-4">
                    {completedInspections.map((inspection) => (
                      <Card key={inspection.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="border-blue-500 text-blue-500">
                                  {inspection.type}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(inspection.date).toLocaleDateString('en-GB', { 
                                    day: 'numeric', 
                                    month: 'long', 
                                    year: 'numeric' 
                                  })}
                                </span>
                              </div>
                              <p className="font-semibold text-lg mb-1">Inspector: {inspection.inspector}</p>
                              <p className="text-xs text-muted-foreground">Uploaded by {inspection.uploadedBy}</p>
                            </div>
                            <Badge 
                              variant={inspection.rating === "Excellent" ? "default" : "secondary"}
                              className={cn(
                                inspection.rating === "Excellent" && "bg-green-500",
                                inspection.rating === "Satisfactory" && "bg-blue-500"
                              )}
                            >
                              {inspection.rating}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="pt-3 border-t">
                              <p className="text-sm font-medium mb-2">Findings:</p>
                              <p className="text-sm text-muted-foreground">{inspection.findings}</p>
                            </div>
                            
                            <div className="flex items-center gap-2 pt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2"
                                onClick={() => handleDownloadInspectionReport(inspection)}
                              >
                                <Download className="h-4 w-4" />
                                Download Report
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="gap-2"
                                onClick={() => handleViewInspection(inspection)}
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Information Notice */}
                <Card className="border-blue-500/20 bg-blue-500/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium mb-1">Information</p>
                        <p className="text-sm text-muted-foreground">
                          This section displays completed work at your property. You cannot message service users or assign jobs - 
                          these updates are for your information only. For any concerns, please contact property management through the Messages tab.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>

        {/* View Document Dialog */}
        <Dialog open={isDocumentViewOpen} onOpenChange={setIsDocumentViewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{viewingDocument?.name}</DialogTitle>
              <DialogDescription>
                {viewingDocument?.type} • {viewingDocument?.size} • {viewingDocument?.date}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-8 border-2 border-dashed rounded-lg bg-muted/30 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Document preview would be displayed here
                </p>
                <Badge variant="outline">{viewingDocument?.status}</Badge>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => viewingDocument && handleDownloadDocument(viewingDocument)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={() => setIsDocumentViewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Message Dialog */}
        <Dialog open={isMessageViewOpen} onOpenChange={setIsMessageViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewingMessage?.subject}</DialogTitle>
              <DialogDescription>
                From: {viewingMessage?.from} • {viewingMessage?.date}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-6 rounded-lg border bg-muted/30">
                <p className="text-sm leading-relaxed">
                  {viewingMessage?.preview}
                  <br /><br />
                  This is the full message content. In a real application, this would contain 
                  the complete message text with proper formatting and any attachments.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsMessageViewOpen(false);
                setIsMessageDialogOpen(true);
              }}>
                <Send className="h-4 w-4 mr-2" />
                Reply
              </Button>
              <Button onClick={() => setIsMessageViewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Inspection Dialog */}
        <Dialog open={isInspectionViewOpen} onOpenChange={setIsInspectionViewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{viewingInspection?.type}</DialogTitle>
              <DialogDescription>
                Conducted by {viewingInspection?.inspector} on {viewingInspection?.date}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Inspector</p>
                  <p className="font-semibold">{viewingInspection?.inspector}</p>
                  <p className="text-xs text-muted-foreground">{viewingInspection?.uploadedBy}</p>
                </div>
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="font-semibold">
                    {viewingInspection?.date && new Date(viewingInspection.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Rating</p>
                  <Badge variant={viewingInspection?.rating === "Excellent" ? "default" : "secondary"}>
                    {viewingInspection?.rating}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 rounded-lg border">
                <p className="text-sm font-medium mb-2">Findings:</p>
                <p className="text-sm text-muted-foreground">{viewingInspection?.findings}</p>
              </div>

              <div className="p-8 border-2 border-dashed rounded-lg bg-muted/30 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Full inspection report would be displayed here
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => viewingInspection && handleDownloadInspectionReport(viewingInspection)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              <Button onClick={() => setIsInspectionViewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default LodgerPortal;
