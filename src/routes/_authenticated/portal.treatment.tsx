import React, { useState, useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateMyPatient } from "@/lib/patient";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ToothChart } from "@/components/dashboard/ToothChart";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import {
  CheckCircle2,
  Clock,
  Calendar,
  Stethoscope,
  Activity,
  ChevronRight,
  FileText,
  User,
  Circle,
  X,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ==========================================
// TANSTACK ROUTE DEFINITION
// ==========================================
export const Route = createFileRoute("/_authenticated/portal/treatment")({
  component: TreatmentProgressPage,
});

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface TreatmentStep {
  id: string;
  name: string;
  description: string;
  status: "completed" | "active" | "upcoming";
  date?: string;
  careInstructions?: string;
}

interface ActiveTreatmentPlan {
  id: string;
  title: string;
  doctor: string;
  startDate: string;
  overallProgress: number;
  notes: string;
  stageLabel: string;
  steps: TreatmentStep[];
  nextAppointment: {
    date: string;
    time: string;
    purpose: string;
  };
}

export default function TreatmentProgressPage() {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedPlanIdState, setSelectedPlanIdState] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<TreatmentStep | null>(null);
  const [showFullHistory, setShowFullHistory] = useState<boolean>(false);

  // ==========================================
  // SUPABASE / TANSTACK QUERY DATA ENGINE
  // ==========================================
  const { data = { active: [], past: [], toothHistory: [] }, isLoading } = useQuery({
    queryKey: ["portal-treatments"],
    queryFn: async () => {
      const patient = await getOrCreateMyPatient();
      if (!patient) return { active: [], past: [], toothHistory: [] };

      const [plansRes, appointmentsRes, toothRes] = await Promise.all([
        supabase
          .from("treatment_plans")
          .select("*, tooth_treatments(*), treatment_steps(*)")
          .eq("patient_id", patient.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", patient.id)
          .gte("appointment_date", new Date().toISOString())
          .order("appointment_date")
          .limit(1),
        supabase
          .from("tooth_treatments")
          .select("*")
          .eq("patient_id", patient.id)
          .order("created_at", { ascending: false, nullsFirst: false }),
      ]);

      const plans = plansRes.data || [];
      const nextAppt = appointmentsRes.data?.[0] || null;

      const doctorIds = Array.from(
        new Set(plans.map((p) => p.doctor_id).filter((id): id is string => !!id)),
      );
      let doctors: any[] = [];
      if (doctorIds.length > 0) {
        const { data: docsRes } = await supabase
          .from("profiles")
          .select("id, full_name, specialization")
          .in("id", doctorIds);
        doctors = docsRes || [];
      }

      const active = plans
        .filter((p) => p.status === "planned" || p.status === "in_progress")
        .map((p) => {
          const doc = doctors.find((d) => d.id === p.doctor_id);
          const teeth = p.tooth_treatments || [];
          const toothReference =
            teeth.length > 0
              ? `Tooth ${teeth.map((t: any) => `#${t.tooth_number}`).join(", ")}`
              : undefined;

          const steps = (p.treatment_steps || [])
            .sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))
            .map((s: any, idx: number) => ({
              id: s.id,
              name: s.step_name || s.title,
              description: s.notes || "No details provided.",
              status:
                s.status === "completed"
                  ? ("completed" as const)
                  : s.status === "in_progress"
                    ? ("active" as const)
                    : ("upcoming" as const),
              date: s.completed_at ? format(new Date(s.completed_at), "MMM d, yyyy") : undefined,
              careInstructions: s.notes || undefined,
            }));

          const completedCount = steps.filter((s: any) => s.status === "completed").length;
          const progressPercent =
            steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
          const activeStep = steps.find((s: any) => s.status === "active") || steps[0];

          return {
            id: p.id,
            title: toothReference ? `${p.title} (${toothReference})` : p.title,
            doctor: doc?.full_name || "Lead Clinician",
            startDate: p.start_date
              ? format(new Date(p.start_date), "MMM d, yyyy")
              : format(new Date(p.created_at), "MMM d, yyyy"),
            overallProgress: progressPercent,
            stageLabel: activeStep ? activeStep.name : "Initial Stage",
            notes: p.description || "Active dental treatment protocol.",
            steps,
            nextAppointment: nextAppt
              ? {
                  date: format(new Date(nextAppt.appointment_date), "eee · MMM dd, yyyy"),
                  time: format(new Date(nextAppt.appointment_date), "p"),
                  purpose: nextAppt.service || "Progress Check-In",
                }
              : {
                  date: "—",
                  time: "Flexible",
                  purpose: "No upcoming visits scheduled.",
                },
          };
        });

      const past = plans
        .filter((p) => p.status === "completed" || p.status === "cancelled")
        .map((p) => {
          const doc = doctors.find((d) => d.id === p.doctor_id);
          const teeth = p.tooth_treatments || [];
          const toothReference =
            teeth.length > 0
              ? `Tooth ${teeth.map((t: any) => `#${t.tooth_number}`).join(", ")}`
              : undefined;

          return {
            id: p.id,
            title: p.title,
            toothReference,
            completedDate: p.end_date
              ? format(new Date(p.end_date), "MMM d, yyyy")
              : format(new Date(p.updated_at), "MMM d, yyyy"),
            doctor: doc?.full_name || "Lumident Clinician",
            summary: p.description || "Concluded clinical session.",
            statusLabel: p.status === "completed" ? "Completed" : "Cancelled",
          };
        });

      const toothHistory = (toothRes.data || []).map((t: any) => ({
        id: t.id,
        tooth_number: t.tooth_number,
        procedure: t.treatment_type || "Dental Procedure",
        status: t.status || "planned",
        performed_at: t.created_at,
        notes: t.notes || "",
      }));

      return { active, past, toothHistory };
    },
  });

  const activePlans = data.active;
  const pastPlans = data.past;
  const toothHistory = data.toothHistory;

  const selectedPlanId = selectedPlanIdState || activePlans[0]?.id || "";
  const currentActivePlan = activePlans.find((p) => p.id === selectedPlanId) || activePlans[0];
  const visiblePastTreatments = showFullHistory ? pastPlans : pastPlans.slice(0, 3);

  const [progressHeight, setProgressHeight] = useState<number | string>("0px");
  const timelineRef = useRef<HTMLDivElement>(null);
  const isJourneyFinished = currentActivePlan?.overallProgress === 100;

  useEffect(() => {
    if (!currentActivePlan) return;
    if (isJourneyFinished) {
      setProgressHeight("100%");
      return;
    }

    const updateHeight = () => {
      if (!timelineRef.current) return;
      const activeNode = timelineRef.current.querySelector(".active-timeline-node");
      if (activeNode) {
        const timelineRect = timelineRef.current.getBoundingClientRect();
        const nodeRect = activeNode.getBoundingClientRect();
        const relativeTop = nodeRect.top - timelineRect.top + nodeRect.height / 2;
        setProgressHeight(`${relativeTop}px`);
      } else {
        setProgressHeight("0px");
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    const timer = setTimeout(updateHeight, 100);

    return () => {
      window.removeEventListener("resize", updateHeight);
      clearTimeout(timer);
    };
  }, [currentActivePlan?.id, isJourneyFinished, selectedPlanId]);

  const currentToothHistory = selectedTooth
    ? toothHistory.filter((t) => t.tooth_number === selectedTooth)
    : [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/30">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 md:p-10 space-y-10 font-sans antialiased text-slate-900">
      <div className="w-full space-y-10">
        {/* ==========================================
            1. TREATMENT JOURNEY HEADER
           ========================================== */}
        <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5 sm:text-4xl">
              <Activity className="h-7 w-7 text-teal-600 stroke-[2.5]" />
              Treatment Journey
            </h1>
            <p className="text-sm font-medium text-slate-500 max-w-7xl">
              Interactive visualization of your operational care timelines, clinical adjustments,
              and personalized tooth history charts.
            </p>
          </div>
        </div>

        {activePlans.length > 0 ? (
          <div className="space-y-10 w-full">
            {/* COMPACT & CLEAN ACTIVE TREATMENT SUMMARY CARD */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs w-full">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 border border-teal-100/50 shadow-2xs">
                  Active Care Plan
                </div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 truncate mt-1">
                  {currentActivePlan.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-teal-600 stroke-[2]" /> {currentActivePlan.doctor}
                  </span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-teal-700 bg-teal-50/50 px-2 py-0.5 rounded text-xs font-bold">
                    Current: {currentActivePlan.stageLabel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-50/80 border border-slate-200/60 p-3 rounded-xl shadow-2xs shrink-0 sm:self-center">
                <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <motion.path
                      key={currentActivePlan.id}
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: `${currentActivePlan.overallProgress}, 100` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="text-teal-600"
                      strokeWidth="3"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xs font-mono font-black text-teal-700">
                    {currentActivePlan.overallProgress}%
                  </span>
                </div>
                <div className="leading-tight pr-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Overall Progress
                  </span>
                  <span className="text-xs font-bold text-slate-500">Plan Tracking</span>
                </div>
              </div>
            </div>

            {/* ==========================================
                2. INTERACTIVE ANATOMY CHART (MOVED UP)
               ========================================== */}
            <Card className="rounded-2xl border-slate-200 p-6 shadow-xs bg-white space-y-4 w-full">
              <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100/30 shadow-3xs">
                  🦷
                </span>
                Interactive Anatomy Chart
              </h3>
              <p className="text-xs font-medium text-slate-400 -mt-2">
                Select an individual tooth target inside the grid mapping structure to audit
                localized clinical logs.
              </p>
              <div className="flex justify-center p-4 bg-slate-50/30 rounded-2xl border border-slate-100">
                <ToothChart
                  marks={toothHistory.map((t) => ({
                    tooth_number: t.tooth_number,
                    status: t.status as any,
                    procedure: t.procedure,
                  }))}
                  selected={selectedTooth}
                  onSelect={setSelectedTooth}
                />
              </div>
            </Card>

            {/* ==========================================
                3. REDESIGNED VERTICAL JOURNEY TIMELINE
               ========================================== */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-10 shadow-sm relative w-full">
              <div className="absolute right-0 top-0 -mt-6 -mr-6 h-36 w-36 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

              <header className="border-b border-slate-100 pb-4 mb-10">
                <h3 className="text-lg font-bold text-slate-900">Treatment Timeline</h3>
                <p className="text-xs font-medium text-slate-400">
                  Sequential milestone path tracking your active clinical recovery stages.
                </p>
              </header>

              {/* TIMELINE TRACK WRAPPER */}
              <div ref={timelineRef} className="relative w-full py-4 overflow-hidden">
                {/* Central Continuous Journey Tracker Line */}
                <div className="absolute top-0 bottom-[96px] left-4 md:left-1/2 md:-translate-x-1/2 w-0.5 bg-slate-100 z-0">
                  <motion.div
                    initial={{ height: "0%" }}
                    animate={{ height: progressHeight }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                    className="w-full bg-teal-600 origin-top"
                  />
                </div>
                {/* Timeline Node Content Loop */}
                <div className="space-y-12 relative z-10 w-full">
                  {currentActivePlan.steps.map((step, idx) => {
                    const isCompleted = step.status === "completed";
                    const isActive = step.status === "active";
                    const isLeft = idx % 2 === 0;

                    const isTopGreen = isCompleted || isActive;
                    const isBottomGreen = isCompleted;

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.2 }}
                        className={`flex flex-col md:flex-row items-center w-[80%] mx-auto relative ${
                          isLeft ? "md:flex-row" : "md:flex-row-reverse"
                        }`}
                      >
                        {/* 1. Timeline Stage Detail Card Block */}
                        <div className="w-full md:w-1/2 flex justify-center px-4 md:px-12">
                          <motion.div
                            whileHover={{ scale: 1.015, y: -2 }}
                            className={`relative z-20 w-full max-w-sm bg-white border rounded-2xl p-5 shadow-2xs border-slate-200 transition-all duration-350 ${
                              isActive
                                ? "border-teal-400 ring-4 ring-teal-500/5 bg-teal-50/5 shadow-xs"
                                : ""
                            }`}
                          >
                            <div className="flex items-center border-b border-slate-100 pb-2 mb-2">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-widest ${
                                  isActive ? "text-teal-600" : "text-slate-400"
                                }`}
                              >
                                Stage {idx + 1}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              {step.name}

                              {isActive && (
                                <span className="bg-teal-50 border border-teal-100 text-teal-700 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider animate-pulse">
                                  Current
                                </span>
                              )}
                            </h4>

                            <p className="text-xs font-medium text-slate-500 leading-relaxed mt-1">
                              {step.description}
                            </p>

                            <div className="pt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setSelectedStep(step)}
                                className="text-[11px] font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-0.5 transition"
                              >
                                Full Overview <ChevronRight className="h-3 w-3" />
                              </button>
                            </div>
                          </motion.div>
                        </div>

                        {/* 2. Absolute Centered Timeline Pin Node */}
                        <div
                          className={`absolute left-4 md:left-1/2 -translate-x-1/2 z-20 transition-transform duration-500 ${isActive ? "active-timeline-node" : ""}`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedStep(step)}
                            className={`h-8 w-8 rounded-full flex items-center justify-center border transition-all duration-300 relative ${
                              isCompleted
                                ? "bg-teal-50 border-teal-600 text-teal-600 hover:bg-teal-100 shadow-2xs"
                                : isActive
                                  ? "bg-teal-600 border-teal-600 text-white hover:bg-teal-700 shadow-sm scale-110 ring-4 ring-teal-500/20"
                                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 shadow-3xs"
                            }`}
                          >
                            {isActive && (
                              <span className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping -z-10" />
                            )}
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                            ) : isActive ? (
                              <Clock className="h-4 w-4 stroke-[2.5]" />
                            ) : (
                              <Circle className="h-2 w-2 fill-current" />
                            )}
                          </button>
                        </div>

                        {/* Spacer block container for desktop vertical balancing grid row layout tracks */}
                        <div className="hidden md:block w-1/2" />
                      </motion.div>
                    );
                  })}

                  {/* 3. Final Destination Endpoint Node */}
                  {(() => {
                    const isJourneyFinished = currentActivePlan.overallProgress === 100;
                    const finalIndex = currentActivePlan.steps.length;

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: finalIndex * 0.2 }}
                        className="w-full flex flex-col items-center relative pt-16"
                      >
                        {/* Destination Card */}
                        <div className="w-full flex justify-center px-4 relative z-20">
                          {/* Centered Destination Node Pin */}
                          <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 z-30">
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center border transition-all duration-300 bg-white ${
                                isJourneyFinished
                                  ? "bg-emerald-50 border-emerald-600 text-emerald-600 shadow-2xs"
                                  : "bg-slate-50 border-slate-200 text-slate-300 shadow-3xs"
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                            </div>
                          </div>

                          <div
                            className={`w-full max-w-sm bg-white border text-center rounded-2xl p-5 shadow-2xs border-slate-200 transition-all duration-350 ${
                              isJourneyFinished
                                ? "border-emerald-400 bg-emerald-50/5 shadow-xs"
                                : "opacity-60"
                            }`}
                          >
                            <h4
                              className={`text-sm font-bold flex items-center justify-center gap-2 ${
                                isJourneyFinished ? "text-slate-900" : "text-slate-400"
                              }`}
                            >
                              Treatment Complete
                            </h4>
                            <p className="text-xs font-medium text-slate-500 leading-relaxed mt-1">
                              Your treatment journey is complete.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </div>
              </div>

              {/* Connected Next Appointment Indicator Strip Banner */}
              <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/10 p-4 shadow-2xs w-full">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100/30">
                    <Calendar className="h-5 w-5 stroke-[2]" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Next Procedure Visit
                    </div>
                    <div className="text-sm font-bold text-slate-800 truncate">
                      {currentActivePlan.nextAppointment.purpose} &bull;{" "}
                      <span className="text-teal-600 font-extrabold">
                        {currentActivePlan.nextAppointment.date}
                      </span>{" "}
                      ({currentActivePlan.nextAppointment.time})
                    </div>
                  </div>
                </div>
                <Link
                  to="/portal"
                  className="w-full sm:w-auto rounded-full bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-teal-700 whitespace-nowrap text-center"
                >
                  Manage Care Booking
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs max-w-md mx-auto space-y-4 w-full">
            <div className="mx-auto h-12 w-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center border border-teal-100/30 shadow-2xs">
              <Activity className="h-6 w-6 stroke-[2]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">No active plans running</h3>
              <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                You do not have any operational clinical care track milestones active at this
                moment.
              </p>
            </div>
          </div>
        )}

        {/* ==========================================
            4. COMPLETED HISTORY ARCHIVE
           ========================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 w-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-4">
            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-teal-600 stroke-[2]" />
                Completed History Archive
              </h3>
              <p className="text-xs font-medium text-slate-400">
                Completed treatment plans and past care records.
              </p>
            </div>
            <span className="text-xs font-bold font-mono text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs">
              Archive Total: {pastPlans.length} Records
            </span>
          </div>

          {pastPlans.length > 0 ? (
            <>
              <div
                className="transition-all duration-300 ease-in-out overflow-y-auto pr-1 space-y-4"
                style={{ maxHeight: showFullHistory ? "500px" : "none" }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  {visiblePastTreatments.map((past) => (
                    <div
                      key={past.id}
                      className="p-4 border border-slate-200 rounded-xl bg-slate-50/30 space-y-3 hover:bg-white hover:border-slate-300 transition-all duration-200 flex flex-col justify-between shadow-2xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                            {past.statusLabel}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            {past.completedDate}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                          {past.title}
                        </h4>
                        {past.toothReference ? (
                          <span className="inline-block text-[10px] text-teal-700 font-mono font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100/50 shadow-3xs">
                            {past.toothReference}
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] text-slate-400 font-mono italic">
                            General Care Record
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-500 border-t border-slate-100 pt-2.5 line-clamp-3 leading-relaxed">
                        {past.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {pastPlans.length > 3 && (
                <div className="pt-2 flex justify-center border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowFullHistory(!showFullHistory)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100/80 border border-teal-100/60 transition-all shadow-2xs"
                  >
                    {showFullHistory ? (
                      <>
                        <span>Collapse History View</span>
                        <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <span>Show Complete Archive ({pastPlans.length})</span>
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-xs font-medium text-slate-400 italic">
              No past historical treatments archived on this account ledger.
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          MODAL INTERACTIVE ACTION STAGE POP-UP
         ========================================== */}
      <AnimatePresence>
        {selectedStep && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStep(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-5 z-10 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      selectedStep.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedStep.status === "active"
                          ? "bg-teal-50 text-teal-700 border-teal-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    {selectedStep.status}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {selectedStep.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStep(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="text-sm text-slate-600 space-y-4">
                <p className="leading-relaxed font-medium text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200/60 shadow-inner">
                  {selectedStep.description}
                </p>

                {selectedStep.careInstructions && (
                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider text-teal-700">
                      <Info className="h-3.5 w-3.5 text-teal-600 stroke-[2.5]" />
                      Care Directives & Instructions
                    </div>
                    <p className="font-medium text-slate-600 bg-teal-50/10 p-4 rounded-xl border border-teal-100/40 leading-relaxed text-sm">
                      {selectedStep.careInstructions}
                    </p>
                  </div>
                )}

                {selectedStep.status === "active" && currentActivePlan.notes && (
                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider text-teal-700">
                      <FileText className="h-3.5 w-3.5 text-teal-600" />
                      Clinical Adjustments Note
                    </div>
                    <p className="font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed text-xs">
                      {currentActivePlan.notes}
                    </p>
                  </div>
                )}
              </div>

              {selectedStep.date && (
                <div className="pt-3.5 border-t border-slate-100 text-[11px] font-bold font-mono text-slate-400 flex justify-between items-center">
                  <span>SYSTEM MATRIX LOG SIGNED</span>
                  <span className="text-slate-800 font-black">{selectedStep.date}</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL INTERACTIVE TOOTH PROCEDURE HISTORY
         ========================================== */}
      <AnimatePresence>
        {selectedTooth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTooth(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4 z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-teal-600 stroke-[2]" />
                    Tooth #{selectedTooth} Treatment Log
                  </h3>
                  <p className="text-xs font-medium text-slate-400">
                    Past dental operations on this specific tooth location.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTooth(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[350px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {currentToothHistory.length > 0 ? (
                  currentToothHistory.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-xl border border-slate-200 p-4 text-sm bg-slate-50/40 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="font-bold text-slate-900 text-sm">{t.procedure}</p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                            t.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                              : t.status === "in_progress"
                                ? "bg-teal-50 text-teal-700 border-teal-200/50"
                                : "bg-amber-50 text-amber-700 border-amber-200/50"
                          }`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold font-mono">
                        {t.performed_at
                          ? `Executed: ${format(new Date(t.performed_at), "MMM d, yyyy")}`
                          : "Scheduled Pending"}
                      </p>
                      {t.notes && (
                        <p className="text-xs text-slate-600 leading-relaxed font-medium pt-2 border-t border-slate-200/40">
                          {t.notes}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400">
                      <Info className="h-5 w-5 stroke-[1.5]" />
                    </div>
                    <p className="text-xs font-medium text-slate-500 italic">
                      No treatment history recorded for this tooth.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTooth(null)}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                >
                  Close Records Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
