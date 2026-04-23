import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Star, Users, ArrowLeft, ArrowRight } from "lucide-react";
import { subjectToSlug } from "@/lib/subjects";

interface TutorRow {
  user_id: string;
  bio: string;
  hourly_rate: number;
  rating: number;
  total_ratings: number;
  subjects: string[];
  full_name: string;
  avatar_url: string | null;
}

export default function SubjectDetail() {
  const { slug = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [subjectName, setSubjectName] = useState<string | null>(null);
  const [tutors, setTutors] = useState<TutorRow[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("tutor_profiles")
        .select("user_id, bio, hourly_rate, rating, total_ratings, subjects")
        .order("rating", { ascending: false });
      const matching = (data || []).filter((tp: any) =>
        (tp.subjects || []).some((s: string) => subjectToSlug(s) === slug)
      );
      const matchedName = matching
        .flatMap((tp: any) => tp.subjects)
        .find((s: string) => subjectToSlug(s) === slug) || null;
      setSubjectName(matchedName);

      const ids = matching.map((m: any) => m.user_id);
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids)
        : { data: [] as any[] };
      const pm = Object.fromEntries((profs || []).map((p: any) => [p.user_id, p]));
      setTutors(matching.map((m: any) => ({ ...m, full_name: pm[m.user_id]?.full_name || "Tutor", avatar_url: pm[m.user_id]?.avatar_url || null })));
      setLoading(false);
    })();
  }, [slug]);

  const pageTitle = subjectName ? `${subjectName} Tutors | Skill-Link` : "Subject | Skill-Link";
  const description = subjectName
    ? `Find top-rated peer tutors for ${subjectName}. Compare ${tutors.length} tutor${tutors.length === 1 ? "" : "s"} by rating and price, and book a session in minutes.`
    : "Browse expert peer tutors on Skill-Link.";

  const ldJson = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: subjectName ? `${subjectName} tutors` : "Tutors",
    itemListElement: tutors.slice(0, 50).map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Person",
        name: t.full_name,
        url: `/tutor/${t.user_id}`,
        ...(t.total_ratings > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(t.rating || 0).toFixed(1),
            reviewCount: t.total_ratings,
          },
        }),
      },
    })),
  }), [subjectName, tutors]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`/subjects/${slug}`} />
        <script type="application/ld+json">{JSON.stringify(ldJson)}</script>
      </Helmet>
      <Navbar />

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 gradient-hero" />
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
          <Link to="/subjects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-4">
            <ArrowLeft className="h-4 w-4" /> All subjects
          </Link>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
              <BookOpen className="h-3.5 w-3.5" /> Subject
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold">
              <span className="gradient-text">{subjectName || slug}</span> tutors
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl">
              {tutors.length} verified peer tutor{tutors.length === 1 ? "" : "s"} ready to help you master {subjectName || "this subject"}.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : tutors.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold">No tutors yet for this subject</h2>
            <p className="text-muted-foreground mt-2">Check back soon — new tutors join regularly.</p>
            <Link to="/tutors"><Button className="mt-6 gradient-cta text-primary-foreground border-0">Browse all tutors</Button></Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tutors.map((t, i) => (
              <motion.div key={t.user_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.04 }}>
                <Link to={`/tutor/${t.user_id}`}>
                  <Card className="group h-full overflow-hidden border-border/60 transition-smooth hover:shadow-elevated hover:-translate-y-1 hover:border-primary/30">
                    <div className="h-2 gradient-primary" />
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl gradient-primary text-primary-foreground font-display font-bold text-xl shadow-soft overflow-hidden">
                          {t.avatar_url ? <img src={t.avatar_url} alt={t.full_name} className="h-full w-full object-cover" /> : t.full_name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display font-semibold truncate text-lg">{t.full_name}</h3>
                          <div className="mt-1 flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            <span className="font-medium">{Number(t.rating).toFixed(1)}</span>
                            <span className="text-muted-foreground">({t.total_ratings})</span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{t.bio || "No bio yet"}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {t.subjects.slice(0, 4).map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
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
                            <p className="text-sm text-muted-foreground">Free</p>
                          )}
                        </div>
                        <Button size="sm" className="gradient-cta text-primary-foreground border-0">
                          View <ArrowRight className="h-4 w-4" />
                        </Button>
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