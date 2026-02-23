import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Phone, Calendar, Search, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface LodgingRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  move_in_date: string;
  message: string;
  status: string;
  created_at: string;
  rooms?: { room_number: string };
  properties?: { property_name: string };
}

export default function LodgingRequests() {
  const [requests, setRequests] = useState<LodgingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog State
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<LodgingRequest | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lodging_requests')
        .select(`*, rooms(room_number), properties(property_name)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenView = (req: LodgingRequest) => {
    setSelectedReq(req);
    setStatusUpdate(req.status);
    setIsViewOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('lodging_requests')
        .update({ status: statusUpdate, updated_at: new Date().toISOString() })
        .eq('id', selectedReq.id);

      if (error) throw error;
      toast.success("Status updated successfully.");
      setIsViewOpen(false);
      fetchRequests(); // Refresh data
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <Badge variant="destructive">New / Pending</Badge>;
      case 'contacted': return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Contacted</Badge>;
      case 'approved': return <Badge className="bg-green-600 hover:bg-green-700">Approved</Badge>;
      case 'rejected': return <Badge variant="outline">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(r => 
    r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Lodging Inquiries</h1>
        <p className="text-muted-foreground">Manage requests submitted from the public property listings.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Recent Requests</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or email..." 
                className="pl-9" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Received</TableHead>
                  <TableHead>Applicant Name</TableHead>
                  <TableHead>Property / Room</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No requests found.</TableCell></TableRow>
                ) : (
                  filteredRequests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleOpenView(req)}>
                      <TableCell className="font-medium">{format(parseISO(req.created_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{req.full_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="block font-medium">{req.properties?.property_name || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">Room {req.rooms?.room_number || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                           <span className="flex items-center gap-1"><Mail className="h-3 w-3"/> {req.email}</span>
                           {req.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {req.phone}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost"><Eye className="h-4 w-4 mr-2"/> Review</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Review Inquiry</DialogTitle>
            <DialogDescription>Details submitted by the applicant.</DialogDescription>
          </DialogHeader>

          {selectedReq && (
            <div className="space-y-6 py-4">
               <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Applicant Name</p>
                    <p className="font-semibold">{selectedReq.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Property Requested</p>
                    <p className="font-semibold">{selectedReq.properties?.property_name} (Room {selectedReq.rooms?.room_number})</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact Info</p>
                    <p className="text-sm">{selectedReq.email}</p>
                    <p className="text-sm">{selectedReq.phone || 'No phone provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Desired Move-In</p>
                    <p className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3"/> 
                      {selectedReq.move_in_date ? format(parseISO(selectedReq.move_in_date), 'dd MMM yyyy') : 'Not specified'}
                    </p>
                  </div>
               </div>

               <div>
                 <p className="text-sm font-semibold mb-2">Message from Applicant:</p>
                 <div className="bg-card border rounded-md p-4 text-sm whitespace-pre-wrap leading-relaxed">
                   {selectedReq.message || <span className="italic text-muted-foreground">No message provided.</span>}
                 </div>
               </div>

               <div className="border-t pt-4">
                 <p className="text-sm font-semibold mb-3">Follow-up Action</p>
                 <div className="flex items-center gap-3">
                    <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                      <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">New / Pending</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleUpdateStatus} disabled={submitting || statusUpdate === selectedReq.status}>
                      {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : null} Update Status
                    </Button>
                 </div>
               </div>
            </div>
          )}
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}