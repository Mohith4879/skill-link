import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import Navbar from "@/components/layout/Navbar";
import { Star, Search, BookOpen, Users, SlidersHorizontal, X } from "lucide-react";

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
  const [subject, setSubject] = useState<string>("all");
  const [minRating, setMinRating] = useState<string>("0");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [maxPrice, setMaxPrice] = useState<number>(100);

  useEffect(() => {
    const fetchTutors = async () => {
      const { data: tps } = await supabase
        .from("tutor_profiles")
        .select("*")
        .order("rating", { ascending: false });
      if (tps && tps.length > 0) {
        const userIds = tps.map((t) => t.user_id);
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds);
        const profMap = Object.fromEntries((profs || []).map((p) => [p.user_id, p]));
        setTutors(tps.map((t) => ({ ...t, profiles: profMap[t.user_id] || null })) as any);
      } else {
        setTutors([]);
      }
      setLoading(false);
    };
    fetchTutors();
  }, []);

  const filtered = tutors.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.subjects.some((s) => s.toLowerCase().includes(q)) ||
      (t.profiles?.full_name || "").toLowerCase().includes(q);
    const matchSubject = subject === "all" || t.subjects.includes(subject);
    const matchRating = Number(t.rating || 0) >= Number(minRating);
    const matchPrice = Number(t.hourly_rate || 0) <= maxPrice;
    return matchSearch && matchSubject && matchRating && matchPrice;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "price_low":  return Number(a.hourly_rate || 0) - Number(b.hourly_rate || 0);
      case "price_high": return Number(b.hourly_rate || 0) - Number(a.hourly_rate || 0);
      case "reviews":    return (b.total_ratings || 0) - (a.total_ratings || 0);
      case "rating":
      default:           return Number(b.rating || 0) - Number(a.rating || 0);
    }
  });

  const allSubjects = Array.from(new Set(tutors.flatMap((t) => t.subjects))).sort();
  const filtersActive = subject !== "all" || minRating !== "0" || maxPrice < 100 || sortBy !== "rating";
  const resetFilters = () => { setSubject("all"); setMinRating("0"); setMaxPrice(100); setSortBy("rating"); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 gradient-hero" />
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display text-3xl md:text-5xl font-bold">
              Find Your Perfect <span className="gradient-text">Tutor</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Browse {tutors.length || "our"} peer tutors and book a session that fits your schedule.
            </p>
            <div className="relative mt-6 max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 rounded-xl bg-card shadow-soft border-border/60 focus-visible:ring-primary/40"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
        {/* Filters */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4 p-4 rounded-2xl border border-border/60 bg-card shadow-soft">
          <div className="flex items-center gap-2 text-sm font-medium shrink-0">
            <SlidersHorizontal className="h-4 w-4 text-primary" /> Filters
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1 w-full">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {allSubjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Min rating</label>
              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any</SelectItem>
                  <SelectItem value="3">3.0+</SelectItem>
                  <SelectItem value="4">4.0+</SelectItem>
                  <SelectItem value="4.5">4.5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <label className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                <span>Max price</span>
                <span className="font-semibold text-foreground">${maxPrice}/hr</span>
              </label>
              <Slider value={[maxPrice]} onValueChange={(v) => setMaxPrice(v[0])} min={0} max={100} step={5} className="mt-3" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sort by</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="reviews">Most reviewed</SelectItem>
                  <SelectItem value="price_low">Price: low to high</SelectItem>
                  <SelectItem value="price_high">Price: high to low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="shrink-0 h-9">
              <X className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No tutors match your filters. {filtersActive && (
                <button onClick={resetFilters} className="text-primary hover:underline">Clear filters</button>
              )}
            </p>
          </div>
        ) : (
          <>
          <p className="text-sm text-muted-foreground mb-4">{sorted.length} {sorted.length === 1 ? "tutor" : "tutors"} found</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              >
                <Link to={`/tutor/${t.user_id}`}>
                  <Card className="group h-full overflow-hidden border-border/60 transition-smooth hover:shadow-elevated hover:-translate-y-1 hover:border-primary/30">
                    <div className="h-2 gradient-primary" />
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl gradient-primary text-primary-foreground font-display font-bold text-xl shadow-soft transition-smooth group-hover:scale-105">
                          {(t.profiles?.full_name || "T")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display font-semibold truncate text-lg">{t.profiles?.full_name || "Tutor"}</h3>
                          <div className="mt-1 flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            <span className="font-medium">{Number(t.rating).toFixed(1)}</span>
                            <span className="text-muted-foreground">({t.total_ratings})</span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{t.bio || "No bio yet"}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5 min-h-[1.5rem]">
                        {t.subjects.slice(0, 4).map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs font-medium">{s}</Badge>
                        ))}
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                        <div>
                          {t.hourly_rate > 0 ? (
                            <>
                              <p className="text-xs text-muted-foreground">From</p>
                              <p className="font-display font-bold gradient-text text-lg">${Number(t.hourly_rate).toFixed(0)}<span className="text-xs text-muted-foreground font-normal">/hr</span></p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground flex items-center gap-1"><BookOpen className="h-4 w-4"/>Free</p>
                          )}
                        </div>
                        <Button size="sm" className="gradient-cta text-primary-foreground border-0 transition-smooth group-hover:shadow-glow">
                          Book Session
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
