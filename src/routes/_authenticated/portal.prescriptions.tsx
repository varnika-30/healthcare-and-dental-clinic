import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Pill,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  HeartPulse,
  User,
  Activity,
} from "lucide-react";

// ==========================================
// TANSTACK ROUTE DEFINITION
// ==========================================
export const Route = createFileRoute("/_authenticated/portal/prescriptions")({
  component: PatientPrescriptionsPage,
});

// ==========================================
// SUPABASE-READY DATA ARCHITECTURE
// ==========================================
interface Medication {
  name: string;
  strength: string;
  dosage: string;
  timing: string;
  duration: string;
}

interface Prescription {
  id: string;
  clinicName: string;
  prescribingDoctor: string;
  licenseNumber: string;
  issueDate: string; // YYYY-MM-DD
  linkedTreatment: string;
  status: "Active" | "Completed" | "Expired";
  instructions: string;
  medicines: Medication[];
}

// ==========================================
// REALISTIC CLINICAL MOCK DATA
// ==========================================
const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: "RX-2026-9042",
    clinicName: "Lumident Dental Group",
    prescribingDoctor: "Dr. Aisha Rahman",
    licenseNumber: "DN-88431",
    issueDate: "2026-05-26",
    linkedTreatment: "Root Canal Treatment (Tooth #14)",
    status: "Active",
    instructions:
      "Take the antibiotic consistently until the course is fully finished. Use the Ibuprofen only if you experience lingering soreness or discomfort.",
    medicines: [
      {
        name: "Amoxicillin",
        strength: "500mg",
        dosage: "1 capsule",
        timing: "3 times daily (every 8 hours)",
        duration: "5 days",
      },
      {
        name: "Ibuprofen",
        strength: "400mg",
        dosage: "1 tablet",
        timing: "2 times daily (after meals)",
        duration: "3 days",
      },
    ],
  },
  {
    id: "RX-2026-7719",
    clinicName: "Lumident Dental Group",
    prescribingDoctor: "Dr. Aisha Rahman",
    licenseNumber: "DN-88431",
    issueDate: "2026-04-12",
    linkedTreatment: "Tooth Extraction (Tooth #32)",
    status: "Completed",
    instructions:
      "Avoid drinking through a straw for the first 48 hours. Gently rinse with warm salt water starting the day after surgery.",
    medicines: [
      {
        name: "Chlorhexidine Oral Rinse",
        strength: "0.12%",
        dosage: "15ml (half an ounce)",
        timing: "2 times daily (after brushing)",
        duration: "7 days",
      },
      {
        name: "Acetaminophen",
        strength: "500mg",
        dosage: "1-2 tablets",
        timing: "Every 6 hours as needed",
        duration: "4 days",
      },
    ],
  },
  {
    id: "RX-2025-1044",
    clinicName: "Lumident Dental Group",
    prescribingDoctor: "Dr. Aisha Rahman",
    licenseNumber: "DN-88431",
    issueDate: "2025-11-12",
    linkedTreatment: "Deep Cleaning & Scaling",
    status: "Expired",
    instructions:
      "Swish thoroughly for 30 seconds, then spit out. Do not eat or drink anything for 30 minutes after rinsing.",
    medicines: [
      {
        name: "Chlorhexidine Oral Rinse",
        strength: "0.12%",
        dosage: "15ml",
        timing: "2 times daily (morning and night)",
        duration: "14 days",
      },
    ],
  },
];

export default function PatientPrescriptionsPage() {
  const activeRx = MOCK_PRESCRIPTIONS.find((rx) => rx.status === "Active");
  const historyRx = MOCK_PRESCRIPTIONS.filter((rx) => rx.status !== "Active");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const triggerAction = (type: "Download" | "Print", rxId: string, rxTitle: string) => {
    alert(`${type}ing prescription for "${rxTitle}" (${rxId})...`);
  };

  const getStatusBadgeStyles = (status: Prescription["status"]) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "Completed":
        return "bg-sky-50 text-sky-700 border-sky-200/60";
      case "Expired":
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="max-w-[780px] mx-auto px-4 py-8 space-y-10">
      {/* ==========================================
          TOP SECTION: CURRENT ACTIVE PRESCRIPTION
         ========================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Current
            Prescription
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wide">
            Active Treatment Plan
          </span>
        </div>

        {activeRx ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-3xs overflow-hidden relative p-6 sm:p-8 space-y-8">
            {/* PROMINENT CLINIC HEADER BRANDING */}
            <div className="text-center space-y-1.5 border-b border-slate-100 pb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-teal-50 text-teal-600 border border-teal-100/80 mb-1">
                <Activity className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
                {activeRx.clinicName}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
                Private Dental Care & Oral Therapeutics
              </p>
            </div>

            {/* DE-EMPHASIZED SECONDARY METADATA BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[11px] text-slate-500 bg-slate-50/60 px-4 py-3 rounded-xl border border-slate-100 font-medium">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider">
                  Practitioner
                </span>
                <span className="text-slate-700 font-semibold">{activeRx.prescribingDoctor}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider">
                  Issued Date
                </span>
                <span className="text-slate-700 font-semibold">
                  {formatDate(activeRx.issueDate)}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider">
                  Treatment Reference
                </span>
                <span className="text-slate-700">{activeRx.linkedTreatment}</span>
              </div>
            </div>

            {/* DOMINANT MEDICINES SECTION (Handwritten Sheet Style) */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-slate-200 pb-1">
                <span className="text-xs font-bold text-slate-400 font-mono tracking-wider uppercase block">
                  Rx Directive
                </span>
              </div>

              <div className="space-y-6">
                {activeRx.medicines.map((med, index) => (
                  <div key={index} className="group relative flex items-start gap-4 pb-2">
                    <div className="w-2 h-2 rounded-full bg-teal-600/30 mt-2 shrink-0 group-hover:bg-teal-600 transition" />
                    <div className="space-y-1.5 flex-1">
                      {/* Large, Clear Medicine Heading */}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                        {med.name}{" "}
                        <span className="font-medium text-slate-500 text-sm">{med.strength}</span>
                      </h3>
                      {/* Clear, Readable Dosage Instructions Row */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm font-medium text-slate-600">
                        <span className="text-slate-900 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          {med.dosage}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-800 font-medium">{med.timing}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-teal-700 font-semibold">
                          Dispense for {med.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CLINICAL DIRECTIONS BOX */}
            <div className="space-y-1.5 border-t border-slate-100 pt-5">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">
                Patient Directed Care Instructions
              </span>
              <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/40 p-3 rounded-xl border border-slate-100">
                {activeRx.instructions}
              </p>
            </div>

            {/* FOOTER VERIFICATION AND ACTIONS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 border border-emerald-100/70 px-2.5 py-1 rounded-md self-start">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Clinical Record • Refalls Authored: 0</span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => triggerAction("Download", activeRx.id, activeRx.linkedTreatment)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition shadow-3xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => triggerAction("Print", activeRx.id, activeRx.linkedTreatment)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition shadow-3xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" /> Print
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500 font-medium">
            You do not have any active prescription plans at the moment.
          </div>
        )}
      </div>

      {/* ==========================================
          BOTTOM SECTION: PREVIOUS HISTORY LOG
         ========================================== */}
      <div className="space-y-4 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-slate-400" /> Previous Prescriptions History
        </h2>

        <div className="space-y-2.5">
          {historyRx.map((rx) => {
            const isCurrentExpanded = expandedId === rx.id;
            const summaryString = rx.medicines.map((m) => m.name).join(", ");

            return (
              <div
                key={rx.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs transition hover:border-slate-300"
              >
                {/* Accordion Row Trigger Header */}
                <button
                  type="button"
                  onClick={() => toggleAccordion(rx.id)}
                  className={`w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 transition select-none ${
                    isCurrentExpanded ? "bg-slate-50/50 border-b border-slate-100" : ""
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800 tracking-tight truncate">
                        {rx.linkedTreatment}
                      </h3>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border tracking-wide uppercase ${getStatusBadgeStyles(rx.status)}`}
                      >
                        {rx.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-medium truncate max-w-xl">
                      <span className="font-semibold text-slate-500">Meds:</span> {summaryString}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 pt-0.5">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      <span>Issued {formatDate(rx.issueDate)}</span>
                      <span>•</span>
                      <span>{rx.prescribingDoctor}</span>
                    </div>
                  </div>

                  <div className="p-1 rounded-md border border-slate-200 bg-white text-slate-400 shrink-0">
                    {isCurrentExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </button>

                {/* Inline Expandable Body Block */}
                {isCurrentExpanded && (
                  <div className="p-5 bg-slate-50/30 space-y-5 animate-fadeIn text-xs border-t border-slate-100/40">
                    {/* Medicines Stack */}
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block">
                        Medication Details
                      </span>
                      <div className="bg-white border border-slate-150 rounded-xl divide-y divide-slate-100 overflow-hidden">
                        {rx.medicines.map((med, idx) => (
                          <div
                            key={idx}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-700"
                          >
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-slate-900">
                                {med.name}{" "}
                                <span className="font-medium text-slate-500 text-xs">
                                  ({med.strength})
                                </span>
                              </h4>
                              <p className="text-slate-600 font-medium">
                                {med.dosage} —{" "}
                                <span className="text-slate-500 italic">{med.timing}</span>
                              </p>
                            </div>
                            <span className="text-slate-500 font-semibold text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200/50 self-start sm:self-auto">
                              Course: {med.duration}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Historical Directions */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block">
                        Historical Instructions
                      </span>
                      <p className="text-slate-600 font-medium pl-0.5 leading-relaxed bg-white border border-slate-150 p-3 rounded-lg">
                        {rx.instructions}
                      </p>
                    </div>

                    {/* Inline Print/PDF Actions */}
                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400 font-mono">Record Reference ID: {rx.id}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => triggerAction("Download", rx.id, rx.linkedTreatment)}
                          className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded transition shadow-3xs"
                        >
                          <Download className="w-3 h-3 text-slate-400" /> Download
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerAction("Print", rx.id, rx.linkedTreatment)}
                          className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded transition shadow-3xs"
                        >
                          <Printer className="w-3 h-3 text-slate-400" /> Print
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* COMPLIANCE DISCLOSURE FOOTER */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-500 leading-relaxed font-medium">
        <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          This dashboard shows digital records of clinical prescriptions logged within your chart
          hub. If you require direct faxing or processing out to an external pharmacy partner,
          contact the front office desk.
        </p>
      </div>
    </div>
  );
}
