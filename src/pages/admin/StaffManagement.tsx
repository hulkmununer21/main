import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Home, Activity, Mail, Phone } from "lucide-react";

const StaffManagement = () => {
  const staffMembers = [
    {
      name: "John Smith",
      email: "john.smith@domusservitia.co.uk",
      phone: "07123 456789",
      role: "Property Manager",
      status: "Active",
      assignedProperties: 8,
      permissions: ["Properties", "Inspections", "Tenants"],
      lastActive: "2 hours ago"
    },
    {
      name: "Sarah Wilson",
      email: "sarah.wilson@domusservitia.co.uk",
      phone: "07987 654321",
      role: "Maintenance Coordinator",
      status: "Active",
      assignedProperties: 12,
      permissions: ["Maintenance", "Service Users", "Complaints"],
      lastActive: "30 mins ago"
    },
    {
      name: "Mike Johnson",
      email: "mike.johnson@domusservitia.co.uk",
      phone: "07456 123789",
      role: "Inspector",
      status: "Active",
      assignedProperties: 15,
      permissions: ["Inspections", "Reports"],
      lastActive: "1 hour ago"
    },
    {
      name: "Emma Davis",
      email: "emma.davis@domusservitia.co.uk",
      phone: "07789 321456",
      role: "Customer Support",
      status: "On Leave",
      assignedProperties: 0,
      permissions: ["Complaints", "Messages", "Notifications"],
      lastActive: "3 days ago"
    },
  ];

  const recentActivity = [
    { staff: "John Smith", action: "Completed property inspection", property: "123 Main St", time: "30 mins ago" },
    { staff: "Sarah Wilson", action: "Assigned maintenance task", property: "456 River Rd", time: "1 hour ago" },
    { staff: "Mike Johnson", action: "Uploaded inspection report", property: "789 High St", time: "2 hours ago" },
    { staff: "John Smith", action: "Sent bin reminder", property: "321 Park Ave", time: "3 hours ago" },
  ];

  const permissionsList = [
    "Properties", "Inspections", "Tenants", "Maintenance", 
    "Service Users", "Complaints", "Messages", "Notifications", 
    "Reports", "Payments"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Staff Management</h2>
        <p className="text-muted-foreground">Manage staff accounts, permissions, and activity</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{staffMembers.length}</p>
                <p className="text-sm text-muted-foreground">Total Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-3 rounded-full">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{staffMembers.filter(s => s.status === "Active").length}</p>
                <p className="text-sm text-muted-foreground">Active Now</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-3 rounded-full">
                <Home className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">35</p>
                <p className="text-sm text-muted-foreground">Properties Managed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-3 rounded-full">
                <Activity className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">124</p>
                <p className="text-sm text-muted-foreground">Actions Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Directory */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Staff Directory</CardTitle>
              <CardDescription>All staff members and their assignments</CardDescription>
            </div>
            <Button>
              <User className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {staffMembers.map((staff, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{staff.name}</h4>
                        <Badge variant="outline">{staff.role}</Badge>
                        <Badge variant={staff.status === "Active" ? "default" : "secondary"}>
                          {staff.status}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {staff.email}
                        </p>
                        <p className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {staff.phone}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">{staff.assignedProperties}</span> properties assigned
                        </p>
                        <p>Last active: {staff.lastActive}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {staff.permissions.map((perm, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="outline">View Activity</Button>
                      {staff.status === "Active" ? (
                        <Button size="sm" variant="ghost">Suspend</Button>
                      ) : (
                        <Button size="sm">Activate</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Staff Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Staff Activity</CardTitle>
          <CardDescription>Latest actions performed by staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <Activity className="w-4 h-4 mt-1 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.staff} • {activity.property} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Available Permissions</CardTitle>
          <CardDescription>System permissions that can be assigned to staff</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {permissionsList.map((permission, index) => (
              <Badge key={index} variant="outline">{permission}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffManagement;
