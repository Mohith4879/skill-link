import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, GraduationCap, ArrowLeft } from "lucide-react";

export default function TutorProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [{ data: tp }, { data: sl }, { data: rv }] = await Promise.all([
        supabase.from("tutor_profiles").select("*, profiles!tutor_profiles_user_id_fkey(full_name, avatar_url)").eq("user_id", userId).single(),
        supabase.from("time_slots").select("*").eq("tutor_id", userId).eq("status", "available").gte("start_time", new Date().toISOString()).order("start_time"),
        supabase.from("ratings").select("*, profiles!ratings_student_id_fkey(full_name)").eq("tutor_id", userId).order("created_at", { ascending: false }),
      ]);
      setTutor(tp);
      setSlots(sl || []);
      setReviews(rv || []);
    };
    load();
  }, [userId]);

  const handleBook = async (slotId: string) => {
    if (!user) { navigate("/auth"); return; }
    setBooking(true);
    try {
      const { error: bookErr } = await supabase.from("bookings").insert({
        student_id: user.id, tutor_id: userId!, slot_id: slotId, status: "confirmed",
      });
      if (bookErr) throw bookErr;
      await supabase.from("time_slots").update({ status: "booked" }).eq("id", slotId);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      toast({ title: "Session booked!", description: "Check your dashboard for details." });
    } catch (err: any) {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  if (!tutor) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <GraduationCap className="h-7 w-7" /> Skill-Link
          </Link>
          <Link to="/dashboard"><Button size="sm" variant="outline">Dashboard</Button></Link>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/tutors" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to tutors
        </Link>

        <div className="mt-4 flex items-start gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-3xl font-bold">
            {(tutor.profiles?.full_name || "T")[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{tutor.profiles?.full_name || "Tutor"}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{Number(tutor.rating).toFixed(1)}</span>
              <span className="text-muted-foreground">({tutor.total_ratings} reviews)</span>
            </div>
            {tutor.hourly_rate > 0 && <p className="mt-1 text-lg font-semibold text-primary">${Number(tutor.hourly_rate).toFixed(0)}/hr</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {tutor.subjects.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
          </div>
        </div>

        {tutor.bio && <p className="mt-6 text-muted-foreground">{tutor.bio}</p>}

        {/* Available Slots */}
        <Card className="mt-8">
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Available Slots</CardTitle></CardHeader>
          <CardContent>
            {slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available slots right now.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {slots.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="text-sm">
                      <p className="font-medium">{new Date(slot.start_time).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
                      <p className="text-muted-foreground">
                        {new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                        {new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleBook(slot.id)} disabled={booking}>Book</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews */}
        {reviews.length > 0 && (
          <Card className="mt-6">
            <CardHeader><CardTitle>Reviews</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{r.profiles?.full_name || "Student"}</span>
                  </div>
                  {r.review && <p className="mt-1 text-sm text-muted-foreground">{r.review}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
