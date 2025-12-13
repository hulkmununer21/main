import { useEffect, useState, useCallback } from "react";
import { Building2, Users, Trash2, Camera, AlertTriangle, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { format, parseISO, isToday, isTomorrow, formatDistanceToNow } from "date-fns";

// === INTERFACES ===

// High-level property summary for the List View
interface PropertySummary {
  id: string;
  name: string;
  address: string;
  total_rooms: number;
  occupied_rooms: number;
  next_bin_date: string | null; // ISO string
  next_inspection_date: string | null; // ISO string
  open_complaints: number;
  pending_cleaning: number;
}

// Detailed Room view for the Detail View
interface RoomDetail {
  id: string;
  room_number: string;
  status: 'Occupied' | 'Vacant';
  lodger_name: string;
  is_bin_duty: boolean;
}

// Detailed Tasks for the Detail View
interface PropertyTask {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'complaint' | 'cleaning';
  status: string;
}

// === COMPONENT ===

const StaffProperties = () => {
  const { user } = useAuth();
  
  // --- STATE ---
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertySummary | null>(null);
  
  // Detail View State
  const [rooms, setRooms] = useState<RoomDetail[]>([]);
  const [complaints, setComplaints] = useState<PropertyTask[]>([]);
  const [cleanings, setCleanings] = useState<PropertyTask[]>([]);
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // --- 1. FETCH LIST VIEW (Aggregated Data) ---
  const fetchPropertyList = useCallback(async () => {
    if (!user?.id) return;
    setLoadingList(true);

    try {
      // A. Get Staff ID
      const { data: staffProfile } = await supabase.from('staff_profiles').select('id').eq('user_id', user.id).single();
      if (!staffProfile) return;

      // B. Get Assigned Properties
      const { data: assignments } = await supabase
        .from('staff_property_assignments')
        .select('property_id, properties(id, property_name, address_line1, address_line2)')
        .eq('staff_id', staffProfile.id);

      const propIds = assignments?.map(a => a.property_id) || [];
      if (propIds.length === 0) {
        setLoadingList(false);
        return;
      }

      // C. Parallel Fetch for Aggregates
      const [
        roomsRes,
        tenanciesRes,
        rotationsRes,
        inspectionsRes,
        complaintsRes,
        cleaningRes
      ] = await Promise.all([
        // Total Rooms count
        supabase.from('rooms').select('property_id'),
        // Occupied Rooms count
        supabase.from('tenancies').select('property_id').eq('tenancy_status', 'active'),
        // Next Bin Duty Date
        supabase.from('in_house_rotation_state').select('property_id, next_rotation_date'),
        // Next Inspection Date
        supabase.from('inspections').select('property_id, scheduled_date').eq('status', 'scheduled').gte('scheduled_date', new Date().toISOString()),
        // Open Complaints count
        supabase.from('maintenance_requests').select('property_id').neq('status', 'completed'), // Assuming all requests are complaints/maintenance
        // Pending Cleaning count
        supabase.from('service_user_tasks').select('property_id').eq('task_type', 'cleaning').neq('status', 'completed')
      ]);

      // D. Map Data to UI Interface
      const mappedProps: PropertySummary[] = (assignments || []).map((item: any) => {
        const pid = item.property_id;
        const pDetails = item.properties;

        // Extract dates
        const binState = rotationsRes.data?.find((r: any) => r.property_id === pid);
        
        // Find earliest next inspection
        const nextInsp = inspectionsRes.data
          ?.filter((i: any) => i.property_id === pid)
          .sort((a: any, b: any) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())[0];

        return {
          id: pid,
          name: pDetails?.property_name || "Unknown Property",
          address: `${pDetails?.address_line1}, ${pDetails?.address_line2 || ''}`,
          total_rooms: roomsRes.data?.filter((r: any) => r.property_id === pid).length || 0,
          occupied_rooms: tenanciesRes.data?.filter((t: any) => t.property_id === pid).length || 0,
          next_bin_date: binState?.next_rotation_date || null,
          next_inspection_date: nextInsp?.scheduled_date || null,
          open_complaints: complaintsRes.data?.filter((c: any) => c.property_id === pid).length || 0,
          pending_cleaning: cleaningRes.data?.filter((c: any) => c.property_id === pid).length || 0,
        };
      });

      setProperties(mappedProps);

    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoadingList(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPropertyList();
  }, [fetchPropertyList]);


  // --- 2. FETCH DETAIL VIEW (Specific Property Data) ---
  const fetchPropertyDetails = async (property: PropertySummary) => {
    setSelectedProperty(property);
    setLoadingDetail(true);

    try {
      // A. Fetch Rooms & Active Tenancies (Joined) to determine occupants
      const { data: roomsData } = await supabase
        .from('rooms')
        .select(`
          id, 
          room_number,
          tenancies (
            id, 
            tenancy_status, 
            lodger_profiles (full_name)
          )
        `)
        .eq('property_id', property.id)
        .order('room_number', { ascending: true });

      // B. Fetch Current Rotation State (To identify bin duty room)
      const { data: rotationState } = await supabase
        .from('in_house_rotation_state')
        .select('current_room_id')
        .eq('property_id', property.id)
        .single();

      // C. Process Rooms
      const processedRooms: RoomDetail[] = (roomsData || []).map((r: any) => {
        // Find active tenancy
        const activeTenancy = r.tenancies?.find((t: any) => t.tenancy_status === 'active');
        const lodgerName = activeTenancy?.lodger_profiles?.full_name 
          ? activeTenancy.lodger_profiles.full_name.split(' ').map((n:string) => n[0]).join('. ') + activeTenancy.lodger_profiles.full_name.split(' ').pop() // Abbreviate J. Smith
          : "—";

        return {
          id: r.id,
          room_number: r.room_number,
          status: activeTenancy ? "Occupied" : "Vacant",
          lodger_name: activeTenancy?.lodger_profiles?.full_name || "—",
          is_bin_duty: rotationState?.current_room_id === r.id
        };
      });
      setRooms(processedRooms);

      // D. Fetch Complaints (Maintenance)
      const { data: maintData } = await supabase
        .from('maintenance_requests')
        .select('id, title, created_at, status')
        .eq('property_id', property.id)
        .neq('status', 'completed');
      
      setComplaints((maintData || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        date: m.created_at,
        type: 'complaint',
        status: m.status
      })));

      // E. Fetch Cleaning Tasks
      const { data: cleaningData } = await supabase
        .from('service_user_tasks')
        .select('id, title, due_date, status')
        .eq('property_id', property.id)
        .eq('task_type', 'cleaning')
        .neq('status', 'completed');

      setCleanings((cleaningData || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        date: c.due_date,
        type: 'cleaning',
        status: c.status
      })));

    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  // --- HELPERS ---
  const formatDateHelper = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };


  // --- RENDER: DETAIL VIEW ---
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
                <p className="text-2xl font-bold">{selectedProperty.occupied_rooms}/{selectedProperty.total_rooms}</p>
                <p className="text-sm text-muted-foreground">Rooms Occupied</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{formatDateHelper(selectedProperty.next_bin_date)}</p>
                <p className="text-sm text-muted-foreground">Next Bin Duty</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{formatDateHelper(selectedProperty.next_inspection_date)}</p>
                <p className="text-sm text-muted-foreground">Next Inspection</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{selectedProperty.open_complaints}</p>
                <p className="text-sm text-muted-foreground">Open Complaints</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loadingDetail ? (
           <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* ROOMS LIST */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Rooms & Lodgers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rooms.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{room.room_number}</p>
                        <p className="text-sm text-muted-foreground">{room.lodger_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {room.is_bin_duty && <Badge className="bg-orange-500">Bin Duty</Badge>}
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
              {/* COMPLAINTS */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Open Complaints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {complaints.length > 0 ? (
                    <div className="space-y-3">
                      {complaints.map(c => (
                        <div key={c.id} className="p-3 border rounded-lg">
                          <p className="font-medium text-sm">{c.title}</p>
                          <p className="text-xs text-muted-foreground">Reported: {format(parseISO(c.date), 'MMM d')}</p>
                          <Badge variant="destructive" className="mt-2 capitalize">{c.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No open complaints</p>
                  )}
                </CardContent>
              </Card>

              {/* CLEANING */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Cleaning Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cleanings.length > 0 ? (
                    <div className="space-y-3">
                      {cleanings.map(c => (
                        <div key={c.id} className="p-3 border rounded-lg">
                          <p className="font-medium text-sm">{c.title}</p>
                          <p className="text-xs text-muted-foreground">Due: {format(parseISO(c.date), 'MMM d')}</p>
                          <div className="flex justify-between items-center mt-2">
                             <Badge variant="secondary" className="capitalize">{c.status.replace('_', ' ')}</Badge>
                             {c.status === 'pending_verification' && <Button size="sm" className="h-6 text-xs">Verify</Button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No pending cleaning tasks</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER: LIST VIEW ---
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
          {loadingList ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
          ) : properties.length === 0 ? (
             <div className="text-center p-8 text-muted-foreground">No properties assigned to you.</div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => fetchPropertyDetails(property)}
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
                          {property.occupied_rooms}/{property.total_rooms} rooms
                        </span>
                        <span className="flex items-center gap-1">
                          <Trash2 className="w-3 h-3" />
                          Bin: {formatDateHelper(property.next_bin_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          Inspection: {formatDateHelper(property.next_inspection_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {property.open_complaints > 0 && (
                      <Badge variant="destructive">{property.open_complaints} Complaints</Badge>
                    )}
                    {property.pending_cleaning > 0 && (
                      <Badge variant="secondary">{property.pending_cleaning} Cleaning</Badge>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffProperties;