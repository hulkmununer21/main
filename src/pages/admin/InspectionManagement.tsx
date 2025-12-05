import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Calendar, User, ImageIcon, AlertTriangle } from "lucide-react";

const InspectionManagement = () => {
  const inspections = [
    { 
      property: "123 Main St", 
      room: "Room 2", 
      date: "2024-12-10", 
      inspector: "John Smith (Staff)", 
      status: "Scheduled",
      type: "Routine"
    },
    { 
      property: "456 River Rd", 
      room: "Full Property", 
      date: "2024-12-08", 
      inspector: "Sarah Wilson (Service User)", 
      status: "Completed",
      type: "Move-in"
    },
    { 
      property: "789 High St", 
      room: "Room 5", 
      date: "2024-12-05", 
      inspector: "Mike Johnson (Staff)", 
      status: "Issues Found",
      type: "Routine"
    },
    { 
      property: "321 Park Ave", 
      room: "Room 1", 
      date: "2024-12-15", 
      inspector: "Emma Davis (Staff)", 
      status: "Scheduled",
      type: "Move-out"
    },
  ];

  const completedInspections = [
    { 
      property: "456 River Rd", 
      date: "2024-11-30", 
      inspector: "Sarah Wilson", 
      result: "Pass",
      photos: 12 
    },
    { 
      property: "123 Main St", 
      date: "2024-11-25", 
      inspector: "John Smith", 
      result: "Pass",
      photos: 8 
    },
    { 
      property: "789 High St", 
      date: "2024-11-28", 
      inspector: "Mike Johnson", 
      result: "Minor Issues",
      photos: 15 
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Inspection Management</h2>
        <p className="text-muted-foreground">Schedule, track, and review property inspections</p>
      </div>

      {/* Upcoming & Active Inspections */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Scheduled Inspections</CardTitle>
              <CardDescription>Upcoming and in-progress property inspections</CardDescription>
            </div>
            <Button>
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Schedule Inspection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {inspections.map((inspection, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{inspection.property}</h4>
                        <Badge variant={
                          inspection.status === "Completed" ? "default" :
                          inspection.status === "Issues Found" ? "destructive" :
                          "secondary"
                        }>
                          {inspection.status}
                        </Badge>
                        <Badge variant="outline">{inspection.type}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Location: {inspection.room}</p>
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {inspection.date}
                        </p>
                        <p className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {inspection.inspector}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {inspection.status === "Scheduled" && (
                        <>
                          <Button size="sm" variant="outline">Edit</Button>
                          <Button size="sm">Send Reminder</Button>
                        </>
                      )}
                      {inspection.status === "Completed" && (
                        <Button size="sm" variant="outline">View Report</Button>
                      )}
                      {inspection.status === "Issues Found" && (
                        <>
                          <Button size="sm" variant="destructive">View Issues</Button>
                          <Button size="sm">Assign Follow-up</Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inspection History */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection History</CardTitle>
          <CardDescription>Recent completed inspections and reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completedInspections.map((inspection, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{inspection.property}</h4>
                        <Badge variant={inspection.result === "Pass" ? "default" : "outline"}>
                          {inspection.result}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Date: {inspection.date}</p>
                        <p>Inspector: {inspection.inspector}</p>
                        <p className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {inspection.photos} photos uploaded
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">View Report</Button>
                      <Button size="sm" variant="outline">Download</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <ClipboardCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">28</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-3 rounded-full">
                <ClipboardCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">94%</p>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 p-3 rounded-full">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Issues Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InspectionManagement;
