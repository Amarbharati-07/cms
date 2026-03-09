import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminAttendance } from "@/hooks/use-admin";
import { format } from "date-fns";
import { CalendarCheck, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminAttendance() {
  const { data: attendanceLogs, isLoading } = useAdminAttendance();

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-4xl font-bold font-display text-gradient mb-2">Attendance Logs</h1>
          <p className="text-muted-foreground">View field team check-ins and locations.</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl bg-card border border-white/5 animate-pulse" />)}
          </div>
        ) : (
          <Card className="glass-panel border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5">
              {attendanceLogs?.map((log: any) => (
                <div key={log.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-6 hover:bg-white/[0.02] transition-colors">
                  <div className="w-16 h-16 rounded-xl bg-muted border border-white/10 shrink-0 overflow-hidden relative">
                    {/* fallback icon if image fails */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-0">
                      <CalendarCheck className="w-6 h-6 text-muted-foreground" />
                    </div>
                    {log.photoUrl && (
                      <img src={log.photoUrl} alt="Check-in" className="w-full h-full object-cover relative z-10" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      Candidate #{log.candidateId}
                      <Badge variant="outline" className="text-xs font-normal border-primary/30 text-primary bg-primary/5">Verified</Badge>
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-y-2 gap-x-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-400" /> {format(new Date(log.timestamp), 'PPpp')}</span>
                      {(log.latitude && log.longitude) && (
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-green-400" /> {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {attendanceLogs?.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <CalendarCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No attendance records found.</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
