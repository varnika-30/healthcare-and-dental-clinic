import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  User,
  MapPin,
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
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  History,
  Users,
  Search,
  ExternalLink,
  DollarSign,
  FileDown,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  RefreshCw,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// TANSTACK ROUTE DEFINITION
// ==========================================
export const Route = createFileRoute("/_authenticated/admin/patient-details/$patientId")({
  component: AdminPatientDetailsPage,
});

// ==========================================
// INTERFACES & SCALABLE MASTER STRUCTURES
// ==========================================
interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

interface PersonalDetails {
  fullName: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  occupation: string;
  bloodGroup: string;
  address: Address;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  medicalProfile: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    notes: string;
  };
}

interface AppointmentRecord {
  id: string;
  date: string; // ISO format string: YYYY-MM-DD
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
  status: "In Progress" | "Completed";
  hasXray?: boolean;
}

interface PrescriptionRecord {
  id: string;
  date: string;
  associatedTreatment: string;
  medicines: string[];
  dosageInstructions: string;
  followUpRecommendation: string;
}

interface BillingLogRecord {
  id: string;
  date: string; // Billing post date
  paymentDate: string; // Explicit date of processing payment
  description: string;
  amountBilled: number;
  amountPaid: number;
  status: "PAID" | "PARTIAL" | "OVERDUE";
}

interface NoteRecord {
  id: string;
  date: string;
  author: string;
  text: string;
}

interface FamilyMember {
  id: string;
  fullName: string;
  relation: string;
  phone: string;
  isEmergencyLink: boolean;
}

interface ReferralNetwork {
  referredBy: { name: string; id?: string } | null;
  referredPatients: Array<{ name: string; id: string }>;
}

interface CompletePatientState {
  id: string;
  profile: PersonalDetails;
  appointments: AppointmentRecord[];
  treatments: TreatmentRecord[];
  prescriptions: PrescriptionRecord[];
  billingLogs: BillingLogRecord[];
  notes: NoteRecord[];
  family: FamilyMember[];
  referrals: ReferralNetwork;
}

// ==========================================
// CENTRALIZED INITIAL DATA REPOSITORY
// ==========================================
const MOCK_PATIENT_ECOSYSTEM: Record<string, CompletePatientState> = {
  "P-8832": {
    id: "P-8832",
    profile: {
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
      emergencyContact: { name: "Thomas Vance", relation: "Spouse", phone: "(555) 901-4433" },

      medicalProfile: {
        allergies: ["Penicillin", "Latex"],
        medications: ["Multivitamin Daily"],
        conditions: ["Mitral Valve Prolapse (Mild)"],
        notes: "Requires sensitivity monitoring during procedures.",
      },
    },
    appointments: [
      {
        id: "A-5521",
        date: "2026-05-26",
        time: "09:00 AM",
        provider: "Dr. Aisha Rahman",
        type: "Composite Follow-up",
        status: "Upcoming",
      },
      {
        id: "A-5490",
        date: "2026-05-20",
        time: "11:15 AM",
        provider: "Dr. Aisha Rahman",
        type: "Diagnostic Evaluation",
        status: "Completed",
      },
      {
        id: "A-5310",
        date: "2026-05-12",
        time: "02:30 PM",
        provider: "Dr. Aisha Rahman",
        type: "Periodontal Maintenance",
        status: "Completed",
      },
    ],
    treatments: [
      {
        id: "TX-901",
        date: "May 20, 2026",
        toothNumber: "#14, #15",
        procedure: "Composite Filling (2 Surfaces)",
        notes: "Deep decay isolated. Clean margins achieved. Patient tolerated anesthesia well.",
        status: "In Progress",
        hasXray: true,
      },
    ],
    prescriptions: [
      {
        id: "RX-402",
        date: "May 20, 2026",
        associatedTreatment: "Composite Filling (#14, #15)",
        medicines: ["Ibuprofen 400mg"],
        dosageInstructions: "Take 1 tablet every 4-6 hours post-op as needed for mild soreness.",
        followUpRecommendation: "Routine hygiene recall in 6 months.",
      },
    ],
    billingLogs: [
      {
        id: "TXN-902",
        date: "2026-05-20",
        paymentDate: "2026-05-20",
        description: "Composite Filling (#14, #15)",
        amountBilled: 350.0,
        amountPaid: 350.0,
        status: "PAID",
      },
      {
        id: "TXN-845",
        date: "2026-04-11",
        paymentDate: "2026-04-11",
        description: "Endodontic Pulpotomy (Emergency)",
        amountBilled: 800.0,
        amountPaid: 400.0,
        status: "PARTIAL",
      },
    ],
    notes: [
      {
        id: "N-101",
        date: "May 20, 2026",
        author: "Dr. Aisha Rahman",
        text: "Patient reports slight dental anxiety. Prefers topical numbing gel applied longer.",
      },
    ],
    family: [
      {
        id: "P-1102",
        fullName: "Thomas Vance",
        relation: "Spouse",
        phone: "(555) 901-4433",
        isEmergencyLink: true,
      },
      {
        id: "P-4591",
        fullName: "Lily Vance",
        relation: "Child",
        phone: "(555) 432-1098",
        isEmergencyLink: false,
      },
    ],
    referrals: {
      referredBy: { name: "Dr. Marcus Sterling", id: "REF-039" },
      referredPatients: [{ name: "Julianne Moore", id: "P-7721" }],
    },
  },
};

export default function AdminPatientDetailsPage() {
  const { patientId } = Route.useParams();

  // Unified Centralized Master Source of Truth
  const initialData = MOCK_PATIENT_ECOSYSTEM[patientId] || MOCK_PATIENT_ECOSYSTEM["P-8832"];
  const [patientData, setPatientData] = useState<CompletePatientState>(initialData);

  // UI Control Configurations
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isAddingLedger, setIsAddingLedger] = useState(false);
  const [isAddingTreatment, setIsAddingTreatment] = useState(false);
  const [isBillingExpanded, setIsBillingExpanded] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);

  // Form Inputs State Management
  const [ledgerForm, setLedgerForm] = useState({
    description: "",
    amountBilled: "",
    amountPaid: "",
    paymentDate: new Date().toISOString().split("T")[0], // Standard default runtime stamp
  });

  const [treatmentForm, setTreatmentForm] = useState({
    toothNumber: "",
    procedure: "",
    notes: "",
  });

  // Local state copy for high-fidelity profile form edits
  const [editableProfile, setEditableProfile] = useState<PersonalDetails>({
    ...patientData.profile,
  });

  // Comma-separated medical string states for editing
  const [editableMedicalStrings, setEditableMedicalStrings] = useState({
    allergies: patientData.profile.medicalProfile.allergies.join(", "),
    medications: patientData.profile.medicalProfile.medications.join(", "),
    conditions: patientData.profile.medicalProfile.conditions.join(", "),
  });

  // Central Derived Balances calculations engine
  const totalBilled = patientData.billingLogs.reduce((sum, log) => sum + log.amountBilled, 0);
  const totalPaid = patientData.billingLogs.reduce((sum, log) => sum + log.amountPaid, 0);
  const outstandingDue = totalBilled - totalPaid;

  // Mini-Calendar Days Alignment
  const calendarDays = Array.from({ length: 31 }, (_, index) => {
    const day = index + 1;

    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    return {
      dayName: dayNames[index % 7],
      dayNum: String(day),
      dateStr: `2026-05-${String(day).padStart(2, "0")}`,
    };
  });

  // ==========================================
  // DISPATCHERS & STATE WRITERS
  // ==========================================
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setPatientData((prev) => ({
      ...prev,
      profile: {
        ...editableProfile,
        medicalProfile: {
          allergies: editableMedicalStrings.allergies
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
          medications: editableMedicalStrings.medications
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
          conditions: editableMedicalStrings.conditions
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
          notes: editableProfile.medicalProfile.notes,
        },
      },
    }));
    setIsProfileEditing(false);
  };

  const handleAddLedgerEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const billed = parseFloat(ledgerForm.amountBilled) || 0;
    const paid = parseFloat(ledgerForm.amountPaid) || 0;
    if (!ledgerForm.description || billed <= 0) return;

    // Strict Deterministic Auto-Status Allocation Rules
    let calculatedStatus: "PAID" | "PARTIAL" | "OVERDUE" = "OVERDUE";
    if (billed - paid === 0) {
      calculatedStatus = "PAID";
    } else if (paid > 0 && paid < billed) {
      calculatedStatus = "PARTIAL";
    }

    const newEntry: BillingLogRecord = {
      id: `TXN-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split("T")[0],
      paymentDate: ledgerForm.paymentDate,
      description: ledgerForm.description,
      amountBilled: billed,
      amountPaid: paid,
      status: calculatedStatus,
    };

    setPatientData((prev) => ({
      ...prev,
      billingLogs: [newEntry, ...prev.billingLogs],
    }));

    setLedgerForm({
      description: "",
      amountBilled: "",
      amountPaid: "",
      paymentDate: new Date().toISOString().split("T")[0],
    });
    setIsAddingLedger(false);
  };

  const handleAddTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatmentForm.procedure || !treatmentForm.toothNumber) return;

    const newTx: TreatmentRecord = {
      id: `TX-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      toothNumber: treatmentForm.toothNumber,
      procedure: treatmentForm.procedure,
      notes: treatmentForm.notes,
      status: "In Progress",
    };

    setPatientData((prev) => ({
      ...prev,
      treatments: [newTx, ...prev.treatments],
    }));

    setTreatmentForm({ toothNumber: "", procedure: "", notes: "" });
    setIsAddingTreatment(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans flex flex-col">
      {/* STANDARD NAVIGATION HEADER */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/patients"
            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">
              Lumident Patient Desk
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-bold text-slate-500 border border-slate-200">
              {patientData.id}
            </span>
          </div>
        </div>
      </header>

      {/* ==========================================
          REFINED PREMIUM IDENTITY HEADER BANNER
         ========================================== */}
      <div className="sticky top-14 z-20 bg-white border-b border-slate-200 shadow-xs px-4 sm:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 shadow-sm flex items-center justify-center text-white text-lg font-bold tracking-wider">
            {patientData.profile.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {patientData.profile.fullName}
            </h2>
            <div className="text-xs text-slate-500 font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                {patientData.profile.age} Yrs • {patientData.profile.gender}
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> {patientData.profile.phone}
              </span>
              <span>•</span>
              <span className="text-slate-400 font-mono truncate">{patientData.profile.email}</span>
            </div>
          </div>
        </div>

        {/* METRICS VIEWPORTS GRID */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 bg-slate-50 p-3 rounded-xl border border-slate-200/60 min-w-full md:min-w-[420px]">
          <div className="px-1">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
              Total Gross Billed
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-800">
              ${totalBilled.toFixed(2)}
            </span>
          </div>
          <div className="px-1 border-l border-slate-200">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
              Cleared Credits
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-600">
              ${totalPaid.toFixed(2)}
            </span>
          </div>
          <div
            className={`px-2 py-1 rounded-lg border -my-1 ${outstandingDue > 0 ? "bg-rose-50/80 border-rose-100" : "bg-emerald-50/80 border-emerald-100"}`}
          >
            <span
              className={`text-[9px] font-extrabold uppercase tracking-wider block ${outstandingDue > 0 ? "text-rose-500" : "text-emerald-500"}`}
            >
              {outstandingDue > 0 ? "Balance Liability" : "Settled Asset"}
            </span>
            <span
              className={`text-sm sm:text-base font-black ${outstandingDue > 0 ? "text-rose-700" : "text-emerald-700"}`}
            >
              ${outstandingDue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE CONTENT GRID CONTAINER */}
      <div className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto space-y-6">
        {/* ==========================================
            EDITABLE PATIENT PROFILE MATRIX SECTION
           ========================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" /> Patient Profile Matrix & Ecosystem Records
            </h3>
            {!isProfileEditing ? (
              <button
                type="button"
                onClick={() => {
                  setEditableProfile({ ...patientData.profile });
                  setEditableMedicalStrings({
                    allergies: patientData.profile.medicalProfile.allergies.join(", "),
                    medications: patientData.profile.medicalProfile.medications.join(", "),
                    conditions: patientData.profile.medicalProfile.conditions.join(", "),
                  });
                  setIsProfileEditing(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/60 px-3 py-1.5 rounded-lg transition"
              >
                <Edit2 className="w-3.5 h-3.5" /> Modify Chart Parameters
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileEditing(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="inline-flex items-center gap-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-lg transition shadow-3xs"
                >
                  <Check className="w-3.5 h-3.5" /> Commit Modifications
                </button>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6">
            {isProfileEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Legal Name</label>
                    <input
                      type="text"
                      value={editableProfile.fullName}
                      onChange={(e) =>
                        setEditableProfile({ ...editableProfile, fullName: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Age Mapping</label>
                    <input
                      type="number"
                      value={editableProfile.age}
                      onChange={(e) =>
                        setEditableProfile({
                          ...editableProfile,
                          age: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Gender Expression</label>
                    <input
                      type="text"
                      value={editableProfile.gender}
                      onChange={(e) =>
                        setEditableProfile({ ...editableProfile, gender: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Blood Registry</label>
                    <input
                      type="text"
                      value={editableProfile.bloodGroup}
                      onChange={(e) =>
                        setEditableProfile({ ...editableProfile, bloodGroup: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-teal-700 bg-teal-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Phone Line</label>
                    <input
                      type="text"
                      value={editableProfile.phone}
                      onChange={(e) =>
                        setEditableProfile({ ...editableProfile, phone: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-bold mb-1">Secure Email</label>
                    <input
                      type="email"
                      value={editableProfile.email}
                      onChange={(e) =>
                        setEditableProfile({ ...editableProfile, email: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg font-semibold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Demographic Anchor Bounds
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Street Address"
                        value={editableProfile.address.street}
                        onChange={(e) =>
                          setEditableProfile({
                            ...editableProfile,
                            address: { ...editableProfile.address, street: e.target.value },
                          })
                        }
                        className="w-full p-2 bg-white border border-slate-200 rounded-md font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="City"
                        value={editableProfile.address.city}
                        onChange={(e) =>
                          setEditableProfile({
                            ...editableProfile,
                            address: { ...editableProfile.address, city: e.target.value },
                          })
                        }
                        className="w-full p-2 bg-white border border-slate-200 rounded-md font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Zip Code"
                        value={editableProfile.address.zipCode}
                        onChange={(e) =>
                          setEditableProfile({
                            ...editableProfile,
                            address: { ...editableProfile.address, zipCode: e.target.value },
                          })
                        }
                        className="w-full p-2 bg-white border border-slate-200 rounded-md font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Editable Section */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Emergency Contact Details
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                        Name
                      </label>
                      <input
                        type="text"
                        placeholder="Contact name"
                        value={editableProfile.emergencyContact.name}
                        onChange={(e) =>
                          setEditableProfile({
                            ...editableProfile,
                            emergencyContact: {
                              ...editableProfile.emergencyContact,
                              name: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 bg-white border border-slate-200 rounded-md font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                        Relation
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Spouse, Parent"
                        value={editableProfile.emergencyContact.relation}
                        onChange={(e) =>
                          setEditableProfile({
                            ...editableProfile,
                            emergencyContact: {
                              ...editableProfile.emergencyContact,
                              relation: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 bg-white border border-slate-200 rounded-md font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                        Phone
                      </label>
                      <input
                        type="text"
                        placeholder="(555) 000-0000"
                        value={editableProfile.emergencyContact.phone}
                        onChange={(e) =>
                          setEditableProfile({
                            ...editableProfile,
                            emergencyContact: {
                              ...editableProfile.emergencyContact,
                              phone: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 bg-white border border-slate-200 rounded-md font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical History Editable Section */}
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">
                    Medical History & Risk Disclosures
                  </span>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                        Allergies (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Penicillin, Latex"
                        value={editableMedicalStrings.allergies}
                        onChange={(e) =>
                          setEditableMedicalStrings({
                            ...editableMedicalStrings,
                            allergies: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-white border border-rose-200 rounded-md font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                        Medications (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Multivitamin Daily, Aspirin"
                        value={editableMedicalStrings.medications}
                        onChange={(e) =>
                          setEditableMedicalStrings({
                            ...editableMedicalStrings,
                            medications: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-white border border-rose-200 rounded-md font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                        Conditions (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mitral Valve Prolapse, Diabetes"
                        value={editableMedicalStrings.conditions}
                        onChange={(e) =>
                          setEditableMedicalStrings({
                            ...editableMedicalStrings,
                            conditions: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-white border border-rose-200 rounded-md font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                        Clinical Notes
                      </label>
                      <textarea
                        placeholder="Additional clinical notes and observations..."
                        value={editableProfile.medicalProfile.notes}
                        onChange={(e) =>
                          setEditableProfile({
                            ...editableProfile,
                            medicalProfile: {
                              ...editableProfile.medicalProfile,
                              notes: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 bg-white border border-rose-200 rounded-md font-medium"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      Legal Full Name
                    </span>
                    <span className="font-bold text-slate-800 mt-1 block">
                      {patientData.profile.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      Email Identity
                    </span>
                    <span className="font-semibold text-slate-700 mt-1 block truncate">
                      {patientData.profile.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      Occupation Sector
                    </span>
                    <span className="font-medium text-slate-700 mt-1 block">
                      {patientData.profile.occupation}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      Blood Matrix Type
                    </span>
                    <span className="font-mono font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded text-xs w-max mt-1 block">
                      {patientData.profile.bloodGroup}
                    </span>
                  </div>
                </div>
                <div className="text-xs border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    Residential Boundary Reference
                  </span>
                  <p className="font-semibold text-slate-800">
                    {patientData.profile.address.street}, {patientData.profile.address.city},{" "}
                    {patientData.profile.address.state} {patientData.profile.address.zipCode}
                  </p>
                </div>
              </div>
            )}

            {/* INTEGRATED FAMILY CONNECTIONS FOOTER ROW */}
            <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> Linked Family Networks
                </span>
                <div className="space-y-1">
                  {patientData.family.map((f) => (
                    <div
                      key={f.id}
                      className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-200 text-[11px]"
                    >
                      <span className="font-bold text-slate-800">
                        {f.fullName}{" "}
                        <span className="font-normal text-slate-400">({f.relation})</span>
                      </span>
                      {f.isEmergencyLink && (
                        <span className="bg-rose-50 text-rose-600 font-bold px-1 rounded text-[9px] border border-rose-100">
                          Kin
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl text-xs flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Referral Origin Channel
                </span>
                <p className="font-bold text-slate-800 text-[11px]">
                  {patientData.referrals.referredBy?.name || "Direct Organic Entry Walk-in"}
                </p>
              </div>
              <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl text-xs flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Generated Outbound Charts
                </span>
                <p className="font-medium text-slate-600 text-[11px]">
                  {patientData.referrals.referredPatients.length} external matches tracked.
                </p>
              </div>
            </div>

            {/* EMERGENCY CONTACT & MEDICAL HISTORY ROW */}
            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 mt-6">
              {/* Emergency Contact */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-bold mb-3">
                  Emergency Contact
                </p>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-800">
                    {patientData.profile.emergencyContact.name}
                  </h4>

                  <p className="text-sm text-slate-500">
                    {patientData.profile.emergencyContact.relation}
                  </p>

                  <p className="text-sm font-semibold text-teal-600">
                    {patientData.profile.emergencyContact.phone}
                  </p>
                </div>
              </div>

              {/* Medical History */}
              <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
                <p className="text-[10px] uppercase tracking-wide text-rose-400 font-bold mb-3">
                  Medical History & Risk Disclosures
                </p>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-slate-700">Allergies:</span>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {patientData.profile.medicalProfile.allergies.map((item) => (
                        <span
                          key={item}
                          className="px-2 py-1 rounded-full bg-rose-100 text-rose-600 text-xs font-bold"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700">Medications:</span>

                    <p className="text-slate-500 mt-1">
                      {patientData.profile.medicalProfile.medications.join(", ")}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700">Conditions:</span>

                    <p className="text-slate-500 mt-1">
                      {patientData.profile.medicalProfile.conditions.join(", ")}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700">Clinical Notes:</span>

                    <p className="text-slate-500 mt-1">
                      {patientData.profile.medicalProfile.notes}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            REFINED OPERATIONAL ACCOUNTING LEDGER
           ========================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-xs overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" /> Operational Ledger & Billing Files
            </h3>
            <button
              onClick={() => setIsAddingLedger(!isAddingLedger)}
              className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Ledger Entry
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* UPDATED DATED LEDGER DISPATCH INPUT SUB-SYSTEM */}
            <AnimatePresence>
              {isAddingLedger && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddLedgerEntry}
                  className="border border-emerald-100 bg-emerald-50/10 rounded-xl p-4 text-xs space-y-4 shadow-inner"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                    <div className="sm:col-span-2 md:col-span-1">
                      <label className="block text-slate-500 font-bold mb-1">
                        Treatment/Procedure Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Crown Restoration"
                        value={ledgerForm.description}
                        onChange={(e) =>
                          setLedgerForm({ ...ledgerForm, description: e.target.value })
                        }
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none font-semibold text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">
                        Total Billed Amount ($)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={ledgerForm.amountBilled}
                        onChange={(e) =>
                          setLedgerForm({ ...ledgerForm, amountBilled: e.target.value })
                        }
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">
                        Amount Paid Right Now ($)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={ledgerForm.amountPaid}
                        onChange={(e) =>
                          setLedgerForm({ ...ledgerForm, amountPaid: e.target.value })
                        }
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      {/* DATE OF PAYMENT ADDITION */}
                      <label className="block text-slate-500 font-bold mb-1">
                        Date of Payment Processing
                      </label>
                      <input
                        type="date"
                        value={ledgerForm.paymentDate}
                        onChange={(e) =>
                          setLedgerForm({ ...ledgerForm, paymentDate: e.target.value })
                        }
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none font-semibold text-slate-700"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingLedger(false)}
                      className="px-3 py-1.5 font-bold text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-3xs"
                    >
                      Post Transaction Record
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* TRANSACTIONS RENDER SYSTEM */}
            <div className="space-y-2">
              {(isBillingExpanded
                ? patientData.billingLogs
                : patientData.billingLogs.slice(0, 2)
              ).map((log) => {
                const itemDue = log.amountBilled - log.amountPaid;
                return (
                  <div
                    key={log.id}
                    className="p-3.5 border border-slate-150 bg-slate-50/40 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400">
                        $
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{log.description}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Post Ref: {log.id} • Transacted:{" "}
                          <span className="text-slate-600 font-semibold">{log.paymentDate}</span> •
                          Total Billed: ${log.amountBilled}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-auto sm:ml-0">
                      <div className="text-right">
                        <span className="text-slate-500 font-medium block">
                          Paid: ${log.amountPaid}
                        </span>
                        <span className="font-mono font-bold text-slate-800 text-[11px] block mt-0.5">
                          ${itemDue.toFixed(2)} remaining
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-black text-[9px] border ${
                          log.status === "PAID"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : log.status === "PARTIAL"
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : "bg-rose-50 border-rose-200 text-rose-700"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {patientData.billingLogs.length > 2 && (
              <button
                type="button"
                onClick={() => setIsBillingExpanded(!isBillingExpanded)}
                className="w-full inline-flex items-center justify-center gap-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
              >
                {isBillingExpanded
                  ? "Collapse Activity Shell"
                  : `View Historical Operations (${patientData.billingLogs.length} Records)`}
              </button>
            )}
          </div>
        </div>

        {/* ==========================================
            CLINIC LAYOUT RESPONSTRUCT BLOCK (2-COLUMN GRID)
           ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TREATMENT CARD RECORD MODULE */}
          <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-cyan-500 shadow-xs flex flex-col justify-between overflow-hidden">
            <div>
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-600" /> Treatment Tracking & Diagnostics
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingTreatment(!isAddingTreatment)}
                  className="text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1.5 rounded-md transition"
                >
                  {isAddingTreatment ? "Hide Input" : "Chart Treatment Line"}
                </button>
              </div>

              <div className="p-4 space-y-3">
                <AnimatePresence>
                  {isAddingTreatment && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleAddTreatment}
                      className="border border-cyan-100 bg-cyan-50/10 rounded-xl p-3.5 text-xs space-y-3"
                    >
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-slate-400 font-bold mb-0.5">
                            Tooth Code
                          </label>
                          <input
                            type="text"
                            placeholder="#14"
                            value={treatmentForm.toothNumber}
                            onChange={(e) =>
                              setTreatmentForm({ ...treatmentForm, toothNumber: e.target.value })
                            }
                            className="w-full p-2 border border-slate-200 rounded"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-slate-400 font-bold mb-0.5">Procedure</label>
                          <input
                            type="text"
                            placeholder="Resin Matrix Insertion"
                            value={treatmentForm.procedure}
                            onChange={(e) =>
                              setTreatmentForm({ ...treatmentForm, procedure: e.target.value })
                            }
                            className="w-full p-2 border border-slate-200 rounded"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-0.5">
                          Operational Tracking Notes
                        </label>
                        <textarea
                          rows={2}
                          value={treatmentForm.notes}
                          onChange={(e) =>
                            setTreatmentForm({ ...treatmentForm, notes: e.target.value })
                          }
                          className="w-full p-2 border border-slate-200 rounded"
                          placeholder="Isolation vectors applied..."
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="submit"
                          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-3 py-1 rounded"
                        >
                          Chart
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  {patientData.treatments.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1.5 text-xs"
                    >
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-cyan-800 font-bold">
                          Tooth Map: {tx.toothNumber}
                        </span>
                        <span className="text-slate-400 font-medium">{tx.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-900">{tx.procedure}</h4>
                      {tx.notes && (
                        <p className="text-slate-500 font-medium leading-relaxed bg-white p-2 rounded border border-slate-200/60">
                          {tx.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================
              SIMPLIFIED CLINIC APPOINTMENT SCHEDULER MATRIX
             ========================================== */}
          <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-rose-200 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" /> Operational Scheduler Matrix Grid
                </h3>
              </div>

              <div className="p-4 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  Interactive Active Calendar Road-Track
                </span>

                {/* INTERACTIVE CALENDAR MINI-GRID */}
                <div className="grid grid-cols-7 auto-rows-[64px] gap-2 bg-white p-2 rounded-2xl border border-slate-100">
                  {calendarDays.map((day, i) => {
                    const matchedAppt = patientData.appointments.find(
                      (a) => a.date === day.dateStr,
                    );

                    const isCurrentSelection = day.dayNum === "28";

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (matchedAppt) setSelectedAppointment(matchedAppt);
                        }}
                        className={`rounded-xl border p-1 text-left transition relative h-full
                        
                        ${
                          isCurrentSelection
                            ? "bg-rose-50 border-slate-200 text-rose-500 shadow-sm"
                            : matchedAppt
                              ? "bg-white hover:bg-slate-50 border-slate-100 text-slate-700"
                              : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"
                        }
                      `}
                      >
                        <div className="flex h-full flex-col items-start justify-between">
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider opacity-70">
                              {day.dayName}
                            </span>

                            <span className="mt-0.5 block text-sm font-black">{day.dayNum}</span>
                          </div>

                          {matchedAppt && (
                            <div className="flex gap-1">
                              <div className="h-2 w-2 rounded-full bg-rose-400" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 font-medium">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    Click highlighted active operational indicators inside the grid stepper tracker
                    array to instantly unlock isolated micro-file drawer previews.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INDEPENDENT PREMIUM INTERACTIVE MODAL POPOVER DISPATCH AREA */}
      <AnimatePresence>
        {selectedAppointment && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAppointment(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden text-xs"
            >
              <div className="p-3 bg-rose-50/60 border-b border-rose-100 flex justify-between items-center">
                {" "}
                <div>
                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider block">
                    Operational Manifest
                  </span>
                  <h4 className="font-black text-indigo-950 text-sm">{selectedAppointment.type}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 space-y-3 font-medium text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Target Window:</span>
                  <span className="font-bold text-slate-800">
                    {selectedAppointment.time} ({selectedAppointment.date})
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Assigned Staff:</span>
                  <span className="font-bold text-indigo-700">{selectedAppointment.provider}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Tracking ID:</span>
                  <span className="font-mono text-slate-400">{selectedAppointment.id}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span>Routing Status:</span>
                  <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    {selectedAppointment.status}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const nextDate = prompt(
                      "Input micro-reschedule date parameter (YYYY-MM-DD):",
                      selectedAppointment.date,
                    );
                    if (nextDate) {
                      setPatientData((prev) => ({
                        ...prev,
                        appointments: prev.appointments.map((a) =>
                          a.id === selectedAppointment.id ? { ...a, date: nextDate } : a,
                        ),
                      }));
                      setSelectedAppointment(null);
                    }
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition text-center"
                >
                  Quick Reschedule Operational Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
