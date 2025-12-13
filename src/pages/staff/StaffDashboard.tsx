import { useEffect, useState, useCallback } from "react";
import { Building2, Trash2, Camera, AlertTriangle, Sparkles, ClipboardList, CheckCircle, Clock, Upload, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/useAuth";
import { format, isToday, parseISO } from "date-fns";

// === INTERFACES ===

interface TaskItem {
  id: string;
  type: 'bin' | 'inspection' | 'cleaning' | 'complaint' | 'service';
  title: string;
  time: string; // Display time
  raw_date: string; // For sorting
  status: string;
  property: string;
}

interface DashboardStats {
  properties: number;
  binDuties: number;
  inspections: number;
  complaints: number;
  verifications: number;
}

interface BinDuty {
  id: string;
  type: 'In-House' | 'Council';
  detail: string;
  property: string;
  status: 'due' | 'completed';
}

// === COMPONENT ===

const StaffDashboard = () => {
  const { user } = useAuth();
  
  // --- STATE ---
  const [stats, setStats] = useState<DashboardStats>({
    properties: 0,
    binDuties: 0,
    inspections: 0,
    complaints: 0,
    verifications: 0
  });
  
  const [todaysTasks, setTodaysTasks] = useState<TaskItem[]>([]);
  const [todaysBinDuties, setTodaysBinDuties] = useState<BinDuty[]>([]);
  const [upcomingInspections, setUpcomingInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- DATA FETCHING ---

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // 1. Resolve Staff ID
      const { data: staffProfile } = await supabase
        .from('staff_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!staffProfile) throw new Error("Staff profile not found");
      const staffId = staffProfile.id;

      // 2. Get Assigned Properties
      const { data: assignments } = await supabase
        .from('staff_property_assignments')
        .select('property_id')
        .eq('staff_id', staffId);

      const propIds = assignments?.map(a => a.property_id) || [];

      if (propIds.length === 0) {
        setLoading(false);
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];

      // 3. Parallel Fetches
      const [
        inspectionsRes,
        maintenanceRes,
        serviceTasksRes,
        binSchedulesRes,
        rotationsRes
      ] = await Promise.all([
        // Inspections (Today & Upcoming)
        supabase.from('inspections')
          .select('id, inspection_type, scheduled_date, status, properties(property_name)')
          .eq('inspector_id', staffId)
          .in('property_id', propIds)
          .gte('scheduled_date', todayStr), // Today onwards

        // Maintenance (Complaints)
        supabase.from('maintenance_requests')
          .select('id, title, status, created_at, properties(property_name)')
          .in('property_id', propIds)
          .neq('status', 'completed'),

        // Service Tasks (Cleaning/Verifications)
        supabase.from('service_user_tasks')
          .select('id, title, task_type, due_date, status, properties(property_name)')
          .eq('assigned_to', staffId)
          .in('property_id', propIds),

        // Council Bin Schedules (Today)
        supabase.from('bin_schedules')
          .select('id, bin_type, next_collection_date, properties(property_name)')
          .in('property_id', propIds)
          .eq('next_collection_date', todayStr),

        // In-House Rotations (Today)
        supabase.from('in_house_rotation_state')
          .select('id, next_rotation_date, properties(property_name), rooms(room_number)')
          .in('property_id', propIds)
          .eq('next_rotation_date', todayStr)
      ]);

      // --- PROCESS METRICS ---
      
      const inspectionsToday = inspectionsRes.data?.filter(i => i.scheduled_date === todayStr) || [];
      const pendingVerifications = serviceTasksRes.data?.filter(t => t.status === 'pending_verification') || [];
      
      setStats({
        properties: propIds.length,
        binDuties: (binSchedulesRes.data?.length || 0) + (rotationsRes.data?.length || 0),
        inspections: inspectionsToday.length,
        complaints: maintenanceRes.data?.length || 0,
        verifications: pendingVerifications.length
      });

      // --- PROCESS TASKS LIST (Aggregate) ---
      
      const tasks: TaskItem[] = [];

      // 1. Inspections Today
      inspectionsToday.forEach((i: any) => {
        tasks.push({
          id: i.id,
          type: 'inspection',
          title: `${i.inspection_type} Inspection`,
          property: i.properties?.property_name,
          time: "Scheduled Today", // Or format(parseISO(i.scheduled_time), 'h:mm a') if time exists
          raw_date: i.scheduled_date,
          status: i.status
        });
      });

      // 2. Service Tasks Today
      serviceTasksRes.data?.filter(t => t.due_date === todayStr).forEach((t: any) => {
        tasks.push({
          id: t.id,
          type: t.task_type === 'cleaning' ? 'cleaning' : 'service',
          title: t.title,
          property: t.properties?.property_name,
          time: "Due Today",
          raw_date: t.due_date,
          status: t.status
        });
      });

      // 3. Maintenance (Complaints) - Show recent
      maintenanceRes.data?.slice(0, 3).forEach((m: any) => {
        tasks.push({
          id: m.id,
          type: 'complaint',
          title: `Complaint: ${m.title}`,
          property: m.properties?.property_name,
          time: format(parseISO(m.created_at), 'MMM d'),
          raw_date: m.created_at,
          status: m.status
        });
      });

      setTodaysTasks(tasks);

      // --- PROCESS SIDEBAR LISTS ---

      // Bin Duties
      const bins: BinDuty[] = [];
      binSchedulesRes.data?.forEach((b: any) => {
        bins.push({
          id: b.id,
          type: 'Council',
          detail: `${b.bin_type} Waste`,
          property: b.properties?.property_name,
          status: 'due'
        });
      });
      rotationsRes.data?.forEach((r: any) => {
        bins.push({
          id: r.id,
          type: 'In-House',
          detail: `Rotate to Room ${r.rooms?.room_number}`,
          property: r.properties?.property_name,
          status: 'due'
        });
      });
      setTodaysBinDuties(bins);

      // Upcoming Inspections (Next 7 days, excluding today)
      const upcoming = inspectionsRes.data?.filter(i => i.scheduled_date > todayStr).slice(0, 3).map((i: any) => ({
        id: i.id,
        title: i.inspection_type,
        property: i.properties?.property_name,
        date: i.scheduled_date
      })) || [];
      setUpcomingInspections(upcoming);

    } catch (error) {
      console.error("Error fetching staff dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // --- HELPERS ---

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      case "in_progress": return <Badge className="bg-blue-500">In Progress</Badge>;
      case "completed": return <Badge className="bg-green-500">Completed</Badge>;
      case "requires_evidence": return <Badge variant="destructive">Evidence Req</Badge>;
      case "pending_verification": return <Badge className="bg-orange-500">Verify</Badge>;
      default: return <Badge variant="secondary">{status.replace('_', ' ')}</Badge>;
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "bin": return <Trash2 className="w-4 h-4" />;
      case "inspection": return <Camera className="w-4 h-4" />;
      case "cleaning": return <Sparkles className="w-4 h-4" />;
      case "complaint": return <AlertTriangle className="w-4 h-4" />;
      default: return <ClipboardList className="w-4 h-4" />;
    }
  };

  // --- RENDERING ---

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Properties Assigned</p>
                <p className="text-2xl font-bold">{stats.properties}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bin Duties Today</p>
                <p className="text-2xl font-bold">{stats.binDuties}</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-full">
                <Trash2 className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Inspections Due</p>
                <p className="text-2xl font-bold">{stats.inspections}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <Camera className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Open Complaints</p>
                <p className="text-2xl font-bold">{stats.complaints}</p>
              </div>
              <div className="bg-destructive/10 p-3 rounded-full">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Verifications</p>
                <p className="text-2xl font-bold">{stats.verifications}</p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-full">
                <Sparkles className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Tasks & Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysTasks.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No tasks scheduled for today</div>
              ) : (
                todaysTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-muted p-2 rounded-full">
                        {getTaskIcon(task.type)}
                      </div>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">{task.property}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {task.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(task.status)}
                      <div className="flex gap-2">
                        {task.status !== "completed" && (
                          <Button size="sm">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Action
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Upcoming */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bin Duties Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaysBinDuties.length === 0 ? <p className="text-sm text-muted-foreground">No bins due today.</p> : 
                 todaysBinDuties.map((bin) => (
                  <div key={bin.id} className="p-3 border rounded-lg">
                    <p className="font-medium text-sm">{bin.type}</p>
                    <p className="text-xs text-muted-foreground">{bin.detail}</p>
                    <p className="text-xs text-muted-foreground">{bin.property}</p>
                    <Badge variant="secondary" className="mt-2">Due Today</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingInspections.length === 0 ? <p className="text-sm text-muted-foreground">No upcoming inspections.</p> :
                 upcomingInspections.map((insp) => (
                  <div key={insp.id} className="p-3 border rounded-lg">
                    <p className="font-medium text-sm">{insp.property}</p>
                    <p className="text-xs text-muted-foreground">{insp.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(insp.date), 'EEE, MMM d')}
                    </p>
                    <Badge variant="outline" className="mt-2">Upcoming</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;