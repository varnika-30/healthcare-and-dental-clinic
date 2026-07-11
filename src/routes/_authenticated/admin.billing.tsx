import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculatePlanBilling, calculateBillingMetrics } from "@/lib/billing";
import { toast } from "sonner";
import ManageTreatmentPlanModal from "@/components/dashboard/ManageTreatmentPlanModal";
import {
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  FileText,
  User,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Users,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/billing")({
  component: BillingDashboardPage,
});

// ==========================================
// TYPES & MOCK DATA REGISTRY
// ==========================================
interface BillingRecord {
  id: string;
  patientId: string;
  patientName: string;
  treatment: string;
  estimatedCost: number;
  discount: number;
  discountReason?: string;
  finalCost: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: string;
  status: "Paid" | "Partial Payments" | "Payments Due" | "Overdue";
}

// Deleted mock billing logs

type FilterStatus = "All" | "Payments Due" | "Partial Payments" | "Paid" | "Overdue";

export default function BillingDashboardPage() {
  // ==========================================
  // COMPONENT STATE HOOKS
  // ==========================================
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"ledger" | "patients">("ledger");

  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);
  const [expandedPatientIds, setExpandedPatientIds] = useState<Record<string, boolean>>({});

  async function loadBillingData() {
    // 1. Fetch treatment plans with patients
    const { data: plansData, error: plansError } = await supabase
      .from("treatment_plans")
      .select("*, patients(*)");

    if (plansError) {
      console.error("Failed to load treatment plans:", plansError);
      return;
    }

    if (plansData) {
      setTreatmentPlans(plansData);
    }

    // 2. Fetch payment transactions
    const { data: txsData, error: txsError } = await supabase
      .from("payment_transactions")
      .select("*");

    if (txsError) {
      console.error("Failed to load payment transactions:", txsError);
      return;
    }

    if (txsData) {
      setAllTransactions(txsData);
    }

    const mappedRecords: BillingRecord[] = (plansData || []).map((plan) => {
      const planTransactions = (txsData || []).filter((tx) => tx.plan_id === plan.id);
      const billing = calculatePlanBilling(plan, planTransactions);

      const isOverdue =
        plan.due_date && new Date(plan.due_date) < new Date() && billing.outstandingAmount > 0;
      const status: "Paid" | "Partial Payments" | "Payments Due" | "Overdue" =
        billing.paymentStatus === "paid"
          ? "Paid"
          : isOverdue
            ? "Overdue"
            : billing.paymentStatus === "partial"
              ? "Partial Payments"
              : "Payments Due";

      const patientName = plan.patients
        ? `${(plan.patients as Record<string, unknown>)["first_name"] ?? ""} ${(plan.patients as Record<string, unknown>)["last_name"] ?? ""}`.trim()
        : "Unknown Patient";

      return {
        id: plan.id,
        patientId: plan.patient_id,
        patientName,
        treatment: plan.title,
        estimatedCost: plan.estimated_cost ?? 0,
        discount: billing.discountAmount,
        discountReason: plan.discount_reason ?? "",
        finalCost: billing.finalCost,
        paidAmount: billing.totalPaid,
        outstandingAmount: billing.outstandingAmount,
        dueDate: plan.due_date ?? "",
        status,
      };
    });

    setBillingRecords(mappedRecords);
  }

  useEffect(() => {
    loadBillingData();
  }, []);

  // ==========================================
  // FINANCIAL CALCULATIONS MATRIX
  // ==========================================
  const metrics = useMemo(() => {
    return calculateBillingMetrics(treatmentPlans, allTransactions);
  }, [treatmentPlans, allTransactions]);

  // ==========================================
  // PATIENT GROUPING & LEVERAGED METRICS HOOKS
  // ==========================================
  const patientGroups = useMemo(() => {
    const groupsMap: Record<
      string,
      {
        patientId: string;
        patientName: string;
        patientCode: string;
        treatmentPlans: BillingRecord[];
        estimatedCost: number;
        discount: number;
        finalCost: number;
        paidAmount: number;
        outstandingAmount: number;
        status: "Paid" | "Partial Payments" | "Payments Due" | "Overdue";
      }
    > = {};

    billingRecords.forEach((rec) => {
      if (!groupsMap[rec.patientId]) {
        groupsMap[rec.patientId] = {
          patientId: rec.patientId,
          patientName: rec.patientName,
          patientCode: rec.patientId.slice(0, 8),
          treatmentPlans: [],
          estimatedCost: 0,
          discount: 0,
          finalCost: 0,
          paidAmount: 0,
          outstandingAmount: 0,
          status: "Paid",
        };
      }

      const g = groupsMap[rec.patientId];
      g.treatmentPlans.push(rec);
      g.estimatedCost += rec.estimatedCost;
      g.discount += rec.discount;
      g.finalCost += rec.finalCost;
      g.paidAmount += rec.paidAmount;
      g.outstandingAmount += rec.outstandingAmount;
    });

    // Compute overall payment status for each group
    Object.values(groupsMap).forEach((g) => {
      if (g.treatmentPlans.length === 0) {
        g.status = "Paid";
      } else if (g.treatmentPlans.every((p) => p.status === "Paid")) {
        g.status = "Paid";
      } else if (g.treatmentPlans.some((p) => p.status === "Overdue")) {
        g.status = "Overdue";
      } else if (g.treatmentPlans.some((p) => p.status === "Partial Payments")) {
        g.status = "Partial Payments";
      } else {
        g.status = "Payments Due";
      }
    });

    return Object.values(groupsMap);
  }, [billingRecords]);

  // Automatically expand row if searching by invoice
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const normQuery = searchQuery.toLowerCase().trim();
    const matchingGroups = patientGroups.filter((g) =>
      g.treatmentPlans.some((p) => p.id.toLowerCase().includes(normQuery))
    );

    if (matchingGroups.length > 0) {
      setExpandedPatientIds((prev) => {
        const next = { ...prev };
        matchingGroups.forEach((g) => {
          next[g.patientId] = true;
        });
        return next;
      });
    }
  }, [searchQuery, patientGroups]);

  const isHighlighted = (plan: BillingRecord) => {
    if (!searchQuery.trim()) return false;
    const normQuery = searchQuery.toLowerCase().trim();
    return plan.id.toLowerCase().includes(normQuery) || plan.treatment.toLowerCase().includes(normQuery);
  };

  const filteredGroups = useMemo(() => {
    return patientGroups.filter((g) => {
      // 1. Apply filter at the PATIENT level
      if (activeFilter === "Paid") {
        if (!g.treatmentPlans.every((p) => p.status === "Paid")) return false;
      } else if (activeFilter === "Partial Payments") {
        if (!g.treatmentPlans.some((p) => p.status === "Partial Payments")) return false;
      } else if (activeFilter === "Payments Due") {
        if (!(g.outstandingAmount > 0)) return false;
      } else if (activeFilter === "Overdue") {
        if (!g.treatmentPlans.some((p) => p.status === "Overdue")) return false;
      }

      // 2. Apply search query
      if (!searchQuery.trim()) return true;

      const normQuery = searchQuery.toLowerCase().trim();
      const nameMatch = g.patientName.toLowerCase().includes(normQuery);
      const codeMatch = g.patientCode.toLowerCase().includes(normQuery);
      const treatmentMatch = g.treatmentPlans.some((p) =>
        p.treatment.toLowerCase().includes(normQuery)
      );
      const invoiceMatch = g.treatmentPlans.some((p) =>
        p.id.toLowerCase().includes(normQuery)
      );

      return nameMatch || codeMatch || treatmentMatch || invoiceMatch;
    });
  }, [patientGroups, activeFilter, searchQuery]);

  const patientSummaries = useMemo(() => {
    return filteredGroups.map((g) => ({
      patientId: g.patientId,
      patientName: g.patientName,
      netCost: g.finalCost,
      totalPaid: g.paidAmount,
      outstandingBalance: g.outstandingAmount,
    }));
  }, [filteredGroups]);

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const getStatusStyles = (status: BillingRecord["status"]) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold";
      case "Partial Payments":
        return "bg-amber-50 border-amber-200 text-amber-700 font-bold";
      case "Payments Due":
        return "bg-slate-50 border-slate-200 text-slate-600 font-medium";
      case "Overdue":
        return "bg-rose-50 border-rose-200 text-rose-700 font-bold animate-pulse";
    }
  };

  return (
    <DashboardShell maxW="max-w-none">
      <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 space-y-8">
        {/* 1. PAGE HEADER FRAME */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/10">
              <DollarSign className="h-3.5 w-3.5" />
              Financial Management
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Billing Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track patient payments, balances, and outstanding clinic ledger invoices.
            </p>
          </div>
        </div>

        {/* 2. OPERATIONAL SUMMARY METRIC CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Pending Payments
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {metrics.pendingPaymentsCount} Patient{metrics.pendingPaymentsCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Ongoing Treatments
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {metrics.ongoingTreatmentsCount} Patient{metrics.ongoingTreatmentsCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/10 p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500 block">
                Overdue Patients
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {metrics.overduePatientsCount} Patient{metrics.overduePatientsCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* 3. FILTERS & SEARCH ROW ENGINE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 border border-slate-200/60 rounded-xl overflow-x-auto">
            {(["All", "Payments Due", "Partial Payments", "Paid", "Overdue"] as FilterStatus[]).map(
              (filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                    activeFilter === filter
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/40 font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {filter === "All" ? "All Invoices" : filter}
                </button>
              ),
            )}
          </div>
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, invoice number, or service code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-sm font-medium border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-slate-400 text-slate-700"
            />
          </div>
        </div>

        {/* 4. BILLING REGISTRY MATRIX / DATA SEPARATOR VIEW */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex border-b border-slate-100 bg-slate-50/50 px-5 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab("ledger")}
              className={`pb-3 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === "ledger"
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              Patients Ledger ({filteredGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("patients")}
              className={`pb-3 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === "patients"
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              Patient Summaries ({patientSummaries.length})
            </button>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="py-16 px-4 text-center max-w-sm mx-auto space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400">
                <Filter className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No matching billing logs found</h3>
              </div>
            </div>
          ) : activeTab === "ledger" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-10"></th>
                    <th className="py-3 px-4">Patient Code</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4 text-center">Treatments</th>
                    <th className="py-3 px-4 text-right">Est. Cost</th>
                    <th className="py-3 px-4 text-right">Discount</th>
                    <th className="py-3 px-4 text-right">Final Cost</th>
                    <th className="py-3 px-4 text-right">Paid Amount</th>
                    <th className="py-3 px-4 text-right">Outstanding</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {filteredGroups.map((g) => {
                    const isExpanded = !!expandedPatientIds[g.patientId];
                    return (
                      <React.Fragment key={g.patientId}>
                        <tr
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                          onClick={() =>
                            setExpandedPatientIds((prev) => ({
                              ...prev,
                              [g.patientId]: !isExpanded,
                            }))
                          }
                        >
                          <td className="py-4 px-4 text-center">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-400 mx-auto" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400 mx-auto" />
                            )}
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-slate-400 tabular-nums">
                            {g.patientCode}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900">
                            {g.patientName}
                          </td>
                          <td className="py-4 px-4 text-center text-xs font-semibold text-slate-500">
                            {g.treatmentPlans.length}
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-slate-700">
                            ₹{g.estimatedCost.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-rose-600">
                            ₹{g.discount.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-slate-900">
                            ₹{g.finalCost.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-emerald-600">
                            ₹{g.paidAmount.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-rose-600">
                            ₹{g.outstandingAmount.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${getStatusStyles(g.status)}`}
                            >
                              {g.status}
                            </span>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={10} className="bg-slate-50/40 p-0 border-t border-slate-100">
                              <div className="px-6 py-4 bg-slate-50/30">
                                <div className="overflow-x-auto rounded-xl border border-slate-200/60 bg-white shadow-xs">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="py-2.5 px-4">Treatment Name</th>
                                        <th className="py-2.5 px-4">Invoice Reference</th>
                                        <th className="py-2.5 px-4">Treatment Date</th>
                                        <th className="py-2.5 px-4 text-right">Est. Cost</th>
                                        <th className="py-2.5 px-4 text-right">Discount</th>
                                        <th className="py-2.5 px-4 text-right">Final Cost</th>
                                        <th className="py-2.5 px-4 text-right">Paid Amount</th>
                                        <th className="py-2.5 px-4 text-right">Outstanding</th>
                                        <th className="py-2.5 px-4 text-center">Status</th>
                                        <th className="py-2.5 px-4 text-center">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                                      {g.treatmentPlans.map((plan) => {
                                        const highlight = isHighlighted(plan);
                                        return (
                                          <tr
                                            key={plan.id}
                                            className={`hover:bg-slate-50/30 transition-all ${
                                              highlight
                                                ? "bg-teal-50/70 border-l-4 border-l-teal-500 font-semibold animate-pulse"
                                                : ""
                                            }`}
                                          >
                                            <td className="py-3 px-4 font-bold text-slate-800">
                                              {plan.treatment}
                                            </td>
                                            <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                                              {plan.id.slice(0, 8)}
                                            </td>
                                            <td className="py-3 px-4 tabular-nums">
                                              {plan.dueDate || "—"}
                                            </td>
                                            <td className="py-3 px-4 text-right tabular-nums">
                                              ₹{plan.estimatedCost.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-right text-rose-600 tabular-nums">
                                              ₹{plan.discount.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-right text-slate-900 font-bold tabular-nums">
                                              ₹{plan.finalCost.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-right text-emerald-600 tabular-nums">
                                              ₹{plan.paidAmount.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-right text-rose-600 font-bold tabular-nums">
                                              ₹{plan.outstandingAmount.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                              <span
                                                className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${getStatusStyles(plan.status)}`}
                                              >
                                                {plan.status}
                                              </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedRecord(plan);
                                                }}
                                                className="text-teal-600 font-bold hover:underline"
                                              >
                                                Manage
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-6 md:px-8">Patient Identity</th>
                    <th className="py-3 px-6 md:px-8 text-right">Net Cost</th>
                    <th className="py-3 px-6 md:px-8 text-right">Total Paid</th>
                    <th className="py-3 px-6 md:px-8 text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {patientSummaries.map((summary) => (
                    <tr key={summary.patientId} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 md:px-8 font-bold text-slate-900">
                        {summary.patientName}
                      </td>
                      <td className="py-4 px-6 md:px-8 text-right font-bold text-slate-900">
                        ₹{summary.netCost.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 md:px-8 text-right font-bold text-emerald-600">
                        ₹{summary.totalPaid.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 md:px-8 text-right font-bold text-rose-600">
                        ₹{summary.outstandingBalance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Overlay */}
        {selectedRecord && (
          <ManageTreatmentPlanModal
            planId={selectedRecord.id}
            onClose={() => setSelectedRecord(null)}
            onSaveSuccess={loadBillingData}
          />
        )}
      </div>
    </DashboardShell>
  );
}
