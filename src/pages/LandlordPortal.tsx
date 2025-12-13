import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, Users, FileText, DollarSign, Bell, User, LogOut, Plus, Building, TrendingUp, Calendar, Wrench, MessageSquare, Download, Eye, Edit, Trash2, Search, Filter, ArrowUpRight, ArrowDownRight, Check, X, AlertCircle, Phone, Mail, MapPin, Bed, Bath, Square, ClipboardCheck, Camera, Image as ImageIcon, UserCheck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/useAuth";
import { toast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { useIsMobile } from "@/hooks/use-mobile";
import LandlordOverview from "./landlord/LandlordOverview";
import { cn } from "@/lib/utils";

const LandlordPortal = () => {
  const { logout, user } = useAuth();
  const isMobile = useIsMobile();
  const [currentTab, setCurrentTab] = useState("overview");
  
  // Dialog states
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [selectedCleaning, setSelectedCleaning] = useState<any>(null);
  const [isPropertyDetailOpen, setIsPropertyDetailOpen] = useState(false);
  const [isTenantDetailOpen, setIsTenantDetailOpen] = useState(false);
  const [isMaintenanceDetailOpen, setIsMaintenanceDetailOpen] = useState(false);
  const [isInspectionReportOpen, setIsInspectionReportOpen] = useState(false);
  const [isCleaningReportOpen, setIsCleaningReportOpen] = useState(false);
  const [isDocumentViewOpen, setIsDocumentViewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [messageForm, setMessageForm] = useState({ recipient: "", subject: "", message: "" });
  
  // Form states
  const [propertyForm, setPropertyForm] = useState({
    name: "",
    address: "",
    type: "",
    bedrooms: "",
    bathrooms: "",
    rent: "",
    description: ""
  });
  
  const [tenantForm, setTenantForm] = useState({
    name: "",
    email: "",
    phone: "",
    property: "",
    moveInDate: "",
    rent: ""
  });
  
  const [maintenanceForm, setMaintenanceForm] = useState({
    property: "",
    category: "",
    priority: "",
    description: ""
  });

  // Handler functions
  const handleAddProperty = () => {
    toast({
      title: "Property Added",
      description: `${propertyForm.name} has been added to your portfolio.`
    });
    setIsAddPropertyOpen(false);
    setPropertyForm({ name: "", address: "", type: "", bedrooms: "", bathrooms: "", rent: "", description: "" });
  };

  const handleAddTenant = () => {
    toast({
      title: "Tenant Added",
      description: `${tenantForm.name} has been added successfully.`
    });
    setIsAddTenantOpen(false);
    setTenantForm({ name: "", email: "", phone: "", property: "", moveInDate: "", rent: "" });
  };

  const handleMaintenanceRequest = () => {
    toast({
      title: "Maintenance Request Submitted",
      description: "Your maintenance request has been submitted successfully."
    });
    setIsMaintenanceOpen(false);
    setMaintenanceForm({ property: "", category: "", priority: "", description: "" });
  };

  const handleSendMessage = () => {
    toast({
      title: "Message Sent",
      description: `Your message to ${messageForm.recipient} has been sent.`
    });
    setIsMessageOpen(false);
    setMessageForm({ recipient: "", subject: "", message: "" });
  };

  const handleViewProperty = (property: any) => {
    setSelectedProperty(property);
    setIsPropertyDetailOpen(true);
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
  };

  const handleDeleteProperty = (propertyId: number) => {
    toast({
      title: "Property Removed",
      description: "The property has been removed from your portfolio."
    });
  };

  const handleViewTenant = (tenant: any) => {
    setSelectedTenant(tenant);
    setIsTenantDetailOpen(true);
  };

  const handleContactTenant = (tenant: any) => {
    setMessageForm({ recipient: tenant.name, subject: "", message: "" });
    setIsMessageOpen(true);
  };

  const handleViewMaintenance = (maintenance: any) => {
    setSelectedMaintenance(maintenance);
    setIsMaintenanceDetailOpen(true);
  };

  const handleResolveMaintenance = (maintenanceId: number) => {
    toast({
      title: "Maintenance Resolved",
      description: "The maintenance request has been marked as resolved."
    });
  };

  const handleViewDocument = (doc: any) => {
    setSelectedDocument(doc);
    setIsDocumentViewOpen(true);
  };

  const handleDownloadDocument = (doc: any) => {
    toast({
      title: "Download Started",
      description: `Downloading ${doc.name}...`
    });
  };
  
  // Mobile users get a completely different experience
  if (isMobile) {
    return <LandlordOverview />;
  }
  
  // Mock data
  const inspectionReports = [
    {
      id: 1,
      property: "Riverside Apartment - Room 1A",
      date: "10 Nov 2025, 2:00 PM",
      inspector: "Sarah Johnson (Staff)",
      status: "Passed",
      photos: [
        { id: 1, area: "Kitchen", url: "https://images.unsplash.com/photo-1556911261-6bd341186b2f?w=800" },
        { id: 2, area: "Bathroom", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800" },
        { id: 3, area: "Living Room", url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800" },
        { id: 4, area: "Bedroom", url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800" }
      ],
      checklist: [
        { item: "Walls and ceilings", status: "Pass", notes: "Clean, no damage" },
        { item: "Floors and carpets", status: "Pass", notes: "Good condition" },
        { item: "Kitchen appliances", status: "Pass", notes: "All working, clean" },
        { item: "Bathroom fixtures", status: "Pass", notes: "Minor cleaning needed" },
        { item: "Windows and doors", status: "Pass", notes: "All functioning properly" },
        { item: "Smoke detectors", status: "Pass", notes: "Tested, working" },
      ],
      overallNotes: "Property is in good overall condition. Tenant is maintaining the space well. Minor cleaning required in kitchen area before next inspection. All safety checks passed.",
      nextInspectionDue: "10 Feb 2026"
    },
    {
      id: 2,
      property: "Modern City Centre Studio",
      date: "8 Nov 2025, 10:30 AM",
      inspector: "Mike Wilson (Staff)",
      status: "Issues Found",
      photos: [
        { id: 1, area: "Bathroom - Leak", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800" },
        { id: 2, area: "Kitchen", url: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800" },
        { id: 3, area: "Living Area", url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800" },
        { id: 4, area: "Bathroom Overall", url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800" },
        { id: 5, area: "Entrance", url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800" },
        { id: 6, area: "Window View", url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800" }
      ],
      checklist: [
        { item: "Walls and ceilings", status: "Pass", notes: "Good condition" },
        { item: "Floors", status: "Pass", notes: "Clean" },
        { item: "Kitchen appliances", status: "Pass", notes: "Working well" },
        { item: "Bathroom fixtures", status: "Fail", notes: "Leaking tap - requires repair" },
        { item: "Windows and doors", status: "Pass", notes: "Functioning" },
        { item: "Smoke detectors", status: "Pass", notes: "Working" },
      ],
      overallNotes: "Leaking tap in bathroom requires immediate attention. Maintenance team has been notified and repair scheduled for 12 Nov 2025. Otherwise property is well-maintained.",
      nextInspectionDue: "8 Feb 2026",
      actionRequired: "Plumber scheduled for 12 Nov 2025 at 2:00 PM"
    },
    {
      id: 3,
      property: "Cozy 1-Bed Flat",
      date: "5 Nov 2025, 3:00 PM",
      inspector: "Emily Davis",
      inspectorType: "Service User",
      status: "Passed",
      photos: [
        { id: 1, area: "Living Room", url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800" },
        { id: 2, area: "Kitchen", url: "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=800" },
        { id: 3, area: "Bedroom", url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800" }
      ],
      checklist: [
        { item: "Overall cleanliness", status: "Pass", notes: "Excellent" },
        { item: "Appliances", status: "Pass", notes: "All working" },
        { item: "Fixtures", status: "Pass", notes: "Good condition" },
        { item: "Safety equipment", status: "Pass", notes: "All tested" },
      ],
      overallNotes: "Property is well-maintained by tenant. No issues found during inspection.",
      nextInspectionDue: "5 Feb 2026"
    },
  ];

  const cleaningReports = [
    {
      id: 1,
      property: "Modern City Centre Studio",
      date: "12 Nov 2025, 9:00 AM",
      cleaner: "Clean Team Services",
      cleanerType: "Service User",
      type: "Deep Clean",
      duration: "4 hours",
      images: [
        { id: 1, type: "Before", area: "Kitchen", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800" },
        { id: 2, type: "After", area: "Kitchen", url: "https://images.unsplash.com/photo-1556911261-6bd341186b2f?w=800" },
        { id: 3, type: "Before", area: "Bathroom", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800" },
        { id: 4, type: "After", area: "Bathroom", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800" },
        { id: 5, type: "Before", area: "Living Room", url: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800" },
        { id: 6, type: "After", area: "Living Room", url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800" },
        { id: 7, type: "Before", area: "Bedroom", url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800" },
        { id: 8, type: "After", area: "Bedroom", url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800" }
      ],
      areasClaned: [
        { area: "Kitchen", tasks: ["Deep cleaned all surfaces", "Degreased oven and hob", "Cleaned inside fridge", "Mopped floors"] },
        { area: "Bathroom", tasks: ["Scrubbed tiles and grout", "Descaled shower and taps", "Cleaned toilet thoroughly", "Polished mirrors"] },
        { area: "Living Room", tasks: ["Vacuumed carpets", "Dusted all surfaces", "Cleaned windows", "Wiped skirting boards"] },
        { area: "Bedroom", tasks: ["Changed bedding", "Vacuumed thoroughly", "Dusted furniture", "Cleaned inside wardrobes"] },
      ],
      productsUsed: ["Eco-friendly multi-surface cleaner", "Bathroom descaler", "Floor cleaner", "Glass cleaner"],
      notes: "Full deep clean completed. Property is move-in ready. All areas cleaned to high standard.",
      cost: 180
    },
    {
      id: 2,
      property: "Riverside Apartment - Common Areas",
      date: "11 Nov 2025, 11:00 AM",
      cleaner: "John Smith",
      cleanerType: "Service User",
      type: "Weekly Clean",
      duration: "2 hours",
      images: [
        { id: 1, type: "Before", area: "Hallway", url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800" },
        { id: 2, type: "After", area: "Hallway", url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800" },
        { id: 3, type: "Before", area: "Kitchen", url: "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=800" },
        { id: 4, type: "After", area: "Kitchen", url: "https://images.unsplash.com/photo-1556911261-6bd341186b2f?w=800" },
        { id: 5, type: "After", area: "Living Area", url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800" }
      ],
      areasClaned: [
        { area: "Shared Kitchen", tasks: ["Cleaned counters", "Washed dishes", "Mopped floor", "Emptied bins"] },
        { area: "Hallway", tasks: ["Vacuumed", "Wiped doors", "Cleaned light switches"] },
        { area: "Shared Bathroom", tasks: ["Cleaned toilet", "Wiped sink", "Mopped floor"] },
      ],
      productsUsed: ["Multi-purpose cleaner", "Floor cleaner", "Bathroom cleaner"],
      notes: "Weekly maintenance clean completed. Common areas in good condition.",
      cost: 0
    },
    {
      id: 3,
      property: "Cozy 1-Bed Flat",
      date: "9 Nov 2025, 2:30 PM",
      cleaner: "Clean Team Services",
      cleanerType: "Staff",
      type: "Move-out Clean",
      duration: "3.5 hours",
      images: [
        { id: 1, type: "Before", area: "Kitchen", url: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800" },
        { id: 2, type: "After", area: "Kitchen", url: "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=800" },
        { id: 3, type: "Before", area: "Living", url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800" },
        { id: 4, type: "After", area: "Living", url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800" },
        { id: 5, type: "Before", area: "Bathroom", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800" },
        { id: 6, type: "After", area: "Bathroom", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800" }
      ],
      areasClaned: [
        { area: "Entire Flat", tasks: ["Deep cleaned all rooms", "Steam cleaned carpets", "Cleaned inside all cupboards", "Washed all windows"] },
      ],
      productsUsed: ["Professional carpet cleaner", "Multi-surface cleaner", "Glass cleaner", "Descaler"],
      notes: "Move-out deep clean completed. Property ready for new tenant. Carpets steam cleaned and all areas sanitized.",
      cost: 150
    },
  ];

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
      occupancy: 100,
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"
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
      occupancy: 100,
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"
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
      occupancy: 0,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400"
    }
  ];
  
  const tenants = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+44 7700 900123",
      property: "Modern City Centre Studio",
      rent: 750,
      moveInDate: "2024-01-15",
      paymentStatus: "Paid",
      nextPayment: "2025-01-01"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+44 7700 900456",
      property: "Riverside Apartment",
      rent: 950,
      moveInDate: "2024-03-01",
      paymentStatus: "Paid",
      nextPayment: "2025-01-01"
    },
    {
      id: 3,
      name: "Mike Brown",
      email: "mike.brown@email.com",
      phone: "+44 7700 900789",
      property: "Executive Penthouse",
      rent: 2500,
      moveInDate: "2023-06-01",
      paymentStatus: "Due",
      nextPayment: "2024-12-25"
    }
  ];
  
  const transactions = [
    {
      id: 1,
      date: "2024-12-01",
      tenant: "John Smith",
      property: "Modern City Centre Studio",
      amount: 750,
      type: "Rent",
      status: "Completed"
    },
    {
      id: 2,
      date: "2024-12-01",
      tenant: "Sarah Johnson",
      property: "Riverside Apartment",
      amount: 950,
      type: "Rent",
      status: "Completed"
    },
    {
      id: 3,
      date: "2024-11-30",
      tenant: "Mike Brown",
      property: "Executive Penthouse",
      amount: 2500,
      type: "Rent",
      status: "Completed"
    },
    {
      id: 4,
      date: "2024-11-28",
      tenant: "-",
      property: "Modern City Centre Studio",
      amount: 250,
      type: "Maintenance",
      status: "Completed"
    }
  ];
  
  const maintenanceRequests = [
    {
      id: 1,
      property: "Modern City Centre Studio",
      issue: "Leaking faucet in kitchen",
      priority: "Medium",
      status: "In Progress",
      reportedDate: "2024-12-10",
      assignedTo: "Maintenance Team"
    },
    {
      id: 2,
      property: "Riverside Apartment",
      issue: "Heating not working properly",
      priority: "High",
      status: "Scheduled",
      reportedDate: "2024-12-12",
      scheduledDate: "2024-12-15",
      assignedTo: "HVAC Specialist"
    },
    {
      id: 3,
      property: "Modern City Centre Studio",
      issue: "Cleaning service completed",
      priority: "Low",
      status: "Completed",
      reportedDate: "2024-12-08",
      completedDate: "2024-12-09"
    }
  ];
  
  const documents = [
    { id: 1, name: "Property Insurance - Studio", type: "Insurance", date: "2024-12-01", size: "2.4 MB" },
    { id: 2, name: "Tenancy Agreement - John Smith", type: "Contract", date: "2024-01-15", size: "1.8 MB" },
    { id: 3, name: "Safety Certificate - Riverside", type: "Certificate", date: "2024-11-20", size: "890 KB" },
    { id: 4, name: "Income Report - November", type: "Report", date: "2024-12-01", size: "456 KB" }
  ];
  
  const handleDocumentView = (doc: any) => {
    toast({
      title: "Opening Document",
      description: `Opening ${doc.name}...`
    });
  };
  
  // Calculate stats
  const totalMonthlyIncome = properties.reduce((sum, prop) => prop.status === "Occupied" ? sum + prop.rent : sum, 0);
  const occupancyRate = (properties.filter(p => p.status === "Occupied").length / properties.length) * 100;
  const pendingMaintenance = maintenanceRequests.filter(m => m.status !== "Completed").length;

  const navigationItems = [
    { id: "overview", label: "Dashboard", icon: Home },
    { id: "properties", label: "Properties", icon: Building },
    { id: "tenants", label: "Tenants", icon: Users },
    { id: "financials", label: "Financials", icon: DollarSign },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "service-reports", label: "Service Reports", icon: ClipboardCheck },
  ];

  return (
    <>
      <SEO
        title="Landlord Portal - Domus Servitia"
        description="Manage your property portfolio, view income reports, monitor lodger payments, schedule maintenance, and access important documents."
        canonical="https://domusservitia.co.uk/landlord-portal"
      />
      <div className="min-h-screen bg-background flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r bg-card min-h-screen sticky top-0 flex flex-col">
          <div className="p-6 border-b">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Domus Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h2 className="font-bold text-lg">Domus</h2>
                <p className="text-xs text-muted-foreground">Landlord Portal</p>
              </div>
            </Link>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentTab === item.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11",
                    currentTab === item.id && "bg-secondary font-medium"
                  )}
                  onClick={() => setCurrentTab(item.id)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
          
          <div className="p-4 border-t space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
              asChild
            >
              <Link to="/landlord-portal/profile">
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
              onClick={logout}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b bg-card px-8 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-semibold">
                {navigationItems.find(item => item.id === currentTab)?.label}
              </h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full"></span>
              </Button>
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">Landlord</p>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-8 overflow-auto bg-muted/30">
            {/* Overview Tab */}
            {currentTab === "overview" && (
              <div className="space-y-6 max-w-[1600px]">
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="outline" className="text-xs">100%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Properties</p>
                      <p className="text-3xl font-bold">{properties.length}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-green-500" />
                        </div>
                        <Badge variant="outline" className="text-xs text-green-600">{occupancyRate.toFixed(0)}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Occupancy</p>
                      <p className="text-3xl font-bold">{properties.filter(p => p.status === "Occupied").length}/{properties.length}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-blue-500" />
                        </div>
                        <Badge variant="outline" className="text-xs text-blue-600">+12%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Monthly Income</p>
                      <p className="text-3xl font-bold">£{totalMonthlyIncome.toLocaleString()}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <Wrench className="h-6 w-6 text-orange-500" />
                        </div>
                        <Badge variant={pendingMaintenance > 0 ? "destructive" : "outline"} className="text-xs">
                          {pendingMaintenance} pending
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Maintenance</p>
                      <p className="text-3xl font-bold">{pendingMaintenance}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Overview Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Recent Properties */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Properties</CardTitle>
                        <Button size="sm" onClick={() => setCurrentTab("properties")}>
                          View All
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {properties.slice(0, 3).map((property) => (
                            <div
                              key={property.id}
                              className="flex gap-4 p-4 border border-border rounded-lg hover:shadow-elegant transition-all cursor-pointer"
                              onClick={() => handleViewProperty(property)}
                            >
                              <img
                                src={property.image}
                                alt={property.name}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="font-semibold">{property.name}</p>
                                    <p className="text-sm text-muted-foreground">{property.address}</p>
                                  </div>
                                  <Badge variant={property.status === "Occupied" ? "default" : "secondary"}>
                                    {property.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Bed className="h-3 w-3" /> {property.bedrooms}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Bath className="h-3 w-3" /> {property.bathrooms}
                                  </span>
                                  <span className="font-semibold text-primary">£{property.rent}/mo</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Maintenance */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Active Maintenance</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => setCurrentTab("maintenance")}>
                          View All
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {maintenanceRequests.filter(m => m.status !== "Completed").slice(0, 3).map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                              <div>
                                <p className="font-medium">{request.issue}</p>
                                <p className="text-sm text-muted-foreground">{request.property}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={request.priority === "High" ? "destructive" : request.priority === "Medium" ? "default" : "secondary"}>
                                  {request.priority}
                                </Badge>
                                <Badge variant="outline">{request.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button className="w-full" onClick={() => setIsAddPropertyOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Property
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setIsAddTenantOpen(true)}>
                          <Users className="h-4 w-4 mr-2" />
                          Add Tenant
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setIsMaintenanceOpen(true)}>
                          <Wrench className="h-4 w-4 mr-2" />
                          Report Maintenance
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setIsMessageOpen(true)}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message Admin
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <div className="bg-green-100 p-2 rounded-full h-fit">
                              <Check className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Payment Received</p>
                              <p className="text-xs text-muted-foreground">£750 from John Smith</p>
                              <p className="text-xs text-muted-foreground">2 hours ago</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="bg-blue-100 p-2 rounded-full h-fit">
                              <ClipboardCheck className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Inspection Completed</p>
                              <p className="text-xs text-muted-foreground">Riverside Apartment</p>
                              <p className="text-xs text-muted-foreground">Yesterday</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="bg-orange-100 p-2 rounded-full h-fit">
                              <Wrench className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Maintenance Scheduled</p>
                              <p className="text-xs text-muted-foreground">Plumber visit confirmed</p>
                              <p className="text-xs text-muted-foreground">2 days ago</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* Properties Tab */}
            {currentTab === "properties" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Your Properties</h2>
                    <p className="text-muted-foreground">Manage your property portfolio</p>
                  </div>
                  <Button onClick={() => setIsAddPropertyOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <Card key={property.id} className="overflow-hidden hover:shadow-elegant transition-all">
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
                          <span className="text-2xl font-bold text-primary">£{property.rent}/mo</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEditProperty(property)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleViewProperty(property)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {property.tenant && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-sm text-muted-foreground">Current Tenant</p>
                            <p className="text-sm font-medium">{property.tenant}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Tenants Tab */}
            {currentTab === "tenants" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Tenants</h2>
                    <p className="text-muted-foreground">Manage your tenants</p>
                  </div>
                  <Button onClick={() => setIsAddTenantOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tenant
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {tenants.map((tenant) => (
                        <div key={tenant.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{tenant.name}</p>
                              <p className="text-sm text-muted-foreground">{tenant.property}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">£{tenant.rent}/mo</p>
                              <Badge variant={tenant.paymentStatus === "Paid" ? "default" : "secondary"}>
                                {tenant.paymentStatus}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleContactTenant(tenant)}>
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleViewTenant(tenant)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Financials Tab */}
            {currentTab === "financials" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Financial Overview</h2>
                  <p className="text-muted-foreground">Track your rental income and expenses</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Monthly Income</p>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-3xl font-bold">£{totalMonthlyIncome.toLocaleString()}</p>
                      <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Annual Income</p>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="text-3xl font-bold">£{(totalMonthlyIncome * 12).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Projected yearly</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Collection Rate</p>
                        <Check className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-3xl font-bold">98%</p>
                      <p className="text-xs text-green-600 mt-1">Excellent</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center",
                              transaction.type === "income" ? "bg-green-100" : "bg-red-100"
                            )}>
                              {transaction.type === "income" ? (
                                <ArrowUpRight className="h-5 w-5 text-green-600" />
                              ) : (
                                <ArrowDownRight className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{transaction.type} - {transaction.tenant}</p>
                              <p className="text-sm text-muted-foreground">{transaction.property}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "font-semibold",
                              transaction.type === "Rent" ? "text-green-600" : "text-red-600"
                            )}>
                              {transaction.type === "Rent" ? "+" : "-"}£{transaction.amount}
                            </p>
                            <p className="text-xs text-muted-foreground">{transaction.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Maintenance Tab */}
            {currentTab === "maintenance" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Maintenance Requests</h2>
                    <p className="text-muted-foreground">Track and manage property maintenance</p>
                  </div>
                  <Button onClick={() => setIsMaintenanceOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {maintenanceRequests.map((request) => (
                        <div key={request.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center",
                              request.priority === "High" ? "bg-red-100" : request.priority === "Medium" ? "bg-orange-100" : "bg-gray-100"
                            )}>
                              <Wrench className={cn(
                                "h-5 w-5",
                                request.priority === "High" ? "text-red-600" : request.priority === "Medium" ? "text-orange-600" : "text-gray-600"
                              )} />
                            </div>
                            <div>
                              <p className="font-semibold">{request.issue}</p>
                              <p className="text-sm text-muted-foreground">{request.property}</p>
                              <p className="text-xs text-muted-foreground">Reported: {request.reportedDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <Badge variant={request.priority === "High" ? "destructive" : request.priority === "Medium" ? "default" : "secondary"}>
                                {request.priority}
                              </Badge>
                              <p className="text-sm mt-1">
                                <Badge variant="outline">{request.status}</Badge>
                              </p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleViewMaintenance(request)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Service Reports Tab */}
            {currentTab === "service-reports" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Service Reports</h2>
                  <p className="text-muted-foreground">View completed inspections and cleaning jobs by staff and service users</p>
                </div>

                {/* Inspections */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5" />
                      Recent Inspections
                    </CardTitle>
                    <CardDescription>
                      Photos and outcomes from property inspections
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {inspectionReports.map((inspection) => (
                        <div key={inspection.id} className="border border-border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{inspection.property}</p>
                              <p className="text-xs text-muted-foreground">{inspection.date}</p>
                            </div>
                            <div className="flex gap-2">
                              {inspection.inspectorType === "Service User" && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Service User
                                </Badge>
                              )}
                              <Badge variant={inspection.status === "Passed" ? "secondary" : "destructive"}>
                                {inspection.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Inspector: <span className="font-medium text-foreground">{inspection.inspector}</span>
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Camera className="h-3 w-3" />
                              {inspection.photos.length} photos attached
                            </p>
                          </div>
                          <div className="bg-muted/50 p-2 rounded text-xs">
                            {inspection.overallNotes.substring(0, 100)}...
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              setSelectedInspection(inspection);
                              setIsInspectionReportOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-2" />
                            View Full Report
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Cleaning Jobs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Recent Cleaning Jobs
                    </CardTitle>
                    <CardDescription>
                      Before/after photos from cleaning services
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {cleaningReports.map((cleaning) => (
                        <div key={cleaning.id} className="border border-border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{cleaning.property}</p>
                              <p className="text-xs text-muted-foreground">{cleaning.date}</p>
                            </div>
                            <div className="flex gap-2">
                              {cleaning.cleanerType === "Service User" && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Service User
                                </Badge>
                              )}
                              <Badge variant="outline">{cleaning.type}</Badge>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Cleaned by: <span className="font-medium text-foreground">{cleaning.cleaner}</span>
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" />
                              {cleaning.images.length} before/after images
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              setSelectedCleaning(cleaning);
                              setIsCleaningReportOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-2" />
                            View Photos & Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* View Property Dialog */}
      {selectedProperty && (
        <Dialog open={isPropertyDetailOpen} onOpenChange={setIsPropertyDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedProperty.name}</DialogTitle>
              <DialogDescription>Property Details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <img src={selectedProperty.image} alt={selectedProperty.name} className="w-full h-64 object-cover rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedProperty.address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedProperty.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bedrooms</p>
                  <p className="font-medium">{selectedProperty.bedrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bathrooms</p>
                  <p className="font-medium">{selectedProperty.bathrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Square Footage</p>
                  <p className="font-medium">{selectedProperty.sqft} sqft</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                  <p className="font-medium text-accent">£{selectedProperty.rent}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedProperty.status === "Occupied" ? "default" : "secondary"}>
                    {selectedProperty.status}
                  </Badge>
                </div>
                {selectedProperty.tenant && (
                  <div>
                    <p className="text-sm text-muted-foreground">Current Tenant</p>
                    <p className="font-medium">{selectedProperty.tenant}</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPropertyDetailOpen(false)}>Close</Button>
              <Button onClick={() => {
                handleEditProperty(selectedProperty);
                setIsPropertyDetailOpen(false);
              }}>Edit Property</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Property Dialog */}
      <Dialog open={isAddPropertyOpen} onOpenChange={setIsAddPropertyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>Enter property details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Property Name</Label>
                <Input 
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm({...propertyForm, name: e.target.value})}
                  placeholder="e.g., Modern Studio Apartment"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input 
                  value={propertyForm.address}
                  onChange={(e) => setPropertyForm({...propertyForm, address: e.target.value})}
                  placeholder="Full address"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={propertyForm.type} onValueChange={(value) => setPropertyForm({...propertyForm, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Studio">Studio</SelectItem>
                    <SelectItem value="1 Bed">1 Bedroom</SelectItem>
                    <SelectItem value="2 Bed">2 Bedroom</SelectItem>
                    <SelectItem value="3 Bed">3 Bedroom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Monthly Rent</Label>
                <Input 
                  type="number"
                  value={propertyForm.rent}
                  onChange={(e) => setPropertyForm({...propertyForm, rent: e.target.value})}
                  placeholder="£"
                />
              </div>
              <div>
                <Label>Bedrooms</Label>
                <Input 
                  type="number"
                  value={propertyForm.bedrooms}
                  onChange={(e) => setPropertyForm({...propertyForm, bedrooms: e.target.value})}
                />
              </div>
              <div>
                <Label>Bathrooms</Label>
                <Input 
                  type="number"
                  value={propertyForm.bathrooms}
                  onChange={(e) => setPropertyForm({...propertyForm, bathrooms: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={propertyForm.description}
                onChange={(e) => setPropertyForm({...propertyForm, description: e.target.value})}
                placeholder="Property description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPropertyOpen(false)}>Cancel</Button>
            <Button onClick={handleAddProperty}>Add Property</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tenant Dialog */}
      <Dialog open={isAddTenantOpen} onOpenChange={setIsAddTenantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tenant</DialogTitle>
            <DialogDescription>Enter tenant information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input 
                value={tenantForm.name}
                onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})}
                placeholder="John Smith"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                type="email"
                value={tenantForm.email}
                onChange={(e) => setTenantForm({...tenantForm, email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input 
                value={tenantForm.phone}
                onChange={(e) => setTenantForm({...tenantForm, phone: e.target.value})}
                placeholder="+44 7700 900000"
              />
            </div>
            <div>
              <Label>Property</Label>
              <Select value={tenantForm.property} onValueChange={(value) => setTenantForm({...tenantForm, property: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Move-in Date</Label>
              <Input 
                type="date"
                value={tenantForm.moveInDate}
                onChange={(e) => setTenantForm({...tenantForm, moveInDate: e.target.value})}
              />
            </div>
            <div>
              <Label>Monthly Rent</Label>
              <Input 
                type="number"
                value={tenantForm.rent}
                onChange={(e) => setTenantForm({...tenantForm, rent: e.target.value})}
                placeholder="£"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTenantOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTenant}>Add Tenant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Request Dialog */}
      <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Maintenance</DialogTitle>
            <DialogDescription>Submit a maintenance request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Property</Label>
              <Select value={maintenanceForm.property} onValueChange={(value) => setMaintenanceForm({...maintenanceForm, property: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={maintenanceForm.category} onValueChange={(value) => setMaintenanceForm({...maintenanceForm, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Heating">Heating</SelectItem>
                  <SelectItem value="Appliances">Appliances</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={maintenanceForm.priority} onValueChange={(value) => setMaintenanceForm({...maintenanceForm, priority: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                placeholder="Describe the issue..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaintenanceOpen(false)}>Cancel</Button>
            <Button onClick={handleMaintenanceRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Admin Dialog */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Admin</DialogTitle>
            <DialogDescription>Send a message to the admin team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Recipient</Label>
              <Input 
                value={messageForm.recipient}
                onChange={(e) => setMessageForm({...messageForm, recipient: e.target.value})}
                placeholder="Admin Team"
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input 
                value={messageForm.subject}
                onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                placeholder="Message subject"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea 
                value={messageForm.message}
                onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                placeholder="Type your message..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
            <Button onClick={handleSendMessage}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      {selectedDocument && (
        <Dialog open={isDocumentViewOpen} onOpenChange={setIsDocumentViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedDocument.name}</DialogTitle>
              <DialogDescription>{selectedDocument.type} - {selectedDocument.size}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-2">Date: {selectedDocument.date}</p>
              <p className="text-sm">Document preview would appear here in a real application.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDocumentViewOpen(false)}>Close</Button>
              <Button onClick={() => handleDownloadDocument(selectedDocument)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Inspection Report Dialog */}
      <Dialog open={isInspectionReportOpen} onOpenChange={setIsInspectionReportOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Inspection Report
              </DialogTitle>
              <DialogDescription>
                Comprehensive inspection details and photos
              </DialogDescription>
            </DialogHeader>
            {selectedInspection && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Property</p>
                    <p className="font-semibold">{selectedInspection.property}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-semibold">{selectedInspection.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inspector</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{selectedInspection.inspector}</p>
                      {selectedInspection.inspectorType === "Service User" && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Service User
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={selectedInspection.status === "Passed" ? "secondary" : "destructive"}>
                      {selectedInspection.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Inspection Due</p>
                    <p className="font-semibold">{selectedInspection.nextInspectionDue}</p>
                  </div>
                  {selectedInspection.actionRequired && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Action Required</p>
                      <p className="font-semibold text-destructive">{selectedInspection.actionRequired}</p>
                    </div>
                  )}
                </div>

                {/* Inspection Checklist */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Inspection Checklist
                  </h3>
                  <div className="space-y-2">
                    {selectedInspection.checklist.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.item}</p>
                          <p className="text-xs text-muted-foreground">{item.notes}</p>
                        </div>
                        <Badge variant={item.status === "Pass" ? "secondary" : "destructive"}>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Inspection Photos ({selectedInspection.photos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedInspection.photos.map((photo: any) => (
                      <div key={photo.id} className="space-y-1">
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                          <img 
                            src={photo.url} 
                            alt={photo.area}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">{photo.area}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overall Notes */}
                <div>
                  <h3 className="font-semibold mb-2">Overall Notes</h3>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm">{selectedInspection.overallNotes}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInspectionReportOpen(false)}>
                Close
              </Button>
              <Button onClick={() => toast({ title: "Download Started", description: "Inspection report PDF downloading..." })}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cleaning Report Dialog */}
        <Dialog open={isCleaningReportOpen} onOpenChange={setIsCleaningReportOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Cleaning Job Report
              </DialogTitle>
              <DialogDescription>
                Detailed cleaning report with before/after photos
              </DialogDescription>
            </DialogHeader>
            {selectedCleaning && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Property</p>
                    <p className="font-semibold">{selectedCleaning.property}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-semibold">{selectedCleaning.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cleaner</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{selectedCleaning.cleaner}</p>
                      {selectedCleaning.cleanerType === "Service User" && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Service User
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="outline">{selectedCleaning.type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-semibold">{selectedCleaning.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cost</p>
                    <p className="font-semibold">£{selectedCleaning.cost}</p>
                  </div>
                </div>

                {/* Areas Cleaned */}
                <div>
                  <h3 className="font-semibold mb-3">Areas Cleaned</h3>
                  <div className="space-y-3">
                    {selectedCleaning.areasClaned.map((area: any, index: number) => (
                      <div key={index} className="p-3 border border-border rounded-lg">
                        <p className="font-medium mb-2">{area.area}</p>
                        <ul className="space-y-1">
                          {area.tasks.map((task: string, taskIndex: number) => (
                            <li key={taskIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                              <Check className="h-3 w-3 mt-0.5 text-green-600" />
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Before/After Photos */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Before/After Photos ({selectedCleaning.images.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedCleaning.images.map((image: any) => (
                      <div key={image.id} className="space-y-1">
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                          <img 
                            src={image.url} 
                            alt={`${image.type} - ${image.area}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                          <Badge className="absolute top-2 left-2" variant={image.type === "Before" ? "destructive" : "secondary"}>
                            {image.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">{image.area}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Products Used */}
                <div>
                  <h3 className="font-semibold mb-2">Products Used</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCleaning.productsUsed.map((product: string, index: number) => (
                      <Badge key={index} variant="outline">{product}</Badge>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm">{selectedCleaning.notes}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCleaningReportOpen(false)}>
                Close
              </Button>
              <Button onClick={() => toast({ title: "Download Started", description: "Cleaning report PDF downloading..." })}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
};

export default LandlordPortal;
