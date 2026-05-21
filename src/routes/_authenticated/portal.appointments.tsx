import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateMyPatient } from "@/lib/patient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Empty } from "@/components/ui/empty";
import { Calendar, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/portal/appointments")({
  head: () => ({ meta: [{ title: "Appointments — Lumident" }] }),
  component: PortalAppointments,
});

const STATUS_VARIANT: Record<string, string> = {
  requested: "bg-warning/20 text-warning-foreground",
  confirmed: "bg-primary/20 text-primary",
  in_progress: "bg-primary text-primary-foreground",
  completed: "bg-success/20 text-success",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-destructive/20 text-destructive",
};

function PortalAppointments() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["my-appointments"],
    queryFn: async () => {
      const patient = await getOrCreateMyPatient();
      if (!patient) return [];
      const { data } = await supabase.from("appointments").select("*")
        .eq("patient_id", patient.id).order("scheduled_at", { ascending: false });
      return data ?? [];
    },
  });

  const m = useMutation({
    mutationFn: async (vals: { service: string; date: string; time: string; notes: string; priority: string }) => {
      const patient = await getOrCreateMyPatient();
      if (!patient) throw new Error("No patient record");
      const scheduled = new Date(`${vals.date}T${vals.time}`).toISOString();
      const { error } = await supabase.from("appointments").insert({
        patient_id: patient.id,
        service: vals.service,
        scheduled_at: scheduled,
        notes: vals.notes || null,
        priority: vals.priority as "normal" | "urgent" | "emergency",
        status: "requested",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Appointment requested. The clinic will confirm soon."); setOpen(false); qc.invalidateQueries({ queryKey: ["my-appointments"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Appointment cancelled."); qc.invalidateQueries({ queryKey: ["my-appointments"] }); },
  });

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">My appointments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Request, track and manage your visits.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-primary-gradient"><Plus className="mr-2 h-4 w-4" />Request appointment</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Request appointment</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              m.mutate({
                service: String(fd.get("service")),
                date: String(fd.get("date")),
                time: String(fd.get("time")),
                notes: String(fd.get("notes") || ""),
                priority: String(fd.get("priority") || "normal"),
              });
            }}>
              <div><Label>Service</Label>
                <Select name="service" defaultValue="Consultation">
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Consultation","Cleaning","Whitening","Filling","Root canal","Crown","Braces check","Emergency"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input name="date" type="date" required className="mt-1" min={new Date().toISOString().split("T")[0]} /></div>
                <div><Label>Time</Label><Input name="time" type="time" required className="mt-1" /></div>
              </div>
              <div><Label>Priority</Label>
                <Select name="priority" defaultValue="normal">
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="emergency">Emergency</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea name="notes" className="mt-1" rows={3} placeholder="Anything we should know?" /></div>
              <DialogFooter><Button type="submit" disabled={m.isPending} className="bg-primary-gradient">{m.isPending ? "Sending…" : "Request"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {q.isLoading ? <Card className="p-8 text-center text-sm text-muted-foreground">Loading…</Card>
        : q.data?.length ? (
          <div className="space-y-3">
            {q.data.map((a) => (
              <Card key={a.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-border/60 p-5 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"><Calendar className="h-5 w-5" /></div>
                  <div>
                    <p className="font-medium">{a.service}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(a.scheduled_at), "EEEE, MMM d · p")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={STATUS_VARIANT[a.status] || ""}>{a.status.replace("_", " ")}</Badge>
                  {(a.status === "requested" || a.status === "confirmed") && (
                    <Button size="sm" variant="outline" onClick={() => cancel.mutate(a.id)}>Cancel</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty icon={Calendar} title="No appointments yet" description="Request your first visit to get started." />
        )}
    </>
  );
}
