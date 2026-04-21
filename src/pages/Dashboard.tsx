import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/layout/Navbar";
import {
  Star, Plus, Trash2, LayoutDashboard, Calendar, History,
  UserCog, Clock, DollarSign, GraduationCap, CheckCircle2, Users, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

type View = "overview" | "sessions" | "history" | "tutor" | "settings";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [tutorProfile, setTutorProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("overview");

  const [bio, setBio] = useState("");
  const [subjects, setSubjects] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [slots, setSlots] = useState<any[]>([]);

  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingReview, setRatingReview] = useState("");
  const [existingRatings, setExistingRatings] = useState<Set<string>>(new Set());

  const [role, setRole] = useState<string>("student");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) return;
    const [{ data: p }, { data: tp }, { data: bk }, { data: rt }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("tutor_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("bookings").select("*, time_slots(*)").or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`).order("created_at", { ascending: false }),
      supabase.from("ratings").select("booking_id").eq("student_id", user.id),
    ]);
    setProfile(p);
    setRole(p?.role || "student");
    setTutorProfile(tp);
    if (tp) {
      setBio(tp.bio || "");
      setSubjects(tp.subjects?.join(", ") || "");
      setHourlyRate(String(tp.hourly_rate || ""));
    }
    if (bk && bk.length > 0) {
      const allIds = [...new Set(bk.flatMap((b: any) => [b.tutor_id, b.student_id]))];
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", allIds);
      const pm = Object.fromEntries((profs || []).map((pr) => [pr.user_id, pr]));
      setBookings(bk.map((b: any) => ({ ...b, profiles: pm[b.tutor_id] || null, student: pm[b.student_id] || null })));
    } else {
      setBookings([]);
    }
    setExistingRatings(new Set((rt || []).map((r: any) => r.booking_id)));

    if (p?.role === "tutor" || p?.role === "both") {
      const { data: sl } = await supabase.from("time_slots").select("*").eq("tutor_id", user.id).gte("start_time", new Date().toISOString()).order("start_time");
      setSlots(sl || []);
    }
    setLoading(false);
  };

  const updateRole = async (newRole: string) => {
    await supabase.from("profiles").update({ role: newRole as any }).eq("user_id", user!.id);
    setRole(newRole);
    toast({ title: "Role updated" });
    loadData();
  };

  const saveTutorProfile = async () => {
    const subArr = subjects.split(",").map((s) => s.trim()).filter(Boolean);
    const data = { user_id: user!.id, bio, subjects: subArr, hourly_rate: Number(hourlyRate) || 0 };
    if (tutorProfile) {
      await supabase.from("tutor_profiles").update(data).eq("user_id", user!.id);
    } else {
      await supabase.from("tutor_profiles").insert(data);
    }
    toast({ title: "Tutor profile saved!" });
    loadData();
  };

  const addSlot = async () => {
    if (!slotDate || !slotStart || !slotEnd) return;
    const start_time = new Date(`${slotDate}T${slotStart}`).toISOString();
    const end_time = new Date(`${slotDate}T${slotEnd}`).toISOString();
    await supabase.from("time_slots").insert({ tutor_id: user!.id, start_time, end_time });
    setSlotDate(""); setSlotStart(""); setSlotEnd("");
    toast({ title: "Slot added!" });
    loadData();
  };

  const deleteSlot = async (id: string) => {
    await supabase.from("time_slots").delete().eq("id", id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const submitRating = async (tutorId: string) => {
    if (!ratingBookingId) return;
    await supabase.from("ratings").insert({
      student_id: user!.id, tutor_id: tutorId, booking_id: ratingBookingId, rating: ratingValue, review: ratingReview,
    });
    const { data: allRatings } = await supabase.from("ratings").select("rating").eq("tutor_id", tutorId);
    if (allRatings && allRatings.length > 0) {
      const avg = allRatings.reduce((a, b) => a + b.rating, 0) / allRatings.length;
      await supabase.from("tutor_profiles").update({ rating: avg, total_ratings: allRatings.length }).eq("user_id", tutorId);
    }
    setRatingBookingId(null);
    setRatingReview("");
    setRatingValue(5);
    toast({ title: "Rating submitted!" });
    loadData();
  };

  const markComplete = async (bookingId: string, slotId: string) => {
    await supabase.from("bookings").update({ status: "completed" }).eq("id", bookingId);
    await supabase.from("time_slots").update({ status: "completed" }).eq("id", slotId);
    toast({ title: "Session marked complete" });
    loadData();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const isTutor = role === "tutor" || role === "both";
  const upcoming = bookings.filter((b) => b.status === "confirmed");
  const history = bookings.filter((b) => b.status === "completed" || b.status === "cancelled");
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const tutorEarnings = isTutor
    ? bookings.filter((b) => b.tutor_id === user!.id && b.status === "completed").length * Number(tutorProfile?.hourly_rate || 0)
    : 0;

  const navItems: { id: View; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "sessions", label: "Upcoming", icon: Calendar },
    { id: "history", label: "History", icon: History },
    ...(isTutor ? [{ id: "tutor" as View, label: "Tutor Panel", icon: GraduationCap }] : []),
    { id: "settings", label: "Settings", icon: UserCog },
  ];

  const StatCard = ({ icon: Icon, label, value, gradient }: any) => (
    <Card className="border-border/60 shadow-card overflow-hidden">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground shadow-soft", gradient)}>
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

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 lg:shrink-0">
            <Card className="border-border/60 shadow-card sticky top-24">
              <CardContent className="p-3">
                <div className="px-3 py-3 border-b border-border mb-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Signed in as</p>
                  <p className="font-display font-semibold truncate mt-0.5">{profile?.full_name || "User"}</p>
                  <Badge variant="secondary" className="mt-1.5 text-xs capitalize">{role}</Badge>
                </div>
                <nav className="flex lg:flex-col gap-1 overflow-x-auto">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-smooth whitespace-nowrap text-left",
                        view === item.id
                          ? "gradient-primary text-primary-foreground shadow-soft"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {view === "overview" && (
                <>
                  <div>
                    <h1 className="font-display text-3xl font-bold">
                      Welcome back, <span className="gradient-text">{profile?.full_name?.split(" ")[0] || "there"}</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">Here's what's happening with your account.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard icon={Calendar} label="Upcoming" value={upcoming.length} gradient="gradient-primary" />
                    <StatCard icon={CheckCircle2} label="Completed" value={completedCount} gradient="gradient-cta" />
                    {isTutor ? (
                      <>
                        <StatCard icon={Star} label="Your Rating" value={Number(tutorProfile?.rating || 0).toFixed(1)} gradient="gradient-accent" />
                        <StatCard icon={DollarSign} label="Earnings" value={`$${tutorEarnings}`} gradient="gradient-primary" />
                      </>
                    ) : (
                      <>
                        <StatCard icon={Users} label="Tutors Booked" value={new Set(bookings.map((b) => b.tutor_id)).size} gradient="gradient-accent" />
                        <StatCard icon={BookOpen} label="Total Sessions" value={bookings.length} gradient="gradient-primary" />
                      </>
                    )}
                  </div>

                  <Card className="border-border/60 shadow-card">
                    <CardHeader>
                      <CardTitle className="font-display">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {bookings.slice(0, 5).length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                          <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">No activity yet. <Link to="/tutors" className="text-primary hover:underline">Browse tutors →</Link></p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {bookings.slice(0, 5).map((b) => (
                            <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/40 transition-smooth">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                                  {((b.student_id === user!.id ? b.profiles?.full_name : b.student?.full_name) || "?")[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {b.student_id === user!.id ? b.profiles?.full_name : b.student?.full_name}
                                  </p>
                                  {b.time_slots && (
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(b.time_slots.start_time).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge variant={b.status === "completed" ? "secondary" : "default"} className="capitalize">{b.status}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {view === "sessions" && (
                <Card className="border-border/60 shadow-card">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Upcoming Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcoming.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <Clock className="h-10 w-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No upcoming sessions. <Link to="/tutors" className="text-primary hover:underline">Find a tutor →</Link></p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcoming.map((b) => (
                          <div key={b.id} className="flex items-center justify-between rounded-xl border border-border p-4 hover:shadow-soft transition-smooth">
                            <div>
                              <p className="font-medium">
                                {b.student_id === user!.id ? `Tutor: ${b.profiles?.full_name}` : `Student: ${b.student?.full_name}`}
                              </p>
                              {b.time_slots && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {new Date(b.time_slots.start_time).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge>Confirmed</Badge>
                              {b.tutor_id === user!.id && (
                                <Button size="sm" variant="outline" onClick={() => markComplete(b.id, b.slot_id)}>Complete</Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {view === "history" && (
                <Card className="border-border/60 shadow-card">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Session History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {history.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <p className="text-sm">No past sessions yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {history.map((b) => (
                          <div key={b.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                            <div>
                              <p className="font-medium">
                                {b.student_id === user!.id ? `Tutor: ${b.profiles?.full_name}` : `Student: ${b.student?.full_name}`}
                              </p>
                              <Badge variant="secondary" className="mt-1 capitalize">{b.status}</Badge>
                            </div>
                            {b.status === "completed" && b.student_id === user!.id && !existingRatings.has(b.id) && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => setRatingBookingId(b.id)}>
                                    <Star className="h-4 w-4" /> Rate
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader><DialogTitle className="font-display">Rate your session</DialogTitle></DialogHeader>
                                  <div className="space-y-4">
                                    <div className="flex justify-center gap-1">
                                      {[1, 2, 3, 4, 5].map((v) => (
                                        <button key={v} onClick={() => setRatingValue(v)} className="transition-transform hover:scale-110">
                                          <Star className={cn("h-8 w-8", v <= ratingValue ? "fill-accent text-accent" : "text-muted")} />
                                        </button>
                                      ))}
                                    </div>
                                    <Textarea placeholder="Write a review (optional)..." value={ratingReview} onChange={(e) => setRatingReview(e.target.value)} />
                                    <Button onClick={() => submitRating(b.tutor_id)} className="w-full gradient-cta text-primary-foreground border-0">Submit Rating</Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {view === "tutor" && isTutor && (
                <>
                  <Card className="border-border/60 shadow-card">
                    <CardHeader><CardTitle className="font-display">Tutor Profile</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell students about yourself..." rows={4} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Subjects (comma separated)</Label>
                          <Input value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="Math, Physics, Chemistry" />
                        </div>
                        <div className="space-y-2">
                          <Label>Hourly Rate ($)</Label>
                          <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="25" />
                        </div>
                      </div>
                      <Button onClick={saveTutorProfile} className="gradient-cta text-primary-foreground border-0">
                        {tutorProfile ? "Update Profile" : "Create Profile"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 shadow-card">
                    <CardHeader><CardTitle className="font-display flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Manage Time Slots</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-4 gap-3">
                        <Input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} />
                        <Input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
                        <Input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
                        <Button onClick={addSlot} className="gradient-cta text-primary-foreground border-0"><Plus className="h-4 w-4" /> Add</Button>
                      </div>
                      {slots.length > 0 && (
                        <div className="mt-5 space-y-2">
                          {slots.map((s) => (
                            <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                              <div className="text-sm">
                                <span className="font-medium">{new Date(s.start_time).toLocaleDateString()}</span>{" "}
                                {new Date(s.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(s.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                <Badge variant="secondary" className="ml-2 capitalize">{s.status}</Badge>
                              </div>
                              {s.status === "available" && (
                                <Button size="icon" variant="ghost" onClick={() => deleteSlot(s.id)}><Trash2 className="h-4 w-4" /></Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {view === "settings" && (
                <Card className="border-border/60 shadow-card">
                  <CardHeader><CardTitle className="font-display">Account Settings</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 max-w-xs">
                      <Label>Account Role</Label>
                      <Select value={role} onValueChange={updateRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="tutor">Tutor</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Switch to "Tutor" or "Both" to start offering sessions.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
