import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, CreditCard, FileText, MessageSquare, Wrench, Send, Check, AlertCircle, DollarSign, TrendingUp, Clock, Bell, User, LogOut } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { BottomNav } from "@/components/mobile/BottomNav";

const LodgerOverview = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("750");
  const [maintenanceIssue, setMaintenanceIssue] = useState("");
  const [maintenanceCategory, setMaintenanceCategory] = useState("");

  const documents = [
    { id: 1, name: "Tenancy Agreement", type: "Contract", date: "2024-01-15", size: "2.4 MB" },
    { id: 2, name: "Inventory Report", type: "Report", date: "2024-01-20", size: "1.8 MB" },
  ];

  const messages = [
    { id: 1, from: "Property Manager", subject: "Maintenance Update", preview: "Your recent maintenance request has been...", date: "2 hours ago", unread: true },
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
    setIsMaintenanceDialogOpen(false);
    setMaintenanceIssue("");
    setMaintenanceCategory("");
  };

  return (
    <>
      <SEO 
        title="Lodger Portal - Domus Dwell Manage"
        description="Access your lodger portal to manage payments, maintenance requests, and communications"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Lodger Portal</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-border hover:shadow-elegant transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Rent</p>
                    <p className="text-2xl font-bold text-foreground">£750/mo</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      On Time
                    </Badge>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <Home className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-elegant transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Next Payment</p>
                    <p className="text-2xl font-bold text-foreground">15 days</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Jan 1, 2025
                    </Badge>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <CreditCard className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-elegant transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Documents</p>
                    <p className="text-2xl font-bold text-foreground">{documents.length}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      View All
                    </Badge>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-elegant transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Messages</p>
                    <p className="text-2xl font-bold text-foreground">{messages.filter(m => m.unread).length}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Unread
                    </Badge>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-full">
                    <MessageSquare className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Property Details */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>My Property</CardTitle>
                  <CardDescription>Your current accommodation details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <img
                      src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"
                      alt="Property"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        Modern City Centre Studio
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Manchester City Centre, M1 1AA
                      </p>
                      <div className="flex gap-4 text-sm mb-3">
                        <span className="flex items-center gap-1">
                          <Home className="h-3 w-3" /> 1 Bed
                        </span>
                        <span>1 Bath</span>
                        <span>450 sqft</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge>Studio</Badge>
                        <Badge variant="outline">Furnished</Badge>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Move-in Date</p>
                      <p className="font-medium">January 15, 2024</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Contract End</p>
                      <p className="font-medium">January 14, 2025</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Deposit Paid</p>
                      <p className="font-medium">£750.00</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Monthly Rent</p>
                      <p className="font-medium">£750.00</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                  <CardDescription>Your payment history and status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Paid (2024)</p>
                        <p className="text-2xl font-bold">£9,000</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-600 font-medium">100%</p>
                        <p className="text-xs text-muted-foreground">On-time payments</p>
                      </div>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-gold text-primary font-semibold">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Rent
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Make a Payment</DialogTitle>
                        <DialogDescription>
                          Process your rent payment securely
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount">Payment Amount (£)</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="payment-method">Payment Method</Label>
                          <Select defaultValue="card">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="card">Credit/Debit Card</SelectItem>
                              <SelectItem value="bank">Bank Transfer</SelectItem>
                              <SelectItem value="paypal">PayPal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium mb-1">Payment Summary</p>
                          <div className="flex justify-between text-sm">
                            <span>Rent Amount:</span>
                            <span className="font-semibold">£{paymentAmount}</span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handlePayment}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Wrench className="h-4 w-4 mr-2" />
                        Report Maintenance
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Report Maintenance Issue</DialogTitle>
                        <DialogDescription>
                          Describe the issue and we'll address it promptly
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="category">Issue Category</Label>
                          <Select value={maintenanceCategory} onValueChange={setMaintenanceCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="plumbing">Plumbing</SelectItem>
                              <SelectItem value="electrical">Electrical</SelectItem>
                              <SelectItem value="heating">Heating/Cooling</SelectItem>
                              <SelectItem value="appliance">Appliance</SelectItem>
                              <SelectItem value="structural">Structural</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="issue">Describe the Issue</Label>
                          <Textarea
                            id="issue"
                            placeholder="Please provide details about the maintenance issue..."
                            value={maintenanceIssue}
                            onChange={(e) => setMaintenanceIssue(e.target.value)}
                            className="min-h-[120px]"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleMaintenanceSubmit}>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Request
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="w-full" onClick={() => navigate('/lodger-portal/documents')}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Documents
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-500/10 p-2 rounded-full">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Payment Confirmed</p>
                        <p className="text-xs text-muted-foreground">Dec 1, 2024</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/10 p-2 rounded-full">
                        <Wrench className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Maintenance Completed</p>
                        <p className="text-xs text-muted-foreground">Nov 28, 2024</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-yellow-500/10 p-2 rounded-full">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Document Updated</p>
                        <p className="text-xs text-muted-foreground">Nov 25, 2024</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom padding for mobile nav */}
          <div className="h-20 md:h-0"></div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav role="lodger" />
    </>
  );
};

export default LodgerOverview;
