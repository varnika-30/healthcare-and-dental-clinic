import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  patientName: string;
  treatment: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: "Paid" | "Partial Payments" | "Payments Due" | "Overdue";
}

const MOCK_BILLING_RECORDS: BillingRecord[] = [
  {
    id: "INV-2026-001",
    patientName: "Arjun Mehta",
    treatment: "Root Canal Therapy + Crown",
    totalAmount: 12500,
    paidAmount: 12500,
    dueDate: "2026-06-10",
    status: "Paid",
  },
  {
    id: "INV-2026-002",
    patientName: "Priya Sharma",
    treatment: "Invisalign Alignment Intake",
    totalAmount: 45000,
    paidAmount: 15000,
    dueDate: "2026-06-25",
    status: "Partial Payments",
  },
  {
    id: "INV-2026-003",
    patientName: "Rohan Das",
    treatment: "Deep Scaling & Composite Filling",
    totalAmount: 4200,
    paidAmount: 0,
    dueDate: "2026-06-15",
    status: "Payments Due",
  },
  {
    id: "INV-2026-004",
    patientName: "Sneha Reddy",
    treatment: "Molar Extraction & Sedation",
    totalAmount: 8500,
    paidAmount: 0,
    dueDate: "2026-06-05",
    status: "Overdue",
  },
  {
    id: "INV-2026-005",
    patientName: "Kabir Malhotra",
    treatment: "Porcelain Veneers Placement",
    totalAmount: 60000,
    paidAmount: 40000,
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

  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);

  useEffect(() => {
    async function loadBillingData() {
      const { data, error } = await supabase.from("treatment_plans").select(`
            *,
            patients(*)
            `);

      if (error) {
        console.error(error);
        return;
      }

      const mappedRecords: BillingRecord[] = (data || []).map((plan) => {
        console.log("PATIENT OBJECT:", JSON.stringify(plan.patients, null, 2));

        return {
          id: plan.id,
          patientName: `${(plan.patients as Record<string, unknown>)["first_name"] ?? ""} ${(plan.patients as Record<string, unknown>)["last_name"] ?? ""}`.trim(),
          treatment: plan.title,
          totalAmount: plan.estimated_cost ?? 0,
          paidAmount: plan.paid_amount ?? 0,
          dueDate: plan.due_date ?? "",

          status:
            (plan.estimated_cost ?? 0) <= (plan.paid_amount ?? 0)
              ? "Paid"
              : (plan.paid_amount ?? 0) > 0
                ? "Partial Payments"
                : "Payments Due",
        };
      });

      console.log("MAPPED BILLING RECORDS:", mappedRecords);
      setBillingRecords(mappedRecords);
    }

    loadBillingData();
  }, []);

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
      outstandingBalance += rec.totalAmount - rec.paidAmount;

      if (rec.status === "Paid") {
        fullyPaidCount++;
      } else {
        pendingPaymentsCount++;
      }
    });

    return { totalRevenue, outstandingBalance, pendingPaymentsCount, fullyPaidCount };
  }, []);

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
        {filteredRecords.length === 0 ? (
          /* CLEAN EMPTY STATE INTERACTION CONTAINER */
          <div className="py-16 px-4 text-center max-w-sm mx-auto space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400">
              <Filter className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">No matching billing logs found</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adjust your state parameters or change your diagnostic search query criteria and try
                again.
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
        ) : (
          /* PRODUCTION RESPONSIVE SCROLL-BOX MATRIX */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Invoice Reference</th>
                  <th className="py-3 px-5">Patient Identity</th>
                  <th className="py-3 px-5">Clinical Focus / Treatment</th>
                  <th className="py-3 px-5 text-right">Total Fee</th>
                  <th className="py-3 px-5 text-right">Collected</th>
                  <th className="py-3 px-5 text-right">Outstanding Arrears</th>
                  <th className="py-3 px-5">Target Due Axis</th>
                  <th className="py-3 px-5 text-center">Settlement State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {filteredRecords.map((rec) => {
                  const remainingBalance = rec.totalAmount - rec.paidAmount;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Invoice ID */}
                      <td className="py-4 px-5 text-xs font-bold text-slate-400 tabular-nums">
                        {rec.id}
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

                      {/* Total Amount */}
                      <td className="py-4 px-5 text-right tabular-nums text-slate-900 font-semibold">
                        ₹{rec.totalAmount.toLocaleString()}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-4 px-5 text-right tabular-nums text-emerald-600 font-semibold">
                        ₹{rec.paidAmount.toLocaleString()}
                      </td>

                      {/* Remaining Balance */}
                      <td
                        className={`py-4 px-5 text-right tabular-nums font-bold ${remainingBalance > 0 ? "text-rose-600" : "text-slate-400"}`}
                      >
                        ₹{remainingBalance.toLocaleString()}
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-5 text-xs text-slate-500 font-semibold tabular-nums">
                        {rec.dueDate}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-4 px-5 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] uppercase border tracking-wider ${getStatusStyles(rec.status)}`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
