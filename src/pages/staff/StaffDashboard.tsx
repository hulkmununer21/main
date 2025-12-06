import { Building2, Trash2, Camera, AlertTriangle, Sparkles, ClipboardList, CheckCircle, Clock, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const StaffDashboard = () => {
  const todaysTasks = [
    { id: 1, type: "bin", title: "Bin Duty Check - 123 Main St", time: "9:00 AM", status: "pending", property: "Modern City Centre Studio" },
    { id: 2, type: "inspection", title: "Property Inspection", time: "10:30 AM", status: "pending", property: "Riverside Apartment" },
    { id: 3, type: "cleaning", title: "Verify Cleaning Report", time: "11:00 AM", status: "requires_evidence", property: "Executive Penthouse" },
    { id: 4, type: "complaint", title: "Resolve Noise Complaint", time: "2:00 PM", status: "in_progress", property: "Garden View Flat" },
    { id: 5, type: "service", title: "Verify Service User Upload", time: "3:30 PM", status: "pending", property: "City Loft" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "requires_evidence":
        return <Badge variant="destructive">Requires Evidence</Badge>;
      case "missed":
        return <Badge variant="destructive">Missed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "bin":
        return <Trash2 className="w-4 h-4" />;
      case "inspection":
        return <Camera className="w-4 h-4" />;
      case "cleaning":
        return <Sparkles className="w-4 h-4" />;
      case "complaint":
        return <AlertTriangle className="w-4 h-4" />;
      case "service":
        return <ClipboardList className="w-4 h-4" />;
      default:
        return <ClipboardList className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Properties Assigned</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bin Duties Today</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-full">
                <Trash2 className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Inspections Due</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <Camera className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Open Complaints</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <div className="bg-destructive/10 p-3 rounded-full">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Verifications</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-full">
                <Sparkles className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Tasks Assigned Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-muted p-2 rounded-full">
                      {getTaskIcon(task.type)}
                    </div>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.property}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {task.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(task.status)}
                    <div className="flex gap-2">
                      {task.status !== "completed" && (
                        <>
                          <Button size="sm" variant="outline">
                            <Upload className="w-4 h-4 mr-1" />
                            Evidence
                          </Button>
                          <Button size="sm">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Upcoming */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bin Duties Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">In-House Rotation</p>
                  <p className="text-xs text-muted-foreground">Room 3 → Room 4</p>
                  <p className="text-xs text-muted-foreground">123 Main St</p>
                  <Badge variant="secondary" className="mt-2">Due Today</Badge>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">Council Collection</p>
                  <p className="text-xs text-muted-foreground">General Waste</p>
                  <p className="text-xs text-muted-foreground">456 River Rd</p>
                  <Badge className="bg-green-500 mt-2">Completed</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">Modern City Centre Studio</p>
                  <p className="text-xs text-muted-foreground">Today, 10:30 AM</p>
                  <Badge variant="secondary" className="mt-2">Scheduled</Badge>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">Executive Penthouse</p>
                  <p className="text-xs text-muted-foreground">Tomorrow, 2:00 PM</p>
                  <Badge variant="outline" className="mt-2">Upcoming</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
