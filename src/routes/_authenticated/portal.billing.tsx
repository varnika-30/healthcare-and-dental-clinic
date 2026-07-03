import React, { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getOrCreateMyPatient } from "@/lib/patient";
import { calculatePlanBilling } from "@/lib/billing";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  DollarSign,
  HelpCircle,
  FileText,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  Search,
  Filter,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// TANSTACK ROUTE COUPLING
// ==========================================
export const Route = createFileRoute("/_authenticated/portal/billing")({
  component: PortalBillingPage,
});

type FilterStatus = "All" | "Payments Due" | "Partial Payments" | "Paid" | "Overdue";

function PortalBillingPage() {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Pagination State for Invoices
  const [invoicePage, setInvoicePage] = useState<number>(1);
  const INVOICES_PER_PAGE = 10;

  // Transaction History Modal & Pagination State
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [txPage, setTxPage] = useState<number>(1);
  const TX_PER_PAGE = 10;

  // ==========================================
  // SUPABASE / TANSTACK QUERY DATA ENGINE
  // ==========================================
  const { data: billingData = { records: [], transactions: [] }, isLoading } = useQuery({
    queryKey: ["portal-billing"],
    queryFn: async () => {
      const patient = await getOrCreateMyPatient();
      if (!patient) return { records: [], transactions: [] };

      // 1. Fetch treatment plans
      const { data: plansData, error: plansError } = await supabase
        .from("treatment_plans")
        .select("*")
        .eq("patient_id", patient.id);

      if (plansError) {
        throw plansError;
      }

      // 2. Fetch payment transactions
      const { data: txsData, error: txsError } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("patient_id", patient.id)
        .order("payment_date", { ascending: false });

      if (txsError) {
        throw txsError;
      }

      const mappedRecords = (plansData || []).map((plan) => {
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

        return {
          id: plan.id,
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

      return {
        records: mappedRecords,
        transactions: txsData || [],
      };
    },
  });

  const billingRecords = billingData.records;
  const transactions = billingData.transactions;

  // ==========================================
  // FINANCIAL CALCULATIONS MATRIX
  // ==========================================
  const metrics = useMemo(() => {
    let totalCost = 0;
    let totalPaid = 0;
    let outstandingBalance = 0;

    billingRecords.forEach((rec) => {
      totalCost += rec.finalCost;
      totalPaid += rec.paidAmount;
      outstandingBalance += rec.outstandingAmount;
    });

    const progressPercentage = totalCost > 0 ? Math.round((totalPaid / totalCost) * 100) : 0;

    return { totalCost, totalPaid, outstandingBalance, progressPercentage };
  }, [billingRecords]);

  // ==========================================
  // HANDLERS FOR FILTER/SEARCH RESETTING PAGINATION
  // ==========================================
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setInvoicePage(1);
  };

  const handleFilterChange = (filter: FilterStatus) => {
    setActiveFilter(filter);
    setInvoicePage(1);
  };

  // ==========================================
  // FILTER & SEARCH PIPE LOGIC
  // ==========================================
  const filteredRecords = useMemo(() => {
    return billingRecords.filter((rec) => {
      const matchesFilter = activeFilter === "All" || rec.status === activeFilter;
      const matchesSearch =
        rec.treatment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [billingRecords, activeFilter, searchQuery]);

  // Invoice Pagination Segmenting
  const totalInvoicePages = Math.max(1, Math.ceil(filteredRecords.length / INVOICES_PER_PAGE));
  const paginatedInvoices = useMemo(() => {
    const offset = (invoicePage - 1) * INVOICES_PER_PAGE;
    return filteredRecords.slice(offset, offset + INVOICES_PER_PAGE);
  }, [filteredRecords, invoicePage]);

  // Transactions Display Sets (Main Page Top 5 vs Modal Paginated)
  const previewTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const totalTxPages = Math.max(1, Math.ceil(transactions.length / TX_PER_PAGE));
  const paginatedTransactions = useMemo(() => {
    const offset = (txPage - 1) * TX_PER_PAGE;
    return transactions.slice(offset, offset + TX_PER_PAGE);
  }, [transactions, txPage]);

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const getStatusStyles = (status: "Paid" | "Partial Payments" | "Payments Due" | "Overdue") => {
    switch (status) {
      case "Paid":
        return "bg-emerald-50/80 border-emerald-200 text-emerald-700 font-semibold shadow-xs";
      case "Partial Payments":
        return "bg-amber-50/80 border-amber-200 text-amber-700 font-semibold shadow-xs";
      case "Payments Due":
        return "bg-slate-50 border-slate-200 text-slate-600 font-medium";
      case "Overdue":
        return "bg-rose-50 border-rose-200 text-rose-700 font-bold animate-pulse shadow-xs";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/40 p-6 md:p-10 space-y-10 font-sans antialiased text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* 1. PAGE HEADER FRAME */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/10 shadow-xs">
              <DollarSign className="h-3.5 w-3.5 stroke-[2.5]" />
              Financial Statement
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl mt-2">
              Billing Ledger
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="animate-pulse space-y-3 text-center">
              <div className="h-5 w-40 bg-slate-200 rounded-full mx-auto"></div>
              <div className="h-3.5 w-60 bg-slate-100 rounded-full mx-auto"></div>
            </div>
          </div>
        ) : (
          <>
            {/* 2. OPERATIONAL SUMMARY METRIC CARDS */}
            <div className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/30 p-6 md:p-8 shadow-sm space-y-6 ring-1 ring-black/[0.01]">
              <div className="absolute right-0 top-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block">
                    Payment Progress
                  </span>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-4xl font-black text-slate-900 tracking-tight">
                      {metrics.progressPercentage}%
                    </span>
                    <span className="text-sm font-semibold text-teal-700 bg-teal-50/80 px-2 py-0.5 rounded-md border border-teal-100">
                      Completed
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 md:gap-12 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-12">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Total Treatment Cost
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      ₹{metrics.totalCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Amount Due
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      ₹{metrics.outstandingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500 ease-out shadow-xs"
                  style={{ width: `${metrics.progressPercentage}%` }}
                />
              </div>
            </div>

            {/* 3. FILTERS & SEARCH ROW ENGINE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center lg:justify-between">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by treatment or invoice ID..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 text-sm font-medium border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all placeholder:text-slate-400 text-slate-800 shadow-2xs"
                />
              </div>

              {/* Compact Custom Status Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl self-start lg:self-auto">
                {(["All", "Paid", "Partial Payments", "Payments Due", "Overdue"] as FilterStatus[]).map((filter) => {
                  const labelMap: Record<FilterStatus, string> = {
                    All: "All",
                    Paid: "Paid",
                    "Partial Payments": "Partial",
                    "Payments Due": "Due",
                    Overdue: "Overdue",
                  };
                  const isSelected = activeFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => handleFilterChange(filter)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-white text-teal-700 shadow-2xs border border-slate-200/60"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {labelMap[filter]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. BILLING REGISTRY MATRIX */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-600 stroke-[2]" />
                  Active Billing Invoices ({filteredRecords.length})
                </h3>
              </div>

              {paginatedInvoices.length === 0 ? (
                <div className="py-20 px-6 text-center max-w-sm mx-auto space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 shadow-2xs">
                    <Filter className="h-6 w-6 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-800">No matching invoices found</h3>
                    <p className="text-xs text-slate-400 font-medium leading-normal">
                      Try adjusting your status filters or search term to see current treatment records.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <th className="py-3.5 px-6 md:px-8">Invoice Reference</th>
                          <th className="py-3.5 px-6 md:px-8">Treatment</th>
                          <th className="py-3.5 px-6 md:px-8 text-right">Estimated Cost</th>
                          <th className="py-3.5 px-6 md:px-8 text-right">Discount</th>
                          <th className="py-3.5 px-6 md:px-8 text-right">Final Cost</th>
                          <th className="py-3.5 px-6 md:px-8 text-right">Paid Amount</th>
                          <th className="py-3.5 px-6 md:px-8 text-right">Outstanding Balance</th>
                          <th className="py-3.5 px-6 md:px-8 text-center">Status</th>
                          <th className="py-3.5 px-6 md:px-8 text-center">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                        {paginatedInvoices.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-4.5 px-6 md:px-8 text-xs font-bold text-slate-400 tabular-nums">
                              {rec.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="py-4.5 px-6 md:px-8 font-bold text-slate-900">
                              {rec.treatment}
                            </td>
                            <td className="py-4.5 px-6 md:px-8 text-right font-semibold text-slate-600 tabular-nums">
                              ₹{rec.estimatedCost.toLocaleString()}
                            </td>
                            <td className="py-4.5 px-6 md:px-8 text-right font-semibold text-rose-600 tabular-nums">
                              ₹{rec.discount.toLocaleString()}
                            </td>
                            <td className="py-4.5 px-6 md:px-8 text-right font-bold text-slate-900 tabular-nums">
                              ₹{rec.finalCost.toLocaleString()}
                            </td>
                            <td className="py-4.5 px-6 md:px-8 text-right font-bold text-emerald-600 tabular-nums">
                              ₹{rec.paidAmount.toLocaleString()}
                            </td>
                            <td className="py-4.5 px-6 md:px-8 text-right font-black text-rose-600 tabular-nums">
                              ₹{rec.outstandingAmount.toLocaleString()}
                            </td>
                            <td className="py-4.5 px-6 md:px-8 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider border ${getStatusStyles(rec.status)}`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-4.5 px-6 md:px-8 text-center text-xs font-bold text-slate-500 tabular-nums">
                              {rec.dueDate
                                ? new Date(rec.dueDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Invoice Pagination Footer Controls */}
                  <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      Page {invoicePage} of {totalInvoicePages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
                        disabled={invoicePage === 1}
                        className="p-1.5 border border-slate-200 rounded-lg text-slate-500 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition shadow-3xs"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoicePage((p) => Math.min(totalInvoicePages, p + 1))}
                        disabled={invoicePage === totalInvoicePages}
                        className="p-1.5 border border-slate-200 rounded-lg text-slate-500 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition shadow-3xs"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 5. PAYMENT TRANSACTION HISTORY SECTION */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4.5 flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-teal-600 stroke-[2]" />
                  Recent Payment Transactions History
                </h3>
                {transactions.length > 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTxPage(1);
                      setIsTxModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 transition"
                  >
                    View All Transactions <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {previewTransactions.length === 0 ? (
                <div className="py-16 px-6 text-center max-w-sm mx-auto space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-150 text-slate-400 shadow-3xs">
                    <Clock className="h-5 w-5 stroke-[1.5]" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    No payment transactions recorded yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="py-3.5 px-6 md:px-8">Transaction Date</th>
                        <th className="py-3.5 px-6 md:px-8">Payment ID</th>
                        <th className="py-3.5 px-6 md:px-8">Purpose</th>
                        <th className="py-3.5 px-6 md:px-8">Payment Method</th>
                        <th className="py-3.5 px-6 md:px-8 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                      {previewTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4.5 px-6 md:px-8 text-xs font-semibold text-slate-500 tabular-nums">
                            {new Date(tx.payment_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-4.5 px-6 md:px-8 text-xs font-bold text-slate-400 tabular-nums">
                            {tx.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="py-4.5 px-6 md:px-8 font-bold text-slate-800">
                            {tx.purpose}
                          </td>
                          <td className="py-4.5 px-6 md:px-8 text-xs font-bold text-slate-500 capitalize">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                              {tx.payment_method}
                            </span>
                          </td>
                          <td className="py-4.5 px-6 md:px-8 text-right font-black text-emerald-600 tabular-nums">
                            ₹{tx.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ==========================================
          FULL TRANSACTION HISTORY MODAL VIEW
         ========================================== */}
      <AnimatePresence>
        {isTxModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTxModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col z-10 overflow-hidden max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50/50">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-teal-600" />
                    Complete Transaction Ledger
                  </h3>
                  <p className="text-xs font-medium text-slate-400">Chronological history of all statement clearings.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Responsive Scrollable Inner Body */}
              <div className="overflow-y-auto flex-1 min-h-0">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="py-3.5 px-6 md:px-8">Transaction Date</th>
                      <th className="py-3.5 px-6 md:px-8">Payment ID</th>
                      <th className="py-3.5 px-6 md:px-8">Purpose</th>
                      <th className="py-3.5 px-6 md:px-8">Payment Method</th>
                      <th className="py-3.5 px-6 md:px-8 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                    {paginatedTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4.5 px-6 md:px-8 text-xs font-semibold text-slate-500 tabular-nums">
                          {new Date(tx.payment_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4.5 px-6 md:px-8 text-xs font-bold text-slate-400 tabular-nums">
                          {tx.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="py-4.5 px-6 md:px-8 font-bold text-slate-800">
                          {tx.purpose}
                        </td>
                        <td className="py-4.5 px-6 md:px-8 text-xs font-bold text-slate-500 capitalize">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                            {tx.payment_method}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 md:px-8 text-right font-black text-emerald-600 tabular-nums">
                          ₹{tx.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Transaction Pagination Footer */}
              <div className="border-t border-slate-150 bg-slate-50/60 px-6 py-4 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-slate-400">
                  Page {txPage} of {totalTxPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    disabled={txPage === 1}
                    className="p-1.5 border border-slate-200 rounded-lg text-slate-500 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition shadow-3xs"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxPage((p) => Math.min(totalTxPages, p + 1))}
                    disabled={txPage === totalTxPages}
                    className="p-1.5 border border-slate-200 rounded-lg text-slate-500 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition shadow-3xs"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PortalBillingPage;