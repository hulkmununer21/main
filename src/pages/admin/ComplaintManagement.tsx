import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, AlertTriangle, Clock, CheckCircle, User } from "lucide-react";

const ComplaintManagement = () => {
  const complaints = [
    {
      id: "#C0045",
      lodger: "Tom Brown",
      property: "789 High St",
      room: "Room 5",
      category: "Maintenance",
      subject: "Heating not working",
      description: "The heating system in my room has stopped working. It's very cold.",
      priority: "High",
      status: "In Progress",
      assignedTo: "Sarah Wilson (Staff)",
      dateSubmitted: "2024-12-01",
      lastUpdated: "2024-12-01 14:30"
    },
    {
      id: "#C0044",
      lodger: "Lisa Green",
      property: "123 Main St",
      room: "Room 2",
      category: "Communication",
      subject: "No response to maintenance request",
      description: "I submitted a maintenance request 2 weeks ago but haven't received any response.",
      priority: "Medium",
      status: "Received",
      assignedTo: null,
      dateSubmitted: "2024-11-30",
      lastUpdated: "2024-11-30 10:00"
    },
    {
      id: "#C0043",
      lodger: "Mark Johnson",
      property: "456 River Rd",
      room: "Room 3",
      category: "Service Quality",
      subject: "Cleaner missed scheduled visit",
      description: "The scheduled cleaning service did not arrive on the agreed date.",
      priority: "Low",
      status: "Resolved",
      assignedTo: "John Smith (Staff)",
      dateSubmitted: "2024-11-28",
      lastUpdated: "2024-11-29 16:00"
    },
    {
      id: "#C0042",
      lodger: "Sophie Chen",
      property: "321 Park Ave",
      room: "Room 1",
      category: "Billing",
      subject: "Incorrect extra charge",
      description: "I was charged for a missed bin duty, but I completed my duty on time.",
      priority: "High",
      status: "In Progress",
      assignedTo: "Emma Davis (Staff)",
      dateSubmitted: "2024-11-27",
      lastUpdated: "2024-11-28 09:00"
    },
  ];

  const categories = [
    "Maintenance",
    "Service Quality",
    "Communication",
    "Billing",
    "Property Condition",
    "Staff Conduct",
    "Other"
  ];

  const complaintStats = {
    total: 45,
    highPriority: 8,
    inProgress: 12,
    resolved: 28
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Complaint Management</h2>
        <p className="text-muted-foreground">Track and resolve lodger complaints</p>
      </div>

      {/* Complaint Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{complaintStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Complaints</p>
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
                <p className="text-2xl font-bold">{complaintStats.highPriority}</p>
                <p className="text-sm text-muted-foreground">High Priority</p>
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
                <p className="text-2xl font-bold">{complaintStats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
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
                <p className="text-2xl font-bold">{complaintStats.resolved}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Complaints */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Complaints</CardTitle>
              <CardDescription>View and manage lodger complaints</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Filter</Button>
              <Button variant="outline">Export</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {complaints.map((complaint, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-muted-foreground">{complaint.id}</span>
                        <h4 className="font-semibold">{complaint.subject}</h4>
                        <Badge variant={
                          complaint.priority === "High" ? "destructive" :
                          complaint.priority === "Medium" ? "secondary" :
                          "outline"
                        }>
                          {complaint.priority}
                        </Badge>
                        <Badge variant={
                          complaint.status === "Resolved" ? "default" :
                          complaint.status === "In Progress" ? "secondary" :
                          "outline"
                        }>
                          {complaint.status === "Resolved" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {complaint.status === "In Progress" && <Clock className="w-3 h-3 mr-1" />}
                          {complaint.status}
                        </Badge>
                        <Badge variant="outline">{complaint.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{complaint.description}</p>
                      <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground">Lodger:</span> {complaint.lodger}</p>
                        <p><span className="font-medium text-foreground">Property:</span> {complaint.property} - {complaint.room}</p>
                        <p><span className="font-medium text-foreground">Submitted:</span> {complaint.dateSubmitted}</p>
                        <p><span className="font-medium text-foreground">Last Update:</span> {complaint.lastUpdated}</p>
                        {complaint.assignedTo && (
                          <p className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Assigned to: {complaint.assignedTo}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {complaint.status === "Received" && (
                        <>
                          <Button size="sm">Assign to Staff</Button>
                          <Button size="sm" variant="outline">Change Priority</Button>
                        </>
                      )}
                      {complaint.status === "In Progress" && (
                        <>
                          <Button size="sm">Mark Resolved</Button>
                          <Button size="sm" variant="outline">Add Note</Button>
                          <Button size="sm" variant="ghost">Contact Lodger</Button>
                        </>
                      )}
                      {complaint.status === "Resolved" && (
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

      {/* Categories Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Complaint Categories</CardTitle>
          <CardDescription>Standard complaint classification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <Badge key={index} variant="secondary">{category}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplaintManagement;
