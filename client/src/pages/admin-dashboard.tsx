import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCandidates, useAdminTasks } from "@/hooks/use-admin";
import { Users, CheckSquare, Clock, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'Mon', active: 40, completed: 24 },
  { name: 'Tue', active: 30, completed: 13 },
  { name: 'Wed', active: 20, completed: 48 },
  { name: 'Thu', active: 27, completed: 39 },
  { name: 'Fri', active: 18, completed: 48 },
  { name: 'Sat', active: 23, completed: 38 },
  { name: 'Sun', active: 34, completed: 43 },
];

export default function AdminDashboard() {
  const { data: candidates } = useAdminCandidates();
  const { data: tasks } = useAdminTasks();

  const totalCandidates = candidates?.length || 0;
  const totalTasks = tasks?.length || 0;
  const pendingTasks = tasks?.filter((t: any) => t.status === 'SUBMITTED').length || 0;

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-4xl font-bold font-display text-gradient mb-2">Overview</h1>
          <p className="text-muted-foreground text-lg">Here's what's happening with your field team today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-panel border-white/5 hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Candidates</CardTitle>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Users className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{totalCandidates}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-400" />
                <span className="text-green-400">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5 hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <CheckSquare className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{totalTasks}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-400" />
                <span className="text-green-400">+5%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5 hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-amber-400">{pendingTasks}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                Needs your attention
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-panel border-white/5">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="active" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
