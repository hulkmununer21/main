import { useState, useEffect } from "react";
import { Bell, User, LogOut, Wrench, Calendar, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/mobile/BottomNav";
import { LodgerProfile } from "@/contexts/AuthContextTypes";
import { supabase } from "@/lib/supabaseClient";

const LodgerMaintenance = () => {
  const { logout, user } = useAuth();
  const [maintenanceIssue, setMaintenanceIssue] = useState("");
  const [maintenanceCategory, setMaintenanceCategory] = useState("");
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [tenancy, setTenancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const lodgerProfile = user?.profile as LodgerProfile;

  useEffect(() => {
    const fetchData = async () => {
      if (!lodgerProfile?.id) return;

      try {
        setLoading(true);

        // Fetch active tenancy (needed for submitting requests)
        const { data: tenancyData, error: tenancyError } = await supabase
          .from('tenancies')
          .select(`
            *,
            room:rooms(*),
            property:properties(*)
          `)
          .eq('lodger_id', lodgerProfile.id)
          .eq('tenancy_status', 'active')
          .maybeSingle();
        if (tenancyError) console.error("Error fetching tenancy:", tenancyError);
        else setTenancy(tenancyData);

        // Fetch maintenance requests
        const { data: requestsData, error: requestsError } = await supabase
          .from('maintenance_requests')
          .select('*')
          .eq('lodger_id', lodgerProfile.id)
          .order('created_at', { ascending: false });
        if (requestsError) {
          console.error("Error fetching maintenance requests:", requestsError);
          toast({
            title: "Error Loading Data",
            description: "Could not load maintenance requests. Please try again.",
            variant: "destructive",
          });
        } else {
          setMaintenanceRequests(requestsData || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lodgerProfile?.id]);

  const handleMaintenanceSubmit = async () => {
    if (!maintenanceIssue || !maintenanceCategory) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!lodgerProfile?.id || !tenancy) {
      toast({
        title: "Error",
        description: "Unable to submit request. Please ensure you have an active tenancy.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('maintenance_requests')
        .insert({
          lodger_id: lodgerProfile.id,
          property_id: tenancy.property_id,
          room_id: tenancy.room_id,
          category: maintenanceCategory,
          description: maintenanceIssue,
          priority: 'medium',
          request_status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your maintenance request has been submitted successfully.",
      });

      // Refresh the list
      const { data: requestsData } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('lodger_id', lodgerProfile.id)
        .order('created_at', { ascending: false });
      if (requestsData) setMaintenanceRequests(requestsData);

      setMaintenanceIssue("");
      setMaintenanceCategory("");
    } catch (error) {
      console.error("Error submitting maintenance request:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit maintenance request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      high: "border-red-600 text-red-600",
      medium: "border-yellow-600 text-yellow-600",
      low: "border-green-600 text-green-600"
    };
    return priorityColors[priority as keyof typeof priorityColors] || "";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { variant: "outline" as const, className: "border-green-600 text-green-600" };
      case 'in_progress':
        return { variant: "default" as const, className: "bg-blue-600" };
      default:
        return { variant: "secondary" as const, className: "" };
    }
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
                {loading ? (
                  <p className="text-muted-foreground">Loading maintenance requests...</p>
                ) : maintenanceRequests.length === 0 ? (
                  <p className="text-muted-foreground">No maintenance requests found.</p>
                ) : (
                  <div className="space-y-4">
                    {maintenanceRequests.map((request) => {
                      const statusBadge = getStatusBadge(request.request_status);
                      return (
                        <div
                          key={request.id}
                          className="p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium">{request.description || "No description"}</p>
                            <Badge
                              variant={statusBadge.variant}
                              className={statusBadge.className}
                            >
                              {request.request_status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Pending"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {request.reported_date 
                                ? new Date(request.reported_date).toLocaleDateString('en-GB')
                                : "N/A"}
                            </span>
                            <Badge
                              variant="outline"
                              className={getPriorityBadge(request.priority || 'medium')}
                            >
                              {request.priority?.charAt(0).toUpperCase() + request.priority?.slice(1) || "Medium"} Priority
                            </Badge>
                          </div>
                          {request.property?.property_name && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {request.property.property_name} - Room {request.room?.room_number || "N/A"}
                            </p>
                          )}
                          {request.assigned_to && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Assigned to: {request.assigned_to}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  <Button 
                    className="w-full" 
                    onClick={handleMaintenanceSubmit}
                    disabled={submitting || !tenancy}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                  {!tenancy && !loading && (
                    <p className="text-xs text-destructive">
                      You need an active tenancy to submit maintenance requests.
                    </p>
                  )}
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
