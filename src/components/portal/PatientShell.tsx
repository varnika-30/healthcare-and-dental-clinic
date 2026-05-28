import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Receipt,
  Pill,
  Activity,
  Bell,
  LogOut,
  Stethoscope,
  User,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/portal", label: "Overview", icon: LayoutDashboard },
  { to: "/portal/appointments", label: "Appointments", icon: Calendar },
  { to: "/portal/treatment", label: "Treatments", icon: Activity },
  { to: "/portal/prescriptions", label: "Prescriptions", icon: Pill },
  { to: "/portal/records", label: "Tooth history", icon: FileText },
  { to: "/portal/billing", label: "Billing", icon: Receipt },
  { to: "/portal/profile", label: "Profile", icon: User },
] as const;

function SidebarBrand() {
  return (
    <div className="flex h-20 items-center gap-2 border-b border-sidebar-border px-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-gradient text-primary-foreground">
        <Stethoscope className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-lg font-bold leading-none">Lumident</p>
        <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
          Patient portal
        </p>
      </div>
    </div>
  );
}

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {NAV.map((it) => {
        const active = pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3.5 text-base font-medium transition",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                : "text-sidebar-foreground hover:bg-sidebar-accent",
            )}
          >
            <it.icon className="h-5 w-5 shrink-0" /> {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NotificationButton() {
  return (
    <Link to="/portal/notifications">
      <Button variant="ghost" size="icon" className="relative transition hover:scale-105">
        <Bell className="h-5 w-5" />
        <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-primary p-0 px-1 text-[10px]">
          ·
        </Badge>
      </Button>
    </Link>
  );
}

export function PatientShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const initials = (user?.user_metadata?.full_name ?? user?.email ?? "U")
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      {/* Permanent sidebar — xl+ desktop only */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar xl:flex">
        <SidebarBrand />
        <SidebarNav pathname={pathname} />
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile / tablet top bar — below xl */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur xl:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((open) => !open)}
            >
              {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/portal" className="flex min-w-0 items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-gradient text-primary-foreground">
                <Stethoscope className="h-4 w-4" />
              </span>
              <span className="truncate font-display text-sm font-bold">Lumident</span>
            </Link>
          </div>
          <NotificationButton />
        </header>

        {/* Desktop top bar — xl+ (notifications + profile; no duplicate mobile chrome) */}
        <header className="sticky top-0 z-30 hidden h-20 shrink-0 items-center justify-end gap-3 border-b border-border bg-background/80 px-8 backdrop-blur xl:flex">
          <NotificationButton />
          <Link to="/portal/profile">
            <Avatar className="h-9 w-9 cursor-pointer border border-border transition hover:scale-105 hover:shadow-sm">
              <AvatarFallback className="bg-primary-soft text-primary">{initials}</AvatarFallback>
            </Avatar>
          </Link>
        </header>

        {/* Slide-in drawer — below xl */}
        <div
          className={cn(
            "fixed inset-0 z-50 xl:hidden",
            drawerOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
          aria-hidden={!drawerOpen}
        >
          <button
            type="button"
            className={cn(
              "absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300",
              drawerOpen ? "opacity-100" : "opacity-0",
            )}
            aria-label="Close menu"
            onClick={closeDrawer}
          />
          <aside
            className={cn(
              "fixed inset-y-0 left-0 flex w-72 max-w-[min(20rem,85vw)] flex-col border-r border-sidebar-border bg-sidebar shadow-xl transition-transform duration-300 ease-out",
              drawerOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <SidebarBrand />
            <SidebarNav pathname={pathname} onNavigate={closeDrawer} />
            <div className="border-t border-sidebar-border p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  closeDrawer();
                  signOut();
                }}
                className="w-full justify-start gap-2"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </div>
          </aside>
        </div>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6 xl:p-10">{children}</main>
      </div>
    </div>
  );
}
