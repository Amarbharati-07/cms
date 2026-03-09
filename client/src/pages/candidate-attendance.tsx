import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCandidateAttendance, useCandidateMarkAttendance } from "@/hooks/use-candidate";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Loader2, MapPin, Camera, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function CandidateAttendance() {
  const { data: logs, isLoading: loadingLogs } = useCandidateAttendance();
  const { mutateAsync: markAttendance, isPending } = useCandidateMarkAttendance();
  const { latitude, longitude, error: geoError, loading: geoLoading, retry } = useGeolocation();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async () => {
    if (!photo) {
      toast({ variant: "destructive", title: "Error", description: "Please take a selfie" });
      return;
    }
    if (!latitude || !longitude) {
      toast({ variant: "destructive", title: "Location required", description: "Please wait for GPS lock" });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("latitude", latitude.toString());
      formData.append("longitude", longitude.toString());

      await markAttendance(formData);
      toast({ title: "Attendance marked successfully!" });
      setPhoto(null);
      setPreview(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    }
  };

  const todayLog = logs?.find((l: any) => new Date(l.timestamp).toDateString() === new Date().toDateString());

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-4xl font-bold font-display text-gradient mb-2">Attendance Check-in</h1>
          <p className="text-muted-foreground">Log your daily presence at the field location.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glass-panel border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-400 to-primary" />
            <CardHeader>
              <CardTitle>Daily Check-in</CardTitle>
              <CardDescription>Take a live selfie to verify your attendance today.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {todayLog ? (
                <div className="p-8 text-center bg-green-500/10 rounded-xl border border-green-500/20">
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-400 mb-2">You're checked in for today!</h3>
                  <p className="text-sm text-green-400/80">Logged at {format(new Date(todayLog.timestamp), 'h:mm a')}</p>
                </div>
              ) : (
                <>
                  <div className="aspect-square sm:aspect-video rounded-xl border-2 border-dashed border-white/20 bg-black/40 flex flex-col items-center justify-center overflow-hidden relative group">
                    {preview ? (
                      <>
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm text-sm font-medium transition-colors">
                             Retake Photo
                             <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                           </label>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground transition-colors p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4">
                          <Camera className="w-8 h-8" />
                        </div>
                        <span className="font-medium">Tap to open camera</span>
                        <span className="text-xs mt-2 opacity-60">Requires camera permissions</span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                      </label>
                    )}
                  </div>

                  <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${latitude ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Location Status</p>
                        <p className="text-xs text-muted-foreground">
                          {geoLoading ? "Acquiring..." : geoError ? "Failed to get GPS" : `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={retry} disabled={geoLoading}>Retry</Button>
                  </div>

                  <Button 
                    className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/25" 
                    onClick={onSubmit}
                    disabled={isPending || !photo || !latitude || geoLoading}
                  >
                    {isPending ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Submit Check-in"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5">
            <CardHeader>
              <CardTitle>Recent History</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {logs?.map((log: any) => (
                    <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden shrink-0 border border-white/10">
                        {log.photoUrl ? (
                          <img src={log.photoUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Camera className="w-4 h-4"/></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{format(new Date(log.timestamp), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(log.timestamp), 'h:mm a')}</p>
                      </div>
                    </div>
                  ))}
                  {logs?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No attendance records yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
