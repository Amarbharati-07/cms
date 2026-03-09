import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCandidateTasks, useCandidateSubmitTask } from "@/hooks/use-candidate";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, UploadCloud, Calendar, MapPin, CheckCircle2, CheckSquare, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  'Video': ['.mp4'],
  'PDF': ['.pdf'],
  'Word': ['.doc', '.docx'],
  'Excel': ['.xls', '.xlsx'],
  'Text': ['.txt']
};

const ALLOWED_MIMES: Record<string, string[]> = {
  'Video': ['video/mp4'],
  'PDF': ['application/pdf'],
  'Word': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'Excel': ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  'Text': ['text/plain']
};

export default function CandidateTasks() {
  const { data: tasks, isLoading } = useCandidateTasks();
  const { mutateAsync: submitTask, isPending } = useCandidateSubmitTask();
  const { latitude, longitude, error: geoError, loading: geoLoading, retry } = useGeolocation();
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const validateFile = (file: File, requiredFormats: string[]): string | null => {
    if (!file) return "Please attach a file";
    if (!requiredFormats || requiredFormats.length === 0) return null;

    const fileName = file.name.toLowerCase();
    const fileExt = '.' + fileName.split('.').pop();
    const fileMime = file.type;

    for (const format of requiredFormats) {
      const allowedExts = ALLOWED_EXTENSIONS[format] || [];
      const allowedMimes = ALLOWED_MIMES[format] || [];
      if (allowedExts.includes(fileExt) || allowedMimes.includes(fileMime)) {
        return null;
      }
    }

    return `File must be one of: ${requiredFormats.join(', ')}`;
  };

  const onSubmit = async (taskId: number, requiredFormats: string[]) => {
    if (!file) {
      toast({ variant: "destructive", title: "Error", description: "Please attach a file" });
      return;
    }

    const validationError = validateFile(file, requiredFormats);
    if (validationError) {
      toast({ variant: "destructive", title: "Invalid file format", description: validationError });
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
                  <p className="text-muted-foreground mb-4 leading-relaxed">{task.description}</p>
                  {task.requiredFormats && task.requiredFormats.length > 0 && (
                    <div className="mb-6 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <p className="text-xs font-semibold text-purple-400 mb-2">Required Submission Format:</p>
                      <div className="flex flex-wrap gap-2">
                        {task.requiredFormats.map((fmt: string) => (
                          <Badge key={fmt} variant="secondary" className="bg-purple-500/20 text-purple-300">{fmt}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
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
                          {task.requiredFormats && task.requiredFormats.length > 0 && (
                            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                              <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-yellow-300">
                                <p className="font-semibold mb-1">Accepted formats: {task.requiredFormats.join(', ')}</p>
                                <p>Make sure your file matches one of these formats</p>
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Upload File Evidence</label>
                            <input 
                              type="file" 
                              onChange={(e) => setFile(e.target.files?.[0] || null)}
                              className="flex h-12 w-full items-center justify-center rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/30 focus-visible:outline-none"
                            />
                            {file && (
                              <p className="text-xs text-muted-foreground">Selected: {file.name}</p>
                            )}
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
                            onClick={() => onSubmit(task.id, task.requiredFormats || [])}
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
