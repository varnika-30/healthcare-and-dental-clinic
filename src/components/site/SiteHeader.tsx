import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Menu, X, Stethoscope } from "lucide-react";
import { useState } from "react";
import { BookAppointmentButton } from "./BookAppointmentChoice";

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
      <div className="mx-auto flex h-24 max-w-[1600px] items-center justify-between px-8 sm:px-10">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-gradient text-primary-foreground shadow-soft">
            <Stethoscope className="h-7 w-7" />
          </span>
          <span>Lumident</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-lg px-3 py-2 text-lg font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{
                className: "rounded-lg px-3 py-2 text-lg font-semibold text-foreground bg-accent",
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="lg" className="px-5 py-3 text-lg">
            <Link to="/auth/login" search={{ redirect: undefined }}>
              Sign in
            </Link>
          </Button>
          <BookAppointmentButton
            size="lg"
            className="bg-primary-gradient px-6 py-3 text-lg shadow-soft"
          >
            Book appointment
          </BookAppointmentButton>
        </div>
        <button
          className="rounded-lg p-2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="space-y-1 px-4 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-lg font-medium hover:bg-accent"
              >
                {n.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" size="lg" className="flex-1">
                <Link to="/auth/login" search={{ redirect: undefined }}>
                  Sign in
                </Link>
              </Button>
              <BookAppointmentButton size="lg" className="flex-1 bg-primary-gradient">
                Book
              </BookAppointmentButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
