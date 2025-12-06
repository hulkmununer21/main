import { AlertTriangle, Clock, CheckCircle, MessageSquare, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const StaffComplaints = () => {
  const [selectedComplaint, setSelectedComplaint] = useState<number | null>(null);

  const complaints = [
    { 
      id: 1, 
      subject: "Noise Disturbance", 
      property: "123 Main St", 
      room: "Room 3",
      priority: "High", 
      status: "open", 
      dateReported: "Dec 3, 2024",
      description: "Excessive noise from neighboring room during night hours."
    },
    { 
      id: 2, 
      subject: "Heating Issue", 
      property: "456 River Rd", 
      room: "Room 1",
      priority: "Medium", 
      status: "in_progress", 
      dateReported: "Dec 2, 2024",
      description: "Radiator not working properly in bedroom."
    },
    { 
      id: 3, 
      subject: "Broken Window Lock", 
      property: "789 High St", 
      room: "Room 5",
      priority: "High", 
      status: "open", 
      dateReported: "Dec 1, 2024",
      description: "Window lock is broken and window cannot be secured."
    },
    { 
      id: 4, 
      subject: "WiFi Connectivity", 
      property: "101 Park Lane", 
      room: "Common Area",
      priority: "Low", 
      status: "resolved", 
      dateReported: "Nov 28, 2024",
      description: "WiFi signal weak in common area."
    },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge variant="destructive">High Priority</Badge>;
      case "Medium":
        return <Badge className="bg-orange-500">Medium</Badge>;
      case "Low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-500">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Open Complaints</p>
                <p className="text-2xl font-bold">2</p>
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
                <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                <p className="text-2xl font-bold">1</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resolved This Month</p>
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
                <p className="text-sm text-muted-foreground mb-1">High Priority</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-full">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Assigned Complaints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{complaint.subject}</p>
                      {getPriorityBadge(complaint.priority)}
                      {getStatusBadge(complaint.status)}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {complaint.property} - {complaint.room}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reported: {complaint.dateReported}
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{complaint.description}</p>
                
                {selectedComplaint === complaint.id ? (
                  <div className="space-y-3 mt-4 p-4 bg-muted rounded-lg">
                    <Textarea placeholder="Add update or resolution notes..." className="min-h-[80px]" />
                    <div className="flex gap-2">
                      {complaint.status !== "resolved" && (
                        <>
                          <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                            Mark In Progress
                          </Button>
                          <Button size="sm" className="bg-green-500 hover:bg-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Notify Admin
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedComplaint(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedComplaint(complaint.id)}>
                      Update Status
                    </Button>
                    {complaint.status !== "resolved" && (
                      <Button size="sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Quick Resolve
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffComplaints;
