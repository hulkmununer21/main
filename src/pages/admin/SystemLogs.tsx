import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileStack, Activity, User, Settings, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const SystemLogs = () => {
  const logs = [
    {
      id: "#L1245",
      timestamp: "2024-12-02 09:15:32",
      user: "admin@domusservitia.co.uk",
      action: "User Login",
      category: "Authentication",
      details: "Successful login from IP 192.168.1.100",
      severity: "Info"
    },
    {
      id: "#L1244",
      timestamp: "2024-12-02 09:10:15",
      user: "sarah.wilson@domusservitia.co.uk",
      action: "Inspection Completed",
      category: "Inspection",
      details: "Inspection report uploaded for 123 Main St",
      severity: "Info"
    },
    {
      id: "#L1243",
      timestamp: "2024-12-02 08:45:22",
      user: "System",
      action: "Bin Reminder Sent",
      category: "Notifications",
      details: "SMS reminder sent to 5 lodgers for bin duty",
      severity: "Info"
    },
    {
      id: "#L1242",
      timestamp: "2024-12-02 08:30:47",
      user: "admin@domusservitia.co.uk",
      action: "Extra Charge Added",
      category: "Billing",
      details: "£25 charge added to Tom Brown for missed bin duty",
      severity: "Warning"
    },
    {
      id: "#L1241",
      timestamp: "2024-12-02 08:15:03",
      user: "john.smith@domusservitia.co.uk",
      action: "Property Updated",
      category: "Properties",
      details: "Updated details for 456 River Rd",
      severity: "Info"
    },
    {
      id: "#L1240",
      timestamp: "2024-12-02 07:50:18",
      user: "System",
      action: "Failed SMS Delivery",
      category: "Notifications",
      details: "SMS to 07xxx 123456 failed - invalid number",
      severity: "Error"
    },
    {
      id: "#L1239",
      timestamp: "2024-12-02 07:30:55",
      user: "admin@domusservitia.co.uk",
      action: "Staff Permission Updated",
      category: "User Management",
      details: "Added 'Manage Complaints' permission to Mike Johnson",
      severity: "Warning"
    },
    {
      id: "#L1238",
      timestamp: "2024-12-02 07:15:29",
      user: "System",
      action: "Backup Completed",
      category: "System",
      details: "Automated daily backup completed successfully",
      severity: "Info"
    },
  ];

  const categories = [
    { name: "Authentication", count: 145 },
    { name: "User Management", count: 89 },
    { name: "Properties", count: 234 },
    { name: "Inspection", count: 67 },
    { name: "Billing", count: 198 },
    { name: "Notifications", count: 456 },
    { name: "Complaints", count: 45 },
    { name: "System", count: 23 },
  ];

  const errorLogs = logs.filter(log => log.severity === "Error").length;
  const warningLogs = logs.filter(log => log.severity === "Warning").length;
  const infoLogs = logs.filter(log => log.severity === "Info").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">System Logs & Audit Trail</h2>
        <p className="text-muted-foreground">Complete activity history and security audit trail</p>
      </div>

      {/* Log Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <FileStack className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-sm text-muted-foreground">Recent Events</p>
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
                <p className="text-2xl font-bold">{errorLogs}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
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
                <p className="text-2xl font-bold">{warningLogs}</p>
                <p className="text-sm text-muted-foreground">Warnings</p>
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
                <p className="text-2xl font-bold">{infoLogs}</p>
                <p className="text-sm text-muted-foreground">Info</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Activity Logs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>Complete system activity and audit trail</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Filter</Button>
              <Button variant="outline">Export Logs</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {log.severity === "Error" && <AlertTriangle className="w-4 h-4 text-destructive" />}
                  {log.severity === "Warning" && <Clock className="w-4 h-4 text-secondary" />}
                  {log.severity === "Info" && <Activity className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{log.id}</span>
                    <h4 className="font-semibold text-sm">{log.action}</h4>
                    <Badge variant="outline" className="text-xs">{log.category}</Badge>
                    <Badge variant={
                      log.severity === "Error" ? "destructive" :
                      log.severity === "Warning" ? "secondary" :
                      "outline"
                    } className="text-xs">
                      {log.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{log.details}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.user}
                    </span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost">View</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Categories Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Activity by Category</CardTitle>
          <CardDescription>Log distribution across system modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-3">
            {categories.map((category, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{category.name}</p>
                      <p className="text-2xl font-bold text-primary">{category.count}</p>
                    </div>
                    <Activity className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Info */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Audit Trail Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• All system activities are automatically logged</p>
          <p>• Logs are retained for 12 months</p>
          <p>• Critical security events trigger immediate alerts</p>
          <p>• Logs cannot be modified or deleted by any user</p>
          <p>• Export logs for external compliance audits</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemLogs;
