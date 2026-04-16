import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Search, GraduationCap } from "lucide-react";

interface TutorWithProfile {
  id: string;
  user_id: string;
  subjects: string[];
  bio: string;
  hourly_rate: number;
  rating: number;
  total_ratings: number;
  profiles: { full_name: string; avatar_url: string | null } | null;
}

export default function Tutors() {
  const [tutors, setTutors] = useState<TutorWithProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      const { data } = await supabase
        .from("tutor_profiles")
        .select("*, profiles!tutor_profiles_user_id_fkey(full_name, avatar_url)")
        .order("rating", { ascending: false });
      setTutors((data as any) || []);
      setLoading(false);
    };
    fetchTutors();
  }, []);

  const filtered = tutors.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.subjects.some((s) => s.toLowerCase().includes(q)) ||
      (t.profiles?.full_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <GraduationCap className="h-7 w-7" /> Skill-Link
          </Link>
          <Link to="/auth"><Button size="sm">Sign In</Button></Link>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-bold">Find a Tutor</h1>
        <p className="mt-2 text-muted-foreground">Browse peer tutors and book a session</p>

        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="mt-12 text-center text-muted-foreground">Loading tutors...</div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 text-center text-muted-foreground">
            No tutors found. {tutors.length === 0 && "Be the first to become a tutor!"}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <Link key={t.id} to={`/tutor/${t.user_id}`}>
                <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                        {(t.profiles?.full_name || "T")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{t.profiles?.full_name || "Tutor"}</h3>
                        <div className="mt-1 flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{Number(t.rating).toFixed(1)}</span>
                          <span className="text-muted-foreground">({t.total_ratings})</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{t.bio || "No bio yet"}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.subjects.slice(0, 4).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                    {t.hourly_rate > 0 && (
                      <p className="mt-3 text-sm font-medium text-primary">${Number(t.hourly_rate).toFixed(0)}/hr</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
