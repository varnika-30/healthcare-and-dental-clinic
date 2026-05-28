import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  Search,
  Download,
  Eye,
  FileCheck,
  Image as ImageIcon,
  Receipt,
  Filter,
  X,
  SlidersHorizontal,
  Calendar,
  User,
  ExternalLink,
} from "lucide-react";

// ==========================================
// TANSTACK ROUTE DEFINITION
// ==========================================
export const Route = createFileRoute("/_authenticated/portal/documents")({
  component: DocumentsPage,
});

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface DentalDocument {
  id: string;
  title: string;
  category: "prescription" | "report" | "x-ray" | "invoice";
  fileName: string;
  fileSize: string;
  uploadDate: string;
  doctorName?: string;
  description: string;
}

// ==========================================
// MOCK DATA
// ==========================================
const INITIAL_DOCUMENTS: DentalDocument[] = [
  {
    id: "doc-1",
    title: "Post-Operative Care Antibiotics",
    category: "prescription",
    fileName: "prescription_2026_05_20.pdf",
    fileSize: "142 KB",
    uploadDate: "May 20, 2026",
    doctorName: "Dr. Aisha Rahman",
    description:
      "Amoxicillin course instructions and recovery guidelines following root canal therapy.",
  },
  {
    id: "doc-2",
    title: "Full Panoramic Mandibular X-Ray",
    category: "x-ray",
    fileName: "panoramic_hd_xray.jpg",
    fileSize: "4.2 MB",
    uploadDate: "May 12, 2026",
    doctorName: "Dr. Sara Kim",
    description:
      "High-resolution digital panoramic scan profiling bone structure and wisdom teeth placement.",
  },
  {
    id: "doc-3",
    title: "Periodontal Screening Assessment",
    category: "report",
    fileName: "gum_health_assessment.pdf",
    fileSize: "890 KB",
    uploadDate: "Apr 15, 2026",
    doctorName: "Dr. Aisha Rahman",
    description:
      "Comprehensive 6-month tracking report examining pocket depths and tissue attachment levels.",
  },
  {
    id: "doc-4",
    title: "Aligner Check-in Treatment Bill",
    category: "invoice",
    fileName: "invoice_inv_9982.pdf",
    fileSize: "95 KB",
    uploadDate: "Mar 28, 2026",
    description: "Itemized billing statement for clear aligner tracking phase 2 adjustments.",
  },
];

export default function DocumentsPage() {
  // ==========================================
  // COMPONENT STATE HOOKS
  // ==========================================
  const [documents, setDocuments] = useState<DentalDocument[]>(INITIAL_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "all" | "prescription" | "report" | "x-ray" | "invoice"
  >("all");
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<DentalDocument | null>(null);

  // ==========================================
  // FILTERING LOGIC
  // ==========================================
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.doctorName && doc.doctorName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = activeCategory === "all" || doc.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // ==========================================
  // DESIGN VISUAL CONFIGURATION HELPERS
  // ==========================================
  const getCategoryConfig = (category: DentalDocument["category"]) => {
    switch (category) {
      case "prescription":
        return {
          icon: FileText,
          text: "Prescription",
          color: "bg-teal-50 text-teal-700 ring-teal-600/10",
        };
      case "report":
        return {
          icon: FileCheck,
          text: "Clinical Report",
          color: "bg-cyan-50 text-cyan-700 ring-cyan-600/10",
        };
      case "x-ray":
        return {
          icon: ImageIcon,
          text: "Diagnostic X-Ray",
          color: "bg-indigo-50 text-indigo-700 ring-indigo-600/10",
        };
      case "invoice":
        return {
          icon: Receipt,
          text: "Invoice / Bill",
          color: "bg-amber-50 text-amber-700 ring-amber-600/10",
        };
    }
  };

  // ==========================================
  // ACTION SIMULATORS
  // ==========================================
  const handleDownload = (doc: DentalDocument) => {
    alert(`Downloading target payload file: ${doc.fileName}`);
  };

  return (
    <div className="-mt-6 min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans antialiased text-slate-900">
      <div className="mx-auto max-w-5xl space-y-8 px-8 pb-8 pt-0">
        {/* ==========================================
            MODERN DASHBOARD HEADER
           ========================================== */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/10">
              <FileCheck className="h-3.5 w-3.5" />
              Patient Records Vault
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Documents & Clinical Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Access your historical dental blueprints, imaging records, pharmaceutical scripts, and
              itemized billing statements.
            </p>
          </div>
        </div>

        {/* ==========================================
            SEARCH BAR & CATEGORY TABS CONTROLS
           ========================================== */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Responsive Category Scroller */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-2 md:border-none md:pb-0">
            {(
              [
                { id: "all", label: "All Records" },
                { id: "prescription", label: "Prescriptions" },
                { id: "report", label: "Reports" },
                { id: "x-ray", label: "X-Rays & Imaging" },
                { id: "invoice", label: "Invoices" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150 ${
                  activeCategory === tab.id
                    ? "bg-teal-600 text-white shadow-sm shadow-teal-600/10"
                    : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Search Tool */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* ==========================================
            DOCUMENTS FEED ARCHITECTURE LAYOUT
           ========================================== */}
        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocuments.map((doc) => {
              const config = getCategoryConfig(doc.category);
              const CardIcon = config.icon;

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4 group relative"
                >
                  <div className="space-y-3">
                    {/* Upper Badge & Info Strip */}
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${config.color}`}
                      >
                        <CardIcon className="h-3.5 w-3.5" />
                        {config.text}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 whitespace-nowrap">
                        <Calendar className="h-3 w-3" />
                        {doc.uploadDate}
                      </span>
                    </div>

                    {/* Metadata Header Segment */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-800 tracking-tight group-hover:text-teal-700 transition">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {doc.fileName} · <span className="font-sans">{doc.fileSize}</span>
                      </p>
                    </div>

                    {/* Description Core Content Box */}
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {doc.description}
                    </p>
                  </div>

                  {/* Footing Context Control Strip */}
                  <div className="pt-3 border-t border-slate-50 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      {doc.doctorName ? (
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 truncate">
                          <User className="h-3 w-3 text-teal-600" />
                          {doc.doctorName}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic">
                          Lumident Admin Record
                        </span>
                      )}
                    </div>

                    {/* Operational Actions Interactive Utilities */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setSelectedPreviewDoc(doc)}
                        title="Preview Document file"
                        className="p-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-100 transition shadow-inner"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        title="Download raw asset file link"
                        className="p-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition shadow-sm"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ==========================================
              PREMIUM PATIENT HEALTHCARE EMPTY STATE
             ========================================== */
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center backdrop-blur-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 ring-4 ring-teal-50/50">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 tracking-tight">
              No document files located
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              We couldn't track any active medical history records or billing logs mapping to your
              active structural filter targets.
            </p>
            <button
              onClick={() => {
                setActiveCategory("all");
                setSearchQuery("");
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 transition"
            >
              Reset view criteria maps
            </button>
          </div>
        )}

        {/* ==========================================
            SANDBOX DOCUMENT INTERACTIVE IN-LINE MODAL MODULAR PREVIEW
           ========================================== */}
        {selectedPreviewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative">
              {/* Dismiss Box Target */}
              <button
                onClick={() => setSelectedPreviewDoc(null)}
                className="absolute top-5 right-5 p-1.5 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getCategoryConfig(selectedPreviewDoc.category).color}`}
                >
                  {getCategoryConfig(selectedPreviewDoc.category).text}
                </span>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight pr-6">
                  {selectedPreviewDoc.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedPreviewDoc.fileName} ({selectedPreviewDoc.fileSize})
                </p>
              </div>

              {/* Fake Micro Document Frame Canvas Triage Body Container */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center space-y-3 min-h-[180px] flex flex-col items-center justify-center">
                <FileText className="h-10 w-10 text-teal-600/60" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-700">
                    Digital Document Secured View
                  </div>
                  <div className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Full document contents encrypted under standard clinical health safety records
                    compliance matrices.
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <div>
                  <span className="font-bold text-slate-700">Record Entry Summary:</span>{" "}
                  {selectedPreviewDoc.description}
                </div>
                <div className="flex justify-between text-[11px] pt-1 text-slate-400 font-medium">
                  <span>Uploaded: {selectedPreviewDoc.uploadDate}</span>
                  {selectedPreviewDoc.doctorName && (
                    <span>Practitioner: {selectedPreviewDoc.doctorName}</span>
                  )}
                </div>
              </div>

              {/* Bottom Operational CTA Actions Control */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setSelectedPreviewDoc(null)}
                  className="rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    handleDownload(selectedPreviewDoc);
                    setSelectedPreviewDoc(null);
                  }}
                  className="rounded-xl bg-teal-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition inline-flex items-center justify-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download File
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
