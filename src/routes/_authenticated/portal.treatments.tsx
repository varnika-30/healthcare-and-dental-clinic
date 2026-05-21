import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateMyPatient } from "@/lib/patient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Activity, CheckCircle2, Circle, Loader2, Download } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/portal/treatments")({
  head: () => ({ meta: [{ title: "Treatments — Lumident" }] }),
  component: PortalTreatments,
});

function PortalTreatments() {
  const q = useQuery({
    queryKey: ["my-treatments"],
    queryFn: async () => {
      const patient = await getOrCreateMyPatient();
      if (!patient) return null;
      const { data: plans } = await supabase.from("treatment_plans").select("*")
        .eq("patient_id", patient.id).order("created_at", { ascending: false });
      const { data: steps } = await supabase.from("treatment_steps").select("*")
        .in("plan_id", (plans ?? []).map((p) => p.id).length ? (plans ?? []).map((p) => p.id) : ["00000000-0000-0000-0000-000000000000"])
        .order("step_order");
      return { patient, plans: plans ?? [], steps: steps ?? [] };
    },
  });

  const handlePrint = () => window.print();

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">My treatments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your treatment roadmap and progress.</p>
        </div>
        <Button variant="outline" onClick={handlePrint}><Download className="mr-2 h-4 w-4" />Download summary</Button>
      </div>

      {q.isLoading ? <Card className="p-8 text-center text-sm text-muted-foreground">Loading…</Card>
        : q.data?.plans.length ? (
          <div className="space-y-6">
            {q.data.plans.map((plan) => {
              const ps = q.data!.steps.filter((s) => s.plan_id === plan.id);
              const done = ps.filter((s) => s.status === "completed").length;
              const pct = ps.length ? Math.round((done / ps.length) * 100) : 0;
              return (
                <Card key={plan.id} className="rounded-2xl border-border/60 p-6 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-semibold">{plan.title}</h3>
                      {plan.description && <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>}
                      {plan.started_at && <p className="mt-1 text-xs text-muted-foreground">Started {format(new Date(plan.started_at), "MMM d, yyyy")}</p>}
                    </div>
                    <Badge variant="outline" className="capitalize">{plan.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                      <span>{done} of {ps.length} steps completed</span><span>{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary-gradient transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  {ps.length > 0 && (
                    <ol className="mt-6 grid gap-3 md:grid-cols-5">
                      {ps.map((s, i) => {
                        const Icon = s.status === "completed" ? CheckCircle2 : s.status === "in_progress" ? Loader2 : Circle;
                        const color = s.status === "completed" ? "text-success" : s.status === "in_progress" ? "text-primary" : "text-muted-foreground";
                        return (
                          <li key={s.id} className="relative rounded-xl border border-border/60 p-3">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${color} ${s.status==="in_progress" ? "animate-spin" : ""}`} />
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Step {i + 1}</span>
                            </div>
                            <p className="mt-1 text-sm font-medium">{s.title}</p>
                            {s.due_at && <p className="mt-1 text-xs text-muted-foreground">Due {format(new Date(s.due_at), "MMM d")}</p>}
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Empty icon={Activity} title="No active treatments" description="Your doctor will create a treatment plan after your consultation." />
        )}
    </>
  );
}
