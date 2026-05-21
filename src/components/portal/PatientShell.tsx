import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Calendar, FileText, Receipt, Pill, Activity, Bell, LogOut, Stethoscope, Settings,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

const NAV = [
  { to: "/portal", label: "Overview", icon: LayoutDashboard },
  { to: "/portal/appointments", label: "Appointments", icon: Calendar },
  { to: "/portal/treatments", label: "Treatments", icon: Activity },
  { to: "/portal/prescriptions", label: "Prescriptions", icon: Pill },
  { to: "/portal/records", label: "Tooth history", icon: FileText },
  { to: "/portal/billing", label: "Billing", icon: Receipt },
  { to: "/portal/settings", label: "Settings", icon: Settings },
];

export function PatientShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const initials = (user?.user_metadata?.full_name ?? user?.email ?? "U")
    .split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-gradient text-primary-foreground"><Stethoscope className="h-5 w-5" /></span>
          <div>
            <p className="font-display text-sm font-bold leading-none">Lumident</p>
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Patient portal</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((it) => {
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-primary p-0 px-1 text-[10px]">·</Badge>
          </Button>
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-primary-soft text-primary">{initials}</AvatarFallback>
          </Avatar>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
