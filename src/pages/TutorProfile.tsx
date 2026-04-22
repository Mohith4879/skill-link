import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Star, Clock, ArrowLeft, Calendar, CheckCircle2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import AvailabilityCalendar from "@/components/calendar/AvailabilityCalendar";

export default function TutorProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [slotView, setSlotView] = useState<"calendar" | "list">("calendar");

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [{ data: tp }, { data: sl }, { data: rv }] = await Promise.all([
        supabase.from("tutor_profiles").select("*").eq("user_id", userId).single(),
        supabase.from("time_slots").select("*").eq("tutor_id", userId).eq("status", "available").gte("start_time", new Date().toISOString()).order("start_time"),
        supabase.from("ratings").select("*").eq("tutor_id", userId).order("created_at", { ascending: false }),
      ]);
      if (tp) {
        const { data: prof } = await supabase.from("profiles").select("full_name, avatar_url").eq("user_id", userId).single();
        setTutor({ ...tp, profiles: prof });
      }
      if (rv && rv.length > 0) {
        const sIds = [...new Set(rv.map((r: any) => r.student_id))];
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", sIds);
        const pm = Object.fromEntries((profs || []).map((p) => [p.user_id, p]));
        setReviews(rv.map((r: any) => ({ ...r, profiles: pm[r.student_id] || null })));
      } else {
        setReviews([]);
      }
      setSlots(sl || []);
    };
    load();
  }, [userId]);

  const confirmBooking = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!selectedSlot) return;
    setBooking(true);
    try {
      const { error: bookErr } = await supabase.from("bookings").insert({
        student_id: user.id, tutor_id: userId!, slot_id: selectedSlot.id, status: "confirmed",
      });
      if (bookErr) throw bookErr;
      await supabase.from("time_slots").update({ status: "booked" }).eq("id", selectedSlot.id);
      setSlots((prev) => prev.filter((s) => s.id !== selectedSlot.id));
      setConfirmOpen(false);
      setSelectedSlot(null);
      toast({ title: "Session booked! 🎉", description: "Check your dashboard for details." });
    } catch (err: any) {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  if (!tutor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
        <Link to="/tutors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-smooth">
          <ArrowLeft className="h-4 w-4" /> Back to tutors
        </Link>

        {/* Profile header card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <Card className="overflow-hidden border-border/60 shadow-card">
            <div className="h-24 gradient-primary" />
            <CardContent className="p-6 md:p-8 -mt-12">
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl gradient-primary text-primary-foreground text-4xl font-display font-bold shadow-elevated border-4 border-background">
                  {(tutor.profiles?.full_name || "T")[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <h1 className="font-display text-2xl md:text-3xl font-bold">{tutor.profiles?.full_name || "Tutor"}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="font-semibold">{Number(tutor.rating).toFixed(1)}</span>
                      <span className="text-muted-foreground">({tutor.total_ratings} reviews)</span>
                    </div>
                    {tutor.hourly_rate > 0 && (
                      <span className="font-display font-bold gradient-text text-lg">${Number(tutor.hourly_rate).toFixed(0)}/hr</span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tutor.subjects.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
              </div>
              {tutor.bio && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">About</h2>
                  <p className="text-muted-foreground leading-relaxed">{tutor.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Available Slots */}
        <Card className="mt-6 border-border/60 shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="flex items-center gap-2 font-display">
                <Calendar className="h-5 w-5 text-primary" /> Available Time Slots
              </CardTitle>
              {slots.length > 0 && (
                <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                  <button
                    onClick={() => setSlotView("calendar")}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-smooth",
                      slotView === "calendar" ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"
                    )}
                  >
                    Calendar
                  </button>
                  <button
                    onClick={() => setSlotView("list")}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-smooth",
                      slotView === "list" ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"
                    )}
                  >
                    List
                  </button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {slots.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No available slots right now. Check back soon!</p>
              </div>
            ) : slotView === "calendar" ? (
              <AvailabilityCalendar
                slots={slots}
                onPick={(s) => { setSelectedSlot(s); setConfirmOpen(true); }}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {slots.map((slot) => {
                  const selected = selectedSlot?.id === slot.id;
                  return (
                    <motion.button
                      key={slot.id}
                      whileHover={{ y: -2 }}
                      onClick={() => { setSelectedSlot(slot); setConfirmOpen(true); }}
                      className={cn(
                        "text-left rounded-xl border p-4 transition-smooth",
                        "hover:border-primary hover:shadow-soft",
                        selected
                          ? "border-primary bg-primary/5 shadow-soft"
                          : "border-border bg-card"
                      )}
                    >
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {new Date(slot.start_time).toLocaleDateString(undefined, { weekday: "short" })}
                      </p>
                      <p className="font-display font-bold mt-0.5">
                        {new Date(slot.start_time).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        {new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews */}
        {reviews.length > 0 && (
          <Card className="mt-6 border-border/60 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <MessageSquare className="h-5 w-5 text-primary" /> Reviews
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {(r.profiles?.full_name || "S")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{r.profiles?.full_name || "Student"}</span>
                    <div className="flex ml-auto">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("h-4 w-4", i < r.rating ? "fill-accent text-accent" : "text-muted")} />
                      ))}
                    </div>
                  </div>
                  {r.review && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.review}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center font-display">Confirm your booking</DialogTitle>
            <DialogDescription className="text-center">
              You're about to book a session with <strong>{tutor.profiles?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          {selectedSlot && (
            <div className="rounded-xl border border-border p-4 bg-muted/40">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">{new Date(selectedSlot.start_time).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{new Date(selectedSlot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(selectedSlot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              {tutor.hourly_rate > 0 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">Rate</span>
                  <span className="font-display font-bold gradient-text">${Number(tutor.hourly_rate).toFixed(0)}/hr</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={confirmBooking} disabled={booking} className="gradient-cta text-primary-foreground border-0">
              {booking ? "Booking..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
