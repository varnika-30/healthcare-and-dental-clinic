import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock } from "lucide-react";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book Appointment — Lumident" },
      {
        name: "description",
        content: "Book your next dental appointment online in under a minute.",
      },
    ],
  }),
  component: Book,
});

const services = [
  "Dental Cleaning",
  "Whitening",
  "Root Canal",
  "Braces Consultation",
  "Implant Consultation",
  "Cosmetic Consultation",
  "Pediatric Checkup",
];

const slots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "16:00",
];

function Book() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slot, setSlot] = useState<string>();
  const [service, setService] = useState<string>();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center md:py-16">
          <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1">
            Book a visit
          </Badge>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Pick a time that works for you.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            It takes less than a minute. We'll confirm your appointment by SMS.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-20">
        <Card className="overflow-hidden rounded-3xl border-border/60 bg-card/95 p-5 shadow-card sm:p-8 md:p-10">
          <form
            className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-14"
            onSubmit={(e) => {
              e.preventDefault();
              if (!service) return toast.error("Please choose a service.");
              if (!date || !slot) return toast.error("Pick a date and time.");
              toast.success(`Appointment booked for ${format(date, "PPP")} at ${slot}.`);
              if (user) navigate({ to: "/dashboard" });
            }}
          >
            {/* Left: service, contact, time slots */}
            <div className="order-1 flex min-w-0 flex-col gap-6 lg:gap-7">
              <div className="space-y-2">
                <Label htmlFor="service" className="text-sm font-semibold text-foreground">
                  Service
                </Label>
                <Select required value={service} onValueChange={setService}>
                  <SelectTrigger
                    id="service"
                    className="h-11 rounded-xl border-input bg-background"
                  >
                    <SelectValue placeholder="Choose a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fn" className="text-sm font-semibold text-foreground">
                    Full name
                  </Label>
                  <Input
                    id="fn"
                    required
                    maxLength={100}
                    placeholder="Jane Doe"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph" className="text-sm font-semibold text-foreground">
                    Phone number
                  </Label>
                  <Input
                    id="ph"
                    required
                    maxLength={20}
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" aria-hidden />
                  <Label className="text-sm font-semibold text-foreground">Available times</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {date
                    ? `Showing slots for ${format(date, "EEEE, MMM d")}`
                    : "Select a date on the calendar to choose a time"}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlot(s)}
                      className={cn(
                        "min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        slot === s
                          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                          : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary-soft/60",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: calendar + CTA */}
            <div className="order-2 flex min-w-0 flex-col gap-5 lg:gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
                  <Label className="text-sm font-semibold text-foreground">Select date</Label>
                </div>

                <div className="flex justify-center rounded-3xl border border-border/70 bg-muted/30 p-4 shadow-sm sm:p-6 md:p-8">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    className={cn(
                      "w-full max-w-full p-0",
                      "[--cell-size:2.75rem] sm:[--cell-size:3.25rem] md:[--cell-size:3.5rem]",
                    )}
                    classNames={{
                      root: "w-full mx-auto",
                      month: "w-full gap-5",
                      month_caption: "mb-2 h-12 text-base font-semibold text-foreground",
                      caption_label: "text-base font-semibold",
                      nav: "h-12",
                      weekdays: "mb-1",
                      weekday:
                        "flex-1 text-xs font-medium uppercase tracking-wide text-muted-foreground",
                      week: "mt-1 gap-1",
                      day: "rounded-xl",
                    }}
                  />
                </div>

                {date && (
                  <p className="text-center text-sm text-muted-foreground transition-opacity">
                    Selected:{" "}
                    <span className="font-medium text-foreground">{format(date, "PPPP")}</span>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full rounded-xl bg-primary-gradient text-base font-semibold shadow-md transition-all duration-200 hover:opacity-95 hover:shadow-lg"
              >
                Confirm appointment
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </SiteLayout>
  );
}
