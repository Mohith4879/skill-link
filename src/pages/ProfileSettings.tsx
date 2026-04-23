import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Camera, Loader2, Save, UserCog, X } from "lucide-react";

export default function ProfileSettings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [role, setRole] = useState<string>("student");

  const [bio, setBio] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [hasTutorProfile, setHasTutorProfile] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const [{ data: p }, { data: tp }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("tutor_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (p) {
        setFullName(p.full_name || "");
        setAvatarUrl(p.avatar_url);
        setRole(p.role || "student");
      }
      if (tp) {
        setHasTutorProfile(true);
        setBio(tp.bio || "");
        setSubjects(tp.subjects || []);
        setHourlyRate(String(tp.hourly_rate || ""));
      }
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const onPickAvatar = () => fileRef.current?.click();

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    setAvatarUrl(publicUrl);
    setUploading(false);
    toast({ title: "Avatar updated" });
  };

  const addSubject = () => {
    const v = subjectInput.trim();
    if (!v || subjects.includes(v)) { setSubjectInput(""); return; }
    setSubjects([...subjects, v]);
    setSubjectInput("");
  };

  const removeSubject = (s: string) => setSubjects(subjects.filter((x) => x !== s));

  const isTutor = role === "tutor" || role === "both";

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), role: role as any })
      .eq("user_id", user.id);
    if (pErr) {
      toast({ title: "Save failed", description: pErr.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    if (isTutor) {
      const data = { user_id: user.id, bio, subjects, hourly_rate: Number(hourlyRate) || 0 };
      const { error: tErr } = hasTutorProfile
        ? await supabase.from("tutor_profiles").update(data).eq("user_id", user.id)
        : await supabase.from("tutor_profiles").insert(data);
      if (tErr) {
        toast({ title: "Tutor profile failed", description: tErr.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      setHasTutorProfile(true);
    }
    setSaving(false);
    toast({ title: "Profile saved" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const initial = (fullName || "U")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
              <UserCog className="h-3.5 w-3.5" /> Profile settings
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">Edit your profile</h1>
            <p className="text-muted-foreground mt-1">Personalize how you appear to students and tutors.</p>
          </div>

          <Card className="border-border/60 shadow-card">
            <CardHeader><CardTitle className="font-display">Public profile</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 ring-2 ring-border">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
                  <AvatarFallback className="gradient-primary text-primary-foreground font-display text-2xl">{initial}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatarChange} />
                  <Button variant="outline" size="sm" onClick={onPickAvatar} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    {uploading ? "Uploading…" : "Change avatar"}
                  </Button>
                  <p className="text-xs text-muted-foreground">PNG or JPG, up to 5MB.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </div>

              <div className="space-y-2 max-w-xs">
                <Label>Account role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="tutor">Tutor</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Tutors and Both can offer sessions.</p>
              </div>
            </CardContent>
          </Card>

          {isTutor && (
            <Card className="border-border/60 shadow-card">
              <CardHeader>
                <CardTitle className="font-display">Tutor details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} placeholder="Tell students about your experience, teaching style, and what subjects you love…" />
                </div>

                <div className="space-y-2">
                  <Label>Subjects you teach</Label>
                  <div className="flex gap-2">
                    <Input
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubject(); } }}
                      placeholder="e.g. Calculus"
                    />
                    <Button type="button" variant="outline" onClick={addSubject}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {subjects.length === 0 && <p className="text-xs text-muted-foreground">No subjects yet.</p>}
                    {subjects.map((s) => (
                      <Badge key={s} variant="secondary" className="gap-1 pr-1">
                        {s}
                        <button onClick={() => removeSubject(s)} className="rounded-full hover:bg-muted p-0.5" aria-label={`Remove ${s}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-w-xs">
                  <Label>Hourly rate (USD)</Label>
                  <Input type="number" min="0" step="1" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="25" />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="gradient-cta text-primary-foreground border-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}