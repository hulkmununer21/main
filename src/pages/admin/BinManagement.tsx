import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash, Users, AlertCircle, CheckCircle } from "lucide-react";

const BinManagement = () => {
  const weeklyRotation = [
    { property: "123 Main St", currentRoom: "Room 3", nextRoom: "Room 4", rotationDay: "Monday", status: "Active" },
    { property: "456 River Rd", currentRoom: "Room 1", nextRoom: "Room 2", rotationDay: "Tuesday", status: "Active" },
    { property: "789 High St", currentRoom: "Room 5", nextRoom: "Room 6", rotationDay: "Wednesday", status: "Overdue" },
    { property: "321 Park Ave", currentRoom: "Room 2", nextRoom: "Room 3", rotationDay: "Friday", status: "Active" },
  ];

  const councilSchedule = [
    { property: "123 Main St", nextCollection: "2024-12-05", frequency: "Every 2 weeks", binType: "General Waste", assignedStaff: "John Smith" },
    { property: "456 River Rd", nextCollection: "2024-12-07", frequency: "Every 2 weeks", binType: "Recycling", assignedStaff: "Sarah Wilson" },
    { property: "789 High St", nextCollection: "2024-12-04", frequency: "Weekly", binType: "General Waste", assignedStaff: "Mike Johnson" },
    { property: "321 Park Ave", nextCollection: "2024-12-10", frequency: "Every 2 weeks", binType: "Mixed", assignedStaff: "Emma Davis" },
  ];

  const missedDuties = [
    { property: "789 High St", room: "Room 5", date: "2024-11-28", lodger: "Tom Brown", chargeApplied: true },
    { property: "123 Main St", room: "Room 2", date: "2024-11-25", lodger: "Lisa Green", chargeApplied: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Bin Management</h2>
        <p className="text-muted-foreground">Manage in-house rotation and council collection schedules</p>
      </div>

      {/* In-House Weekly Rotation */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>In-House Weekly Bin Rotation</CardTitle>
              <CardDescription>Room-by-room bin duty rotation for each property</CardDescription>
            </div>
            <Button>
              <Trash className="w-4 h-4 mr-2" />
              Add Rotation Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyRotation.map((rotation, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{rotation.property}</h4>
                        <Badge variant={rotation.status === "Active" ? "default" : "destructive"}>
                          {rotation.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Current: {rotation.currentRoom} → Next: {rotation.nextRoom}</p>
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Rotation Day: {rotation.rotationDay}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm">Send Reminder</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Council Collection Schedule */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Council Bin Collection Schedule</CardTitle>
              <CardDescription>Main bin pickup schedules and staff assignments</CardDescription>
            </div>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              View Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {councilSchedule.map((schedule, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{schedule.property}</h4>
                        <Badge variant="secondary">{schedule.binType}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">Next Collection: {schedule.nextCollection}</p>
                        <p>{schedule.frequency}</p>
                        <p className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Staff: {schedule.assignedStaff}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Change Date</Button>
                      <Button size="sm">Notify Staff</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Missed Duties & Extra Charges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Missed Bin Duties
          </CardTitle>
          <CardDescription>Track missed duties for extra charge application</CardDescription>
        </CardHeader>
        <CardContent>
          {missedDuties.length > 0 ? (
            <div className="space-y-3">
              {missedDuties.map((missed, index) => (
                <Card key={index} className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{missed.property} - {missed.room}</h4>
                        <div className="text-sm text-muted-foreground space-y-1 mt-2">
                          <p>Lodger: {missed.lodger}</p>
                          <p>Missed Date: {missed.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {missed.chargeApplied ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Charge Applied
                          </Badge>
                        ) : (
                          <Button size="sm" variant="destructive">Apply Extra Charge</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No missed duties recorded</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BinManagement;
