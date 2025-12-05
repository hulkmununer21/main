import { useState } from "react";
import { Bell, User, LogOut, Wrench, Calendar, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/mobile/BottomNav";

const LodgerMaintenance = () => {
  const { logout, user } = useAuth();
  const [maintenanceIssue, setMaintenanceIssue] = useState("");
  const [maintenanceCategory, setMaintenanceCategory] = useState("");

  const maintenanceRequests = [
    { id: 1, issue: "Leaking tap in bathroom", status: "In Progress", date: "2024-12-10", priority: "Medium" },
    { id: 2, issue: "Heating not working properly", status: "Completed", date: "2024-11-28", priority: "High" },
    { id: 3, issue: "Light bulb replacement needed", status: "Pending", date: "2024-12-12", priority: "Low" },
  ];

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
  };

  return (
    <>
      <SEO 
        title="Maintenance - Lodger Portal - Domus Dwell Manage"
        description="Submit and track maintenance requests"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Maintenance</h1>
                <p className="text-sm text-muted-foreground">Submit and track requests</p>
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

          {/* Maintenance Sections */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Active Requests</CardTitle>
                <CardDescription>Track your maintenance requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {maintenanceRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium">{request.issue}</p>
                        <Badge
                          variant={
                            request.status === "Completed"
                              ? "outline"
                              : request.status === "In Progress"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            request.status === "Completed"
                              ? "border-green-600 text-green-600"
                              : request.status === "In Progress"
                              ? "bg-blue-600"
                              : ""
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {request.date}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            request.priority === "High"
                              ? "border-red-600 text-red-600"
                              : request.priority === "Medium"
                              ? "border-yellow-600 text-yellow-600"
                              : "border-green-600 text-green-600"
                          }
                        >
                          {request.priority} Priority
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Report New Issue</CardTitle>
                <CardDescription>Submit a maintenance request</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Category</Label>
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
                    <Label>Describe the Issue</Label>
                    <Textarea
                      placeholder="Please provide details..."
                      value={maintenanceIssue}
                      onChange={(e) => setMaintenanceIssue(e.target.value)}
                      className="min-h-[150px]"
                    />
                  </div>
                  <Button className="w-full" onClick={handleMaintenanceSubmit}>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Request
                  </Button>
                </div>
              </CardContent>
            </Card>
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

export default LodgerMaintenance;
