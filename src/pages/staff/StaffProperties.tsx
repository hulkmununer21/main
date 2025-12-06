import { Building2, Users, Trash2, Camera, AlertTriangle, Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Property {
  id: number;
  name: string;
  address: string;
  rooms: number;
  occupiedRooms: number;
  nextBinDuty: string;
  nextInspection: string;
  openComplaints: number;
  pendingCleaning: number;
}

const StaffProperties = () => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const properties: Property[] = [
    { id: 1, name: "Modern City Centre Studio", address: "123 Main St, Manchester", rooms: 6, occupiedRooms: 5, nextBinDuty: "Today", nextInspection: "Dec 10", openComplaints: 1, pendingCleaning: 2 },
    { id: 2, name: "Riverside Apartment", address: "456 River Rd, Manchester", rooms: 4, occupiedRooms: 4, nextBinDuty: "Tomorrow", nextInspection: "Dec 12", openComplaints: 0, pendingCleaning: 0 },
    { id: 3, name: "Executive Penthouse", address: "789 High St, Manchester", rooms: 8, occupiedRooms: 7, nextBinDuty: "Wed", nextInspection: "Dec 15", openComplaints: 2, pendingCleaning: 1 },
    { id: 4, name: "Garden View Flat", address: "101 Park Lane, Manchester", rooms: 5, occupiedRooms: 5, nextBinDuty: "Thu", nextInspection: "Dec 18", openComplaints: 1, pendingCleaning: 0 },
  ];

  const propertyRooms = [
    { room: "Room 1", lodgerName: "J. Smith", status: "Occupied", binDutyThisWeek: true },
    { room: "Room 2", lodgerName: "S. Johnson", status: "Occupied", binDutyThisWeek: false },
    { room: "Room 3", lodgerName: "M. Brown", status: "Occupied", binDutyThisWeek: false },
    { room: "Room 4", lodgerName: "A. Wilson", status: "Occupied", binDutyThisWeek: false },
    { room: "Room 5", lodgerName: "—", status: "Vacant", binDutyThisWeek: false },
    { room: "Room 6", lodgerName: "K. Davis", status: "Occupied", binDutyThisWeek: false },
  ];

  if (selectedProperty) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedProperty(null)} className="mb-4">
          ← Back to Properties
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedProperty.name}</span>
              <Badge variant="outline">{selectedProperty.address}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{selectedProperty.occupiedRooms}/{selectedProperty.rooms}</p>
                <p className="text-sm text-muted-foreground">Rooms Occupied</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{selectedProperty.nextBinDuty}</p>
                <p className="text-sm text-muted-foreground">Next Bin Duty</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{selectedProperty.nextInspection}</p>
                <p className="text-sm text-muted-foreground">Next Inspection</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{selectedProperty.openComplaints}</p>
                <p className="text-sm text-muted-foreground">Open Complaints</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Rooms & Lodgers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {propertyRooms.map((room, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{room.room}</p>
                      <p className="text-sm text-muted-foreground">{room.lodgerName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {room.binDutyThisWeek && <Badge className="bg-orange-500">Bin Duty</Badge>}
                      <Badge variant={room.status === "Occupied" ? "default" : "secondary"}>
                        {room.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Open Complaints
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProperty.openComplaints > 0 ? (
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Noise Complaint</p>
                      <p className="text-xs text-muted-foreground">Room 3 - Reported 2 days ago</p>
                      <Badge variant="destructive" className="mt-2">High Priority</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No open complaints</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Cleaning Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProperty.pendingCleaning > 0 ? (
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Kitchen Deep Clean</p>
                      <p className="text-xs text-muted-foreground">Awaiting verification</p>
                      <Button size="sm" className="mt-2">Verify</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No pending cleaning tasks</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Your Assigned Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {properties.map((property) => (
              <div
                key={property.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedProperty(property)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{property.name}</p>
                    <p className="text-sm text-muted-foreground">{property.address}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {property.occupiedRooms}/{property.rooms} rooms
                      </span>
                      <span className="flex items-center gap-1">
                        <Trash2 className="w-3 h-3" />
                        Bin: {property.nextBinDuty}
                      </span>
                      <span className="flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        Inspection: {property.nextInspection}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {property.openComplaints > 0 && (
                    <Badge variant="destructive">{property.openComplaints} Complaints</Badge>
                  )}
                  {property.pendingCleaning > 0 && (
                    <Badge variant="secondary">{property.pendingCleaning} Cleaning</Badge>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffProperties;
