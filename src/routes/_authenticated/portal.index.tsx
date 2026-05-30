import type { LucideIcon } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateMyPatient } from "@/lib/patient";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Plus,
  Clock,
  Calendar,
  Activity,
  CreditCard,
  Bell,
  ChevronRight,
  Stethoscope,
  CheckCircle2,
  FileText,
  Phone,
  Pill,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => ({ meta: [{ title: "Overview — Lumident" }] }),
  component: PortalHome,
});

function PortalHome() {
  const { user } = useAuth();
  const userName =
    (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "there";

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["portal-overview"],
    queryFn: async () => {
      const patient = await getOrCreateMyPatient();
      if (!patient) return null;
      const [appts, scripts, invoices, plans] = await Promise.all([
        supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", patient.id)
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at")
          .limit(5),
        supabase
          .from("prescriptions")
          .select("*")
          .eq("patient_id", patient.id)
          .order("issued_at", { ascending: false })
          .limit(3),
        supabase.from("invoices").select("*").eq("patient_id", patient.id).eq("is_current", true),
        supabase
          .from("treatment_plans")
          .select("*")
          .eq("patient_id", patient.id)
          .neq("status", "completed")
          .limit(1),
      ]);
      return {
        patient,
        appts: appts.data ?? [],
        scripts: scripts.data ?? [],
        invoices: invoices.data ?? [],
        plans: plans.data ?? [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  // Safely extract values or provide fallback UI statistics
  const nextApptData = dashboardData?.appts?.[0];
  const totalUpcomingAppts = dashboardData?.appts?.length || 0;
  const activePlansCount = dashboardData?.plans?.length || 0;
  const pendingInvoicesTotal =
    dashboardData?.invoices?.reduce((acc, curr) => acc + (curr.amount_paid || 0), 0) || 0;
  const currentPlan = dashboardData?.plans?.[0] || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/30 pt-2 pb-6 px-4 sm:px-6 md:px-10">
      <div className="mx-auto max-w-7xl space-y-6 px-2 sm:px-4 md:px-8 pb-8 pt-0">
        <WelcomeBanner name={userName} nextAppointment={nextApptData} />

        <QuickStats
          upcomingCount={totalUpcomingAppts}
          activePlansCount={activePlansCount}
          pendingTotal={pendingInvoicesTotal}
        />

        {/* Premium Conditional Active Treatment Billing and Installment Alert */}
        <TreatmentBillingAlert currentPlan={currentPlan} pendingTotal={pendingInvoicesTotal} />

        {/* TOP GRID: Upcoming Appointments & Reminders Side-by-Side */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UpcomingAppointments appointments={dashboardData?.appts || []} />
          </div>
          <div>
            <Notifications />
          </div>
        </div>

        {/* FULL WIDTH TREATMENT SECTION: Stretches cleanly across the layout */}
        <div className="w-full">
          <TreatmentProgress currentPlan={currentPlan} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Welcome Banner ---------- */
// [...unmodified content remains intact...]
function WelcomeBanner({
  name,
  nextAppointment,
}: {
  name: string;
  nextAppointment:
    | {
        scheduled_at: string;
        dentist_name?: string;
        treatment_type?: string;
      }
    | null
    | undefined;
}) {
  const hasNextAppt = !!nextAppointment;
  const formattedDate = hasNextAppt
    ? format(new Date(nextAppointment.scheduled_at), "eee, MMM dd")
    : "None Scheduled";
  const formattedTime = hasNextAppt ? format(new Date(nextAppointment.scheduled_at), "p") : "";

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f766e] to-[#14b8a6] p-6 text-white shadow-[0_20px_60px_rgba(20,184,166,0.18)] md:p-9">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-teal-200/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Patient Portal
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl truncate">
            Hello, {name} 👋
          </h1>

          <p className="mt-2 max-w-xl text-sm sm:text-base text-teal-50/90">
            Here's a calm overview of your dental health, upcoming visits, and ongoing care.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/portal/appointments"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Book appointment
            </Link>

            <Link
              to="/portal/prescriptions"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 backdrop-blur-xs whitespace-nowrap"
            >
              <FileText className="h-4 w-4 text-teal-200" />
              View Prescriptions
            </Link>

            <a
              href="tel:1234567890"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 backdrop-blur-xs whitespace-nowrap"
            >
              <Phone className="h-4 w-4 text-teal-200" />
              Contact Clinic
            </a>
          </div>
        </div>

        <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
          <div className="text-xs uppercase tracking-wider text-teal-50/80">Next appointment</div>

          <div className="mt-2 text-xl sm:text-2xl font-semibold truncate">{formattedDate}</div>

          {hasNextAppt ? (
            <div className="min-w-0">
              <div className="text-sm text-teal-50/90 truncate">
                {formattedTime} · {nextAppointment.dentist_name || "Clinic Dentist"}
              </div>

              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium max-w-full">
                <Clock className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {nextAppointment.treatment_type || "General Checkup"}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-sm text-teal-50/70">No upcoming appointments</div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Quick Stats ---------- */
// [...unmodified content remains intact...]
function QuickStats({
  upcomingCount,
  activePlansCount,
  pendingTotal,
}: {
  upcomingCount: number;
  activePlansCount: number;
  pendingTotal: number;
}) {
  const stats = [
    {
      label: "Upcoming appointments",
      value: String(upcomingCount),
      icon: Calendar,
      tint: "bg-teal-50 text-teal-600",
      to: "/portal/appointments",
    },
    {
      label: "Active treatments",
      value: String(activePlansCount),
      icon: Activity,
      tint: "bg-cyan-50 text-cyan-600",
      to: "/portal/treatment",
    },
    {
      label: "Pending payments",
      value: `$${pendingTotal}`,
      icon: CreditCard,
      tint: "bg-amber-50 text-amber-600",
      to: "/portal/billing",
    },
    {
      label: "Unread notifications",
      value: "3",
      icon: Bell,
      tint: "bg-rose-50 text-rose-600",
      to: "/portal/notifications",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Link
          key={s.label}
          to={s.to}
          className="group block rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${s.tint}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-slate-500" />
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">{s.value}</div>
          <div className="mt-1 text-sm text-slate-500 group-hover:text-slate-700 transition-colors">
            {s.label}
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ---------- Treatment Billing Alert ---------- */
// [...unmodified content remains intact...]
function TreatmentBillingAlert({
  currentPlan,
  pendingTotal,
}: {
  currentPlan: {
    title: string;
    progress?: number;
    currentStage?: string;
    estimatedCompletion?: string;
    nextAppointment?: string;
  } | null;
  pendingTotal: number;
}) {
  if (!currentPlan) return null;

  const treatmentName = currentPlan?.title || "Comprehensive Dental Protocol";
  const hasRemainingBalance = pendingTotal > 0;

  const nextInstallmentDate = "Jun 05, 2026";
  const paymentStatus = hasRemainingBalance ? "Partial Payment" : "Completed";

  if (hasRemainingBalance) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-amber-100/70 bg-gradient-to-r from-amber-50/50 via-white to-teal-50/20 p-5 shadow-sm shadow-slate-200/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-4 ring-amber-100/30">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700/90">
                  Ongoing Treatment Care Plan
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-100/60 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  {paymentStatus}
                </span>
              </div>
              <h3 className="mt-1 text-base font-semibold text-slate-900 truncate">
                {treatmentName}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <div>
                  Remaining Balance:{" "}
                  <span className="font-semibold text-slate-900">${pendingTotal}</span>
                </div>
                <div className="hidden sm:block h-1 w-1 rounded-full bg-slate-300" />
                <div>
                  Next Installment:{" "}
                  <span className="font-semibold text-slate-900">{nextInstallmentDate}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t border-slate-100 sm:border-none">
            <Link
              to="/portal/treatment"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 transition hover:text-teal-700"
            >
              Check Treatment Status!
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50/40 via-white to-teal-50/20 p-5 shadow-sm shadow-slate-200/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
              Account Status
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
              Treatment Fully Paid —{" "}
              <span className="font-normal text-slate-500">{treatmentName}</span>
            </h3>
          </div>
        </div>
        <Link
          to="/portal/treatment"
          className="text-xs font-semibold text-slate-600 hover:text-teal-600 bg-slate-100/70 px-4 py-2 rounded-full transition text-center"
        >
          View Plan Ledger
        </Link>
      </div>
    </div>
  );
}

/* ---------- Upcoming Appointments ---------- */
// [...unmodified content remains intact...]
function UpcomingAppointments({
  appointments,
}: {
  appointments: {
    dentist_name?: string;
    treatment_type?: string;
    scheduled_at: string;
    status?: string;
  }[];
}) {
  const displayAppts =
    appointments.length > 0
      ? appointments.map((a) => ({
          dentist: a.dentist_name || "Dr. Aisha Patel",
          type: a.treatment_type || "General Treatment",
          date: format(new Date(a.scheduled_at), "eee, MMM dd · p"),
          status: a.status || "Confirmed",
          statusTint:
            a.status === "Pending"
              ? "bg-amber-50 text-amber-700 ring-amber-200"
              : "bg-emerald-50 text-emerald-700 ring-emerald-200",
        }))
      : [
          {
            dentist: "Dr. Aisha Patel",
            type: "Teeth Whitening",
            date: "Tue, May 26 · 10:30 AM",
            status: "Confirmed",
            statusTint: "bg-emerald-50 text-emerald-700 ring-emerald-200",
          },
          {
            dentist: "Dr. Marco Liu",
            type: "Root Canal · Session 2",
            date: "Fri, May 29 · 2:00 PM",
            status: "Pending",
            statusTint: "bg-amber-50 text-amber-700 ring-amber-200",
          },
          {
            dentist: "Dr. Aisha Patel",
            type: "Routine Cleaning",
            date: "Mon, Jun 8 · 9:00 AM",
            status: "Confirmed",
            statusTint: "bg-emerald-50 text-emerald-700 ring-emerald-200",
          },
        ];

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/40 md:p-7 h-full">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Upcoming appointments</h2>
          <p className="text-sm text-slate-500">Your scheduled visits for the next 30 days.</p>
        </div>
        <Link
          to="/portal/appointments"
          className="self-start sm:self-center text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          View all
        </Link>
      </header>

      <ul className="mt-6 divide-y divide-slate-100">
        {displayAppts.map((a, idx) => (
          <li
            key={a.type + a.date + idx}
            className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-medium text-slate-900 truncate">{a.type}</div>
                <div className="text-sm text-slate-500 truncate">{a.dentist}</div>
                <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 max-w-full">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{a.date}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${a.statusTint}`}
              >
                {a.status}
              </span>
              <button className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700">
                Details
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Treatment Progress ---------- */
// Styling, typography, and child structure are exact. Section now fills the full width layout container cleanly.
function TreatmentProgress({
  currentPlan,
}: {
  currentPlan:
    | {
        progress_percentage?: number;
        title?: string;
        description?: string | null;
      }
    | null
    | undefined;
}) {
  let progress = currentPlan?.progress_percentage ?? 60;
  let treatmentName = currentPlan?.title ?? "Root canal therapy";
  let treatmentDesc = currentPlan?.description ?? "Lower right molar";
  let stagesToRender = [
    { label: "Stage 1", title: "Initial cleaning", done: true, current: false },
    { label: "Stage 2", title: "Pulp removal", done: true, current: false },
    { label: "Stage 3", title: "Sealing & crown", done: false, current: true },
  ];

  // Try loading dynamic treatment from localStorage
  const stored = localStorage.getItem("patient_ecosystem_P-8832");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.treatments)) {
        // Find the first active/ongoing treatment
        const activeTx = parsed.treatments.find((tx: any) => tx.status !== "Completed");
        if (activeTx) {
          treatmentName = activeTx.procedure;
          treatmentDesc = `Tooth ${activeTx.toothNumber}`;

          const total = activeTx.stages?.length || 0;
          const completed =
            activeTx.stages?.filter((s: any) => s.status === "completed").length || 0;
          progress = total > 0 ? Math.round((completed / total) * 100) : 0;

          stagesToRender = (activeTx.stages || []).map((stage: any, idx: number) => ({
            label: `Stage ${idx + 1}`,
            title: stage.name,
            done: stage.status === "completed",
            current: stage.status === "active",
          }));
        }
      }
    } catch (e) {
      console.error("Failed to parse patient treatments in overview:", e);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2dd4bf] to-[#99f6e4] p-6 text-white shadow-[0_20px_60px_rgba(20,184,166,0.22)] md:p-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 truncate">Current treatment</h2>
          <p className="text-sm text-slate-600 truncate">
            {treatmentName} · {treatmentDesc}
          </p>
        </div>
        <span className="self-start sm:self-center rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700 whitespace-nowrap">
          In progress
        </span>
      </header>

      <div className="mt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm text-slate-500">Overall progress</div>
            <div className="mt-1 text-3xl font-semibold text-slate-900">{progress}%</div>
          </div>
          <Link
            to="/portal/treatment"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors"
          >
            Check treatment status
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stagesToRender.slice(0, 3).map((stage, idx) => (
          <Stage
            key={idx}
            label={stage.label}
            title={stage.title}
            done={stage.done}
            current={stage.current}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-teal-100 bg-white p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm text-slate-500">Next procedure</div>
            <div className="text-sm font-medium text-slate-900 truncate">
              Sealing prep · Fri, May 29
            </div>
          </div>
        </div>
        <button className="w-full sm:w-auto rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 whitespace-nowrap">
          Prepare
        </button>
      </div>
    </section>
  );
}

function Stage({
  label,
  title,
  done,
  current,
}: {
  label: string;
  title: string;
  done?: boolean;
  current?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        current
          ? "border-teal-300 bg-white ring-2 ring-teal-100"
          : done
            ? "border-slate-100 bg-white"
            : "border-dashed border-slate-200 bg-white/50"
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
        ) : (
          <div
            className={`h-2 w-2 shrink-0 rounded-full ${current ? "bg-teal-500" : "bg-slate-300"}`}
          />
        )}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 text-sm font-medium text-slate-900 truncate">{title}</div>
    </div>
  );
}

/* ---------- Notifications ---------- */
// [...unmodified content remains intact...]
function Notifications() {
  const items = [
    {
      icon: Calendar,
      tint: "bg-teal-50 text-teal-600",
      title: "Appointment reminder",
      desc: "Whitening session tomorrow at 10:30 AM.",
      time: "2h ago",
    },
    {
      icon: Pill,
      tint: "bg-cyan-50 text-cyan-600",
      title: "Medication reminder",
      desc: "Take Amoxicillin 500mg after dinner.",
      time: "5h ago",
    },
    {
      icon: AlertCircle,
      tint: "bg-amber-50 text-amber-600",
      title: "Follow-up due",
      desc: "Schedule your 6-month cleaning visit.",
      time: "1d ago",
    },
  ];

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/40 h-full">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Reminders</h2>
        <Link
          to="/portal/notifications"
          className="text-xs font-medium text-teal-600 hover:text-teal-700 whitespace-nowrap"
        >
          Mark all read
        </Link>
      </header>

      <ul className="mt-4 space-y-3">
        {items.map(
          (n: { title: string; time: string; desc: string; tint: string; icon: LucideIcon }) => (
            <li
              key={n.title}
              className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/40 p-3 transition hover:bg-white hover:shadow-sm min-w-0"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${n.tint}`}
              >
                <n.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-medium text-slate-900">{n.title}</div>
                  <div className="shrink-0 text-xs text-slate-400">{n.time}</div>
                </div>
                <div className="mt-0.5 text-xs text-slate-500 line-clamp-2">{n.desc}</div>
              </div>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
