import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  User,
  MapPin,
  Heart,
  ShieldAlert,
  Activity,
  Pill,
  Phone,
  Calendar,
  FileText,
  CreditCard,
  ClipboardList,
  FileSignature,
  Plus,
  Edit3,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// TANSTACK ROUTE DEFINITION
// ==========================================
export const Route = createFileRoute("/_authenticated/portal/profile")({
  component: AdminPatientDetailsPage,
});

// ==========================================
// TYPES & DATA STRUCTURES (Shared Master Schema)
// ==========================================
interface SharedPatientProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  occupation: string;
  bloodGroup: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  allergies: string[];
  medicalConditions: string[];
  currentMedications: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

interface AppointmentRecord {
  id: string;
  date: string;
  time: string;
  provider: string;
  type: string;
  status: "Upcoming" | "Completed" | "No Show";
}

interface TreatmentRecord {
  id: string;
  date: string;
  toothNumber: string;
  procedure: string;
  notes: string;
}

interface PrescriptionRecord {
  id: string;
  date: string;
  drugName: string;
  dosage: string;
  frequency: string;
}

// ==========================================
// MOCK DATA STORAGE (Simulating Patient Master Data)
// ==========================================
const MASTER_PATIENT_RECORDS: Record<string, SharedPatientProfile> = {
  "P-8832": {
    id: "P-8832",
    fullName: "Eleanor Vance",
    email: "eleanor.vance@gmail.com",
    phone: "(555) 432-1098",
    age: 28,
    gender: "Female",
    occupation: "Graphic Designer",
    bloodGroup: "O+",
    address: {
      street: "742 Evergreen Terrace",
      city: "Springfield",
      state: "IL",
      zipCode: "62704",
    },
    allergies: ["Penicillin", "Latex"],
    medicalConditions: ["Mitral Valve Prolapse (Mild)"],
    currentMedications: ["Multivitamin Daily"],
    emergencyContact: { name: "Thomas Vance", relationship: "Spouse", phone: "(555) 901-4433" },
  },
  "P-9831": {
    id: "P-9831",
    fullName: "Samuel Oakley",
    email: "samuel.oakley@outlook.com",
    phone: "(555) 234-5678",
    age: 42,
    gender: "Male",
    occupation: "Civil Engineer",
    bloodGroup: "A-",
    address: { street: "102 Baker Street", city: "London", state: "KY", zipCode: "40741" },
    allergies: ["Sulfa Drugs"],
    medicalConditions: ["Type 2 Diabetes (Controlled)"],
    currentMedications: ["Metformin 500mg"],
    emergencyContact: { name: "Martha Oakley", relationship: "Mother", phone: "(555) 234-5679" },
  },
};

const MOCK_ADMIN_EXTENSIONS = {
  appointments: [
    {
      id: "A-5521",
      date: "May 26, 2026",
      time: "09:00 AM",
      provider: "Dr. Aisha Rahman",
      type: "Composite Restoration Follow-up",
      status: "Upcoming",
    },
    {
      id: "A-5490",
      date: "May 20, 2026",
      time: "11:15 AM",
      provider: "Dr. Aisha Rahman",
      type: "X-Ray & Diagnostic Evaluation",
      status: "Completed",
    },
  ] as AppointmentRecord[],

  treatments: [
    {
      id: "TX-901",
      date: "May 20, 2026",
      toothNumber: "#14, #15",
      procedure: "Composite Filling (2 Surfaces)",
      notes: "Deep decay isolated. Clean margins achieved. Patient tolerated anesthesia well.",
    },
    {
      id: "TX-844",
      date: "Apr 11, 2026",
      toothNumber: "#14",
      procedure: "Endodontic Pulpotomy (Emergency)",
      notes:
        "Emergency pain management. Vital pulp therapy performed to mitigate acute localized pain indicators.",
    },
    {
      id: "TX-711",
      date: "Dec 14, 2025",
      toothNumber: "Full Mouth",
      procedure: "Comprehensive Periodontal Maintenance",
      notes:
        "Scaling & root planing completed. Bleeding on probing reduced from 24% to 8% overall.",
    },
    {
      id: "TX-502",
      date: "Jun 02, 2025",
      toothNumber: "#18",
      procedure: "Surgical Surgical Extraction",
      notes:
        "Impacted partial bony wisdom extraction. Clean separation, synthetic bone grafting pack inserted.",
    },
    {
      id: "TX-311",
      date: "Jan 18, 2025",
      toothNumber: "#3",
      procedure: "Porcelain-Fused-to-Metal Crown Placement",
      notes:
        "Permanent crown setting verification. Margin parameters checked, occlusion values look sound.",
    },
  ] as TreatmentRecord[],

  prescriptions: [
    {
      id: "RX-402",
      date: "May 20, 2026",
      drugName: "Amoxicillin",
      dosage: "500mg",
      frequency: "3x daily for 7 days",
    },
  ] as PrescriptionRecord[],

  billing: {
    totalBilled: 1840.0,
    totalPaid: 1660.0,
    balanceDue: 180.0,
  },
  initialAdminNotes:
    "Patient reports slight dental anxiety. Prefers topical numbing gel applied longer prior to local block injection.",
};

export default function AdminPatientDetailsPage() {
  const patient = MASTER_PATIENT_RECORDS["P-9831"];

  const profile = patient;

  const [adminNotes, setAdminNotes] = useState(MOCK_ADMIN_EXTENSIONS.initialAdminNotes);
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const INITIAL_VISIBLE_COUNT = 2;

  const visibleTreatments = isHistoryExpanded
    ? MOCK_ADMIN_EXTENSIONS.treatments
    : MOCK_ADMIN_EXTENSIONS.treatments.slice(0, INITIAL_VISIBLE_COUNT);

  const patientInitials = profile.fullName
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "PT";

  return (
    <div className="flex-1 pt-1 pb-8 px-4 sm:px-6 overflow-y-auto max-w-full w-full space-y-5">
      {/* ==========================================
          SECTION 1: RESTRUCTURED PATIENT IDENTITY CARD
         ========================================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 transition-all duration-200">
        <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-4 text-center sm:text-left w-full lg:w-auto">
          {/* Premium Avatar Badge */}
          <div className="w-16 h-16 rounded-full bg-white border-2 border-teal-600/20 shadow-xs flex items-center justify-center text-teal-700 font-bold text-xl tracking-wide shrink-0">
            {patientInitials}
          </div>
          <div className="space-y-1.5 min-w-0 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight break-words text-center sm:text-left">
                {profile.fullName}
              </h2>
              <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-md shrink-0">
                Active Patient
              </span>
            </div>
            <p className="text-sm text-slate-500 font-mono font-medium truncate">
              Patient ID Reference: #{profile.id || "LUM-89241"}
            </p>
          </div>
        </div>

        {/* Refactored Clean Scaling Meta Parameters */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:flex lg:items-center gap-4 sm:gap-6 lg:gap-8 text-sm border-t lg:border-t-0 pt-4 lg:pt-0 w-full lg:w-auto border-slate-100">
          <div className="text-center sm:text-left lg:text-right min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Registered Since
            </span>
            <span className="font-semibold text-slate-700 text-sm mt-0.5 block truncate">
              March 14, 2024
            </span>
          </div>

          <div className="w-px h-8 bg-slate-100 hidden lg:block shrink-0" />

          <div className="text-center sm:text-right min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Last Visit Verified
            </span>
            <span className="font-semibold text-slate-700 text-sm mt-0.5 block truncate">
              May 12, 2026
            </span>
          </div>
        </div>
      </div>

      {/* ==========================================
          SECTION 2: PERSONAL INFORMATION
         ========================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Personal Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
              First Name
            </span>
            <span className="font-semibold text-slate-800 text-base mt-0.5 block">
              {profile.fullName?.split(" ")[0] || "—"}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
              Last Name
            </span>
            <span className="font-semibold text-slate-800 text-base mt-0.5 block">
              {profile.fullName?.split(" ").slice(1).join(" ") || "—"}
            </span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
              Email Address
            </span>
            <span className="font-medium text-slate-700 text-base mt-0.5 block break-all">
              {profile.email}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
              Primary Phone Line
            </span>
            <span className="font-semibold text-slate-700 font-mono text-base mt-0.5 block">
              {profile.phone}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
              Date of Birth
            </span>
            <span className="font-semibold text-slate-700 font-mono text-base mt-0.5 block">
              November 14, 1991
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
              Age / Gender
            </span>
            <span className="font-medium text-slate-700 text-base mt-0.5 block">
              {profile.age} Years Old • {profile.gender}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
              Current Registered Occupation
            </span>
            <span className="font-medium text-slate-700 text-base mt-0.5 block">
              {profile.occupation || "Software Engineer"}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wide">Address</span>
          </div>
          <p className="text-base font-medium text-slate-600 leading-normal">
            {profile.address.street}, {profile.address.city}, {profile.address.state}{" "}
            {profile.address.zipCode}
          </p>
        </div>
      </div>

      {/* ==========================================
          SECTION 3: MEDICAL INFORMATION
         ========================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Heart className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Medical Information
          </h3>
        </div>

        <div className="space-y-4.5 text-sm">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Documented Allergies
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.allergies && profile.allergies.length > 0 ? (
                profile.allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-rose-50/50 border border-rose-200 text-rose-700 font-bold rounded-md text-xs tracking-wide"
                  >
                    {allergy}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 font-medium italic text-sm">
                  No known clinical allergies on file.
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-blue-500" /> Current Personal Medications
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.currentMedications && profile.currentMedications.length > 0 ? (
                profile.currentMedications.map((med, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-blue-50/50 border border-blue-200 text-blue-700 font-semibold rounded-md text-xs"
                  >
                    {med}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 font-medium italic text-sm">
                  No baseline standard medications logged.
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-600" /> Systemic Health Conditions
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.medicalConditions && profile.medicalConditions.length > 0 ? (
                profile.medicalConditions.map((condition, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-amber-50/50 border border-amber-200/80 text-amber-800 font-semibold rounded-md text-xs"
                  >
                    {condition}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 font-medium italic text-sm">
                  No active conditions registered.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          SECTION 4: EMERGENCY CONTACT
         ========================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Phone className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Emergency Contact
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm pt-1">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
              Contact Full Name
            </span>
            <span className="font-bold text-slate-800 text-base mt-0.5 block">
              {profile.emergencyContact.name}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
              Relationship Tie
            </span>
            <span className="font-medium text-slate-600 text-base mt-0.5 block">
              {profile.emergencyContact.relationship}
            </span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
              Contact Number
            </span>
            <span className="font-bold text-indigo-700 font-mono text-lg tracking-tight mt-0.5 block">
              {profile.emergencyContact.phone}
            </span>
          </div>
        </div>
      </div>

      {/* CALMING PRIVACY FOOTER BANNER */}
      <div className="text-center pt-3 text-xs font-medium text-slate-400/90 leading-relaxed max-w-xl mx-auto">
        This digital dossier contains verified credential parameters and protective medical
        information records. To request corrections or alter your safety disclosures, kindly
        interface directly with your Lumident clinical provider coordinator.
      </div>
    </div>
  );
}
