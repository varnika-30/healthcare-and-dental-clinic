import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Calendar, Users, FileText, Receipt, Settings, Bell, LogOut, Stethoscope,
  ClipboardList, UserCog, BarChart3, Pill, ListChecks,
} from "lucide-react";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

const NAV: Record<Exclude<AppRole, "patient">, { to: string; label: string; icon: any }[]> = {
  doctor: [
    { to: "/dashboard", label: "Today", icon: LayoutDashboard },
    { to: "/dashboard/appointments", label: "Schedule", icon: Calendar },
    { to: "/dashboard/patients", label: "Patients", icon: Users },
    { to: "/dashboard/prescriptions", label: "Prescriptions", icon: Pill },
    { to: "/dashboard/records", label: "Treatment notes", icon: ClipboardList },
    { to: "/dashboard/settings", label: "Availability", icon: Settings },
  ],
  receptionist: [
    { to: "/dashboard", label: "Front desk", icon: LayoutDashboard },
    { to: "/dashboard/appointments", label: "Appointments", icon: Calendar },
    { to: "/dashboard/patients", label: "Patients", icon: Users },
    { to: "/dashboard/billing", label: "Billing", icon: Receipt },
    { to: "/dashboard/queue", label: "Queue", icon: ListChecks },
    { to: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/dashboard/appointments", label: "Appointments", icon: Calendar },
    { to: "/dashboard/patients", label: "Patients", icon: Users },
    { to: "/dashboard/staff", label: "Staff", icon: UserCog },
    { to: "/dashboard/billing", label: "Revenue", icon: BarChart3 },
    { to: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
};

export function DashboardShell({ children }: { children: ReactNode }) {
  const { role, user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const staffRole = (role && role !== "patient" ? role : "doctor") as "admin" | "doctor" | "receptionist";
  const items = NAV[staffRole];

  const initials = (user?.user_metadata?.full_name ?? user?.email ?? "U")
    .split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-gradient text-primary-foreground"><Stethoscope className="h-5 w-5" /></span>
          <div>
            <p className="font-display text-sm font-bold leading-none">Lumident</p>
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">{role ?? "patient"} portal</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {items.map((it) => {
            const active = pathname === it.to;
            return (
              <Link key={it.to} to={it.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft" : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}>
                <it.icon className="h-4 w-4" /> {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <div className="flex flex-1 items-center gap-3">
            <Input placeholder="Search patients, appointments, invoices…" className="max-w-md bg-secondary/60" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-primary p-0 px-1 text-[10px]">3</Badge>
            </Button>
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-primary-soft text-primary">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
