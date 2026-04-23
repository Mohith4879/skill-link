import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign, TrendingUp, Calendar, CheckCircle2, Wallet, ArrowUpRight, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SessionRow = {
  id: string;
  status: string;
  student_id: string;
  student_name: string;
  start_time: string | null;
  end_time: string | null;
  amount: number;
};

const fmt = (n: number) => `$${n.toFixed(2)}`;

export default function Earnings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [isTutor, setIsTutor] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const [{ data: profile }, { data: tp }, { data: bk }] = await Promise.all([
        supabase.from("profiles").select("role").eq("user_id", user.id).single(),
        supabase.from("tutor_profiles").select("hourly_rate").eq("user_id", user.id).maybeSingle(),
        supabase.from("bookings").select("*, time_slots(*)").eq("tutor_id", user.id).order("created_at", { ascending: false }),
      ]);
      const tutorRole = profile?.role === "tutor" || profile?.role === "both";
      setIsTutor(tutorRole);
      const rate = Number(tp?.hourly_rate || 0);
      setHourlyRate(rate);

      const list = bk || [];
      const studentIds = [...new Set(list.map((b: any) => b.student_id))];
      const { data: profs } = studentIds.length
        ? await supabase.from("profiles").select("user_id, full_name").in("user_id", studentIds)
        : { data: [] as any[] };
      const pm = Object.fromEntries((profs || []).map((p: any) => [p.user_id, p.full_name]));

      const mapped: SessionRow[] = list.map((b: any) => {
        const s = b.time_slots?.start_time ? new Date(b.time_slots.start_time) : null;
        const e = b.time_slots?.end_time ? new Date(b.time_slots.end_time) : null;
        const hours = s && e ? Math.max(0, (e.getTime() - s.getTime()) / 3_600_000) : 1;
        return {
          id: b.id,
          status: b.status,
          student_id: b.student_id,
          student_name: pm[b.student_id] || "Student",
          start_time: b.time_slots?.start_time ?? null,
          end_time: b.time_slots?.end_time ?? null,
          amount: rate * hours,
        };
      });
      setRows(mapped);
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const stats = useMemo(() => {
    const completed = rows.filter((r) => r.status === "completed");
    const upcoming = rows.filter((r) => r.status === "confirmed" || r.status === "pending");
    const totalEarned = completed.reduce((sum, r) => sum + r.amount, 0);
    const upcomingValue = upcoming.reduce((sum, r) => sum + r.amount, 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = completed
      .filter((r) => r.end_time && new Date(r.end_time) >= monthStart)
      .reduce((sum, r) => sum + r.amount, 0);
    const uniqueStudents = new Set(completed.map((r) => r.student_id)).size;
    return { totalEarned, upcomingValue, thisMonth, uniqueStudents, completedCount: completed.length };
  }, [rows]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isTutor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 md:px-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold">Earnings is for tutors</h1>
          <p className="text-muted-foreground mt-2">Switch your account role to "Tutor" or "Both" to start earning.</p>
          <Link to="/profile"><Button className="mt-6 gradient-cta text-primary-foreground border-0">Edit profile</Button></Link>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, gradient, sub }: any) => (
    <Card className="border-border/60 shadow-card overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground shadow-soft", gradient)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-display font-bold truncate">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const statusBadge = (s: string) => {
    if (s === "completed") return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    if (s === "cancelled") return "bg-red-500/15 text-red-400 border border-red-500/30";
    if (s === "confirmed") return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
    return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                <Wallet className="h-3.5 w-3.5" /> Tutor earnings
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">
                Your <span className="gradient-text">earnings</span>
              </h1>
              <p className="text-muted-foreground mt-1">Based on completed sessions × your hourly rate.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">Rate: <span className="ml-1 font-semibold">{fmt(hourlyRate)}/hr</span></Badge>
              <Link to="/profile"><Button size="sm" variant="outline">Update rate</Button></Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={DollarSign} label="Total earned" value={fmt(stats.totalEarned)} gradient="gradient-primary" sub={`${stats.completedCount} completed`} />
            <StatCard icon={TrendingUp} label="This month" value={fmt(stats.thisMonth)} gradient="gradient-cta" />
            <StatCard icon={Calendar} label="Upcoming value" value={fmt(stats.upcomingValue)} gradient="gradient-accent" sub="Confirmed + pending" />
            <StatCard icon={Users} label="Unique students" value={stats.uniqueStudents} gradient="gradient-primary" />
          </div>

          <Card className="border-border/60 shadow-card">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Session history
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">No sessions yet. Once students book and complete sessions, you'll see earnings here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rows.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/40 transition-smooth">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                          {r.student_name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{r.student_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.start_time ? new Date(r.start_time).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn("text-xs font-medium px-2.5 py-1 rounded-md capitalize", statusBadge(r.status))}>{r.status}</span>
                        <span className={cn("font-display font-semibold tabular-nums w-20 text-right",
                          r.status === "completed" ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {r.status === "cancelled" ? "—" : fmt(r.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-card bg-muted/30">
            <CardContent className="p-5 flex items-start gap-3 text-sm text-muted-foreground">
              <ArrowUpRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p>Earnings are calculated automatically from your completed sessions. Connect a payment provider to start collecting payouts directly to your bank.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}