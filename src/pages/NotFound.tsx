import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Compass, Home, ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 gradient-hero opacity-60" />
        <div className="mx-auto max-w-2xl px-4 md:px-6 py-20 md:py-28 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary text-primary-foreground shadow-elevated">
            <Compass className="h-10 w-10" />
          </div>
          <p className="font-display text-7xl md:text-8xl font-bold gradient-text leading-none">404</p>
          <h1 className="mt-4 font-display text-2xl md:text-3xl font-bold">Page not found</h1>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            The page <span className="font-mono text-foreground/80">{location.pathname}</span> doesn't exist or may have been moved.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" /> Go back
            </Button>
            <Link to="/">
              <Button className="gradient-cta text-primary-foreground border-0">
                <Home className="h-4 w-4" /> Return home
              </Button>
            </Link>
            <Link to="/tutors">
              <Button variant="ghost">Browse tutors</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
