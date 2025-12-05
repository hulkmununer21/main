import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, User, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";

const ServiceUsers = () => {
  const serviceUsers = [
    {
      name: "James Wilson",
      type: "Cleaner",
      phone: "07123 456789",
      email: "james@cleaning.co.uk",
      status: "Active",
      activeTasks: 3,
      completedTasks: 45
    },
    {
      name: "Rachel Green",
      type: "Plumber",
      phone: "07987 654321",
      email: "rachel@plumbing.co.uk",
      status: "Active",
      activeTasks: 2,
      completedTasks: 32
    },
    {
      name: "David Brown",
      type: "Electrician",
      phone: "07456 123789",
      email: "david@electric.co.uk",
      status: "Active",
      activeTasks: 1,
      completedTasks: 28
    },
    {
      name: "Maria Garcia",
      type: "Inspector",
      phone: "07789 321456",
      email: "maria@inspect.co.uk",
      status: "On Leave",
      activeTasks: 0,
      completedTasks: 67
    },
  ];

  const assignedTasks = [
    {
      serviceUser: "James Wilson",
      property: "123 Main St",
      taskType: "Deep Cleaning",
      description: "Post-tenancy deep clean of Room 3",
      dueDate: "2024-12-08",
      status: "In Progress",
      assignedDate: "2024-12-01"
    },
    {
      serviceUser: "Rachel Green",
      property: "456 River Rd",
      taskType: "Plumbing Repair",
      description: "Fix leaking tap in bathroom",
      dueDate: "2024-12-06",
      status: "Scheduled",
      assignedDate: "2024-11-30"
    },
    {
      serviceUser: "David Brown",
      property: "789 High St",
      taskType: "Electrical Check",
      description: "Annual electrical safety inspection",
      dueDate: "2024-12-10",
      status: "Scheduled",
      assignedDate: "2024-12-02"
    },
    {
      serviceUser: "James Wilson",
      property: "321 Park Ave",
      taskType: "Cleaning",
      description: "Weekly communal area cleaning",
      dueDate: "2024-12-05",
      status: "Completed",
      assignedDate: "2024-11-28"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Service User Management</h2>
        <p className="text-muted-foreground">Manage cleaners, contractors, and service providers</p>
      </div>

      {/* Service Users Directory */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Service Users Directory</CardTitle>
              <CardDescription>All registered service providers and contractors</CardDescription>
            </div>
            <Button>
              <User className="w-4 h-4 mr-2" />
              Add Service User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {serviceUsers.map((user, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{user.name}</h4>
                        <Badge variant="outline">{user.type}</Badge>
                        <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                          {user.status}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <p>Phone: {user.phone}</p>
                        <p>Email: {user.email}</p>
                        <p><span className="font-medium text-foreground">{user.activeTasks}</span> active tasks</p>
                        <p><span className="font-medium text-foreground">{user.completedTasks}</span> completed</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm">Assign Task</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assigned Tasks */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Assigned Tasks</CardTitle>
              <CardDescription>Track work assigned to service users</CardDescription>
            </div>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              View Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assignedTasks.map((task, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{task.taskType}</h4>
                        <Badge variant={
                          task.status === "Completed" ? "default" :
                          task.status === "In Progress" ? "secondary" :
                          "outline"
                        }>
                          {task.status === "Completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {task.status === "In Progress" && <Clock className="w-3 h-3 mr-1" />}
                          {task.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">{task.description}</p>
                        <p>Property: {task.property}</p>
                        <p>Service User: {task.serviceUser}</p>
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {task.dueDate} | Assigned: {task.assignedDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {task.status === "Scheduled" && (
                        <>
                          <Button size="sm" variant="outline">Edit</Button>
                          <Button size="sm">Send Reminder</Button>
                        </>
                      )}
                      {task.status === "In Progress" && (
                        <Button size="sm">Mark Complete</Button>
                      )}
                      {task.status === "Completed" && (
                        <Button size="sm" variant="outline">View Report</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{serviceUsers.length}</p>
                <p className="text-sm text-muted-foreground">Total Service Users</p>
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
                <p className="text-2xl font-bold">6</p>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
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
                <p className="text-2xl font-bold">172</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-3 rounded-full">
                <Wrench className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">Service Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServiceUsers;
