import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Loader2,
  Sparkles, Clock, X, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const POPULAR_SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English",
  "Computer Science", "Spanish", "French", "History", "Economics",
];

type Step = 1 | 2 | 3 | 4;

export default function TutorOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  // Step 2
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  // Step 3
  const [slotDate, setSlotDate] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (p) setFullName(p.full_name || "");
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const toggleSubject = (s: string) => {
    setSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };
  const addCustomSubject = () => {
    const v = subjectInput.trim();
    if (!v || subjects.includes(v)) { setSubjectInput(""); return; }
    setSubjects([...subjects, v]);
    setSubjectInput("");
  };

  const canNext = (): boolean => {
    if (step === 1) return fullName.trim().length > 1 && bio.trim().length >= 20;
    if (step === 2) return subjects.length > 0 && Number(hourlyRate) > 0;
    if (step === 3) return !!(slotDate && slotStart && slotEnd && slotStart < slotEnd);
    return true;
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);

    // Update profile + role
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), role: "tutor" })
      .eq("user_id", user.id);
    if (pErr) { toast({ title: "Failed", description: pErr.message, variant: "destructive" }); setSaving(false); return; }

    // Upsert tutor profile
    const { data: existing } = await supabase
      .from("tutor_profiles").select("id").eq("user_id", user.id).maybeSingle();
    const data = { user_id: user.id, bio, subjects, hourly_rate: Number(hourlyRate) };
    const { error: tErr } = existing
      ? await supabase.from("tutor_profiles").update(data).eq("user_id", user.id)
      : await supabase.from("tutor_profiles").insert(data);
    if (tErr) { toast({ title: "Failed", description: tErr.message, variant: "destructive" }); setSaving(false); return; }

    // First availability slot
    const start_time = new Date(`${slotDate}T${slotStart}`).toISOString();
    const end_time = new Date(`${slotDate}T${slotEnd}`).toISOString();
    await supabase.from("time_slots").insert({ tutor_id: user.id, start_time, end_time });

    setSaving(false);
    setStep(4);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const progress = step === 4 ? 100 : ((step - 1) / 3) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 md:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
              <Sparkles className="h-3.5 w-3.5" /> Tutor onboarding
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              Welcome aboard{step !== 4 && <>, <span className="gradient-text">teacher</span></>}{step === 4 && "!"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {step === 4 ? "You're all set up and ready to teach." : `Step ${step} of 3 — let's get your tutor profile ready in under 2 minutes.`}
            </p>
            {step !== 4 && (
              <div className="mt-5">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span className={cn(step >= 1 && "text-foreground font-medium")}>About you</span>
                  <span className={cn(step >= 2 && "text-foreground font-medium")}>Subjects & rate</span>
                  <span className={cn(step >= 3 && "text-foreground font-medium")}>First slot</span>
                </div>
              </div>
            )}
          </div>

          <Card className="border-border/60 shadow-card overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <GraduationCap className="h-4 w-4" /> Tell students who you are
                    </div>
                    <div className="space-y-2">
                      <Label>Full name</Label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label>Short bio</Label>
                      <Textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={5}
                        placeholder="Share your teaching experience, style, and what makes your sessions great. (At least 20 characters)"
                      />
                      <p className="text-xs text-muted-foreground">{bio.length} / 20+ characters</p>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <BookOpen className="h-4 w-4" /> What do you teach?
                    </div>
                    <div className="space-y-2">
                      <Label>Pick popular subjects or add your own</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_SUBJECTS.map((s) => {
                          const active = subjects.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleSubject(s)}
                              className={cn(
                                "px-3 py-1.5 text-sm rounded-full border transition-smooth",
                                active
                                  ? "gradient-primary text-primary-foreground border-transparent shadow-soft"
                                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Input
                          value={subjectInput}
                          onChange={(e) => setSubjectInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSubject(); } }}
                          placeholder="Add a custom subject"
                        />
                        <Button type="button" variant="outline" onClick={addCustomSubject}>Add</Button>
                      </div>
                      {subjects.filter((s) => !POPULAR_SUBJECTS.includes(s)).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {subjects.filter((s) => !POPULAR_SUBJECTS.includes(s)).map((s) => (
                            <Badge key={s} variant="secondary" className="gap-1 pr-1">
                              {s}
                              <button onClick={() => toggleSubject(s)} className="rounded-full hover:bg-muted p-0.5"><X className="h-3 w-3" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 max-w-xs">
                      <Label>Hourly rate (USD)</Label>
                      <Input type="number" min="1" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="25" />
                      <p className="text-xs text-muted-foreground">You can change this anytime.</p>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Clock className="h-4 w-4" /> Your first available slot
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Add at least one slot so students can book you right away. You can add more from your dashboard.
                    </p>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" min={new Date().toISOString().split("T")[0]} value={slotDate} onChange={(e) => setSlotDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Start</Label>
                        <Input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>End</Label>
                        <Input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-5">
                    <div className="mx-auto h-20 w-20 rounded-full gradient-cta flex items-center justify-center shadow-glow">
                      <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold">You're live! 🎉</h2>
                      <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                        Your tutor profile is published. Students can now find you in search and book your slot.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                      <Button onClick={() => navigate("/dashboard")} className="gradient-cta text-primary-foreground border-0">
                        Go to dashboard
                      </Button>
                      <Button variant="outline" onClick={() => navigate(`/tutor/${user!.id}`)}>
                        View my public profile
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {step !== 4 && (
                <div className="flex justify-between mt-8 pt-5 border-t border-border">
                  <Button
                    variant="ghost"
                    onClick={() => step > 1 ? setStep((step - 1) as Step) : navigate("/dashboard")}
                    disabled={saving}
                  >
                    <ArrowLeft className="h-4 w-4" /> {step === 1 ? "Cancel" : "Back"}
                  </Button>
                  {step < 3 ? (
                    <Button
                      onClick={() => setStep((step + 1) as Step)}
                      disabled={!canNext()}
                      className="gradient-cta text-primary-foreground border-0"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={finish}
                      disabled={!canNext() || saving}
                      className="gradient-cta text-primary-foreground border-0"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {saving ? "Publishing…" : "Finish & publish"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}