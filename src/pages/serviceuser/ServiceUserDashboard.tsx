import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const dummyStats = {
  activeTasks: 3,
  completedTasks: 45,
  overdueTasks: 1,
};

const notifications = [
  { id: 1, message: "New cleaning task assigned for 123 Main St.", date: "2025-12-09", type: "info" },
  { id: 2, message: "Inspection report uploaded for 456 River Rd.", date: "2025-12-08", type: "success" },
  { id: 3, message: "Plumbing repair scheduled for 789 High St.", date: "2025-12-07", type: "warning" },
];

const ServiceUserDashboard = () => (
  <div className="container mx-auto py-8 px-4 space-y-8">
    <h1 className="text-3xl font-bold mb-4">Service User Dashboard</h1>
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <div>
            <p className="text-2xl font-bold">{dummyStats.completedTasks}</p>
            <p className="text-muted-foreground">Completed Tasks</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Wrench className="w-8 h-8 text-blue-600" />
          <div>
            <p className="text-2xl font-bold">{dummyStats.activeTasks}</p>
            <p className="text-muted-foreground">Active Tasks</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <div>
            <p className="text-2xl font-bold">{dummyStats.overdueTasks}</p>
            <p className="text-muted-foreground">Overdue Tasks</p>
          </div>
        </CardContent>
      </Card>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {notifications.map((notif) => (
            <li key={notif.id} className="flex items-center gap-3">
              <Badge variant={notif.type === "success" ? "default" : notif.type === "warning" ? "destructive" : "secondary"}>{notif.type}</Badge>
              <span>{notif.message}</span>
              <span className="ml-auto text-xs text-muted-foreground">{notif.date}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
    <div className="flex gap-4 mt-8">
      <Link to="/serviceuser/tasks" className="btn btn-primary">View Tasks</Link>
      <Link to="/serviceuser/uploads" className="btn btn-outline">Upload Reports</Link>
      <Link to="/serviceuser/profile" className="btn btn-secondary">Profile</Link>
    </div>
  </div>
);

export default ServiceUserDashboard;
