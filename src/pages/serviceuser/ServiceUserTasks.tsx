import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Wrench, CheckCircle } from "lucide-react";

const dummyTasks = [
  { id: 1, property: "123 Main St", unit: "Room 3", type: "Cleaning", description: "Post-tenancy deep clean", dueDate: "2025-12-10", status: "In Progress" },
  { id: 2, property: "456 River Rd", unit: "Flat 2", type: "Plumbing Repair", description: "Fix leaking tap", dueDate: "2025-12-12", status: "Scheduled" },
  { id: 3, property: "789 High St", unit: "Room 5", type: "Inspection", description: "Annual safety inspection", dueDate: "2025-12-15", status: "Completed" },
];

const ServiceUserTasks = () => (
  <div className="container mx-auto py-8 px-4 space-y-8">
    <h1 className="text-2xl font-bold mb-4">Assigned Tasks</h1>
    <div className="grid gap-6">
      {dummyTasks.map((task) => (
        <Card key={task.id}>
          <CardHeader>
            <CardTitle>{task.type} - {task.property} ({task.unit})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-2">
              <Badge variant={task.status === "Completed" ? "default" : task.status === "In Progress" ? "secondary" : "outline"}>{task.status}</Badge>
              <span className="text-muted-foreground text-sm">Due: {task.dueDate}</span>
            </div>
            <p className="mb-2">{task.description}</p>
            <div className="flex gap-2">
              <button className="btn btn-outline">View Details</button>
              {task.status !== "Completed" && <button className="btn btn-primary">Mark as Completed</button>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default ServiceUserTasks;
