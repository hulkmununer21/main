import { useState, useEffect } from "react";
import { 
  FileText, Download, Eye, Loader2, AlertCircle, Calendar 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { format, parseISO, isPast } from "date-fns";

interface LodgerDocumentsProps {
  tenancyId: string;
}

interface DocumentRecord {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  expiry_date: string | null;
  created_at: string;
  document_status: string;
}

const LodgerDocuments = ({ tenancyId }: LodgerDocumentsProps) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenancyId) return;

    const fetchDocs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('tenancy_id', tenancyId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast.error("Could not load documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [tenancyId]);

  const handleDownload = async (path: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('tenancy')
        .createSignedUrl(path, 60); // Link valid for 60 seconds

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      toast.error("Failed to access document");
    }
  };

  const getStatusColor = (doc: DocumentRecord) => {
    if (doc.document_status === 'expired' || (doc.expiry_date && isPast(parseISO(doc.expiry_date)))) {
      return "destructive";
    }
    return "secondary";
  };

  if (loading) return <div className="h-48 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Documents</h2>
      </div>

      {documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <div className="bg-muted p-4 rounded-full mb-3">
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p>No documents found for this tenancy.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-primary/10 p-2.5 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  {doc.expiry_date && (
                    <Badge variant={getStatusColor(doc) as any} className="text-[10px]">
                      {isPast(parseISO(doc.expiry_date)) ? "Expired" : "Active"}
                    </Badge>
                  )}
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold truncate" title={doc.document_type}>{doc.document_type}</h3>
                  <p className="text-xs text-muted-foreground truncate" title={doc.file_name}>{doc.file_name}</p>
                </div>

                <div className="flex flex-col gap-2 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Uploaded: {format(parseISO(doc.created_at), 'd MMM yyyy')}</span>
                  </div>
                  {doc.expiry_date && (
                    <div className="flex items-center gap-2 text-orange-600/80">
                      <AlertCircle className="h-3 w-3" />
                      <span>Expires: {format(parseISO(doc.expiry_date), 'd MMM yyyy')}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleDownload(doc.file_path, doc.file_name)}
                  >
                    <Eye className="h-3 w-3 mr-2" /> View
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleDownload(doc.file_path, doc.file_name)}
                  >
                    <Download className="h-3 w-3 mr-2" /> Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LodgerDocuments;