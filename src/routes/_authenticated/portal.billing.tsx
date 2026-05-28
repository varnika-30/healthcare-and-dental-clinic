import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  HelpCircle,
  FileText,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  PhoneCall,
} from "lucide-react";

// ==========================================
// TANSTACK ROUTE COUPLING
// ==========================================
export const Route = createFileRoute("/_authenticated/portal/billing")({
  component: PortalBillingPage,
});

// ==========================================
// COMPATIBLE DATA INTERFACES
// ==========================================
interface TreatmentPayment {
  id: string;
  treatment_name: string;
  current_stage: number;
  total_stages: number;
  total_cost: number;
  paid_amount: number;
  status: "cleared" | "active" | "planned";
  due_date?: string;
  next_step_requirement?: string;
}

function PortalBillingPage() {
  // ==========================================
  // SUPABASE / TANSTACK QUERY DATA ENGINE
  // ==========================================
  const { data: treatmentsPaymentData, isLoading } = useQuery({
    queryKey: ["patient-treatment-payments"],
    queryFn: async () => {
      const mockData: TreatmentPayment[] = [
        {
          id: "tp-1",
          treatment_name: "Deep Root Canal Therapy",
          current_stage: 2,
          total_stages: 5,
          total_cost: 15000,
          paid_amount: 12000,
          status: "active",
          due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
          next_step_requirement: "Payment required before crown placement procedure.",
        },
        {
          id: "tp-2",
          treatment_name: "Dental Cleaning & Examination",
          current_stage: 1,
          total_stages: 1,
          total_cost: 2500,
          paid_amount: 2500,
          status: "cleared",
        },
        {
          id: "tp-3",
          treatment_name: "Teeth Whitening Session",
          current_stage: 0,
          total_stages: 2,
          total_cost: 8000,
          paid_amount: 0,
          status: "planned",
          next_step_requirement: "Initial deposit due on or before appointment validation.",
        },
      ];
      return mockData;
    },
  });

  const activePlan = treatmentsPaymentData?.find((t) => t.status === "active");
  const upcomingReminders = treatmentsPaymentData?.filter(
    (t) => t.status !== "cleared" && t.next_step_requirement,
  );
  const remainingDue = activePlan ? activePlan.total_cost - activePlan.paid_amount : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusChipStyles = (status: TreatmentPayment["status"]) => {
    switch (status) {
      case "cleared":
        return "bg-emerald-50 border-emerald-100 text-emerald-700";
      case "active":
        return "bg-teal-50 border-teal-100 text-teal-700";
      case "planned":
        return "bg-slate-50 border-slate-200 text-slate-500";
    }
  };

  return (
    <div className="min-w-0 w-full overflow-x-hidden font-sans antialiased text-slate-900">
      <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 overflow-x-hidden px-4 pb-12 pt-2 sm:px-6 md:space-y-8 md:px-8 md:pt-4 lg:px-10">
        {/* HEADER BLOCK */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
              Treatment Payment Status
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed max-w-2xl break-words">
              Review care-connected milestones, transparent pricing plans, and upcoming installment
              tracks.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse space-y-2 text-center">
              <div className="h-4 w-32 bg-slate-200 rounded-full mx-auto"></div>
              <div className="h-3 w-48 bg-slate-100 rounded-full mx-auto"></div>
            </div>
          </div>
        ) : (
          <>
            {/* ==========================================
                CURRENT DUE SUMMARY CARD (FIXED RESPONSIVE)
               ========================================== */}
            {activePlan && (
              <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl p-5 sm:p-6 md:p-14 text-white shadow-xl shadow-teal-900/10 relative overflow-hidden w-full min-w-0 max-w-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />

                {/* Formatted to stack as vertical flex-col instantly below xl desktop sizes */}
                <div className="flex flex-col xl:flex-row xl:items-stretch justify-between gap-6 relative z-10 min-w-0 w-full max-w-full">
                  {/* Left Balance Details Content Section */}
                  <div className="w-full min-w-0 max-w-full flex-1 flex flex-col justify-between space-y-4 xl:space-y-0">
                    <div className="space-y-2">
                      <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-teal-100 bg-teal-500/30 px-3 py-1 rounded-full backdrop-blur-xs">
                        Current Balance Due
                      </span>
                      {/* whitespace-nowrap locks the balance layout from folding vertically letter-by-letter */}
                      <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight whitespace-nowrap">
                        {formatCurrency(remainingDue)}
                      </h2>
                    </div>

                    <div className="space-y-1.5 w-full min-w-0 max-w-full">
                      {/* Removed aggressive break-words and applied natural text layout styling instead */}
                      <p className="text-sm md:text-base text-teal-50/90 font-semibold flex items-start gap-2.5 min-w-0 w-full max-w-full">
                        <Activity className="h-5 w-5 shrink-0 text-teal-300 mt-0.5" />
                        <span className="block min-w-0 flex-1 whitespace-normal break-normal leading-tight">
                          Connected to:{" "}
                          <span className="underline decoration-teal-300/50 underline-offset-4 font-bold">
                            {activePlan.treatment_name}
                          </span>
                        </span>
                      </p>
                      <p className="text-xs sm:text-sm text-teal-200/80 font-medium whitespace-normal break-normal">
                        Due before next scheduled clinical procedure step
                      </p>
                    </div>
                  </div>

                  {/* Payment Milestone section falls underneath unless on desktop xl screens */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 w-full xl:w-80 shrink-0 border border-white/10 space-y-3 flex flex-col justify-center min-w-0 max-w-full">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-teal-100 uppercase tracking-wider">
                      <span>Milestone Progress</span>
                      <span>
                        {Math.round((activePlan.paid_amount / activePlan.total_cost) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-teal-950/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-300 rounded-full transition-all duration-500"
                        style={{
                          width: `${(activePlan.paid_amount / activePlan.total_cost) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] sm:text-xs text-teal-100/90 font-medium text-center whitespace-normal break-normal">
                      {formatCurrency(activePlan.paid_amount)} paid out of{" "}
                      {formatCurrency(activePlan.total_cost)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TWO COLUMN GRID STACK ON MOBILE/TABLET */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full min-w-0 max-w-full">
              {/* ==========================================
                  ACTIVE TREATMENT PAYMENT STATUS
                 ========================================== */}
              <div className="lg:col-span-2 space-y-6 w-full min-w-0 max-w-full">
                <div className="space-y-4 w-full">
                  <div className="flex items-center gap-2 px-1">
                    <CreditCard className="h-4 w-4 text-teal-600 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">
                      Active Care Track Breakdown
                    </h3>
                  </div>

                  {treatmentsPaymentData
                    ?.filter((t) => t.status === "active" || t.status === "planned")
                    .map((track) => {
                      const totalDue = track.total_cost - track.paid_amount;
                      const paymentPercentage =
                        track.total_cost > 0 ? (track.paid_amount / track.total_cost) * 100 : 0;
                      const treatmentPercentage =
                        track.total_stages > 0
                          ? (track.current_stage / track.total_stages) * 100
                          : 0;

                      return (
                        <div
                          key={track.id}
                          className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 md:p-6 shadow-xs hover:shadow-md transition-all duration-200 space-y-5 min-w-0 max-w-full overflow-hidden"
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="space-y-1 min-w-0 flex-1">
                              <h4 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight whitespace-normal break-normal">
                                {track.treatment_name}
                              </h4>
                              {track.total_stages > 0 ? (
                                <p className="text-xs font-semibold text-slate-400 whitespace-normal break-normal">
                                  Clinical Appointment Phase: Stage {track.current_stage} of{" "}
                                  {track.total_stages}
                                </p>
                              ) : (
                                <p className="text-xs font-semibold text-slate-400">
                                  Planned Consultation Milestone
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-md self-start shrink-0 ${getStatusChipStyles(track.status)}`}
                            >
                              {track.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 pt-1">
                            {/* Track A: Treatment Milestones */}
                            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/60 border border-slate-100 min-w-0">
                              <div className="flex justify-between text-[11px] sm:text-xs font-semibold text-slate-500">
                                <span className="flex items-center gap-1">Clinical Steps</span>
                                <span className="font-bold text-slate-700">
                                  {Math.round(treatmentPercentage)}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-slate-440 rounded-full transition-all"
                                  style={{ width: `${treatmentPercentage}%` }}
                                />
                              </div>
                            </div>

                            {/* Track B: Payment Contributions */}
                            <div className="space-y-1.5 p-3 rounded-xl bg-teal-50/20 border border-teal-100/40 min-w-0">
                              <div className="flex justify-between text-[11px] sm:text-xs font-semibold text-slate-500">
                                <span className="flex items-center gap-1 text-teal-700">
                                  Funding Allocated
                                </span>
                                <span className="font-bold text-teal-700">
                                  {Math.round(paymentPercentage)}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-teal-600 rounded-full transition-all"
                                  style={{ width: `${paymentPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Cost Breakdowns */}
                          <div className="grid grid-cols-3 gap-2 pt-3 text-center border-t border-slate-50 min-w-0">
                            <div className="space-y-0.5 min-w-0">
                              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                Total Cost
                              </p>
                              <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">
                                {formatCurrency(track.total_cost)}
                              </p>
                            </div>
                            <div className="space-y-0.5 border-x border-slate-100 min-w-0 px-1">
                              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                Total Paid
                              </p>
                              <p className="text-xs sm:text-sm font-bold text-teal-600 truncate">
                                {formatCurrency(track.paid_amount)}
                              </p>
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                Remaining
                              </p>
                              <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                                {formatCurrency(totalDue)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* ==========================================
                    TREATMENT-WISE COST SUMMARY (CONSOLIDATED LIST)
                   ========================================== */}
                <div className="space-y-3 w-full min-w-0 max-w-full">
                  <div className="flex items-center gap-2 px-1">
                    <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">
                      Care Directory Summary Overview
                    </h3>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs min-w-0 w-full">
                    {treatmentsPaymentData?.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm hover:bg-slate-50/50 transition-colors min-w-0"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`h-2 w-2 rounded-full shrink-0 ${item.status === "cleared" ? "bg-emerald-500" : item.status === "active" ? "bg-teal-500" : "bg-slate-300"}`}
                          />
                          <span className="font-semibold text-slate-700 truncate">
                            {item.treatment_name}
                          </span>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 md:w-auto w-full border-t md:border-t-0 pt-2 md:pt-0 border-slate-50">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-md ${getStatusChipStyles(item.status)}`}
                          >
                            {item.status}
                          </span>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-slate-600">
                              {item.status === "cleared"
                                ? "Fully Settled"
                                : `${formatCurrency(item.total_cost - item.paid_amount)} Due`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN SIDEBAR WRAPPERS */}
              <div className="space-y-6 w-full min-w-0 max-w-full">
                {/* ==========================================
                    UPCOMING PAYMENT REMINDER SECTION
                   ========================================== */}
                {upcomingReminders && upcomingReminders.length > 0 && (
                  <div className="space-y-3 w-full min-w-0">
                    <div className="flex items-center gap-2 px-1">
                      <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                      <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">
                        Treatment Reminders
                      </h3>
                    </div>

                    <div className="space-y-3 w-full">
                      {upcomingReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="bg-amber-50/40 border border-amber-100 rounded-xl p-4 space-y-2.5 relative overflow-hidden min-w-0 w-full"
                        >
                          <div className="absolute top-0 right-0 p-1 text-amber-200/50 pointer-events-none">
                            <AlertCircle className="h-12 w-12 stroke-1 translate-x-2 -translate-y-2" />
                          </div>

                          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider relative z-10">
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>Upcoming Care Milestone</span>
                          </div>

                          <p className="text-xs sm:text-sm font-medium text-amber-900/90 leading-relaxed relative z-10 whitespace-normal break-normal">
                            {reminder.next_step_requirement}
                          </p>

                          {reminder.due_date && (
                            <div className="pt-2 flex items-center gap-1.5 text-[11px] text-amber-700/80 font-semibold border-t border-amber-100/50 relative z-10">
                              <Calendar className="h-3.5 w-3.5 stroke-[2] shrink-0" />
                              <span className="truncate">Action window targets: Within 5 days</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ==========================================
                    BILLING NOTES / CLINIC INFO
                   ========================================== */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs w-full min-w-0 overflow-hidden">
                  <div className="border-b border-slate-50 pb-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Clinic Guidance & Support
                    </h4>
                  </div>

                  <div className="space-y-3.5 text-xs font-medium text-slate-500 leading-relaxed w-full">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <p className="min-w-0 flex-1 whitespace-normal break-normal">
                        <span className="font-bold text-slate-700">Insurance Pre-Auth:</span> Direct
                        digital processing is available for major panel networks. Contact our desk
                        prior to care configuration.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5 min-w-0">
                      <Sparkles className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <p className="min-w-0 flex-1 whitespace-normal break-normal">
                        <span className="font-bold text-slate-700">Flexible Installments:</span>{" "}
                        Convert major treatments into 3 or 6 month zero-cost payment terms directly
                        at checkout.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5 min-w-0">
                      <PhoneCall className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="min-w-0 flex-1 whitespace-normal break-normal">
                        <span className="font-bold text-slate-700">Billing Helpdesk:</span> Have
                        questions regarding insurance codes? Connect directly at{" "}
                        <span className="font-bold text-slate-700 text-teal-700 break-all">
                          billing@lumident.com
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
