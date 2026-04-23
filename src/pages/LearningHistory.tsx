import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  History, BookOpen, Clock, DollarSign, Users, TrendingUp,
  Calendar, GraduationCap, Sparkles,
} from "lucide-react";
import { subjectToSlug } from "@/lib/subjects";

type Booking = {
  id: string;
  status: string;
  tutor_id: string;
  student_id: string;
  created_at: string;
  time_slots: { start_time: string; end_time: string } | null;
  tutor: { full_name: string; avatar_url: string | null } | null;
  tutor_profile: { hourly_rate: number; subjects: string[] } | null;
};

export default function LearningHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const { data: bk } = await supabase
        .from("bookings")
        .select("*, time_slots(*)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (!bk || bk.length === 0) { setBookings([]); setLoading(false); return; }

      const tutorIds = [...new Set(bk.map((b) => b.tutor_id))];
      const [{ data: profs }, { data: tps }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", tutorIds),
        supabase.from("tutor_profiles").select("user_id, hourly_rate, subjects").in("user_id", tutorIds),
      ]);
      const pm = Object.fromEntries((profs || []).map((p) => [p.user_id, p]));
      const tm = Object.fromEntries((tps || []).map((t) => [t.user_id, t]));

      setBookings(bk.map((b) => ({
        ...b,
        tutor: pm[b.tutor_id] || null,
        tutor_profile: tm[b.tutor_id] || null,
      })) as Booking[]);
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const stats = useMemo(() => {
    const completed = bookings.filter((b) => b.status === "completed");
    const totalSessions = completed.length;

    let totalMinutes = 0;
    let totalSpent = 0;
    const subjectMinutes: Record<string, number> = {};
    const tutorCounts: Record<string, { name: string; avatar: string | null; count: number; minutes: number }> = {};

    completed.forEach((b) => {
      if (b.time_slots) {
        const ms = new Date(b.time_slots.end_time).getTime() - new Date(b.time_slots.start_time).getTime();
        const mins = Math.max(0, Math.round(ms / 60000));
        totalMinutes += mins;

        const rate = Number(b.tutor_profile?.hourly_rate || 0);
        totalSpent += (mins / 60) * rate;

        // Distribute minutes across the tutor's subjects (best-effort attribution)
        const subs = b.tutor_profile?.subjects || [];
        if (subs.length > 0) {
          const per = mins / subs.length;
          subs.forEach((s) => { subjectMinutes[s] = (subjectMinutes[s] || 0) + per; });
        }

        const t = tutorCounts[b.tutor_id] || {
          name: b.tutor?.full_name || "Tutor",
          avatar: b.tutor?.avatar_url || null,
          count: 0, minutes: 0,
        };
        t.count += 1;
        t.minutes += mins;
        tutorCounts[b.tutor_id] = t;
      }
    });

    const topSubjects = Object.entries(subjectMinutes)
      .map(([subject, minutes]) => ({ subject, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    const topTutors = Object.entries(tutorCounts)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const maxSubjectMins = topSubjects[0]?.minutes || 1;

    return {
      totalSessions,
      totalHours: (totalMinutes / 60).toFixed(1),
      totalSpent: totalSpent.toFixed(0),
      uniqueTutors: Object.keys(tutorCounts).length,
      topSubjects,
      topTutors,
      maxSubjectMins,
      completed,
    };
  }, [bookings]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, gradient }: any) => (
    <Card className="border-border/60 shadow-card overflow-hidden">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground shadow-soft ${gradient}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-display font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
              <History className="h-3.5 w-3.5" /> Learning history
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">Your learning journey</h1>
            <p className="text-muted-foreground mt-1">Track your progress, top subjects, and favorite tutors.</p>
          </div>

          {stats.totalSessions === 0 ? (
            <Card className="border-border/60 shadow-card">
              <CardContent className="p-12 text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-soft">
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
                <h2 className="font-display text-xl font-bold">No completed sessions yet</h2>
                <p className="text-muted-foreground mt-1 mb-5 max-w-sm mx-auto">
                  Once you complete sessions, you'll see your learning stats, hours per subject, and top tutors here.
                </p>
                <Link to="/tutors">
                  <Button className="gradient-cta text-primary-foreground border-0">Find a tutor</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={BookOpen} label="Sessions" value={stats.totalSessions} gradient="gradient-primary" />
                <StatCard icon={Clock} label="Hours learned" value={stats.totalHours} gradient="gradient-cta" />
                <StatCard icon={Users} label="Tutors" value={stats.uniqueTutors} gradient="gradient-accent" />
                <StatCard icon={DollarSign} label="Total spent" value={`$${stats.totalSpent}`} gradient="gradient-primary" />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-border/60 shadow-card">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" /> Top subjects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.topSubjects.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">No subject data yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {stats.topSubjects.map(({ subject, minutes }) => {
                          const pct = (minutes / stats.maxSubjectMins) * 100;
                          return (
                            <Link key={subject} to={`/subjects/${subjectToSlug(subject)}`} className="block group">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-medium group-hover:text-primary transition-smooth">{subject}</span>
                                <span className="text-xs text-muted-foreground">{(minutes / 60).toFixed(1)}h</span>
                              </div>
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full gradient-primary transition-smooth" style={{ width: `${pct}%` }} />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-card">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" /> Top tutors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.topTutors.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">No tutor data yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.topTutors.map((t) => (
                          <Link key={t.id} to={`/tutor/${t.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/60 transition-smooth">
                            <Avatar className="h-10 w-10">
                              {t.avatar ? <AvatarImage src={t.avatar} /> : null}
                              <AvatarFallback className="gradient-primary text-primary-foreground text-sm font-bold">
                                {t.name[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{t.name}</p>
                              <p className="text-xs text-muted-foreground">{(t.minutes / 60).toFixed(1)}h together</p>
                            </div>
                            <Badge variant="secondary">{t.count} {t.count === 1 ? "session" : "sessions"}</Badge>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/60 shadow-card">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> Completed sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.completed.slice(0, 10).map((b) => (
                      <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/40 transition-smooth">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-9 w-9">
                            {b.tutor?.avatar_url ? <AvatarImage src={b.tutor.avatar_url} /> : null}
                            <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-bold">
                              {(b.tutor?.full_name || "?")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link to={`/tutor/${b.tutor_id}`} className="text-sm font-medium hover:text-primary transition-smooth truncate block">
                              {b.tutor?.full_name || "Tutor"}
                            </Link>
                            {b.time_slots && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(b.time_slots.start_time).toLocaleDateString(undefined, { dateStyle: "medium" })}
                                {" · "}
                                {Math.round((new Date(b.time_slots.end_time).getTime() - new Date(b.time_slots.start_time).getTime()) / 60000)} min
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Completed</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}