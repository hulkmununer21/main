import { Users, Eye, CheckCircle, Clock, FileText, Upload, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const StaffServiceUsers = () => {
  const [selectedTask, setSelectedTask] = useState<number | null>(null);

  const serviceUserTasks = [
    { 
      id: 1, 
      serviceUser: "John D.", 
      task: "Kitchen Deep Clean", 
      property: "123 Main St",
      status: "pending_verification",
      uploadDate: "2 hours ago",
      photos: 4,
      notes: "Completed full kitchen clean including appliances"
    },
    { 
      id: 2, 
      serviceUser: "Sarah M.", 
      task: "Bathroom Sanitization", 
      property: "456 River Rd",
      status: "pending_verification",
      uploadDate: "5 hours ago",
      photos: 3,
      notes: "Deep cleaned all bathroom surfaces"
    },
    { 
      id: 3, 
      serviceUser: "Mike R.", 
      task: "Garden Maintenance", 
      property: "789 High St",
      status: "verified",
      uploadDate: "Yesterday",
      photos: 6,
      notes: "Mowed lawn and trimmed hedges"
    },
    { 
      id: 4, 
      serviceUser: "Anna K.", 
      task: "Window Cleaning", 
      property: "101 Park Lane",
      status: "rejected",
      uploadDate: "2 days ago",
      photos: 2,
      notes: "External windows cleaned",
      rejectionReason: "Photos unclear, please re-submit"
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_verification":
        return <Badge variant="secondary">Awaiting Review</Badge>;
      case "verified":
        return <Badge className="bg-green-500">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
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
                <p className="text-sm text-muted-foreground mb-1">Verified Today</p>
                <p className="text-2xl font-bold">5</p>
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
                <p className="text-sm text-muted-foreground mb-1">Active Service Users</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rejected This Week</p>
                <p className="text-2xl font-bold">1</p>
              </div>
              <div className="bg-destructive/10 p-3 rounded-full">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service User Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Service User Task Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviceUserTasks.map((task) => (
              <div key={task.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{task.task}</p>
                      {getStatusBadge(task.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Service User: {task.serviceUser} • {task.property}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Uploaded {task.uploadDate} • {task.photos} photos
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  <span className="font-medium">Notes:</span> {task.notes}
                </p>
                
                {task.rejectionReason && (
                  <div className="p-2 bg-destructive/10 rounded mb-3">
                    <p className="text-sm text-destructive">
                      <span className="font-medium">Rejection reason:</span> {task.rejectionReason}
                    </p>
                  </div>
                )}
                
                {selectedTask === task.id && task.status === "pending_verification" ? (
                  <div className="space-y-3 mt-4 p-4 bg-muted rounded-lg">
                    <Textarea placeholder="Add internal notes or rejection reason..." className="min-h-[80px]" />
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-500 hover:bg-green-600 flex-1">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1">
                        Reject
                      </Button>
                      <Button size="sm" variant="outline">
                        Notify Admin
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedTask(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Photos
                    </Button>
                    {task.status === "pending_verification" && (
                      <Button size="sm" onClick={() => setSelectedTask(task.id)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Review
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

export default StaffServiceUsers;
