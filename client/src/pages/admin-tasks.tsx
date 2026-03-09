import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAdminTasks, useAdminCreateTask, useAdminReviewTask, useAdminCandidates } from "@/hooks/use-admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Calendar, FileText, CheckCircle2, XCircle, CheckSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const createTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  deadline: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  candidateIds: z.string().min(1, "Select at least one candidate ID (comma separated)").transform(val => val.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v)))
});

const reviewSchema = z.object({
  approvalStatus: z.enum(['APPROVED', 'REJECTED']),
  adminComment: z.string().optional(),
});

export default function AdminTasks() {
  const { data: tasks, isLoading } = useAdminTasks();
  const { data: candidates } = useAdminCandidates();
  const { mutateAsync: createTask, isPending: creating } = useAdminCreateTask();
  const { mutateAsync: reviewTask, isPending: reviewing } = useAdminReviewTask();
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof createTaskSchema>>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: "", description: "", deadline: "", candidateIds: "" as any }
  });

  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { approvalStatus: 'APPROVED', adminComment: "" }
  });

  const onSubmitCreate = async (values: z.infer<typeof createTaskSchema>) => {
    try {
      // Convert YYYY-MM-DD to ISO timestamp
      const deadlineDate = new Date(values.deadline);
      deadlineDate.setUTCHours(23, 59, 59, 999); // Set to end of day UTC
      await createTask({ ...values, deadline: deadlineDate.toISOString() });
      toast({ title: "Task created successfully" });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const onSubmitReview = async (taskId: number, values: z.infer<typeof reviewSchema>) => {
    try {
      await reviewTask({ id: taskId, data: values });
      toast({ title: "Task reviewed successfully" });
      setReviewOpen(null);
      reviewForm.reset();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold font-display text-gradient mb-2">Task Management</h1>
            <p className="text-muted-foreground">Assign and review field tasks.</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/25">
                <Plus className="w-4 h-4 mr-2" /> Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass-panel border-white/10">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Create New Task</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4 mt-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title</FormLabel>
                      <FormControl><Input className="bg-black/20 border-white/10" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea className="bg-black/20 border-white/10 resize-none h-24" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="deadline" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline (YYYY-MM-DD)</FormLabel>
                      <FormControl><Input type="date" className="bg-black/20 border-white/10 [&::-webkit-calendar-picker-indicator]:invert" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="candidateIds" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Candidate IDs (comma separated)</FormLabel>
                      <FormControl><Input className="bg-black/20 border-white/10" placeholder="e.g. 1, 2, 3" {...field} /></FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Available IDs: {candidates?.map((c:any)=>c.id).join(', ')}</p>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full mt-6" disabled={creating}>
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign Task"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-xl bg-card border border-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid gap-6">
            {tasks?.map((task: any) => (
              <Card key={task.id} className="glass-panel border-white/5 hover-elevate">
                <CardHeader className="pb-3 border-b border-white/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-1">{task.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Due: {format(new Date(task.deadline), 'PPp')}
                      </CardDescription>
                    </div>
                    <Badge variant={task.status === 'APPROVED' ? 'default' : task.status === 'REJECTED' ? 'destructive' : task.status === 'SUBMITTED' ? 'secondary' : 'outline'}>
                      {task.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-6">{task.description}</p>
                  
                  {task.status === 'SUBMITTED' && (
                    <Dialog open={reviewOpen === task.id} onOpenChange={(val) => setReviewOpen(val ? task.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="secondary" className="w-full sm:w-auto">
                          <FileText className="w-4 h-4 mr-2" /> Review Submissions
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-panel border-white/10">
                        <DialogHeader>
                          <DialogTitle>Review Task</DialogTitle>
                        </DialogHeader>
                        <Form {...reviewForm}>
                          <form onSubmit={reviewForm.handleSubmit((v) => onSubmitReview(task.id, v))} className="space-y-4">
                            <FormField control={reviewForm.control} name="approvalStatus" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <FormControl>
                                  <select 
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-black/20 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...field}
                                  >
                                    <option className="bg-card" value="APPROVED">Approve</option>
                                    <option className="bg-card" value="REJECTED">Reject</option>
                                  </select>
                                </FormControl>
                              </FormItem>
                            )} />
                            <FormField control={reviewForm.control} name="adminComment" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Feedback Comments</FormLabel>
                                <FormControl><Textarea className="bg-black/20 border-white/10" {...field} /></FormControl>
                              </FormItem>
                            )} />
                            <Button type="submit" className="w-full" disabled={reviewing}>
                              {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            ))}
            {tasks?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No tasks created yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
