import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, GraduationCap, LogOut, Plus, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [tutorProfile, setTutorProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tutor form
  const [bio, setBio] = useState("");
  const [subjects, setSubjects] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [slots, setSlots] = useState<any[]>([]);

  // Rating dialog
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingReview, setRatingReview] = useState("");
  const [existingRatings, setExistingRatings] = useState<Set<string>>(new Set());

  // Role update
  const [role, setRole] = useState<string>("student");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) return;
    const [{ data: p }, { data: tp }, { data: bk }, { data: rt }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("tutor_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("bookings").select("*, time_slots(*), profiles!bookings_tutor_id_fkey(full_name), student:profiles!bookings_student_id_fkey(full_name)").or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`).order("created_at", { ascending: false }),
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
    setBookings(bk || []);
    setExistingRatings(new Set((rt || []).map((r: any) => r.booking_id)));

    if (p?.role === "tutor" || p?.role === "both") {
      const { data: sl } = await supabase.from("time_slots").select("*").eq("tutor_id", user.id).gte("start_time", new Date().toISOString()).order("start_time");
      setSlots(sl || []);
    }
    setLoading(false);
  };

  const updateRole = async (newRole: string) => {
    await supabase.from("profiles").update({ role: newRole }).eq("user_id", user!.id);
    setRole(newRole);
    toast({ title: "Role updated" });
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
    // Update avg rating
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

  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;

  const isTutor = role === "tutor" || role === "both";
  const upcoming = bookings.filter((b) => b.status === "confirmed");
  const history = bookings.filter((b) => b.status === "completed" || b.status === "cancelled");

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <GraduationCap className="h-7 w-7" /> Skill-Link
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/tutors"><Button variant="ghost" size="sm">Browse Tutors</Button></Link>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}><LogOut className="h-4 w-4 mr-1" /> Sign Out</Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {profile?.full_name || "User"}</p>
          </div>
          <Select value={role} onValueChange={updateRole}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="tutor">Tutor</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="sessions" className="mt-8">
          <TabsList>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            {isTutor && <TabsTrigger value="tutor">Tutor Panel</TabsTrigger>}
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Upcoming Sessions</CardTitle></CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming sessions. <Link to="/tutors" className="text-primary hover:underline">Find a tutor</Link></p>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map((b) => (
                      <div key={b.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">
                            {b.student_id === user!.id ? `Tutor: ${b.profiles?.full_name}` : `Student: ${b.student?.full_name}`}
                          </p>
                          {b.time_slots && (
                            <p className="text-sm text-muted-foreground">
                              {new Date(b.time_slots.start_time).toLocaleDateString()} {new Date(b.time_slots.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

            <Card>
              <CardHeader><CardTitle>Session History</CardTitle></CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No past sessions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((b) => (
                      <div key={b.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">
                            {b.student_id === user!.id ? `Tutor: ${b.profiles?.full_name}` : `Student: ${b.student?.full_name}`}
                          </p>
                          <Badge variant="secondary" className="mt-1">{b.status}</Badge>
                        </div>
                        {b.status === "completed" && b.student_id === user!.id && !existingRatings.has(b.id) && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setRatingBookingId(b.id)}>
                                <Star className="h-4 w-4 mr-1" /> Rate
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Rate your session</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((v) => (
                                    <button key={v} onClick={() => setRatingValue(v)}>
                                      <Star className={`h-6 w-6 ${v <= ratingValue ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                                    </button>
                                  ))}
                                </div>
                                <Textarea placeholder="Write a review (optional)..." value={ratingReview} onChange={(e) => setRatingReview(e.target.value)} />
                                <Button onClick={() => submitRating(b.tutor_id)} className="w-full">Submit Rating</Button>
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
          </TabsContent>

          {isTutor && (
            <TabsContent value="tutor" className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Tutor Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell students about yourself..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Subjects (comma separated)</Label>
                    <Input value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="Math, Physics, Chemistry" />
                  </div>
                  <div className="space-y-2">
                    <Label>Hourly Rate ($)</Label>
                    <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="25" />
                  </div>
                  <Button onClick={saveTutorProfile}>{tutorProfile ? "Update Profile" : "Create Profile"}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Manage Time Slots</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} className="w-auto" />
                    <Input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} className="w-auto" />
                    <Input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} className="w-auto" />
                    <Button onClick={addSlot}><Plus className="h-4 w-4 mr-1" /> Add Slot</Button>
                  </div>
                  {slots.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {slots.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="text-sm">
                            <span className="font-medium">{new Date(s.start_time).toLocaleDateString()}</span>{" "}
                            {new Date(s.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(s.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            <Badge variant="secondary" className="ml-2">{s.status}</Badge>
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
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
