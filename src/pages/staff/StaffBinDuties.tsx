import { useEffect, useState, useCallback } from "react";
import { Trash2, Calendar, CheckCircle, AlertTriangle, Building2, Loader2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { format, isSameDay, parseISO, startOfWeek } from "date-fns";

// === 1. RAW DATA INTERFACES (Matches Database) ===

interface StaffProfile { id: string; }
interface RotationState { id: string; property_id: string; current_room_id: string; next_rotation_date: string; }
interface Property { id: string; property_name: string; }
interface Room { id: string; room_number: string; }
interface BinSchedule { id: string; property_id: string; bin_type: string; next_collection_date: string; }
interface Log { property_id: string; room_id?: string; bin_duty_status: string; created_at: string; notes?: string; verified_by?: string; }
interface StaffUser { id: string; full_name: string; }

// === 2. UI INTERFACES ===

interface InHouseDuty {
  id: string; 
  property_name: string;
  current_room_number: string;
  next_rotation_date: string;
  status: 'pending' | 'completed' | 'missed';
}

interface CouncilDuty {
  id: string; 
  property_name: string;
  bin_type: string;
  next_collection_date: string;
  status: 'pending' | 'completed';
  completed_by_name?: string;
}

// === COMPONENT ===

const StaffBinDuties = () => {
  const { user } = useAuth();
  
  const [inHouseDuties, setInHouseDuties] = useState<InHouseDuty[]>([]);
  const [councilDuties, setCouncilDuties] = useState<CouncilDuty[]>([]);
  const [loading, setLoading] = useState(true);

  // --- DATA FETCHING ---

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // 1. Get Staff ID
      const { data: staffProfile } = await supabase.from('staff_profiles').select('id').eq('user_id', user.id).single();
      if (!staffProfile) throw new Error("Staff profile not found");
      const staffId = staffProfile.id;

      // 2. GET RELEVANT PROPERTY IDs
      // Source A: Properties assigned to this staff
      const { data: assignments } = await supabase.from('staff_property_assignments').select('property_id').eq('staff_id', staffId);
      const assignedIds = assignments?.map(a => a.property_id) || [];

      // Source B: Properties where this staff is assigned to a Council Bin schedule
      const { data: councilScheds } = await supabase.from('bin_schedules').select('property_id').eq('assigned_staff_id', staffId);
      const councilIds = councilScheds?.map(c => c.property_id) || [];

      // Combine unique IDs
      const propIds = Array.from(new Set([...assignedIds, ...councilIds]));

      if (propIds.length === 0) {
        setLoading(false);
        return;
      }

      // 3. FETCH ALL DATA PARALLEL (No complex Joins)
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

      const [
        propsRes,
        roomsRes,
        rotationsRes,
        schedulesRes,
        logsRes,
        staffNamesRes
      ] = await Promise.all([
        // Get Names
        supabase.from('properties').select('id, property_name').in('id', propIds),
        // Get Room Numbers (We fetch ALL rooms for these properties to be safe)
        supabase.from('rooms').select('id, room_number').in('property_id', propIds),
        // Get Rotation States
        supabase.from('in_house_rotation_state').select('*').in('property_id', propIds),
        // Get Council Schedules (Filtered by staff)
        supabase.from('bin_schedules').select('*').eq('assigned_staff_id', staffId),
        // Get Logs
        supabase.from('bin_rotations').select('*').in('property_id', propIds).gte('created_at', weekStart),
        // Get Staff Names
        supabase.from('staff_profiles').select('id, full_name')
      ]);

      // Extract Data
      const properties = (propsRes.data as Property[]) || [];
      const rooms = (roomsRes.data as Room[]) || [];
      const rotations = (rotationsRes.data as RotationState[]) || [];
      const schedules = (schedulesRes.data as BinSchedule[]) || [];
      const logs = (logsRes.data as Log[]) || [];
      const staffNames = (staffNamesRes.data as StaffUser[]) || [];

      // --- MERGE 1: In-House Rotation ---
      const processedInHouse: InHouseDuty[] = rotations.map(rot => {
        // Manually find related data in JS arrays
        const prop = properties.find(p => p.id === rot.property_id);
        const room = rooms.find(r => r.id === rot.current_room_id);
        
        const log = logs.find(l => 
          l.property_id === rot.property_id && 
          l.room_id === rot.current_room_id && // Log must match the specific room
          l.bin_duty_status !== 'pending'
        );

        return {
          id: rot.id,
          property_name: prop?.property_name || "Unknown Property",
          current_room_number: room?.room_number || "Unassigned", // Safe fallback
          next_rotation_date: rot.next_rotation_date,
          status: (log?.bin_duty_status as any) || 'pending'
        };
      });

      setInHouseDuties(processedInHouse);

      // --- MERGE 2: Council Schedules ---
      const processedCouncil: CouncilDuty[] = schedules.map(sched => {
        const prop = properties.find(p => p.id === sched.property_id);
        
        // Find matching log (Same Day + Tag)
        const log = logs.find(l => 
          l.property_id === sched.property_id && 
          isSameDay(parseISO(l.created_at), parseISO(sched.next_collection_date)) &&
          l.notes?.includes("Council")
        );

        const staffName = log ? staffNames.find(s => s.id === log.verified_by)?.full_name : undefined;

        return {
          id: sched.id,
          property_name: prop?.property_name || "Unknown Property",
          bin_type: sched.bin_type,
          next_collection_date: sched.next_collection_date,
          status: log ? 'completed' : 'pending',
          completed_by_name: staffName
        };
      });

      setCouncilDuties(processedCouncil.sort((a,b) => new Date(a.next_collection_date).getTime() - new Date(b.next_collection_date).getTime()));

    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // --- HELPERS ---

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500">Completed</Badge>;
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      case "missed": return <Badge variant="destructive">Missed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRelativeDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = parseISO(dateStr);
    const today = new Date();
    if (isSameDay(date, today)) return "Today";
    return format(date, 'EEE, MMM d');
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  // Stats Logic
  const totalDue = inHouseDuties.length + councilDuties.filter(c => getRelativeDate(c.next_collection_date) === "Today").length;
  const completedCount = inHouseDuties.filter(d => d.status === 'completed').length + councilDuties.filter(c => c.status === 'completed').length;
  const pendingCount = inHouseDuties.filter(d => d.status === 'pending').length + councilDuties.filter(c => c.status === 'pending').length;
  const missedCount = inHouseDuties.filter(d => d.status === 'missed').length;

  return (
    <div className="space-y-6">
      
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground mb-1">Total Active Duties</p><p className="text-2xl font-bold">{totalDue}</p></div>
              <div className="bg-primary/10 p-3 rounded-full"><Trash2 className="h-5 w-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground mb-1">Completed</p><p className="text-2xl font-bold">{completedCount}</p></div>
              <div className="bg-green-500/10 p-3 rounded-full"><CheckCircle className="h-5 w-5 text-green-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground mb-1">Pending</p><p className="text-2xl font-bold">{pendingCount}</p></div>
              <div className="bg-orange-500/10 p-3 rounded-full"><Calendar className="h-5 w-5 text-orange-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground mb-1">Missed/Issues</p><p className="text-2xl font-bold">{missedCount}</p></div>
              <div className="bg-destructive/10 p-3 rounded-full"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* In-House Rotation List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              In-House Weekly Rotation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inHouseDuties.length === 0 ? <p className="text-muted-foreground text-sm">No in-house duties found.</p> :
             <div className="space-y-4">
              {inHouseDuties.map((duty) => (
                <div key={duty.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{duty.property_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Current Duty: Room {duty.current_room_number}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Next Rotation: {format(parseISO(duty.next_rotation_date), 'EEE, MMM d')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(duty.status)}
                  </div>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>

        {/* Council Collection List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Council Bin Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {councilDuties.length === 0 ? <p className="text-muted-foreground text-sm">No council schedules assigned to you.</p> :
             <div className="space-y-4">
              {councilDuties.map((collection) => (
                <div key={collection.id} className="flex flex-col p-4 border rounded-lg gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">{collection.property_name}</p>
                        <p className="text-sm text-muted-foreground">{collection.bin_type} Waste</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-medium">{getRelativeDate(collection.next_collection_date)}</p>
                        <p className="text-[10px] text-muted-foreground">Before 7 AM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                        {getStatusBadge(collection.status)}
                        {collection.status === 'completed' && collection.completed_by_name && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="w-3 h-3" /> {collection.completed_by_name}
                            </span>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffBinDuties;