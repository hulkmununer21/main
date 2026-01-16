import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, Users, AlertCircle, CheckCircle, RotateCcw, ListOrdered, 
  Search, ShieldCheck, Gavel, Trash2, Loader2, History
} from "lucide-react";
import { format, formatDistanceToNow, parseISO, isPast } from 'date-fns';
import { useAuth } from "@/contexts/useAuth";

// === DATABASE INTERFACES ===
interface Property { id: string; property_name: string; rotation_day_of_week?: number; }
interface Room { id: string; property_id: string; room_number: string; bin_rotation_order: number | null; }
interface LodgerProfile { id: string; full_name: string; user_id?: string; }
interface StaffProfile { id: string; full_name: string; user_id?: string; }
interface Tenancy { id: string; property_id: string; room_id: string; lodger_id: string; tenancy_status: string; }
interface RotationState { property_id: string; current_room_id: string; next_rotation_date: string; current_lodger_id: string | null; }
interface BinSchedule { id: string; property_id: string; bin_type: string; collection_frequency: string; next_collection_date: string; assigned_staff_id: string | null; }

// History Interface (In-House)
interface BinRotationLog { 
  id: string; 
  property_id: string; 
  room_id: string; 
  lodger_id: string; 
  tenancy_id?: string;
  created_at: string; 
  bin_duty_status: string; 
  is_verified: boolean; 
  notes?: string; 
  properties?: { property_name: string };
  rooms?: { room_number: string };
  lodger_profiles?: { full_name: string };
}

// ✅ NEW: History Interface (Council)
interface CouncilLog {
  id: string;
  property_name: string;
  bin_type: string;
  collection_date: string;
  status: string;
  staff_name?: string;
  created_at: string;
}

// === COMPONENT ===
const BinManagement = () => {
  const { user } = useAuth();
  
  // --- RAW DATA STATES ---
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [lodgers, setLodgers] = useState<LodgerProfile[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  
  // --- FEATURE STATES ---
  const [rotationStates, setRotationStates] = useState<RotationState[]>([]);
  const [schedules, setSchedules] = useState<BinSchedule[]>([]);
  const [historyLogs, setHistoryLogs] = useState<BinRotationLog[]>([]);
  const [councilLogs, setCouncilLogs] = useState<CouncilLog[]>([]); // ✅ NEW State
  const [staffProfileId, setStaffProfileId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  // --- UI STATES ---
  const [initRotationDialogOpen, setInitRotationDialogOpen] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedRotationDay, setSelectedRotationDay] = useState<string>(""); 
  const [setupRooms, setSetupRooms] = useState<Room[]>([]); 

  const [manualAssignDialogOpen, setManualAssignDialogOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ property_id: "", room_id: "", next_rotation_date: format(new Date(), 'yyyy-MM-dd') });
  const [saving, setSaving] = useState(false);

  const [councilDialogOpen, setCouncilDialogOpen] = useState(false);
  const [councilForm, setCouncilForm] = useState({ id: "", property_id: "", bin_type: "general", frequency: "weekly", next_collection: "", assigned_staff_id: "" });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Action UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<BinRotationLog | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [fineDialogOpen, setFineDialogOpen] = useState(false);
  const [actionNote, setActionNote] = useState("");
  const [fineAmount, setFineAmount] = useState("15.00");

  // --- MAIN DATA FETCH ---
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        const { data: staffData } = await supabase.from('staff_profiles').select('id').eq('user_id', user.id).single();
        if (staffData) setStaffProfileId(staffData.id);
      }

      const [
        propsRes, roomsRes, tenancyRes, lodgerRes, staffRes, 
        stateRes, schedRes, rotationHistoryRes, councilHistoryRes
      ] = await Promise.all([
        supabase.from('properties').select('id, property_name, rotation_day_of_week'),
        supabase.from('rooms').select('id, property_id, room_number, bin_rotation_order'),
        supabase.from('tenancies').select('id, property_id, room_id, lodger_id, tenancy_status').eq('tenancy_status', 'active'),
        supabase.from('lodger_profiles').select('id, full_name, user_id'),
        supabase.from('staff_profiles').select('id, full_name, user_id'),
        supabase.from('in_house_rotation_state').select('*'),
        supabase.from('bin_schedules').select('*'),
        // In-House Logs
        supabase.from('bin_rotations')
          .select(`*, properties (property_name), rooms (room_number), lodger_profiles (full_name)`)
          .order('created_at', { ascending: false })
          .limit(200),
        // ✅ Council Logs
        supabase.from('bin_collection_logs')
          .select(`*, properties(property_name), staff_profiles(full_name)`)
          .order('collection_date', { ascending: false })
          .limit(100)
      ]);

      if (propsRes.error) throw propsRes.error;
      
      setProperties(propsRes.data || []);
      setRooms(roomsRes.data || []);
      setTenancies(tenancyRes.data || []);
      setLodgers(lodgerRes.data || []);
      setStaff(staffRes.data || []);
      setRotationStates(stateRes.data || []);
      setSchedules(schedRes.data || []);
      setHistoryLogs(rotationHistoryRes.data || []);

      // ✅ Process Council Logs
      const processedCouncilLogs: CouncilLog[] = (councilHistoryRes.data || []).map((log: any) => ({
        id: log.id,
        property_name: log.properties?.property_name || 'Unknown Property',
        bin_type: log.bin_type,
        collection_date: log.collection_date,
        status: log.status,
        staff_name: log.staff_profiles?.full_name || 'Unknown Staff',
        created_at: log.created_at
      }));
      setCouncilLogs(processedCouncilLogs);

    } catch (error: any) {
      console.error("Data Load Error:", error);
      toast.error("Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);


  // --- HELPER FUNCTIONS ---
  const getProperty = (id: string) => properties.find(p => p.id === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);
  const getLodger = (id: string) => lodgers.find(l => l.id === id);
  const getStaff = (id: string | null) => id ? staff.find(s => s.id === id) : null;
  
  const getLodgerNameForRoom = (roomId: string) => {
    const tenancy = tenancies.find(t => t.room_id === roomId);
    if (!tenancy) return "Unoccupied";
    const lodger = lodgers.find(l => l.id === tenancy.lodger_id);
    return lodger ? lodger.full_name : "Unknown Lodger";
  };

  const getActiveLodgerIdForRoom = (roomId: string) => {
    const tenancy = tenancies.find(t => t.room_id === roomId);
    return tenancy ? tenancy.lodger_id : null;
  };

  const getStatusBadge = (status: string, verified: boolean) => {
    if (status === "completed" && verified) return <Badge className="bg-green-600 gap-1"><ShieldCheck className="w-3 h-3"/> Verified</Badge>;
    if (status === "completed" && !verified) return <Badge className="bg-orange-500 gap-1">Needs Verify</Badge>;
    if (status === "missed") return <Badge variant="destructive">Missed / Fined</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };


  // --- SETUP & ROTATION HANDLERS (Preserved) ---
  const handleOpenSetup = () => {
    setInitRotationDialogOpen(true);
    setSetupStep(1);
    setSelectedPropertyId("");
    setSelectedRotationDay("");
  };

  const handleSetupStep1 = async () => {
    setSaving(true);
    const dayInt = parseInt(selectedRotationDay);
    const { error } = await supabase.from('properties').update({ rotation_day_of_week: dayInt }).eq('id', selectedPropertyId);
    setSaving(false);
    if (error) toast.error("Failed to save day");
    else {
      const propsRooms = rooms.filter(r => r.property_id === selectedPropertyId);
      propsRooms.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
      setSetupRooms(propsRooms);
      setSetupStep(2);
    }
  };

  const handleRoomOrderLocalChange = (roomId: string, val: string) => {
    const newOrder = val === 'exclude' ? null : parseInt(val);
    setSetupRooms(prev => prev.map(r => r.id === roomId ? { ...r, bin_rotation_order: newOrder } : r));
  };

  const handleSetupFinish = async () => {
    setSaving(true);
    try {
      const updates = setupRooms.map(r => ({ 
          id: r.id, property_id: r.property_id, room_number: r.room_number, bin_rotation_order: r.bin_rotation_order 
      }));
      await supabase.from('rooms').upsert(updates, { onConflict: 'id' });

      const validRooms = setupRooms.filter(r => r.bin_rotation_order !== null).sort((a, b) => a.bin_rotation_order! - b.bin_rotation_order!);
      if (validRooms.length === 0) throw new Error("No rooms included.");
      
      const firstRoom = validRooms[0];
      const activeLodgerId = getActiveLodgerIdForRoom(firstRoom.id);
      const dayInt = parseInt(selectedRotationDay);
      const today = new Date();
      const diff = (dayInt + 7 - today.getDay()) % 7;
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + (diff === 0 ? 7 : diff));

      await supabase.from('in_house_rotation_state').upsert({
        property_id: selectedPropertyId,
        current_room_id: firstRoom.id,
        current_lodger_id: activeLodgerId,
        next_rotation_date: format(nextDate, 'yyyy-MM-dd')
      }, { onConflict: 'property_id' }); 

      toast.success("Rotation configured!");
      setInitRotationDialogOpen(false);
      fetchAllData();
    } catch (error: any) {
      toast.error("Setup failed: " + error.message);
    } finally { setSaving(false); }
  };

  const handleManualAssign = async () => {
    setSaving(true);
    try {
      const activeLodgerId = getActiveLodgerIdForRoom(assignForm.room_id);
      await supabase.from('in_house_rotation_state').upsert({
        property_id: assignForm.property_id,
        current_room_id: assignForm.room_id,
        current_lodger_id: activeLodgerId,
        next_rotation_date: assignForm.next_rotation_date
      }, { onConflict: 'property_id' });
      toast.success("Assignment updated.");
      setManualAssignDialogOpen(false);
      fetchAllData();
    } catch (error: any) {
      toast.error("Failed: " + error.message);
    } finally { setSaving(false); }
  };

  // --- HANDLERS: COUNCIL & CHARGES ---

  const handleCouncilSubmit = async () => {
    setSaving(true);
    const formattedStaffId = councilForm.assigned_staff_id === "" ? null : councilForm.assigned_staff_id;
    const payload = {
        property_id: councilForm.property_id,
        bin_type: councilForm.bin_type,
        collection_frequency: councilForm.frequency,
        next_collection_date: councilForm.next_collection,
        assigned_staff_id: formattedStaffId
    };
    try {
        if (councilForm.id) await supabase.from('bin_schedules').update(payload).eq('id', councilForm.id);
        else await supabase.from('bin_schedules').insert(payload);
        toast.success("Schedule saved");
        setCouncilDialogOpen(false);
        fetchAllData();
    } catch (error: any) {
        toast.error("Failed: " + error.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const { error } = await supabase.from('bin_schedules').delete().eq('id', deletingId);
    if (error) toast.error("Delete failed");
    else {
        toast.success("Deleted");
        setDeletingId(null);
        fetchAllData();
    }
  };

  // --- ADMIN ACTIONS (Verify & Fine) ---

  const handleVerify = async () => {
    if (!selectedLog) return;
    setSaving(true);
    try {
        const updatePayload: any = {
            is_verified: true,
            verified_at: new Date().toISOString(),
            notes: actionNote ? `[Admin Verified]: ${actionNote}` : undefined
        };
        // Link staff ID if admin has one attached to their user_id
        if (staffProfileId) updatePayload.verified_by = staffProfileId;

        const { error } = await supabase.from('bin_rotations').update(updatePayload).eq('id', selectedLog.id);
        if (error) throw error;

        toast.success("Verified successfully");
        setVerifyDialogOpen(false);
        fetchAllData();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleFine = async () => {
    if (!selectedLog) return;
    setSaving(true);
    try {
        const chargeId = crypto.randomUUID();
        
        const { error: chgErr } = await supabase.from('extra_charges').insert({
            id: chargeId,
            lodger_id: selectedLog.lodger_id,
            property_id: selectedLog.property_id,
            tenancy_id: selectedLog.tenancy_id,
            amount: parseFloat(fineAmount),
            charge_type: 'bin_duty_missed',
            charge_status: 'pending',
            // ✅ Fixed: using created_at
            reason: `Missed Bin Duty (${format(parseISO(selectedLog.created_at), 'PP')}). ${actionNote}`,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
        if (chgErr) throw chgErr;

        const updatePayload: any = {
            bin_duty_status: 'missed',
            is_verified: true,
            verified_at: new Date().toISOString(),
            extra_charge_id: chargeId,
            notes: `[Admin Fined]: ${actionNote}`
        };
        if (staffProfileId) updatePayload.verified_by = staffProfileId;

        const { error: upErr } = await supabase.from('bin_rotations').update(updatePayload).eq('id', selectedLog.id);
        if (upErr) throw upErr;

        toast.success("Fine applied");
        setFineDialogOpen(false);
        fetchAllData();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };


  // --- RENDER ---

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary"/></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-foreground">Bin Management</h2>
            <p className="text-muted-foreground">Automated rotations, schedules, and history</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setManualAssignDialogOpen(true); if(properties.length>0) setAssignForm(f => ({...f, property_id: properties[0].id})); }}>
                <Users className="w-4 h-4 mr-2"/> Manual Assign
            </Button>
            <Button onClick={handleOpenSetup}><ListOrdered className="w-4 h-4 mr-2"/> Setup Rotation</Button>
        </div>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList>
            <TabsTrigger value="overview">Active Rotations</TabsTrigger>
            <TabsTrigger value="history">Weekly History Log</TabsTrigger>
            <TabsTrigger value="council">Council Schedule</TabsTrigger>
            {/* ✅ NEW TAB */}
            <TabsTrigger value="council-history">Council History</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rotationStates.map(state => {
                const prop = getProperty(state.property_id);
                const room = getRoom(state.current_room_id);
                const lodgerName = state.current_lodger_id ? getLodger(state.current_lodger_id)?.full_name : "Unoccupied";
                const isOverdue = new Date(state.next_rotation_date) < new Date();

                return (
                    <Card key={state.property_id} className={isOverdue ? "border-red-200 bg-red-50/10" : ""}>
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">{prop?.property_name}</h4>
                                <Badge variant={isOverdue ? "destructive" : "default"}>{isOverdue ? "Overdue" : "Active"}</Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <p className="flex items-center gap-2"><Users className="w-4 h-4"/> Rm {room?.room_number} ({lodgerName})</p>
                                <p className="flex items-center gap-2"><Calendar className="w-4 h-4"/> Next: {format(parseISO(state.next_rotation_date), 'EEE, MMM d')}</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
            </div>
        </TabsContent>

        {/* TAB 2: HISTORY LOG */}
        <TabsContent value="history" className="mt-6">
            <div className="flex gap-2 mb-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                    <Input placeholder="Search logs..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground border-b">
                        <tr>
                            <th className="p-4 text-left">Date</th>
                            <th className="p-4 text-left">Property</th>
                            <th className="p-4 text-left">Lodger</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-left hidden md:table-cell">Notes</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {historyLogs
                            .filter(l => (l.properties?.property_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || (l.lodger_profiles?.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()))
                            .map((log) => (
                            <tr key={log.id} className="hover:bg-muted/5">
                                <td className="p-4 align-middle">{format(parseISO(log.created_at), 'dd/MM/yy')}</td>
                                <td className="p-4 align-middle font-medium">{log.properties?.property_name || 'N/A'}</td>
                                <td className="p-4 align-middle">{log.lodger_profiles?.full_name || 'Unknown'} <span className="text-muted-foreground text-xs">(Rm {log.rooms?.room_number || '?'})</span></td>
                                <td className="p-4 align-middle">{getStatusBadge(log.bin_duty_status, log.is_verified)}</td>
                                <td className="p-4 align-middle text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{log.notes || "-"}</td>
                                <td className="p-4 align-middle text-right">
                                    <div className="flex justify-end gap-2">
                                        {log.bin_duty_status === 'completed' && !log.is_verified && (
                                            <Button size="sm" variant="outline" className="h-8 px-2 text-green-600 border-green-200" onClick={() => { setSelectedLog(log); setVerifyDialogOpen(true); }}>
                                                <ShieldCheck className="w-4 h-4"/>
                                            </Button>
                                        )}
                                        {!log.is_verified && log.bin_duty_status !== 'missed' && (
                                            <Button size="sm" variant="outline" className="h-8 px-2 text-red-600 border-red-200" onClick={() => { setSelectedLog(log); setFineDialogOpen(true); }}>
                                                <Gavel className="w-4 h-4"/>
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {historyLogs.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No history records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </TabsContent>

        {/* TAB 3: COUNCIL */}
        <TabsContent value="council" className="mt-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Council Collection Schedule</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => {
                            const todayStr = new Date().toISOString().split('T')[0];
                            setCouncilForm({ id: "", property_id: "", bin_type: "general", frequency: "weekly", next_collection: todayStr, assigned_staff_id: "" });
                            setCouncilDialogOpen(true);
                        }}><Calendar className="w-4 h-4 mr-2"/> Add Schedule</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {schedules.map(sch => {
                            const prop = getProperty(sch.property_id);
                            const staffMember = getStaff(sch.assigned_staff_id);
                            return (
                                <div key={sch.id} className="flex justify-between items-center p-3 border rounded hover:bg-muted/5">
                                    <div>
                                        <p className="font-medium">{prop?.property_name} <Badge variant="outline" className="ml-2">{sch.bin_type}</Badge></p>
                                        <p className="text-sm text-muted-foreground">Next: {new Date(sch.next_collection_date).toLocaleDateString()} • {sch.collection_frequency}</p>
                                        {staffMember && <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3"/> {staffMember.full_name}</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => {
                                            setCouncilForm({ id: sch.id, property_id: sch.property_id, bin_type: sch.bin_type, frequency: sch.collection_frequency, next_collection: sch.next_collection_date, assigned_staff_id: sch.assigned_staff_id || "" });
                                            setCouncilDialogOpen(true);
                                        }}>Edit</Button>
                                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setDeletingId(sch.id)}><Trash2 className="w-4 h-4"/></Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* ✅ TAB 4: COUNCIL HISTORY */}
        <TabsContent value="council-history" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="w-5 h-5"/> Completed Collections</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-4 font-medium">Date Collected</th>
                                    <th className="p-4 font-medium">Property</th>
                                    <th className="p-4 font-medium">Bin Type</th>
                                    <th className="p-4 font-medium">Completed By</th>
                                    <th className="p-4 font-medium text-right">Logged At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {councilLogs.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No records found.</td></tr>
                                ) : (
                                    councilLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-muted/5">
                                            <td className="p-4 font-medium">{format(parseISO(log.collection_date), 'PPP')}</td>
                                            <td className="p-4">{log.property_name}</td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={log.bin_type === 'Recycling' ? 'bg-green-50 text-green-700' : ''}>
                                                    {log.bin_type}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-muted-foreground">{log.staff_name}</td>
                                            <td className="p-4 text-right text-muted-foreground">
                                                {format(parseISO(log.created_at), 'p, d MMM')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* --- DIALOGS (Preserved) --- */}
      
      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Verify Completion</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
                <p>Confirm task completed by {selectedLog?.lodger_profiles?.full_name}.</p>
                <Textarea placeholder="Admin notes..." value={actionNote} onChange={e => setActionNote(e.target.value)}/>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
                <Button className="bg-green-600" onClick={handleVerify} disabled={saving}>Confirm Verify</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fine Dialog */}
      <Dialog open={fineDialogOpen} onOpenChange={setFineDialogOpen}>
        <DialogContent className="border-red-200">
            <DialogHeader><DialogTitle className="text-red-600">Issue Penalty</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
                <div className="bg-red-50 p-3 rounded text-sm text-red-800">Marking as Missed & Charging.</div>
                <div className="space-y-2"><label className="text-sm font-medium">Amount (£)</label><Input type="number" value={fineAmount} onChange={e => setFineAmount(e.target.value)}/></div>
                <div className="space-y-2"><label className="text-sm font-medium">Reason</label><Textarea placeholder="Reason..." value={actionNote} onChange={e => setActionNote(e.target.value)}/></div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setFineDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleFine} disabled={saving}>Confirm Penalty</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setup & Manual Assign Dialogs (Preserved) */}
      <Dialog open={initRotationDialogOpen} onOpenChange={setInitRotationDialogOpen}>
        <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Setup Rotation</DialogTitle></DialogHeader>
            {setupStep === 1 ? (
                <div className="space-y-4">
                    <Select value={selectedPropertyId} onValueChange={v => { setSelectedPropertyId(v); const p = getProperty(v); setSelectedRotationDay(p?.rotation_day_of_week?.toString() || ""); }}>
                        <SelectTrigger><SelectValue placeholder="Select Property" /></SelectTrigger>
                        <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={selectedRotationDay} onValueChange={setSelectedRotationDay} disabled={!selectedPropertyId}>
                        <SelectTrigger><SelectValue placeholder="Day of Week" /></SelectTrigger>
                        <SelectContent>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => <SelectItem key={i} value={i.toString()}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button onClick={handleSetupStep1} disabled={saving || !selectedPropertyId}>Next</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="max-h-[50vh] overflow-y-auto space-y-2">
                        {setupRooms.map((r, idx) => (
                            <div key={r.id} className="flex justify-between items-center p-2 border rounded">
                                <span>{r.room_number}</span>
                                <Select value={r.bin_rotation_order?.toString() || 'exclude'} onValueChange={(v) => { const newOrder = v === 'exclude' ? null : parseInt(v); setSetupRooms(prev => prev.map(pr => pr.id === r.id ? { ...pr, bin_rotation_order: newOrder } : pr)); }}>
                                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="exclude">Exclude</SelectItem>{setupRooms.map((_, i) => <SelectItem key={i} value={(i+1).toString()}>Order {i+1}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                    <Button onClick={handleSetupFinish} disabled={saving}>Start Rotation</Button>
                </div>
            )}
        </DialogContent>
      </Dialog>

      <Dialog open={manualAssignDialogOpen} onOpenChange={setManualAssignDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Manual Assign</DialogTitle></DialogHeader>
            <div className="space-y-4">
                <Select value={assignForm.property_id} onValueChange={v => setAssignForm(f => ({ ...f, property_id: v, room_id: "" }))}><SelectTrigger><SelectValue placeholder="Property"/></SelectTrigger><SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}</SelectContent></Select>
                <Select value={assignForm.room_id} onValueChange={v => setAssignForm(f => ({ ...f, room_id: v }))} disabled={!assignForm.property_id}><SelectTrigger><SelectValue placeholder="Room"/></SelectTrigger><SelectContent>{rooms.filter(r => r.property_id === assignForm.property_id).map(r => <SelectItem key={r.id} value={r.id}>{r.room_number}</SelectItem>)}</SelectContent></Select>
                <Input type="date" value={assignForm.next_rotation_date} onChange={e => setAssignForm(f => ({ ...f, next_rotation_date: e.target.value }))} />
                <Button onClick={handleManualAssign} disabled={saving}>Update</Button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={councilDialogOpen} onOpenChange={setCouncilDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Council Schedule</DialogTitle></DialogHeader>
            <div className="space-y-4">
                <Select value={councilForm.property_id} onValueChange={v => setCouncilForm(f => ({...f, property_id: v}))}><SelectTrigger><SelectValue placeholder="Property"/></SelectTrigger><SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}</SelectContent></Select>
                <Select value={councilForm.bin_type} onValueChange={v => setCouncilForm(f => ({...f, bin_type: v}))}><SelectTrigger><SelectValue placeholder="Type"/></SelectTrigger><SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="recycling">Recycling</SelectItem></SelectContent></Select>
                <Select value={councilForm.frequency} onValueChange={v => setCouncilForm(f => ({...f, frequency: v}))}><SelectTrigger><SelectValue placeholder="Frequency"/></SelectTrigger><SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="fortnightly">Fortnightly</SelectItem></SelectContent></Select>
                <Input type="date" value={councilForm.next_collection} onChange={e => setCouncilForm(f => ({...f, next_collection: e.target.value}))}/>
                <Select value={councilForm.assigned_staff_id || "unassigned"} onValueChange={v => setCouncilForm(f => ({...f, assigned_staff_id: v === "unassigned" ? "" : v}))}><SelectTrigger><SelectValue placeholder="Staff (Optional)"/></SelectTrigger><SelectContent><SelectItem value="unassigned">-- Unassigned --</SelectItem>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent></Select>
                <Button onClick={handleCouncilSubmit} disabled={saving}>Save</Button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete?</DialogTitle></DialogHeader><DialogFooter><Button variant="ghost" onClick={() => setDeletingId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>

    </div>
  );
};

export default BinManagement; 