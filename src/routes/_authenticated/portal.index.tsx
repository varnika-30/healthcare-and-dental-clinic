import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateMyPatient } from "@/lib/patient";
import { useAuth } from "@/lib/auth-context";
import { calculatePlanBilling } from "@/lib/billing";
import {
  Sparkles,
  Plus,
  Clock,
  Calendar,
  Activity,
  CreditCard,
  Bell,
  Stethoscope,
  CheckCircle2,
  FileText,
  Phone,
  Pill,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { AppointmentBookingModal } from "@/components/portal/AppointmentBookingModal";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => ({ meta: [{ title: "Overview — Lumident" }] }),
  component: PortalHome,
});

function PortalHome() {
  const { user } = useAuth();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const userName =
    (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "there";

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["portal-overview"],
    queryFn: async () => {
      const patient = await getOrCreateMyPatient();
      if (!patient) return null;

      const [appts, scripts, plans, txs, notifs] = await Promise.all([
        supabase
          .from("appointments")
          .select("*, profiles(full_name)")
          .eq("patient_id", patient.id)
          .gte("appointment_date", new Date().toISOString())
          .order("appointment_date")
          .limit(5),
        supabase
          .from("prescriptions")
          .select("*")
          .eq("patient_id", patient.id)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("treatment_plans")
          .select("*, treatment_steps(*)")
          .eq("patient_id", patient.id),
        supabase.from("payment_transactions").select("*").eq("patient_id", patient.id),
        patient.user_id
          ? supabase
              .from("notifications")
              .select("*")
              .eq("user_id", patient.user_id)
              .order("created_at", { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [] }),
      ]);

      // Calculate accurate pending financial metrics matching the Billing page engine
      const plansList = plans.data || [];
      const transactionsList = txs.data || [];
      let calculatedPendingTotal = 0;

      plansList.forEach((plan) => {
        const planTransactions = transactionsList.filter((tx) => tx.plan_id === plan.id);
        const billing = calculatePlanBilling(plan, planTransactions);
        calculatedPendingTotal += billing.outstandingAmount;
      });

      const activePlans = plansList.filter((p) => p.status !== "completed");

      return {
        patient,
        appts: (appts.data as any[]) ?? [],
        scripts: scripts.data ?? [],
        pendingInvoicesTotal: calculatedPendingTotal,
        plans: activePlans,
        notifications: notifs.data ?? [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/30">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  // Safely extract values or provide fallback UI statistics
  const nextApptData = dashboardData?.appts?.[0];
  const totalUpcomingAppts = dashboardData?.appts?.length || 0;
  const activePlansCount = dashboardData?.plans?.length || 0;
  const pendingInvoicesTotal = dashboardData?.pendingInvoicesTotal || 0;
  const currentPlan = dashboardData?.plans?.[0] || null;
  const unreadNotificationsCount =
    dashboardData?.notifications?.filter((n) => n.read_at === null).length || 0;

  return (
    <div className="min-h-screen w-full bg-slate-50/40 font-sans antialiased text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      <div className="w-full max-w-none p-4 sm:p-6 md:p-10 space-y-10">
        <WelcomeBanner
          name={userName}
          nextAppointment={nextApptData}
          onBookClick={() => setIsBookingModalOpen(true)}
        />

        <QuickStats
          upcomingCount={totalUpcomingAppts}
          activePlansCount={activePlansCount}
          pendingTotal={pendingInvoicesTotal}
          unreadCount={unreadNotificationsCount}
        />

        {/* Premium Conditional Financial Summary Alert */}
        <TreatmentBillingAlert currentPlan={currentPlan} pendingTotal={pendingInvoicesTotal} />

        {/* TOP GRID: Upcoming Appointments & Reminders Side-by-Side */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-stretch">
          <div className="lg:col-span-2">
            <UpcomingAppointments appointments={dashboardData?.appts || []} />
          </div>
          <div className="h-full">
            <Notifications notifications={dashboardData?.notifications || []} />
          </div>
        </div>

        {/* FULL WIDTH TREATMENT SECTION: Stretches cleanly across the layout */}
        <div className="w-full">
          <TreatmentProgress currentPlan={currentPlan} nextAppointment={nextApptData} />
        </div>
      </div>
      <AppointmentBookingModal
        open={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </div>
  );
}

/* ---------- Welcome Banner ---------- */
function WelcomeBanner({
  name,
  nextAppointment,
  onBookClick,
}: {
  name: string;
  nextAppointment: any;
  onBookClick: () => void;
}) {
  const hasNextAppt = !!nextAppointment && !!nextAppointment.appointment_date;
  const formattedDate = hasNextAppt
    ? format(new Date(nextAppointment.appointment_date), "eee, MMM dd")
    : "None Scheduled";
  const formattedTime = hasNextAppt ? format(new Date(nextAppointment.appointment_date), "p") : "";

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f766e] to-[#14b8a6] p-6 text-white shadow-sm md:p-9 ring-1 ring-black/[0.02]">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-teal-200/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md shadow-2xs border border-white/5">
            <Sparkles className="h-3.5 w-3.5 text-teal-200" />
            Patient Portal
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Hello, {name} 👋
          </h1>

          <p className="max-w-xl text-sm sm:text-base text-teal-50/90 font-medium leading-relaxed">
            Here's a calm overview of your dental health, upcoming visits, and ongoing care plans.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onBookClick}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-teal-700 shadow-sm transition-all hover:bg-teal-50 hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Book Appointment
            </button>

            <a
              href="tel:1234567890"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/20 backdrop-blur-xs whitespace-nowrap"
            >
              <Phone className="h-4 w-4 text-teal-200" />
              Contact Clinic
            </a>
          </div>
        </div>

        <div className="w-full lg:w-96 shrink-0 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
            <Calendar className="h-24 w-24 stroke-[1.2]" />
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              Next Appointment
            </div>
            <div className="mt-1 text-xl font-extrabold tracking-tight text-white">
              {formattedDate}
            </div>
          </div>

          {hasNextAppt ? (
            <div className="space-y-2.5 mt-4">
              <div className="text-xs font-medium text-white/80 truncate">
                {formattedTime} <span className="text-white/40 mx-1.5">•</span>{" "}
                {nextAppointment.profiles?.full_name || "Assigned Provider"}
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/90 shadow-2xs border border-white/5">
                <Clock className="h-3 w-3 shrink-0 text-white/60" />
                <span className="truncate">{nextAppointment.service || "General Checkup"}</span>
              </div>
            </div>
          ) : (
            <div className="mt-auto text-xs text-white/50 font-medium italic">
              No upcoming appointments
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Quick Stats ---------- */
function QuickStats({
  upcomingCount,
  activePlansCount,
  pendingTotal,
  unreadCount,
}: {
  upcomingCount: number;
  activePlansCount: number;
  pendingTotal: number;
  unreadCount: number;
}) {
  const stats = [
    {
      label: "Upcoming Appointments",
      value: String(upcomingCount),
      icon: Calendar,
      tint: "bg-teal-50 text-teal-600 border border-teal-100/50",
    },
    {
      label: "Active Treatments",
      value: String(activePlansCount),
      icon: Activity,
      tint: "bg-cyan-50 text-cyan-600 border border-cyan-100/50",
    },
    {
      label: "Pending Payments",
      value: `₹${pendingTotal.toLocaleString()}`,
      icon: CreditCard,
      tint: "bg-amber-50 text-amber-600 border border-amber-100/50",
    },
    {
      label: "Unread Notifications",
      value: String(unreadCount),
      icon: Bell,
      tint: "bg-rose-50 text-rose-600 border border-rose-100/50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
      {stats.map((s) => (
        <div
          key={s.label}
          className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default"
        >
          <div className="flex items-center justify-between">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.tint}`}>
              <s.icon className="h-5 w-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-slate-900 tracking-tight">{s.value}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Treatment Billing Alert ---------- */
function TreatmentBillingAlert({
  currentPlan,
  pendingTotal,
}: {
  currentPlan: {
    title: string;
    due_date?: string | null;
  } | null;
  pendingTotal: number;
}) {
  if (!currentPlan) return null;

  const treatmentName = currentPlan?.title || "Comprehensive Dental Protocol";
  const hasRemainingBalance = pendingTotal > 0;

  const nextInstallmentDate = currentPlan?.due_date
    ? format(new Date(currentPlan.due_date), "MMM dd, yyyy")
    : "—";
  const paymentStatus = hasRemainingBalance ? "Partial Payment" : "Completed";

  if (hasRemainingBalance) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/10 p-5 shadow-xs ring-1 ring-black/[0.01]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <CreditCard className="h-5 w-5 stroke-[2]" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
                  Payment Summary
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-200/50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                  {paymentStatus}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 truncate">
                ₹{pendingTotal.toLocaleString()} Outstanding
              </h3>

              <div className="pt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                <div>
                  Treatment Plan: <span className="font-bold text-slate-700">{treatmentName}</span>
                </div>
                <div className="hidden sm:block h-1 w-1 rounded-full bg-slate-300" />
                <div>
                  Next Installment:{" "}
                  <span className="font-bold text-slate-900">{nextInstallmentDate}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t border-slate-100 sm:border-none shrink-0">
            <Link
              to="/portal/billing"
              className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal-600 transition hover:text-teal-700"
            >
              View Billing Details
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/30 via-white to-teal-50/10 p-5 shadow-xs ring-1 ring-black/[0.01]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ShieldCheck className="h-5 w-5 stroke-[2]" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
              Account Status
            </div>
            <h3 className="text-sm font-bold text-slate-900 truncate">
              Treatment Fully Paid &mdash;{" "}
              <span className="font-medium text-slate-500">{treatmentName}</span>
            </h3>
          </div>
        </div>
        <Link
          to="/portal/billing"
          className="text-xs font-bold text-slate-600 hover:text-teal-600 bg-slate-100/80 border border-slate-200 px-4 py-2 rounded-full transition text-center shrink-0"
        >
          View Plan Ledger
        </Link>
      </div>
    </div>
  );
}

/* ---------- Upcoming Appointments ---------- */
function UpcomingAppointments({ appointments }: { appointments: any[] }) {
  const displayAppts = appointments.map((a) => {
    const hasDate = !!a.appointment_date;

    let dateStr = "—";
    if (hasDate) {
      const parsedDate = new Date(a.appointment_date);
      dateStr = `${format(parsedDate, "eee, MMM dd")} &bull; ${format(parsedDate, "p")}`;
    }

    return {
      dentist: a.profiles?.full_name || "Assigned Provider",
      type: a.service || "General Treatment",
      date: dateStr,
      status:
        a.status === "confirmed"
          ? "Confirmed"
          : a.status === "requested"
            ? "Requested"
            : a.status || "Confirmed",
      statusTint:
        a.status === "requested"
          ? "bg-amber-50 text-amber-700 border border-amber-200/60 font-semibold"
          : "bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold",
    };
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs md:p-6 h-full flex flex-col justify-between">
      <div>
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Appointments</h2>
            <p className="text-xs font-medium text-slate-400">
              Your scheduled visits for the next 30 days.
            </p>
          </div>
          <Link
            to="/portal/appointments"
            className="self-start sm:self-center text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100/50 transition-all"
          >
            View All
          </Link>
        </header>

        {displayAppts.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {displayAppts.map((a, idx) => (
              <li
                key={a.type + a.date + idx}
                className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/30 transition-colors rounded-xl px-2 -mx-2"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100/30">
                    <Stethoscope className="h-5 w-5 stroke-[2]" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-base font-bold text-slate-900 truncate">{a.type}</div>
                    <div className="text-sm font-semibold text-slate-500 truncate">{a.dentist}</div>
                    <div className="pt-1 inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium max-w-full">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span
                        className="truncate tabular-nums"
                        dangerouslySetInnerHTML={{ __html: a.date }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${a.statusTint}`}
                  >
                    {a.status}
                  </span>
                  <Link
                    to="/portal/appointments"
                    className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-teal-300 hover:text-teal-700"
                  >
                    Details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-16 px-4 text-center max-w-sm mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 shadow-2xs">
              <Calendar className="h-6 w-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">No appointments found</h3>
              <p className="text-xs text-slate-400 font-medium">
                No upcoming appointments scheduled within the next 30 days.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Treatment Progress ---------- */
function TreatmentProgress({
  currentPlan,
  nextAppointment,
}: {
  currentPlan: any;
  nextAppointment?: any;
}) {
  if (!currentPlan) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs w-full">
        <header className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Current Treatment</h2>
        </header>
        <div className="py-16 px-4 text-center max-w-sm mx-auto space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 shadow-2xs">
            <Activity className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">No active treatment</h3>
            <p className="text-xs text-slate-400 font-medium">
              You don't have an active or multi-stage care prescription running at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const steps = currentPlan.treatment_steps || [];
  const completedCount = steps.filter((s: any) => s.status === "completed").length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const treatmentName = currentPlan.title ?? "Comprehensive Care";
  const treatmentDesc = currentPlan.description ?? "Active treatment phase";

  const stagesToRender = steps
    .sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))
    .map((step: any, idx: number) => ({
      label: `Stage ${idx + 1}`,
      title: step.step_name || step.title,
      done: step.status === "completed",
      current: step.status === "in_progress",
    }));

  const hasNext = !!nextAppointment && !!nextAppointment.appointment_date;

  let nextText = "No visits scheduled";
  if (hasNext) {
    const parsedNextDate = new Date(nextAppointment.appointment_date);
    nextText = `${nextAppointment.service || "Procedure"} &bull; ${format(parsedNextDate, "eee, MMM dd")}`;
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs w-full space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-lg font-bold text-slate-900 truncate">Current Treatment</h2>
          <p className="text-xs font-semibold text-slate-400 truncate">
            {treatmentName} &bull; {treatmentDesc}
          </p>
        </div>
        <span className="self-start sm:self-center rounded-full bg-teal-50 border border-teal-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-700 whitespace-nowrap">
          In Progress
        </span>
      </header>

      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Overall Progress
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">
              {progress}%
            </div>
          </div>
          <Link
            to="/portal/treatment"
            className="group inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
          >
            Check Full Schedule
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 stroke-[2.5]" />
          </Link>
        </div>

        <div className="mt-3 w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/30 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500 ease-out shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {stagesToRender.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stagesToRender.slice(0, 3).map((stage: any, idx: number) => (
            <Stage
              key={idx}
              label={stage.label}
              title={stage.title}
              done={stage.done}
              current={stage.current}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/10 p-4 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100/30">
            <Calendar className="h-5 w-5 stroke-[2]" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Next Procedure
            </div>
            <div
              className="text-sm font-semibold text-slate-800 truncate"
              dangerouslySetInnerHTML={{ __html: nextText }}
            />
          </div>
        </div>
        <Link
          to="/portal/appointments"
          className={`w-full sm:w-auto rounded-full bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-teal-700 whitespace-nowrap text-center ${!hasNext ? "opacity-50 pointer-events-none" : ""}`}
        >
          Prepare Care
        </Link>
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
      className={`rounded-xl border p-4 transition-all duration-200 shadow-2xs ${
        current
          ? "border-teal-300 bg-teal-50/10 ring-4 ring-teal-500/5"
          : done
            ? "border-slate-200 bg-white"
            : "border-dashed border-slate-200 bg-slate-50/40"
      }`}
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 stroke-[2.5]" />
        ) : (
          <div
            className={`h-2 w-2 shrink-0 rounded-full ${current ? "bg-teal-500 animate-pulse" : "bg-slate-300"}`}
          />
        )}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 text-sm font-bold text-slate-900 truncate">{title}</div>
    </div>
  );
}

/* ---------- Notifications ---------- */
function Notifications({ notifications }: { notifications: any[] }) {
  const items = notifications.map((dbN) => {
    let icon = Bell;
    let tint = "bg-teal-50 text-teal-600 border border-teal-100/30";
    if (dbN.type === "billing") {
      icon = CreditCard;
      tint = "bg-amber-50 text-amber-600 border border-amber-100/30";
    } else if (dbN.type === "followup") {
      icon = Pill;
      tint = "bg-cyan-50 text-cyan-600 border border-cyan-100/30";
    } else if (dbN.type === "reminder") {
      icon = Calendar;
      tint = "bg-teal-50 text-teal-600 border border-teal-100/30";
    }

    let time = "";
    if (dbN.created_at) {
      const dateObj = new Date(dbN.created_at);
      const timeDiff = new Date().getTime() - dateObj.getTime();
      time = dbN.created_at.split("T")[0];
      if (timeDiff < 60000) {
        time = "just now";
      } else if (timeDiff < 3600000) {
        time = `${Math.floor(timeDiff / 60000)}m ago`;
      } else if (timeDiff < 86400000) {
        time = `${Math.floor(timeDiff / 3600000)}h ago`;
      } else {
        const days = Math.floor(timeDiff / 86400000);
        time = days === 1 ? "1d ago" : `${days}d ago`;
      }
    }

    return {
      icon,
      tint,
      title: dbN.title || "Remind Alert",
      desc: dbN.body || "",
      time,
    };
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs h-full flex flex-col justify-between">
      <div>
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-900">Reminders</h2>
            <p className="text-xs font-medium text-slate-400">Recent action points.</p>
          </div>
          <Link
            to="/portal/notifications"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100/50 transition-all whitespace-nowrap"
          >
            View All
          </Link>
        </header>

        {items.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {items.map(
              (n: {
                title: string;
                time: string;
                desc: string;
                tint: string;
                icon: LucideIcon;
              }) => (
                <li
                  key={n.title + n.time}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3 transition hover:bg-white hover:shadow-xs min-w-0"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${n.tint}`}
                  >
                    <n.icon className="h-4 w-4 stroke-[2]" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-bold text-slate-900">{n.title}</div>
                      <div className="shrink-0 text-[10px] font-bold text-slate-400 lowercase tabular-nums">
                        {n.time}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                      {n.desc}
                    </div>
                  </div>
                </li>
              ),
            )}
          </ul>
        ) : (
          <div className="py-16 px-4 text-center max-w-sm mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 shadow-2xs">
              <Bell className="h-6 w-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Clear backlog</h3>
              <p className="text-xs text-slate-400 font-medium">
                No alerts or unread notifications pending feedback.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
