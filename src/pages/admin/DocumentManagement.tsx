import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, FileText, AlertTriangle, CheckCircle, Download, Eye, Upload } from "lucide-react";

const DocumentManagement = () => {
  const documents = [
    {
      lodger: "Tom Brown",
      property: "789 High St",
      room: "Room 5",
      type: "Tenancy Agreement",
      filename: "tenancy-agreement-tom-brown.pdf",
      uploadedBy: "Admin",
      uploadedDate: "2024-11-01",
      expiryDate: "2025-11-01",
      status: "Valid",
      size: "2.4 MB"
    },
    {
      lodger: "Lisa Green",
      property: "123 Main St",
      room: "Room 2",
      type: "ID Verification",
      filename: "passport-lisa-green.pdf",
      uploadedBy: "Lisa Green",
      uploadedDate: "2024-10-15",
      expiryDate: "2027-03-15",
      status: "Valid",
      size: "1.8 MB"
    },
    {
      lodger: "Mark Johnson",
      property: "456 River Rd",
      room: "Room 3",
      type: "Compliance Certificate",
      filename: "gas-safety-cert-456-river-rd.pdf",
      uploadedBy: "Staff",
      uploadedDate: "2024-06-01",
      expiryDate: "2024-12-10",
      status: "Expiring Soon",
      size: "950 KB"
    },
    {
      lodger: "Sophie Chen",
      property: "321 Park Ave",
      room: "Room 1",
      type: "Reference Letter",
      filename: "reference-sophie-chen.pdf",
      uploadedBy: "Sophie Chen",
      uploadedDate: "2024-09-20",
      expiryDate: null,
      status: "Valid",
      size: "620 KB"
    },
  ];

  const documentTypes = [
    "Tenancy Agreement",
    "ID Verification",
    "Reference Letter",
    "Compliance Certificate",
    "Gas Safety Certificate",
    "Electrical Safety Certificate",
    "Inventory Report",
    "Insurance Documents",
    "Other"
  ];

  const expiringDocs = documents.filter(doc => doc.status === "Expiring Soon" || doc.status === "Expired");
  const validDocs = documents.filter(doc => doc.status === "Valid");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Document Management</h2>
        <p className="text-muted-foreground">Manage tenancy agreements, compliance docs, and ID verification</p>
      </div>

      {/* Document Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-3 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{validDocs.length}</p>
                <p className="text-sm text-muted-foreground">Valid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 p-3 rounded-full">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiringDocs.length}</p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-3 rounded-full">
                <FileText className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{documentTypes.length}</p>
                <p className="text-sm text-muted-foreground">Document Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Documents Alert */}
      {expiringDocs.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Documents Requiring Attention
            </CardTitle>
            <CardDescription>These documents are expiring soon or have expired</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringDocs.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{doc.type} - {doc.lodger}</p>
                    <p className="text-xs text-muted-foreground">Expires: {doc.expiryDate}</p>
                  </div>
                  <Button size="sm" variant="destructive">Request Renewal</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Documents */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Documents</CardTitle>
              <CardDescription>Browse and manage all stored documents</CardDescription>
            </div>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold">{doc.type}</h4>
                        <Badge variant={
                          doc.status === "Valid" ? "default" :
                          doc.status === "Expiring Soon" ? "secondary" :
                          "destructive"
                        }>
                          {doc.status === "Valid" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {doc.status === "Expiring Soon" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {doc.status}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground">Lodger:</span> {doc.lodger}</p>
                        <p><span className="font-medium text-foreground">Property:</span> {doc.property} - {doc.room}</p>
                        <p><span className="font-medium text-foreground">Filename:</span> {doc.filename}</p>
                        <p><span className="font-medium text-foreground">Size:</span> {doc.size}</p>
                        <p><span className="font-medium text-foreground">Uploaded:</span> {doc.uploadedDate} by {doc.uploadedBy}</p>
                        {doc.expiryDate && (
                          <p><span className="font-medium text-foreground">Expires:</span> {doc.expiryDate}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                      {doc.status === "Expiring Soon" && (
                        <Button size="sm" variant="destructive">Replace</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Types Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Accepted Document Types</CardTitle>
          <CardDescription>Standard document categories in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {documentTypes.map((type, index) => (
              <Badge key={index} variant="secondary">{type}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentManagement;
