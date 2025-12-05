import { useState } from "react";
import { Bell, LogOut, Plus, Building, MapPin, Bed, Bath, Square, Edit, Eye, Calendar, Trash2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const LandlordProperties = () => {
  const { logout } = useAuth();
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isPropertyDetailOpen, setIsPropertyDetailOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [propertyForm, setPropertyForm] = useState({
    name: "",
    address: "",
    type: "",
    bedrooms: "",
    bathrooms: "",
    rent: "",
    description: ""
  });

  const properties = [
    {
      id: 1,
      name: "Modern City Centre Studio",
      address: "Manchester, M1 1AA",
      type: "Studio",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 450,
      rent: 750,
      status: "Occupied",
      tenant: "John Smith",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
      binSchedule: {
        nextCollection: "2025-11-25",
        collectionDay: "Monday",
        binRotation: "Lodgers rotate weekly - John handles bins this week"
      },
      inspections: {
        nextInspection: "2025-12-01",
        lastInspection: "2025-10-15",
        history: [
          { date: "2025-10-15", type: "Quarterly", status: "Passed", notes: "Property in excellent condition" },
          { date: "2025-07-10", type: "Quarterly", status: "Passed", notes: "Minor cleaning required in bathroom" },
          { date: "2025-04-05", type: "Quarterly", status: "Passed", notes: "All areas satisfactory" }
        ]
      }
    },
    {
      id: 2,
      name: "Riverside Apartment",
      address: "Bristol, BS1 5TH",
      type: "1 Bed",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 550,
      rent: 950,
      status: "Occupied",
      tenant: "Sarah Johnson",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
      binSchedule: {
        nextCollection: "2025-11-27",
        collectionDay: "Wednesday",
        binRotation: "Single tenant - responsible for all bin management"
      },
      inspections: {
        nextInspection: "2025-11-28",
        lastInspection: "2025-09-20",
        history: [
          { date: "2025-09-20", type: "Quarterly", status: "Passed", notes: "Property well maintained" },
          { date: "2025-06-15", type: "Quarterly", status: "Passed", notes: "No issues found" }
        ]
      }
    },
    {
      id: 3,
      name: "Cozy 1-Bed Flat",
      address: "Leeds, LS1 4AP",
      type: "1 Bed",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 500,
      rent: 650,
      status: "Available",
      tenant: null,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
      binSchedule: {
        nextCollection: "2025-11-26",
        collectionDay: "Tuesday",
        binRotation: "Currently unoccupied - staff maintaining bins"
      },
      inspections: {
        nextInspection: "2025-11-22",
        lastInspection: "2025-10-30",
        history: [
          { date: "2025-10-30", type: "Pre-vacancy", status: "Passed", notes: "Ready for new tenant" },
          { date: "2025-08-12", type: "Quarterly", status: "Passed", notes: "Previous tenant maintained well" }
        ]
      }
    },
  ];

  const handleAddProperty = () => {
    toast({
      title: "Property Added",
      description: `${propertyForm.name} has been added to your portfolio.`
    });
    setIsAddPropertyOpen(false);
    setPropertyForm({
      name: "",
      address: "",
      type: "",
      bedrooms: "",
      bathrooms: "",
      rent: "",
      description: ""
    });
  };

  const handleEditProperty = (property: any) => {
    setPropertyForm({
      name: property.name,
      address: property.address,
      type: property.type,
      bedrooms: property.bedrooms.toString(),
      bathrooms: property.bathrooms.toString(),
      rent: property.rent.toString(),
      description: ""
    });
    setIsAddPropertyOpen(true);
    toast({
      title: "Edit Mode",
      description: "Update the property details below."
    });
  };

  const handleViewProperty = (property: any) => {
    setSelectedProperty(property);
    setIsPropertyDetailOpen(true);
  };

  return (
    <>
      <SEO 
        title="Properties - Landlord Portal"
        description="Manage your property portfolio"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold">Properties</h1>
                <p className="text-sm text-muted-foreground">Manage your portfolio</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-3xl font-bold">{properties.length}</p>
              <p className="text-sm text-muted-foreground">Total Properties</p>
            </div>
            <Dialog open={isAddPropertyOpen} onOpenChange={setIsAddPropertyOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Property</DialogTitle>
                  <DialogDescription>Enter the details of your new property</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Property Name</Label>
                      <Input
                        id="name"
                        value={propertyForm.name}
                        onChange={(e) => setPropertyForm({...propertyForm, name: e.target.value})}
                        placeholder="Modern City Centre Studio"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Property Type</Label>
                      <Select value={propertyForm.type} onValueChange={(value) => setPropertyForm({...propertyForm, type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="1bed">1 Bedroom</SelectItem>
                          <SelectItem value="2bed">2 Bedrooms</SelectItem>
                          <SelectItem value="3bed">3 Bedrooms</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={propertyForm.address}
                      onChange={(e) => setPropertyForm({...propertyForm, address: e.target.value})}
                      placeholder="123 Main Street, City, Postcode"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        value={propertyForm.bedrooms}
                        onChange={(e) => setPropertyForm({...propertyForm, bedrooms: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        value={propertyForm.bathrooms}
                        onChange={(e) => setPropertyForm({...propertyForm, bathrooms: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rent">Rent (£/month)</Label>
                      <Input
                        id="rent"
                        type="number"
                        value={propertyForm.rent}
                        onChange={(e) => setPropertyForm({...propertyForm, rent: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={propertyForm.description}
                      onChange={(e) => setPropertyForm({...propertyForm, description: e.target.value})}
                      placeholder="Property description and features..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddPropertyOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddProperty}>Add Property</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <img
                  src={property.image}
                  alt={property.name}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{property.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {property.address}
                      </p>
                    </div>
                    <Badge variant={property.status === "Occupied" ? "default" : "secondary"}>
                      {property.status}
                    </Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Bed className="h-4 w-4" />
                      <span>{property.bedrooms} bed</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Bath className="h-4 w-4" />
                      <span>{property.bathrooms} bath</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Square className="h-4 w-4" />
                      <span>{property.sqft} sqft</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-accent">£{property.rent}/mo</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditProperty(property)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" onClick={() => handleViewProperty(property)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                  {property.tenant && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">Current Tenant</p>
                      <p className="text-sm font-medium">{property.tenant}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="h-20 md:h-0"></div>
        </div>
      </div>

      {/* Property Detail Dialog */}
      <Dialog open={isPropertyDetailOpen} onOpenChange={setIsPropertyDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProperty?.name}</DialogTitle>
            <DialogDescription>{selectedProperty?.address}</DialogDescription>
          </DialogHeader>
          
          {selectedProperty && (
            <div className="space-y-6">
              {/* Property Image */}
              <img
                src={selectedProperty.image}
                alt={selectedProperty.name}
                className="w-full h-64 object-cover rounded-lg"
              />

              {/* Property Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedProperty.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedProperty.status === "Occupied" ? "default" : "secondary"}>
                    {selectedProperty.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rent</p>
                  <p className="font-medium text-lg">£{selectedProperty.rent}/mo</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-medium">{selectedProperty.sqft} sqft</p>
                </div>
              </div>

              <Separator />

              {/* Bin Schedule */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Bin Schedule (View Only)</h3>
                </div>
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Next Council Collection</p>
                        <p className="font-medium">
                          {new Date(selectedProperty.binSchedule.nextCollection).toLocaleDateString('en-GB', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Collection Day: {selectedProperty.binSchedule.collectionDay}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">In-House Bin Rotation</p>
                      <p className="text-sm">{selectedProperty.binSchedule.binRotation}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Inspection Schedule */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Inspection Schedule (View Only)</h3>
                </div>
                
                {/* Next Inspection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Next Inspection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <p className="font-medium">
                        {new Date(selectedProperty.inspections.nextInspection).toLocaleDateString('en-GB', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Inspection History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Inspection History</CardTitle>
                    <CardDescription>Past inspections for this property</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedProperty.inspections.history.map((inspection: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">
                            {new Date(inspection.date).toLocaleDateString('en-GB', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <Badge variant={inspection.status === "Passed" ? "default" : "secondary"}>
                            {inspection.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Type: {inspection.type}</p>
                        <p className="text-sm">{inspection.notes}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {selectedProperty.tenant && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Tenant</p>
                    <p className="font-medium">{selectedProperty.tenant}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav role="landlord" />
    </>
  );
};

export default LandlordProperties;
