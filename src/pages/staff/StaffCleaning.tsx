import { Sparkles, CheckCircle, Clock, Eye, Upload, AlertTriangle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const StaffCleaning = () => {
  const [selectedTask, setSelectedTask] = useState<number | null>(null);

  const pendingVerification = [
    { id: 1, property: "123 Main St", task: "Kitchen Deep Clean", uploadedBy: "Service User - John", date: "2 hours ago", photos: 4 },
    { id: 2, property: "456 River Rd", task: "Bathroom Cleaning", uploadedBy: "Service User - Sarah", date: "5 hours ago", photos: 3 },
    { id: 3, property: "789 High St", task: "Common Area Maintenance", uploadedBy: "Service User - Mike", date: "Yesterday", photos: 6 },
  ];

  const maintenanceTasks = [
    { id: 1, property: "Modern City Centre Studio", task: "Replace Light Bulbs", priority: "Low", status: "pending", dueDate: "Dec 8" },
    { id: 2, property: "Riverside Apartment", task: "Fix Dripping Tap", priority: "Medium", status: "in_progress", dueDate: "Dec 6" },
    { id: 3, property: "Executive Penthouse", task: "Check Smoke Detectors", priority: "High", status: "pending", dueDate: "Today" },
    { id: 4, property: "Garden View Flat", task: "Garden Maintenance", priority: "Low", status: "completed", dueDate: "Dec 1" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge variant="destructive">High</Badge>;
      case "Medium":
        return <Badge className="bg-orange-500">Medium</Badge>;
      case "Low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
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
                <p className="text-2xl font-bold">3</p>
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
                <p className="text-sm text-muted-foreground mb-1">Maintenance Tasks</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed This Week</p>
                <p className="text-2xl font-bold">12</p>
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
                <p className="text-2xl font-bold">1</p>
              </div>
              <div className="bg-destructive/10 p-3 rounded-full">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Cleaning Reports - Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingVerification.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{item.task}</p>
                      <p className="text-sm text-muted-foreground">{item.property}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.uploadedBy} • {item.date} • {item.photos} photos
                      </p>
                    </div>
                    <Badge variant="secondary">Awaiting Review</Badge>
                  </div>
                  
                  {selectedTask === item.id ? (
                    <div className="space-y-3 mt-4">
                      <Textarea placeholder="Add internal notes (optional)..." className="min-h-[80px]" />
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 flex-1">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1">
                          Reject
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedTask(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        View Photos
                      </Button>
                      <Button size="sm" onClick={() => setSelectedTask(item.id)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Maintenance Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maintenanceTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{task.task}</p>
                      {getPriorityBadge(task.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground">{task.property}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due: {task.dueDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(task.status)}
                    {task.status !== "completed" && (
                      <Button size="sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffCleaning;
