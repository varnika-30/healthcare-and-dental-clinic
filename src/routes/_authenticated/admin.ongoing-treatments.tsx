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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, AlertCircle, Plus, FlaskConical, CalendarDays } from "lucide-react";
import { toast } from "sonner";

// ==========================================
// TYPE DEFINITIONS & SCHEMAS
// ==========================================
type PaymentMethod = "Card" | "Cash" | "Insurance" | "Bank Transfer" | "Online" | "Other" | "—";

type LabStatus =
  | "none"
  | "impression_scheduled"
  | "sent_to_lab"
  | "received_from_lab"
  | "finalized"
  | "sent_for_improvement";

type ClinicalStage = "Active Treatment" | "Lab Phase Pending" | "Ready for Follow-up" | "Concluded";

interface OngoingTreatmentCase {
  id: string;
  patientName: string;
  patientId: string;
  treatment: string;
  appointmentDate: string; // Dynamic target follow-up appt date if it exists
  clinicalStage: ClinicalStage;
  labStatus: LabStatus;
  followUpNeeded: boolean; // Driven by database boolean flag
  hasAppointment: boolean; // Derived dynamically from relational table join
  dbStatus: string;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  status: "Paid" | "Partial" | "Pending" | "Overdue";
  paymentMethod: PaymentMethod;
  dueDate: string;
}

export const Route = createFileRoute("/_authenticated/admin/ongoing-treatments")({
  component: DentalTreatmentOperationsDashboard,
});

export default function DentalTreatmentOperationsDashboard() {
  const [createOpen, setCreateOpen] = useState(false);
  const [treatments, setTreatments] = useState<OngoingTreatmentCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter and Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "All Cases" | "Active Cases" | "Lab Phase" | "Follow-Ups" | "Completed Cases"
  >("All Cases");

  // Patient Selector States
  const [patientOptions, setPatientOptions] = useState<{ id: string; name: string }[]>([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [customTreatmentName, setCustomTreatmentName] = useState("");

  // Form State
  const [invoiceForm, setInvoiceForm] = useState({
    patientName: "",
    treatment: "",
    amount: "",
    dueDate: "",
    notes: "",
  });

  // ==========================================
  // DATABASE DATA RECOVERY PIPELINE
  // ==========================================
  const fetchTreatmentPlans = async () => {
    try {
      // Performed single-pass relationship join picking up live target appointments
      const { data, error } = await supabase
        .from("treatment_plans")
        .select(
          `
          *,
          patients (*)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setTreatments(
          data.map((plan) => {
            const firstName = String((plan.patients as Record<string, unknown>)?.first_name ?? "");
            const lastName = String((plan.patients as Record<string, unknown>)?.last_name ?? "");

            const dbLabStatus = (plan.lab_status || "none") as LabStatus;

            // Core Boolean flag handling visibility
            const isFollowUpNeeded = !!plan.follow_up_needed;

            const hasAppointment = false;
            const executionDate = "—";

            let derivedStage: ClinicalStage = "Active Treatment";
            if (plan.status === "completed") {
              derivedStage = "Concluded";
            } else if (
              dbLabStatus === "received_from_lab" ||
              dbLabStatus === "finalized" ||
              plan.status === "planned"
            ) {
              derivedStage = "Ready for Follow-up";
            } else {
              derivedStage = "Active Treatment";
            }

            const total = Number(plan.estimated_cost || 0);
            const paid = Number(plan.paid_amount || 0);

            return {
              id: plan.id,
              patientName: `${firstName} ${lastName}`.trim() || "Unknown Patient",
              patientId: plan.patient_id,
              treatment: plan.title,
              followUpNeeded: isFollowUpNeeded,
              hasAppointment,
              appointmentDate: executionDate,
              dbStatus: plan.status || "in_progress",
              clinicalStage: derivedStage,
              labStatus: dbLabStatus,
              totalAmount: total,
              paidAmount: paid,
              remainingBalance: Math.max(0, total - paid),
              status:
                plan.payment_status === "pending"
                  ? "Pending"
                  : plan.payment_status === "paid"
                    ? "Paid"
                    : "Partial",
              paymentMethod: "—",
              dueDate: plan.due_date || "—",
            };
          }),
        );
      }
    } catch (err) {
      console.error("Error loading treatment plans:", err);
      toast.error("Failed to sync structural treatment items from real-time database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatmentPlans();
  }, []);

  // Load patient selector directory options
  useEffect(() => {
    async function loadPatientOptions() {
      const { data, error } = await supabase.from("patients").select("*");
      if (data) {
        setPatientOptions(
          data.map((p: Record<string, unknown>) => ({
            id: String(p.id),
            name: `${p["first_name"] ?? ""} ${p["last_name"] ?? ""}`.trim(),
          })),
        );
      }
    }
    loadPatientOptions();
  }, []);

  // ==========================================
  // MEMOIZED SEARCH & METRICS MUTATORS
  // ==========================================
  const filteredPatientOptions = useMemo(() => {
    const query = patientSearchQuery.trim().toLowerCase();
    if (!query) return patientOptions.slice(0, 15);
    return patientOptions
      .filter((p) => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query))
      .slice(0, 15);
  }, [patientOptions, patientSearchQuery]);

  const operationsMetrics = useMemo(() => {
    return {
      activeCases: treatments.filter((t) => t.clinicalStage === "Active Treatment").length,
      awaitingLab: treatments.filter((t) => t.clinicalStage === "Lab Phase Pending").length,
      followUpNeeded: treatments.filter((t) => t.followUpNeeded).length,
    };
  }, [treatments]);

  const filteredTreatments = useMemo(() => {
    return treatments.filter((item) => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.treatment.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;

      if (activeFilter === "Active Cases") {
        if (item.dbStatus === "completed") {
          matchesFilter = false;
        } else {
          matchesFilter =
            item.labStatus === "none" ||
            item.labStatus === "impression_scheduled" ||
            item.labStatus === "sent_to_lab" ||
            item.labStatus === "received_from_lab" ||
            item.labStatus === "sent_for_improvement";
        }
      } else if (activeFilter === "Lab Phase") {
        matchesFilter =
          item.labStatus === "impression_scheduled" ||
          item.labStatus === "sent_to_lab" ||
          item.labStatus === "received_from_lab" ||
          item.labStatus === "sent_for_improvement";
      } else if (activeFilter === "Follow-Ups") {
        // Enforce restriction: only pull records where follow_up_needed is explicitly true
        matchesFilter = item.labStatus === "received_from_lab" || item.followUpNeeded === true;
      } else if (activeFilter === "Completed Cases") {
        matchesFilter = item.dbStatus === "completed";
      }

      return matchesSearch && matchesFilter;
    });
  }, [treatments, searchTerm, activeFilter]);

  // ==========================================
  // ACTION PIPELINES (MUTATIONS)
  // ==========================================
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error("Please select a valid patient profile.");
      return;
    }
    if (!invoiceForm.treatment || !invoiceForm.amount) {
      toast.error("Please specify both procedure layout and estimation value.");
      return;
    }

    const finalTreatment =
      invoiceForm.treatment === "Other" ? customTreatmentName : invoiceForm.treatment;
    const total = parseFloat(invoiceForm.amount) || 0;

    const { error } = await supabase.from("treatment_plans").insert({
      patient_id: selectedPatient.id,
      title: finalTreatment,
      description: invoiceForm.notes || null,
      status: "in_progress",
      start_date: new Date().toISOString().split("T")[0],
      estimated_cost: total,
      actual_cost: total,
      paid_amount: 0,
      due_date: invoiceForm.dueDate || null,
      payment_status: "pending",
      lab_status: "none",
      follow_up_needed: false,
    });

    if (error) {
      toast.error("Failed to append treatment track manifest.");
      return;
    }

    toast.success("Treatment operational instance created successfully.");

    setInvoiceForm({ patientName: "", treatment: "", amount: "", dueDate: "", notes: "" });
    setSelectedPatient(null);
    setPatientSearchQuery("");
    setCreateOpen(false);

    await fetchTreatmentPlans();
  };

  const handleUpdateLabStatus = async (id: string, newStatus: LabStatus) => {
    const updatePayload = {
      lab_status: newStatus,
      ...(newStatus === "finalized" ? { status: "completed" as const } : {}),
    };

    if (newStatus === "finalized") {
      updatePayload.status = "completed";
    }

    const { error } = await supabase.from("treatment_plans").update(updatePayload).eq("id", id);

    if (error) {
      console.error("Database update error:", error);
      toast.error("Failed to synchronize lab workflow selection.");
      return;
    }

    toast.success("Lab workflow status synchronized successfully.");
    await fetchTreatmentPlans();
  };

  const handleToggleFollowUpNeeded = async (id: string, needed: boolean) => {
    const { error } = await supabase
      .from("treatment_plans")
      .update({
        follow_up_needed: needed,
      })
      .eq("id", id);

    if (error) {
      console.error("Database update error:", error);
      toast.error("Failed to update follow up baseline flag.");
      return;
    }

    toast.success("Follow up queue target successfully matched.");
    await fetchTreatmentPlans();
  };

  return (
    <DashboardShell>
      <div className="space-y-5">
        {/* TOP MAIN HEADER PANEL */}
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

        {/* REAL-TIME METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-3xs min-h-[100px] flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Cases
            </span>
            <span className="text-2xl font-bold text-slate-800 mt-0.5 block">
              {operationsMetrics.activeCases} Patients
            </span>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-3xs flex items-center justify-between min-h-[100px]">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Awaiting Lab Workflows
              </span>
              <span className="text-2xl font-bold text-indigo-700 mt-0.5 block">
                {operationsMetrics.awaitingLab} Pipelines
              </span>
            </div>
            <FlaskConical className="h-5 w-5 text-indigo-400 shrink-0" />
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-3xs flex items-center justify-between min-h-[100px]">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Follow-Ups Queued
              </span>
              <span className="text-2xl font-bold text-amber-700 mt-0.5 block">
                {operationsMetrics.followUpNeeded} Outreach
              </span>
            </div>
            <CalendarDays className="h-5 w-5 text-amber-400 shrink-0" />
          </div>
        </div>

        {/* SEARCH AND FILTERS TOOLBAR */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3xs">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, case ID, or procedure..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition font-medium text-slate-900"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
            {(
              [
                { id: "All Cases", label: "All Cases" },
                { id: "Active Cases", label: "Active Cases" },
                { id: "Lab Phase", label: "Lab Phase" },
                { id: "Follow-Ups", label: "Follow-Ups" },
                { id: "Completed Cases", label: "Completed Cases" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition whitespace-nowrap ${
                  activeFilter === tab.id
                    ? "bg-white text-slate-900 shadow-3xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CASE TRACK ITEMS LIST ARCHITECTURE */}
        <div className="space-y-3.5">
          {isLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs font-semibold text-slate-400">
              Loading active treatment plans...
            </div>
          ) : filteredTreatments.length > 0 ? (
            filteredTreatments.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-3xs hover:border-slate-300 transition grid grid-cols-1 lg:grid-cols-12 gap-4 items-start relative overflow-hidden"
              >
                {/* Visual Accent State Bar Indicators */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    item.clinicalStage === "Lab Phase Pending"
                      ? "bg-indigo-600"
                      : item.clinicalStage === "Ready for Follow-up"
                        ? "bg-amber-500"
                        : "bg-teal-600"
                  }`}
                />

                {/* ZONE 1: CLINICAL TREATMENT PROFILE */}
                <div className="md:col-span-4 pl-1.5 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-extrabold text-slate-900">
                      {item.patientName}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
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
                  <p className="text-xs font-semibold text-slate-500 truncate max-w-xs">
                    {item.treatment}
                  </p>
                </div>

                {/* ZONE 2: DROP-DOWN LAB STATUS CONTROLLER */}
                <div className="md:col-span-3 space-y-1">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Lab Workflow Status
                  </span>
                  <Select
                    value={item.labStatus}
                    onValueChange={(val: LabStatus) => handleUpdateLabStatus(item.id, val)}
                  >
                    <SelectTrigger className="h-8 text-xs font-medium bg-slate-50 border-slate-200 focus:ring-teal-500/20 w-full">
                      <SelectValue placeholder="No Lab Work" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeFilter !== "Completed Cases" && (
                        <SelectItem value="none">No Lab Work Needed</SelectItem>
                      )}

                      <SelectItem value="impression_scheduled">Impression Scheduled</SelectItem>
                      <SelectItem value="sent_to_lab">Sent to Lab</SelectItem>
                      <SelectItem value="received_from_lab">Received from Lab</SelectItem>
                      <SelectItem value="finalized">Finalized Case</SelectItem>
                      <SelectItem value="sent_for_improvement">Sent for Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ZONE 3: CONDITIONAL FOLLOW-UP WORKFLOW PANEL (Visible ONLY inside Follow-Ups View) */}
                <div className="md:col-span-3 space-y-1">
                  {activeFilter === "Follow-Ups" ? (
                    <>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Follow-Up Status
                      </span>
                      <div className="text-xs space-y-0.5">
                        <Select value={item.hasAppointment ? "scheduled" : "needed"}>
                          <SelectTrigger className="h-8 w-full min-w-[190px] text-xs">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="needed">Appointment Needed</SelectItem>

                            <SelectItem value="scheduled">Appointment Scheduled</SelectItem>
                          </SelectContent>
                        </Select>
                        {item.hasAppointment && (
                          <div className="text-[10px] text-slate-500">
                            Scheduled On: {item.appointmentDate}
                          </div>
                        )}
                        {item.hasAppointment && (
                          <div className="text-[10px] font-medium text-slate-500">
                            Scheduled On:{" "}
                            <span className="text-slate-700 font-semibold">
                              {item.appointmentDate}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {String(activeFilter) === "Follow-Ups" && (
                        <>
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Quick Action Queue
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleToggleFollowUpNeeded(item.id, !item.followUpNeeded)
                            }
                            className={`h-7 text-[10px] font-bold uppercase tracking-wider w-full ${
                              item.followUpNeeded
                                ? "border-rose-200 bg-rose-50/40 text-rose-700 hover:bg-rose-100"
                                : "border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {item.followUpNeeded ? "Remove From Follow-Ups" : "Flag For Follow-Up"}
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* ZONE 4: FINANCES OUTSTANDING */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 text-left text-xs">
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Total Cost
                    </span>
                    <span className="font-bold text-slate-800">${item.totalAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Arrears
                    </span>
                    <span
                      className={`font-black ${item.remainingBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}
                    >
                      {item.remainingBalance > 0 ? `$${item.remainingBalance.toFixed(2)}` : "Paid"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-md mx-auto space-y-2 shadow-3xs">
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
          MODAL OVERLAY: INITIALIZE CASES
         ========================================== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Initialize Treatment Case Manifest
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generate an upfront treatment itemization ledger record before collecting processing
              funds.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4 pt-2 text-xs">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-slate-700">Patient Link</Label>
              <Input
                value={patientSearchQuery}
                onChange={(e) => {
                  setPatientSearchQuery(e.target.value);
                  setShowPatientDropdown(true);
                }}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Type patient name to look up profile..."
                className="h-10 text-xs"
              />

              {showPatientDropdown && patientSearchQuery.trim() && (
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-lg divide-y divide-slate-50">
                  {filteredPatientOptions.length > 0 ? (
                    filteredPatientOptions.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 font-medium text-slate-700"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setPatientSearchQuery(patient.name);
                          setShowPatientDropdown(false);
                          setInvoiceForm({ ...invoiceForm, patientName: patient.name });
                        }}
                      >
                        {patient.name} ({patient.id})
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-400 italic">
                      No matching patient records
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-slate-700" htmlFor="treatment">
                Target Procedure
              </Label>
              <Select
                value={invoiceForm.treatment}
                onValueChange={(val) => setInvoiceForm({ ...invoiceForm, treatment: val })}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Choose a clinic procedure Layout..." />
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
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              {invoiceForm.treatment === "Other" && (
                <Input
                  placeholder="Type custom clinical procedure definition..."
                  value={customTreatmentName}
                  onChange={(e) => setCustomTreatmentName(e.target.value)}
                  className="h-10 text-xs mt-1.5"
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold text-slate-700" htmlFor="amount">
                  Total Treatment Valuation Base ($)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold text-slate-700" htmlFor="dueDate">
                  Remittance Clearance Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white h-9 text-xs font-bold"
              >
                Initialize Treatment File
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
