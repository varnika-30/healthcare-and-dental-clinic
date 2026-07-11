import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BookAppointmentButton } from "@/components/site/BookAppointmentChoice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import drAnahitaImg from "./dr-anahita.jpg";
import robinMatthewAvatar from "./robin-matthew-avatar.jpg";
import gauravShettyAvatar from "./gaurav-shetty-avatar.jpg";
import aafiyaAvatar from "./aafiya-avatar.jpg";
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
  Baby,
  AlertCircle,
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
      { title: "Healthcare & Dental Clinic — Modern Dental Care" },
      {
        name: "description",
        content:
          "Calm clinic, gentle dentistry. Book online, manage your visits, prescriptions and bills — all in one place.",
      },
      { property: "og:title", content: "Healthcare & Dental Clinic — Modern Dental Care" },
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
    title: "Dental Checkup & Cleaning",
    desc: "Routine checkups and gentle cleanings to keep your teeth and gums healthy.",
  },
  {
    icon: ShieldCheck,
    title: "Dental Fillings",
    desc: "Natural-looking fillings to treat cavities and restore damaged teeth.",
  },
  {
    icon: Activity,
    title: "Root Canal Treatment",
    desc: "Comfortable treatment to relieve tooth pain and save an infected tooth.",
  },
  {
    icon: Sparkles,
    title: "Braces & Aligners",
    desc: "Braces and clear aligners to help straighten teeth and improve your smile.",
  },
  {
    icon: HeartPulse,
    title: "Bridges & Tooth Replacement",
    desc: "Replace missing teeth with strong, natural-looking bridges.",
  },
  {
    icon: Heart,
    title: "Dental Implants",
    desc: "Long-lasting replacements for missing teeth that look and feel natural.",
  },
  {
    icon: Sparkles,
    title: "Cosmetic Dentistry",
    desc: "Treatments to enhance and beautify your smile.",
  },
  {
    icon: Baby,
    title: "Kids Dentistry",
    desc: "Friendly and gentle dental care to keep children's teeth healthy and strong.",
  },
  {
    icon: AlertCircle,
    title: "Emergency Dental Care",
    desc: "Prompt care for dental pain, swelling, injuries, and emergencies.",
  },
];

const doctors = [
  {
    name: "Dr. Robin Matthew",
    spec: "Orthodontics",
    avail: "on appointment",
    avatar: robinMatthewAvatar,
  },
  {
    name: "Dr. Gaurav Shetty",
    spec: "Periodontics",
    avail: "on appointment",
    avatar: gauravShettyAvatar,
  },
  {
    name: "Asst. Aafiya",
    spec: "Patient Care Coordinator",
    avail: "Mon–Sat",
    noBook: true,
    avatar: aafiyaAvatar,
  },
];

function Home() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", listener);
    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  return (
    <SiteLayout>
      {/* HERO */}
      <section id="hero" className="relative min-h-screen overflow-hidden scroll-mt-24">
        <video
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          autoPlay={!prefersReducedMotion}
          muted
          loop
          playsInline
          controls={false}
          preload="metadata"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/50 to-black/40 pointer-events-none" />
        <div className="relative mx-auto flex min-h-screen max-w-[1900px] items-center px-8">
          <div
            className="relative z-10 rounded-3xl p-12 shadow-lg backdrop-blur-md md:max-w-xl lg:max-w-2xl"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
          >
            <h1 className="font-display text-6xl font-bold text-[#0F172A] sm:text-5xl md:text-5xl">
              Welcome To <h1>Healthcare & Dental Clinic</h1>
            </h1>
            <p className="mt-6 text-xl text-gray-700">
              Gentle care for healthy teeth and happy smiles.
            </p>
            <p>
              Because every smile deserves a little extra care.
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              <BookAppointmentButton
                size="lg"
                className="text-lg rounded-xl bg-[#27B7AE] px-8 py-6 text-white shadow-md hover:bg-[#1E9D94]"
              >
                Book an appointment
              </BookAppointmentButton>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-lg rounded-xl border-gray-300 bg-white px-12 py-6 text-[#0F172A] shadow-md hover:bg-gray-100"
              >
                <Link to="/" hash="contact">Visit Us</Link>
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
      <section id="contact" className="bg-gradient-to-br from-teal-100 to-teal-50 py-36 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-6 grid gap-12 md:grid-cols-2 items-center">
          <div className="rounded-xl shadow-lg overflow-hidden">
            <div className="h-120">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3772.130136223677!2d73.01040177519239!3d19.013986382177865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c37571cb5d93%3A0x51a8442c0fbd85a2!2sHealthcare%20and%20Dental%20Clinic!5e0!3m2!1sen!2sin!4v1783244716086!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="font-display text-4xl font-bold text-teal-900">Visit Us</h2>
            <p className="mt-6 text-lg text-gray-700">
              Baba Sharan CHS, Plot# 60/61, behind HP Petrol pump, near Dominos, Sector 44,
              Seawoods, Navi Mumbai, Maharashtra 400706
            </p>
            <p className="mt-4 text-lg text-gray-700">
              <b>Working Days: </b> Monday - Saturday
            </p>
            <p className="mt-3 text-lg text-gray-700">
              <b>Clinic Hours: </b>5:30 PM – 10:00 PM
            </p>
            <p className="mt-3 text-lg text-gray-700">
              <b>Call us:</b> 8369559331
            </p>
            <p className="mt-3 text-lg text-gray-700">
              <b>Emergency Support:</b> Available during clinic hours or by arrangements via phone
            </p>
            <p className="mt-3 text-lg text-gray-700">
              <b>Appointments:</b> Walk-ins are welcome and accommodated based on availability. Patients with prior appointments will be given priority.
            </p>
            <div className="mt-8">
              <a
                href="https://www.google.com/maps/place/Healthcare+and+Dental+Clinic/@19.0139864,73.0104018,17z/data=!3m1!4b1!4m6!3m5!1s0x3be7c37571cb5d93:0x51a8442c0fbd85a2!8m2!3d19.0139864!4d73.0129767!16s%2Fg%2F11w2_3m6j9"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg inline-flex items-center justify-center rounded-xl bg-teal-600 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700 transition"
              >
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE DR. ANAHITA SECTION */}
      <section id="about" className="bg-[#F5F1EB] py-24 scroll-mt-24">
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
                  With over 20 years of clinical experience, our clinic is designed to make you
                  feel at ease, with a focus on patient comfort.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl shadow-lg overflow-hidden aspect-square max-w-md mx-auto w-full self-center">
            <img
              src={drAnahitaImg}
              alt="Dr. Anahita"
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="mx-auto max-w-7xl px-6 py-20 scroll-mt-24">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <Badge variant="secondary" className="mb-3 rounded-full">
              Services
            </Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Care for every smile.</h2>
            <p className="mt-2 max-w-xl lg:max-w-none text-muted-foreground">
              From routine cleanings to full smile design — our team is trained in the latest,
              gentlest techniques.
            </p>
          </div>
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
      <section id="doctors" className="bg-secondary/40 py-20 scroll-mt-24">
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
                <img
                  src={d.avatar}
                  alt={d.name}
                  className="mx-auto h-20 w-20 rounded-full object-cover shadow-sm bg-white"
                />
                <h3 className="mt-4 font-display text-lg font-semibold">{d.name}</h3>
                {d.spec && <p className="text-sm text-primary">{d.spec}</p>}
                <p className="mt-2 text-xs text-muted-foreground">Available {d.avail}</p>
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
                <Link to="/" hash="contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
