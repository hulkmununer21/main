import { Trash2, Calendar, CheckCircle, AlertTriangle, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const StaffBinDuties = () => {
  const inHouseRotation = [
    { id: 1, property: "123 Main St", currentRoom: "Room 3", nextRoom: "Room 4", day: "Monday", status: "pending" },
    { id: 2, property: "456 River Rd", currentRoom: "Room 1", nextRoom: "Room 2", day: "Tuesday", status: "completed" },
    { id: 3, property: "789 High St", currentRoom: "Room 5", nextRoom: "Room 6", day: "Wednesday", status: "pending" },
    { id: 4, property: "101 Park Lane", currentRoom: "Room 2", nextRoom: "Room 3", day: "Thursday", status: "missed" },
  ];

  const councilCollection = [
    { id: 1, property: "123 Main St", binType: "General Waste", date: "Today", time: "Before 7 AM", status: "completed" },
    { id: 2, property: "456 River Rd", binType: "Recycling", date: "Tomorrow", time: "Before 7 AM", status: "pending" },
    { id: 3, property: "789 High St", binType: "Garden Waste", date: "Dec 8", time: "Before 7 AM", status: "pending" },
    { id: 4, property: "101 Park Lane", binType: "General Waste", date: "Dec 10", time: "Before 7 AM", status: "pending" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "missed":
        return <Badge variant="destructive">Missed</Badge>;
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
                <p className="text-sm text-muted-foreground mb-1">Today's Duties</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Trash2 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-bold">2</p>
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
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-full">
                <Calendar className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Missed</p>
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
        {/* In-House Rotation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              In-House Weekly Rotation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inHouseRotation.map((duty) => (
                <div key={duty.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{duty.property}</p>
                    <p className="text-sm text-muted-foreground">
                      {duty.currentRoom} → {duty.nextRoom}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Every {duty.day}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(duty.status)}
                    {duty.status === "pending" && (
                      <Button size="sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirm
                      </Button>
                    )}
                    {duty.status === "missed" && (
                      <Button size="sm" variant="destructive">
                        Report Issue
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Council Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Council Bin Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {councilCollection.map((collection) => (
                <div key={collection.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{collection.property}</p>
                    <p className="text-sm text-muted-foreground">{collection.binType}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {collection.date} - {collection.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(collection.status)}
                    {collection.status === "pending" && (
                      <Button size="sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Done
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

export default StaffBinDuties;
