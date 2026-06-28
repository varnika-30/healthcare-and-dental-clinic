import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculatePlanBilling } from "@/lib/billing";
import { toast } from "sonner";
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
  discountReason?: string;
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
  const [paymentPurpose, setPaymentPurpose] = useState<string>("Treatment Payment");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSavingDiscount, setIsSavingDiscount] = useState<boolean>(false);
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
      setPaymentPurpose("");
      setDiscountAmount(rec.discount || 0);
      setDiscountReason(rec.discountReason || "");
    }
  }, [selectedRecord, billingRecords, editingTransaction]);

  async function loadBillingData() {
    // 1. Fetch treatment plans with patients
    const { data: plansData, error: plansError } = await supabase
      .from("treatment_plans")
      .select("*, patients(*)");

    if (plansError) {
      console.error("Failed to load treatment plans:", plansError);
      return;
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecord) return;

    if (!paymentPurpose.trim()) {
      toast.error("Payment Purpose is required.");
      return;
    }

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
            purpose: paymentPurpose,
          })
          .eq("id", editingTransaction.id);

        if (error) {
          console.error("Failed to update payment:", error);
          toast.error("Failed to update payment: " + error.message);
          return;
        }

        toast.success("Payment updated successfully.");
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
          purpose: paymentPurpose,
        });

        if (error) {
          console.error("Failed to record payment:", error);
          toast.error("Failed to record payment: " + error.message);
          return;
        }

        toast.success("Payment added successfully.");
      }

      await loadBillingData();
    } catch (err) {
      console.error("Unexpected error saving payment:", err);
      toast.error("Unexpected error occurred while saving payment.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDiscount = async () => {
    if (!currentRecord) return;

    setIsSavingDiscount(true);
    try {
      const { error } = await supabase
        .from("treatment_plans")
        .update({
          discount_amount: discountAmount,
          discount_reason: discountReason || null,
        })
        .eq("id", currentRecord.id);

      if (error) {
        console.error("Failed to save discount:", error);
        toast.error("Failed to save discount: " + error.message);
        return;
      }

      toast.success("Discount saved successfully.");
      await loadBillingData();
    } catch (err) {
      console.error("Unexpected error saving discount:", err);
      toast.error("Unexpected error occurred while saving discount.");
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const startEditTransaction = (tx: any) => {
    setEditingTransaction(tx);
    setPaymentAmount(tx.amount);
    setPaymentMethod(tx.payment_method);
    setPaymentDate(tx.payment_date);
    setPaymentNotes(tx.notes || "");
    setPaymentPurpose(tx.purpose || "");
  };

  const cancelEditTransaction = () => {
    setEditingTransaction(null);
    if (currentRecord) {
      setPaymentAmount(currentRecord.outstandingAmount);
      setPaymentMethod("upi");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setPaymentNotes("");
      setPaymentPurpose("");
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!window.confirm("Are you sure you want to delete this payment transaction?")) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("payment_transactions").delete().eq("id", txId);

      if (error) {
        console.error("Failed to delete payment:", error);
        toast.error("Failed to delete payment: " + error.message);
        return;
      }

      toast.success("Payment deleted successfully.");

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    <th className="py-3 px-6 md:px-8">Invoice Reference</th>
                    <th className="py-3 px-6 md:px-8">Patient Identity</th>
                    <th className="py-3 px-6 md:px-8">Treatment</th>
                    <th className="py-3 px-6 md:px-8 text-right">Estimated Cost</th>
                    <th className="py-3 px-6 md:px-8 text-right">Discount</th>
                    <th className="py-3 px-6 md:px-8 text-right">Final Cost</th>
                    <th className="py-3 px-6 md:px-8 text-right">Paid Amount</th>
                    <th className="py-3 px-6 md:px-8 text-right">Outstanding Amount</th>
                    <th className="py-3 px-6 md:px-8 text-center">Settlement State</th>
                    <th className="py-3 px-6 md:px-8 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 md:px-8 text-xs font-bold text-slate-400 tabular-nums">
                        {rec.id.slice(0, 8)}
                      </td>
                      <td className="py-4 px-6 md:px-8 font-bold text-slate-900">
                        {rec.patientName}
                      </td>
                      <td className="py-4 px-6 md:px-8 text-xs font-semibold text-slate-500">
                        {rec.treatment}
                      </td>
                      <td className="py-4 px-6 md:px-8 text-right font-semibold text-slate-700">
                        ₹{rec.estimatedCost.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 md:px-8 text-right font-semibold text-rose-600">
                        ₹{rec.discount.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 md:px-8 text-right font-semibold text-slate-900">
                        ₹{rec.finalCost.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 md:px-8 text-right font-semibold text-emerald-600">
                        ₹{rec.paidAmount.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 md:px-8 text-right font-bold text-rose-600">
                        ₹{rec.outstandingAmount.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 md:px-8 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${getStatusStyles(rec.status)}`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 md:px-8 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(rec)}
                          className="text-teal-600 font-bold hover:underline"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
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
        {selectedRecord && currentRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setSelectedRecord(null)}
            />
            <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-teal-500 to-emerald-600 px-10 py-6 text-white">
                <h3 className="text-3xl font-bold">Manage Treatment Plan</h3>
                <p className="text-base text-teal-100 mt-1">ID: {currentRecord.id}</p>
              </div>

              <div className="p-10 space-y-8 max-h-[75vh] overflow-y-auto">
                <div className="space-y-2">
                  <span className="text-lg uppercase font-bold text-slate-400">Patient Name</span>
                  <div className="text-2xl font-bold text-slate-800">
                    {currentRecord.patientName}
                  </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-xl border border-slate-200/60 space-y-5">
                  <h4 className="text-xl font-bold text-slate-700 uppercase">Billing Summary</h4>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-2xl">
                    <div className="flex justify-between text-slate-500">
                      <span>Treatment:</span>
                      <span className="font-semibold text-slate-800">
                        ₹{currentRecord.estimatedCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Discount:</span>
                      <span className="font-semibold text-rose-600">
                        -₹{currentRecord.discount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 border-t pt-3 col-span-2">
                      <span className="font-bold text-slate-700 text-2xl">Net:</span>
                      <span className="font-bold text-slate-900 text-3xl">
                        ₹{currentRecord.finalCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 border-t pt-3 col-span-2">
                      <span className="text-2xl">Paid:</span>
                      <span className="font-bold text-emerald-600 text-3xl">
                        ₹{currentRecord.paidAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 border-t pt-3 col-span-2">
                      <span className="font-extrabold text-slate-800 text-3xl">Outstanding:</span>
                      <span
                        className={`font-extrabold text-4xl ${currentRecord.outstandingAmount > 0 ? "text-rose-600" : "text-slate-400"}`}
                      >
                        ₹{currentRecord.outstandingAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Treatment Discount Section */}
                <div className="space-y-4 pt-8 border-t border-slate-100">
                  <h4 className="text-xl font-bold text-slate-700 uppercase">Treatment Discount</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <input
                      type="number"
                      placeholder="Discount (₹)"
                      value={discountAmount}
                      disabled={isSaving || isSavingDiscount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="w-full h-14 px-5 text-2xl border border-slate-200 rounded-xl placeholder:text-xl placeholder:text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Reason"
                      value={discountReason}
                      disabled={isSaving || isSavingDiscount}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      className="w-full h-14 px-5 text-2xl border border-slate-200 rounded-xl placeholder:text-xl placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveDiscount}
                    disabled={isSaving || isSavingDiscount}
                    className="w-full py-4 px-8 text-2xl font-bold text-white bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    {isSavingDiscount ? "Saving..." : "Save Discount"}
                  </button>
                </div>

                {/* Record Payment Form */}
                <form
                  id="payment-form"
                  onSubmit={handleSave}
                  className="space-y-8 pt-8 border-t border-slate-100"
                >
                  <h4 className="text-2xl font-bold text-slate-700 uppercase">
                    {editingTransaction ? "Edit Payment Details" : "Record New Payment"}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Amount */}
                    <div className="space-y-2.5">
                      <label
                        htmlFor="payment-amount"
                        className="text-xl uppercase font-bold text-slate-400 block"
                      >
                        Payment Amount (₹)
                      </label>
                      <input
                        id="payment-amount"
                        type="number"
                        min="0"
                        value={paymentAmount}
                        disabled={isSaving || isSavingDiscount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className="w-full h-14 px-5 text-2xl border border-slate-200 rounded-xl placeholder:text-xl placeholder:text-slate-400"
                        placeholder="Enter amount"
                        required
                      />
                    </div>

                    {/* Method */}
                    <div className="space-y-2.5">
                      <label
                        htmlFor="payment-method"
                        className="text-xl uppercase font-bold text-slate-400 block"
                      >
                        Payment Method
                      </label>
                      <select
                        id="payment-method"
                        value={paymentMethod}
                        disabled={isSaving || isSavingDiscount}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full h-14 px-5 text-2xl border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </select>
                    </div>

                    {/* Purpose */}
                    <div className="space-y-2.5">
                      <label
                        htmlFor="payment-purpose"
                        className="text-xl uppercase font-bold text-slate-400 block"
                      >
                        Payment Purpose *
                      </label>
                      <input
                        id="payment-purpose"
                        type="text"
                        value={paymentPurpose}
                        disabled={isSaving || isSavingDiscount}
                        onChange={(e) => setPaymentPurpose(e.target.value)}
                        className="w-full h-14 px-5 text-2xl border border-slate-200 rounded-xl placeholder:text-xl placeholder:text-slate-400"
                        placeholder="e.g. Advance for Implant"
                      />
                    </div>

                    {/* Date */}
                    <div className="space-y-2.5">
                      <label
                        htmlFor="payment-date"
                        className="text-xl uppercase font-bold text-slate-400 block"
                      >
                        Payment Date
                      </label>
                      <input
                        id="payment-date"
                        type="date"
                        value={paymentDate}
                        disabled={isSaving || isSavingDiscount}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full h-14 px-5 text-2xl border border-slate-200 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2.5">
                    <label
                      htmlFor="payment-notes"
                      className="text-xl uppercase font-bold text-slate-400 block"
                    >
                      Notes (Optional)
                    </label>
                    <textarea
                      id="payment-notes"
                      value={paymentNotes}
                      disabled={isSaving || isSavingDiscount}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      rows={4}
                      className="w-full p-5 text-2xl border border-slate-200 rounded-xl resize-none placeholder:text-xl placeholder:text-slate-400"
                      placeholder="Add optional remarks..."
                    />
                  </div>
                </form>

                <div className="space-y-4 pt-8 border-t border-slate-100">
                  <h4 className="text-2xl font-bold text-slate-700 uppercase">
                    Transaction History
                  </h4>
                  {selectedPlanTransactions.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <p className="text-xl text-slate-400">
                        No payments recorded for this plan yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                      {selectedPlanTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex justify-between items-start p-5 border border-slate-200 bg-white rounded-xl shadow-xs gap-4 group animate-fade-in"
                        >
                          <div className="space-y-1.5 text-xl">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800 text-2xl">
                                ₹{tx.amount.toLocaleString()}
                              </span>
                              <span className="text-base text-slate-500 font-semibold bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded">
                                {tx.payment_method === "bank_transfer"
                                  ? "Net Banking"
                                  : tx.payment_method.toUpperCase()}
                              </span>
                              <span className="text-base text-slate-400 font-semibold">
                                {tx.payment_date}
                              </span>
                            </div>
                            <div className="text-xl text-slate-700 font-semibold">
                              <span className="text-slate-400 font-medium">Purpose: </span>
                              {tx.purpose}
                            </div>
                            {tx.notes && (
                              <div className="text-lg text-slate-400 italic">
                                <span className="text-slate-400 font-medium">Notes: </span>"
                                {tx.notes}"
                              </div>
                            )}
                          </div>
                          <div className="flex gap-4 shrink-0 self-center">
                            <button
                              type="button"
                              onClick={() => startEditTransaction(tx)}
                              className="text-xl text-teal-600 font-bold hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="text-xl text-rose-600 font-bold hover:underline cursor-pointer"
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

              <div className="bg-slate-50 px-10 py-6 flex justify-end gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  disabled={isSaving || isSavingDiscount}
                  className="px-8 py-3.5 text-2xl font-bold text-slate-600 bg-white border rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  form="payment-form"
                  disabled={isSaving || isSavingDiscount}
                  className="px-8 py-3.5 text-2xl font-bold text-white bg-teal-600 rounded-xl cursor-pointer disabled:opacity-50 hover:bg-teal-700 transition-colors"
                >
                  {isSaving ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
