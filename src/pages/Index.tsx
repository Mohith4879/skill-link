import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import {
  BookOpen, Users, Star, Clock, Search, GraduationCap,
  ArrowRight, CheckCircle2, Sparkles, TrendingUp,
} from "lucide-react";
import heroImg from "@/assets/hero-illustration.png";

const features = [
  { icon: Search, title: "Find Tutors Instantly", desc: "Browse verified peer tutors filtered by subject, rating, and availability." },
  { icon: Clock, title: "Flexible Scheduling", desc: "Book sessions that fit your schedule with simple time-slot selection." },
  { icon: Star, title: "Trusted Reviews", desc: "Pick the best tutors based on real student ratings and feedback." },
  { icon: Users, title: "Peer-to-Peer", desc: "Learn from students who excel in the subjects you need help with." },
  { icon: GraduationCap, title: "Become a Tutor", desc: "Share your expertise, set your rate, and earn while helping others." },
  { icon: BookOpen, title: "Track Progress", desc: "Monitor sessions, bookings, and your personal learning journey." },
];

const stats = [
  { value: "500+", label: "Active Tutors" },
  { value: "10k+", label: "Sessions Booked" },
  { value: "4.9", label: "Avg. Rating" },
  { value: "50+", label: "Subjects Covered" },
];

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 gradient-hero" />
        <div className="absolute -top-24 -left-24 -z-10 h-96 w-96 rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div className="absolute top-32 -right-24 -z-10 h-96 w-96 rounded-full bg-secondary/15 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />

        <div className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Peer-to-peer learning, reimagined
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
                Find the Perfect{" "}
                <span className="gradient-text">Tutor</span> for Your Success
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
                Connect with vetted peer tutors, book affordable study sessions, and accelerate
                your learning — all in one beautifully simple platform.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/tutors">
                  <Button size="lg" className="gradient-cta text-primary-foreground border-0 shadow-soft hover:shadow-glow transition-smooth px-8 group">
                    Get Started
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="px-8 hover:bg-muted transition-smooth">
                    Become a Tutor
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["No credit card required", "Free to join", "Cancel anytime"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {t}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 gradient-primary opacity-20 blur-3xl rounded-full" />
              <img
                src={heroImg}
                alt="Online tutoring illustration"
                width={1024}
                height={1024}
                className="relative w-full max-w-lg mx-auto animate-float"
              />
              {/* Floating cards */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute top-8 -left-2 md:left-4 bg-card shadow-elevated rounded-2xl p-3 flex items-center gap-3 border border-border/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Star className="h-5 w-5 fill-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Rating</p>
                  <p className="font-bold text-sm">4.9 / 5.0</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-8 -right-2 md:right-4 bg-card shadow-elevated rounded-2xl p-3 flex items-center gap-3 border border-border/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                  <p className="font-bold text-sm">10,000+</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center"
              >
                <p className="font-display text-3xl md:text-4xl font-extrabold gradient-text">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div {...fadeInUp} className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold">Why students choose Skill-Link</h2>
            <p className="mt-4 text-muted-foreground">Everything you need to learn smarter, faster, and with people who get it.</p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <Card className="group h-full border-border/60 transition-smooth hover:shadow-elevated hover:-translate-y-1 hover:border-primary/30">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-soft transition-smooth group-hover:scale-110 group-hover:shadow-glow">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <motion.div
            {...fadeInUp}
            className="relative overflow-hidden rounded-3xl gradient-cta px-8 py-16 md:py-20 text-center shadow-elevated"
          >
            <div className="absolute -top-12 -left-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">
                Ready to start learning?
              </h2>
              <p className="mt-4 text-primary-foreground/85 max-w-xl mx-auto">
                Join thousands of students already using Skill-Link to ace their studies.
              </p>
              <Link to="/auth">
                <Button size="lg" className="mt-8 bg-background text-foreground hover:bg-background/90 px-10 shadow-soft transition-smooth">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-7xl px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground">Skill-Link</span>
          </div>
          <p>© 2026 Skill-Link. Learn together, grow together.</p>
        </div>
      </footer>
    </div>
  );
}
