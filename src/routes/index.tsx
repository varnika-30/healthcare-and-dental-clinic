import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Smile, ShieldCheck, Clock, ArrowRight, Star,
  Stethoscope, HeartPulse, Activity, Calendar, Phone, ChevronRight,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumident — Modern Dental Care" },
      { name: "description", content: "Calm clinic, gentle dentistry. Book online, manage your visits, prescriptions and bills — all in one place." },
      { property: "og:title", content: "Lumident — Modern Dental Care" },
      { property: "og:description", content: "Book online, manage visits, prescriptions and bills — all in one place." },
    ],
  }),
  component: Home,
});

const services = [
  { icon: Smile, title: "Dental Cleaning", desc: "Gentle scaling & polish for fresh, healthy teeth." },
  { icon: Sparkles, title: "Teeth Whitening", desc: "Brighten your smile by up to 8 shades, safely." },
  { icon: Activity, title: "Root Canal", desc: "Painless treatment with modern micro-tools." },
  { icon: ShieldCheck, title: "Braces & Aligners", desc: "Clear aligners and traditional braces." },
  { icon: HeartPulse, title: "Dental Implants", desc: "Permanent solutions that look natural." },
  { icon: Stethoscope, title: "Cosmetic Dentistry", desc: "Veneers, contouring & smile design." },
];

const stats = [
  { k: "15k+", v: "Happy patients" },
  { k: "20", v: "Years of care" },
  { k: "12", v: "Specialists" },
  { k: "4.9★", v: "Avg. rating" },
];

const doctors = [
  { name: "Dr. Aisha Rahman", spec: "Orthodontist", avail: "Mon–Thu" },
  { name: "Dr. Marco Bellini", spec: "Implantologist", avail: "Tue–Sat" },
  { name: "Dr. Sara Kim", spec: "Cosmetic Dentistry", avail: "Mon–Fri" },
];

const testimonials = [
  { name: "Emma R.", text: "The most calming dental visit I've ever had. The app makes booking effortless." },
  { name: "James L.", text: "Honest pricing, gentle hands. My kids actually look forward to checkups." },
  { name: "Priya S.", text: "Got my aligners done here. Transparent process from day one." },
];

function Home() {
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col justify-center">
            <Badge variant="secondary" className="mb-5 w-fit gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Now accepting new patients
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
              A calmer, kinder<br />way to visit the dentist.
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
              Lumident blends modern dentistry with thoughtful design. Book online, see your records, manage prescriptions and bills — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-primary-gradient shadow-card">
                <Link to="/book">Book appointment <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/services">Explore services</Link>
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Open today 9am–7pm</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> (415) 555-0142</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-primary-gradient opacity-20 blur-3xl" />
            <Card className="glass-card overflow-hidden rounded-3xl p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Next appointment</p>
                  <p className="mt-1 font-display text-lg font-semibold">Tue, May 26 · 10:30 AM</p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground">
                  <Calendar className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-muted-foreground">Doctor</p>
                  <p className="mt-1 font-medium">Dr. Aisha Rahman</p>
                  <p className="text-xs text-muted-foreground">Orthodontist</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-muted-foreground">Treatment</p>
                  <p className="mt-1 font-medium">Aligner check-in</p>
                  <p className="text-xs text-muted-foreground">~30 min</p>
                </div>
              </div>
              <div className="mt-5 rounded-2xl bg-primary-soft p-4">
                <p className="text-sm font-medium text-foreground">Reminder</p>
                <p className="mt-1 text-xs text-muted-foreground">No food or drink 30 min before whitening.</p>
              </div>
              <div className="mt-5 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">Reschedule</Button>
                <Button size="sm" className="flex-1 bg-primary-gradient">Check in</Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto -mt-4 max-w-7xl px-6 pb-16">
          <div className="grid grid-cols-2 gap-4 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-soft backdrop-blur md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.v} className="text-center">
                <p className="font-display text-3xl font-bold text-foreground">{s.k}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <Badge variant="secondary" className="mb-3 rounded-full">Services</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Care for every smile.</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">From routine cleanings to full smile design — our team is trained in the latest, gentlest techniques.</p>
          </div>
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link to="/services">All services <ChevronRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.title} className="group rounded-2xl border-border/60 p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary transition group-hover:bg-primary-gradient group-hover:text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* DOCTORS */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <Badge variant="secondary" className="mb-3 rounded-full">Meet the team</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Specialists who actually listen.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {doctors.map((d) => (
              <Card key={d.name} className="rounded-2xl border-border/60 p-6 text-center shadow-soft">
                <div className="mx-auto h-20 w-20 rounded-full bg-primary-gradient" />
                <h3 className="mt-4 font-display text-lg font-semibold">{d.name}</h3>
                <p className="text-sm text-primary">{d.spec}</p>
                <p className="mt-2 text-xs text-muted-foreground">Available {d.avail}</p>
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link to="/book">Book a visit</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 text-center">
          <Badge variant="secondary" className="mb-3 rounded-full">Patients</Badge>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Loved by 15,000+ patients.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="rounded-2xl border-border/60 p-6 shadow-soft">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-3 text-sm text-foreground">"{t.text}"</p>
              <p className="mt-4 text-xs font-medium text-muted-foreground">— {t.name}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-3 rounded-full">FAQ</Badge>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Common questions.</h2>
        </div>
        <Accordion type="single" collapsible className="rounded-2xl border border-border/60 bg-card p-2 shadow-soft">
          {[
            ["Do you accept insurance?", "Yes — we work with most major providers and offer transparent self-pay pricing."],
            ["How early should I arrive?", "10 minutes early for first visits. Check in via the app to skip the queue."],
            ["Is whitening safe?", "Absolutely. We use enamel-safe gels and monitor sensitivity."],
            ["What about kids?", "We see patients from age 3 and up. Our pediatric room is built to feel friendly."],
          ].map(([q, a]) => (
            <AccordionItem key={q} value={q} className="border-border/60 px-4">
              <AccordionTrigger className="text-left font-medium">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary-gradient p-10 text-primary-foreground shadow-card md:p-16">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">Ready for a brighter visit?</h2>
              <p className="mt-2 max-w-xl opacity-90">Book online in under a minute. We'll confirm by SMS and email.</p>
            </div>
            <div className="flex gap-3">
              <Button asChild size="lg" variant="secondary"><Link to="/book">Book appointment</Link></Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
