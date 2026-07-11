import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { ToothIcon } from "@/components/ui/ToothIcon";
import { useState, useEffect } from "react";
import { BookAppointmentButton, BookAppointmentNavLink } from "./BookAppointmentChoice";

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
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
          className="rounded-lg w-11 h-11 flex items-center justify-center lg:hidden hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <>
          <div
            className="fixed inset-x-0 bottom-0 top-[96px] z-30 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 lg:hidden cursor-pointer"
            onClick={() => setOpen(false)}
          />
          <div className="border-t border-border bg-background lg:hidden relative z-40 w-full shadow-lg">
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
                <Button asChild variant="outline" size="lg" className="flex-1 rounded-xl h-11 cursor-pointer">
                  <Link to="/auth/login" search={{ redirect: undefined }} onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <BookAppointmentNavLink
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl bg-primary-gradient text-white flex items-center justify-center font-semibold text-lg py-3 px-4 shadow-soft h-11 cursor-pointer transition hover:opacity-90"
                >
                  Book
                </BookAppointmentNavLink>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
