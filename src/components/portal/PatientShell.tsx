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
  User,
  Menu,
  X,
} from "lucide-react";
import { ToothIcon } from "@/components/ui/ToothIcon";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/portal", label: "Overview", icon: LayoutDashboard },
  { to: "/portal/treatment", label: "Treatments", icon: Activity },
  { to: "/portal/prescriptions", label: "Prescriptions", icon: Pill },
  { to: "/portal/billing", label: "Billing", icon: Receipt },
  { to: "/portal/profile", label: "Profile", icon: User },
] as const;

function SidebarBrand() {
  return (
    <div className="flex h-20 items-center gap-2 border-b border-sidebar-border px-5">
      <ToothIcon className="h-11 w-11 shrink-0" />
      <div className="min-w-0">
        <p className="font-display text-lg font-bold leading-none">Healthcare & Dental Clinic</p>
        <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
          Patient portal
        </p>
      </div>
    </div>
  );
}

function SidebarNav({ pathname, onNavigate, items }: { pathname: string; onNavigate?: () => void; items: any[] }) {
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {items.map((it) => {
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
  const [isLinked, setIsLinked] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkLink() {
      if (!user) {
        setIsLinked(false);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to check patient link:", error);
      }
      setIsLinked(!!data);
      setLoading(false);
    }
    checkLink();
  }, [user]);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/30">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  const visibleNav = isLinked
    ? [...NAV]
    : NAV.filter((it) => it.to === "/portal/profile");

  const showVerificationPending = !isLinked && pathname !== "/portal/profile";

  return (
    <div className="flex h-screen bg-slate-50/40 font-sans antialiased text-slate-900 overflow-x-hidden relative w-full">
      {/* Permanent sidebar — xl+ desktop only */}
      <aside className="hidden w-76 shrink-0 flex-col border-r border-teal-950/10 bg-[#f4f9f9] text-slate-800 xl:flex h-full">
        <SidebarBrand />
        <SidebarNav pathname={pathname} items={visibleNav} />
        <div className="border-t border-teal-950/5 p-4">
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

      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-hidden">
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
              <ToothIcon className="h-9 w-9 shrink-0" />
              <span className="truncate font-display text-sm font-bold">Healthcare & Dental Clinic</span>
            </Link>
          </div>
          {isLinked && <NotificationButton />}
        </header>

        {/* Desktop top bar — xl+ (notifications + profile; no duplicate mobile chrome) */}
        <header className="sticky top-0 z-30 hidden h-20 shrink-0 items-center justify-end gap-3 border-b border-border bg-background/80 px-8 backdrop-blur xl:flex">
          {isLinked && <NotificationButton />}
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
              "fixed inset-y-0 left-0 flex w-76 flex-col border-r border-teal-950/10 bg-[#f4f9f9] text-slate-800 shadow-xl transition-transform duration-300 ease-out",
              drawerOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <SidebarBrand />
            <SidebarNav pathname={pathname} onNavigate={closeDrawer} items={visibleNav} />
            <div className="border-t border-teal-950/5 p-4">
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

        <main className="flex-1 flex flex-col overflow-y-auto w-full min-w-0 max-w-full overflow-x-hidden">
          <div className="p-6 md:p-8 xl:p-10 w-full mx-auto min-w-0 overflow-x-hidden max-w-none">
            {showVerificationPending ? (
              <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-amber-200 shadow-xs p-8 space-y-6 mt-10">
                <div className="flex items-center gap-3.5 text-amber-600">
                  <span className="p-2.5 rounded-xl bg-amber-50">
                    <Activity className="w-6 h-6 animate-pulse" />
                  </span>
                  <h2 className="text-xl font-bold tracking-tight">Verification Pending</h2>
                </div>
                <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                  <p className="font-semibold text-slate-800">
                    Your Patient Portal account is awaiting verification.
                  </p>
                  <p>
                    Your request has been sent to the clinic. Once the clinic verifies your identity and manually links your account, your appointments, treatments, prescriptions, and billing information will become available.
                  </p>
                  <p>
                    If this takes longer than expected, please contact the clinic at <strong className="text-slate-900">8369559331</strong> or visit us at:
                  </p>
                  <address className="not-italic bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl text-xs text-slate-500 font-medium">
                    Baba Sharan CHS, Plot 60/61, Sector 44, Seawoods, Navi Mumbai – 400706
                  </address>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
