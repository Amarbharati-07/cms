import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCandidateTasks, useCandidateSubmitTask } from "@/hooks/use-candidate";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, UploadCloud, Calendar, MapPin, CheckCircle2, CheckSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function CandidateTasks() {
  const { data: tasks, isLoading } = useCandidateTasks();
  const { mutateAsync: submitTask, isPending } = useCandidateSubmitTask();
  const { latitude, longitude, error: geoError, loading: geoLoading, retry } = useGeolocation();
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const onSubmit = async (taskId: number) => {
    if (!file) {
      toast({ variant: "destructive", title: "Error", description: "Please attach a file" });
      return;
    }
    if (!latitude || !longitude) {
      toast({ variant: "destructive", title: "Location required", description: geoError || "Please allow location access." });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("latitude", latitude.toString());
      formData.append("longitude", longitude.toString());

      await submitTask({ id: taskId, formData });
      toast({ title: "Task submitted successfully!" });
      setOpenTaskId(null);
      setFile(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission failed", description: error.message });
    }
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-4xl font-bold font-display text-gradient mb-2">My Tasks</h1>
          <p className="text-muted-foreground">Complete your assigned field tasks.</p>
        </div>

        {isLoading ? (
          <div className="grid gap-6">
            {[1, 2].map(i => <div key={i} className="h-40 rounded-xl bg-card border border-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid gap-6">
            {tasks?.map((task: any) => (
              <Card key={task.id} className="glass-panel border-white/5 hover-elevate">
                <CardHeader className="pb-3 border-b border-white/5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-xl mb-2">{task.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Due: {format(new Date(task.deadline), 'PPp')}
                      </CardDescription>
                    </div>
                    <Badge variant={task.status === 'APPROVED' ? 'default' : task.status === 'REJECTED' ? 'destructive' : task.status === 'SUBMITTED' ? 'secondary' : 'outline'} className="text-sm px-3 py-1">
                      {task.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-6 leading-relaxed">{task.description}</p>
                  
                  {task.status === 'PENDING' || task.status === 'REJECTED' ? (
                    <Dialog open={openTaskId === task.id} onOpenChange={(val) => setOpenTaskId(val ? task.id : null)}>
                      <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                          <UploadCloud className="w-4 h-4 mr-2" /> Submit Work
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] glass-panel border-white/10">
                        <DialogHeader>
                          <DialogTitle className="font-display text-2xl">Submit Task</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 mt-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Upload File Evidence</label>
                            <input 
                              type="file" 
                              onChange={(e) => setFile(e.target.files?.[0] || null)}
                              className="flex h-12 w-full items-center justify-center rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/30 focus-visible:outline-none"
                            />
                          </div>

                          <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-400" /> GPS Location</span>
                              <Button variant="ghost" size="sm" onClick={retry} disabled={geoLoading} className="h-8">Refresh</Button>
                            </div>
                            {geoLoading ? (
                              <p className="text-xs text-muted-foreground animate-pulse">Acquiring location...</p>
                            ) : geoError ? (
                              <p className="text-xs text-red-400">{geoError}</p>
                            ) : (
                              <p className="text-xs text-green-400 font-mono bg-green-400/10 p-2 rounded inline-block">
                                Lat: {latitude?.toFixed(5)} <br/> Lng: {longitude?.toFixed(5)}
                              </p>
                            )}
                          </div>

                          <Button 
                            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20" 
                            onClick={() => onSubmit(task.id)}
                            disabled={isPending || geoLoading || !latitude}
                          >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                            Confirm Submission
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium text-green-400 bg-green-400/10 w-fit px-4 py-2 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                      Submission Under Review
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {tasks?.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">No tasks assigned to you right now.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
