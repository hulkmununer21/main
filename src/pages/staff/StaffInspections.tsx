import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useAuth } from "@/contexts/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Calendar, MapPin, CheckCircle, Eye, Clock, AlertTriangle, Check, X, Plus, FileText, ListChecks, DoorOpen, Home } from "lucide-react";
import { format, parseISO } from "date-fns";

// === TYPES ===
interface Inspection {
  id: string;
  property_id: string;
  // ✅ NEW: Room Support
  room_id?: string | null;
  rooms?: { room_number: string };
  
  scheduled_date: string;
  inspection_status: string;
  inspection_type: string;
  inspector_type: string;
  inspector_id?: string;
  properties?: { property_name: string; address_line1: string };
  checklist: any; // JSONB
  overall_notes?: string;
  issues_found?: string[]; // Array of strings
  photos?: string[];
}

// === STANDARD CHECKLIST ===
const STANDARD_CHECKLIST = [
  { category: "Safety", items: ["Smoke Alarms", "Carbon Monoxide Detectors", "Fire Exits Clear"] },
  { category: "Condition", items: ["Walls & Ceilings", "Flooring", "Windows & Doors"] },
  { category: "Sanitation", items: ["Kitchen Cleanliness", "Bathroom Hygiene", "Bin Area"] }
];

const StaffInspections = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staffId, setStaffId] = useState<string | null>(null);

  // Data Buckets
  const [mySchedule, setMySchedule] = useState<Inspection[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Inspection[]>([]);
  const [history, setHistory] = useState<Inspection[]>([]);

  // Execution Modal State
  const [isInspectingOpen, setIsInspectingOpen] = useState(false);
  const [activeInspection, setActiveInspection] = useState<Inspection | null>(null);
  
  // Form State
  const [checklistState, setChecklistState] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Dynamic Issues State
  const [currentIssueInput, setCurrentIssueInput] = useState("");
  const [issuesList, setIssuesList] = useState<string[]>([]);

  // Details/View Modal State
  const [viewInspection, setViewInspection] = useState<Inspection | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    const initStaff = async () => {
      if (!user) return;
      const { data } = await supabase.from('staff_profiles').select('id').eq('user_id', user.id).single();
      if (data) {
        setStaffId(data.id);
        fetchInspections(data.id);
      }
    };
    initStaff();
  }, [user]);

  const fetchInspections = async (currentStaffId: string) => {
    setLoading(true);
    try {
      // ✅ UPDATED QUERY: Fetch 'rooms(room_number)'
      const { data, error } = await supabase
        .from('inspections')
        .select(`*, properties(property_name, address_line1), rooms(room_number)`)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      const all = data || [];

      setMySchedule(all.filter((i: any) => i.inspector_id === currentStaffId && i.inspection_status === 'scheduled'));
      setReviewQueue(all.filter((i: any) => i.inspector_type === 'service_user' && i.inspection_status === 'completed'));
      setHistory(all.filter((i: any) => i.inspector_id === currentStaffId && ['passed', 'issues_found', 'completed'].includes(i.inspection_status)));

    } catch (err) {
      console.error(err);
      toast.error("Failed to load inspections");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. EXECUTION HANDLERS ---

  const handleStart = (inspection: Inspection) => {
    setActiveInspection(inspection);
    const initialChecklist: Record<string, string> = {};
    STANDARD_CHECKLIST.forEach(cat => cat.items.forEach(item => initialChecklist[item] = "pending"));
    setChecklistState(initialChecklist);
    setNotes("");
    setPhotos([]);
    setIssuesList([]); 
    setIsInspectingOpen(true);
  };

  const handleChecklistToggle = (item: string, status: 'pass' | 'fail') => {
    setChecklistState(prev => ({ ...prev, [item]: status }));
  };

  const handleAddIssue = () => {
    if (!currentIssueInput.trim()) return;
    setIssuesList(prev => [...prev, currentIssueInput.trim()]);
    setCurrentIssueInput("");
  };

  const handleRemoveIssue = (index: number) => {
    setIssuesList(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    if (!activeInspection) {
        toast.error("No active inspection found.");
        return;
    }

    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    const filePath = `inspections/${activeInspection.id}/${fileName}`;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('maintenance-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('maintenance-photos')
        .getPublicUrl(filePath);

      setPhotos(prev => [...prev, publicUrl]);
      toast.success("Photo attached");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const submitInspection = async (result: 'passed' | 'issues_found') => {
    if (!activeInspection) return;
    
    const finalResult = issuesList.length > 0 ? 'issues_found' : result;

    try {
      const finalChecklist = Object.entries(checklistState).map(([item, status]) => ({ item, status }));

      const { error } = await supabase.from('inspections').update({
        inspection_status: finalResult,
        checklist: finalChecklist,
        overall_notes: notes,
        photos: photos,
        issues_found: issuesList,
        completed_date: new Date().toISOString(),
        passed: finalResult === 'passed'
      }).eq('id', activeInspection.id);

      if (error) throw error;
      
      toast.success(`Inspection submitted: ${finalResult}`);
      setIsInspectingOpen(false);
      if (staffId) fetchInspections(staffId);

    } catch (error: any) {
      toast.error("Submission failed: " + error.message);
    }
  };

  // --- 3. VIEW DETAILS HANDLER ---
  const handleViewDetails = (inspection: Inspection) => {
    setViewInspection(inspection);
    setIsViewOpen(true);
  };

  // --- STATS ---
  const passRate = history.length > 0 
    ? Math.round((history.filter(h => h.inspection_status === 'passed').length / history.length) * 100) 
    : 0;

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Tasks...</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm text-muted-foreground">My Schedule</p><p className="text-2xl font-bold">{mySchedule.length}</p></div>
            <div className="bg-primary/10 p-3 rounded-full"><Calendar className="h-5 w-5 text-primary" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm text-muted-foreground">Pending Review</p><p className="text-2xl font-bold">{reviewQueue.length}</p></div>
            <div className="bg-orange-500/10 p-3 rounded-full"><Eye className="h-5 w-5 text-orange-500" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold">{history.length}</p></div>
            <div className="bg-green-500/10 p-3 rounded-full"><CheckCircle className="h-5 w-5 text-green-500" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm text-muted-foreground">Pass Rate</p><p className="text-2xl font-bold">{passRate}%</p></div>
            <div className="bg-blue-500/10 p-3 rounded-full"><Camera className="h-5 w-5 text-blue-500" /></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">My Schedule ({mySchedule.length})</TabsTrigger>
          <TabsTrigger value="review">Review Queue ({reviewQueue.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          {mySchedule.map((insp) => (
            <Card key={insp.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    {insp.properties?.property_name}
                  </h4>
                  <div className="flex gap-2 my-1">
                    {/* ✅ NEW: Scope Indicators */}
                    {insp.room_id ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <DoorOpen className="w-3 h-3 mr-1"/> Room {insp.rooms?.room_number}
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700">
                            <Home className="w-3 h-3 mr-1"/> Common Areas
                        </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {format(parseISO(insp.scheduled_date), 'PPP p')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleViewDetails(insp)}>Details</Button>
                  <Button onClick={() => handleStart(insp)}>
                    <Camera className="w-4 h-4 mr-2" /> Start
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          {reviewQueue.map((insp) => (
             <Card key={insp.id} className="border-orange-200 bg-orange-50/20">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{insp.properties?.property_name}</h4>
                    {insp.room_id ? (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">Room {insp.rooms?.room_number}</Badge>
                    ) : (
                        <Badge variant="outline">Property Wide</Badge>
                    )}
                    <p className="text-sm text-muted-foreground">Submitted by Contractor</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(insp)}>Review</Button>
                  </div>
                </CardContent>
             </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {history.map((insp) => (
             <Card key={insp.id} className="bg-muted/40">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{insp.properties?.property_name}</h4>
                    {insp.room_id && <p className="text-xs font-medium text-blue-600">Room {insp.rooms?.room_number}</p>}
                    <p className="text-xs text-muted-foreground">{format(parseISO(insp.scheduled_date), 'PPP')}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant={insp.inspection_status === 'passed' ? 'default' : 'destructive'}>
                        {insp.inspection_status}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(insp)}>
                        View Report
                    </Button>
                  </div>
                </CardContent>
             </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* === EXECUTION MODAL === */}
      <Dialog open={isInspectingOpen} onOpenChange={setIsInspectingOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perform Inspection</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
                {activeInspection?.properties?.property_name} 
                {activeInspection?.room_id && (
                    <Badge variant="secondary" className="ml-2">
                        Unit {activeInspection.rooms?.room_number}
                    </Badge>
                )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Checklist */}
            {STANDARD_CHECKLIST.map((category, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-500 border-b pb-1">{category.category}</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {category.items.map(item => (
                    <div key={item} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">{item}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant={checklistState[item] === 'pass' ? 'default' : 'ghost'} className={checklistState[item] === 'pass' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => handleChecklistToggle(item, 'pass')}>Pass</Button>
                        <Button size="sm" variant={checklistState[item] === 'fail' ? 'destructive' : 'ghost'} onClick={() => handleChecklistToggle(item, 'fail')}>Fail</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Dynamic Issues Input */}
            <div className="space-y-3 bg-red-50 p-4 rounded-lg border border-red-100">
                <Label className="text-red-900 font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Issues Found
                </Label>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Type specific issue (e.g., Cracked tile)..." 
                        value={currentIssueInput}
                        onChange={(e) => setCurrentIssueInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddIssue()}
                    />
                    <Button variant="secondary" onClick={handleAddIssue}><Plus className="h-4 w-4" /></Button>
                </div>
                {issuesList.length > 0 && (
                    <ul className="space-y-2 mt-2">
                        {issuesList.map((issue, idx) => (
                            <li key={idx} className="flex justify-between items-center bg-white p-2 rounded border text-sm text-red-700">
                                <span>{issue}</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={() => handleRemoveIssue(idx)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Overall Notes</Label>
              <Textarea placeholder="General observations..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            
            {/* Evidence */}
            <div className="space-y-2">
                <Label>Evidence</Label>
                <Input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                <div className="flex gap-2 mt-2 overflow-x-auto">
                    {photos.map((url, i) => <img key={i} src={url} className="h-16 w-16 rounded border object-cover" />)}
                </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInspectingOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => submitInspection('passed')}>Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === VIEW DETAILS MODAL === */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Inspection Details
                </DialogTitle>
                <DialogDescription>
                    {viewInspection?.properties?.property_name} 
                    {viewInspection?.rooms?.room_number && ` - Room ${viewInspection.rooms.room_number}`}
                    — {viewInspection?.scheduled_date ? format(parseISO(viewInspection.scheduled_date), 'PPP') : 'N/A'}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
                {/* 1. Status Banner */}
                <div className={`p-4 rounded-lg border flex justify-between items-center ${viewInspection?.inspection_status === 'passed' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Result</p>
                        <p className={`text-lg font-bold ${viewInspection?.inspection_status === 'passed' ? 'text-green-700' : 'text-red-700'}`}>
                            {viewInspection?.inspection_status?.replace('_', ' ').toUpperCase() || "PENDING"}
                        </p>
                    </div>
                    {viewInspection?.inspection_status === 'passed' ? <CheckCircle className="h-8 w-8 text-green-500" /> : <AlertTriangle className="h-8 w-8 text-red-500" />}
                </div>

                {/* 2. Specific Issues Found List */}
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
                ) : viewInspection?.inspection_status === 'passed' && (
                    <p className="text-sm text-green-600 italic">No specific issues were flagged during this inspection.</p>
                )}

                {/* 3. Checklist Grid (Read-Only) */}
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

export default StaffInspections;