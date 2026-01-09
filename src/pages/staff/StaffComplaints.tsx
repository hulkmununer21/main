import { useState, useEffect } from "react";
import { 
  AlertTriangle, Clock, CheckCircle, MessageSquare, Building2, 
  Loader2, Upload, X, FileText, Image as ImageIcon, ShieldCheck, 
  Briefcase, Hand, Search, Filter 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { format, parseISO } from "date-fns";

// === TYPES ===
interface Complaint {
  id: string;
  subject: string;
  description: string;
  property_id: string;
  room_id: string;
  complaint_priority: string;
  complaint_status: string;
  created_at: string;
  assigned_to: string | null;
  attachments: string[] | null;
  evidence_urls: string[] | null;
  properties?: { property_name: string };
  rooms?: { room_number: string };
}

const StaffComplaints = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [complaints, setComplaints] = useState<Complaint[]>([]); 
  const [poolComplaints, setPoolComplaints] = useState<Complaint[]>([]); 
  const [staffId, setStaffId] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'in_progress', 'resolved'

  // Action State
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Stats State
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0, high: 0 });

  // --- 1. FETCH DATA ---
  const fetchComplaints = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data: staffProfile } = await supabase.from('staff_profiles').select('id').eq('user_id', user.id).single();
      if (!staffProfile) throw new Error("Staff profile not found.");
      setStaffId(staffProfile.id);

      // A. Assigned Complaints
      const { data: assignedData, error: assignedError } = await supabase
        .from('complaints')
        .select(`*, properties (property_name), rooms (room_number)`)
        .eq('assigned_to', staffProfile.id)
        .order('created_at', { ascending: false });

      if (assignedError) throw assignedError;
      setComplaints(assignedData || []);

      // B. Pool Complaints
      const { data: poolData, error: poolError } = await supabase
        .from('complaints')
        .select(`*, properties (property_name), rooms (room_number)`)
        .is('assigned_to', null)
        .order('created_at', { ascending: false });

      if (poolError) throw poolError;
      setPoolComplaints(poolData || []);

      // Stats
      setStats({
        open: assignedData?.filter(c => c.complaint_status === 'pending').length || 0,
        inProgress: assignedData?.filter(c => c.complaint_status === 'in_progress').length || 0,
        resolved: assignedData?.filter(c => c.complaint_status === 'resolved').length || 0,
        high: assignedData?.filter(c => ['high', 'urgent'].includes(c.complaint_priority)).length || 0
      });

    } catch (error) {
      console.error(error);
      toast.error("Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [user]);

  // --- 2. HELPERS & FILTERS ---

  const filterComplaints = (list: Complaint[]) => {
    return list.filter(c => {
      const matchesSearch = 
        c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.properties?.property_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || c.complaint_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  // --- 3. ACTIONS ---

  const handleClaimComplaint = async (complaint: Complaint) => {
    if (!staffId) return;
    setSubmitting(true);
    try {
        const { error } = await supabase.from('complaints').update({ assigned_to: staffId, complaint_status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', complaint.id);
        if (error) throw error;
        toast.success("Complaint claimed successfully!");
        fetchComplaints();
    } catch (err: any) { toast.error("Failed to claim: " + err.message); } finally { setSubmitting(false); }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedComplaintId) return;
    setSubmitting(true);
    try {
      const newEvidenceUrls: string[] = [];
      if (evidenceFiles.length > 0) {
        const uploadPromises = evidenceFiles.map(async (file) => {
          const fileName = `resolution_${selectedComplaintId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
          const { error } = await supabase.storage.from('complaint-evidence').upload(fileName, file);
          if (error) throw error;
          const { data } = supabase.storage.from('complaint-evidence').getPublicUrl(fileName);
          return data.publicUrl;
        });
        newEvidenceUrls.push(...await Promise.all(uploadPromises));
      }

      const current = complaints.find(c => c.id === selectedComplaintId);
      const updatedEvidence = [...(current?.evidence_urls || []), ...newEvidenceUrls];
      const desc = resolutionNote ? `${current?.description || ""}\n\n[Staff Update ${format(new Date(), 'PP')}]: ${resolutionNote}` : current?.description;

      const { error } = await supabase.from('complaints').update({ complaint_status: status, description: desc, evidence_urls: updatedEvidence, updated_at: new Date().toISOString() }).eq('id', selectedComplaintId);
      if (error) throw error;

      toast.success(`Updated to ${status.replace('_', ' ')}`);
      setSelectedComplaintId(null); setResolutionNote(""); setEvidenceFiles([]); fetchComplaints();
    } catch (e: any) { toast.error("Update failed: " + e.message); } finally { setSubmitting(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setEvidenceFiles(prev => [...prev, ...Array.from(e.target.files!)]); };
  const removeFile = (idx: number) => setEvidenceFiles(prev => prev.filter((_, i) => i !== idx));

  // --- UI COMPONENTS ---
  const getPriorityBadge = (p: string) => {
    if (['high', 'urgent'].includes(p)) return <Badge variant="destructive" className="capitalize">{p}</Badge>;
    if (p === 'medium') return <Badge className="bg-orange-500 hover:bg-orange-600 capitalize">{p}</Badge>;
    return <Badge variant="secondary" className="capitalize">{p}</Badge>;
  };

  const getStatusBadge = (s: string) => {
    if (s === 'pending') return <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Open</Badge>;
    if (s === 'in_progress') return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
    if (s === 'resolved') return <Badge className="bg-green-500 hover:bg-green-600">Resolved</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>;

  return (
    <div className="space-y-6">
      
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">My Open</p><p className="text-2xl font-bold">{stats.open}</p></div><div className="bg-red-100 p-3 rounded-full text-red-600"><AlertTriangle className="h-5 w-5"/></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">In Progress</p><p className="text-2xl font-bold">{stats.inProgress}</p></div><div className="bg-blue-100 p-3 rounded-full text-blue-600"><Clock className="h-5 w-5"/></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Resolved</p><p className="text-2xl font-bold">{stats.resolved}</p></div><div className="bg-green-100 p-3 rounded-full text-green-600"><CheckCircle className="h-5 w-5"/></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Pool Count</p><p className="text-2xl font-bold">{poolComplaints.length}</p></div><div className="bg-purple-100 p-3 rounded-full text-purple-600"><Briefcase className="h-5 w-5"/></div></CardContent></Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search subject, description, or property..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        {/* Filter Dropdown */}
        <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        <span className="text-foreground">{statusFilter === 'all' ? 'All Statuses' : statusFilter.replace('_', ' ')}</span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <Tabs defaultValue="my-tasks" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-4">
            <TabsTrigger value="my-tasks">My Active Tasks</TabsTrigger>
            <TabsTrigger value="pool">Complaint Pool ({poolComplaints.length})</TabsTrigger>
        </TabsList>

        {/* === TAB 1: MY ASSIGNED COMPLAINTS === */}
        <TabsContent value="my-tasks">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-primary" /> My Assigned Complaints</CardTitle></CardHeader>
                <CardContent>
                <div className="space-y-4">
                    {filterComplaints(complaints).length === 0 ? <p className="text-center py-8 text-muted-foreground">No matching complaints found.</p> : (
                        filterComplaints(complaints).map((complaint) => (
                        <div key={complaint.id} className="p-5 border rounded-lg hover:bg-muted/5 transition-colors">
                            <div className="flex flex-col md:flex-row justify-between items-start mb-3 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-lg">{complaint.subject}</span>
                                        {getPriorityBadge(complaint.complaint_priority)}
                                        {getStatusBadge(complaint.complaint_status)}
                                    </div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="w-3 h-3" />{complaint.properties?.property_name || "Unknown Property"} <span className="text-muted-foreground/50">|</span> Room {complaint.rooms?.room_number || "N/A"}</p>
                                    <p className="text-xs text-muted-foreground">Reported: {format(parseISO(complaint.created_at), 'PPP p')}</p>
                                </div>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-md text-sm text-foreground/80 whitespace-pre-wrap mb-4">{complaint.description}</div>

                            {complaint.attachments && complaint.attachments.length > 0 && (
                                <div className="mb-4"><p className="text-xs font-semibold mb-2 flex items-center gap-1 text-muted-foreground"><FileText className="w-3 h-3"/> Lodger's Evidence:</p><div className="flex gap-2">{complaint.attachments.map((url, i) => (<a key={i} href={url} target="_blank" rel="noreferrer" className="block h-16 w-16 border rounded overflow-hidden hover:opacity-80"><img src={url} className="h-full w-full object-cover" /></a>))}</div></div>
                            )}

                            {complaint.evidence_urls && complaint.evidence_urls.length > 0 && (
                                <div className="mb-4 p-3 bg-green-50/50 border border-green-100 rounded-md"><p className="text-xs font-semibold mb-2 flex items-center gap-1 text-green-700"><ShieldCheck className="w-3 h-3"/> Resolution Evidence (Staff):</p><div className="flex gap-2">{complaint.evidence_urls.map((url, i) => (<a key={i} href={url} target="_blank" rel="noreferrer" className="block h-16 w-16 border border-green-200 rounded overflow-hidden hover:opacity-80"><img src={url} className="h-full w-full object-cover" /></a>))}</div></div>
                            )}
                            
                            {selectedComplaintId === complaint.id ? (
                            <div className="mt-4 p-4 bg-secondary/10 border border-secondary/20 rounded-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-2"><Label>Update Notes</Label><Textarea placeholder="Describe actions taken..." className="min-h-[80px] bg-background" value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}/></div>
                                <div className="space-y-2"><Label>Evidence</Label><Input type="file" multiple accept="image/*" className="bg-background" onChange={handleFileChange}/>{evidenceFiles.length > 0 && <p className="text-xs text-muted-foreground">{evidenceFiles.length} files selected</p>}</div>
                                <div className="flex gap-2 pt-2 justify-end">
                                    <Button variant="ghost" onClick={() => { setSelectedComplaintId(null); setEvidenceFiles([]); }} disabled={submitting}>Cancel</Button>
                                    {complaint.complaint_status !== "in_progress" && <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleUpdateStatus('in_progress')} disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}Mark In Progress</Button>}
                                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleUpdateStatus('resolved')} disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}<CheckCircle className="w-4 h-4 mr-2" />Resolve & Close</Button>
                                </div>
                            </div>
                            ) : (
                            <div className="flex gap-2">
                                {complaint.complaint_status !== "resolved" && <Button size="sm" variant="outline" onClick={() => setSelectedComplaintId(complaint.id)}>Update Status / Resolve</Button>}
                                {complaint.complaint_status === "resolved" && <Badge variant="outline" className="h-9 px-3 border-green-200 text-green-700 bg-green-50"><CheckCircle className="w-3 h-3 mr-2" /> Completed</Badge>}
                            </div>
                            )}
                        </div>
                        ))
                    )}
                </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* === TAB 2: COMPLAINT POOL === */}
        <TabsContent value="pool">
            <Card className="bg-muted/20 border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-purple-600" /> Complaint Pool</CardTitle>
                    <CardDescription>Unassigned tasks available for pick up.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filterComplaints(poolComplaints).length === 0 ? <p className="text-center py-12 text-muted-foreground italic">No unassigned complaints available.</p> : (
                            filterComplaints(poolComplaints).map((complaint) => (
                                <div key={complaint.id} className="p-5 border bg-background rounded-lg hover:shadow-sm transition-shadow flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold">{complaint.subject}</span>
                                            {getPriorityBadge(complaint.complaint_priority)}
                                            <Badge variant="outline">Unassigned</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="w-3 h-3" />{complaint.properties?.property_name || "Unknown Property"} <span className="text-muted-foreground/50">|</span> Room {complaint.rooms?.room_number || "N/A"}</p>
                                        <p className="text-sm mt-2 text-foreground/80 line-clamp-2">{complaint.description}</p>
                                        <p className="text-xs text-muted-foreground mt-2">Reported: {format(parseISO(complaint.created_at), 'PPP p')}</p>
                                    </div>
                                    <Button className="shrink-0" onClick={() => handleClaimComplaint(complaint)} disabled={submitting}>
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Hand className="w-4 h-4 mr-2"/> Pick Up Task</>}
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffComplaints;