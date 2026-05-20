import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

export const Route = createFileRoute("/doctors")({
  head: () => ({
    meta: [
      { title: "Our Doctors — Lumident Dental" },
      { name: "description", content: "Meet our specialists — orthodontists, implantologists, cosmetic and pediatric dentists." },
    ],
  }),
  component: Doctors,
});

const doctors = [
  { name: "Dr. Aisha Rahman", spec: "Orthodontist", avail: "Mon–Thu · 9am–5pm", years: 14, rating: 4.9 },
  { name: "Dr. Marco Bellini", spec: "Implantologist", avail: "Tue–Sat · 10am–6pm", years: 18, rating: 4.9 },
  { name: "Dr. Sara Kim", spec: "Cosmetic Dentistry", avail: "Mon–Fri · 9am–4pm", years: 11, rating: 5.0 },
  { name: "Dr. Daniel Ortiz", spec: "Endodontist", avail: "Wed–Sat · 11am–7pm", years: 9, rating: 4.8 },
  { name: "Dr. Lina Chen", spec: "Pediatric Dentist", avail: "Mon–Fri · 8am–3pm", years: 7, rating: 4.9 },
  { name: "Dr. Owen Park", spec: "General Dentist", avail: "Mon–Sat · 9am–6pm", years: 12, rating: 4.8 },
];

function Doctors() {
  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <Badge variant="secondary" className="mb-3 rounded-full">Doctors</Badge>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">A team you can trust.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Board-certified specialists, continuous training, and a shared belief: dentistry should feel calm.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d) => (
            <Card key={d.name} className="rounded-2xl border-border/60 p-6 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 rounded-2xl bg-primary-gradient" />
                <div>
                  <h3 className="font-display text-lg font-semibold">{d.name}</h3>
                  <p className="text-sm text-primary">{d.spec}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
                <span>{d.years} yrs experience</span>
                <span className="flex items-center gap-1 text-foreground"><Star className="h-3.5 w-3.5 fill-primary text-primary" />{d.rating}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{d.avail}</p>
              <Button asChild size="sm" className="mt-4 w-full bg-primary-gradient">
                <Link to="/book">Book with {d.name.split(" ")[1]}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
