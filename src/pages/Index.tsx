import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Star, Clock, Search, GraduationCap } from "lucide-react";

const features = [
  { icon: Search, title: "Find Tutors", desc: "Browse peer tutors by subject, rating, and availability." },
  { icon: Clock, title: "Flexible Scheduling", desc: "Book sessions that fit your schedule with easy time-slot selection." },
  { icon: Star, title: "Ratings & Reviews", desc: "Choose the best tutors based on real student feedback." },
  { icon: Users, title: "Peer-to-Peer", desc: "Learn from fellow students who excel in the subjects you need." },
  { icon: GraduationCap, title: "Become a Tutor", desc: "Share your knowledge and earn by helping others learn." },
  { icon: BookOpen, title: "Track Progress", desc: "Monitor your sessions, bookings, and learning journey." },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <GraduationCap className="h-7 w-7" /> Skill-Link
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/tutors">
              <Button variant="ghost" size="sm">Browse Tutors</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Learn Together, <span className="text-primary">Grow Together</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Connect with peer tutors, book affordable study sessions, and accelerate your learning journey — all in one platform.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/tutors">
              <Button size="lg" className="px-8 text-base">Find a Tutor</Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="px-8 text-base">Become a Tutor</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Why Skill-Link?</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="group transition-all hover:shadow-lg hover:-translate-y-1">
                <CardContent className="flex flex-col items-start gap-3 p-6">
                  <div className="rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to start learning?</h2>
          <p className="mt-4 text-muted-foreground">Join hundreds of students already using Skill-Link to excel in their studies.</p>
          <Link to="/auth">
            <Button size="lg" className="mt-8 px-10">Get Started Free</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          © 2026 Skill-Link. Learn Together, Grow Together.
        </div>
      </footer>
    </div>
  );
}
