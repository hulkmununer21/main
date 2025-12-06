import { Camera, Calendar, MapPin, CheckCircle, Upload, Eye, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const StaffInspections = () => {
  const scheduledInspections = [
    { id: 1, property: "Modern City Centre Studio", address: "123 Main St", date: "Today", time: "10:30 AM", type: "Quarterly", status: "scheduled" },
    { id: 2, property: "Riverside Apartment", address: "456 River Rd", date: "Tomorrow", time: "2:00 PM", type: "Monthly", status: "scheduled" },
    { id: 3, property: "Executive Penthouse", address: "789 High St", date: "Dec 10", time: "11:00 AM", type: "Annual", status: "scheduled" },
  ];

  const completedInspections = [
    { id: 1, property: "Garden View Flat", address: "101 Park Lane", date: "Dec 1", result: "Pass", issues: 0 },
    { id: 2, property: "City Loft", address: "202 Tower St", date: "Nov 28", result: "Minor Issues", issues: 2 },
    { id: 3, property: "Suburban House", address: "303 Green Ave", date: "Nov 25", result: "Pass", issues: 0 },
  ];

  const pendingVerification = [
    { id: 1, property: "Modern City Centre Studio", uploadedBy: "Service User", date: "2 hours ago", type: "Room Inspection Photos" },
    { id: 2, property: "Executive Penthouse", uploadedBy: "Service User", date: "Yesterday", type: "Common Area Check" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Scheduled</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed This Month</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Verification</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-full">
                <Eye className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pass Rate</p>
                <p className="text-2xl font-bold">92%</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <Camera className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Scheduled Inspections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Scheduled Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledInspections.map((inspection) => (
                <div key={inspection.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{inspection.property}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {inspection.address}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {inspection.date}, {inspection.time}
                      </p>
                    </div>
                    <Badge variant="outline">{inspection.type}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Camera className="w-4 h-4 mr-2" />
                      Start Inspection
                    </Button>
                    <Button size="sm" variant="outline">Details</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingVerification.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{item.property}</p>
                      <p className="text-sm text-muted-foreground">{item.type}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploaded by {item.uploadedBy} • {item.date}
                      </p>
                    </div>
                    <Badge variant="secondary">Awaiting Review</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      View Upload
                    </Button>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600">Approve</Button>
                    <Button size="sm" variant="destructive">Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completed Inspections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Recent Completed Inspections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completedInspections.map((inspection) => (
              <div key={inspection.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{inspection.property}</p>
                  <p className="text-sm text-muted-foreground">{inspection.address}</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed: {inspection.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={inspection.result === "Pass" ? "bg-green-500" : "bg-orange-500"}>
                    {inspection.result}
                  </Badge>
                  {inspection.issues > 0 && (
                    <span className="text-sm text-muted-foreground">{inspection.issues} issues</span>
                  )}
                  <Button size="sm" variant="outline">View Report</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffInspections;
