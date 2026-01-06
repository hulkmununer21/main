import { useState, useEffect } from "react";
import { 
  AlertTriangle, Clock, CheckCircle, MessageSquare, Building2, 
  Loader2, Upload, X, FileText, Image as ImageIcon, ShieldCheck 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  attachments: string[] | null;   // Lodger's initial photos
  evidence_urls: string[] | null; // Staff's resolution photos
  properties?: { property_name: string };
  rooms?: { room_number: string };
}

const StaffComplaints = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  
  // Action State
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  
  // Changed to Array for multiple files
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  
  const [submitting, setSubmitting] = useState(false);

  // Stats State
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0, high: 0 });

  // --- 1. FETCH DATA ---
  const fetchComplaints = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data: staffProfile } = await supabase
        .from('staff_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!staffProfile) throw new Error("Staff profile not found.");

      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          properties (property_name),
          rooms (room_number)
        `)
        .eq('assigned_to', staffProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComplaints(data || []);

      const statsCount = {
        open: data?.filter(c => c.complaint_status === 'pending').length || 0,
        inProgress: data?.filter(c => c.complaint_status === 'in_progress').length || 0,
        resolved: data?.filter(c => c.complaint_status === 'resolved').length || 0,
        high: data?.filter(c => ['high', 'urgent'].includes(c.complaint_priority)).length || 0
      };
      setStats(statsCount);

    } catch (error) {
      console.error(error);
      toast.error("Failed to load assigned complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [user]);

  // --- 2. ACTIONS ---

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setEvidenceFiles(prev => [...prev, ...filesArray]); // Append new files
    }
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedComplaintId) return;
    setSubmitting(true);

    try {
      const newEvidenceUrls: string[] = [];

      // 1. Upload All Selected Files
      if (evidenceFiles.length > 0) {
        // Upload concurrently for speed
        const uploadPromises = evidenceFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `resolution_${selectedComplaintId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('complaint-evidence')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('complaint-evidence')
            .getPublicUrl(fileName);
            
          return urlData.publicUrl;
        });

        // Wait for all uploads to finish
        const uploadedUrls = await Promise.all(uploadPromises);
        newEvidenceUrls.push(...uploadedUrls);
      }

      // 2. Prepare Update Payload
      const currentComplaint = complaints.find(c => c.id === selectedComplaintId);
      
      // Combine existing URLs with new ones
      const updatedEvidenceList = [
        ...(currentComplaint?.evidence_urls || []), 
        ...newEvidenceUrls
      ];

      const currentDesc = currentComplaint?.description || "";
      const newDescription = resolutionNote 
        ? `${currentDesc}\n\n[Staff Update ${format(new Date(), 'PP')}]: ${resolutionNote}` 
        : currentDesc;

      const { error } = await supabase
        .from('complaints')
        .update({
          complaint_status: status,
          description: newDescription,
          evidence_urls: updatedEvidenceList,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedComplaintId);

      if (error) throw error;

      toast.success(`Complaint updated to ${status.replace('_', ' ')}`);
      
      // Reset State
      setSelectedComplaintId(null);
      setResolutionNote("");
      setEvidenceFiles([]);
      fetchComplaints();

    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // --- UI HELPERS ---
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge variant="destructive">High</Badge>;
      case "urgent": return <Badge variant="destructive" className="animate-pulse">Urgent</Badge>;
      case "medium": return <Badge className="bg-orange-500 hover:bg-orange-600">Medium</Badge>;
      default: return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Open</Badge>;
      case "in_progress": return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case "resolved": return <Badge className="bg-green-500 hover:bg-green-600">Resolved</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground mb-1">Open</p><p className="text-2xl font-bold">{stats.open}</p></div>
            <div className="bg-red-100 p-3 rounded-full"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground mb-1">In Progress</p><p className="text-2xl font-bold">{stats.inProgress}</p></div>
            <div className="bg-blue-100 p-3 rounded-full"><Clock className="h-5 w-5 text-blue-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground mb-1">Resolved</p><p className="text-2xl font-bold">{stats.resolved}</p></div>
            <div className="bg-green-100 p-3 rounded-full"><CheckCircle className="h-5 w-5 text-green-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground mb-1">High Priority</p><p className="text-2xl font-bold">{stats.high}</p></div>
            <div className="bg-orange-100 p-3 rounded-full"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            My Assigned Complaints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complaints.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No complaints assigned to you.</p>
            ) : (
                complaints.map((complaint) => (
                <div key={complaint.id} className="p-5 border rounded-lg hover:bg-muted/5 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-3 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-lg">{complaint.subject}</span>
                                {getPriorityBadge(complaint.complaint_priority)}
                                {getStatusBadge(complaint.complaint_status)}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Building2 className="w-3 h-3" />
                                {complaint.properties?.property_name || "Unknown Property"} 
                                <span className="text-muted-foreground/50">|</span> 
                                Room {complaint.rooms?.room_number || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Reported: {format(parseISO(complaint.created_at), 'PPP p')}
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-muted/30 p-3 rounded-md text-sm text-foreground/80 whitespace-pre-wrap mb-4">
                        {complaint.description}
                    </div>

                    {/* === 1. LODGER ATTACHMENTS (READ ONLY) === */}
                    {complaint.attachments && complaint.attachments.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs font-semibold mb-2 flex items-center gap-1 text-muted-foreground">
                                <FileText className="w-3 h-3"/> Lodger's Evidence:
                            </p>
                            <div className="flex gap-2">
                                {complaint.attachments.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noreferrer" className="block h-16 w-16 border rounded overflow-hidden hover:opacity-80">
                                        <img src={url} className="h-full w-full object-cover" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* === 2. STAFF EVIDENCE (READ ONLY - Previously Uploaded) === */}
                    {complaint.evidence_urls && complaint.evidence_urls.length > 0 && (
                        <div className="mb-4 p-3 bg-green-50/50 border border-green-100 rounded-md">
                            <p className="text-xs font-semibold mb-2 flex items-center gap-1 text-green-700">
                                <ShieldCheck className="w-3 h-3"/> Resolution Evidence (Staff):
                            </p>
                            <div className="flex gap-2">
                                {complaint.evidence_urls.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noreferrer" className="block h-16 w-16 border border-green-200 rounded overflow-hidden hover:opacity-80">
                                        <img src={url} className="h-full w-full object-cover" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* ACTION AREA */}
                    {selectedComplaintId === complaint.id ? (
                    <div className="mt-4 p-4 bg-secondary/10 border border-secondary/20 rounded-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="space-y-2">
                            <Label>Update Notes</Label>
                            <Textarea 
                                placeholder="Describe actions taken..." 
                                className="min-h-[80px] bg-background" 
                                value={resolutionNote}
                                onChange={e => setResolutionNote(e.target.value)}
                            />
                        </div>

                        {/* MULTIPLE FILE UPLOAD */}
                        <div className="space-y-2">
                            <Label>Upload Resolution Evidence (Select Multiple)</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="file" 
                                    multiple // ✅ Allow multiple files
                                    accept="image/*"
                                    className="bg-background"
                                    onChange={handleFileChange}
                                />
                            </div>
                            
                            {/* Selected Files Preview List */}
                            {evidenceFiles.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {evidenceFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-background border px-2 py-1 rounded-md text-xs">
                                            <span className="truncate max-w-[150px]">{file.name}</span>
                                            <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">
                                                <X className="w-3 h-3"/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2 justify-end">
                            <Button variant="ghost" onClick={() => { setSelectedComplaintId(null); setEvidenceFiles([]); }} disabled={submitting}>Cancel</Button>
                            
                            {complaint.complaint_status !== "in_progress" && (
                                <Button 
                                    className="bg-blue-600 hover:bg-blue-700 text-white" 
                                    onClick={() => handleUpdateStatus('in_progress')}
                                    disabled={submitting}
                                >
                                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                                    Mark In Progress
                                </Button>
                            )}
                            
                            <Button 
                                className="bg-green-600 hover:bg-green-700 text-white" 
                                onClick={() => handleUpdateStatus('resolved')}
                                disabled={submitting}
                            >
                                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Resolve & Close
                            </Button>
                        </div>
                    </div>
                    ) : (
                    <div className="flex gap-2">
                        {complaint.complaint_status !== "resolved" && (
                            <Button size="sm" variant="outline" onClick={() => setSelectedComplaintId(complaint.id)}>
                                Update Status / Resolve
                            </Button>
                        )}
                        {complaint.complaint_status === "resolved" && (
                            <Badge variant="outline" className="h-9 px-3 border-green-200 text-green-700 bg-green-50">
                                <CheckCircle className="w-3 h-3 mr-2" /> Completed
                            </Badge>
                        )}
                    </div>
                    )}
                </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffComplaints;