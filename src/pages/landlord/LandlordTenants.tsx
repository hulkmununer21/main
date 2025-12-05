import { useState } from "react";
import { Bell, LogOut, Plus, Users, Phone, Mail, MapPin, Check, X, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const LandlordTenants = () => {
  const { logout } = useAuth();
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [tenantForm, setTenantForm] = useState({
    name: "",
    email: "",
    phone: "",
    property: "",
    moveInDate: "",
    rent: ""
  });

  const tenants = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+44 7700 900123",
      property: "Modern City Centre Studio",
      address: "Manchester, M1 1AA",
      rent: 750,
      moveInDate: "2024-01-15",
      paymentStatus: "Paid",
      leaseEnd: "2025-01-14"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+44 7700 900456",
      property: "Riverside Apartment",
      address: "Bristol, BS1 5TH",
      rent: 950,
      moveInDate: "2023-06-01",
      paymentStatus: "Paid",
      leaseEnd: "2025-05-31"
    },
  ];

  const handleAddTenant = () => {
    toast({
      title: "Tenant Added",
      description: `${tenantForm.name} has been added successfully.`
    });
    setIsAddTenantOpen(false);
    setTenantForm({
      name: "",
      email: "",
      phone: "",
      property: "",
      moveInDate: "",
      rent: ""
    });
  };

  const handleEditTenant = (tenant: any) => {
    setTenantForm({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      property: tenant.property,
      moveInDate: tenant.moveInDate,
      rent: tenant.rent.toString()
    });
    setIsAddTenantOpen(true);
    toast({
      title: "Edit Mode",
      description: "Update the tenant details below."
    });
  };

  const handleContactTenant = (tenant: any) => {
    toast({
      title: "Contact Tenant",
      description: `Opening contact form for ${tenant.name}`
    });
  };

  const handleViewTenant = (tenant: any) => {
    toast({
      title: "Tenant Details",
      description: `Viewing details for ${tenant.name}`
    });
  };

  return (
    <>
      <SEO 
        title="Tenants - Landlord Portal"
        description="Manage your tenant relationships"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold">Tenants</h1>
                <p className="text-sm text-muted-foreground">Manage tenant relationships</p>
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
              <p className="text-3xl font-bold">{tenants.length}</p>
              <p className="text-sm text-muted-foreground">Active Tenants</p>
            </div>
            <Dialog open={isAddTenantOpen} onOpenChange={setIsAddTenantOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tenant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Tenant</DialogTitle>
                  <DialogDescription>Enter tenant information</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenant-name">Full Name</Label>
                    <Input
                      id="tenant-name"
                      value={tenantForm.name}
                      onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})}
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenant-email">Email</Label>
                      <Input
                        id="tenant-email"
                        type="email"
                        value={tenantForm.email}
                        onChange={(e) => setTenantForm({...tenantForm, email: e.target.value})}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenant-phone">Phone</Label>
                      <Input
                        id="tenant-phone"
                        value={tenantForm.phone}
                        onChange={(e) => setTenantForm({...tenantForm, phone: e.target.value})}
                        placeholder="+44 7700 900000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-property">Property</Label>
                    <Select value={tenantForm.property} onValueChange={(value) => setTenantForm({...tenantForm, property: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studio">Modern City Centre Studio</SelectItem>
                        <SelectItem value="riverside">Riverside Apartment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="move-in-date">Move-in Date</Label>
                      <Input
                        id="move-in-date"
                        type="date"
                        value={tenantForm.moveInDate}
                        onChange={(e) => setTenantForm({...tenantForm, moveInDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenant-rent">Monthly Rent (£)</Label>
                      <Input
                        id="tenant-rent"
                        type="number"
                        value={tenantForm.rent}
                        onChange={(e) => setTenantForm({...tenantForm, rent: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddTenantOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddTenant}>Add Tenant</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {tenants.map((tenant) => (
              <Card key={tenant.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{tenant.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                        <MapPin className="h-3 w-3" />
                        {tenant.property}
                      </p>
                      <p className="text-xs text-muted-foreground">{tenant.address}</p>
                    </div>
                    <Badge variant={tenant.paymentStatus === "Paid" ? "default" : "destructive"}>
                      {tenant.paymentStatus}
                    </Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{tenant.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{tenant.phone}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Monthly Rent</p>
                      <p className="font-semibold">£{tenant.rent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Move-in Date</p>
                      <p className="font-semibold">{tenant.moveInDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Lease End</p>
                      <p className="font-semibold">{tenant.leaseEnd}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => handleEditTenant(tenant)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleContactTenant(tenant)}>Contact</Button>
                    <Button size="sm" variant="outline" onClick={() => handleViewTenant(tenant)}>View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="h-20 md:h-0"></div>
        </div>
      </div>
      <BottomNav role="landlord" />
    </>
  );
};

export default LandlordTenants;
