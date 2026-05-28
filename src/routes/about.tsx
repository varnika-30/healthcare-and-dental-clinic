import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Sparkles, HeartPulse } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Lumident Dental" },
      {
        name: "description",
        content: "Our story, our values, and the team behind a calmer dental experience.",
      },
    ],
  }),
  component: About,
});

const values = [
  {
    icon: HeartPulse,
    title: "Patient-first",
    desc: "Every decision starts with how you feel walking in and out.",
  },
  {
    icon: ShieldCheck,
    title: "Honest pricing",
    desc: "Clear estimates, no upsells, financing without games.",
  },
  {
    icon: Sparkles,
    title: "Modern craft",
    desc: "Digital scanners, on-site labs, evidence-based methods.",
  },
];

function About() {
  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <Badge variant="secondary" className="mb-3 rounded-full">
            About us
          </Badge>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            Dentistry, reimagined around you.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Lumident started with a simple belief: a dental visit shouldn't feel clinical. We built
            a clinic that feels like a calm studio — quiet, light, warm — and paired it with a team
            that explains everything, slowly, kindly.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {values.map((v) => (
            <Card key={v.title} className="rounded-2xl border-border/60 p-6 shadow-soft">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <v.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
            </Card>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
