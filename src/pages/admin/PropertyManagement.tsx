import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, DoorOpen, Search, Trash2, Pencil, Images, Users } from "lucide-react";

interface Property {
  id: string;
  landlord_id: string;
  property_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country?: string;
  property_type: string;
  total_rooms: number;
  total_bathrooms?: number;
  total_floors?: number;
  parking_available?: boolean;
  garden_available?: boolean;
  furnished?: boolean;
  pet_friendly?: boolean;
  smoking_allowed?: boolean;
  epc_rating?: string;
  property_status: string;
  bin_collection_day?: string;
  notes?: string;
  images?: string[];
  landlord_name?: string;
  landlord_user_id?: string;
  room_count: number;
}

interface Room {
  id: string;
  property_id: string;
  room_number: string;
  room_name?: string;
  room_type: string;
  floor_number?: number;
  size_sqm?: number;
  has_ensuite: boolean;
  has_window?: boolean;
  furnished?: boolean;
  monthly_rent: number;
  deposit_amount: number;
  room_status: string;
  available_from?: string;
  features?: string[];
  images?: string[];
  notes?: string;
}

interface Landlord {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  company_name?: string;
}

interface StaffProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  position?: string;
}

interface StaffAssignment {
  id: string;
  staff_id: string;
  property_id: string;
  role?: string;
  assigned_date?: string;
  is_primary?: boolean;
  notes?: string;
  staff?: StaffProfile;
}

export default function PropertyManagement() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyRooms, setPropertyRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteRoomDialogOpen, setDeleteRoomDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);

  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<StaffAssignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [propertyImagesUploading, setPropertyImagesUploading] = useState(false);
  const [roomImagesUploading, setRoomImagesUploading] = useState(false);

  const [propertyForm, setPropertyForm] = useState({
    landlord_id: "",
    property_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    county: "",
    postcode: "",
    country: "United Kingdom",
    property_type: "house",
    total_rooms: 0,
    total_bathrooms: 0,
    total_floors: 0,
    parking_available: false,
    garden_available: false,
    furnished: true,
    pet_friendly: false,
    smoking_allowed: false,
    epc_rating: "",
    property_status: "active",
    monthly_service_charge: 0,
    council_tax_band: "",
    bin_collection_day: "",
    notes: "",
    images: [] as string[],
  });

  const [roomForm, setRoomForm] = useState({
    room_number: "",
    room_name: "",
    room_type: "single",
    floor_number: 0,
    size_sqm: 0,
    has_ensuite: false,
    has_window: true,
    furnished: true,
    monthly_rent: 0,
    deposit_amount: 0,
    room_status: "available",
    available_from: "",
    features: [] as string[],
    images: [] as string[],
    notes: "",
  });

  // Tenancy assignment state
  const [tenancyDialogOpen, setTenancyDialogOpen] = useState(false);
  const [tenancyForm, setTenancyForm] = useState({
    lodger_id: '',
    property_id: '',
    room_id: '',
    monthly_rent: 0,
    deposit_amount: 0,
    start_date: '',
    end_date: '',
  });
  const [lodgers, setLodgers] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

  // Utility to auto-generate payment reference
  const generatePaymentReference = (latestNumber: number = 1): string => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const seq = String(latestNumber).padStart(4, '0');
    return `PAY-${yyyy}${mm}${dd}-${seq}`;
  };

  useEffect(() => {
    loadProperties();
    loadLandlords();
    loadStaff();
  }, []);

  // Load lodgers for tenancy selection
  useEffect(() => {
    const loadLodgersData = async () => {
      const { data, error } = await supabase
        .from('lodger_profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });
      if (!error) setLodgers(data || []);
    };
    loadLodgersData();
  }, []);

  // When property is selected, load available rooms
  useEffect(() => {
    if (!tenancyForm.property_id) {
      setAvailableRooms([]);
      return;
    }
    const loadAvailableRooms = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', tenancyForm.property_id)
        .eq('room_status', 'available');
      if (!error) setAvailableRooms(data || []);
    };
    loadAvailableRooms();
  }, [tenancyForm.property_id]);

  // When room is selected, fetch rent/deposit amounts
  useEffect(() => {
    if (!tenancyForm.room_id) return;
    const fetchRoomDetails = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('monthly_rent, deposit_amount')
        .eq('id', tenancyForm.room_id)
        .maybeSingle();
      if (!error && data) {
        setTenancyForm(f => ({ ...f, monthly_rent: data.monthly_rent, deposit_amount: data.deposit_amount }));
      }
    };
    fetchRoomDetails();
  }, [tenancyForm.room_id]);

  const loadLandlords = async () => {
    try {
      const { data, error } = await supabase
        .from('landlord_profiles')
        .select('id, user_id, full_name, email, company_name, is_verified')
        .eq('is_verified', true)
        .order('full_name', { ascending: true });
      if (error) throw error;
      setLandlords(data || []);
    } catch (error) {
      console.error("Error loading landlords:", error);
      toast.error("Failed to load landlords");
    }
  };

  const loadProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, property_id');
      if (roomsError) throw roomsError;

      const { data: landlordsData, error: lErr } = await supabase
        .from('landlord_profiles')
        .select('id, user_id, full_name');
      if (lErr) throw lErr;

      const landlordsMap = new Map<string, { name: string; user_id: string }>();
      (landlordsData || []).forEach(l => landlordsMap.set(l.id, { name: l.full_name, user_id: l.user_id }));

      const roomsByProperty = new Map<string, number>();
      (rooms || []).forEach(r => roomsByProperty.set(r.property_id, (roomsByProperty.get(r.property_id) || 0) + 1));

      setProperties((data || []).map((p: any) => ({
        ...p,
        landlord_name: landlordsMap.get(p.landlord_id)?.name,
        landlord_user_id: landlordsMap.get(p.landlord_id)?.user_id,
        room_count: roomsByProperty.get(p.id) || 0,
      })));

      await loadAssignments();
    } catch (error) {
      console.error("Error loading properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const loadPropertyRooms = async (propertyId: string) => {
    try {
      // Fetch all rooms for the property
      const { data: rooms, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', propertyId)
        .order('room_number', { ascending: true });
      if (error) throw error;

      const roomIds = (rooms || []).map((r: any) => r.id);
      if (roomIds.length === 0) {
        setPropertyRooms([]);
        return;
      }

      // Fetch active or pending tenancies for these rooms
      const { data: tenancies, error: tenErr } = await supabase
        .from('tenancies')
        .select('id, room_id, lodger_id, tenancy_status')
        .in('room_id', roomIds)
        .in('tenancy_status', ['active', 'pending']);
      if (tenErr) throw tenErr;

      // Fetch lodger profiles for these tenancies
      const lodgerIds = (tenancies || []).map((t: any) => t.lodger_id);
      let lodgers: any[] = [];
      if (lodgerIds.length > 0) {
        const { data: lodgerProfiles, error: lodgerErr } = await supabase
          .from('lodger_profiles')
          .select('id, full_name')
          .in('id', lodgerIds);
        if (lodgerErr) throw lodgerErr;
        lodgers = lodgerProfiles || [];
      }
      const lodgerMap = new Map<string, string>();
      lodgers.forEach(l => lodgerMap.set(l.id, l.full_name));

      // Map roomId to tenant name
      const roomTenantMap = new Map<string, string>();
      (tenancies || []).forEach(t => {
        if (t.room_id && t.lodger_id && lodgerMap.has(t.lodger_id)) {
          roomTenantMap.set(t.room_id, lodgerMap.get(t.lodger_id)!);
        }
      });

      // Add tenantName to each room
      const roomsWithTenant = (rooms || []).map((room: any) => ({
        ...room,
        tenantName: roomTenantMap.get(room.id) || null,
      }));
      setPropertyRooms(roomsWithTenant as Room[]);
    } catch (error) {
      console.error("Error loading rooms:", error);
      toast.error("Failed to load rooms");
    }
  };

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('id, user_id, full_name, email, position')
        .order('full_name', { ascending: true });
      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      // Always reload staff before mapping assignments
      const { data: staffData, error: staffError } = await supabase
        .from('staff_profiles')
        .select('id, user_id, full_name, email, position')
        .order('full_name', { ascending: true });
      if (staffError) throw staffError;
      setStaff(staffData || []);

      const { data, error } = await supabase
        .from('staff_property_assignments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const assignmentsWithStaff: StaffAssignment[] = (data || []).map((a: any) => ({
        ...a,
        staff: (staffData || []).find((s: any) => s.id === a.staff_id),
      }));
      setAssignments(assignmentsWithStaff);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleViewProperty = async (property: Property) => {
    setSelectedProperty(property);
    await loadPropertyRooms(property.id);
    setViewDialogOpen(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setPropertyForm({
      landlord_id: property.landlord_id,
      property_name: property.property_name,
      address_line1: property.address_line1,
      address_line2: property.address_line2 || "",
      city: property.city,
      county: property.county || "",
      postcode: property.postcode,
      country: property.country || "United Kingdom",
      property_type: property.property_type,
      total_rooms: property.total_rooms,
      total_bathrooms: property.total_bathrooms || 0,
      total_floors: property.total_floors || 0,
      parking_available: !!property.parking_available,
      garden_available: !!property.garden_available,
      furnished: !!property.furnished,
      pet_friendly: !!property.pet_friendly,
      smoking_allowed: !!property.smoking_allowed,
      epc_rating: property.epc_rating || "",
      property_status: property.property_status,
      monthly_service_charge: 0,
      council_tax_band: "",
      bin_collection_day: property.bin_collection_day || "",
      notes: property.notes || "",
      images: property.images || [],
    });
    setPropertyDialogOpen(true);
  };

  const handleDeleteProperty = (propertyId: string) => {
    setDeleteTarget(propertyId);
    setDeleteDialogOpen(true);
  };

  const handleAddRoom = (property: Property) => {
    setSelectedProperty(property);
    setEditingRoom(null);
    setRoomForm({
      room_number: "",
      room_name: "",
      room_type: "single",
      floor_number: 0,
      size_sqm: 0,
      has_ensuite: false,
      has_window: true,
      furnished: true,
      monthly_rent: 0,
      deposit_amount: 0,
      room_status: "available",
      available_from: "",
      features: [],
      images: [],
      notes: "",
    });
    setRoomDialogOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomForm({
      room_number: room.room_number,
      room_name: room.room_name || "",
      room_type: room.room_type,
      floor_number: room.floor_number || 0,
      size_sqm: room.size_sqm || 0,
      has_ensuite: room.has_ensuite,
      has_window: room.has_window ?? true,
      furnished: room.furnished ?? true,
      monthly_rent: room.monthly_rent,
      deposit_amount: room.deposit_amount,
      room_status: room.room_status,
      available_from: room.available_from || "",
      features: room.features || [],
      images: room.images || [],
      notes: room.notes || "",
    });
    setRoomDialogOpen(true);
  };

  const handleDeleteRoom = (roomId: string) => {
    setDeleteTarget(roomId);
    setDeleteRoomDialogOpen(true);
  };

  const submitPropertyForm = async () => {
    try {
      setSubmitting(true);
      if (editingProperty) {
        const { error } = await supabase
          .from('properties')
          .update({
            ...propertyForm,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingProperty.id);
        if (error) throw error;
        toast.success("Property updated successfully");
      } else {
        const { data, error } = await supabase
          .from('properties')
          .insert(propertyForm)
          .select('id')
          .single();
        if (error) throw error;
        toast.success("Property created successfully");

        const landlordUserId = landlords.find(l => l.id === propertyForm.landlord_id)?.user_id;
        if (landlordUserId) {
          await supabase.from('notifications').insert({
            recipient_id: landlordUserId,
            notification_type: 'in_app',
            priority: 'medium',
            subject: 'New Property Linked',
            message_body: `A new property "${propertyForm.property_name}" has been linked to your account.`,
            related_entity_type: 'property',
            related_entity_id: data?.id,
          });
        }
      }
      setPropertyDialogOpen(false);
      setEditingProperty(null);
      loadProperties();
    } catch (error) {
      console.error("Error saving property:", error);
      toast.error("Failed to save property");
    } finally {
      setSubmitting(false);
    }
  };

  const submitRoomForm = async () => {
    try {
      if (!selectedProperty) return;
      setSubmitting(true);

      if (editingRoom) {
        const { error } = await supabase
          .from('rooms')
          .update({
            ...roomForm,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRoom.id);
        if (error) throw error;
        toast.success("Room updated successfully");
      } else {
        const { error } = await supabase
          .from('rooms')
          .insert({
            ...roomForm,
            property_id: selectedProperty.id,
          });
        if (error) throw error;
        toast.success("Room created successfully");
      }
      setRoomDialogOpen(false);
      setEditingRoom(null);
      if (viewDialogOpen) {
        await loadPropertyRooms(selectedProperty.id);
      }
      loadProperties();
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error("Failed to save room");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteProperty = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', deleteTarget);
      if (error) throw error;
      toast.success("Property deleted successfully");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      loadProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("Failed to delete property");
    }
  };

  const confirmDeleteRoom = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', deleteTarget);
      if (error) throw error;
      toast.success("Room deleted successfully");
      setDeleteRoomDialogOpen(false);
      setDeleteTarget(null);
      if (selectedProperty) {
        await loadPropertyRooms(selectedProperty.id);
      }
      loadProperties();
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
    }
  };

  const openAssignStaff = (property: Property, assignment?: StaffAssignment) => {
    setSelectedProperty(property);
    setEditingAssignment(assignment || { id: '', staff_id: '', property_id: property.id, role: '', is_primary: false, notes: '' });
    setAssignmentDialogOpen(true);
  };

  const submitAssignment = async () => {
    if (!selectedProperty || !editingAssignment?.staff_id) {
      toast.error('Select a staff member');
      return;
    }
    try {
      setSubmitting(true);
      if (editingAssignment.id) {
        const { error } = await supabase
          .from('staff_property_assignments')
          .update({
            staff_id: editingAssignment.staff_id,
            role: editingAssignment.role || null,
            is_primary: !!editingAssignment.is_primary,
            notes: editingAssignment.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAssignment.id);
        if (error) throw error;
        toast.success('Assignment updated');
      } else {
        // Check for duplicate assignment
        const { data: existing, error: checkError } = await supabase
          .from('staff_property_assignments')
          .select('id')
          .eq('staff_id', editingAssignment.staff_id)
          .eq('property_id', selectedProperty.id)
          .maybeSingle();
        if (checkError) throw checkError;
        if (existing) {
          toast.error('This staff member is already assigned to this property.');
          setSubmitting(false);
          return;
        }
        const { error } = await supabase
          .from('staff_property_assignments')
          .insert({
            staff_id: editingAssignment.staff_id,
            property_id: selectedProperty.id,
            role: editingAssignment.role || null,
            is_primary: !!editingAssignment.is_primary,
            notes: editingAssignment.notes || null,
          });
        if (error) throw error;
        toast.success('Staff assigned');

        const staffUserId = staff.find(s => s.id === editingAssignment.staff_id)?.user_id;
        if (staffUserId) {
          await supabase.from('notifications').insert({
            recipient_id: staffUserId,
            notification_type: 'in_app',
            priority: 'medium',
            subject: 'Property Assignment',
            message_body: `You have been assigned to property "${selectedProperty.property_name}".`,
            related_entity_type: 'property',
            related_entity_id: selectedProperty.id,
          });
        }
      }
      setAssignmentDialogOpen(false);
      setEditingAssignment(null);
      await loadAssignments();
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast.error('Failed to save assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('staff_property_assignments')
        .delete()
        .eq('id', assignmentId);
      if (error) throw error;
      toast.success('Assignment removed');
      await loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  const handleAssignTenancy = async () => {
    try {
      if (!tenancyForm.lodger_id || !tenancyForm.property_id || !tenancyForm.room_id || !tenancyForm.start_date) {
        toast.error('Please fill all required fields.');
        return;
      }
      
      // Insert tenancy
      const { data: tenancy, error: tenancyErr } = await supabase
        .from('tenancies')
        .insert({
          lodger_id: tenancyForm.lodger_id,
          property_id: tenancyForm.property_id,
          room_id: tenancyForm.room_id,
          start_date: tenancyForm.start_date,
          end_date: tenancyForm.end_date || null,
          monthly_rent: tenancyForm.monthly_rent,
          deposit_amount: tenancyForm.deposit_amount,
          tenancy_status: 'active',
        })
        .select('id')
        .single();
      if (tenancyErr) throw tenancyErr;

      // Update room status to occupied
      await supabase
        .from('rooms')
        .update({ room_status: 'occupied' })
        .eq('id', tenancyForm.room_id);

      // Generate payment reference
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const refPrefix = `PAY-${yyyy}${mm}${dd}`;
      const { data: paymentsToday } = await supabase
        .from('payments')
        .select('payment_reference')
        .like('payment_reference', `${refPrefix}-%`);
      let latestNumber = 1;
      if (paymentsToday && paymentsToday.length > 0) {
        const nums = paymentsToday.map((p: any) => parseInt(p.payment_reference.split('-')[2], 10)).filter(n => !isNaN(n));
        latestNumber = Math.max(1, ...nums) + 1;
      }
      const paymentReference = generatePaymentReference(latestNumber);

      // Insert initial rent payment
      await supabase.from('payments').insert({
        lodger_id: tenancyForm.lodger_id,
        tenancy_id: tenancy.id,
        property_id: tenancyForm.property_id,
        room_id: tenancyForm.room_id,
        payment_type: 'rent',
        amount: tenancyForm.monthly_rent,
        payment_date: tenancyForm.start_date,
        due_date: tenancyForm.start_date,
        payment_status: 'pending',
        payment_reference: paymentReference,
      });

      // Insert deposit payment if applicable
      if (tenancyForm.deposit_amount > 0) {
        const depositReference = generatePaymentReference(latestNumber + 1);
        await supabase.from('payments').insert({
          lodger_id: tenancyForm.lodger_id,
          tenancy_id: tenancy.id,
          property_id: tenancyForm.property_id,
          room_id: tenancyForm.room_id,
          payment_type: 'deposit',
          amount: tenancyForm.deposit_amount,
          payment_date: tenancyForm.start_date,
          due_date: tenancyForm.start_date,
          payment_status: 'pending',
          payment_reference: depositReference,
        });
      }

      // Notify lodger
      await supabase.from('notifications').insert({
        recipient_id: tenancyForm.lodger_id,
        notification_type: 'in_app',
        priority: 'medium',
        subject: 'New Tenancy Assigned',
        message_body: 'You have been assigned a room. Please check your dashboard for details.',
        related_entity_type: 'tenancy',
        related_entity_id: tenancy.id,
      });

      toast.success('Tenancy assigned and payments created.');
      setTenancyDialogOpen(false);
      setTenancyForm({
        lodger_id: '',
        property_id: '',
        room_id: '',
        monthly_rent: 0,
        deposit_amount: 0,
        start_date: '',
        end_date: '',
      });
      loadProperties();
    } catch (error) {
      console.error('Error assigning tenancy:', error);
      toast.error('Failed to assign tenancy');
    }
  };

  const uploadPropertyImages = async (files: File[]) => {
    if (!files.length) return;
    try {
      setPropertyImagesUploading(true);
      const bucket = 'property-images';
      const urls: string[] = [];
      for (const file of files) {
        const path = `${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setPropertyForm({ ...propertyForm, images: [...(propertyForm.images || []), ...urls] });
      toast.success('Images uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setPropertyImagesUploading(false);
    }
  };

  const removePropertyImage = (url: string) => {
    setPropertyForm({ ...propertyForm, images: (propertyForm.images || []).filter(u => u !== url) });
  };

  const uploadRoomImages = async (files: File[]) => {
    if (!files.length) return;
    try {
      setRoomImagesUploading(true);
      const bucket = 'property-images';
      const urls: string[] = [];
      for (const file of files) {
        const path = `${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setRoomForm({ ...roomForm, images: [...(roomForm.images || []), ...urls] });
      toast.success('Images uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setRoomImagesUploading(false);
    }
  };

  const removeRoomImage = (url: string) => {
    setRoomForm({ ...roomForm, images: (roomForm.images || []).filter(u => u !== url) });
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address_line1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.postcode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || property.property_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Property Management</h1>
          <p className="text-muted-foreground">Manage properties, rooms, images, and staff assignments</p>
        </div>
        <Button onClick={() => {
          setEditingProperty(null);
          setPropertyForm({
            landlord_id: "",
            property_name: "",
            address_line1: "",
            address_line2: "",
            city: "",
            county: "",
            postcode: "",
            country: "United Kingdom",
            property_type: "house",
            total_floors: 0,
            parking_available: false,
            garden_available: false,
            furnished: true,
            pet_friendly: false,
            smoking_allowed: false,
            total_bathrooms: 0,
            total_rooms: 0,
            epc_rating: "",
            property_status: "active",
            monthly_service_charge: 0,
            council_tax_band: "",
            bin_collection_day: "",
            notes: "",
            images: [],
          });
          setPropertyDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
        <Button onClick={() => setTenancyDialogOpen(true)} className="ml-2" variant="default">
          <Plus className="mr-2 h-4 w-4" />
          Assign Tenancy
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
          <CardDescription>View and manage all properties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Landlord</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Postcode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rooms</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.property_name}</TableCell>
                    <TableCell>{p.landlord_name || '-'}</TableCell>
                    <TableCell>{p.city}</TableCell>
                    <TableCell>{p.postcode}</TableCell>
                    <TableCell>
                      <Badge variant={p.property_status === 'active' ? 'default' : p.property_status === 'inactive' ? 'secondary' : 'outline'}>
                        {p.property_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.room_count}</TableCell>
                    <TableCell>{(p.images || []).length}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewProperty(p)}>View</Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditProperty(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => openAssignStaff(p)}><Users className="w-4 h-4" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteProperty(p.id)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={propertyDialogOpen} onOpenChange={setPropertyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProperty ? 'Edit Property' : 'Add Property'}</DialogTitle>
            <DialogDescription>Fill in property details. Upload images and link to a landlord.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Landlord</Label>
              <Select value={propertyForm.landlord_id} onValueChange={(v) => setPropertyForm({ ...propertyForm, landlord_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select landlord" />
                </SelectTrigger>
                <SelectContent>
                  {landlords.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.full_name} ({l.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Property Name</Label>
              <Input value={propertyForm.property_name} onChange={(e) => setPropertyForm({ ...propertyForm, property_name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Address Line 1</Label>
              <Input value={propertyForm.address_line1} onChange={(e) => setPropertyForm({ ...propertyForm, address_line1: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Address Line 2</Label>
              <Input value={propertyForm.address_line2} onChange={(e) => setPropertyForm({ ...propertyForm, address_line2: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>City</Label>
                <Input value={propertyForm.city} onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Postcode</Label>
                <Input value={propertyForm.postcode} onChange={(e) => setPropertyForm({ ...propertyForm, postcode: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={propertyForm.property_type} onValueChange={(v) => setPropertyForm({ ...propertyForm, property_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Total Rooms</Label>
                <Input type="number" value={propertyForm.total_rooms} onChange={(e) => setPropertyForm({ ...propertyForm, total_rooms: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Bin Collection Day</Label>
                <Input value={propertyForm.bin_collection_day} onChange={(e) => setPropertyForm({ ...propertyForm, bin_collection_day: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={propertyForm.property_status} onValueChange={(v) => setPropertyForm({ ...propertyForm, property_status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Images</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" multiple accept="image/*" onChange={(e) => uploadPropertyImages(Array.from(e.target.files || []))} />
                  <Button type="button" variant="outline" disabled={propertyImagesUploading}><Images className="w-4 h-4 mr-2" />Upload</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(propertyForm.images || []).map((url) => (
                    <div key={url} className="relative">
                      <img src={url} alt="Property" className="h-16 w-24 object-cover rounded" />
                      <Button type="button" size="sm" variant="destructive" className="absolute -top-2 -right-2" onClick={() => removePropertyImage(url)}>Remove</Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={propertyForm.notes} onChange={(e) => setPropertyForm({ ...propertyForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPropertyDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitPropertyForm} disabled={submitting}>{editingProperty ? 'Update Property' : 'Create Property'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProperty?.property_name}</DialogTitle>
            <DialogDescription>View property details, rooms, images, and staff assignments.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{selectedProperty?.address_line1}, {selectedProperty?.city} {selectedProperty?.postcode}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => openAssignStaff(selectedProperty!)}><Users className="w-4 h-4 mr-2" />Assign Staff</Button>
                <Button variant="outline" onClick={() => setRoomDialogOpen(true)}><DoorOpen className="w-4 h-4 mr-2" />Add Room</Button>
              </div>
            </div>

            <div className="rounded-md border p-4">
              <h3 className="font-medium mb-2">Property Images</h3>
              <div className="flex flex-wrap gap-2">
                {(selectedProperty?.images || []).map((url) => (
                  <img key={url} src={url} alt="Property" className="h-20 w-32 object-cover rounded" />
                ))}
                {!(selectedProperty?.images || []).length && (
                  <p className="text-sm text-muted-foreground">No images uploaded.</p>
                )}
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyRooms.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.room_number}{r.room_name ? ` - ${r.room_name}` : ''}</TableCell>
                      <TableCell>{r.room_type}</TableCell>
                      <TableCell>£{r.monthly_rent.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={r.room_status === 'available' ? 'default' : r.room_status === 'occupied' ? 'secondary' : 'outline'}>{r.room_status}</Badge>
                      </TableCell>
                      <TableCell>{(r as Room & { tenantName?: string }).tenantName || <span className="text-muted-foreground">Vacant</span>}</TableCell>
                      <TableCell>{(r.images || []).length}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditRoom(r)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteRoom(r.id)}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Staff Assignments</h3>
                <Button size="sm" variant="outline" onClick={() => openAssignStaff(selectedProperty!)}><Plus className="w-4 h-4 mr-2" />Assign</Button>
              </div>
              <div className="space-y-2">
                {assignments.filter(a => a.property_id === selectedProperty?.id).map((a) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={a.is_primary ? 'default' : 'secondary'}>{a.role || 'member'}</Badge>
                      <span className="text-sm">{a.staff?.full_name} ({a.staff?.email})</span>
                    </div>
                    <div className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openAssignStaff(selectedProperty!, a)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteAssignment(a.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
                {assignments.filter(a => a.property_id === selectedProperty?.id).length === 0 && (
                  <p className="text-sm text-muted-foreground">No assignments yet.</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Edit Room' : 'Add Room'}</DialogTitle>
            <DialogDescription>Manage room details and images.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Room Number</Label>
                <Input value={roomForm.room_number} onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Room Name</Label>
                <Input value={roomForm.room_name} onChange={(e) => setRoomForm({ ...roomForm, room_name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={roomForm.room_type} onValueChange={(v) => setRoomForm({ ...roomForm, room_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="ensuite">Ensuite</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Monthly Rent (£)</Label>
                <Input type="number" step="0.01" value={roomForm.monthly_rent} onChange={(e) => setRoomForm({ ...roomForm, monthly_rent: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Deposit (£)</Label>
                <Input type="number" step="0.01" value={roomForm.deposit_amount} onChange={(e) => setRoomForm({ ...roomForm, deposit_amount: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Floor #</Label>
                <Input type="number" value={roomForm.floor_number} onChange={(e) => setRoomForm({ ...roomForm, floor_number: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Size (sqm)</Label>
                <Input type="number" step="0.01" value={roomForm.size_sqm} onChange={(e) => setRoomForm({ ...roomForm, size_sqm: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={roomForm.room_status} onValueChange={(v) => setRoomForm({ ...roomForm, room_status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Available From</Label>
                <Input type="date" value={roomForm.available_from} onChange={(e) => setRoomForm({ ...roomForm, available_from: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Images</Label>
              <div className="flex items-center gap-2">
                <Input type="file" multiple accept="image/*" onChange={(e) => uploadRoomImages(Array.from(e.target.files || []))} />
                <Button type="button" variant="outline" disabled={roomImagesUploading}><Images className="w-4 h-4 mr-2" />Upload</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(roomForm.images || []).map((url) => (
                  <div key={url} className="relative">
                    <img src={url} alt="Room" className="h-16 w-24 object-cover rounded" />
                    <Button type="button" size="sm" variant="destructive" className="absolute -top-2 -right-2" onClick={() => removeRoomImage(url)}>Remove</Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={roomForm.notes} onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitRoomForm} disabled={submitting}>{editingRoom ? 'Update Room' : 'Create Room'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property? This action will also
              delete all associated rooms and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteProperty}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteRoomDialogOpen} onOpenChange={setDeleteRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRoomDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteRoom}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAssignment?.id ? 'Edit Assignment' : 'Assign Staff to Property'}</DialogTitle>
            <DialogDescription>Select staff and role. Set primary if applicable.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Staff</Label>
              <Select value={editingAssignment?.staff_id || ''} onValueChange={(v) => setEditingAssignment(prev => ({ ...(prev || { id: '', staff_id: v, property_id: selectedProperty!.id }), staff_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Role</Label>
                <Input value={editingAssignment?.role || ''} onChange={(e) => setEditingAssignment(prev => ({ ...(prev || { id: '', staff_id: '', property_id: selectedProperty!.id }), role: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Primary</Label>
                <Select value={editingAssignment?.is_primary ? 'true' : 'false'} onValueChange={(v) => setEditingAssignment(prev => ({ ...(prev || { id: '', staff_id: '', property_id: selectedProperty!.id }), is_primary: v === 'true' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={editingAssignment?.notes || ''} onChange={(e) => setEditingAssignment(prev => ({ ...(prev || { id: '', staff_id: '', property_id: selectedProperty!.id }), notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitAssignment} disabled={submitting}>{editingAssignment?.id ? 'Update' : 'Assign'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tenancy Assignment Dialog */}
      <Dialog open={tenancyDialogOpen} onOpenChange={setTenancyDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Assign Tenancy</DialogTitle>
            <DialogDescription>Assign a room to a lodger and generate payment records.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Lodger</Label>
              <Select value={tenancyForm.lodger_id} onValueChange={v => setTenancyForm(f => ({ ...f, lodger_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select lodger" /></SelectTrigger>
                <SelectContent>
                  {lodgers.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.full_name} ({l.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Property</Label>
              <Select value={tenancyForm.property_id} onValueChange={v => setTenancyForm(f => ({ ...f, property_id: v, room_id: '' }))}>
                <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Room</Label>
              <Select value={tenancyForm.room_id} onValueChange={v => setTenancyForm(f => ({ ...f, room_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent>
                  {availableRooms.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.room_number}{r.room_name ? ` - ${r.room_name}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rent Amount (£)</Label>
                <Input value={tenancyForm.monthly_rent} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Deposit Amount (£)</Label>
                <Input value={tenancyForm.deposit_amount} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input type="date" value={tenancyForm.start_date} onChange={e => setTenancyForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={tenancyForm.end_date} onChange={e => setTenancyForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTenancyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignTenancy} disabled={submitting}>Assign Tenancy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
