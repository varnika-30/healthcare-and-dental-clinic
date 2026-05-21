import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateMyPatient } from "@/lib/patient";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Pill, Receipt, Activity, ChevronRight } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => ({ meta: [{ title: "Overview — Lumident" }] }),
  component: PortalHome,
});

function PortalHome() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "there";

  const q = useQuery({
    queryKey: ["portal-overview"],
    queryFn: async () => {
      const patient = await getOrCreateMyPatient();
      if (!patient) return null;
      const [appts, scripts, invoices, plans] = await Promise.all([
        supabase.from("appointments").select("*").eq("patient_id", patient.id)
          .gte("scheduled_at", new Date().toISOString()).order("scheduled_at").limit(5),
        supabase.from("prescriptions").select("*").eq("patient_id", patient.id).order("issued_at", { ascending: false }).limit(3),
        supabase.from("invoices").select("*").eq("patient_id", patient.id).eq("is_current", true),
        supabase.from("treatment_plans").select("*").eq("patient_id", patient.id).neq("status", "completed").limit(1),
      ]);
      return { patient, appts: appts.data ?? [], scripts: scripts.data ?? [], invoices: invoices.data ?? [], plans: plans.data ?? [] };
    },
  });

  const balance = q.data?.invoices.reduce((a, i) => a + Number(i.balance ?? 0), 0) ?? 0;
  const next = q.data?.appts[0];

  return (
    <>
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Patient portal</p>
        <h1 className="font-display text-3xl font-bold">Hi, {name} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your visits, treatments and bills.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Calendar} label="Upcoming" value={String(q.data?.appts.length ?? 0)}
          hint={next ? `Next: ${format(new Date(next.scheduled_at), "EEE, MMM d")}` : "Book your next visit"} />
        <StatCard icon={Pill} label="Active scripts" value={String(q.data?.scripts.length ?? 0)} />
        <StatCard icon={Receipt} label="Open balance" value={`$${balance.toFixed(2)}`} />
        <StatCard icon={Activity} label="Active plans" value={String(q.data?.plans.length ?? 0)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Upcoming appointments</h3>
            <Button asChild size="sm" variant="ghost"><Link to="/portal/appointments">View all <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
          {q.data?.appts.length ? (
            <div className="space-y-3">
              {q.data.appts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"><Calendar className="h-5 w-5" /></div>
                    <div>
                      <p className="font-medium">{a.service}</p>
                      <p className="text-xs text-muted-foreground capitalize">{a.status.replace("_", " ")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{format(new Date(a.scheduled_at), "EEE, MMM d")}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(a.scheduled_at), "p")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">No upcoming visits.</p>
              <Button asChild className="mt-3 bg-primary-gradient"><Link to="/portal/appointments">Request appointment</Link></Button>
            </div>
          )}
        </Card>
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-semibold">Reminders</h3>
          <div className="space-y-3 text-sm">
            {next && (
              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs font-semibold uppercase text-primary">Visit</p>
                <p className="mt-1">{next.service} on {format(new Date(next.scheduled_at), "MMM d, p")}</p>
              </div>
            )}
            {balance > 0 && (
              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs font-semibold uppercase text-primary">Billing</p>
                <p className="mt-1">Outstanding balance: ${balance.toFixed(2)}</p>
              </div>
            )}
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs font-semibold uppercase text-primary">Tip</p>
              <p className="mt-1">Floss daily — keep that streak going!</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
