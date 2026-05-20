import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book Appointment — Lumident" },
      { name: "description", content: "Book your next dental appointment online in under a minute." },
    ],
  }),
  component: Book,
});

const services = ["Dental Cleaning","Whitening","Root Canal","Braces Consultation","Implant Consultation","Cosmetic Consultation","Pediatric Checkup"];
const doctors = ["Dr. Aisha Rahman","Dr. Marco Bellini","Dr. Sara Kim","Dr. Daniel Ortiz","Dr. Lina Chen","Dr. Owen Park"];
const slots = ["09:00","09:30","10:00","10:30","11:00","13:30","14:00","14:30","15:00","16:00"];

function Book() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slot, setSlot] = useState<string>();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <Badge variant="secondary" className="mb-3 rounded-full">Book a visit</Badge>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Pick a time that works for you.</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">It takes less than a minute. We'll confirm by SMS and email.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card md:p-8">
          <form
            className="grid gap-6 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!date || !slot) return toast.error("Pick a date and time.");
              toast.success(`Appointment booked for ${format(date, "PPP")} at ${slot}.`);
              if (user) navigate({ to: "/dashboard" });
            }}
          >
            <div className="space-y-4">
              <div>
                <Label>Service</Label>
                <Select required>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a service" /></SelectTrigger>
                  <SelectContent>{services.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Doctor</Label>
                <Select>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Any available" /></SelectTrigger>
                  <SelectContent>{doctors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {!user && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label htmlFor="fn">Full name</Label><Input id="fn" required maxLength={100} className="mt-1" /></div>
                    <div><Label htmlFor="ph">Phone</Label><Input id="ph" required maxLength={20} className="mt-1" /></div>
                  </div>
                  <div><Label htmlFor="em">Email</Label><Input id="em" type="email" required maxLength={255} className="mt-1" /></div>
                </>
              )}
              <div>
                <Label>Time</Label>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {slots.map((s) => (
                    <button key={s} type="button" onClick={() => setSlot(s)}
                      className={`rounded-lg border px-2 py-2 text-sm transition ${slot===s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Date</Label>
              <div className="rounded-2xl border border-border bg-card p-2">
                <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))} className="pointer-events-auto p-3" />
              </div>
              <Button type="submit" size="lg" className="mt-4 w-full bg-primary-gradient">Confirm appointment</Button>
            </div>
          </form>
        </Card>
      </section>
    </SiteLayout>
  );
}
