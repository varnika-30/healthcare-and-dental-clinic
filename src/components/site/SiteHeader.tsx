import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { ToothIcon } from "@/components/ui/ToothIcon";
import { useState, useEffect } from "react";
import { BookAppointmentButton } from "./BookAppointmentChoice";

const nav = [
  { to: "/", hash: "hero", label: "Home" },
  { to: "/", hash: "contact", label: "Contact" },
  { to: "/", hash: "about", label: "About" },
  { to: "/", hash: "services", label: "Services" },
  { to: "/", hash: "doctors", label: "Doctors" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const routerState = useRouterState();
  const isHome = routerState.location.pathname === "/";
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    if (!isHome) return;

    const sections = ["hero", "contact", "about", "services", "doctors"];
    const elements = sections.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    const observerOptions = {
      root: null,
      rootMargin: "-120px 0px -50% 0px", // Account for the sticky header
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [isHome]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-24 max-w-[1600px] items-center justify-between px-8 sm:px-10">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold">
          <ToothIcon className="h-12 w-12 shrink-0 shadow-soft" />
          <span>Healthcare & Dental Clinic</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => {
            const isActive = isHome ? activeSection === n.hash : false;
            return (
              <Link
                key={n.hash}
                to={n.to}
                hash={n.hash}
                className={
                  isActive
                    ? "rounded-lg px-3 py-2 text-lg font-semibold text-foreground bg-accent"
                    : "rounded-lg px-3 py-2 text-lg font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                }
              >
                {n.label}
              </Link>
            );
          })}
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
                key={n.hash}
                to={n.to}
                hash={n.hash}
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
