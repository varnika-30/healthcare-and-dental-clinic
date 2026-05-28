import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateMyPatient } from "@/lib/patient";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { ToothChart } from "@/components/dashboard/ToothChart";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/portal/records")({
  head: () => ({ meta: [{ title: "Tooth history — Lumident" }] }),
  component: PortalRecords,
});

function PortalRecords() {
  const [sel, setSel] = useState<number | null>(null);
  const q = useQuery({
    queryKey: ["my-tooth"],
    queryFn: async () => {
      const patient = await getOrCreateMyPatient();
      if (!patient) return [];
      const { data } = await supabase
        .from("tooth_treatments")
        .select("*")
        .eq("patient_id", patient.id)
        .order("performed_at", { ascending: false });
      return data ?? [];
    },
  });

  const marks = (q.data ?? []).map((t) => ({
    tooth_number: t.tooth_number,
    status: t.status,
    procedure: t.procedure,
  }));
  const selectedHistory = sel ? (q.data ?? []).filter((t) => t.tooth_number === sel) : [];

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Tooth-wise history</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Click a tooth to see procedures and history.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-2">
          <ToothChart marks={marks} selected={sel} onSelect={setSel} />
        </Card>
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-semibold">
            {sel ? `Tooth ${sel}` : "Recent procedures"}
          </h3>
          {q.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (sel ? selectedHistory : (q.data ?? [])).length ? (
            <div className="space-y-3">
              {(sel ? selectedHistory : (q.data ?? [])).slice(0, 10).map((t) => (
                <div key={t.id} className="rounded-xl border border-border/60 p-3 text-sm">
                  <p className="font-medium">
                    Tooth {t.tooth_number} · {t.procedure}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {t.status.replace("_", " ")}
                    {t.performed_at ? ` · ${format(new Date(t.performed_at), "MMM d, yyyy")}` : ""}
                  </p>
                  {t.notes && <p className="mt-1 text-xs">{t.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <Empty
              icon={FileText}
              title={sel ? "No history for this tooth" : "No procedures yet"}
            />
          )}
        </Card>
      </div>
    </>
  );
}
