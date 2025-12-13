import { useEffect, useState, useCallback } from "react";
import { Bell, LogOut, ClipboardList, Users, Camera, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth"; // Assuming context exists
import { supabase } from "@/lib/supabaseClient";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Badge } from "@/components/ui/badge";
import { format, isToday, parseISO } from "date-fns";

// === INTERFACES ===

interface DashboardMetrics {
  assignedTasks: number;
  managedLodgers: number;
  pendingInspections: number;
  todaysAppointments: number;
}

interface TaskItem {
  id: string;
  type: 'inspection' | 'task';
  title: string;
  property_name: string;
  time: string; // ISO string
  status: string;
}

interface UpdateItem {
  id: string;
  title: string;
  description: string;
  time: string; // ISO string
  type: 'maintenance' | 'tenancy';
}

// === COMPONENT ===

const StaffOverview = () => {
  const { logout, user } = useAuth();
  
  // --- STATE ---
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    assignedTasks: 0,
    managedLodgers: 0,
    pendingInspections: 0,
    todaysAppointments: 0
  });
  const [todaysTasks, setTodaysTasks] = useState<TaskItem[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffName, setStaffName] = useState(user?.name || "Staff");

  // --- DATA FETCHING ---

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // 1. Get Staff Profile ID (The 'Real' ID used in foreign keys)
      const { data: staffProfile, error: profileError } = await supabase
        .from('staff_profiles')
        .select('id, full_name')
        .eq('user_id', user.id)
        .single();

      if (profileError || !staffProfile) throw new Error("Staff profile not found");
      
      setStaffName(staffProfile.full_name);
      const staffId = staffProfile.id;

      // 2. Get Assigned Property IDs
      // This is crucial for RLS (Row Level Security) filtering
      const { data: assignments } = await supabase
        .from('staff_property_assignments')
        .select('property_id')
        .eq('staff_id', staffId);

      const assignedPropertyIds = assignments?.map(a => a.property_id) || [];

      // If no properties assigned, we can stop or show zeros
      if (assignedPropertyIds.length === 0) {
        setLoading(false);
        return; 
      }

      // 3. Fetch Metrics in Parallel
      const todayStr = new Date().toISOString().split('T')[0];

      const [
        tasksRes,
        inspectionsRes,
        tenanciesRes,
        todaysTasksRes,
        todaysInspRes,
        recentMaintRes
      ] = await Promise.all([
        // A. Total Assigned Tasks (Pending)
        supabase.from('service_user_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_to', staffId)
          .neq('status', 'completed'),

        // B. Total Pending Inspections
        supabase.from('inspections')
          .select('id', { count: 'exact', head: true })
          .eq('inspector_id', staffId)
          .neq('status', 'completed'),

        // C. Managed Lodgers (Active tenancies in assigned properties)
        supabase.from('tenancies')
          .select('id', { count: 'exact', head: true })
          .in('property_id', assignedPropertyIds)
          .eq('tenancy_status', 'active'),

        // D. Today's Tasks
        supabase.from('service_user_tasks')
          .select('id, title, due_date, status, properties(property_name)')
          .eq('assigned_to', staffId)
          .eq('due_date', todayStr),

        // E. Today's Inspections
        supabase.from('inspections')
          .select('id, inspection_type, scheduled_date, status, properties(property_name)')
          .eq('inspector_id', staffId)
          .eq('scheduled_date', todayStr),

        // F. Recent Maintenance Updates (Feed)
        supabase.from('maintenance_requests')
          .select('id, title, description, created_at, properties(property_name)')
          .in('property_id', assignedPropertyIds)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // 4. Process Metrics
      const totalTasks = tasksRes.count || 0;
      const totalInspections = inspectionsRes.count || 0;
      const totalLodgers = tenanciesRes.count || 0;
      const appointmentsCount = (todaysTasksRes.data?.length || 0) + (todaysInspRes.data?.length || 0);

      setMetrics({
        assignedTasks: totalTasks,
        managedLodgers: totalLodgers,
        pendingInspections: totalInspections,
        todaysAppointments: appointmentsCount
      });

      // 5. Process Today's List (Merge Tasks + Inspections)
      const mappedTasks: TaskItem[] = (todaysTasksRes.data || []).map((t: any) => ({
        id: t.id,
        type: 'task',
        title: t.title,
        property_name: t.properties?.property_name || 'Unknown Property',
        time: t.due_date, // Might assume 9 AM if time not stored
        status: t.status
      }));

      const mappedInspections: TaskItem[] = (todaysInspRes.data || []).map((i: any) => ({
        id: i.id,
        type: 'inspection',
        title: `${i.inspection_type} Inspection`,
        property_name: i.properties?.property_name || 'Unknown Property',
        time: i.scheduled_date,
        status: i.status
      }));

      setTodaysTasks([...mappedTasks, ...mappedInspections]);

      // 6. Process Updates Feed
      const updates: UpdateItem[] = (recentMaintRes.data || []).map((m: any) => ({
        id: m.id,
        title: m.properties?.property_name || "Maintenance",
        description: `New Request: ${m.title}`,
        time: m.created_at,
        type: 'maintenance'
      }));
      setRecentUpdates(updates);

    } catch (error) {
      console.error("Error fetching staff dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  // --- RENDERING ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Staff Portal - Domus Dwell Manage"
        description="Manage tasks, inspections, and lodger communications"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold">Staff Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {staffName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Assigned Tasks</p>
                    <p className="text-2xl font-bold">{metrics.assignedTasks}</p>
                  </div>
                  <div className="bg-blue-500/10 p-3 rounded-full">
                    <ClipboardList className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Managed Lodgers</p>
                    <p className="text-2xl font-bold">{metrics.managedLodgers}</p>
                  </div>
                  <div className="bg-green-500/10 p-3 rounded-full">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Inspections</p>
                    <p className="text-2xl font-bold">{metrics.pendingInspections}</p>
                  </div>
                  <div className="bg-purple-500/10 p-3 rounded-full">
                    <Camera className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Today's Appointments</p>
                    <p className="text-2xl font-bold">{metrics.todaysAppointments}</p>
                  </div>
                  <div className="bg-orange-500/10 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Today's Tasks & Inspections */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todaysTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No tasks scheduled for today</p>
                    </div>
                  ) : (
                    todaysTasks.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{item.title}</p>
                            {item.type === 'inspection' && <Badge variant="outline" className="text-[10px]">Insp</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.property_name}</p>
                        </div>
                        <Badge variant={item.status === "pending" ? "secondary" : "default"} className="capitalize">
                          {item.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Updates (Maintenance & Activity) */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUpdates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No recent activity</p>
                    </div>
                  ) : (
                    recentUpdates.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${item.type === 'maintenance' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(item.time), "MMM d, h:mm a")} ({formatDistanceToNow(parseISO(item.time))} ago)
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="h-20 md:h-0"></div>
        </div>
      </div>
      <BottomNav role="staff" />
    </>
  );
};

// Helper for date formatting distance
import { formatDistanceToNow } from 'date-fns';

export default StaffOverview;