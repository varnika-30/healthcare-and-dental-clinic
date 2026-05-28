import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BookAppointmentButton } from "@/components/site/BookAppointmentChoice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Smile,
  ShieldCheck,
  Clock,
  ArrowRight,
  Star,
  Stethoscope,
  Heart,
  HeartPulse,
  Activity,
  Calendar,
  Phone,
  ChevronRight,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumident — Modern Dental Care" },
      {
        name: "description",
        content:
          "Calm clinic, gentle dentistry. Book online, manage your visits, prescriptions and bills — all in one place.",
      },
      { property: "og:title", content: "Lumident — Modern Dental Care" },
      {
        property: "og:description",
        content: "Book online, manage visits, prescriptions and bills — all in one place.",
      },
    ],
  }),
  component: Home,
});

const services = [
  {
    icon: Smile,
    title: "Dental Cleaning",
    desc: "Gentle scaling & polish for fresh, healthy teeth.",
  },
  {
    icon: Sparkles,
    title: "Teeth Whitening",
    desc: "Brighten your smile by up to 8 shades, safely.",
  },
  { icon: Activity, title: "Root Canal", desc: "Painless treatment with modern micro-tools." },
  { icon: ShieldCheck, title: "Braces & Aligners", desc: "Clear aligners and traditional braces." },
  { icon: HeartPulse, title: "Dental Implants", desc: "Permanent solutions that look natural." },
  { icon: Stethoscope, title: "Cosmetic Dentistry", desc: "Veneers, contouring & smile design." },
];

const doctors = [
  { name: "Dr. Aisha Rahman", spec: "Orthodontist", avail: "Mon–Thu" },
  { name: "Dr. Marco Bellini", spec: "Implantologist", avail: "Tue–Sat" },
  { name: "Dr. Sara Kim", spec: "Cosmetic Dentistry", avail: "Mon–Fri" },
];

function Home() {
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative min-h-screen overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/path-to-dental-clinic-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto flex min-h-screen max-w-[1400px] items-center px-8">
          <div className="rounded-3xl bg-white/80 p-12 shadow-lg backdrop-blur-md md:max-w-xl lg:max-w-2xl">
            <h1 className="font-display text-6xl font-bold text-[#0F172A] sm:text-5xl md:text-6xl">
              Welcome To Healthcare And Dental Clinic
            </h1>
            <p className="mt-6 text-xl text-gray-700">
              Open Monday – Saturday · 6:30 PM – 10 PM · Family Dental Care · Emergency Support
            </p>
            <div className="mt-10 flex flex-wrap gap-6">
              <BookAppointmentButton
                size="lg"
                className="rounded-xl bg-[#27B7AE] px-8 py-4 text-white shadow-md hover:bg-[#1E9D94]"
              >
                Book an appointment
              </BookAppointmentButton>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl border-gray-300 bg-white px-8 py-4 text-[#0F172A] shadow-md hover:bg-gray-100"
              >
                <Link to="/services">Visit Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* GLOBAL CONTENT WIDTH AND TYPOGRAPHY IMPROVEMENTS */}
      <style>{`
        .container {
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }

        p, .text-lg {
          font-size: 1.125rem;
          line-height: 1.75rem;
        }

        h2 {
          font-size: 2.25rem;
          line-height: 2.5rem;
        }

        .section-spacing {
          padding-top: 6rem;
          padding-bottom: 6rem;
        }
      `}</style>

      {/* VISIT US SECTION */}
      <section className="bg-gradient-to-br from-teal-100 to-teal-50 py-24">
        <div className="mx-auto max-w-7xl px-6 grid gap-12 md:grid-cols-2">
          <div className="rounded-3xl shadow-lg overflow-hidden">
            <div className="h-64 bg-gray-200">Google Map Placeholder</div>
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="font-display text-4xl font-bold text-teal-900">Visit Us</h2>
            <p className="mt-6 text-lg text-gray-700">
              Baba Sharan CHS, Plot# 60/61, behind HP Petrol pump, near Bank of Baroda, Sector 44,
              Seawoods, Navi Mumbai, Maharashtra 400706
            </p>
            <p className="mt-4 text-lg text-gray-700">
              <b>Clinic Hours:</b> Monday - Saturday, 5:30 PM – 10:00 PM
            </p>
            <p className="mt-2 text-lg text-gray-700">
              <b>Call us:</b> 8689991241
            </p>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE DR. ANAHITA SECTION */}
      <section className="bg-[#F5F1EB] py-24">
        <div className="mx-auto max-w-7xl px-6 grid gap-12 md:grid-cols-2">
          <div className="flex flex-col justify-center">
            <h2 className="font-display text-4xl font-bold text-gray-900">
              Why Choose Dr. Anahita
            </h2>
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Expertise</h3>
                <p className="mt-2 text-gray-600">
                  Dr. Anahita brings years of experience and specialized training to provide the
                  best dental care.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Technology</h3>
                <p className="mt-2 text-gray-600">
                  We use state-of-the-art equipment to ensure precision and comfort during
                  treatments.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Personalized Care</h3>
                <p className="mt-2 text-gray-600">
                  Every patient receives tailored treatment plans to meet their unique needs.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Comfortable Experience</h3>
                <p className="mt-2 text-gray-600">
                  Our clinic is designed to make you feel at ease, with a focus on patient comfort.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl shadow-lg overflow-hidden">
            <div className="h-64 bg-gray-200">Dental Clinic Image Placeholder</div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <Badge variant="secondary" className="mb-3 rounded-full">
              Services
            </Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Care for every smile.</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              From routine cleanings to full smile design — our team is trained in the latest,
              gentlest techniques.
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link to="/services">
              All services <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card
              key={s.title}
              className="group rounded-2xl border-border/60 p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
            >
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
            <Badge variant="secondary" className="mb-3 rounded-full">
              Meet the team
            </Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Specialists who actually listen.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {doctors.map((d) => (
              <Card
                key={d.name}
                className="rounded-2xl border-border/60 p-6 text-center shadow-soft"
              >
                <div className="mx-auto h-20 w-20 rounded-full bg-primary-gradient" />
                <h3 className="mt-4 font-display text-lg font-semibold">{d.name}</h3>
                <p className="text-sm text-primary">{d.spec}</p>
                <p className="mt-2 text-xs text-muted-foreground">Available {d.avail}</p>
                <BookAppointmentButton size="sm" variant="outline" className="mt-4">
                  Book a visit
                </BookAppointmentButton>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-20 px-6 pb-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary-gradient p-10 text-primary-foreground shadow-card md:p-16">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Ready for a brighter visit?
              </h2>
              <p className="mt-2 max-w-xl opacity-90">
                Book online in under a minute. We'll confirm by SMS and email.
              </p>
            </div>
            <div className="flex gap-3">
              <BookAppointmentButton size="lg" variant="secondary">
                Book appointment
              </BookAppointmentButton>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
