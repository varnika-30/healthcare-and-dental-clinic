import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateMyPatient } from "@/lib/patient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Receipt } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/portal/billing")({
  head: () => ({ meta: [{ title: "Billing — Lumident" }] }),
  component: PortalBilling,
});

function PortalBilling() {
  const q = useQuery({
    queryKey: ["my-billing"],
    queryFn: async () => {
      const patient = await getOrCreateMyPatient();
      if (!patient) return null;
      // Only current invoices are visible per RLS
      const { data: inv } = await supabase.from("invoices").select("*").eq("patient_id", patient.id);
      const ids = (inv ?? []).map((i) => i.id);
      const [{ data: items }, { data: pays }] = await Promise.all([
        supabase.from("invoice_items").select("*").in("invoice_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        supabase.from("payments").select("*").in("invoice_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]).order("paid_at", { ascending: false }),
      ]);
      return { inv: inv ?? [], items: items ?? [], pays: pays ?? [] };
    },
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Current treatment invoices and payments.</p>
      </div>
      {q.isLoading ? <Card className="p-8 text-center text-sm text-muted-foreground">Loading…</Card>
        : q.data?.inv.length ? (
          <div className="space-y-4">
            {q.data.inv.map((i) => {
              const items = q.data!.items.filter((x) => x.invoice_id === i.id);
              const pays = q.data!.pays.filter((p) => p.invoice_id === i.id);
              const pct = Number(i.total) > 0 ? Math.round((Number(i.amount_paid) / Number(i.total)) * 100) : 0;
              return (
                <Card key={i.id} className="rounded-2xl border-border/60 p-6 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-muted-foreground">{i.invoice_number}</p>
                      <h3 className="font-display text-lg font-semibold">${Number(i.total).toFixed(2)}</h3>
                      {i.due_date && <p className="text-xs text-muted-foreground">Due {format(new Date(i.due_date), "MMM d, yyyy")}</p>}
                    </div>
                    <Badge variant="outline" className="capitalize">{i.status}</Badge>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Paid ${Number(i.amount_paid).toFixed(2)} of ${Number(i.total).toFixed(2)}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary"><div className="h-full rounded-full bg-primary-gradient" style={{ width: `${pct}%` }} /></div>
                  </div>
                  {items.length > 0 && (
                    <div className="mt-4 divide-y divide-border/60">
                      {items.map((it) => (
                        <div key={it.id} className="flex justify-between py-2 text-sm">
                          <span>{it.description} <span className="text-muted-foreground">× {it.quantity}</span></span>
                          <span className="font-medium">${Number(it.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {pays.length > 0 && (
                    <div className="mt-4 border-t border-border/60 pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Payments</p>
                      {pays.map((p) => (
                        <div key={p.id} className="flex justify-between text-sm">
                          <span>{format(new Date(p.paid_at), "MMM d")} · <span className="capitalize text-muted-foreground">{p.method}</span></span>
                          <span className="font-medium text-success">${Number(p.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : <Empty icon={Receipt} title="No open invoices" description="You have no outstanding balance." />}
    </>
  );
}
