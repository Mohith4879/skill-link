import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Users, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { subjectToSlug } from "@/lib/subjects";

type SubjectInfo = { name: string; tutorCount: number; avgRate: number };

export default function Subjects() {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tutor_profiles")
        .select("subjects, hourly_rate");
      const map = new Map<string, { count: number; rateSum: number }>();
      (data || []).forEach((row: any) => {
        const rate = Number(row.hourly_rate || 0);
        (row.subjects || []).forEach((s: string) => {
          const k = s.trim();
          if (!k) return;
          const cur = map.get(k) || { count: 0, rateSum: 0 };
          cur.count += 1;
          cur.rateSum += rate;
          map.set(k, cur);
        });
      });
      const list: SubjectInfo[] = Array.from(map.entries())
        .map(([name, v]) => ({ name, tutorCount: v.count, avgRate: v.count ? v.rateSum / v.count : 0 }))
        .sort((a, b) => b.tutorCount - a.tutorCount || a.name.localeCompare(b.name));
      setSubjects(list);
      setLoading(false);
    })();
  }, []);

  const filtered = subjects.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const ldJson = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Tutoring subjects on Skill-Link",
    itemListElement: subjects.slice(0, 50).map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      url: `/subjects/${subjectToSlug(s.name)}`,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Browse Tutoring Subjects | Skill-Link</title>
        <meta name="description" content="Explore every subject taught on Skill-Link. Find expert peer tutors across math, science, languages, programming and more." />
        <link rel="canonical" href="/subjects" />
        <script type="application/ld+json">{JSON.stringify(ldJson)}</script>
      </Helmet>
      <Navbar />

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 gradient-hero" />
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
              <BookOpen className="h-3.5 w-3.5" /> All subjects
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold">
              Browse <span className="gradient-text">subjects</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl">
              {subjects.length} {subjects.length === 1 ? "subject" : "subjects"} taught by peer tutors. Pick one to find your match.
            </p>
            <div className="relative mt-6 max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 rounded-xl bg-card shadow-soft border-border/60"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-20 text-muted-foreground">No subjects yet. Check back soon!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
              >
                <Link to={`/subjects/${subjectToSlug(s.name)}`}>
                  <Card className="group h-full border-border/60 transition-smooth hover:shadow-elevated hover:-translate-y-1 hover:border-primary/30">
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="font-display font-semibold text-lg truncate">{s.name}</h2>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" />{s.tutorCount} {s.tutorCount === 1 ? "tutor" : "tutors"}</Badge>
                          {s.avgRate > 0 && <span>~${s.avgRate.toFixed(0)}/hr avg</span>}
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground shadow-soft transition-smooth group-hover:scale-110">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}