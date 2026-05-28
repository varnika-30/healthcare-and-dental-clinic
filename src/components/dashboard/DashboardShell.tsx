import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Bell,
  LogOut,
  Stethoscope,
  ClipboardList,
  Menu,
  UserCircle,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV: Record<"doctor", { to: string; label: string; icon: LucideIcon }[]> = {
  doctor: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/appointments", label: "Appointments", icon: Calendar },
    { to: "/admin/patients", label: "Patients", icon: Users },
    { to: "/admin/ongoing-treatments", label: "Ongoing Treatments", icon: ClipboardList },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
    { to: "/admin/profile", label: "Profile", icon: UserCircle },
  ],
};

function DashboardSidebarBrand({ role }: { role: string | null }) {
  return (
    <div className="flex h-20 items-center gap-3.5 border-b border-teal-950/5 px-6">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-600 text-white shadow-2xs">
        <Stethoscope className="h-5.5 w-5.5" />
      </span>
      <div className="min-w-0">
        <p className="font-sans text-base font-bold tracking-tight text-slate-900">Lumident</p>
        <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700/80 mt-0.5">
          {role ?? "staff"} portal
        </p>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { role, user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const staffRole = "doctor";
  const items = NAV[staffRole];

  const initials = (user?.user_metadata?.full_name ?? user?.email ?? "U")
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Route path changes automatically dismiss mobile drawers
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Handle explicit background scrolling locks on active mobile layers
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  const sidebarNav = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
      {items.map((it) => {
        const active = pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3.5 rounded-xl px-4 py-3 text-[15px] font-bold tracking-tight whitespace-nowrap transition-all duration-200",
              active
                ? "bg-teal-600 text-white shadow-xs font-bold"
                : "text-slate-800 hover:bg-teal-600/5 hover:text-slate-900",
            )}
          >
            <it.icon
              className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                active ? "text-white" : "text-slate-700",
              )}
            />{" "}
            {it.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-slate-50/40 font-sans antialiased text-slate-900 overflow-x-hidden relative w-full">
      {/* DESKTOP PERMANENT SIDEBAR - PREMIUM TEAL-TINTED BACKGROUND SURFACE */}
      <aside className="hidden w-76 shrink-0 flex-col border-r border-teal-950/10 bg-[#f4f9f9] text-slate-800 xl:flex h-full">
        <DashboardSidebarBrand role={role} />
        {sidebarNav()}
        <div className="border-t border-teal-950/5 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start gap-3.5 text-[15px] font-bold text-slate-800 hover:bg-teal-600/5 hover:text-slate-900 rounded-xl py-5 px-4"
          >
            <LogOut className="h-5 w-5 text-slate-700" /> Sign out
          </Button>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN VIEW WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-hidden">
        {/* MOBILE TOPBAR ACCORDING TO BREAKPOINTS UNDER XL */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 xl:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-600 text-white shadow-xs">
                <Stethoscope className="h-5 w-5" />
              </span>
              <span className="truncate font-sans text-base font-bold tracking-tight text-slate-900">
                Lumident
              </span>
            </Link>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-slate-800 hover:bg-slate-50"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((open) => !open)}
          >
            {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {/* DESKTOP EXCLUSIVE VIEWPORT TOPBAR CONTROL LAYER */}
        <header className="sticky top-0 z-30 hidden h-20 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-8 backdrop-blur-sm xl:flex w-full">
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <Input
              placeholder="Search patients, appointments, invoices…"
              className="max-w-md bg-slate-50/80 border-slate-300 placeholder:text-slate-500 text-slate-900 focus:bg-white focus:border-teal-500 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              <Bell className="h-5 w-5" />
              <Badge className="absolute -right-0.5 -top-0.5 h-5 min-w-5 rounded-full bg-teal-600 text-white p-0 px-1 text-[10px] font-bold flex items-center justify-center">
                3
              </Badge>
            </Button>
            <Avatar className="h-9 w-9 border border-slate-200 shadow-3xs">
              <AvatarFallback className="bg-teal-50 text-teal-950 font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
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
              "absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300",
              drawerOpen ? "opacity-100" : "opacity-0",
            )}
            aria-label="Close menu"
            onClick={closeDrawer}
          />
          <aside
            className={cn(
              "fixed inset-y-0 left-0 flex w-76 flex-col border-r border-teal-950/10 bg-[#f4f9f9] text-slate-800 shadow-xl transition-transform duration-300 ease-out",
              drawerOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <DashboardSidebarBrand role={role} />
            {sidebarNav(closeDrawer)}
            <div className="border-t border-teal-950/5 p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  closeDrawer();
                  signOut();
                }}
                className="w-full justify-start gap-3.5 text-[15px] font-bold text-slate-800 hover:bg-teal-600/5 hover:text-slate-900 rounded-xl py-5 px-4"
              >
                <LogOut className="h-5 w-5 text-slate-700" /> Sign out
              </Button>
            </div>
          </aside>
        </div>

        {/* CENTRAL APPLICATION CANVAS FLUID LAYER */}
        <main className="flex-1 flex flex-col overflow-y-auto w-full min-w-0 max-w-full overflow-x-hidden">
          <div className="p-6 md:p-8 xl:p-10 w-full mx-auto min-w-0 max-w-[1600px] overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
