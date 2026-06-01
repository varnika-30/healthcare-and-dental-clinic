"use client";

import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  Clock,
  Plus,
  FileText,
  DollarSign,
  FlaskConical,
  Activity,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Heart,
  Info,
} from "lucide-react";
import { toast } from "sonner";

const CLINIC_SUMMARY = {
  doctorName: "Dr. Sarah",
  dayOverview: "Tuesday, May 26, 2026",
  headline: "You have 8 appointments scheduled today and 5 ongoing treatment follow-ups remaining.",
};

const TODAY_APPOINTMENTS = [
  {
    id: "APT-101",
    patientName: "Eleanor Vance",
    time: "10:30 AM",
    duration: "45 min",
    treatment: "Crown Fitting",
    status: "Ready",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    id: "APT-102",
    patientName: "Marcus Brody",
    time: "11:30 AM",
    duration: "30 min",
    treatment: "Root Canal Prep",
    status: "In Progress",
    statusColor: "bg-sky-50 text-sky-700 border-sky-100",
  },
  {
    id: "APT-103",
    patientName: "Sonia Al-Nasser",
    time: "01:15 PM",
    duration: "60 min",
    treatment: "Maxillary Inlay Fit",
    status: "Arrived",
    statusColor: "bg-amber-50 text-amber-700 border-amber-100",
  },
];

const ALL_ONGOING_TREATMENTS = [
  {
    id: "TRT-401",
    patientName: "Arthur Pendelton",
    treatmentName: "Porcelain Bridge Assembly",
    stage: "Stage 3 of 4: Fitting Iteration",
    labStatus: "Case Completed & Verified",
    labUrgent: false,
    paymentStatus: "Partial Balance",
    actionNeeded: "Schedule final cementation appointment",
  },
  {
    id: "TRT-402",
    patientName: "Clara Oswald",
    treatmentName: "Single Tooth Implant (#9)",
    stage: "Stage 1 of 3: Abutment Integration",
    labStatus: "Awaiting Lab Cast Verification",
    labUrgent: true,
    paymentStatus: "Paid",
    actionNeeded: "Review x-ray match upon arrival",
  },
  {
    id: "TRT-403",
    patientName: "David Tennant",
    treatmentName: "Complete Mandibular Denture",
    stage: "Stage 2 of 5: Wax Try-In Review",
    labStatus: "Wax Model Shipped from Lab",
    labUrgent: false,
    paymentStatus: "Partial Balance",
    actionNeeded: "Inspect physical model dimensions",
  },
];

const ALL_CLINICAL_ALERTS = [
  {
    id: "notif-01",
    message: "Crown case (#8, #9) returned from lab for Eleanor Vance.",
    tag: "Lab Match",
    style: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    id: "notif-05",
    message:
      "Custom prosthetic for Eleanor Vance was flagged ready for final adjustment. Check internal sterilization tray.",
    tag: "Lab Delivery",
    style: "bg-teal-50 text-teal-900 border-teal-200",
  },
  {
    id: "notif-02",
    message: "Follow-up schedule missed for diagnostic scan: Sarah Johnson.",
    tag: "Care Gap",
    style: "bg-slate-50 text-slate-700 border-slate-200/60",
  },
  {
    id: "notif-03",
    message: "2 outstanding treatment insurance claims remain partially paid.",
    tag: "Finance",
    style: "bg-rose-50 text-rose-800 border-rose-100",
  },
  {
    id: "notif-04",
    message: "System pre-authorization pending: Marcus Brody treatment modification.",
    tag: "Insurance",
    style: "bg-sky-50 text-sky-800 border-sky-100",
  },
];

export default function PatientDashboardOverview() {
  const navigate = useNavigate();
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [showAllTreatments, setShowAllTreatments] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const handleAction = (actionLabel: string) => {
    toast.info(`Opening drawer context: ${actionLabel}`);
  };

  const visibleAppointments = showAllAppointments
    ? TODAY_APPOINTMENTS
    : TODAY_APPOINTMENTS.slice(0, 3);

  const visibleTreatments = showAllTreatments
    ? ALL_ONGOING_TREATMENTS
    : ALL_ONGOING_TREATMENTS.slice(0, 1);

  const visibleAlerts = showAllAlerts ? ALL_CLINICAL_ALERTS : ALL_CLINICAL_ALERTS.slice(0, 3);

  return (
    <DashboardShell>
      <div className="min-h-screen bg-slate-50/60 text-slate-800 antialiased selection:bg-teal-100/80">
        {/* ==========================================
            1. PREMIUM LIGHTWEIGHT TEAL HERO SECTION
           ========================================== */}
        <div className="max-w-6xl mx-auto px-6 pt-8">
          <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-500 rounded-2xl py-8 px-8 md:py-10 shadow-md shadow-teal-900/10 text-white relative overflow-hidden border border-teal-600/50">
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center flex-wrap gap-2 text-xs font-bold tracking-wider uppercase text-teal-100/90">
                  <span>{CLINIC_SUMMARY.dayOverview}</span>
                  <span className="text-teal-200/60 font-serif">•</span>
                  <span className="bg-white/15 text-white px-3 py-1 rounded-full font-semibold text-[11px] backdrop-blur-xs">
                    Clinical Operations Center
                  </span>
                </div>

                <h1 className="text-3xl font-light tracking-tight text-white md:text-4xl leading-tight">
                  Good Morning,{" "}
                  <span className="font-bold text-white drop-shadow-xs">
                    {CLINIC_SUMMARY.doctorName}
                  </span>
                </h1>

                <p className="text-base text-teal-50 max-w-2xl font-medium leading-relaxed opacity-95">
                  {CLINIC_SUMMARY.headline}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg rounded-xl px-4 py-3.5 space-y-1.5 shrink-0 self-start md:self-auto min-w-[190px]">
                <span className="block text-[10px] font-bold text-teal-100 uppercase tracking-widest">
                  System Sync
                </span>
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                  <span>All Stations Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            2. ELEVATED QUICK ACTION BAR WITH BREATHING ROOM
           ========================================== */}
        <div className="max-w-6xl mx-auto px-6 pt-5">
          <div className="bg-white/80 border border-slate-200/60 backdrop-blur-md rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-4 hidden md:inline-block border-r border-slate-200/80 pr-5 mr-2 py-1.5">
              Quick Actions
            </span>

            <div className="grid grid-cols-3 sm:flex sm:items-center gap-2.5 w-full sm:w-auto flex-1">
              <button
                type="button"
                onClick={() => navigate({ to: "/admin/appointments" })}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50/50 rounded-xl text-sm font-semibold text-slate-700 transition group"
              >
                <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition-all shadow-3xs">
                  <Plus className="h-4 w-4" />
                </div>
                <span>Add Appointment</span>
              </button>

              

              <button
                type="button"
                onClick={() => navigate({ to: "/admin/ongoing-treatments" })}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50/50 rounded-xl text-sm font-semibold text-slate-700 transition group"
              >
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-3xs">
                  <DollarSign className="h-4 w-4" />
                </div>
                <span>Generate Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => navigate({ to: "/admin/appointments" })}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50/50 rounded-xl text-sm font-semibold text-slate-700 transition group"
              >
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-3xs">
                  <Activity className="h-4 w-4" />
                </div>
                <span>Book Follow-up</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==========================================
            3. MAIN TWO-COLUMN BALANCED LAYOUT
           ========================================== */}
        <div className="max-w-6xl mx-auto px-6 py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_0.8fr] gap-8 items-start">
            {/* LEFT COLUMN: PRIMARY OPERATIONS */}
            <div className="space-y-8">
              {/* TODAY'S APPOINTMENTS SECTOR WITH USABILITY THRESHOLD */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-base font-bold tracking-tight text-slate-800">
                    Today&apos;s Scheduled Consultations
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/admin/appointments" })}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    Full Schedule
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/50 shadow-xs overflow-hidden divide-y divide-slate-100">
                  {visibleAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-5 flex items-center justify-between gap-4 transition-colors hover:bg-slate-50/40 group"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => navigate({ to: "/dashboard" })}
                            className="text-lg font-semibold text-slate-900 group-hover:text-teal-600 transition-colors text-left hover:underline decoration-teal-500/40 decoration-2 underline-offset-2"
                          >
                            {apt.patientName}
                          </button>
                          <span className="text-xs text-slate-400 font-mono tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            {apt.id}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
                            <Clock className="h-4 w-4 text-slate-400" />
                            {apt.time}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600">{apt.treatment}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-400 font-normal">{apt.duration}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 shrink-0">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full border shadow-3xs ${apt.statusColor}`}
                        >
                          {apt.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAction(`Chart View for ${apt.patientName}`)}
                          className="p-2 text-slate-300 hover:text-slate-500 rounded-xl hover:bg-slate-50 transition-colors"
                          aria-label="View Details"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* CONDITIONAL ACTION TOGGLE */}
                  {TODAY_APPOINTMENTS.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllAppointments(!showAllAppointments)}
                      className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 border-t border-slate-100"
                    >
                      <span>
                        {showAllAppointments ? "Show Fewer Appointments" : "Show More Appointments"}
                      </span>
                      {showAllAppointments ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* ONGOING LONG-TERM TREATMENTS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-base font-bold tracking-tight text-slate-800">
                    Active Lab & Long-term Treatments
                  </h2>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {visibleTreatments.length} of {ALL_ONGOING_TREATMENTS.length} Cases
                  </span>
                </div>

                <div className="space-y-4">
                  {visibleTreatments.map((trt) => (
                    <div
                      key={trt.id}
                      className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-xs space-y-5 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                            Patient Case File
                          </span>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {trt.patientName}{" "}
                            <span className="text-slate-300 font-light mx-1">/</span>{" "}
                            <span className="text-slate-700 font-medium">{trt.treatmentName}</span>
                          </h3>
                        </div>
                        <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/40 px-3 py-1 rounded-xl self-start">
                          {trt.stage}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/40 p-4.5 rounded-2xl border border-slate-100 text-sm font-medium">
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Lab Assignment
                          </span>
                          <div className="flex items-center gap-2 text-slate-800">
                            <FlaskConical
                              className={`h-4 w-4 ${trt.labUrgent ? "text-amber-500" : "text-teal-500"}`}
                            />
                            <span
                              className={
                                trt.labUrgent
                                  ? "text-amber-800 font-bold"
                                  : "text-slate-700 font-semibold"
                              }
                            >
                              {trt.labStatus}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Ledger Balance
                          </span>
                          <span className="text-slate-700 font-semibold block pt-0.5">
                            {trt.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-2 text-sm border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 min-w-0">
                          <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="font-normal truncate text-slate-600">
                            {trt.actionNeeded}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate({ to: "/admin/ongoing-treatments" })}
                          className="text-xs font-bold uppercase tracking-wider text-teal-600 hover:text-teal-700 shrink-0 hover:underline transition-colors"
                        >
                          Update Case
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* EXPANSION CONTROL FOOTER */}
                  {ALL_ONGOING_TREATMENTS.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowAllTreatments(!showAllTreatments)}
                      className="w-full py-3 bg-white hover:bg-slate-50/80 text-slate-600 hover:text-slate-900 font-bold text-xs uppercase tracking-widest rounded-2xl transition flex items-center justify-center gap-2 border border-slate-200/50 shadow-3xs"
                    >
                      <span>{showAllTreatments ? "Show Fewer Cases" : "Show More Cases"}</span>
                      {showAllTreatments ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ALERTS & REBALANCING CARE PHILOSOPHY */}
            <div className="space-y-6">
              {/* CLINICAL ALERTS CARD MODULE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-base font-bold tracking-tight text-slate-800">
                    Clinical Alerts & Tasks
                  </h2>
                  <Activity className="h-4 w-4 text-teal-500/80" />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/50 shadow-xs overflow-hidden divide-y divide-slate-100">
                  {visibleAlerts.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 space-y-2.5 text-sm transition-colors hover:bg-slate-50/30"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border shadow-3xs ${item.style}`}
                        >
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium leading-relaxed">{item.message}</p>
                    </div>
                  ))}

                  {/* EXPANSION CONTROL FOOTER FOR ALERTS */}
                  {ALL_CLINICAL_ALERTS.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllAlerts(!showAllAlerts)}
                      className="w-full py-3.5 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition flex items-center justify-center gap-1.5 border-t border-slate-100"
                    >
                      <span>{showAllAlerts ? "Collapse Alerts" : "Show More Alerts"}</span>
                      {showAllAlerts ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* ==========================================
                  4. REBALANCING CLINICAL CARE PHILOSOPHY CARD
                 ========================================== */}
              <div className="bg-gradient-to-br from-teal-50 via-teal-100/40 to-cyan-50/30 border border-teal-200 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[160px]">
                <div className="absolute -right-4 -bottom-4 text-teal-600/10 pointer-events-none">
                  <Heart className="h-24 w-24" strokeWidth={1.2} />
                </div>
                <div className="absolute -left-6 -top-6 text-cyan-600/5 pointer-events-none">
                  <Heart className="h-16 w-16" strokeWidth={1} />
                </div>

                <div className="space-y-3 relative z-10 w-full">
                  <div className="flex items-center justify-center gap-2">
                    <div className="p-1.5 bg-teal-600 text-white rounded-lg shadow-2xs">
                      <Heart className="h-4 w-4 fill-white/10" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider text-teal-900">
                      Care Philosophy
                    </span>
                  </div>

                  <div className="h-px bg-teal-200/60 max-w-[80px] mx-auto my-1" />

                  <p className="text-sm font-medium italic text-slate-700 px-2 leading-relaxed">
                    &ldquo;Consistency in care builds long-term patient trust.&rdquo;
                  </p>
                </div>
              </div>

              {/* OPTIONAL CONTEXT INFO NOTE STRIP */}
              <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400 font-medium">
                <Info className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                <span>Operational feed refreshes in real-time.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: PatientDashboardOverview,
});
