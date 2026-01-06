import { useState, useEffect, useRef } from "react";
import { 
  FolderOpen, FileText, AlertTriangle, Download, Eye, Upload, 
  Trash2, Loader2, Calendar as CalendarIcon, Search, X, Paperclip 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { format, parseISO, isPast, addDays, isBefore } from "date-fns";
import { useAuth } from "@/contexts/useAuth";

// === TYPES ===
interface DocumentRecord {
  id: string;
  tenancy_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  expiry_date: string | null;
  created_at: string;
  document_status: string; 
  tenancies?: {
    lodger_profiles: { full_name: string };
    properties: { property_name: string };
    rooms: { room_number: string };
  };
}

interface ActiveTenancy {
  id: string;
  lodger_id: string;
  property_id: string;
  room_id: string;
  lodger_name: string;
  property_name: string;
  room_number: string;
}

const DocumentManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Data State
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activeTenancies, setActiveTenancies] = useState<ActiveTenancy[]>([]);
  
  // UI State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form State
  const [selectedTenancyId, setSelectedTenancyId] = useState("");
  const [docType, setDocType] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  
  // Multiple Files State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. FETCH DATA ---
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      // A. Fetch Documents
      const { data: docs, error } = await supabase
        .from('documents')
        .select(`
          *,
          tenancies (
            lodger_profiles (full_name),
            properties (property_name),
            rooms (room_number)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(docs || []);

      // B. Fetch Active Tenancies
      const { data: tenancies, error: tenError } = await supabase
        .from('tenancies')
        .select(`
          id, lodger_id, property_id, room_id,
          lodger_profiles (full_name),
          properties (property_name),
          rooms (room_number)
        `)
        .eq('tenancy_status', 'active');

      if (tenError) throw tenError;

      const formattedTenancies = tenancies?.map((t: any) => ({
        id: t.id,
        lodger_id: t.lodger_id,
        property_id: t.property_id,
        room_id: t.room_id,
        lodger_name: t.lodger_profiles?.full_name || 'Unknown',
        property_name: t.properties?.property_name || 'Unknown',
        room_number: t.rooms?.room_number || 'N/A'
      })) || [];

      setActiveTenancies(formattedTenancies);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  // --- 2. FILE HANDLING ---
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- 3. BULK UPLOAD HANDLER ---
  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !selectedTenancyId || !docType) {
      return toast.error("Please select a tenancy, document type, and at least one file.");
    }

    setUploading(true);
    try {
      const tenancy = activeTenancies.find(t => t.id === selectedTenancyId);
      if (!tenancy) throw new Error("Tenancy details not found");

      // Process all files concurrently
      const uploadPromises = selectedFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        // Unique Name: Type_Timestamp_Random.ext
        const uniqueName = `${docType.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${selectedTenancyId}/${uniqueName}`; 

        // A. Upload to Storage
        const { error: uploadError } = await supabase.storage
          .from('tenancy')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // B. Insert into DB
        const { error: dbError } = await supabase.from('documents').insert({
          tenancy_id: selectedTenancyId,
          lodger_id: tenancy.lodger_id,
          property_id: tenancy.property_id,
          room_id: tenancy.room_id,
          document_type: docType,
          file_name: file.name, // Keep original name for display
          file_path: filePath,
          file_size: file.size,
          expiry_date: expiryDate || null,
          document_status: 'valid',
          uploaded_by: user?.id
        });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);

      toast.success(`${selectedFiles.length} document(s) uploaded successfully`);
      setIsUploadOpen(false);
      resetForm();
      fetchDocuments();

    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedTenancyId("");
    setDocType("");
    setExpiryDate("");
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- 4. FILE ACTIONS ---
  const handleDownload = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('tenancy')
        .createSignedUrl(path, 60);

      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (error) {
      toast.error("Could not download file");
    }
  };

  const handleDelete = async (id: string, path: string) => {
    if(!confirm("Are you sure you want to delete this document?")) return;

    try {
      await supabase.storage.from('tenancy').remove([path]);
      await supabase.from('documents').delete().eq('id', id);

      toast.success("Document deleted");
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  // --- HELPERS ---
  const getDocStatus = (doc: DocumentRecord) => {
    if (!doc.expiry_date) return { label: "Valid", color: "default" };
    const expiry = parseISO(doc.expiry_date);
    const today = new Date();
    const warningDate = addDays(today, 30);

    if (isPast(expiry)) return { label: "Expired", color: "destructive" };
    if (isBefore(expiry, warningDate)) return { label: "Expiring Soon", color: "secondary" };
    return { label: "Valid", color: "default" };
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocs = documents.filter(doc => 
    doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tenancies?.lodger_profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const documentTypes = [
    "Tenancy Agreement", "ID Verification", "Reference Letter", 
    "Gas Safety Cert", "Right to Rent", "Inventory Report", "Other"
  ];

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Document Management</h2>
          <p className="text-muted-foreground">Manage tenancy agreements and compliance docs</p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button><Upload className="w-4 h-4 mr-2" /> Upload Documents</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              
              <div className="space-y-2">
                <Label>Assign to Tenancy</Label>
                <Select onValueChange={setSelectedTenancyId} value={selectedTenancyId}>
                  <SelectTrigger><SelectValue placeholder="Select Lodger / Property" /></SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {activeTenancies.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.lodger_name} — {t.property_name} (Rm {t.room_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Document Category</Label>
                <Select onValueChange={setDocType} value={docType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expiry Date (Optional - Applies to all)</Label>
                <div className="relative">
                    <Input 
                        type="date" 
                        value={expiryDate} 
                        onChange={(e) => setExpiryDate(e.target.value)} 
                        className="pl-10"
                    />
                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* MULTIPLE FILE INPUT */}
              <div className="space-y-2">
                <Label>Files</Label>
                <div className="flex items-center gap-2">
                    <Input 
                        type="file" 
                        ref={fileInputRef} 
                        multiple // ✅ Enable multiple selection
                        className="cursor-pointer" 
                        onChange={handleFileSelect}
                    />
                </div>
                
                {/* File Preview List */}
                {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-2 border rounded-md p-2 bg-muted/20">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Selected Files ({selectedFiles.length}):</p>
                        {selectedFiles.map((file, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs bg-background p-1.5 rounded border">
                                <span className="truncate max-w-[300px] flex items-center gap-2">
                                    <Paperclip className="w-3 h-3 text-muted-foreground"/> {file.name}
                                </span>
                                <button onClick={() => removeFile(idx)} className="text-red-500 hover:bg-red-100 p-1 rounded">
                                    <X className="w-3 h-3"/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Upload className="w-4 h-4 mr-2"/>}
                Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full"><FolderOpen className="w-5 h-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{documents.length}</p><p className="text-sm text-muted-foreground">Total Docs</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <div className="bg-destructive/10 p-3 rounded-full"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
            <div>
                <p className="text-2xl font-bold">
                    {documents.filter(d => getDocStatus(d).label !== 'Valid').length}
                </p>
                <p className="text-sm text-muted-foreground">Attention Needed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
            placeholder="Search by filename, lodger, or type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-md"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredDocs.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
                <p>No documents found.</p>
            </Card>
        ) : (
            filteredDocs.map((doc) => {
              const status = getDocStatus(doc);
              return (
                <Card key={doc.id} className="border-border hover:bg-muted/10 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1 bg-secondary/20 p-2 rounded">
                            <FileText className="w-6 h-6 text-secondary-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-base">{doc.document_type}</h4>
                            <Badge variant={status.color as any} className="h-5 text-[10px] px-1.5">
                                {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{doc.file_name}</p>
                          <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            <span className="font-medium text-foreground">
                                {doc.tenancies?.lodger_profiles?.full_name || "Unknown Lodger"}
                            </span>
                            <span>•</span>
                            <span>{doc.tenancies?.properties?.property_name}</span>
                            <span>•</span>
                            <span>{formatBytes(doc.file_size)}</span>
                            {doc.expiry_date && (
                                <span className={status.label !== 'Valid' ? "text-destructive font-medium" : ""}>
                                    • Expires: {format(parseISO(doc.expiry_date), 'PP')}
                                </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <Button size="sm" variant="outline" onClick={() => handleDownload(doc.file_path)}>
                          <Eye className="w-3 h-3 mr-2" /> View
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(doc.id, doc.file_path)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>
    </div>
  );
};

export default DocumentManagement;