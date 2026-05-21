import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateMyPatient } from "@/lib/patient";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Pill } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/portal/prescriptions")({
  head: () => ({ meta: [{ title: "Prescriptions — Lumident" }] }),
  component: PortalRx,
});

function PortalRx() {
  const q = useQuery({
    queryKey: ["my-rx"],
    queryFn: async () => {
      const patient = await getOrCreateMyPatient();
      if (!patient) return null;
      const { data: rx } = await supabase.from("prescriptions").select("*")
        .eq("patient_id", patient.id).order("issued_at", { ascending: false });
      const { data: items } = await supabase.from("prescription_items").select("*")
        .in("prescription_id", (rx ?? []).map((r) => r.id).length ? (rx ?? []).map((r) => r.id) : ["00000000-0000-0000-0000-000000000000"]);
      return { rx: rx ?? [], items: items ?? [] };
    },
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Prescriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">All your prescriptions, signed by your dentist.</p>
      </div>
      {q.isLoading ? <Card className="p-8 text-center text-sm text-muted-foreground">Loading…</Card>
        : q.data?.rx.length ? (
          <div className="space-y-4">
            {q.data.rx.map((r) => {
              const items = q.data!.items.filter((i) => i.prescription_id === r.id);
              return (
                <Card key={r.id} className="rounded-2xl border-border/60 p-6 shadow-soft">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{r.diagnosis || "Prescription"}</h3>
                      <p className="text-xs text-muted-foreground">Issued {format(new Date(r.issued_at), "MMM d, yyyy")}</p>
                    </div>
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  {items.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {items.map((i) => (
                        <div key={i.id} className="rounded-xl border border-border/60 p-3">
                          <p className="font-medium">{i.medication} <span className="text-sm text-muted-foreground">{i.dosage}</span></p>
                          <p className="text-xs text-muted-foreground">{i.frequency} {i.duration && `· ${i.duration}`}</p>
                          {i.instructions && <p className="mt-1 text-xs">{i.instructions}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {r.notes && <p className="mt-3 text-sm text-muted-foreground">{r.notes}</p>}
                </Card>
              );
            })}
          </div>
        ) : <Empty icon={Pill} title="No prescriptions yet" />}
    </>
  );
}
