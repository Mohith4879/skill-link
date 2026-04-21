import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Tutors", to: "/tutors" },
  { label: "Dashboard", to: "/dashboard" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-smooth",
        scrolled
          ? "bg-background/85 backdrop-blur-lg shadow-soft border-b border-border/60"
          : "bg-background/60 backdrop-blur-sm border-b border-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-soft transition-smooth group-hover:scale-105">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-display font-bold gradient-text">Skill-Link</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-smooth",
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => { await signOut(); navigate("/"); }}
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          ) : (
            <>
              <Link to="/auth"><Button variant="ghost" size="sm">Sign In</Button></Link>
              <Link to="/auth">
                <Button size="sm" className="gradient-cta text-primary-foreground shadow-soft hover:shadow-glow transition-smooth border-0">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-smooth"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur animate-fade-in">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-muted transition-smooth"
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-border mt-2 pt-3 flex flex-col gap-2">
              {user ? (
                <Button variant="outline" onClick={async () => { await signOut(); navigate("/"); setOpen(false); }}>
                  Sign Out
                </Button>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/auth" onClick={() => setOpen(false)}>
                    <Button className="w-full gradient-cta text-primary-foreground border-0">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
