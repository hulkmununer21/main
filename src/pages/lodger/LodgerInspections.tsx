import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, UserCheck, CheckCircle, FileText, ChevronRight, AlertTriangle, Loader2, DoorOpen, ListChecks, X } from "lucide-react";
import { format, parseISO, isAfter } from "date-fns";

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
  const [nextInspection, setNextInspection] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  // Cache for inspector names so we don't need joins
  const [inspectorNames, setInspectorNames] = useState<Record<string, string>>({});

  // View Report State
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    const fetchInspections = async () => {
      if (!tenancy?.property_id) return;
      setLoading(true);

      try {
        // 1. Fetch Inspections (No Joins to avoid FK Error)
        const { data: rawInspections, error } = await supabase
          .from('inspections')
          .select('*') // Just select raw columns
          .eq('property_id', tenancy.property_id)
          .order('scheduled_date', { ascending: false });

        if (error) throw error;

        // 2. Filter Logic (Property Wide OR My Room)
        const relevantInspections = (rawInspections || []).filter((insp: any) => {
            const isPropertyWide = insp.room_id === null;
            const isMyRoom = insp.room_id === tenancy.room_id;
            return isPropertyWide || isMyRoom;
        });

        // 3. Resolve Inspector Names Manually
        // Collect all inspector IDs
        const staffIds = relevantInspections
            .filter((i: any) => i.inspector_type === 'staff' && i.inspector_id)
            .map((i: any) => i.inspector_id);
            
        const serviceUserIds = relevantInspections
            .filter((i: any) => i.inspector_type === 'service_user' && i.inspector_id)
            .map((i: any) => i.inspector_id);

        const namesMap: Record<string, string> = {};

        // Fetch Staff Names
        if (staffIds.length > 0) {
            const { data: staff } = await supabase.from('staff_profiles').select('id, full_name').in('id', staffIds);
            staff?.forEach((s: any) => namesMap[s.id] = `${s.full_name} (Staff)`);
        }

        // Fetch Service User Names
        if (serviceUserIds.length > 0) {
            const { data: users } = await supabase.from('service_user_profiles').select('id, full_name, company_name').in('id', serviceUserIds);
            users?.forEach((u: any) => namesMap[u.id] = `${u.full_name} (${u.company_name || 'Contractor'})`);
        }
        
        setInspectorNames(namesMap);

        // 4. Sort and Split
        const now = new Date();
        const upcoming = relevantInspections
            .filter((i: any) => isAfter(parseISO(i.scheduled_date), now) && i.inspection_status === 'scheduled')
            .sort((a: any, b: any) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())[0];

        const past = relevantInspections.filter((i: any) => i.id !== upcoming?.id);

        setNextInspection(upcoming || null);
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
    <div className="space-y-6 max-w-[1600px]">
      
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inspections</h2>
        <p className="text-muted-foreground">Monitor property checks and compliance reports.</p>
      </div>

      {/* 1. NEXT INSPECTION CARD */}
      {nextInspection ? (
        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-blue-50/10">
            <CardHeader>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Calendar className="h-5 w-5" />
                    Upcoming Inspection
                </CardTitle>
                <CardDescription>
                    {nextInspection.room_id 
                        ? "The inspector requires access to your private room." 
                        : "Inspector will check common areas (Kitchen, Hallways)."}
                </CardDescription>
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1">
                    {nextInspection.room_id ? "Room Inspection" : "Property Inspection"}
                </Badge>
            </div>
            </CardHeader>
            <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
                
                <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <div className="h-10 w-10 rounded-full bg-blue-50 border-blue-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date & Time</p>
                    <p className="font-bold text-gray-900">
                        {format(parseISO(nextInspection.scheduled_date), "EEE, d MMM yyyy")}
                    </p>
                    <p className="text-sm text-gray-600">{format(parseISO(nextInspection.scheduled_date), "h:mm a")}</p>
                    </div>
                </div>
                </div>

                <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <div className="h-10 w-10 rounded-full bg-purple-50 border-purple-100 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Inspector</p>
                    <p className="font-bold text-gray-900 truncate max-w-[150px]">
                        {inspectorNames[nextInspection.inspector_id] || "Assigned Inspector"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{nextInspection.inspection_type.replace('_', ' ')}</p>
                    </div>
                </div>
                </div>

                <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-2">
                    <MapPin className="h-3 w-3" /> Location Scope:
                </p>
                <div className="flex flex-wrap gap-2">
                    {nextInspection.room_id ? (
                        <Badge variant="outline" className="bg-white gap-1 py-1"><DoorOpen className="w-3 h-3"/> My Room</Badge>
                    ) : (
                        <>
                            <Badge variant="outline" className="bg-white">Kitchen</Badge>
                            <Badge variant="outline" className="bg-white">Hallways</Badge>
                            <Badge variant="outline" className="bg-white">Shared Bath</Badge>
                        </>
                    )}
                </div>
                </div>

            </div>
            </CardContent>
        </Card>
      ) : (
        <Card className="bg-muted/10 border-dashed">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg">No Inspections Scheduled</h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-1">
                    You are all caught up! We will notify you when the next property check is arranged.
                </p>
            </CardContent>
        </Card>
      )}

      {/* 2. HISTORY TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection History</CardTitle>
          <CardDescription>Past reports and outcomes for this property.</CardDescription>
        </CardHeader>
        <CardContent>
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
                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No history available.</td></tr>
                ) : (
                    history.map((item) => (
                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">
                        {format(parseISO(item.scheduled_date), "MMM d, yyyy")}
                        </td>
                        <td className="p-4 align-middle">
                            {item.room_id ? (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Room</Badge>
                            ) : (
                                <Badge variant="outline" className="text-xs">Property</Badge>
                            )}
                        </td>
                        <td className="p-4 align-middle capitalize">{item.inspection_type.replace('_', ' ')}</td>
                        <td className="p-4 align-middle">
                        <Badge 
                            variant={item.inspection_status === 'passed' ? 'default' : 'destructive'} 
                            className={item.inspection_status === 'passed' ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : ""}
                        >
                            {item.inspection_status === 'passed' ? (
                            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Passed</span>
                            ) : (
                            <span className="flex items-center gap-1 capitalize"><AlertTriangle className="w-3 h-3" /> {item.inspection_status.replace('_', ' ')}</span>
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
        </CardContent>
      </Card>

      {/* REPORT VIEW MODAL (Read Only) */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Inspection Report
                </DialogTitle>
                <DialogDescription>
                    Completed on {selectedReport && format(parseISO(selectedReport.scheduled_date), 'PPP')}
                </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
                {/* 1. Issues Banner */}
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

                {/* 2. Checklist (Read Only) */}
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

                {/* 3. Photos */}
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