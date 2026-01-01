import { useState, useEffect, useRef } from "react";
import { 
  FolderOpen, FileText, AlertTriangle, CheckCircle, Download, Eye, Upload, 
  Trash2, Loader2, Calendar as CalendarIcon, Search 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  document_status: string; // 'valid', 'expired', 'expiring'
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. FETCH DATA ---
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      // A. Fetch Documents with Relations
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

      // B. Fetch Active Tenancies for Upload Dropdown
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

      // Flatten for easier usage
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
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // --- 2. UPLOAD HANDLER ---
  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !selectedTenancyId || !docType) {
      return toast.error("Please fill in all required fields and select a file.");
    }

    setUploading(true);
    try {
      // 1. Upload to Storage Bucket 'tenancy'
      const fileExt = file.name.split('.').pop();
      const fileName = `${docType.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.${fileExt}`;
      const filePath = `${selectedTenancyId}/${fileName}`; // Organized by Tenancy ID

      const { error: uploadError } = await supabase.storage
        .from('tenancy')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Resolve Foreign Keys based on selected Tenancy
      const tenancy = activeTenancies.find(t => t.id === selectedTenancyId);
      
      if (!tenancy) throw new Error("Tenancy details not found");

      // 3. Insert Record into DB
      const { error: dbError } = await supabase.from('documents').insert({
        tenancy_id: selectedTenancyId,
        lodger_id: tenancy.lodger_id,     // Explicit linking for easier queries later
        property_id: tenancy.property_id, // Explicit linking
        room_id: tenancy.room_id,         // Explicit linking
        document_type: docType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        expiry_date: expiryDate || null,
        document_status: 'valid',
        uploaded_by: user?.id
      });

      if (dbError) throw dbError;

      toast.success("Document uploaded successfully");
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

  // --- 3. FILE ACTIONS ---
  const handleDownload = async (path: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('tenancy')
        .createSignedUrl(path, 60); // Valid for 60 seconds

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      toast.error("Could not download file");
    }
  };

  const handleDelete = async (id: string, path: string) => {
    if(!confirm("Are you sure you want to delete this document?")) return;

    try {
      // Delete from Storage
      const { error: storageError } = await supabase.storage.from('tenancy').remove([path]);
      if (storageError) console.warn("Storage delete warning:", storageError);

      // Delete from DB
      const { error: dbError } = await supabase.from('documents').delete().eq('id', id);
      if (dbError) throw dbError;

      toast.success("Document deleted");
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const resetForm = () => {
    setSelectedTenancyId("");
    setDocType("");
    setExpiryDate("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- HELPER: Status Calculator ---
  const getDocStatus = (doc: DocumentRecord) => {
    if (!doc.expiry_date) return { label: "Valid", color: "default" };
    
    const expiry = parseISO(doc.expiry_date);
    const today = new Date();
    const warningDate = addDays(today, 30); // Warn if expires in 30 days

    if (isPast(expiry)) return { label: "Expired", color: "destructive" };
    if (isBefore(expiry, warningDate)) return { label: "Expiring Soon", color: "secondary" };
    return { label: "Valid", color: "default" };
  };

  // --- HELPER: Format Bytes ---
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filtering
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
            <Button><Upload className="w-4 h-4 mr-2" /> Upload Document</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              
              {/* 1. Select Tenancy */}
              <div className="space-y-2">
                <Label>Assign to Tenancy (Active)</Label>
                <Select onValueChange={setSelectedTenancyId} value={selectedTenancyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Lodger / Property" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {activeTenancies.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.lodger_name} — {t.property_name} (Room {t.room_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Document Type */}
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select onValueChange={setDocType} value={docType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Expiry Date */}
              <div className="space-y-2">
                <Label>Expiry Date (Optional)</Label>
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

              {/* 4. File Input */}
              <div className="space-y-2">
                <Label>File</Label>
                <Input type="file" ref={fileInputRef} className="cursor-pointer" />
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full"><FolderOpen className="w-5 h-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{documents.length}</p><p className="text-sm text-muted-foreground">Total Docs</p></div>
          </CardContent>
        </Card>
        {/* ... (Other stats logic remains similar, simplified for brevity) ... */}
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <div className="bg-destructive/10 p-3 rounded-full"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
            <div>
                <p className="text-2xl font-bold">
                    {documents.filter(d => getDocStatus(d).label !== 'Valid').length}
                </p>
                <p className="text-sm text-muted-foreground">Expiring/Expired</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
            placeholder="Search by filename, lodger, or type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-md"
        />
      </div>

      {/* Documents List */}
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
                      
                      {/* Icon & Main Info */}
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
                            <span>{doc.tenancies?.properties?.property_name} (Rm {doc.tenancies?.rooms?.room_number})</span>
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

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <Button size="sm" variant="outline" onClick={() => handleDownload(doc.file_path, doc.file_name)}>
                          <Eye className="w-3 h-3 mr-2" /> View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(doc.file_path, doc.file_name)}>
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(doc.id, doc.file_path)}>
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