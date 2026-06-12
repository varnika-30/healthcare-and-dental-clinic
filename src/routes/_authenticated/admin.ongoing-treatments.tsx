"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Download,
  Eye,
  CreditCard,
  Plus,
  ArrowUpRight,
  FlaskConical,
  CalendarDays,
  UserCheck,
  ChevronRight,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";

type PaymentMethod = "Card" | "Cash" | "Insurance" | "Bank Transfer" | "Online" | "Other" | "—";
type LabStatus = "None" | "Sent" | "In Progress" | "Returned" | "Follow-up Needed";
type ClinicalStage = "Active Treatment" | "Lab Phase Pending" | "Ready for Follow-up" | "Concluded";

interface OngoingTreatmentCase {
  id: string;
  patientName: string;
  patientId: string;
  treatment: string;
  appointmentDate: string;
  clinicalStage: ClinicalStage;

  // Advanced Lab Tracking Schema
  labWorkflow: {
    status: LabStatus;
    sentDate?: string;
    expectedReturnDate?: string;
  };

  // Finance Schema Bounds
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  status: "Paid" | "Partial" | "Pending" | "Overdue";
  paymentMethod: PaymentMethod;
  dueDate: string;
}

const TREATMENT_OPTIONS = [
  {
    name: "Routine Cleaning & Checkup",
    aliases: ["cleaning", "checkup", "clean"],
  },
  {
    name: "Dental Filling",
    aliases: ["fill", "filling"],
  },
  {
    name: "Root Canal Treatment",
    aliases: ["rc", "rct", "root canal"],
  },
  {
    name: "Crown Placement",
    aliases: ["crown"],
  },
  {
    name: "Bridge Placement",
    aliases: ["bridge"],
  },
  {
    name: "Tooth Extraction",
    aliases: ["extract", "extraction"],
  },
  {
    name: "Dental Implant",
    aliases: ["implant", "imp"],
  },
  {
    name: "Scaling & Polishing",
    aliases: ["scaling", "polishing", "sp"],
  },
  {
    name: "Teeth Whitening",
    aliases: ["whitening", "bleaching"],
  },
  {
    name: "Orthodontic Treatment",
    aliases: ["ortho", "braces"],
  },
  {
    name: "Denture",
    aliases: ["denture", "partial denture"],
  },
];

const initialTreatments: OngoingTreatmentCase[] = [
  {
    id: "TRT-2026-0482",
    patientName: "Eleanor Vance",
    patientId: "PT-8831",
    treatment: "Root Canal Therapy & Crown (Tooth #14)",
    appointmentDate: "May 20, 2026",
    clinicalStage: "Active Treatment",
    labWorkflow: { status: "None" },
    totalAmount: 1450.0,
    paidAmount: 1450.0,
    remainingBalance: 0.0,
    status: "Paid",
    paymentMethod: "Card",
    dueDate: "May 20, 2026",
  },
  {
    id: "TRT-2026-0481",
    patientName: "Marcus Brody",
    patientId: "PT-4219",
    treatment: "Porcelain Crown Fabrication (Tooth #8)",
    appointmentDate: "May 19, 2026",
    clinicalStage: "Lab Phase Pending",
    labWorkflow: {
      status: "In Progress",
      sentDate: "May 19, 2026",
      expectedReturnDate: "May 29, 2026",
    },
    totalAmount: 1200.0,
    paidAmount: 400.0,
    remainingBalance: 800.0,
    status: "Partial",
    paymentMethod: "Cash",
    dueDate: "Jun 02, 2026",
  },
  {
    id: "TRT-2026-0465",
    patientName: "Arthur Pendragon",
    patientId: "PT-3302",
    treatment: "Dental Implant Placement (Stage 1)",
    appointmentDate: "May 05, 2026",
    clinicalStage: "Active Treatment",
    labWorkflow: { status: "None" },
    totalAmount: 2100.0,
    paidAmount: 0.0,
    remainingBalance: 2100.0,
    status: "Pending",
    paymentMethod: "—",
    dueDate: "Jun 05, 2026",
  },
];

export const Route = createFileRoute("/_authenticated/admin/ongoing-treatments")({
  component: DentalTreatmentOperationsDashboard,
});

export default function DentalTreatmentOperationsDashboard() {
  const [createOpen, setCreateOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [labDialogOpen, setLabDialogOpen] = useState(false);

  const [treatments, setTreatments] = useState<OngoingTreatmentCase[]>(initialTreatments);
  useEffect(() => {
    async function loadTreatmentPlans() {
      const { data, error } = await supabase
        .from("treatment_plans")
        .select(
          `
          *,
          patients (*)
        `,
        )
        .order("created_at", { ascending: false });

      if (data) {
        setTreatments(
          data.map((plan) => ({
            id: plan.id,

            patientName: `${String((plan.patients as Record<string, unknown>).first_name ?? "")} ${String((plan.patients as Record<string, unknown>).last_name ?? "")}`,
            patientId: plan.patient_id,

            treatment: plan.title,

            appointmentDate: plan.start_date || "—",

            clinicalStage:
              plan.status === "planned"
                ? "Ready for Follow-up"
                : plan.status === "in_progress"
                  ? "Active Treatment"
                  : plan.status === "completed"
                    ? "Concluded"
                    : "Ready for Follow-up",

            labWorkflow: {
              status: plan.lab_status === "none" ? "None" : "In Progress",
            },

            totalAmount: Number(plan.estimated_cost || 0),

            paidAmount: Number(plan.paid_amount || 0),

            remainingBalance: Number(plan.estimated_cost || 0) - Number(plan.paid_amount || 0),

            status:
              plan.payment_status === "pending"
                ? "Pending"
                : plan.payment_status === "paid"
                  ? "Paid"
                  : "Partial",

            paymentMethod: "—",

            dueDate: plan.due_date || "—",
          })),
        );
      }
    }

    loadTreatmentPlans();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | "Active" | "Lab Phase" | "Follow-up">(
    "All",
  );
  const [selectedCase, setSelectedCase] = useState<OngoingTreatmentCase | null>(null);

  // Patient selector states
  const [patientOptions, setPatientOptions] = useState<{ id: string; name: string }[]>([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [customTreatmentName, setCustomTreatmentName] = useState("");

  // Form states
  const [invoiceForm, setInvoiceForm] = useState({
    patientName: "",
    treatment: "",
    amount: "",
    dueDate: "",
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    amountPaid: "",
    paymentMethod: "Cash",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [labForm, setLabForm] = useState({
    expectedReturnDate: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
  });

  // Load patients from Supabase
  useEffect(() => {
    async function loadPatientOptions() {
      const { data, error } = await supabase.from("patients").select("*");
      if (data) {
        setPatientOptions(
          data.map((patient: Record<string, unknown>) => ({
            id: String(patient.id),
            name: `${patient["first_name"]} ${patient["last_name"]}`,
          })),
        );
      }
    }
    loadPatientOptions();
  }, []);

  // Filter patient options based on search query
  const filteredPatientOptions = useMemo(() => {
    const normalizedQuery = patientSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) return patientOptions.slice(0, 25);

    return patientOptions
      .filter(
        (patient) =>
          patient.name.toLowerCase().includes(normalizedQuery) ||
          patient.id.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 25);
  }, [patientOptions, patientSearchQuery]);

  const formatDateString = (dateInput: string) => {
    if (!dateInput) return "—";
    const dateObj = new Date(dateInput);
    return isNaN(dateObj.getTime())
      ? "—"
      : dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error("Please select a patient.");
      return;
    }
    if (!invoiceForm.patientName || !invoiceForm.treatment || !invoiceForm.amount) return;

    const finalTreatment =
      invoiceForm.treatment === "Other" ? customTreatmentName : invoiceForm.treatment;
    const total = parseFloat(invoiceForm.amount) || 0;
    const newCase: OngoingTreatmentCase = {
      id: `TRT-2026-0${483 + treatments.length}`,
      patientName: invoiceForm.patientName,
      patientId: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      treatment: finalTreatment,
      appointmentDate: formatDateString(new Date().toISOString().split("T")[0]),
      clinicalStage: "Active Treatment",
      labWorkflow: { status: "None" },
      totalAmount: total,
      paidAmount: 0,
      remainingBalance: total,
      status: "Pending",
      paymentMethod: "—",
      dueDate: formatDateString(invoiceForm.dueDate),
    };

    const { error } = await supabase.from("treatment_plans").insert({
      patient_id: selectedPatient.id,
      title: finalTreatment,
      description: invoiceForm.notes || null,
      status: "in_progress",
      start_date: new Date().toISOString().split("T")[0],
      estimated_cost: total,
      actual_cost: 0,
      paid_amount: 0,
      due_date: invoiceForm.dueDate || null,
      payment_status: "pending",
      lab_status: "none",
    });

    if (error) {
      toast.error("Failed to create treatment plan");
      return;
    }

    toast.success("Treatment plan created successfully.");

    setInvoiceForm({
      patientName: "",
      treatment: "",
      amount: "",
      dueDate: "",
      notes: "",
    });

    setSelectedPatient(null);
    setPatientSearchQuery("");
    setCreateOpen(false);
  };

  const handleOpenPayment = (trtCase: OngoingTreatmentCase) => {
    setSelectedCase(trtCase);
    setPaymentForm({
      amountPaid: trtCase.remainingBalance.toString(),
      paymentMethod: "Cash",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setPaymentOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    const incomingPayment = parseFloat(paymentForm.amountPaid) || 0;
    if (incomingPayment <= 0) return;

    const updatedPaid = selectedCase.paidAmount + incomingPayment;

    const updatedStatus =
      updatedPaid >= selectedCase.totalAmount ? "paid" : updatedPaid > 0 ? "partial" : "pending";

    const { error } = await supabase
      .from("treatment_plans")
      .update({
        paid_amount: updatedPaid,
        payment_status: updatedStatus,
      })
      .eq("id", selectedCase.id);

    if (error) {
      console.error("PAYMENT UPDATE ERROR:", error);
      toast.error("Failed to record payment");
      return;
    }

    setTreatments((prev) =>
      prev.map((item) => {
        if (item.id === selectedCase.id) {
          const updatedPaid = item.paidAmount + incomingPayment;
          const updatedRemaining = Math.max(0, item.totalAmount - updatedPaid);

          let updatedStatus: OngoingTreatmentCase["status"] = "Pending";
          if (updatedPaid === item.totalAmount) updatedStatus = "Paid";
          else if (updatedPaid > 0 && updatedPaid < item.totalAmount) updatedStatus = "Partial";

          return {
            ...item,
            paidAmount: updatedPaid,
            remainingBalance: updatedRemaining,
            status: updatedStatus,
            paymentMethod: paymentForm.paymentMethod as PaymentMethod,
          };
        }
        return item;
      }),
    );

    setPaymentOpen(false);
    setSelectedCase(null);
    toast.success("Ledger offsets applied down directly to patient profile.");
  };

  // Lab operations interaction loops
  const handleOpenLabDispatch = (trtCase: OngoingTreatmentCase) => {
    setSelectedCase(trtCase);
    setLabDialogOpen(true);
  };

  const handleDispatchToLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    setTreatments((prev) =>
      prev.map((item) => {
        if (item.id === selectedCase.id) {
          return {
            ...item,
            clinicalStage: "Lab Phase Pending",
            labWorkflow: {
              status: "Sent",
              sentDate: formatDateString(new Date().toISOString().split("T")[0]),
              expectedReturnDate: formatDateString(labForm.expectedReturnDate),
            },
          };
        }
        return item;
      }),
    );

    setLabDialogOpen(false);
    setSelectedCase(null);
    toast.info("Clinical asset marked as dispatched. Tracking parameters initialized.");
  };

  const handleAdvanceLabStatus = (id: string, currentStatus: LabStatus, patient: string) => {
    setTreatments((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let nextStatus: LabStatus = "In Progress";
          let nextStage: ClinicalStage = "Lab Phase Pending";

          if (currentStatus === "Sent") nextStatus = "In Progress";
          else if (currentStatus === "In Progress") {
            nextStatus = "Returned";
            nextStage = "Ready for Follow-up";
            // Integrated Notification Workflow Link
            toast(`Lab case for ${patient} returned.`, {
              description: "Schedule follow-up appointment within 48 hours.",
              action: {
                label: "Acknowledge",
                onClick: () => {},
              },
            });
          }

          return {
            ...item,
            clinicalStage: nextStage,
            labWorkflow: { ...item.labWorkflow, status: nextStatus },
          };
        }
        return item;
      }),
    );
  };

  const handleTriggerFollowUp = (id: string) => {
    setTreatments((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, clinicalStage: "Ready for Follow-up" } : item,
      ),
    );
    toast.success("Patient queued into tracking ledger for outreach recall callbacks.");
  };

  // Comprehensive Metrics compilation bounds
  const operationsMetrics = useMemo(() => {
    return {
      activeCases: treatments.filter((t) => t.clinicalStage === "Active Treatment").length,
      awaitingLab: treatments.filter((t) => t.clinicalStage === "Lab Phase Pending").length,
      followUpNeeded: treatments.filter((t) => t.clinicalStage === "Ready for Follow-up").length,
      outstandingBalance: treatments.reduce((sum, t) => sum + t.remainingBalance, 0),
    };
  }, [treatments]);

  const filteredTreatments = useMemo(() => {
    return treatments.filter((item) => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.treatment.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;
      if (activeFilter === "Active") matchesFilter = item.clinicalStage === "Active Treatment";
      else if (activeFilter === "Lab Phase")
        matchesFilter = item.clinicalStage === "Lab Phase Pending";
      else if (activeFilter === "Follow-up")
        matchesFilter = item.clinicalStage === "Ready for Follow-up";

      return matchesSearch && matchesFilter;
    });
  }, [treatments, searchTerm, activeFilter]);

  return (
    <DashboardShell>
      <div className="space-y-5">
        {/* DASHBOARD TOP HEADER BAR */}
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Treatment Operations Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Monitor active clinical tracks, laboratory logistical pipelines, and transactional
              balances.
            </p>
          </div>
          <div>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-2.5 text-xs font-bold uppercase tracking-wider h-12 px-4 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Initialize Case Track
            </Button>
          </div>
        </div>

        {/* METRICS ROW HIGHLIGHT FRAMEWORK */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-3xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Cases
            </span>
            <span className="text-lg font-bold text-slate-800 mt-0.5 block">
              {operationsMetrics.activeCases} Patients
            </span>
          </div>
          <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-3xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Awaiting Lab
              </span>
              <span className="text-lg font-bold text-indigo-700 mt-0.5 block">
                {operationsMetrics.awaitingLab} Pipelines
              </span>
            </div>
            <FlaskConical className="h-4 w-4 text-indigo-400 shrink-0" />
          </div>
          <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-3xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Follow-Ups Queued
              </span>
              <span className="text-lg font-bold text-amber-700 mt-0.5 block">
                {operationsMetrics.followUpNeeded} Outreach
              </span>
            </div>
            <CalendarDays className="h-4 w-4 text-amber-400 shrink-0" />
          </div>
          <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-3xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Pipeline Ledger Balance
            </span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              ${operationsMetrics.outstandingBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* CONTROLS UTILITY BAR VIEW */}
        <div className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3xs">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by clinician, patient ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition font-medium text-slate-900"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
            {(
              [
                { id: "All", label: "All Cases" },
                { id: "Active", label: "Active" },
                { id: "Lab Phase", label: "Lab Phase" },
                { id: "Follow-up", label: "Callbacks Needed" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition whitespace-nowrap ${activeFilter === tab.id ? "bg-white text-slate-900 shadow-3xs" : "text-slate-500 hover:text-slate-900"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CORE CONSOLIDATED CASE CARDS LIST VIEW */}
        <div className="space-y-3.5">
          {filteredTreatments.length > 0 ? (
            filteredTreatments.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-100/90 rounded-xl p-4 shadow-3xs hover:border-slate-200 transition grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative overflow-hidden"
              >
                {/* Visual Accent State Indicators */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    item.clinicalStage === "Lab Phase Pending"
                      ? "bg-indigo-600"
                      : item.clinicalStage === "Ready for Follow-up"
                        ? "bg-amber-500"
                        : "bg-teal-600"
                  }`}
                />

                {/* ZONE 1: DETAILED TREATMENT CLINICAL PROFILE AREA */}
                <div className="md:col-span-5 pl-1.5 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl font-extrabold text-slate-900">
                      {item.patientName}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded border ${
                        item.clinicalStage === "Active Treatment"
                          ? "bg-teal-50 text-teal-700 border-teal-100"
                          : item.clinicalStage === "Lab Phase Pending"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}
                    >
                      {item.clinicalStage}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 truncate max-w-sm">
                    {item.treatment}
                  </p>

                  {/* Embedded Custom Lab Tracking Dashboard Block */}
                  {item.labWorkflow.status !== "None" && (
                    <div className="text-[11px] font-medium text-indigo-600 bg-indigo-50/40 border border-indigo-100/60 p-2 rounded-lg mt-1 flex items-center justify-between gap-2 max-w-sm">
                      <div className="flex items-center gap-1">
                        <FlaskConical className="h-3 w-3" />
                        <span>
                          Lab Workflow:{" "}
                          <strong className="font-bold underline">{item.labWorkflow.status}</strong>
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Exp: {item.labWorkflow.expectedReturnDate}
                      </div>
                    </div>
                  )}
                </div>

                {/* ZONE 2: DETAILED FINANCIAL COMMITMENT MATRIX AREA */}
                <div className="md:col-span-3 border-t md:border-t-0 pt-2 md:pt-0 border-slate-50 grid grid-cols-2 gap-2 text-left">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Ledger Invoicing
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      ${item.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Financial Balance
                    </span>
                    <span
                      className={`text-xs font-black ${item.remainingBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}
                    >
                      {item.remainingBalance > 0
                        ? `$${item.remainingBalance.toFixed(2)} Due`
                        : "Cleared Ledger"}
                    </span>
                  </div>
                </div>

                {/* ZONE 3: ACTIONS CONTEXT CONTROL PANELS */}
                <div className="md:col-span-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-50 flex flex-wrap items-center justify-start md:justify-end gap-2">
                  {/* Conditional Workflows rendering maps */}
                  {item.labWorkflow.status === "None" &&
                    item.clinicalStage !== "Ready for Follow-up" && (
                      <button
                        onClick={() => handleOpenLabDispatch(item)}
                        className="inline-flex items-center gap-1 h-7 text-[10px] font-bold uppercase tracking-wider border border-indigo-200 bg-indigo-50/30 text-indigo-700 rounded px-2.5 hover:bg-indigo-50"
                      >
                        <FlaskConical className="h-3 w-3" />
                        <span>Send to Lab</span>
                      </button>
                    )}

                  {item.labWorkflow.status !== "None" && item.labWorkflow.status !== "Returned" && (
                    <button
                      onClick={() =>
                        handleAdvanceLabStatus(item.id, item.labWorkflow.status, item.patientName)
                      }
                      className="inline-flex items-center gap-1 h-7 text-[10px] font-bold uppercase tracking-wider border border-indigo-200 bg-indigo-600 text-white rounded px-2.5 hover:bg-indigo-700"
                    >
                      <RefreshCcw className="h-3 w-3 animate-spin-slow" />
                      <span>Log Return Progress</span>
                    </button>
                  )}

                  {item.clinicalStage === "Active Treatment" && (
                    <button
                      onClick={() => handleTriggerFollowUp(item.id)}
                      className="inline-flex items-center gap-1 h-7 text-[10px] font-bold uppercase tracking-wider border border-amber-200 bg-amber-50/40 text-amber-700 rounded px-2.5 hover:bg-amber-50"
                    >
                      <CalendarDays className="h-3 w-3" />
                      <span>Queue Recall</span>
                    </button>
                  )}

                  {item.remainingBalance > 0 && (
                    <button
                      onClick={() => handleOpenPayment(item)}
                      className="inline-flex items-center gap-1 h-7 text-[10px] font-bold uppercase tracking-wider border border-teal-200 bg-teal-50/60 text-teal-700 rounded px-2.5 hover:bg-teal-600 hover:text-white"
                    >
                      <CreditCard className="h-3 w-3" />
                      <span>Record Payment</span>
                    </button>
                  )}

                  <button className="p-1 text-slate-400 hover:text-slate-600 transition ml-auto md:ml-0">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-slate-100 rounded-xl p-12 text-center max-w-md mx-auto space-y-2 shadow-3xs">
              <AlertCircle className="h-6 w-6 text-slate-300 mx-auto" />
              <h3 className="text-xs font-bold text-slate-700">Clear Search Matrix</h3>
              <p className="text-[11px] text-slate-400 font-medium">
                No tracking instances found matching targeted operational inputs.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          MODAL INTERFACES: DISPATCH LOG TO LAB
         ========================================== */}
      <Dialog open={labDialogOpen} onOpenChange={setLabDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Laboratory Case Despatch</DialogTitle>
            <DialogDescription>
              Route manufacturing tracking indexes cleanly through external partner technicians.
            </DialogDescription>
          </DialogHeader>
          {selectedCase && (
            <form onSubmit={handleDispatchToLab} className="space-y-4 py-2">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Patient File Link
                </Label>
                <div className="text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-100 mt-1">
                  {selectedCase.patientName} — {selectedCase.treatment}
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="expectedReturnDate">Target Expected Completion Return Date</Label>
                <Input
                  id="expectedReturnDate"
                  type="date"
                  required
                  value={labForm.expectedReturnDate}
                  onChange={(e) => setLabForm({ ...labForm, expectedReturnDate: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLabDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Confirm Dispatch Order
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ==========================================
          MODAL INTERFACES: BOOKING PAYMENT MANIFEST
         ========================================== */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Post Ledger Remittance</DialogTitle>
            <DialogDescription>
              Post transaction offsets manually down directly to this tracking profile instance.
            </DialogDescription>
          </DialogHeader>
          {selectedCase && (
            <form onSubmit={handleRecordPayment} className="space-y-4 py-1">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target Patient Profile
                </Label>
                <div className="text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-100 mt-1">
                  {selectedCase.patientName} ({selectedCase.id})
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Remaining Balance Due</Label>
                  <div className="text-xs font-bold text-rose-600 bg-rose-50/50 p-2.5 rounded border border-rose-100 mt-1">
                    ${selectedCase.remainingBalance.toFixed(2)}
                  </div>
                </div>
                <div>
                  <Label htmlFor="amountPaid">Amount Remitted ($)</Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    step="0.01"
                    required
                    max={selectedCase.remainingBalance}
                    value={paymentForm.amountPaid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                    className="mt-1 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="paymentMethod">Remittance Routing Instrument</Label>
                <div className="mt-1">
                  <Select
                    value={paymentForm.paymentMethod}
                    onValueChange={(val) => setPaymentForm({ ...paymentForm, paymentMethod: val })}
                  >
                    <SelectTrigger id="paymentMethod" className="w-full text-xs h-9">
                      <SelectValue placeholder="Select instrument" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash Ledger Settlement</SelectItem>
                      <SelectItem value="Online">Online Routing Gateway</SelectItem>
                      <SelectItem value="Card">Merchant Credit / Debit Card</SelectItem>
                      <SelectItem value="Insurance">Third-Party Insurance Manifest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Apply Remittance Offset
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE INVOICE DISPATCH DRAWER OVERLAY */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle>Initialize Treatment Case Manifest</DialogTitle>
            <DialogDescription>
              Generate an upfront treatment itemization ledger record before collecting processing
              funds.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4 py-2 text-xs">
            <div className="grid gap-2">
              <Label>Patient</Label>

              <Input
                value={patientSearchQuery}
                onChange={(e) => {
                  setPatientSearchQuery(e.target.value);
                  setShowPatientDropdown(true);
                }}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Search patient..."
              />

              {showPatientDropdown && patientSearchQuery.trim() && (
                <div className="max-h-48 overflow-y-auto border rounded-lg bg-white">
                  {filteredPatientOptions.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-slate-50"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setPatientSearchQuery(patient.name);
                        setShowPatientDropdown(false);

                        setInvoiceForm({
                          ...invoiceForm,
                          patientName: patient.name,
                        });
                      }}
                    >
                      {patient.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="treatment">Target Treatment Clinical Procedure</Label>
              <Select
                value={invoiceForm.treatment}
                onValueChange={(value) =>
                  setInvoiceForm({
                    ...invoiceForm,
                    treatment: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select treatment" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Routine Cleaning & Checkup">
                    Routine Cleaning & Checkup
                  </SelectItem>

                  <SelectItem value="Dental Filling">Dental Filling</SelectItem>

                  <SelectItem value="Root Canal Treatment">Root Canal Treatment</SelectItem>

                  <SelectItem value="Crown Placement">Crown Placement</SelectItem>

                  <SelectItem value="Bridge Placement">Bridge Placement</SelectItem>

                  <SelectItem value="Tooth Extraction">Tooth Extraction</SelectItem>

                  <SelectItem value="Dental Implant">Dental Implant</SelectItem>

                  <SelectItem value="Scaling & Polishing">Scaling & Polishing</SelectItem>

                  <SelectItem value="Teeth Whitening">Teeth Whitening</SelectItem>

                  <SelectItem value="Orthodontic Treatment">Orthodontic Treatment</SelectItem>

                  <SelectItem value="Denture">Denture</SelectItem>

                  <SelectItem value="Other"> Other </SelectItem>
                </SelectContent>
              </Select>

              {invoiceForm.treatment === "Other" && (
                <Input
                  placeholder="Enter custom treatment name"
                  value={customTreatmentName}
                  onChange={(e) => setCustomTreatmentName(e.target.value)}
                />
              )}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="amount">Total Treatment Valuation Base ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                required
                value={invoiceForm.amount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="dueDate">Remittance Clearance Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                required
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                Initialize Treatment File
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
