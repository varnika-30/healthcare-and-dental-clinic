import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar, Users, Receipt, Activity, Pill, FileText, Clock, TrendingUp, Stethoscope, UserCheck,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Lumident" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { role, user, loading } = useAuth();
  const name = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "there";

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground capitalize">{role ?? (loading ? "…" : "patient")} portal</p>
          <h1 className="font-display text-3xl font-bold">Hi, {name} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's happening at the clinic today.</p>
        </div>
        <Button className="bg-primary-gradient">New appointment</Button>
      </div>

      {role === "patient" && <PatientView />}
      {role === "doctor" && <DoctorView />}
      {role === "receptionist" && <ReceptionView />}
      {role === "admin" && <AdminView />}
      {!role && <PatientView />}
    </DashboardShell>
  );
}

/* ===== PATIENT ===== */
function PatientView() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Calendar} label="Upcoming" value="2" hint="Next: Tue, May 26" />
        <StatCard icon={Pill} label="Active scripts" value="1" hint="Amoxicillin 500mg" />
        <StatCard icon={Receipt} label="Open balance" value="$120" hint="Due in 14 days" />
        <StatCard icon={Activity} label="Last visit" value="Apr 12" hint="Cleaning · Dr. Kim" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Upcoming appointments</h3>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          <div className="space-y-3">
            {[
              { d: "Tue · May 26", t: "10:30 AM", doc: "Dr. Aisha Rahman", svc: "Aligner check-in" },
              { d: "Mon · Jun 09", t: "2:00 PM", doc: "Dr. Sara Kim", svc: "Whitening session" },
            ].map((a) => (
              <div key={a.t} className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{a.svc}</p>
                    <p className="text-xs text-muted-foreground">{a.doc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{a.d}</p>
                  <p className="text-xs text-muted-foreground">{a.t}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-semibold">Notifications</h3>
          <div className="space-y-3 text-sm">
            {[
              ["Reminder", "Whitening session in 2 days"],
              ["Invoice", "Receipt for cleaning is ready"],
              ["Tip", "Floss daily — keep that streak going!"],
            ].map(([t, m]) => (
              <div key={t} className="rounded-xl border border-border/60 p-3">
                <p className="text-xs font-semibold uppercase text-primary">{t}</p>
                <p className="mt-1">{m}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ===== DOCTOR ===== */
function DoctorView() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Calendar} label="Today's visits" value="8" hint="2 completed" />
        <StatCard icon={Users} label="Active patients" value="146" />
        <StatCard icon={Pill} label="Pending scripts" value="3" />
        <StatCard icon={Clock} label="Avg. duration" value="32m" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-2">
          <h3 className="mb-4 font-display text-lg font-semibold">Today's schedule</h3>
          <div className="space-y-2">
            {[
              { t: "09:00", p: "James Lin", s: "Cleaning", st: "Done" },
              { t: "09:45", p: "Priya Sharma", s: "Aligner check", st: "Done" },
              { t: "10:30", p: "Emma Reyes", s: "Whitening", st: "In room" },
              { t: "11:15", p: "Owen Park", s: "Consultation", st: "Upcoming" },
              { t: "13:30", p: "Lina Chen", s: "Root canal pt.2", st: "Upcoming" },
            ].map((r) => (
              <div key={r.t} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <p className="w-14 font-mono text-sm font-medium">{r.t}</p>
                  <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary-soft text-xs text-primary">{r.p.split(" ").map(x=>x[0]).join("")}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-medium">{r.p}</p>
                    <p className="text-xs text-muted-foreground">{r.s}</p>
                  </div>
                </div>
                <Badge variant={r.st === "Done" ? "secondary" : r.st === "In room" ? "default" : "outline"} className={r.st==="In room" ? "bg-primary text-primary-foreground" : ""}>{r.st}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-semibold">Tasks</h3>
          <div className="space-y-3 text-sm">
            {[
              "Sign off on 3 prescriptions",
              "Review X-ray for Priya S.",
              "Confirm Friday availability",
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                <span className="h-2 w-2 rounded-full bg-primary" /> {t}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ===== RECEPTION ===== */
function ReceptionView() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={UserCheck} label="Checked in" value="12" hint="4 in waiting" />
        <StatCard icon={Calendar} label="Today's bookings" value="38" />
        <StatCard icon={Receipt} label="Invoices issued" value="22" hint="$4,820" />
        <StatCard icon={Stethoscope} label="Walk-ins" value="3" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-2">
          <h3 className="mb-4 font-display text-lg font-semibold">Waiting room</h3>
          <div className="space-y-2">
            {[
              { p: "Emma Reyes", t: "Arrived 10:22", doc: "Dr. Rahman", st: "Ready" },
              { p: "Owen Park", t: "Arrived 10:35", doc: "Dr. Kim", st: "Waiting" },
              { p: "Lina Chen", t: "Arrived 10:41", doc: "Dr. Bellini", st: "Waiting" },
              { p: "Marco Hill", t: "Walk-in 10:50", doc: "Any", st: "New" },
            ].map((r) => (
              <div key={r.p} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary-soft text-xs text-primary">{r.p.split(" ").map(x=>x[0]).join("")}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-medium">{r.p}</p>
                    <p className="text-xs text-muted-foreground">{r.t} · {r.doc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.st === "Ready" ? "default" : "secondary"} className={r.st==="Ready" ? "bg-primary text-primary-foreground" : ""}>{r.st}</Badge>
                  <Button size="sm" variant="outline">Call in</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-semibold">Quick actions</h3>
          <div className="space-y-2">
            <Button className="w-full justify-start bg-primary-gradient"><Calendar className="mr-2 h-4 w-4" />New appointment</Button>
            <Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4" />Register walk-in</Button>
            <Button variant="outline" className="w-full justify-start"><Receipt className="mr-2 h-4 w-4" />Generate invoice</Button>
            <Button variant="outline" className="w-full justify-start"><FileText className="mr-2 h-4 w-4" />Print summary</Button>
          </div>
        </Card>
      </div>
    </>
  );
}

/* ===== ADMIN ===== */
function AdminView() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={TrendingUp} label="Revenue (MTD)" value="$48,210" accent="+12.4% vs last month" />
        <StatCard icon={Users} label="Patients" value="1,284" hint="+34 this month" />
        <StatCard icon={Calendar} label="Appointments" value="412" hint="this month" />
        <StatCard icon={Stethoscope} label="Active staff" value="18" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-2">
          <h3 className="mb-4 font-display text-lg font-semibold">Revenue last 7 days</h3>
          <div className="flex h-56 items-end gap-3">
            {[40, 65, 50, 80, 72, 95, 88].map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-xl bg-primary-gradient transition hover:opacity-90" style={{ height: `${v}%` }} />
                <span className="text-xs text-muted-foreground">{["M","T","W","T","F","S","S"][i]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-semibold">Top services</h3>
          <div className="space-y-3 text-sm">
            {[
              ["Cleaning", 38, "$3,420"],
              ["Whitening", 24, "$7,160"],
              ["Implants", 9, "$16,200"],
              ["Root canal", 12, "$7,800"],
            ].map(([s, n, r]) => (
              <div key={s as string}>
                <div className="flex justify-between"><span className="font-medium">{s}</span><span className="text-muted-foreground">{r}</span></div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-secondary"><div className="h-full rounded-full bg-primary-gradient" style={{ width: `${(n as number) * 2}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
