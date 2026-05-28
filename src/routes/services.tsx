import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smile,
  Sparkles,
  Activity,
  ShieldCheck,
  HeartPulse,
  Stethoscope,
  Baby,
  Crown,
} from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Lumident Dental" },
      {
        name: "description",
        content:
          "Comprehensive dental services: cleaning, whitening, root canal, braces, implants, cosmetic dentistry and more.",
      },
    ],
  }),
  component: Services,
});

const services = [
  {
    icon: Smile,
    title: "Dental Cleaning",
    price: "from $89",
    desc: "Routine scaling, polishing and fluoride treatment to keep gums healthy.",
  },
  {
    icon: Sparkles,
    title: "Teeth Whitening",
    price: "from $299",
    desc: "In-office or take-home whitening, up to 8 shades brighter.",
  },
  {
    icon: Activity,
    title: "Root Canal Therapy",
    price: "from $650",
    desc: "Modern, painless endodontic care with single-visit options.",
  },
  {
    icon: ShieldCheck,
    title: "Braces & Clear Aligners",
    price: "consultation",
    desc: "Traditional braces or Invisalign-style aligners.",
  },
  {
    icon: HeartPulse,
    title: "Dental Implants",
    price: "from $1,800",
    desc: "Single or full-arch implants with lifetime materials guarantee.",
  },
  {
    icon: Stethoscope,
    title: "Cosmetic Dentistry",
    price: "from $250",
    desc: "Veneers, bonding, contouring and full smile design.",
  },
  {
    icon: Baby,
    title: "Pediatric Dentistry",
    price: "from $79",
    desc: "Friendly first visits, sealants and gentle care for kids.",
  },
  {
    icon: Crown,
    title: "Crowns & Bridges",
    price: "from $900",
    desc: "Ceramic crowns crafted on-site in a single visit.",
  },
];

function Services() {
  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <Badge variant="secondary" className="mb-3 rounded-full">
            Services
          </Badge>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            Everything your smile needs.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Transparent pricing. Modern equipment. Specialists who explain every step.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card
              key={s.title}
              className="rounded-2xl border-border/60 p-6 shadow-soft transition hover:shadow-card"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                  {s.price}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
