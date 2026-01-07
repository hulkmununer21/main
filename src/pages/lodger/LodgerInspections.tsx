import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Clock, MapPin, UserCheck, CheckCircle, FileText, ChevronRight, AlertTriangle, Loader2, ListChecks, X } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

// === PROPS ===
interface LodgerInspectionsProps {
  tenancy: {
    property_id: string;
    room_id: string;
    rooms?: { room_number: string };
  };
}

const LodgerInspections = ({ tenancy }: LodgerInspectionsProps) => {
  const [loading, setLoading] = useState(true);
  
  const [upcomingInspections, setUpcomingInspections] = useState<any[]>([]); 
  const [history, setHistory] = useState<any[]>([]);
  
  const [inspectorNames, setInspectorNames] = useState<Record<string, string>>({});
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    const fetchInspections = async () => {
      if (!tenancy?.property_id || !tenancy?.room_id) return;
      setLoading(true);

      try {
        // 1. Fetch Inspections
        const { data: rawInspections, error } = await supabase
          .from('inspections')
          .select('*')
          .eq('property_id', tenancy.property_id)
          .order('scheduled_date', { ascending: false });

        if (error) throw error;

        // 2. Filter Scope - MODIFIED TO SHOW ONLY ROOM SCOPE
        const relevantInspections = (rawInspections || []).filter((insp: any) => {
            // Strictly check if the inspection belongs to this specific room ID
            return insp.room_id === tenancy.room_id;
        });

        // 3. Resolve Inspector Names
        const staffIds = relevantInspections.filter((i: any) => i.inspector_type === 'staff').map((i: any) => i.inspector_id);
        const serviceUserIds = relevantInspections.filter((i: any) => i.inspector_type === 'service_user').map((i: any) => i.inspector_id);
        const namesMap: Record<string, string> = {};

        if (staffIds.length > 0) {
            const { data: staff } = await supabase.from('staff_profiles').select('id, full_name').in('id', staffIds);
            staff?.forEach((s: any) => namesMap[s.id] = `${s.full_name} (Staff)`);
        }
        if (serviceUserIds.length > 0) {
            const { data: users } = await supabase.from('service_user_profiles').select('id, full_name, company_name').in('id', serviceUserIds);
            users?.forEach((u: any) => namesMap[u.id] = `${u.full_name} (${u.company_name || 'Contractor'})`);
        }
        setInspectorNames(namesMap);

        // 4. SORT & SPLIT
        const upcoming = relevantInspections
            .filter((i: any) => i.inspection_status === 'scheduled' || i.inspection_status === 'pending')
            .sort((a: any, b: any) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

        const past = relevantInspections
            .filter((i: any) => i.inspection_status !== 'scheduled' && i.inspection_status !== 'pending')
            .sort((a: any, b: any) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

        setUpcomingInspections(upcoming);
        setHistory(past);

      } catch (err) {
        console.error("Error loading inspections:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
  }, [tenancy]);

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;

  return (
    <div className="space-y-8 max-w-[1600px]">
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Room Inspections</h2>
        <p className="text-muted-foreground">Monitor inspections specific to your private room.</p>
      </div>

      {/* 1. UPCOMING INSPECTIONS SECTION */}
      <div className="space-y-4">
        {upcomingInspections.length > 0 ? (
            <div className="space-y-4">
                {upcomingInspections.map((inspection) => (
                    <Card key={inspection.id} className="border-l-4 border-l-blue-500 shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                                
                                {/* Left: Date & Status Banner */}
                                <div className="bg-blue-50 p-6 flex flex-col justify-center items-center md:w-48 text-center shrink-0 border-r border-blue-100">
                                    <Badge className="bg-blue-600 text-white hover:bg-blue-700 mb-2">Scheduled</Badge>
                                    <div className="text-3xl font-bold text-blue-900 mb-1">
                                        {format(parseISO(inspection.scheduled_date), "d")}
                                    </div>
                                    <div className="text-sm font-medium text-blue-700 uppercase">
                                        {format(parseISO(inspection.scheduled_date), "MMM yyyy")}
                                    </div>
                                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-800 bg-blue-100 px-2 py-1 rounded-full">
                                        <Clock className="w-3 h-3" />
                                        {format(parseISO(inspection.scheduled_date), "h:mm a")}
                                    </div>
                                </div>

                                {/* Right: Details */}
                                <div className="p-6 flex-1 flex flex-col justify-center">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 capitalize flex items-center gap-2">
                                                {inspection.inspection_type?.replace('_', ' ')}
                                                <Badge variant="outline" className="text-xs font-normal border-purple-200 text-purple-700 bg-purple-50">Room Check</Badge>
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                This inspection is for your private room.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                        <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                                            <UserCheck className="h-5 w-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase">Inspector</p>
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {inspectorNames[inspection.inspector_id] || "Assigned Inspector"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                                            <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase">Scope</p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    Private Room
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {isPast(parseISO(inspection.scheduled_date)) && (
                                        <div className="mt-4 p-2 bg-orange-50 text-orange-800 text-xs rounded border border-orange-100 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            This inspection date has passed. Please wait for the inspector to submit the report.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            <Card className="bg-muted/10 border-dashed">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg">No Room Inspections Scheduled</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mt-1">
                        You are all caught up! We will notify you when the next room check is arranged.
                    </p>
                </CardContent>
            </Card>
        )}
      </div>

      {/* 2. HISTORY TABLE */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">Room Inspection History</h3>
        <Card>
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm text-left">
                <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Scope</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Type</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Result</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Report</th>
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {history.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No room inspection history.</td></tr>
                    ) : (
                        history.map((item) => (
                        <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle font-medium">
                            {format(parseISO(item.scheduled_date), "MMM d, yyyy")}
                            </td>
                            <td className="p-4 align-middle">
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Room</Badge>
                            </td>
                            <td className="p-4 align-middle capitalize">{item.inspection_type?.replace('_', ' ')}</td>
                            <td className="p-4 align-middle">
                            <Badge 
                                variant={item.inspection_status === 'passed' ? 'default' : 'destructive'} 
                                className={item.inspection_status === 'passed' ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : ""}
                            >
                                {item.inspection_status === 'passed' ? (
                                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Passed</span>
                                ) : (
                                <span className="flex items-center gap-1 capitalize"><AlertTriangle className="w-3 h-3" /> {item.inspection_status?.replace('_', ' ')}</span>
                                )}
                            </Badge>
                            </td>
                            <td className="p-4 align-middle text-right">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => { setSelectedReport(item); setIsReportOpen(true); }}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            </td>
                        </tr>
                        ))
                    )}
                </tbody>
                </table>
            </div>
        </Card>
      </div>

      {/* REPORT VIEW MODAL */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Room Inspection Report
                </DialogTitle>
                <DialogDescription>
                    Completed on {selectedReport && format(parseISO(selectedReport.scheduled_date), 'PPP')}
                </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
                {/* Issues Banner */}
                {selectedReport?.issues_found && selectedReport.issues_found.length > 0 ? (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4"/> Attention Needed
                        </h4>
                        <div className="space-y-1">
                            {selectedReport.issues_found.map((issue: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 text-sm text-red-700">
                                    <X className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span>{issue}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                            <h4 className="font-semibold text-green-800">Passed Successfully</h4>
                            <p className="text-sm text-green-700">No issues were flagged during this inspection.</p>
                        </div>
                    </div>
                )}

                {/* Checklist */}
                {selectedReport?.checklist && (
                    <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2"><ListChecks className="h-4 w-4"/> Checklist</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {selectedReport.checklist.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center p-2 border rounded bg-gray-50/50">
                                    <span className="text-sm">{item.item}</span>
                                    <Badge variant={item.status === 'pass' ? 'default' : 'destructive'} className="h-5 text-[10px]">
                                        {item.status.toUpperCase()}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Photos */}
                {selectedReport?.photos && selectedReport.photos.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-semibold">Attached Evidence</h4>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {selectedReport.photos.map((url: string, i: number) => (
                                <a key={i} href={url} target="_blank" rel="noreferrer" className="block h-24 w-32 shrink-0">
                                    <img src={url} className="h-full w-full object-cover rounded border hover:opacity-90" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => setIsReportOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LodgerInspections;