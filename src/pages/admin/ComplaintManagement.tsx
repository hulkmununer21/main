import { useState, useEffect } from "react";
import { 
  MessageSquare, AlertTriangle, Clock, CheckCircle, User, 
  Loader2, Download, Check, X, Shield, FileText, Image as ImageIcon 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { format, parseISO } from "date-fns";

// === TYPES ===
interface Complaint {
  id: string;
  lodger_id: string;
  property_id: string;
  room_id: string;
  subject: string;
  description: string;
  complaint_category: string;
  complaint_priority: string;
  complaint_status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  attachments: string[] | null;   // Lodger's evidence
  evidence_urls: string[] | null; // Staff's resolution evidence
  // Joins
  lodger_profiles?: { full_name: string };
  properties?: { property_name: string };
  rooms?: { room_number: string };
  staff_profiles?: { full_name: string };
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
}

const ComplaintManagement = () => {
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  
  // Stats
  const [stats, setStats] = useState({ total: 0, high: 0, active: 0, resolved: 0 });

  // UI State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // --- 1. DATA FETCHING ---
  const fetchData = async () => {
    try {
      setLoading(true);

      // A. Fetch Staff List
      const { data: staffData, error: staffError } = await supabase
        .from('staff_profiles')
        .select('id, full_name')
        .order('full_name', { ascending: true });

      if (staffError) {
        console.error("Staff Fetch Error:", staffError);
        toast.error("Could not load staff list.");
      } else {
        const mappedStaff = (staffData || []).map((s: any) => ({
          id: s.id,
          name: s.full_name,
          role: "Staff"
        }));
        setStaffList(mappedStaff);
      }

      // B. Fetch Complaints (including evidence_urls)
      const { data: rawComplaints, error: complaintsError } = await supabase
        .from('complaints')
        .select(`
          *,
          lodger_profiles (full_name),
          properties (property_name),
          rooms (room_number),
          staff_profiles (full_name)
        `)
        .order('created_at', { ascending: false });

      if (complaintsError) throw complaintsError;

      const realData = rawComplaints || [];
      setComplaints(realData);

      // C. Stats
      const total = realData.length;
      const high = realData.filter((c: any) => ['high', 'urgent'].includes(c.complaint_priority)).length;
      const active = realData.filter((c: any) => ['pending', 'in_progress'].includes(c.complaint_status)).length;
      const resolved = realData.filter((c: any) => c.complaint_status === 'resolved').length;
      setStats({ total, high, active, resolved });

    } catch (err: any) {
      console.error(err);
      toast.error("Error loading dashboard: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- 2. ACTIONS ---

  const handleAssign = async () => {
    if (!selectedComplaint || !selectedStaffId) return;

    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          assigned_to: selectedStaffId, 
          complaint_status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      toast.success("Assigned to staff successfully");
      setAssignModalOpen(false);
      setSelectedStaffId("");
      fetchData();
    } catch (e: any) {
      toast.error("Assignment failed: " + e.message);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          complaint_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Status updated`);
      
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, complaint_status: newStatus } : c));
    } catch (e) {
      toast.error("Update failed");
    }
  };

  // --- HELPERS ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return "bg-green-100 text-green-700 hover:bg-green-100 border-green-200";
      case 'in_progress': return "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200";
      case 'rejected': return "bg-red-100 text-red-700 hover:bg-red-100 border-red-200";
      default: return "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200";
    }
  };

  const filteredComplaints = statusFilter === 'all' 
    ? complaints 
    : complaints.filter(c => c.complaint_status === statusFilter);

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Complaint Management</h2>
          <p className="text-muted-foreground">Track and resolve lodger issues</p>
        </div>
        
        <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Filter Status" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline"><Download className="w-4 h-4 mr-2"/> Export</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6 flex items-center gap-3"><div className="bg-primary/10 p-3 rounded-full"><MessageSquare className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-3"><div className="bg-destructive/10 p-3 rounded-full"><AlertTriangle className="w-5 h-5 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.high}</p><p className="text-sm text-muted-foreground">High Priority</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-3"><div className="bg-blue-100 p-3 rounded-full"><Clock className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{stats.active}</p><p className="text-sm text-muted-foreground">Active</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-3"><div className="bg-green-100 p-3 rounded-full"><CheckCircle className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold">{stats.resolved}</p><p className="text-sm text-muted-foreground">Resolved</p></div></CardContent></Card>
      </div>

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Complaints</CardTitle>
          <CardDescription>Manage assignments and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredComplaints.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No complaints found.</p>
            ) : (
                filteredComplaints.map((complaint) => (
                <Card key={complaint.id} className="border-border hover:bg-muted/5 transition-colors">
                    <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                        
                        {/* Main Info */}
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">#{complaint.id.slice(0,6)}</span>
                                <h4 className="font-semibold text-base">{complaint.subject}</h4>
                                <Badge variant="outline" className={getStatusColor(complaint.complaint_status)}>{complaint.complaint_status.replace('_', ' ')}</Badge>
                                <Badge variant="outline" className={complaint.complaint_priority === 'urgent' ? 'border-red-500 text-red-600' : ''}>{complaint.complaint_priority}</Badge>
                                <Badge variant="secondary" className="text-[10px]">{complaint.complaint_category}</Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2">{complaint.description}</p>
                            
                            {/* === 1. LODGER EVIDENCE === */}
                            {complaint.attachments && complaint.attachments.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 flex items-center gap-1">
                                        <FileText className="w-3 h-3"/> Lodger's Evidence
                                    </p>
                                    <div className="flex gap-2">
                                        {complaint.attachments.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="block h-10 w-10 border rounded overflow-hidden hover:opacity-80">
                                                <img src={url} className="h-full w-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* === 2. STAFF RESOLUTION EVIDENCE === */}
                            {complaint.evidence_urls && complaint.evidence_urls.length > 0 && (
                                <div className="mt-3 p-2 bg-green-50/50 border border-green-100 rounded-md max-w-fit">
                                    <p className="text-[10px] uppercase font-bold text-green-700 mb-1 flex items-center gap-1">
                                        <Shield className="w-3 h-3"/> Staff Resolution Proof
                                    </p>
                                    <div className="flex gap-2">
                                        {complaint.evidence_urls.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="block h-10 w-10 border border-green-200 rounded overflow-hidden hover:opacity-80">
                                                <img src={url} className="h-full w-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Meta Data */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-1 gap-x-4 text-xs text-muted-foreground mt-3 pt-3 border-t">
                                <p><span className="font-medium text-foreground">Lodger:</span> {complaint.lodger_profiles?.full_name || 'Unknown'}</p>
                                <p><span className="font-medium text-foreground">Location:</span> {complaint.properties?.property_name || 'N/A'} (Rm {complaint.rooms?.room_number || '-'})</p>
                                <p><span className="font-medium text-foreground">Date:</span> {format(parseISO(complaint.created_at), 'PP p')}</p>
                                <p className="flex items-center gap-1">
                                    <User className="w-3 h-3"/> 
                                    <span className="font-medium text-foreground">Assigned:</span> 
                                    {complaint.staff_profiles?.full_name || <span className="text-orange-600 italic">Unassigned</span>}
                                </p>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col gap-2 min-w-[140px]">
                            {complaint.complaint_status === 'pending' && (
                                <Button size="sm" onClick={() => { setSelectedComplaint(complaint); setAssignModalOpen(true); }}>Assign Staff</Button>
                            )}
                            {complaint.complaint_status !== 'resolved' && complaint.complaint_status !== 'rejected' && (
                                <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleStatusUpdate(complaint.id, 'resolved')}><Check className="w-3 h-3 mr-2"/> Resolve</Button>
                            )}
                            {complaint.complaint_status === 'pending' && (
                                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleStatusUpdate(complaint.id, 'rejected')}><X className="w-3 h-3 mr-2"/> Reject</Button>
                            )}
                        </div>

                    </div>
                    </CardContent>
                </Card>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* ASSIGNMENT MODAL (Staff Only) */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Assign to Staff</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-4">
                <p className="text-sm text-muted-foreground">
                    Assigning <span className="font-medium text-foreground">"{selectedComplaint?.subject}"</span> to:
                </p>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground"><Shield className="w-3 h-3"/> Select Staff Member</div>
                    <Select onValueChange={setSelectedStaffId} value={selectedStaffId}>
                        <SelectTrigger><SelectValue placeholder="Search staff..." /></SelectTrigger>
                        <SelectContent className="max-h-60">
                            {staffList.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.name} <span className="text-muted-foreground text-xs">({s.role})</span>
                                </SelectItem>
                            ))}
                            {staffList.length === 0 && <div className="p-2 text-xs text-center text-muted-foreground">No staff members found.</div>}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
                <Button onClick={handleAssign} disabled={!selectedStaffId}>Confirm Assignment</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ComplaintManagement;