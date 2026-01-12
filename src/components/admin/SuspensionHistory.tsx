import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { format, parseISO } from "date-fns";
import { History, User } from "lucide-react";

interface SuspensionHistoryProps {
  userId: string;
}

export const SuspensionHistory = ({ userId }: SuspensionHistoryProps) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [userId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('account_suspension_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading suspension logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" />
            Suspension History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4" />
          Suspension History ({logs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
              <Badge 
                variant={log.action === 'suspended' ? 'destructive' : 'default'}
                className="mt-0.5"
              >
                {log.action}
              </Badge>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">
                    {log.performed_by_name || 'Admin'}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(log.created_at), 'PPP p')}
                  </span>
                </div>
                {log.reason && (
                  <p className="text-sm text-muted-foreground italic pl-5">
                    "{log.reason}"
                  </p>
                )}
                {log.notes && (
                  <p className="text-xs text-muted-foreground pl-5">
                    Note: {log.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
