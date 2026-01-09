import { useState, useEffect } from "react";
import { 
  LayoutDashboard, Building2, Trash2, Camera, 
  AlertTriangle, Users, MessageSquare, User, Bell, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/lib/supabaseClient"; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { Badge } from "@/components/ui/badge"; 
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

// Components
import StaffDashboard from "./staff/StaffDashboard";
import StaffProperties from "./staff/StaffProperties";
import StaffBinDuties from "./staff/StaffBinDuties";
import StaffInspections from "./staff/StaffInspections";
import StaffComplaints from "./staff/StaffComplaints";
import StaffServiceUsers from "./staff/StaffServiceUsers";
import StaffMessages from "./staff/StaffMessages";
import StaffProfile from "./staff/StaffProfile";

interface AppNotification { 
  id: string; 
  recipient_id: string; 
  subject: string; 
  message_body: string; 
  is_read: boolean; 
  created_at: string; 
}

const StaffPortal = () => {
  const { logout, user } = useAuth();
  const [currentTab, setCurrentTab] = useState("dashboard");
  
  // Notification States
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // ✅ NEW: Unread Message State
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // --- 1. FETCH NOTIFICATIONS (Existing) ---
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        setNotifications(data);
        setUnreadNotifCount(data.filter(n => !n.is_read).length);
      }
    };

    fetchNotifications();

    const notifSub = supabase
      .channel('staff_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` }, (payload) => {
        setNotifications(prev => [payload.new as AppNotification, ...prev]);
        setUnreadNotifCount(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(notifSub); };
  }, [user]);

  // --- 2. ✅ NEW: FETCH UNREAD MESSAGES ---
  useEffect(() => {
    if (!user) return;

    const fetchUnreadMessages = async () => {
      // 1. Get all threads where the user is a participant
      const { data: threads } = await supabase
        .from('message_threads')
        .select('id')
        .contains('participants', [user.id]);

      const threadIds = threads?.map(t => t.id) || [];

      if (threadIds.length > 0) {
        // 2. Count unread messages in those threads NOT sent by the current user
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('thread_id', threadIds)
          .neq('sender_id', user.id) // Only incoming messages
          .eq('is_read', false);     // Only unread

        setUnreadMsgCount(count || 0);
      }
    };

    fetchUnreadMessages();

    // ✅ Realtime Listener for New Messages
    const messageSub = supabase
      .channel('global_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new;
        // Check if the message is NOT from me (simple check, for robust check we'd verify thread participation)
        if (newMessage.sender_id !== user.id) {
           // Increment count locally for instant feedback (or re-fetch to be safe)
           setUnreadMsgCount(prev => prev + 1);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
         // If a message is marked read, re-fetch to be accurate
         if (payload.new.is_read === true) {
            fetchUnreadMessages();
         }
      })
      .subscribe();

    return () => { supabase.removeChannel(messageSub); };
  }, [user]);


  // --- HANDLERS ---
  const handleMarkAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadNotifCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', user?.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadNotifCount(0);
  };

  // ✅ Reset message count when opening Messages tab
  useEffect(() => {
    if (currentTab === 'messages') {
        // Optional: You might want to keep the badge until they actually click a specific thread, 
        // but often clearing it on tab open is acceptable UI behavior. 
        // Realistically, the StaffMessages component will mark them read as they open threads.
        // So we rely on the realtime 'UPDATE' listener above to decrease the count naturally.
    }
  }, [currentTab]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "properties", label: "Properties Assigned", icon: Building2 },
    { id: "bin-duties", label: "Bin Duties", icon: Trash2 },
    { id: "inspections", label: "Inspections", icon: Camera },
    { id: "complaints", label: "Complaints", icon: AlertTriangle },
    { id: "service-users", label: "Service Users Tasks", icon: Users },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: unreadMsgCount }, // ✅ Passed count here
    { id: "profile", label: "Profile Settings", icon: User },
  ];

  const renderContent = () => {
    switch (currentTab) {
      case "dashboard": return <StaffDashboard />;
      case "properties": return <StaffProperties />;
      case "bin-duties": return <StaffBinDuties />;
      case "inspections": return <StaffInspections />;
      case "complaints": return <StaffComplaints />;
      case "service-users": return <StaffServiceUsers />;
      case "messages": return <StaffMessages />;
      case "profile": return <StaffProfile />;
      default: return <StaffDashboard />;
    }
  };

  return (
    <>
      <SEO title="Staff Portal" description="Staff portal for managing operational tasks." />
      <div className="min-h-screen bg-muted/30 flex w-full">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r-2 border-border flex-shrink-0 h-screen sticky top-0 flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-border">
            <img src={logo} alt="Domus Servitia" className="h-10 rounded-lg" />
            <p className="text-xs text-muted-foreground mt-2">Staff Portal</p>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left relative", // ✅ Added relative
                      currentTab === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                    
                    {/* ✅ BADGE INDICATOR FOR MESSAGES */}
                    {item.id === 'messages' && item.badge > 0 && (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
                            {item.badge > 9 ? '9+' : item.badge}
                        </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-border space-y-2 flex-shrink-0">
            {/* Notification Popover */}
            <Popover open={isNotifOpen} onOpenChange={setIsNotifOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start relative" size="lg">
                        <Bell className="w-5 h-5 mr-3" />
                        Notifications
                        {unreadNotifCount > 0 && (
                            <Badge variant="destructive" className="ml-auto px-2 py-0.5 h-5 rounded-full text-[10px]">
                                {unreadNotifCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 ml-4" align="start" side="right">
                    <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                        <h4 className="font-semibold text-sm">Notifications</h4>
                        {unreadNotifCount > 0 && <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">Mark all read</button>}
                    </div>
                    <ScrollArea className="h-[300px]">
                        {notifications.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No new notifications.</p> : 
                            <div className="flex flex-col">
                                {notifications.map(n => (
                                    <div key={n.id} className={cn("p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer text-left", !n.is_read && "bg-blue-50/50")} onClick={() => handleMarkAsRead(n.id)}>
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <p className={cn("text-sm", !n.is_read ? "font-semibold" : "font-medium")}>{n.subject}</p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{format(parseISO(n.created_at), 'MMM d')}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message_body}</p>
                                    </div>
                                ))}
                            </div>
                        }
                    </ScrollArea>
                </PopoverContent>
            </Popover>

            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" size="lg" onClick={logout}>
              <LogOut className="w-5 h-5 mr-3" /> Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="container mx-auto px-8 py-8">
            <div className="mb-8">
              <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
                {navItems.find(item => item.id === currentTab)?.label || "Dashboard"}
              </h1>
              <p className="text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
            {renderContent()}
          </div>
        </main>
      </div>
    </>
  );
};

export default StaffPortal;