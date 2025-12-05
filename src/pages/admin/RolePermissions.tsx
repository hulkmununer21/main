import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCog, Shield, User, Lock, CheckCircle } from "lucide-react";

const RolePermissions = () => {
  const roles = [
    {
      role: "Admin",
      description: "Full system access and control",
      userCount: 2,
      permissions: [
        "Manage Users",
        "Manage Properties",
        "Manage Staff",
        "Manage Service Users",
        "Financial Reports",
        "System Settings",
        "All Modules",
      ],
      canDelete: false
    },
    {
      role: "Staff",
      description: "Operational tasks and property management",
      userCount: 28,
      permissions: [
        "View Properties",
        "Conduct Inspections",
        "Manage Complaints",
        "Send Notifications",
        "Upload Documents",
        "Assign Tasks",
      ],
      canDelete: false
    },
    {
      role: "Landlord",
      description: "View their properties and tenant information",
      userCount: 45,
      permissions: [
        "View Own Properties",
        "View Tenant List",
        "View Financial Reports",
        "View Maintenance Status",
      ],
      canDelete: false
    },
    {
      role: "Lodger",
      description: "Access to personal account and services",
      userCount: 234,
      permissions: [
        "View Own Tenancy",
        "Make Payments",
        "Submit Maintenance Requests",
        "Submit Complaints",
        "View Documents",
        "Update Profile",
      ],
      canDelete: false
    },
    {
      role: "Service User",
      description: "Access to assigned tasks only",
      userCount: 15,
      permissions: [
        "View Assigned Tasks",
        "Upload Task Reports",
        "Update Task Status",
        "View Property Details",
      ],
      canDelete: false
    },
  ];

  const allPermissions = [
    { module: "User Management", permissions: ["Create Users", "Edit Users", "Delete Users", "View Users", "Suspend Users"] },
    { module: "Properties", permissions: ["Add Properties", "Edit Properties", "Delete Properties", "View Properties"] },
    { module: "Inspections", permissions: ["Schedule Inspections", "Conduct Inspections", "View Reports", "Upload Photos"] },
    { module: "Bin Management", permissions: ["Set Rotation", "Send Reminders", "View Logs", "Apply Charges"] },
    { module: "Payments", permissions: ["Process Payments", "View Financial Data", "Generate Invoices", "Add Charges"] },
    { module: "Complaints", permissions: ["View Complaints", "Assign Complaints", "Resolve Complaints", "Add Notes"] },
    { module: "Documents", permissions: ["Upload Documents", "View Documents", "Delete Documents", "Request Updates"] },
    { module: "Notifications", permissions: ["Send SMS", "Send Emails", "View Logs", "Resend Messages"] },
    { module: "Staff", permissions: ["Add Staff", "Edit Staff", "Assign Properties", "View Activity"] },
    { module: "System", permissions: ["Change Settings", "View Logs", "Manage Roles", "Export Data"] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Role & Permission Management</h2>
        <p className="text-muted-foreground">Control access levels and permissions for different user types</p>
      </div>

      {/* Role Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <UserCog className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roles.length}</p>
                <p className="text-sm text-muted-foreground">User Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-3 rounded-full">
                <User className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roles.reduce((sum, r) => sum + r.userCount, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-3 rounded-full">
                <Lock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allPermissions.length}</p>
                <p className="text-sm text-muted-foreground">Permission Modules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-3 rounded-full">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-sm text-muted-foreground">Security Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>Defined roles and their permissions</CardDescription>
            </div>
            <Button>
              <UserCog className="w-4 h-4 mr-2" />
              Create Custom Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roles.map((role, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{role.role}</h4>
                        <Badge variant="outline">{role.userCount} users</Badge>
                        {!role.canDelete && (
                          <Badge variant="secondary">System Role</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Permissions:</p>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.map((permission, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button size="sm" variant="outline">Edit Permissions</Button>
                      <Button size="sm" variant="ghost">View Users</Button>
                      {role.canDelete && (
                        <Button size="sm" variant="destructive">Delete Role</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Modules</CardTitle>
          <CardDescription>Available system permissions by module</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allPermissions.map((module, index) => (
              <div key={index} className="border-b pb-4 last:border-0">
                <h4 className="font-semibold mb-2">{module.module}</h4>
                <div className="flex flex-wrap gap-2">
                  {module.permissions.map((perm, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• System roles (Admin, Staff, Landlord, Lodger, Service User) cannot be deleted</p>
          <p>• Changes to permissions take effect immediately</p>
          <p>• All permission changes are logged in the System Logs</p>
          <p>• Users with Admin role have full system access</p>
          <p>• Regularly review and audit user permissions</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolePermissions;
