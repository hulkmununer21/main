import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Users, AlertCircle, CheckCircle, RotateCcw, ListOrdered } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from 'date-fns';

// === DATABASE INTERFACES ===

interface Property { id: string; property_name: string; rotation_day_of_week?: number; }
interface Room { id: string; property_id: string; room_number: string; bin_rotation_order: number | null; }
interface LodgerProfile { id: string; full_name: string; user_id?: string; }
interface StaffProfile { id: string; full_name: string; user_id?: string; }
interface Tenancy { id: string; property_id: string; room_id: string; lodger_id: string; tenancy_status: string; }
interface RotationState { property_id: string; current_room_id: string; next_rotation_date: string; current_lodger_id: string | null; }
interface BinSchedule { id: string; property_id: string; bin_type: string; collection_frequency: string; next_collection_date: string; assigned_staff_id: string | null; }
interface DutyLog { id: string; duty_date: string; status: string; charge_applied: boolean; lodger_id: string; property_id: string; room_id: string; }

// === START OF COMPONENT ===

const BinManagement = () => {
  // --- RAW DATA STATES ---
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [lodgers, setLodgers] = useState<LodgerProfile[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  
  // --- FEATURE STATES ---
  const [rotationStates, setRotationStates] = useState<RotationState[]>([]);
  const [schedules, setSchedules] = useState<BinSchedule[]>([]);
  const [dutyLogs, setDutyLogs] = useState<DutyLog[]>([]);
  
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

  // --- MAIN DATA FETCH ---
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        propsRes, 
        roomsRes, 
        tenancyRes, 
        lodgerRes, 
        staffRes, 
        stateRes,
        schedRes,
        logsRes
      ] = await Promise.all([
        supabase.from('properties').select('id, property_name, rotation_day_of_week'),
        supabase.from('rooms').select('id, property_id, room_number, bin_rotation_order'),
        supabase.from('tenancies').select('id, property_id, room_id, lodger_id, tenancy_status').eq('tenancy_status', 'active'),
        supabase.from('lodger_profiles').select('id, full_name, user_id'),
        supabase.from('staff_profiles').select('id, full_name, user_id'),
        supabase.from('in_house_rotation_state').select('*'),
        supabase.from('bin_schedules').select('*'),
        supabase.from('bin_duty_logs').select('*').eq('status', 'missed').order('duty_date', { ascending: false })
      ]);

      if (propsRes.error) throw propsRes.error;
      
      setProperties(propsRes.data || []);
      setRooms(roomsRes.data || []);
      setTenancies(tenancyRes.data || []);
      setLodgers(lodgerRes.data || []);
      setStaff(staffRes.data || []);
      setRotationStates(stateRes.data || []);
      setSchedules(schedRes.data || []);
      setDutyLogs(logsRes.data || []);

    } catch (error: any) {
      console.error("Data Load Error:", error);
      toast.error("Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

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


  // --- SETUP & ROTATION HANDLERS ---

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
    if (error) {
      toast.error("Failed to save day");
    } else {
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
          id: r.id, 
          property_id: r.property_id, 
          room_number: r.room_number, 
          bin_rotation_order: r.bin_rotation_order 
      }));

      const { error: roomErr } = await supabase.from('rooms').upsert(updates, { onConflict: 'id' });
      if (roomErr) throw roomErr;

      const validRooms = setupRooms.filter(r => r.bin_rotation_order !== null).sort((a, b) => a.bin_rotation_order! - b.bin_rotation_order!);
      if (validRooms.length === 0) throw new Error("No rooms included in rotation.");
      
      const firstRoom = validRooms[0];
      const activeLodgerId = getActiveLodgerIdForRoom(firstRoom.id);

      const dayInt = parseInt(selectedRotationDay);
      const today = new Date();
      const diff = (dayInt + 7 - today.getDay()) % 7;
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + (diff === 0 ? 7 : diff));

      const { error: stateErr } = await supabase.from('in_house_rotation_state').upsert({
        property_id: selectedPropertyId,
        current_room_id: firstRoom.id,
        current_lodger_id: activeLodgerId,
        next_rotation_date: format(nextDate, 'yyyy-MM-dd')
      }, { onConflict: 'property_id' }); 

      if (stateErr) throw stateErr;

      toast.success("Rotation configured and started!");
      setInitRotationDialogOpen(false);
      fetchAllData();

    } catch (error: any) {
      toast.error("Setup failed: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleManualAssign = async () => {
    setSaving(true);
    try {
      const activeLodgerId = getActiveLodgerIdForRoom(assignForm.room_id);
      
      const { error } = await supabase.from('in_house_rotation_state').upsert({
        property_id: assignForm.property_id,
        current_room_id: assignForm.room_id,
        current_lodger_id: activeLodgerId,
        next_rotation_date: assignForm.next_rotation_date
      }, { onConflict: 'property_id' });

      if (error) throw error;
      toast.success("Manual assignment successful.");
      setManualAssignDialogOpen(false);
      fetchAllData();
    } catch (error: any) {
      toast.error("Assign failed: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendReminder = async (lodgerId: string | null, propertyName: string) => {
    if (!lodgerId) return toast.error("No lodger assigned.");
    
    const lodger = lodgers.find(l => l.id === lodgerId);
    if (!lodger?.user_id) return toast.error("Lodger user account not found.");

    const { error } = await supabase.from('notifications').insert({
      recipient_id: lodger.user_id,
      notification_type: 'in_app',
      priority: 'medium',
      subject: 'Bin Duty Reminder',
      message_body: `Reminder: You are on bin duty for ${propertyName}.`,
      related_entity_type: 'bin_rotation',
      sent_at: new Date().toISOString()
    });

    if (error) toast.error("Failed to send.");
    else toast.success("Reminder sent.");
  };


  // --- HANDLERS: COUNCIL & CHARGES ---

  const handleCouncilSubmit = async () => {
    setSaving(true);
    
    // SAFE HANDLING: Convert empty string to null for UUID
    const formattedStaffId = councilForm.assigned_staff_id === "" ? null : councilForm.assigned_staff_id;

    const payload = {
        property_id: councilForm.property_id,
        bin_type: councilForm.bin_type,
        collection_frequency: councilForm.frequency,
        next_collection_date: councilForm.next_collection,
        assigned_staff_id: formattedStaffId
    };

    try {
        let error;
        if (councilForm.id) {
            const { error: e } = await supabase.from('bin_schedules').update(payload).eq('id', councilForm.id);
            error = e;
        } else {
            const { error: e } = await supabase.from('bin_schedules').insert(payload);
            error = e;
        }

        if (error) throw error;

        toast.success(councilForm.id ? "Schedule updated" : "Schedule added");
        setCouncilDialogOpen(false);
        fetchAllData();
    } catch (error: any) {
        console.error("Submit Error:", error);
        toast.error("Failed: " + error.message);
    } finally {
        setSaving(false);
    }
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

  const handleCharge = async (log: DutyLog) => {
    const { error } = await supabase.from('extra_charges').insert({
        lodger_id: log.lodger_id,
        property_id: log.property_id,
        amount: 25.00,
        charge_type: 'bin_duty_missed',
        charge_status: 'pending',
        reason: 'Missed Bin Duty'
    });

    if (error) toast.error("Charge failed: " + error.message);
    else {
        await supabase.from('bin_duty_logs').update({ charge_applied: true }).eq('id', log.id);
        toast.success("Charge applied");
        fetchAllData();
    }
  };


  // --- RENDERING ---

  if (isLoading) return <div className="p-8 text-center">Loading Bin Management...</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Bin Management</h2>
        <p className="text-muted-foreground">Manage automated rotation and schedules</p>
      </div>

      {/* --- 1. IN-HOUSE ROTATION CARD --- */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>In-House Weekly Bin Rotation</CardTitle>
              <CardDescription>Automated duty assignments per property.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                    setManualAssignDialogOpen(true);
                    if(properties.length > 0) setAssignForm(f => ({ ...f, property_id: properties[0].id }));
                }}>
                    <Users className="w-4 h-4 mr-2" />
                    Manual Assign
                </Button>
                <Button onClick={handleOpenSetup}>
                    <ListOrdered className="w-4 h-4 mr-2" />
                    Setup Rotation
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rotationStates.length === 0 ? <p className="text-center text-muted-foreground py-4">No active rotations.</p> : 
             rotationStates.map(state => {
                const prop = getProperty(state.property_id);
                const room = getRoom(state.current_room_id);
                const lodgerName = state.current_lodger_id ? getLodger(state.current_lodger_id)?.full_name : "Unoccupied";
                
                const dayName = prop?.rotation_day_of_week !== undefined 
                    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][prop.rotation_day_of_week] 
                    : 'N/A';
                
                const isOverdue = new Date(state.next_rotation_date) < new Date();

                return (
                    <Card key={state.property_id} className="border-border">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold">{prop?.property_name}</h4>
                                        <Badge variant={isOverdue ? "destructive" : "default"}>{isOverdue ? "Overdue" : "Active"}</Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <p>Current: <span className="font-medium text-foreground">{room?.room_number}</span> ({lodgerName})</p>
                                        <p>Next: {format(parseISO(state.next_rotation_date), 'EEE, MMM d')} (Rotates on {dayName})</p>
                                    </div>
                                </div>
                                <Button size="sm" onClick={() => handleSendReminder(state.current_lodger_id, prop?.property_name || "")}>
                                    Reminder
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
             })
            }
          </div>
        </CardContent>
      </Card>

      {/* --- 2. COUNCIL SCHEDULE CARD --- */}
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Council Collection Schedule</CardTitle>
                <Button variant="outline" size="sm" onClick={() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    setCouncilForm({ id: "", property_id: "", bin_type: "general", frequency: "weekly", next_collection: todayStr, assigned_staff_id: "" });
                    setCouncilDialogOpen(true);
                }}>
                    <Calendar className="w-4 h-4 mr-2" /> Add Schedule
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
                {schedules.map(sch => {
                    const prop = getProperty(sch.property_id);
                    const assignedStaff = getStaff(sch.assigned_staff_id);
                    return (
                        <Card key={sch.id} className="border-border">
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold">{prop?.property_name} <Badge variant="secondary" className="ml-2">{sch.bin_type}</Badge></h4>
                                    <p className="text-sm text-muted-foreground">Next: {new Date(sch.next_collection_date).toLocaleDateString()} • {sch.collection_frequency}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <Users className="w-3 h-3" /> {assignedStaff ? assignedStaff.full_name : "Unassigned"}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => {
                                        setCouncilForm({
                                            id: sch.id,
                                            property_id: sch.property_id,
                                            bin_type: sch.bin_type,
                                            frequency: sch.collection_frequency,
                                            next_collection: sch.next_collection_date,
                                            assigned_staff_id: sch.assigned_staff_id || ""
                                        });
                                        setCouncilDialogOpen(true);
                                    }}>Edit</Button>
                                    <Button size="sm" variant="destructive" onClick={() => setDeletingId(sch.id)}>Delete</Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </CardContent>
      </Card>

      {/* --- 3. MISSED DUTIES CARD --- */}
      <Card>
        <CardHeader><CardTitle>Missed Duties</CardTitle></CardHeader>
        <CardContent>
            <div className="space-y-3">
                {dutyLogs.filter(l => !l.charge_applied).length === 0 ? <p className="text-center text-muted-foreground">No uncharged missed duties.</p> :
                 dutyLogs.filter(l => !l.charge_applied).map(log => (
                    <Card key={log.id} className="border-destructive/30 bg-destructive/5">
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <h4 className="font-semibold">{getProperty(log.property_id)?.property_name} - {getRoom(log.room_id)?.room_number}</h4>
                                <p className="text-sm text-muted-foreground">{getLodger(log.lodger_id)?.full_name} • {new Date(log.duty_date).toLocaleDateString()}</p>
                            </div>
                            <Button size="sm" variant="destructive" onClick={() => handleCharge(log)}>Apply Charge</Button>
                        </CardContent>
                    </Card>
                 ))
                }
            </div>
        </CardContent>
      </Card>

      {/* --- DIALOGS --- */}

      {/* Setup Dialog */}
      <Dialog open={initRotationDialogOpen} onOpenChange={setInitRotationDialogOpen}>
        <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Setup Rotation</DialogTitle></DialogHeader>
            
            {setupStep === 1 ? (
                <div className="space-y-4">
                    <Select value={selectedPropertyId} onValueChange={v => {
                        setSelectedPropertyId(v);
                        const p = getProperty(v);
                        setSelectedRotationDay(p?.rotation_day_of_week?.toString() || "");
                    }}>
                        <SelectTrigger><SelectValue placeholder="Select Property" /></SelectTrigger>
                        <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={selectedRotationDay} onValueChange={setSelectedRotationDay} disabled={!selectedPropertyId}>
                        <SelectTrigger><SelectValue placeholder="Day of Week" /></SelectTrigger>
                        <SelectContent>
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => <SelectItem key={i} value={i.toString()}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleSetupStep1} disabled={saving || !selectedPropertyId || !selectedRotationDay}>Next: Room Order</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="max-h-[50vh] overflow-y-auto space-y-2">
                        {setupRooms.map((r, idx) => (
                            <div key={r.id} className="flex justify-between items-center p-2 border rounded">
                                <span>{r.room_number}</span>
                                <Select value={r.bin_rotation_order?.toString() || 'exclude'} onValueChange={(v) => handleRoomOrderLocalChange(r.id, v)}>
                                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="exclude">Exclude</SelectItem>
                                        {setupRooms.map((_, i) => <SelectItem key={i} value={(i+1).toString()}>Order {i+1}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setSetupStep(1)}>Back</Button>
                        <Button onClick={handleSetupFinish} disabled={saving}>Save & Start</Button>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>

      {/* Manual Assign Dialog */}
      <Dialog open={manualAssignDialogOpen} onOpenChange={setManualAssignDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Manual Assign</DialogTitle></DialogHeader>
            <div className="space-y-4">
                <Select value={assignForm.property_id} onValueChange={v => setAssignForm(f => ({ ...f, property_id: v, room_id: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Property" /></SelectTrigger>
                    <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={assignForm.room_id} onValueChange={v => setAssignForm(f => ({ ...f, room_id: v }))} disabled={!assignForm.property_id}>
                    <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                    <SelectContent>
                        {rooms.filter(r => r.property_id === assignForm.property_id).map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.room_number} {r.bin_rotation_order ? `(Order ${r.bin_rotation_order})` : '(Excl)'}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {assignForm.room_id && (
                    <div className="text-sm bg-muted p-2 rounded">
                        Active Lodger: <strong>{getLodgerNameForRoom(assignForm.room_id)}</strong>
                    </div>
                )}
                <Input type="date" value={assignForm.next_rotation_date} onChange={e => setAssignForm(f => ({ ...f, next_rotation_date: e.target.value }))} />
                <Button onClick={handleManualAssign} disabled={saving || !assignForm.room_id}>Confirm Assignment</Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Council Dialog - UPDATED with optional chaining */}
      <Dialog open={councilDialogOpen} onOpenChange={setCouncilDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Council Schedule</DialogTitle></DialogHeader>
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Property</label>
                    <Select value={councilForm.property_id} onValueChange={v => setCouncilForm(f => ({ ...f, property_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Property" /></SelectTrigger>
                        <SelectContent>{properties?.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-medium">Bin Type</label>
                    <Select value={councilForm.bin_type} onValueChange={v => setCouncilForm(f => ({ ...f, bin_type: v }))}>
                        <SelectTrigger><SelectValue placeholder="Bin Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="recycling">Recycling</SelectItem>
                            <SelectItem value="garden">Garden</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Frequency</label>
                    <Select value={councilForm.frequency} onValueChange={v => setCouncilForm(f => ({ ...f, frequency: v }))}>
                        <SelectTrigger><SelectValue placeholder="Frequency" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="fortnightly">Fortnightly</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Next Collection Date</label>
                    <Input type="date" value={councilForm.next_collection} onChange={e => setCouncilForm(f => ({ ...f, next_collection: e.target.value }))} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Assigned Staff (Optional)</label>
                    <Select value={councilForm.assigned_staff_id || "unassigned"} onValueChange={v => setCouncilForm(f => ({ ...f, assigned_staff_id: v === "unassigned" ? "" : v }))}>
                        <SelectTrigger><SelectValue placeholder="Assign Staff" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned">-- Unassigned --</SelectItem>
                            {staff?.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={handleCouncilSubmit} disabled={saving}>Save Schedule</Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
            <DialogHeader><DialogTitle>Delete?</DialogTitle></DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default BinManagement;