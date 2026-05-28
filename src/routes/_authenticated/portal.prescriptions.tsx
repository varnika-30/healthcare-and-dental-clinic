import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  HeartPulse,
  Activity,
} from "lucide-react";
import { getPatientPrescriptions, PrescriptionRecord } from "@/lib/prescription-store";

// ==========================================
// TANSTACK ROUTE DEFINITION
// ==========================================
export const Route = createFileRoute("/_authenticated/portal/prescriptions")({
  component: PatientPrescriptionsPage,
});

const PATIENT_ID = "P-8832";

export default function PatientPrescriptionsPage() {
  const prescriptions = getPatientPrescriptions(PATIENT_ID);
  const activeRx = prescriptions.find((rx) => rx.status === "Active");
  const historyRx = prescriptions.filter((rx) => rx.status !== "Active");
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

  const triggerAction = (type: "Download" | "Print", rx: PrescriptionRecord) => {
    if (type === "Print") {
      const html = `
        <html>
          <head>
            <title>Prescription ${rx.id}</title>
            <style>
              body { font-family: Inter, system-ui, sans-serif; padding: 28px; color: #111827; }
              h1 { font-size: 22px; margin-bottom: 16px; }
              .section { margin-bottom: 14px; }
              .title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 6px; }
            </style>
          </head>
          <body>
            <h1>Prescription ${rx.id}</h1>
            <div class="section"><div class="title">Treatment</div><div>${rx.linkedTreatment}</div></div>
            <div class="section"><div class="title">Issued</div><div>${formatDate(rx.issueDate)}</div></div>
            <div class="section"><div class="title">Medicines</div>${rx.medicines
              .map(
                (med) =>
                  `<div><strong>${med.name} ${med.strength}</strong><div>${med.dosage}</div><div>${med.frequency}</div><div>${med.duration}</div></div>`,
              )
              .join("")}</div>
            <div class="section"><div class="title">Instructions</div><div>${rx.dosageInstructions}</div></div>
          </body>
        </html>
      `;
      const printWindow = window.open("", "_blank", "noopener,noreferrer");
      if (!printWindow) {
        alert("Please allow popups to print the prescription.");
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      return;
    }

    const fileContent =
      `Prescription ${rx.id}\nTreatment: ${rx.linkedTreatment}\nIssued: ${formatDate(rx.issueDate)}\n\n` +
      rx.medicines
        .map(
          (med) => `${med.name} ${med.strength} — ${med.dosage}, ${med.frequency}, ${med.duration}`,
        )
        .join("\n") +
      `\n\nInstructions: ${rx.dosageInstructions}`;
    const blob = new Blob([fileContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${rx.id}-prescription.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadgeStyles = (status: PrescriptionRecord["status"]) => {
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
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                        {med.name}{" "}
                        <span className="font-medium text-slate-500 text-sm">{med.strength}</span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm font-medium text-slate-600">
                        <span className="text-slate-900 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          {med.dosage}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-800 font-medium">{med.frequency}</span>
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

            <div className="space-y-1.5 border-t border-slate-100 pt-5">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">
                Patient Directed Care Instructions
              </span>
              <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/40 p-3 rounded-xl border border-slate-100">
                {activeRx.dosageInstructions}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 border border-emerald-100/70 px-2.5 py-1 rounded-md self-start">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Clinical Record • Read-only Patient Portal</span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => triggerAction("Download", activeRx)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition shadow-3xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => triggerAction("Print", activeRx)}
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

                {isCurrentExpanded && (
                  <div className="p-5 bg-slate-50/30 space-y-5 animate-fadeIn text-xs border-t border-slate-100/40">
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
                                <span className="text-slate-500 italic">{med.frequency}</span>
                              </p>
                            </div>
                            <span className="text-slate-500 font-semibold text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200/50 self-start sm:self-auto">
                              Course: {med.duration}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block">
                        Historical Instructions
                      </span>
                      <p className="text-slate-600 font-medium pl-0.5 leading-relaxed bg-white border border-slate-150 p-3 rounded-lg">
                        {rx.dosageInstructions}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400 font-mono">Record Reference ID: {rx.id}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => triggerAction("Download", rx)}
                          className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded transition shadow-3xs"
                        >
                          <Download className="w-3 h-3 text-slate-400" /> Download
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerAction("Print", rx)}
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
