import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck, Calendar, User, AlertTriangle, Plus, UserCheck, Edit, Trash2, FileText, CheckCircle, ListChecks, X, Home, DoorOpen } from "lucide-react";
import { format, parseISO } from "date-fns";

// === INTERFACES ===
interface Inspection {
  id: string;
  property_id: string;
  room_id?: string | null;
  tenancy_id?: string | null;
  scheduled_date: string;
  inspection_status: string;
  inspection_type: string;
  inspector_id: string;
  inspector_type: 'staff' | 'service_user';
  properties?: { property_name: string };
  rooms?: { room_number: string };
  inspector_name?: string;
  checklist?: any;
  overall_notes?: string;
  issues_found?: string[];
  photos?: string[];
}

interface Staff { id: string; full_name: string; user_id?: string; }
interface ServiceUser { id: string; full_name: string; company_name?: string; user_id?: string; } 
interface Property { id: string; property_name: string; }
interface ActiveTenancy { id: string; room_id: string; lodger_id: string; rooms: { room_number: string }; lodger_profiles: { full_name: string; user_id: string }; }

const InspectionManagement = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [serviceUserList, setServiceUserList] = useState<ServiceUser[]>([]);
  
  const [activeTenancies, setActiveTenancies] = useState<ActiveTenancy[]>([]);
  const [loadingTenancies, setLoadingTenancies] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [viewInspection, setViewInspection] = useState<Inspection | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    property_id: "",
    scope: "property", // 'property' or 'room'
    selected_tenancy_id: "",
    date: "",
    time: "10:00",
    type: "routine",
    inspector_type: "staff" as 'staff' | 'service_user', 
    inspector_id: ""
  });

  // --- 1. FETCH DROPDOWN DATA ---
  const fetchDropdownData = useCallback(async () => {
    try {
      const { data: props } = await supabase.from('properties').select('id, property_name');
      setProperties(props || []);

      const { data: staff } = await supabase.from('staff_profiles').select('id, full_name, user_id');
      setStaffList(staff || []);

      const { data: service } = await supabase.from('service_user_profiles').select('id, full_name, company_name, user_id'); 
      setServiceUserList(service || []);
    } catch (error) {
      console.error("Dropdown Data Error:", error);
    }
  }, []);

  // --- 2. FETCH INSPECTIONS ---
  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const { data: inspData, error } = await supabase
        .from('inspections')
        .select(`*, properties(property_name), rooms(room_number)`)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setInspections(inspData as any); 
    } catch (error: any) {
      toast.error("Failed to load inspections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDropdownData();
    fetchInspections();
  }, [fetchDropdownData, fetchInspections]);

  // Fetch Tenancies when Property Changes
  useEffect(() => {
    const fetchTenancies = async () => {
        if (!formData.property_id) {
            setActiveTenancies([]);
            return;
        }
        setLoadingTenancies(true);
        const { data } = await supabase.from('tenancies')
            .select(`
                id, 
                room_id, 
                lodger_id,
                rooms ( room_number ),
                lodger_profiles ( full_name, user_id )
            `)
            .eq('property_id', formData.property_id)
            .eq('tenancy_status', 'active');
            
        setActiveTenancies(data as any || []);
        setLoadingTenancies(false);
    };

    fetchTenancies();
  }, [formData.property_id]);

  // --- HELPER: Get Inspector Name ---
  const getInspectorName = (type: string, id: string) => {
    if (type === 'staff') {
      const s = staffList.find(s => s.id === id);
      return s ? `${s.full_name} (Staff)` : 'Unknown Staff';
    } else {
      const su = serviceUserList.find(u => u.id === id);
      return su ? `${su.full_name} ${su.company_name ? `(${su.company_name})` : ''}` : 'Unknown Service User';
    }
  };

  // --- 3. NOTIFICATION LOGIC ---
  const sendNotifications = async (payload: any, dateStr: string, timeStr: string, tenancyId?: string) => {
    const notificationsToInsert = [];
    const prettyDate = format(new Date(`${dateStr}T${timeStr}`), 'PPP p');

    // A. LODGER NOTIFICATION
    if (payload.room_id && tenancyId) {
        const tenancy = activeTenancies.find(t => t.id === tenancyId);
        if (tenancy?.lodger_profiles?.user_id) {
             notificationsToInsert.push({
                recipient_id: tenancy.lodger_profiles.user_id,
                subject: 'Room Inspection Scheduled',
                message_body: `A dedicated inspection for your room (${tenancy.rooms?.room_number}) is scheduled for ${prettyDate}.`,
                notification_type: 'in_app',
                created_at: new Date().toISOString()
            });
        }
    } else {
        const { data: tenants } = await supabase
            .from('tenancies')
            .select('lodger_profiles(user_id)')
            .eq('property_id', payload.property_id)
            .eq('tenancy_status', 'active');

        if (tenants) {
            tenants.forEach((t: any) => {
                if (t.lodger_profiles?.user_id) {
                    notificationsToInsert.push({
                        recipient_id: t.lodger_profiles.user_id,
                        subject: 'Property Inspection Scheduled',
                        message_body: `A general inspection for the property common areas is scheduled for ${prettyDate}.`,
                        notification_type: 'in_app',
                        created_at: new Date().toISOString()
                    });
                }
            });
        }
    }

    // B. INSPECTOR NOTIFICATION
    let inspectorUserId = null;
    if (payload.inspector_type === 'staff') {
        const staff = staffList.find(s => s.id === payload.inspector_id);
        inspectorUserId = staff?.user_id;
    } else {
        const su = serviceUserList.find(s => s.id === payload.inspector_id);
        inspectorUserId = su?.user_id;
    }

    if (inspectorUserId) {
        notificationsToInsert.push({
            recipient_id: inspectorUserId,
            subject: 'New Inspection Assignment',
            message_body: `You have been assigned to inspect a ${payload.room_id ? 'room' : 'property'} on ${prettyDate}.`,
            notification_type: 'in_app',
            created_at: new Date().toISOString()
        });
    }

    if (notificationsToInsert.length > 0) {
        await supabase.from('notifications').insert(notificationsToInsert);
    }
  };

  // --- 4. CREATE / UPDATE HANDLER ---
  const handleSave = async () => {
    if (!formData.property_id || !formData.date || !formData.inspector_id) {
      toast.error("Please fill in property, date, and inspector.");
      return;
    }

    if (formData.scope === 'room' && !formData.selected_tenancy_id) {
        toast.error("Please select a room/tenant for the inspection.");
        return;
    }

    setSaving(true);
    try {
      const scheduledDateTime = `${formData.date}T${formData.time}:00`;
      
      let roomId = null;
      let tenancyId = null;

      if (formData.scope === 'room' && formData.selected_tenancy_id) {
          const selectedTenancy = activeTenancies.find(t => t.id === formData.selected_tenancy_id);
          if (selectedTenancy) {
              roomId = selectedTenancy.room_id;
              tenancyId = selectedTenancy.id;
          }
      }

      const payload = {
        property_id: formData.property_id,
        room_id: roomId,
        tenancy_id: tenancyId,
        scheduled_date: new Date(scheduledDateTime).toISOString(),
        inspection_type: formData.type,
        inspector_id: formData.inspector_id,
        inspector_type: formData.inspector_type,
        inspection_status: 'scheduled',
      };

      if (editingId) {
        const { error } = await supabase.from('inspections').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success("Inspection updated successfully");
      } else {
        const { error } = await supabase.from('inspections').insert({ ...payload, created_at: new Date().toISOString() });
        if (error) throw error;
        await sendNotifications(payload, formData.date, formData.time, tenancyId || undefined);
        toast.success("Inspection scheduled & notifications sent");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchInspections();

    } catch (error: any) {
      toast.error("Operation failed: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel and remove this inspection?")) return;
    try {
      const { error } = await supabase.from('inspections').delete().eq('id', id);
      if (error) throw error;
      toast.success("Inspection removed");
      fetchInspections();
    } catch (error: any) {
      toast.error("Delete failed: " + error.message);
    }
  };

  const handleEditClick = (inspection: Inspection) => {
    setEditingId(inspection.id);
    const dateObj = new Date(inspection.scheduled_date);
    
    setFormData({
        property_id: inspection.property_id,
        scope: inspection.room_id ? 'room' : 'property',
        selected_tenancy_id: inspection.tenancy_id || "",
        date: format(dateObj, 'yyyy-MM-dd'),
        time: format(dateObj, 'HH:mm'),
        type: inspection.inspection_type,
        inspector_type: inspection.inspector_type,
        inspector_id: inspection.inspector_id
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
        property_id: "", 
        scope: "property", 
        selected_tenancy_id: "", 
        date: "", 
        time: "10:00", 
        type: "routine", 
        inspector_type: "staff", 
        inspector_id: "" 
    });
    setActiveTenancies([]); 
  };

  const handleViewDetails = (inspection: Inspection) => {
    setViewInspection(inspection);
    setIsViewOpen(true);
  };

  const scheduledInspections = inspections.filter(i => i.inspection_status === 'scheduled');
  const historyInspections = inspections.filter(i => ['completed', 'passed', 'issues_found', 'failed'].includes(i.inspection_status));

  const thisMonthCount = inspections.filter(i => new Date(i.scheduled_date).getMonth() === new Date().getMonth()).length;
  const issuesCount = inspections.filter(i => i.inspection_status === 'issues_found').length;

  if (loading && inspections.length === 0) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Inspection Management</h2>
          <p className="text-muted-foreground">Schedule, assign, and track property and room inspections</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Inspection
        </Button>
      </div>

      {/* 1. Scheduled Inspections */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Inspections</CardTitle>
          <CardDescription>Upcoming and in-progress property inspections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduledInspections.length === 0 ? <p className="text-muted-foreground text-center py-4">No scheduled inspections.</p> : 
             scheduledInspections.map((inspection) => (
              <Card key={inspection.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{inspection.properties?.property_name || "Unknown Property"}</h4>
                        
                        {/* Scope Badge */}
                        {inspection.room_id ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Room {inspection.rooms?.room_number || "N/A"}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700">Property Wide</Badge>
                        )}

                        <Badge variant="secondary" className="capitalize">{inspection.inspection_status.replace('_', ' ')}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="flex items-center gap-1"><Calendar className="w-3 h-3" />{inspection.scheduled_date ? format(parseISO(inspection.scheduled_date), 'PPP p') : "No Date"}</p>
                        <p className="flex items-center gap-1">
                          {inspection.inspector_type === 'staff' ? <User className="w-3 h-3"/> : <UserCheck className="w-3 h-3"/>}
                          {getInspectorName(inspection.inspector_type, inspection.inspector_id)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditClick(inspection)}><Edit className="w-3 h-3 mr-1" /> Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(inspection.id)}><Trash2 className="w-3 h-3 mr-1" /> Remove</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. Inspection History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection History</CardTitle>
          <CardDescription>Recently completed reports and outcomes</CardDescription>
        </CardHeader>
        <CardContent>
            {historyInspections.length === 0 ? <p className="text-muted-foreground text-center py-4">No inspection history available.</p> :
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50">
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Location</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Inspector</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Result</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {historyInspections.map((insp) => (
                            <tr key={insp.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-4 align-middle font-medium">
                                    {insp.properties?.property_name}
                                    {insp.room_id ? <span className="text-xs text-muted-foreground ml-2">(Room {insp.rooms?.room_number})</span> : <span className="text-xs text-muted-foreground ml-2">(General)</span>}
                                </td>
                                <td className="p-4 align-middle">{format(parseISO(insp.scheduled_date), 'PP')}</td>
                                <td className="p-4 align-middle">{getInspectorName(insp.inspector_type, insp.inspector_id)}</td>
                                <td className="p-4 align-middle">
                                    <Badge variant={insp.inspection_status === 'passed' ? 'default' : 'destructive'} className="capitalize">
                                        {insp.inspection_status.replace('_', ' ')}
                                    </Badge>
                                </td>
                                <td className="p-4 align-middle text-right">
                                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(insp)}>View Report</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            }
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6 flex items-center gap-3"><div className="bg-primary/10 p-3 rounded-full"><ClipboardCheck className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{thisMonthCount}</p><p className="text-sm text-muted-foreground">Inspections This Month</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-3"><div className="bg-destructive/10 p-3 rounded-full"><AlertTriangle className="w-5 h-5 text-destructive" /></div><div><p className="text-2xl font-bold">{issuesCount}</p><p className="text-sm text-muted-foreground">Issues Found</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-3"><div className="bg-green-500/10 p-3 rounded-full"><CheckCircle className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold">{historyInspections.length}</p><p className="text-sm text-muted-foreground">Total Completed</p></div></CardContent></Card>
      </div>

      {/* Schedule Dialog (UPDATED: Scrollable) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* ✅ ADDED: max-h and overflow classes */}
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Inspection" : "Schedule Inspection"}</DialogTitle><DialogDescription>{editingId ? "Update details." : "Set a date and assign inspector."}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            
            {/* Property Selector */}
            <div className="grid gap-2"><Label>Property</Label><Select value={formData.property_id} onValueChange={(v) => setFormData({...formData, property_id: v})}><SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}</SelectContent></Select></div>
            
            {/* Scope Selector */}
            <div className="grid gap-2">
                <Label>Inspection Scope</Label>
                <div className="flex gap-2">
                    <Button 
                        type="button" 
                        variant={formData.scope === 'property' ? 'default' : 'outline'} 
                        className="flex-1"
                        onClick={() => setFormData({...formData, scope: 'property', selected_tenancy_id: ''})}
                    >
                        <Home className="h-4 w-4 mr-2" /> Property Wide
                    </Button>
                    <Button 
                        type="button" 
                        variant={formData.scope === 'room' ? 'default' : 'outline'} 
                        className="flex-1"
                        onClick={() => setFormData({...formData, scope: 'room'})}
                        disabled={!formData.property_id}
                    >
                        <DoorOpen className="h-4 w-4 mr-2" /> Specific Room
                    </Button>
                </div>
            </div>

            {/* Room Dropdown */}
            {formData.scope === 'room' && (
                <div className="grid gap-2">
                    <Label>Select Room / Tenant</Label>
                    <Select value={formData.selected_tenancy_id} onValueChange={(v) => setFormData({...formData, selected_tenancy_id: v})}>
                        <SelectTrigger>
                            <SelectValue placeholder={loadingTenancies ? "Loading rooms..." : "Select room"} />
                        </SelectTrigger>
                        <SelectContent>
                            {activeTenancies.length > 0 ? (
                                activeTenancies.map(t => (
                                    <SelectItem key={t.id} value={t.id}>
                                        Room {t.rooms?.room_number} — {t.lodger_profiles?.full_name}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled>No active tenancies found</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Type</Label><Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="routine">Routine</SelectItem><SelectItem value="move_in">Move In</SelectItem><SelectItem value="move_out">Move Out</SelectItem><SelectItem value="safety_check">Safety Check</SelectItem></SelectContent></Select></div><div className="grid gap-2"><Label>Time</Label><Input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} /></div></div>
            <div className="grid gap-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} /></div>
            <div className="grid gap-2 border-t pt-4 mt-2"><Label>Assign To</Label><div className="flex gap-4 mb-2"><Button type="button" variant={formData.inspector_type === 'staff' ? 'default' : 'outline'} size="sm" onClick={() => setFormData({...formData, inspector_type: 'staff', inspector_id: ''})}>Internal Staff</Button><Button type="button" variant={formData.inspector_type === 'service_user' ? 'default' : 'outline'} size="sm" onClick={() => setFormData({...formData, inspector_type: 'service_user', inspector_id: ''})}>Service User</Button></div><Select value={formData.inspector_id} onValueChange={(v) => setFormData({...formData, inspector_id: v})}><SelectTrigger><SelectValue placeholder="Select Inspector" /></SelectTrigger><SelectContent>{formData.inspector_type === 'staff' ? (staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)) : (serviceUserList.map(su => <SelectItem key={su.id} value={su.id}>{su.full_name} {su.company_name ? `(${su.company_name})` : ''}</SelectItem>))}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingId ? "Update" : "Schedule"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Inspection Report
                </DialogTitle>
                <DialogDescription>
                    {viewInspection?.properties?.property_name} 
                    {viewInspection?.rooms?.room_number && ` (Room ${viewInspection.rooms.room_number})`} 
                    — {viewInspection?.scheduled_date ? format(parseISO(viewInspection.scheduled_date), 'PPP') : 'N/A'}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
                {/* 1. Status Banner */}
                <div className={`p-4 rounded-lg border flex justify-between items-center ${viewInspection?.inspection_status === 'passed' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Result</p>
                        <p className={`text-lg font-bold ${viewInspection?.inspection_status === 'passed' ? 'text-green-700' : 'text-red-700'}`}>
                            {viewInspection?.inspection_status?.replace('_', ' ').toUpperCase()}
                        </p>
                    </div>
                    {viewInspection?.inspection_status === 'passed' ? <CheckCircle className="h-8 w-8 text-green-500" /> : <AlertTriangle className="h-8 w-8 text-red-500" />}
                </div>

                {/* 2. Specific Issues Found */}
                {viewInspection?.issues_found && viewInspection.issues_found.length > 0 ? (
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2 text-red-800"><ListChecks className="h-4 w-4" /> Issues Identified</h4>
                        <div className="bg-red-50/50 rounded-lg p-1">
                            {viewInspection.issues_found.map((issue, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 border-b last:border-0 border-red-100">
                                    <X className="h-4 w-4 text-red-500 mt-0.5" />
                                    <span className="text-sm text-gray-800">{issue}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-green-600 italic">No specific issues flagged.</p>
                )}

                {/* 3. Checklist */}
                {viewInspection?.checklist && Array.isArray(viewInspection.checklist) && (
                    <div className="space-y-2">
                        <h4 className="font-semibold">Checklist Results</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {viewInspection.checklist.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center p-2 border rounded bg-gray-50">
                                    <span className="text-sm">{item.item}</span>
                                    <Badge variant={item.status === 'pass' ? 'default' : 'destructive'} className="h-5 text-[10px]">
                                        {item.status.toUpperCase()}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. Notes & Photos */}
                {viewInspection?.overall_notes && (
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Inspector Notes</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{viewInspection.overall_notes}</p>
                    </div>
                )}

                {viewInspection?.photos && viewInspection.photos.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Evidence Photos</h4>
                        <div className="flex gap-2 overflow-x-auto">
                            {viewInspection.photos.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noreferrer" className="block h-20 w-20 flex-shrink-0">
                                    <img src={url} className="h-full w-full object-cover rounded border hover:opacity-90" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InspectionManagement;