import { useState, useEffect, useRef } from "react";
import { 
  Bell, LogOut, Send, Loader2, ImageIcon, X, ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
// Removed BottomNav import
import { supabase } from "@/lib/supabaseClient";
import { format, parseISO } from "date-fns";

// === TYPES ===
interface Complaint {
  id: string;
  subject: string;
  description: string;
  complaint_category: string;
  priority: string; // ✅ Corrected property name
  complaint_status: string;
  created_at: string;
  attachments: string[] | null;   
  evidence_urls: string[] | null; 
  lodger_id: string;
}

const LodgerMaintenance = () => {
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data State
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeTenancy, setActiveTenancy] = useState<any>(null);

  // Form State
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  
  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // A. Get Profile & Tenancy
        const { data: profile } = await supabase.from('lodger_profiles').select('id').eq('user_id', user.id).single();
        if (!profile) return;

        const { data: tenancy } = await supabase
          .from('tenancies')
          .select('id, property_id, room_id, properties(property_name), rooms(room_number)')
          .eq('lodger_id', profile.id)
          .eq('tenancy_status', 'active')
          .maybeSingle();
        
        if (tenancy) {
            setActiveTenancy({ ...tenancy, lodger_id: profile.id });
        }

        // B. Fetch Complaints History
        const { data: history, error } = await supabase
          .from('complaints')
          .select('*')
          .eq('lodger_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setComplaints(history || []);

      } catch (e) {
        console.error("Data load error:", e);
        toast.error("Failed to load records.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // --- 2. FILE ACTIONS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (selectedFiles.length + newFiles.length > 5) {
        toast.error("Maximum 5 files allowed.");
        return;
      }
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- 3. SUBMIT HANDLER ---
  const handleSubmit = async () => {
    if (!subject || !category || !description) {
      return toast.error("Please fill in all required fields.");
    }
    if (!activeTenancy) return toast.error("No active tenancy found.");

    setSubmitting(true);
    const attachmentUrls: string[] = [];

    try {
      // A. Upload Images
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${activeTenancy.lodger_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('complaint-evidence')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('complaint-evidence')
            .getPublicUrl(fileName);
            
          return urlData.publicUrl;
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        attachmentUrls.push(...uploadedUrls);
      }

      // B. Insert Record
      const { data, error } = await supabase.from('complaints').insert({
        lodger_id: activeTenancy.lodger_id,
        tenancy_id: activeTenancy.id,
        property_id: activeTenancy.property_id,
        room_id: activeTenancy.room_id,
        subject: subject,
        description: description,
        complaint_category: category,
        priority: priority,
        complaint_status: 'pending',
        attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
        created_at: new Date().toISOString()
      }).select().single();

      if (error) throw error;

      toast.success("Request submitted successfully.");
      setComplaints([data, ...complaints]);
      
      // Reset Form
      setSubject("");
      setCategory("");
      setDescription("");
      setPriority("medium");
      setSelectedFiles([]);

    } catch (e: any) {
      console.error(e);
      toast.error("Submission failed: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // --- HELPERS ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return { variant: "outline" as const, className: "border-green-600 text-green-600 bg-green-50" };
      case 'in_progress':
        return { variant: "default" as const, className: "bg-blue-600" };
      case 'rejected':
        return { variant: "destructive" as const, className: "" };
      default:
        return { variant: "secondary" as const, className: "" };
    }
  };

  const getPriorityBadge = (p: string) => {
    switch(p) {
        case 'urgent': return "border-red-600 text-red-600 bg-red-50";
        case 'high': return "border-orange-600 text-orange-600 bg-orange-50";
        default: return "border-gray-400 text-gray-600";
    }
  };

  return (
    <>
      <SEO 
        title="Maintenance & Complaints - Domus"
        description="Submit and track requests"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Resolution Center</h1>
                <p className="text-sm text-muted-foreground">Report maintenance issues or complaints</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" onClick={logout}><LogOut className="h-5 w-5" /></Button>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* LEFT: HISTORY LIST */}
            <Card className="border-border h-fit">
              <CardHeader>
                <CardTitle>History</CardTitle>
                <CardDescription>Track status of your requests</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6 text-primary"/></div>
                ) : complaints.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No requests found.</p>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {complaints.map((item) => {
                      const statusBadge = getStatusBadge(item.complaint_status);
                      return (
                        <div key={item.id} className="p-4 border border-border rounded-lg hover:bg-muted/5 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="font-medium text-sm">{item.subject}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(item.created_at), 'd MMM yyyy')}</p>
                            </div>
                            <Badge variant={statusBadge.variant} className={statusBadge.className}>
                              {item.complaint_status.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 whitespace-pre-wrap">{item.description}</p>
                          
                          {/* Attachments & Evidence */}
                          {item.attachments && item.attachments.length > 0 && (
                            <div className="mb-3">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">My Evidence</p>
                                <div className="flex gap-2">
                                    {item.attachments.map((url, i) => (
                                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block h-12 w-12 shrink-0 border rounded overflow-hidden hover:opacity-80">
                                            <img src={url} className="h-full w-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                          )}

                          {item.evidence_urls && item.evidence_urls.length > 0 && (
                            <div className="mb-3 p-2 bg-green-50/50 border border-green-100 rounded-md">
                                <p className="text-[10px] uppercase font-bold text-green-700 mb-1 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3"/> Resolution Proof
                                </p>
                                <div className="flex gap-2">
                                    {item.evidence_urls.map((url, i) => (
                                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block h-12 w-12 shrink-0 border border-green-200 rounded overflow-hidden hover:opacity-80">
                                            <img src={url} className="h-full w-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                            <Badge variant="outline" className={getPriorityBadge(item.priority)}>
                                {item.priority || "Normal"}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded capitalize">
                                {item.complaint_category}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RIGHT: NEW REQUEST FORM */}
            <Card className="border-border h-fit">
              <CardHeader>
                <CardTitle>Log New Issue</CardTitle>
                <CardDescription>Submit details and evidence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Subject */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input 
                            placeholder="Brief title (e.g., Leaking Tap)" 
                            value={subject} 
                            onChange={e => setSubject(e.target.value)} 
                        />
                    </div>
                  </div>

                  {/* Category & Priority Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plumbing">Plumbing</SelectItem>
                          <SelectItem value="electrical">Electrical</SelectItem>
                          <SelectItem value="appliance">Appliance</SelectItem>
                          <SelectItem value="noise">Noise / Disturbance</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="cleanliness">Cleanliness</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Please describe the issue in detail..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-3 pt-2">
                    <Label>Evidence (Select Multiple Photos)</Label>
                    <div className="flex flex-wrap gap-3">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="relative h-20 w-20 border rounded-md overflow-hidden group">
                          <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover" />
                          <button 
                            onClick={() => removeFile(idx)}
                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="h-20 w-20 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors text-muted-foreground"
                      >
                        <ImageIcon className="h-5 w-5 mb-1" />
                        <span className="text-[10px] text-center px-1">Add Photos</span>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple 
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-2" 
                    onClick={handleSubmit}
                    disabled={submitting || !activeTenancy}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Send className="h-4 w-4 mr-2" />}
                    Submit Request
                  </Button>
                  
                  {!activeTenancy && !loading && (
                    <p className="text-xs text-destructive text-center">Active tenancy required to submit.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default LodgerMaintenance;