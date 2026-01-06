import { useEffect, useState, useCallback } from "react";
import { 
  Trash2, Calendar, CheckCircle, AlertTriangle, Building2, Loader2, 
  User, ShieldCheck, XCircle, Gavel, Search, MoreHorizontal, Clock 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { format, isSameDay, parseISO, startOfWeek, isPast, addDays } from "date-fns";

// === 1. INTERFACES ===
interface InHouseDuty {
  id: string; 
  log_id?: string; 
  property_name: string;
  property_id: string; 
  room_number: string;
  lodger_name?: string;
  lodger_id?: string; 
  tenancy_id?: string; 
  rotation_date: string;
  status: 'pending' | 'completed' | 'missed' | 'verified';
  is_verified: boolean;
  notes?: string;
}

interface CouncilDuty {
  id: string; 
  property_name: string;
  bin_type: string;
  next_collection_date: string;
  status: 'pending' | 'completed';
}

const StaffBinDuties = () => {
  const { user } = useAuth();
  
  const [inHouseDuties, setInHouseDuties] = useState<InHouseDuty[]>([]);
  const [councilDuties, setCouncilDuties] = useState<CouncilDuty[]>([]);
  const [historyLog, setHistoryLog] = useState<InHouseDuty[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffProfileId, setStaffProfileId] = useState<string | null>(null);

  // Modals
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [fineModalOpen, setFineModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);

  const [selectedTask, setSelectedTask] = useState<InHouseDuty | null>(null);
  const [selectedCouncilTask, setSelectedCouncilTask] = useState<CouncilDuty | null>(null);
  
  // Inputs
  const [staffNotes, setStaffNotes] = useState("");
  const [fineAmount, setFineAmount] = useState("15.00");
  const [newDate, setNewDate] = useState(""); 
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data: staffProfile } = await supabase.from('staff_profiles').select('id').eq('user_id', user.id).single();
      if (!staffProfile) throw new Error("Staff profile not found");
      setStaffProfileId(staffProfile.id);
      const staffId = staffProfile.id;

      const { data: assignments } = await supabase.from('staff_property_assignments').select('property_id').eq('staff_id', staffId);
      const { data: councilScheds } = await supabase.from('bin_schedules').select('property_id').eq('assigned_staff_id', staffId);
      
      const propIds = Array.from(new Set([
        ...(assignments?.map(a => a.property_id) || []),
        ...(councilScheds?.map(c => c.property_id) || [])
      ]));

      if (propIds.length === 0) {
        setLoading(false);
        return;
      }

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

      const [propsRes, roomsRes, rotationsRes, schedulesRes, logsRes] = await Promise.all([
        supabase.from('properties').select('id, property_name').in('id', propIds),
        supabase.from('rooms').select('id, room_number').in('property_id', propIds),
        supabase.from('in_house_rotation_state').select('*').in('property_id', propIds),
        supabase.from('bin_schedules').select('*').eq('assigned_staff_id', staffId),
        supabase.from('bin_rotations')
          .select('*, lodger_profiles(full_name), properties(property_name), rooms(room_number)')
          .in('property_id', propIds)
          .order('created_at', { ascending: false })
          .limit(100) 
      ]);

      const properties = (propsRes.data as any[]) || [];
      const rooms = (roomsRes.data as any[]) || [];
      const rotations = (rotationsRes.data as any[]) || [];
      const schedules = (schedulesRes.data as any[]) || [];
      const logs = (logsRes.data as any[]) || [];

      // --- IN HOUSE LOGIC ---
      const activeList: InHouseDuty[] = rotations.map(rot => {
        const prop = properties.find(p => p.id === rot.property_id);
        const room = rooms.find(r => r.id === rot.current_room_id);
        const log = logs.find(l => l.property_id === rot.property_id && l.room_id === rot.current_room_id && l.created_at >= weekStart);

        return {
          id: rot.id,
          log_id: log?.id,
          property_name: prop?.property_name || "Unknown",
          property_id: rot.property_id,
          room_number: room?.room_number || "?",
          lodger_name: log?.lodger_profiles?.full_name || "Assigned Lodger",
          lodger_id: log?.lodger_id,
          tenancy_id: log?.tenancy_id,
          rotation_date: rot.next_rotation_date,
          status: (log?.bin_duty_status as any) || 'pending',
          is_verified: log?.is_verified || false,
          notes: log?.notes
        };
      });

      const historyList: InHouseDuty[] = logs.map(l => ({
        id: l.id,
        log_id: l.id,
        property_name: l.properties?.property_name,
        property_id: l.property_id,
        room_number: l.rooms?.room_number,
        lodger_name: l.lodger_profiles?.full_name,
        lodger_id: l.lodger_id,
        tenancy_id: l.tenancy_id,
        rotation_date: l.rotation_date || l.created_at,
        status: l.bin_duty_status,
        is_verified: l.is_verified,
        notes: l.notes
      }));

      setInHouseDuties(activeList);
      setHistoryLog(historyList);

      // --- COUNCIL LOGIC ---
      const processedCouncil: CouncilDuty[] = schedules.map(sched => ({
        id: sched.id, 
        property_name: properties.find(p => p.id === sched.property_id)?.property_name || "Unknown",
        bin_type: sched.bin_type,
        next_collection_date: sched.next_collection_date,
        status: 'pending'
      }));
      
      setCouncilDuties(processedCouncil.sort((a,b) => new Date(a.next_collection_date).getTime() - new Date(b.next_collection_date).getTime()));

    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- ACTIONS ---

  const handleVerify = async () => {
    if (!selectedTask?.log_id || !staffProfileId) return;
    setProcessing(true);
    
    try {
      const { error } = await supabase.from('bin_rotations').update({
        is_verified: true,
        verified_by: staffProfileId,
        verified_at: new Date().toISOString(),
        notes: staffNotes ? `[Staff Verified]: ${staffNotes}` : undefined
      }).eq('id', selectedTask.log_id);

      if (error) throw error;
      toast.success("Verified successfully");
      setVerifyModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setProcessing(false); }
  };

  const handleIssueFine = async () => {
    if (!selectedTask || !staffProfileId || !selectedTask.lodger_id) {
        toast.error("Missing lodger information.");
        return;
    }
    setProcessing(true);
    try {
      const chargeId = crypto.randomUUID(); 
      const { error: chargeError } = await supabase.from('extra_charges').insert({
        id: chargeId,
        lodger_id: selectedTask.lodger_id,
        property_id: selectedTask.property_id,
        tenancy_id: selectedTask.tenancy_id,
        charge_type: 'bin_duty_missed',
        amount: parseFloat(fineAmount),
        reason: `Missed Bin Duty (${format(parseISO(selectedTask.rotation_date), 'PP')}). ${staffNotes || ''}`,
        charge_status: 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (chargeError) throw chargeError;

      if (selectedTask.log_id) {
        const { error: updateError } = await supabase.from('bin_rotations').update({
          bin_duty_status: 'missed',
          is_verified: true, 
          verified_by: staffProfileId,
          verified_at: new Date().toISOString(),
          extra_charge_id: chargeId,
          notes: `[Fine Issued]: ${staffNotes}`
        }).eq('id', selectedTask.log_id);
        if (updateError) throw updateError;
      }

      toast.success(`Lodger fined £${fineAmount}`);
      setFineModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Action failed: " + err.message);
    } finally { setProcessing(false); }
  };

  const handleReschedule = async () => {
    if (!selectedCouncilTask || !newDate) return;
    setProcessing(true);
    try {
        const { error } = await supabase
            .from('bin_schedules')
            .update({ next_collection_date: new Date(newDate).toISOString() })
            .eq('id', selectedCouncilTask.id);

        if (error) throw error;
        toast.success("Collection date updated");
        setRescheduleModalOpen(false);
        fetchData();
    } catch (err: any) {
        toast.error("Update failed: " + err.message);
    } finally {
        setProcessing(false);
    }
  };

  // --- HELPERS ---
  const getStatusBadge = (status: string, verified: boolean) => {
    if (status === "completed" && verified) return <Badge className="bg-green-600 gap-1"><ShieldCheck className="w-3 h-3"/> Verified</Badge>;
    if (status === "completed" && !verified) return <Badge className="bg-orange-500 gap-1">Needs Verify</Badge>;
    if (status === "missed") return <Badge variant="destructive">Missed / Fined</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const isOverdue = (dateStr: string) => isPast(parseISO(dateStr)) && !isSameDay(parseISO(dateStr), new Date());

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  // Stats
  const totalActive = inHouseDuties.length;
  const completedCount = inHouseDuties.filter(d => (d.status === 'completed' && d.is_verified)).length;
  const pendingVerifyCount = inHouseDuties.filter(d => d.status === 'completed' && !d.is_verified).length;
  const missedOverdueCount = inHouseDuties.filter(d => d.status === 'missed' || (d.status === 'pending' && isOverdue(d.rotation_date))).length;

  return (
    <div className="w-full space-y-6">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Total Active</p><p className="text-2xl font-bold">{totalActive}</p></div><div className="bg-primary/10 p-3 rounded-full"><Trash2 className="h-5 w-5 text-primary"/></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Completed</p><p className="text-2xl font-bold">{completedCount}</p></div><div className="bg-green-100 p-3 rounded-full"><CheckCircle className="h-5 w-5 text-green-600"/></div></CardContent></Card>
        <Card className={pendingVerifyCount > 0 ? "border-orange-400 bg-orange-50/50" : ""}><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Pending Verify</p><p className="text-2xl font-bold">{pendingVerifyCount}</p></div><div className="bg-orange-100 p-3 rounded-full"><ShieldCheck className="h-5 w-5 text-orange-600"/></div></CardContent></Card>
        <Card className={missedOverdueCount > 0 ? "border-red-400 bg-red-50/50" : ""}><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Missed/Overdue</p><p className="text-2xl font-bold">{missedOverdueCount}</p></div><div className="bg-red-100 p-3 rounded-full"><XCircle className="h-5 w-5 text-red-600"/></div></CardContent></Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="active">Active Duties</TabsTrigger>
          <TabsTrigger value="council">Council Schedule</TabsTrigger>
          <TabsTrigger value="history">Full History Log</TabsTrigger>
        </TabsList>

        {/* TAB 1: ACTIVE */}
        <TabsContent value="active" className="mt-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {inHouseDuties.map((duty) => {
              const overdue = isOverdue(duty.rotation_date) && !duty.is_verified && duty.status !== 'completed';
              return (
                <div key={duty.id} className={`p-5 border rounded-lg flex flex-col gap-4 bg-card shadow-sm ${overdue ? 'border-red-300 bg-red-50/10' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div><p className="font-semibold text-lg">{duty.property_name}</p><div className="flex items-center gap-2 text-sm text-muted-foreground mt-1"><User className="w-3 h-3"/>{duty.lodger_name || `Room ${duty.room_number}`}</div></div>
                    {getStatusBadge(duty.status, duty.is_verified)}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/50 p-2 rounded"><Calendar className="w-3 h-3"/>Target: {format(parseISO(duty.rotation_date), 'PPP')}{overdue && <span className="text-red-600 font-bold ml-auto uppercase text-[10px]">Overdue</span>}</div>
                  <div className="flex gap-2 mt-auto pt-2 border-t">
                    {duty.status === 'completed' && !duty.is_verified && (<Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { setSelectedTask(duty); setVerifyModalOpen(true); }}><ShieldCheck className="w-3 h-3 mr-1"/> Verify</Button>)}
                    {(overdue || duty.status === 'pending' || (duty.status === 'completed' && !duty.is_verified)) && duty.status !== 'missed' && duty.lodger_id && (<Button size="sm" variant="destructive" className="flex-1" onClick={() => { setSelectedTask(duty); setFineModalOpen(true); }}><Gavel className="w-3 h-3 mr-1"/> Fine</Button>)}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: COUNCIL (With Reschedule) */}
        <TabsContent value="council" className="mt-6 w-full">
          <Card className="w-full">
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                    <tr><th className="p-4 font-medium">Property</th><th className="p-4 font-medium">Bin Type</th><th className="p-4 font-medium">Collection Date</th><th className="p-4 font-medium text-right">Actions</th></tr>
                </thead>
                <tbody>
                {councilDuties.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/5">
                        <td className="p-4 font-medium">{c.property_name}</td>
                        <td className="p-4"><Badge variant="outline">{c.bin_type}</Badge></td>
                        <td className="p-4"><div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground"/> {format(parseISO(c.next_collection_date), 'EEE, d MMM yyyy')}</div></td>
                        <td className="p-4 text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4"/></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedCouncilTask(c); setRescheduleModalOpen(true); }}><Clock className="w-4 h-4 mr-2"/> Reschedule</DropdownMenuItem></DropdownMenuContent>
                            </DropdownMenu>
                        </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: HISTORY (With Visible Actions) */}
        <TabsContent value="history" className="mt-6 w-full">
          <div className="flex gap-2 mb-4 w-full"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/><Input placeholder="Search property..." className="pl-9 w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></div>
          <div className="border rounded-lg overflow-hidden bg-card w-full shadow-sm">
            <table className="w-full text-sm table-auto">
                <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr><th className="p-4 text-left">Date</th><th className="p-4 text-left">Property</th><th className="p-4 text-left">Lodger</th><th className="p-4 text-left">Status</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y">
                    {historyLog.filter(h => h.property_name.toLowerCase().includes(searchTerm.toLowerCase())).map((log) => (
                        <tr key={log.id} className="hover:bg-muted/5">
                            <td className="p-4">{format(parseISO(log.rotation_date), 'dd/MM/yy')}</td>
                            <td className="p-4">{log.property_name}</td>
                            <td className="p-4">{log.lodger_name}</td>
                            <td className="p-4">{getStatusBadge(log.status, log.is_verified)}</td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    {/* ALWAYS VISIBLE BUTTONS */}
                                    {log.status === 'completed' && !log.is_verified && (
                                        <Button size="sm" className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white shadow-sm" onClick={() => { setSelectedTask(log); setVerifyModalOpen(true); }}><ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Verify</Button>
                                    )}
                                    {!log.is_verified && log.status !== 'missed' && log.lodger_id && (
                                        <Button size="sm" variant="outline" className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300" onClick={() => { setSelectedTask(log); setFineModalOpen(true); }}><Gavel className="h-3.5 w-3.5 mr-1.5" /> Fine</Button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        </TabsContent>
      </Tabs>

      {/* MODALS */}
      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Verify Duty</DialogTitle></DialogHeader><div className="space-y-4 py-2"><p>Confirm {selectedTask?.lodger_name} completed task.</p><Label>Notes</Label><Textarea value={staffNotes} onChange={e => setStaffNotes(e.target.value)}/></div><DialogFooter><Button variant="outline" onClick={() => setVerifyModalOpen(false)}>Cancel</Button><Button className="bg-green-600" onClick={handleVerify}>Confirm</Button></DialogFooter></DialogContent>
      </Dialog>
      <Dialog open={fineModalOpen} onOpenChange={setFineModalOpen}>
        <DialogContent className="border-red-200"><DialogHeader><DialogTitle className="text-red-600">Issue Penalty</DialogTitle></DialogHeader><div className="space-y-4 py-2"><div className="bg-red-50 p-3 rounded text-sm text-red-800">Marking as Missed & Charging.</div><Label>Amount (£)</Label><Input type="number" value={fineAmount} onChange={e => setFineAmount(e.target.value)} /><Label>Reason</Label><Textarea value={staffNotes} onChange={e => setStaffNotes(e.target.value)}/></div><DialogFooter><Button variant="ghost" onClick={() => setFineModalOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleIssueFine}>Confirm Penalty</Button></DialogFooter></DialogContent>
      </Dialog>
      
      {/* RESCHEDULE MODAL */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Reschedule Collection</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
                <p className="text-sm text-muted-foreground">Select a new date for {selectedCouncilTask?.bin_type} bin collection at {selectedCouncilTask?.property_name}.</p>
                <div className="space-y-2">
                    <Label>New Date</Label>
                    <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setRescheduleModalOpen(false)}>Cancel</Button>
                <Button onClick={handleReschedule} disabled={!newDate || processing}>Update Date</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffBinDuties;