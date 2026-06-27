import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculatePlanBilling } from "@/lib/billing";
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
  finalCost: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: string;
  status: "Paid" | "Partial Payments" | "Payments Due" | "Overdue";
}

const MOCK_BILLING_RECORDS: BillingRecord[] = [
  {
    id: "INV-2026-001",
    patientId: "mock-1",
    patientName: "Arjun Mehta",
    treatment: "Root Canal Therapy + Crown",
    estimatedCost: 12500,
    discount: 0,
    finalCost: 12500,
    paidAmount: 12500,
    outstandingAmount: 0,
    dueDate: "2026-06-10",
    status: "Paid",
  },
  {
    id: "INV-2026-002",
    patientId: "mock-2",
    patientName: "Priya Sharma",
    treatment: "Invisalign Alignment Intake",
    estimatedCost: 45000,
    discount: 0,
    finalCost: 45000,
    paidAmount: 15000,
    outstandingAmount: 30000,
    dueDate: "2026-06-25",
    status: "Partial Payments",
  },
  {
    id: "INV-2026-003",
    patientId: "mock-3",
    patientName: "Rohan Das",
    treatment: "Deep Scaling & Composite Filling",
    estimatedCost: 4200,
    discount: 0,
    finalCost: 4200,
    paidAmount: 0,
    outstandingAmount: 4200,
    dueDate: "2026-06-15",
    status: "Payments Due",
  },
  {
    id: "INV-2026-004",
    patientId: "mock-4",
    patientName: "Sneha Reddy",
    treatment: "Molar Extraction & Sedation",
    estimatedCost: 8500,
    discount: 0,
    finalCost: 8500,
    paidAmount: 0,
    outstandingAmount: 8500,
    dueDate: "2026-06-05",
    status: "Overdue",
  },
  {
    id: "INV-2026-005",
    patientId: "mock-5",
    patientName: "Kabir Malhotra",
    treatment: "Porcelain Veneers Placement",
    estimatedCost: 60000,
    discount: 0,
    finalCost: 60000,
    paidAmount: 40000,
    outstandingAmount: 20000,
    dueDate: "2026-06-20",
    status: "Partial Payments",
  },
];

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
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "upi" | "bank_transfer" | "insurance" | "other"
  >("upi");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);

  const currentRecord = useMemo(() => {
    if (!selectedRecord) return null;
    return billingRecords.find((r) => r.id === selectedRecord.id) || selectedRecord;
  }, [billingRecords, selectedRecord]);

  const selectedPlanTransactions = useMemo(() => {
    if (!currentRecord) return [];
    return allTransactions
      .filter((tx) => tx.plan_id === currentRecord.id)
      .sort((a, b) => {
        const dateDiff = new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return (b.id || "").localeCompare(a.id || "");
      });
  }, [allTransactions, currentRecord]);

  useEffect(() => {
    if (selectedRecord && !editingTransaction) {
      const rec = billingRecords.find((r) => r.id === selectedRecord.id) || selectedRecord;
      setPaymentAmount(rec.outstandingAmount);
      setPaymentMethod("upi");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setPaymentNotes("");
    }
  }, [selectedRecord, billingRecords, editingTransaction]);

  async function loadBillingData() {
    // 1. Fetch treatment plans with patients
    const { data: plansData, error: plansError } = await supabase
      .from("treatment_plans")
      .select("*, patients(*)");

    console.log("PLANS DATA:", plansData);
    console.log("PLANS ERROR:", plansError);

    if (plansError) {
      console.error("Failed to load treatment plans:", plansError);
      return;
    }

    // 2. Fetch payment transactions
    const { data: txsData, error: txsError } = await supabase
      .from("payment_transactions")
      .select("*");

    console.log("PAYMENT TRANSACTIONS:", txsData);
    console.log("PAYMENT TRANSACTIONS ERROR:", txsError);

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
        finalCost: billing.finalCost,
        paidAmount: billing.totalPaid,
        outstandingAmount: billing.outstandingAmount,
        dueDate: plan.due_date ?? "",
        status,
      };
    });

    console.log("MAPPED BILLING RECORDS:", mappedRecords);
    setBillingRecords(mappedRecords);
  }

  useEffect(() => {
    loadBillingData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecord) return;

    setIsSaving(true);
    try {
      if (editingTransaction) {
        // Update existing transaction
        const { error } = await supabase
          .from("payment_transactions")
          .update({
            amount: paymentAmount,
            payment_method: paymentMethod,
            payment_date: paymentDate,
            notes: paymentNotes || null,
          })
          .eq("id", editingTransaction.id);

        if (error) {
          console.error("Failed to update payment:", error);
          alert("Failed to update payment: " + error.message);
          return;
        }

        console.log("Payment successfully updated.");
        setEditingTransaction(null);
      } else {
        // Insert new transaction
        const { error } = await supabase.from("payment_transactions").insert({
          patient_id: currentRecord.patientId,
          plan_id: currentRecord.id,
          amount: paymentAmount,
          payment_method: paymentMethod,
          payment_date: paymentDate,
          notes: paymentNotes || null,
        });

        if (error) {
          console.error("Failed to record payment:", error);
          alert("Failed to record payment: " + error.message);
          return;
        }

        console.log("Payment successfully recorded.");
      }

      await loadBillingData();
    } catch (err) {
      console.error("Unexpected error saving payment:", err);
      alert("Unexpected error occurred while saving payment.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditTransaction = (tx: any) => {
    setEditingTransaction(tx);
    setPaymentAmount(tx.amount);
    setPaymentMethod(tx.payment_method);
    setPaymentDate(tx.payment_date);
    setPaymentNotes(tx.notes || "");
  };

  const cancelEditTransaction = () => {
    setEditingTransaction(null);
    if (currentRecord) {
      setPaymentAmount(currentRecord.outstandingAmount);
      setPaymentMethod("upi");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setPaymentNotes("");
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!window.confirm("Are you sure you want to delete this payment transaction?")) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("payment_transactions").delete().eq("id", txId);

      if (error) {
        console.error("Failed to delete payment:", error);
        alert("Failed to delete payment: " + error.message);
        return;
      }

      console.log("Payment successfully deleted.");

      if (editingTransaction?.id === txId) {
        setEditingTransaction(null);
      }

      await loadBillingData();
    } catch (err) {
      console.error("Unexpected error deleting payment:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // FINANCIAL CALCULATIONS MATRIX
  // ==========================================
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let outstandingBalance = 0;
    let pendingPaymentsCount = 0;
    let fullyPaidCount = 0;

    billingRecords.forEach((rec) => {
      totalRevenue += rec.paidAmount;
      outstandingBalance += rec.outstandingAmount;

      if (rec.status === "Paid") {
        fullyPaidCount++;
      } else {
        pendingPaymentsCount++;
      }
    });

    return { totalRevenue, outstandingBalance, pendingPaymentsCount, fullyPaidCount };
  }, [billingRecords]);

  // ==========================================
  // FILTER & SEARCH PIPE LOGIC
  // ==========================================
  const filteredRecords = useMemo(() => {
    return billingRecords.filter((rec) => {
      const matchesFilter = activeFilter === "All" || rec.status === activeFilter;
      const matchesSearch =
        rec.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.treatment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [billingRecords, activeFilter, searchQuery]);

  const patientSummaries = useMemo(() => {
    const summaryMap: Record<
      string,
      {
        patientName: string;
        patientId: string;
        totalTreatmentCost: number;
        totalDiscounts: number;
        netCost: number;
        totalPaid: number;
        outstandingBalance: number;
        planCount: number;
      }
    > = {};

    filteredRecords.forEach((rec) => {
      if (!summaryMap[rec.patientId]) {
        summaryMap[rec.patientId] = {
          patientName: rec.patientName,
          patientId: rec.patientId,
          totalTreatmentCost: 0,
          totalDiscounts: 0,
          netCost: 0,
          totalPaid: 0,
          outstandingBalance: 0,
          planCount: 0,
        };
      }

      const s = summaryMap[rec.patientId];
      s.totalTreatmentCost += rec.estimatedCost;
      s.totalDiscounts += rec.discount;
      s.netCost += rec.finalCost;
      s.totalPaid += rec.paidAmount;
      s.outstandingBalance += rec.outstandingAmount;
      s.planCount += 1;
    });

    return Object.values(summaryMap);
  }, [filteredRecords]);

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
    <DashboardShell>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Total Collected Revenue
              </span>
              <span className="text-2xl font-bold text-slate-900">
                ₹{metrics.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          {/* Outstanding Balance */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/20 p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 block">
                Outstanding Arrears
              </span>
              <span className="text-2xl font-bold text-slate-900">
                ₹{metrics.outstandingBalance.toLocaleString()}
              </span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>

          {/* Pending Payments */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Pending Open Accounts
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {metrics.pendingPaymentsCount} Cases
              </span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          {/* Fully Paid Cases */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Settled Claims
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {metrics.fullyPaidCount} Files
              </span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* 3. FILTERS & SEARCH ROW ENGINE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center lg:justify-between">
          {/* Filter Segmentation Segment */}
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

          {/* Instant Search Control Node */}
          <div className="relative flex-1 max-w-md">
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
              Treatment Plans Ledger ({filteredRecords.length})
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

          {filteredRecords.length === 0 ? (
            /* CLEAN EMPTY STATE INTERACTION CONTAINER */
            <div className="py-16 px-4 text-center max-w-sm mx-auto space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400">
                <Filter className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No matching billing logs found</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Adjust your state parameters or change your diagnostic search query criteria and
                  try again.
                </p>
              </div>
              {(activeFilter !== "All" || searchQuery !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("All");
                    setSearchQuery("");
                  }}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  Reset Search Matrices
                </button>
              )}
            </div>
          ) : activeTab === "ledger" ? (
            /* PRODUCTION RESPONSIVE SCROLL-BOX MATRIX */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-5">Invoice Reference</th>
                    <th className="py-3 px-5">Patient Identity</th>
                    <th className="py-3 px-5">Clinical Focus / Treatment</th>
                    <th className="py-3 px-5 text-right">Estimated Cost</th>
                    <th className="py-3 px-5 text-right">Discount</th>
                    <th className="py-3 px-5 text-right">Final Cost</th>
                    <th className="py-3 px-5 text-right">Paid Amount</th>
                    <th className="py-3 px-5 text-right">Outstanding Amount</th>
                    <th className="py-3 px-5">Target Due Axis</th>
                    <th className="py-3 px-5 text-center">Settlement State</th>
                    <th className="py-3 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {filteredRecords.map((rec) => {
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Invoice ID */}
                        <td className="py-4 px-5 text-xs font-bold text-slate-400 tabular-nums">
                          {rec.id.slice(0, 8)}
                        </td>

                        {/* Patient Name */}
                        <td className="py-4 px-5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            {rec.patientName}
                          </div>
                        </td>

                        {/* Treatment Service Info */}
                        <td className="py-4 px-5 max-w-[220px] truncate text-slate-500 text-xs font-semibold">
                          {rec.treatment}
                        </td>

                        {/* Estimated Cost */}
                        <td className="py-4 px-5 text-right tabular-nums text-slate-700 font-semibold">
                          ₹{rec.estimatedCost.toLocaleString()}
                        </td>

                        {/* Discount */}
                        <td className="py-4 px-5 text-right tabular-nums text-rose-600 font-semibold">
                          ₹{rec.discount.toLocaleString()}
                        </td>

                        {/* Final Cost */}
                        <td className="py-4 px-5 text-right tabular-nums text-slate-900 font-semibold">
                          ₹{rec.finalCost.toLocaleString()}
                        </td>

                        {/* Paid Amount */}
                        <td className="py-4 px-5 text-right tabular-nums text-emerald-600 font-semibold">
                          ₹{rec.paidAmount.toLocaleString()}
                        </td>

                        {/* Outstanding Amount */}
                        <td
                          className={`py-4 px-5 text-right tabular-nums font-bold ${
                            rec.outstandingAmount > 0 ? "text-rose-600" : "text-slate-400"
                          }`}
                        >
                          ₹{rec.outstandingAmount.toLocaleString()}
                        </td>

                        {/* Due Date */}
                        <td className="py-4 px-5 text-xs text-slate-500 font-semibold tabular-nums">
                          {rec.dueDate}
                        </td>

                        {/* Payment Status Badge */}
                        <td className="py-4 px-5 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] uppercase border tracking-wider ${getStatusStyles(
                              rec.status,
                            )}`}
                          >
                            {rec.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(rec)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-teal-600 bg-white hover:bg-slate-50 transition-colors"
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
          ) : (
            /* PATIENT SUMMARIES RESPONSIVE SCROLL-BOX MATRIX */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-5">Patient Identity</th>
                    <th className="py-3 px-5 text-right">Total Treatment Cost</th>
                    <th className="py-3 px-5 text-right">Total Discounts</th>
                    <th className="py-3 px-5 text-right">Net Cost</th>
                    <th className="py-3 px-5 text-right">Total Paid</th>
                    <th className="py-3 px-5 text-right">Outstanding Balance</th>
                    <th className="py-3 px-5 text-center">Plans Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {patientSummaries.map((summary) => {
                    return (
                      <tr
                        key={summary.patientId}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        {/* Patient Name */}
                        <td className="py-4 px-5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            {summary.patientName}
                          </div>
                        </td>

                        {/* Total Treatment Cost */}
                        <td className="py-4 px-5 text-right tabular-nums text-slate-600 font-semibold">
                          ₹{summary.totalTreatmentCost.toLocaleString()}
                        </td>

                        {/* Total Discounts */}
                        <td className="py-4 px-5 text-right tabular-nums text-rose-600 font-semibold">
                          ₹{summary.totalDiscounts.toLocaleString()}
                        </td>

                        {/* Net Cost */}
                        <td className="py-4 px-5 text-right tabular-nums text-slate-900 font-bold">
                          ₹{summary.netCost.toLocaleString()}
                        </td>

                        {/* Total Paid */}
                        <td className="py-4 px-5 text-right tabular-nums text-emerald-600 font-bold">
                          ₹{summary.totalPaid.toLocaleString()}
                        </td>

                        {/* Outstanding Balance */}
                        <td
                          className={`py-4 px-5 text-right tabular-nums font-extrabold ${
                            summary.outstandingBalance > 0 ? "text-rose-600" : "text-slate-400"
                          }`}
                        >
                          ₹{summary.outstandingBalance.toLocaleString()}
                        </td>

                        {/* Active Plans Count */}
                        <td className="py-4 px-5 text-center text-xs font-bold text-slate-500 tabular-nums">
                          {summary.planCount} plans
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Overlay */}
        {selectedRecord && currentRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setSelectedRecord(null)}
            />
            {/* Modal Content */}
            <form
              onSubmit={handleSave}
              className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden transform transition-all z-10 animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-4 text-white">
                <h3 className="text-lg font-bold">Manage Treatment Plan</h3>
                <p className="text-xs text-teal-100 mt-0.5">Reference ID: {currentRecord.id}</p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Patient Name */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Patient Name
                  </span>
                  <div className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                      <User className="h-4 w-4" />
                    </div>
                    {currentRecord.patientName}
                  </div>
                </div>

                {/* Treatment Name */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Treatment Name
                  </span>
                  <div className="text-sm font-semibold text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                    {currentRecord.treatment}
                  </div>
                </div>

                {/* Pricing Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1 text-center">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">
                      Total Cost
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      ₹{currentRecord.finalCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-1 text-center">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 block">
                      Paid
                    </span>
                    <span className="text-sm font-bold text-emerald-700">
                      ₹{currentRecord.paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 space-y-1 text-center">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-rose-600 block">
                      Outstanding
                    </span>
                    <span className="text-sm font-bold text-rose-700">
                      ₹{currentRecord.outstandingAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Record Payment Form */}
                <div
                  className={`space-y-4 pt-4 border-t border-slate-100 transition-all duration-300 ${
                    editingTransaction
                      ? "bg-teal-50/30 p-4 -mx-6 border-y border-teal-100/60 shadow-inner"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {editingTransaction ? "Edit Payment Details" : "Record New Payment"}
                    </h4>
                    {editingTransaction && (
                      <button
                        type="button"
                        onClick={cancelEditTransaction}
                        className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Payment Amount */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="payment-amount"
                        className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block"
                      >
                        Payment Amount (₹)
                      </label>
                      <input
                        id="payment-amount"
                        type="number"
                        min="0"
                        value={paymentAmount}
                        disabled={isSaving}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className="w-full h-10 px-3 text-sm font-medium border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-slate-400 text-slate-700 disabled:opacity-50 disabled:bg-slate-50"
                        placeholder="Enter amount"
                        required
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="payment-method"
                        className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block"
                      >
                        Payment Method
                      </label>
                      <select
                        id="payment-method"
                        value={paymentMethod}
                        disabled={isSaving}
                        onChange={(e) =>
                          setPaymentMethod(
                            e.target.value as
                              | "cash"
                              | "card"
                              | "upi"
                              | "bank_transfer"
                              | "insurance"
                              | "other",
                          )
                        }
                        className="w-full h-10 px-3 text-sm font-medium border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all text-slate-700 disabled:opacity-50 disabled:bg-slate-50"
                      >
                        <option value="upi">UPI</option>
                        <option value="card">Credit/Debit Card</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Net Banking</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Payment Date */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="payment-date"
                        className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block"
                      >
                        Payment Date
                      </label>
                      <input
                        id="payment-date"
                        type="date"
                        value={paymentDate}
                        disabled={isSaving}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full h-10 px-3 text-sm font-medium border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all text-slate-700 disabled:opacity-50 disabled:bg-slate-50"
                        required
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="payment-notes"
                        className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block"
                      >
                        Notes
                      </label>
                      <textarea
                        id="payment-notes"
                        value={paymentNotes}
                        disabled={isSaving}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        rows={2}
                        className="w-full p-3 text-sm font-medium border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-slate-400 text-slate-700 resize-none disabled:opacity-50 disabled:bg-slate-50"
                        placeholder="Add payment notes/reference details..."
                      />
                    </div>
                  </div>
                </div>

                {/* Past Transactions List */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Payment History ({selectedPlanTransactions.length})
                  </h4>

                  {selectedPlanTransactions.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <p className="text-xs text-slate-400">
                        No payments recorded for this plan yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {selectedPlanTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-xs gap-2 group hover:border-slate-300 transition-all"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-800">
                                ₹{tx.amount.toLocaleString()}
                              </span>
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] uppercase border font-semibold tracking-wider bg-slate-50 text-slate-600 border-slate-200">
                                {tx.payment_method === "bank_transfer"
                                  ? "Net Banking"
                                  : tx.payment_method.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold tabular-nums">
                              Date: {tx.payment_date}
                            </div>
                            {tx.notes && (
                              <p className="text-[10px] text-slate-400 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100 mt-1 leading-relaxed">
                                "{tx.notes}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => startEditTransaction(tx)}
                              className="inline-flex h-7 items-center justify-center rounded-lg border border-slate-200 px-2.5 text-[10px] font-bold text-teal-600 bg-white hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="inline-flex h-7 items-center justify-center rounded-lg border border-rose-200 px-2.5 text-[10px] font-bold text-rose-600 bg-white hover:bg-rose-50 transition-colors shadow-xs cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
