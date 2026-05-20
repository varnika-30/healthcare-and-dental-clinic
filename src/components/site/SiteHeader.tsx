import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Menu, X, Stethoscope } from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/doctors", label: "Doctors" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-gradient text-primary-foreground shadow-soft">
            <Stethoscope className="h-5 w-5" />
          </span>
          <span>Lumident</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "rounded-lg px-3 py-2 text-sm font-semibold text-foreground bg-accent" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm"><Link to="/auth/login">Sign in</Link></Button>
          <Button asChild size="sm" className="bg-primary-gradient shadow-soft">
            <Link to="/book">Book appointment</Link>
          </Button>
        </div>
        <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="space-y-1 px-4 py-3">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                {n.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" className="flex-1"><Link to="/auth/login">Sign in</Link></Button>
              <Button asChild className="flex-1 bg-primary-gradient"><Link to="/book">Book</Link></Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
