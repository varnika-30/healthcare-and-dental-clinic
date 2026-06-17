import React, { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  History,
  Users,
  Search,
  ExternalLink,
  DollarSign,
  FileDown,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  RefreshCw,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addPatientPrescription, getPatientPrescriptions } from "@/lib/prescription-store";
import {
  getPatientToothHistory,
  savePatientToothProcedure,
  updatePatientToothProcedure,
  ToothProcedureEntry,
  ToothTreatmentStatus,
} from "@/lib/tooth-treatment-store";
import { ToothChart } from "@/components/dashboard/ToothChart";
import { Card } from "@/components/ui/card";
import type { PrescriptionRecord } from "@/lib/prescription-store";
import { supabase } from "@/integrations/supabase/client";

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
  sex: string;
  secondaryPhone: string;
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
    familyHistory: string;
  };
}

interface AppointmentClinicalRecord {
  chiefComplaint: string;
  extraOralExamination: string;
  oralExamination: string;
  treatmentAdvised: string;
  clinicalNotes: string;
}

interface AppointmentRecord {
  id: string;
  date: string; // ISO format string: YYYY-MM-DD
  time: string;
  provider: string;
  type: string;
  status: "Upcoming" | "Completed" | "No Show";
  clinicalRecord?: AppointmentClinicalRecord;
  doctor_id?: string | null;
}

type TreatmentStage = string;

interface TreatmentStageDetail {
  name: string;
  status: "completed" | "active" | "upcoming";
}

const TREATMENT_STAGE_TEMPLATES: Record<string, string[]> = {
  "Root Canal": [
    "Consultation",
    "X-Ray",
    "Canal Cleaning",
    "Root Filling",
    "Crown Placement",
    "Completed",
  ],

  Implant: [
    "Consultation",
    "3D Scan",
    "Tooth Extraction",
    "Bone Grafting",
    "Implant Placement",
    "Healing Period",
    "Abutment Placement",
    "Crown Fixing",
    "Completed",
  ],

  Bridge: [
    "Consultation",
    "Tooth Preparation",
    "Impression Taking",
    "Temporary Bridge",
    "Permanent Bridge Fixing",
    "Bite Adjustment",
    "Completed",
  ],

  "Composite Filling": ["Consultation", "Decay Removal", "Filling", "Polishing", "Completed"],

  "Scaling & Cleaning": ["Consultation", "Scaling", "Deep Cleaning", "Gum Evaluation", "Completed"],

  Extraction: [
    "Consultation",
    "X-Ray",
    "Anesthesia",
    "Extraction",
    "Bleeding Control",
    "Recovery",
    "Completed",
  ],

  Braces: [
    "Consultation",
    "X-Ray & Scan",
    "Bracket Placement",
    "Wire Adjustment",
    "Monthly Tightening",
    "Retention",
    "Completed",
  ],
};

const DEFAULT_TREATMENT_STAGES = [
  "Consultation",
  "Cleaning",
  "Filling",
  "Root Canal",
  "Crown Placement",
  "Completed",
];

const normalizeForMatch = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const getStagesForProcedure = (procedure: string): string[] => {
  if (!procedure) return DEFAULT_TREATMENT_STAGES;
  const normalized = normalizeForMatch(procedure);
  const matchedKey = Object.keys(TREATMENT_STAGE_TEMPLATES).find((key) =>
    normalized.includes(normalizeForMatch(key)),
  );
  return (
    (matchedKey ? TREATMENT_STAGE_TEMPLATES[matchedKey] : DEFAULT_TREATMENT_STAGES) ||
    DEFAULT_TREATMENT_STAGES
  );
};

const formatDate = (d?: string | null) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    return d;
  }
};

interface TreatmentRecord {
  id: string;
  date: string;
  toothNumber: string;
  procedure: string;
  notes: string;
  status: "Pending" | "Ongoing" | "Paused" | "Completed";
  currentStage: TreatmentStage;
  stages?: TreatmentStageDetail[];
  hasXray?: boolean;
  startDate: string;
  completedDate?: string | null;
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
}

interface ReferralNetwork {
  referredBy: { name: string; id?: string } | null;
  referredPatients: Array<{ name: string; id: string }>;
  trackingNotes?: string;
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
      secondaryPhone: "(555) 432-1100",
      age: 28,
      gender: "Female",
      sex: "Female",
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
        familyHistory: "Mother has hypertension; father has type 2 diabetes.",
      },
    },
    appointments: [],
    treatments: [
      {
        id: "TX-901",
        date: "May 20, 2026",
        toothNumber: "#14, #15",
        procedure: "Composite Filling (2 Surfaces)",
        notes: "Deep decay isolated. Clean margins achieved. Patient tolerated anesthesia well.",
        status: "Ongoing",
        currentStage: "Filling",
        hasXray: true,
        startDate: "2026-05-18",
      },
    ],
    prescriptions: [
      {
        id: "RX-402",
        date: "2026-05-20",
        clinicName: "Lumident Dental Group",
        prescribingDoctor: "Dr. Aisha Rahman",
        licenseNumber: "DN-88431",
        issueDate: "2026-05-20",
        linkedTreatment: "Composite Filling (#14, #15)",
        associatedTreatment: "Composite Filling (#14, #15)",
        medicines: [
          {
            name: "Ibuprofen",
            strength: "400mg",
            dosage: "1 tablet",
            frequency: "Every 4-6 hours",
            duration: "3 days",
          },
        ],
        dosageInstructions: "Take 1 tablet every 4-6 hours post-op as needed for mild soreness.",
        followUpRecommendation: "Routine hygiene recall in 6 months.",
        status: "Active",
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
      },
      {
        id: "P-4591",
        fullName: "Lily Vance",
        relation: "Child",
      },
    ],
    referrals: {
      referredBy: { name: "Dr. Marcus Sterling", id: "REF-039" },
      referredPatients: [{ name: "Julianne Moore", id: "P-7721" }],
      trackingNotes: "Outbound chart created for coordinated referrals.",
    },
  },
};

interface DatabasePatient {
  id: string;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  dob: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  blood_group: string | null;
  allergies: string | null;
  medical_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

export default function AdminPatientDetailsPage() {
  const { patientId } = Route.useParams();

  const selectedPatient = MOCK_PATIENT_ECOSYSTEM[patientId] || MOCK_PATIENT_ECOSYSTEM["P-8832"];

  const initialData = {
    ...selectedPatient,
    prescriptions: getPatientPrescriptions(patientId || selectedPatient.id),
  };

  // Load initial data from localStorage if available, otherwise mock data
  const getInitialPatientData = () => {
    const defaultData = MOCK_PATIENT_ECOSYSTEM[patientId] || MOCK_PATIENT_ECOSYSTEM["P-8832"];
    const patientKey = `patient_ecosystem_${patientId || defaultData.id}`;
    const stored = typeof window !== "undefined" ? localStorage.getItem(patientKey) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure new profile fields are present for old localStorage data
        parsed.profile = {
          ...defaultData.profile,
          ...parsed.profile,
          sex: parsed.profile?.sex || parsed.profile?.gender || defaultData.profile.sex,
          secondaryPhone:
            parsed.profile?.secondaryPhone || defaultData.profile.secondaryPhone || "",
          medicalProfile: {
            ...defaultData.profile.medicalProfile,
            ...parsed.profile?.medicalProfile,
            familyHistory:
              parsed.profile?.medicalProfile?.familyHistory ||
              defaultData.profile.medicalProfile.familyHistory ||
              "",
          },
        };
        // Sync prescriptions from prescription-store
        parsed.prescriptions = getPatientPrescriptions(patientId || defaultData.id);
        return parsed;
      } catch (e) {
        console.error("Failed to parse stored patient data:", e);
      }
    }

    // Initialize stages for treatments if not present
    const initializedTreatments = defaultData.treatments.map((tx) => {
      const stagesList = getStagesForProcedure(tx.procedure);
      const stages =
        tx.stages ||
        stagesList.map((s, idx) => ({
          name: s,
          status:
            s === tx.currentStage
              ? ("active" as const)
              : stagesList.indexOf(s) < stagesList.indexOf(tx.currentStage)
                ? ("completed" as const)
                : ("upcoming" as const),
        }));
      return { ...tx, stages };
    });

    return {
      ...defaultData,
      treatments: initializedTreatments,
      prescriptions: getPatientPrescriptions(patientId || defaultData.id),
    };
  };

  const [patientData, setPatientData] = useState<CompletePatientState>(getInitialPatientData);

  // Auto-save to localStorage
  useEffect(() => {
    const patientKey = `patient_ecosystem_${patientData.id}`;
    localStorage.setItem(patientKey, JSON.stringify(patientData));
  }, [patientData]);

  // Load profile, medical history, emergency contact, and family links from Supabase
  useEffect(() => {
    async function loadDbData() {
      if (!patientId) return;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        patientId,
      );
      console.log("PATIENT ID FROM ROUTE:", patientId);
      console.log("IS UUID:", isUuid);

      let patientQuery = supabase.from("patients").select("*");
      if (isUuid) {
        patientQuery = patientQuery.eq("id", patientId);
      } else {
        patientQuery = patientQuery.limit(1);
      }

      const { data: dbPatients, error: patientError } = await (patientQuery as unknown as Promise<{
        data: DatabasePatient[] | null;
        error: Error | null;
      }>);
      console.log("DB PATIENTS:", dbPatients);
      console.log("PATIENT ERROR:", patientError);

      if (patientError) {
        console.error("Failed to load patient from database:", patientError);
        return;
      }

      const dbPatient = dbPatients?.[0];
      if (!dbPatient) return;

      // Calculate age from dob (YYYY-MM-DD)
      let calculatedAge = 28; // fallback
      if (dbPatient.dob) {
        const birthDate = new Date(dbPatient.dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        calculatedAge = age;
      }

      // Address parsing
      let parsedAddress = { street: "", city: "", state: "", zipCode: "" };
      if (dbPatient.address) {
        try {
          parsedAddress = JSON.parse(dbPatient.address);
        } catch {
          parsedAddress.street = dbPatient.address;
        }
      }

      // Fetch family links
      const { data: familyLinks, error: familyError } = await supabase
        .from("family_links")
        .select("*")
        .eq("patient_id", dbPatient.id);

      if (familyError) {
        console.error("Failed to load family links from database:", familyError);
      }

      const mappedFamily = familyLinks
        ? familyLinks.map((link) => ({
            id: link.id,
            fullName: link.related_name,
            relation: link.relationship || "",
          }))
        : [];

      // Fetch appointments
      const { data: dbAppointments, error: apptsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", dbPatient.id);

      if (apptsError) {
        console.error("Failed to load appointments from database:", apptsError);
      }

      // Fetch clinical records
      type ClinicalRecordRow = {
        id: string;
        appointment_id: string;
        chief_complaint: string | null;
        extra_oral_examination: string | null;
        oral_examination: string | null;
        treatment_advised: string | null;
        clinical_notes: string | null;
      };

      const dbClinicalRecords: ClinicalRecordRow[] = [];

      const mappedAppointments = dbAppointments
        ? dbAppointments.map((appt) => {
            const clinicalRec = dbClinicalRecords.find((r) => r.appointment_id === appt.id);
            const clinicalRecord = clinicalRec
              ? {
                  chiefComplaint: clinicalRec.chief_complaint || "",
                  extraOralExamination: clinicalRec.extra_oral_examination || "",
                  oralExamination: clinicalRec.oral_examination || "",
                  treatmentAdvised: clinicalRec.treatment_advised || "",
                  clinicalNotes: clinicalRec.clinical_notes || "",
                }
              : undefined;

            return {
              id: appt.id,
              date: appt.appointment_date ? appt.appointment_date.split("T")[0] : "",
              time: (() => {
                try {
                  const d = new Date(appt.appointment_date);
                  return isNaN(d.getTime())
                    ? ""
                    : d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                } catch {
                  return "";
                }
              })(),
              provider: "Assigned Provider",
              type: appt.service || "Routine Cleaning & Checkup",
              status:
                appt.status === "completed"
                  ? ("Completed" as const)
                  : appt.status === "no_show"
                    ? ("No Show" as const)
                    : ("Upcoming" as const),
              clinicalRecord,
              doctor_id: appt.doctor_id,
            };
          })
        : [];

      setPatientData((prev) => ({
        ...prev,
        id: dbPatient.id,
        appointments: mappedAppointments,
        profile: {
          ...prev.profile,
          fullName:
            `${dbPatient.first_name || ""} ${dbPatient.last_name || ""}`.trim() || "Unknown",
          email: dbPatient.email || "",
          phone: dbPatient.phone || "",
          age: calculatedAge,
          gender: dbPatient.gender || "",
          sex: dbPatient.gender || "",
          address: parsedAddress,
          emergencyContact: {
            name: dbPatient.emergency_contact_name || "",
            relation: prev.profile?.emergencyContact?.relation || "",
            phone: dbPatient.emergency_contact_phone || "",
          },
          medicalProfile: {
            ...prev.profile.medicalProfile,
            allergies: dbPatient.allergies
              ? dbPatient.allergies
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [],
            notes: dbPatient.medical_notes || "",
          },
        },
        family: mappedFamily,
      }));
    }

    loadDbData();
  }, [patientId]);

  // UI Control Configurations
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isAddingLedger, setIsAddingLedger] = useState(false);
  const [isAddingTreatment, setIsAddingTreatment] = useState(false);
  const [isBillingExpanded, setIsBillingExpanded] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);
  const [appointmentClinicalDraft, setAppointmentClinicalDraft] =
    useState<AppointmentClinicalRecord>({
      chiefComplaint: "",
      extraOralExamination: "",
      oralExamination: "",
      treatmentAdvised: "",
      clinicalNotes: "",
    });

  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed)
  const [currentYear, setCurrentYear] = useState(2026);
  const [isCreateApptModalOpen, setIsCreateApptModalOpen] = useState(false);
  const [createApptForm, setCreateApptForm] = useState({
    date: "",
    service: "Routine Cleaning & Checkup",
    doctor_id: "",
    notes: "",
  });
  const [doctorsList, setDoctorsList] = useState<{ id: string; full_name: string | null }[]>([]);

  useEffect(() => {
    async function fetchDoctors() {
      const { data, error } = await supabase.from("profiles").select("id, full_name");
      if (error) {
        console.error("Failed to fetch profiles:", error);
      } else if (data) {
        setDoctorsList(data);
      }
    }
    fetchDoctors();
  }, []);

  const doctorNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    doctorsList.forEach((d) => {
      if (d.id && d.full_name) {
        map[d.id] = d.full_name;
      }
    });
    return map;
  }, [doctorsList]);

  useEffect(() => {
    if (!selectedAppointment) {
      setAppointmentClinicalDraft({
        chiefComplaint: "",
        extraOralExamination: "",
        oralExamination: "",
        treatmentAdvised: "",
        clinicalNotes: "",
      });
      return;
    }

    setAppointmentClinicalDraft(
      selectedAppointment.clinicalRecord || {
        chiefComplaint: "",
        extraOralExamination: "",
        oralExamination: "",
        treatmentAdvised: "",
        clinicalNotes: "",
      },
    );
  }, [selectedAppointment]);

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
    customTreatmentName: "",
    customStages: ["Consultation", "Completed"],
  });

  const [prescriptionModal, setPrescriptionModal] = useState<"create" | "history" | null>(null);
  const [expandedPrescriptionId, setExpandedPrescriptionId] = useState<string | null>(null);
  const [isCreatingPrescription, setIsCreatingPrescription] = useState(false);
  const [prescriptionSuccessMessage, setPrescriptionSuccessMessage] = useState("");
  const [prescriptionErrorMessage, setPrescriptionErrorMessage] = useState("");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [editingProcedureId, setEditingProcedureId] = useState(null);
  const [selectedToothEntryId, setSelectedToothEntryId] = useState<string | null>(null);
  const [isToothModalOpen, setIsToothModalOpen] = useState(false);
  const [viewFullToothHistory, setViewFullToothHistory] = useState(false);
  const [toothHistory, setToothHistory] = useState<ToothProcedureEntry[]>(
    getPatientToothHistory(patientId || selectedPatient.id),
  );
  const [toothForm, setToothForm] = useState({
    toothNumber: "",
    procedure: "",
    status: "planned" as ToothTreatmentStatus,
    notes: "",
    linkedTreatment: initialData.treatments[0]?.procedure || "",
  });

  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedTooth) return;

    if (toothHistory.length > 0 && !isAddingNew) {
      const proc = toothHistory[0];

      setSelectedProcedureId(proc.id);
      setIsEditing(false);
      setIsAddingNew(false);

      setToothForm({
        toothNumber: String(proc.toothNumber),
        procedure: proc.procedure,
        status: proc.status,
        notes: proc.notes || "",
        linkedTreatment: proc.linkedTreatment || "",
      });
    } else if (toothHistory.length === 0) {
      setSelectedProcedureId(null);
      setIsAddingNew(true);
      setIsEditing(true);

      setToothForm({
        toothNumber: String(selectedTooth || ""),
        procedure: "",
        status: "planned",
        notes: "",
        linkedTreatment: "",
      });
    }
  }, [selectedTooth, toothHistory, isAddingNew]);

  const resetFormState = () => {
    setSelectedProcedureId(null);
    setIsEditing(false);
    setIsAddingNew(false);

    setToothForm({
      toothNumber: "",
      procedure: "",
      status: "planned",
      notes: "",
      linkedTreatment: "",
    });
  };

  const loadProcedureIntoForm = (proc: (typeof selectedToothHistory)[number]) => {
    setSelectedProcedureId(proc.id);
    setIsEditing(false);
    setIsAddingNew(false);

    setToothForm({
      toothNumber: String(proc.toothNumber),
      procedure: proc.procedure,
      status: proc.status,
      notes: proc.notes || "",
      linkedTreatment: proc.linkedTreatment || "",
    });
  };

  const handleInitiateAddNew = () => {
    setSelectedProcedureId(null);
    setIsAddingNew(true);
    setIsEditing(true);

    setToothForm({
      toothNumber: String(selectedTooth || ""),
      procedure: "",
      status: "planned",
      notes: "",
      linkedTreatment: "",
    });
  };

  const handleInitiateEdit = (proc: (typeof selectedToothHistory)[number]) => {
    loadProcedureIntoForm(proc);
    setIsEditing(true);
  };

  const [toothActionMessage, setToothActionMessage] = useState("");
  const [prescriptionRows, setPrescriptionRows] = useState([
    {
      name: "Ibuprofen",
      strength: "400mg",
      dosage: "1 tablet",
      frequency: "every 4-6 hours",
      duration: "3 days",
    },
  ]);
  const [prescriptionForm, setPrescriptionForm] = useState({
    associatedTreatment: initialData.treatments[0]?.procedure || "",
    dosageInstructions: "Take 1 tablet every 4-6 hours as needed.",
    followUpRecommendation: "Review patient symptoms during follow-up appointment.",
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

  const [isMedicalEditing, setIsMedicalEditing] = useState(false);

  const [isNetworkEditing, setIsNetworkEditing] = useState(false);
  const [editableNetwork, setEditableNetwork] = useState({
    family: patientData.family.map((member) => ({ ...member })),
    emergencyContact: { ...patientData.profile.emergencyContact },
    referralName: patientData.referrals.referredBy?.name || "",
    trackingNotes: patientData.referrals.trackingNotes || "",
  });

  // Synchronize edit states when patientData.profile changes
  useEffect(() => {
    if (!isProfileEditing && !isMedicalEditing) {
      setEditableProfile({
        ...patientData.profile,
      });
      setEditableMedicalStrings({
        allergies: patientData.profile.medicalProfile.allergies.join(", "),
        medications: patientData.profile.medicalProfile.medications.join(", "),
        conditions: patientData.profile.medicalProfile.conditions.join(", "),
      });
    }
  }, [patientData.profile, isProfileEditing, isMedicalEditing]);

  // Synchronize network edit states when family/emergencyContact changes
  useEffect(() => {
    if (!isNetworkEditing) {
      setEditableNetwork({
        family: patientData.family.map((member) => ({ ...member })),
        emergencyContact: { ...patientData.profile.emergencyContact },
        referralName: patientData.referrals.referredBy?.name || "",
        trackingNotes: patientData.referrals.trackingNotes || "",
      });
    }
  }, [
    patientData.family,
    patientData.profile.emergencyContact,
    patientData.referrals,
    isNetworkEditing,
  ]);

  const handleStartNetworkEditing = () => {
    setEditableNetwork({
      family: patientData.family.map((member) => ({ ...member })),
      emergencyContact: { ...patientData.profile.emergencyContact },
      referralName: patientData.referrals.referredBy?.name || "",
      trackingNotes: patientData.referrals.trackingNotes || "",
    });
    setIsNetworkEditing(true);
  };

  const handleSaveNetwork = async () => {
    console.log("SAVE NETWORK FIRED");
    // 1. Update emergency contact in database
    const patientPayload = {
      emergency_contact_name: editableNetwork.emergencyContact.name,
      emergency_contact_phone: editableNetwork.emergencyContact.phone,
    };

    const { error: patientError } = await supabase
      .from("patients")
      .update(patientPayload)
      .eq("id", patientData.id);

    if (patientError) {
      console.error("Failed to update emergency contact in database:", patientError);
    }

    // 2. Synchronize family links in database
    // Delete existing links
    const { error: deleteError } = await supabase
      .from("family_links")
      .delete()
      .eq("patient_id", patientData.id);

    if (deleteError) {
      console.error("Failed to delete existing family links:", deleteError);
    }

    // Insert new links
    if (editableNetwork.family.length > 0) {
      const inserts = editableNetwork.family
        .filter((member) => member.fullName.trim() !== "")
        .map((member) => {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            member.id,
          );
          return {
            id: isUuid ? member.id : undefined,
            patient_id: patientData.id,
            related_name: member.fullName,
            relationship: member.relation,
          };
        });

      if (inserts.length > 0) {
        const { error: insertError } = await supabase.from("family_links").insert(inserts);

        if (insertError) {
          console.error("Failed to insert family links:", insertError);
        }
      }
    }

    setPatientData((prev) => ({
      ...prev,
      family: editableNetwork.family.map((member) => ({ ...member })),
      profile: {
        ...prev.profile,
        emergencyContact: { ...editableNetwork.emergencyContact },
      },
      referrals: {
        ...prev.referrals,
        referredBy: editableNetwork.referralName
          ? { ...(prev.referrals.referredBy ?? {}), name: editableNetwork.referralName }
          : null,
        trackingNotes: editableNetwork.trackingNotes,
      },
    }));
    setIsNetworkEditing(false);
  };

  const handleCancelNetwork = () => {
    setIsNetworkEditing(false);
  };

  // Header collapse state for compacting hero on scroll
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const shouldCollapse = window.scrollY > 120;
      setIsHeaderCollapsed(shouldCollapse);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active tab state for section navigation (visual only)
  const [activeTab, setActiveTab] = useState<string>(
    typeof window !== "undefined" && window.location.hash ? window.location.hash : "#overview",
  );

  useEffect(() => {
    const onHashChange = () => setActiveTab(window.location.hash || "#overview");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleAddFamilyLink = () => {
    setEditableNetwork((prev) => ({
      ...prev,
      family: [
        ...prev.family,
        {
          id: crypto.randomUUID?.() ?? `family-${Date.now()}`,
          fullName: "",
          relation: "",
        },
      ],
    }));
  };

  const handleDeleteFamilyLink = (id: string) => {
    setEditableNetwork((prev) => ({
      ...prev,
      family: prev.family.filter((link) => link.id !== id),
    }));
  };

  // Central Derived Balances calculations engine
  const totalBilled = patientData.billingLogs.reduce((sum, log) => sum + log.amountBilled, 0);
  const totalPaid = patientData.billingLogs.reduce((sum, log) => sum + log.amountPaid, 0);
  const outstandingDue = totalBilled - totalPaid;
  const latestPrescription = patientData.prescriptions[0] ?? null;

  // Mini-Calendar Days Alignment
  const numDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarDays = Array.from({ length: numDays }, (_, index) => {
    const day = index + 1;
    const dateObj = new Date(currentYear, currentMonth, day);
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const dayName = dayNames[dateObj.getDay()];
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return {
      dayName,
      dayNum: String(day),
      dateStr,
    };
  });

  // ==========================================
  // DISPATCHERS & STATE WRITERS
  // ==========================================
  const handleSaveProfile = async (e: React.FormEvent) => {
    console.log("SAVE PROFILE FIRED");
    e.preventDefault();

    const [firstName, ...lastParts] = editableProfile.fullName.trim().split(" ");
    const lastName = lastParts.join(" ") || "";

    // Calculate dob based on edited age
    const today = new Date();
    const dobYear = today.getFullYear() - editableProfile.age;
    const dobStr = `${dobYear}-01-01`;

    const updatePayload = {
      first_name: firstName,
      last_name: lastName,
      email: editableProfile.email,
      phone: editableProfile.phone,
      gender: editableProfile.sex || editableProfile.gender,
      blood_group: editableProfile.bloodGroup,
      address: JSON.stringify(editableProfile.address),
      dob: dobStr,
    };

    const { error } = await supabase
      .from("patients")
      .update(updatePayload as never)
      .eq("id", patientData.id);

    if (error) {
      console.error("Failed to update profile in database:", error);
    }

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
          familyHistory: editableProfile.medicalProfile.familyHistory || "",
        },
      },
    }));
    setIsProfileEditing(false);
  };

  const handleSaveMedicalHistory = async () => {
    console.log("SAVE MEDICAL FIRED");
    const allergiesStr = editableMedicalStrings.allergies
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s)
      .join(", ");

    const updatePayload = {
      allergies: allergiesStr,
      medical_notes: editableProfile.medicalProfile.notes,
    };

    const { error } = await supabase
      .from("patients")
      .update(updatePayload)
      .eq("id", patientData.id);

    if (error) {
      console.error("Failed to update medical history in database:", error);
    }

    setPatientData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        emergencyContact: { ...editableProfile.emergencyContact },
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
          familyHistory: editableProfile.medicalProfile.familyHistory || "",
        },
      },
    }));
    setIsMedicalEditing(false);
  };

  const handleCancelMedicalHistory = () => {
    setEditableProfile({ ...patientData.profile });
    setEditableMedicalStrings({
      allergies: patientData.profile.medicalProfile.allergies.join(", "),
      medications: patientData.profile.medicalProfile.medications.join(", "),
      conditions: patientData.profile.medicalProfile.conditions.join(", "),
    });
    setIsMedicalEditing(false);
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
    console.log("Treatment Form:", treatmentForm);
    if (!treatmentForm.procedure || !treatmentForm.toothNumber) return;

    const isCustomTreatment = treatmentForm.procedure === "Other";
    const customName = treatmentForm.customTreatmentName.trim();
    const customStages = treatmentForm.customStages.map((stage) => stage.trim()).filter(Boolean);
    if (isCustomTreatment && (!customName || customStages.length === 0)) return;

    const stagesList = isCustomTreatment
      ? customStages
      : getStagesForProcedure(treatmentForm.procedure);
    const initialStages = stagesList.map((s, idx) => ({
      name: s,
      status: idx === 0 ? ("active" as const) : ("upcoming" as const),
    }));

    const newTx: TreatmentRecord = {
      id: `TX-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      toothNumber: treatmentForm.toothNumber,
      procedure: isCustomTreatment ? customName : treatmentForm.procedure,
      notes: treatmentForm.notes,
      status: "Pending",
      currentStage: stagesList[0] || "Consultation",
      stages: initialStages,
      startDate: new Date().toISOString().split("T")[0],
      completedDate: null,
    };

    console.log("NEW TREATMENT", newTx);

    setPatientData((prev) => ({
      ...prev,
      treatments: [newTx, ...prev.treatments],
    }));

    setTreatmentForm({
      toothNumber: "",
      procedure: "",
      notes: "",
      customTreatmentName: "",
      customStages: ["Consultation", "Completed"],
    });
    setIsAddingTreatment(false);
  };

  const getTreatmentStatusClasses = (status: TreatmentRecord["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "Ongoing":
        return "bg-cyan-50 border-cyan-200 text-cyan-700";
      case "Paused":
        return "bg-slate-100 border-slate-300 text-slate-700";
      case "Completed":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      default:
        return "bg-slate-100 border-slate-200 text-slate-700";
    }
  };

  const updateTreatmentStage = (id: string, currentStage: TreatmentStage) => {
    setPatientData((prev) => ({
      ...prev,
      treatments: prev.treatments.map((tx) => {
        if (tx.id !== id) return tx;
        const currentStages =
          tx.stages ||
          getStagesForProcedure(tx.procedure).map((s, i) => ({
            name: s,
            status:
              s === tx.currentStage
                ? "active"
                : i < getStagesForProcedure(tx.procedure).indexOf(tx.currentStage)
                  ? "completed"
                  : "upcoming",
          }));
        const clickedIdx = currentStages.findIndex((s) => s.name === currentStage);
        const newStages = currentStages.map((stage, idx) => {
          let status: "completed" | "active" | "upcoming" = "upcoming";
          if (idx < clickedIdx) {
            status = "completed";
          } else if (idx === clickedIdx) {
            status = "active";
          }
          return { ...stage, status };
        });
        return {
          ...tx,
          currentStage,
          stages: newStages,
        };
      }),
    }));
  };

  // Expanded treatment ID for editing stages
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const toggleManageStages = (txId: string) => {
    setExpandedTxId((prev) => (prev === txId ? null : txId));
  };

  // Stage editing functions
  const handleRenameStage = (txId: string, idx: number, newName: string) => {
    setPatientData((prev) => ({
      ...prev,
      treatments: prev.treatments.map((tx) => {
        if (tx.id !== txId) return tx;
        const currentStages =
          tx.stages ||
          getStagesForProcedure(tx.procedure).map((s, i) => ({
            name: s,
            status:
              s === tx.currentStage
                ? "active"
                : i < getStagesForProcedure(tx.procedure).indexOf(tx.currentStage)
                  ? "completed"
                  : "upcoming",
          }));
        const newStages = currentStages.map((stage, i) =>
          i === idx ? { ...stage, name: newName } : stage,
        );
        return {
          ...tx,
          stages: newStages,
          currentStage: newStages.find((s) => s.status === "active")?.name || tx.currentStage,
        };
      }),
    }));
  };

  const handleSetStageStatus = (
    txId: string,
    idx: number,
    newStatus: "completed" | "active" | "upcoming",
  ) => {
    setPatientData((prev) => ({
      ...prev,
      treatments: prev.treatments.map((tx) => {
        if (tx.id !== txId) return tx;
        const currentStages =
          tx.stages ||
          getStagesForProcedure(tx.procedure).map((s, i) => ({
            name: s,
            status:
              s === tx.currentStage
                ? "active"
                : i < getStagesForProcedure(tx.procedure).indexOf(tx.currentStage)
                  ? "completed"
                  : "upcoming",
          }));
        const newStages = currentStages.map((stage, i) =>
          i === idx ? { ...stage, status: newStatus } : stage,
        );
        return {
          ...tx,
          stages: newStages,
          currentStage: newStages.find((s) => s.status === "active")?.name || tx.currentStage,
        };
      }),
    }));
  };

  const handleMoveStage = (txId: string, idx: number, direction: "up" | "down") => {
    setPatientData((prev) => ({
      ...prev,
      treatments: prev.treatments.map((tx) => {
        if (tx.id !== txId) return tx;
        const currentStages = [
          ...(tx.stages ||
            getStagesForProcedure(tx.procedure).map((s, i) => ({
              name: s,
              status:
                s === tx.currentStage
                  ? "active"
                  : i < getStagesForProcedure(tx.procedure).indexOf(tx.currentStage)
                    ? "completed"
                    : "upcoming",
            }))),
        ];

        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= currentStages.length) return tx;

        // Swap
        const temp = currentStages[idx];
        currentStages[idx] = currentStages[targetIdx];
        currentStages[targetIdx] = temp;

        return {
          ...tx,
          stages: currentStages,
          currentStage: currentStages.find((s) => s.status === "active")?.name || tx.currentStage,
        };
      }),
    }));
  };

  const handleDeleteStage = (txId: string, idx: number) => {
    setPatientData((prev) => ({
      ...prev,
      treatments: prev.treatments.map((tx) => {
        if (tx.id !== txId) return tx;
        const currentStages =
          tx.stages ||
          getStagesForProcedure(tx.procedure).map((s, i) => ({
            name: s,
            status:
              s === tx.currentStage
                ? "active"
                : i < getStagesForProcedure(tx.procedure).indexOf(tx.currentStage)
                  ? "completed"
                  : "upcoming",
          }));
        const newStages = currentStages.filter((_, i) => i !== idx);
        return {
          ...tx,
          stages: newStages,
          currentStage: newStages.find((s) => s.status === "active")?.name || tx.currentStage,
        };
      }),
    }));
  };

  const handleAddCustomStage = (txId: string, name: string) => {
    if (!name.trim()) return;
    setPatientData((prev) => ({
      ...prev,
      treatments: prev.treatments.map((tx) => {
        if (tx.id !== txId) return tx;
        const currentStages =
          tx.stages ||
          getStagesForProcedure(tx.procedure).map((s, i) => ({
            name: s,
            status:
              s === tx.currentStage
                ? "active"
                : i < getStagesForProcedure(tx.procedure).indexOf(tx.currentStage)
                  ? "completed"
                  : "upcoming",
          }));
        const newStages = [...currentStages, { name: name.trim(), status: "upcoming" as const }];
        return {
          ...tx,
          stages: newStages,
        };
      }),
    }));
  };

  const handleStageClick = (txId: string, clickedIdx: number) => {
    setPatientData((prev) => ({
      ...prev,
      treatments: prev.treatments.map((tx) => {
        if (tx.id !== txId) return tx;
        const currentStages =
          tx.stages ||
          getStagesForProcedure(tx.procedure).map((s, i) => ({
            name: s,
            status:
              s === tx.currentStage
                ? "active"
                : i < getStagesForProcedure(tx.procedure).indexOf(tx.currentStage)
                  ? "completed"
                  : "upcoming",
          }));
        const newStages = currentStages.map((stage, idx) => {
          let status: "completed" | "active" | "upcoming" = "upcoming";
          if (idx < clickedIdx) {
            status = "completed";
          } else if (idx === clickedIdx) {
            status = "active";
          }
          return { ...stage, status };
        });
        return {
          ...tx,
          stages: newStages,
          currentStage: newStages[clickedIdx]?.name || tx.currentStage,
        };
      }),
    }));
  };

  const updateTreatmentStatus = (id: string, status: TreatmentRecord["status"]) => {
    setPatientData((prev) => ({
      ...prev,
      treatments: prev.treatments.map((tx) => {
        if (tx.id !== id) return tx;
        const updated: TreatmentRecord = {
          ...tx,
          status,
          completedDate: status === "Completed" ? new Date().toISOString().split("T")[0] : null,
        };
        return updated;
      }),
    }));
  };

  const refreshToothHistory = () => {
    setToothHistory(getPatientToothHistory(patientId || selectedPatient.id));
  };

  const getToothMarks = () => {
    const latestByTooth = new Map<number, ToothProcedureEntry>();
    toothHistory.forEach((entry) => {
      const existing = latestByTooth.get(entry.toothNumber);
      if (!existing || new Date(entry.performedAt) > new Date(existing.performedAt)) {
        latestByTooth.set(entry.toothNumber, entry);
      }
    });
    return Array.from(latestByTooth.values()).map((entry) => ({
      tooth_number: entry.toothNumber,
      status: entry.status,
      procedure: entry.procedure,
    }));
  };

  const selectedToothHistory = selectedTooth
    ? toothHistory.filter((entry) => entry.toothNumber === selectedTooth)
    : [];

  const selectedToothEntry = selectedToothEntryId
    ? toothHistory.find((entry) => entry.id === selectedToothEntryId)
    : selectedToothHistory[0];

  const openToothModal = (tooth: number) => {
    const history = toothHistory.filter((entry) => entry.toothNumber === tooth);
    const latestEntry = history[0];
    setSelectedTooth(tooth);
    setSelectedToothEntryId(latestEntry?.id ?? null);
    setToothForm({
      toothNumber: String(tooth),
      procedure: latestEntry?.procedure ?? "",
      status: latestEntry?.status ?? "planned",
      notes: latestEntry?.notes ?? "",
      linkedTreatment: latestEntry?.linkedTreatment ?? patientData.treatments[0]?.procedure ?? "",
    });
    setViewFullToothHistory(false);
    setToothActionMessage("");
    setIsToothModalOpen(true);
  };

  const handleAddToothProcedure = () => {
    if (!selectedTooth) {
      setToothActionMessage("Select a tooth before adding a procedure.");
      return;
    }
    if (!toothForm.procedure.trim()) {
      setToothActionMessage("Procedure name is required.");
      return;
    }

    savePatientToothProcedure(patientId || selectedPatient.id, {
      toothNumber: Number(toothForm.toothNumber) || selectedTooth,
      procedure: toothForm.procedure.trim(),
      status: toothForm.status,
      notes: toothForm.notes.trim(),
      linkedTreatment:
        toothForm.linkedTreatment.trim() || patientData.treatments[0]?.procedure || "",
    });
    refreshToothHistory();
    setSelectedToothEntryId(null);
    setToothActionMessage("New tooth procedure added.");
  };

  const handleSaveToothUpdates = () => {
    if (!selectedToothEntryId) {
      setToothActionMessage("Select a procedure to edit.");
      return;
    }

    const existingEntry = toothHistory.find((entry) => entry.id === selectedToothEntryId);

    if (!existingEntry) {
      setToothActionMessage("Procedure not found.");
      return;
    }

    updatePatientToothProcedure(patientId || selectedPatient.id, {
      ...existingEntry,
      id: existingEntry.id,
      toothNumber: Number(toothForm.toothNumber),
      procedure: toothForm.procedure.trim(),
      status: toothForm.status,
      notes: toothForm.notes.trim(),
      linkedTreatment: toothForm.linkedTreatment.trim(),
    });

    refreshToothHistory();

    setSelectedToothEntryId(null);

    setToothForm({
      toothNumber: "",
      procedure: "",
      status: "planned",
      notes: "",
      linkedTreatment: "",
    });

    setToothActionMessage("Tooth procedure updated.");
  };

  const handleMarkToothCompleted = () => {};

  const formatPrescriptionDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const togglePrescriptionExpand = (id: string) => {
    setExpandedPrescriptionId((current) => (current === id ? null : id));
  };

  const handleOpenPrescriptionModal = (mode: "create" | "history") => {
    setPrescriptionErrorMessage("");
    setPrescriptionSuccessMessage("");
    setPrescriptionModal(mode);
  };

  const handleGeneratePrescriptionPdf = (prescription: PrescriptionRecord) => {
    const html = `
      <html>
        <head>
          <title>Prescription ${prescription.id}</title>
          <style>
            body { font-family: Inter, system-ui, sans-serif; padding: 32px; color: #111827; }
            h1 { font-size: 24px; margin-bottom: 18px; }
            .section { margin-bottom: 16px; }
            .section-title { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
            .med { margin-bottom: 10px; }
            .med strong { display: block; margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <h1>Prescription ${prescription.id}</h1>
          <div class="section"><div class="section-title">Patient</div><div>${patientData.profile.fullName}</div></div>
          <div class="section"><div class="section-title">Treatment</div><div>${prescription.associatedTreatment}</div></div>
          <div class="section"><div class="section-title">Issued</div><div>${prescription.date}</div></div>
          <div class="section"><div class="section-title">Medicines</div>${prescription.medicines
            .map(
              (med) =>
                `<div class="med"><strong>${med.name} ${med.strength}</strong><div>Dosage: ${med.dosage}</div><div>Frequency: ${med.frequency}</div><div>Duration: ${med.duration}</div></div>`,
            )
            .join("")}</div>
          <div class="section"><div class="section-title">Instructions</div><div>${prescription.dosageInstructions}</div></div>
          <div class="section"><div class="section-title">Follow-up</div><div>${prescription.followUpRecommendation}</div></div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      alert("Please allow pop-ups to print the prescription.");
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleAddPrescription = (e: React.FormEvent) => {
    e.preventDefault();

    if (!prescriptionForm.associatedTreatment.trim()) {
      setPrescriptionErrorMessage("Associated treatment is required.");
      return;
    }

    const validRows = prescriptionRows.filter(
      (row) => row.name.trim() && row.dosage.trim() && row.frequency.trim() && row.duration.trim(),
    );

    if (!validRows.length) {
      setPrescriptionErrorMessage(
        "Add at least one medicine row with dosage, frequency, and duration.",
      );
      return;
    }

    setPrescriptionErrorMessage("");
    setIsCreatingPrescription(true);
    setPrescriptionSuccessMessage("");

    window.setTimeout(() => {
      const newPrescription: PrescriptionRecord = {
        id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split("T")[0],
        clinicName: "Lumident Dental Group",
        prescribingDoctor: "Dr. Aisha Rahman",
        licenseNumber: "DN-88431",
        issueDate: new Date().toISOString().split("T")[0],
        linkedTreatment: prescriptionForm.associatedTreatment,
        associatedTreatment: prescriptionForm.associatedTreatment,
        medicines: validRows,
        dosageInstructions: prescriptionForm.dosageInstructions,
        followUpRecommendation: prescriptionForm.followUpRecommendation,
        status: "Active",
      };

      addPatientPrescription(patientId || selectedPatient.id, newPrescription);
      setPatientData((prev) => ({
        ...prev,
        prescriptions: [newPrescription, ...prev.prescriptions],
      }));
      setIsCreatingPrescription(false);
      setPrescriptionSuccessMessage("Prescription created successfully.");
      setPrescriptionModal(null);
      setPrescriptionRows([
        {
          name: "",
          strength: "",
          dosage: "",
          frequency: "",
          duration: "",
        },
      ]);
      setPrescriptionForm({
        associatedTreatment: initialData.treatments[0]?.procedure || "",
        dosageInstructions: "",
        followUpRecommendation: "",
      });
    }, 600);
  };

  const addPrescriptionRow = () => {
    setPrescriptionRows((prev) => [
      ...prev,
      {
        name: "",
        strength: "",
        dosage: "",
        frequency: "",
        duration: "",
      },
    ]);
  };

  const removePrescriptionRow = (index: number) => {
    setPrescriptionRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updatePrescriptionRow = (
    index: number,
    field: keyof (typeof prescriptionRows)[number],
    value: string,
  ) => {
    setPrescriptionRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)),
    );
  };

  const triggerPrescriptionAction = (type: "Download" | "Print", rx: PrescriptionRecord) => {
    if (type === "Print") {
      handleGeneratePrescriptionPdf(rx);
      return;
    }

    const content =
      `Prescription ${rx.id}\nPatient: ${patientData.profile.fullName}\nTreatment: ${rx.associatedTreatment}\n\n` +
      rx.medicines
        .map(
          (med) => `${med.name} ${med.strength} — ${med.dosage}, ${med.frequency}, ${med.duration}`,
        )
        .join("\n") +
      `\n\nInstructions: ${rx.dosageInstructions}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${rx.id}-prescription.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans flex flex-col scroll-smooth">
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
          COMPACTABLE PATIENT IDENTITY HEADER
         ========================================== */}
      <div
        className={`sticky top-14 z-20 bg-white border-b border-slate-200 shadow-xs px-4 sm:px-8 transition-all duration-300 ${
          isHeaderCollapsed ? "py-2" : "py-4 sm:py-5"
        } flex flex-col`}
      >
        <div
          className={`flex items-center justify-between w-full transition-all duration-300 ${isHeaderCollapsed ? "gap-2" : "gap-4"}`}
        >
          <div className="flex items-center gap-6">
            <div
              className={`rounded-2xl bg-teal-600 shadow-sm flex items-center justify-center text-white font-bold tracking-wider transition-all duration-300 ${
                isHeaderCollapsed ? "w-13 h-13 text-sm" : "w-15 h-15 text-xl"
              }`}
            >
              {patientData.profile.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className={`${isHeaderCollapsed ? "" : "space-y-1"}`}>
              <h2
                className={`text-slate-900 tracking-tight leading-none transition-all duration-300 ${
                  isHeaderCollapsed
                    ? "text-sm sm:text-base font-semibold"
                    : "text-lg sm:text-xl font-bold"
                }`}
              >
                {patientData.profile.fullName}
              </h2>
              {!isHeaderCollapsed && (
                <div className="text-xs text-slate-500 font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                    {patientData.profile.age} Yrs •{" "}
                    {patientData.profile.sex || patientData.profile.gender}
                  </span>

                  <span className="text-xs uppercase tracking-[0.12em] text-slate-400 font-medium">
                    Patient ID {patientData.id}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* METRICS VIEWPORTS GRID - stays right aligned and becomes compact */}
          <div
            className={`grid grid-cols-3 gap-3 bg-slate-50 rounded-2xl border border-slate-200/60 transition-all duration-300 ${
              isHeaderCollapsed
                ? "p-1 text-sm min-w-[240px]"
                : "gap-3 p-2.5 min-w-full md:min-w-[300px]"
            }`}
          >
            <div className="px-2">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                Total Gross Billed
              </span>
              <span
                className={`font-bold text-slate-800 ${isHeaderCollapsed ? "text-xs" : "text-base sm:text-lg"}`}
              >
                ${totalBilled.toFixed(2)}
              </span>
            </div>
            <div className="px-1 border-l border-slate-200">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                Cleared Credits
              </span>
              <span
                className={`font-bold text-emerald-600 ${isHeaderCollapsed ? "text-xs" : "text-sm sm:text-base"}`}
              >
                ${totalPaid.toFixed(2)}
              </span>
            </div>
            <div
              className={`px-2 py-1 rounded-lg border -my-1 ${outstandingDue > 0 ? "bg-rose-50/80 border-rose-100" : "bg-emerald-50/80 border-emerald-100"}`}
            >
              <span
                className={`text-xs font-extrabold uppercase tracking-wider block ${outstandingDue > 0 ? "text-rose-500" : "text-emerald-500"}`}
              >
                {outstandingDue > 0 ? "Balance Liability" : "Settled Asset"}
              </span>
              <span
                className={`font-black ${isHeaderCollapsed ? "text-xs" : "text-sm sm:text-base"} ${outstandingDue > 0 ? "text-rose-700" : "text-emerald-700"}`}
              >
                ${outstandingDue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className={`overflow-x-auto ${isHeaderCollapsed ? "mt-4" : "mt-8"}`}>
          <nav className="flex min-w-[720px] gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
            <a
              href="#overview"
              onClick={() => setActiveTab("#overview")}
              aria-current={activeTab === "#overview" ? "page" : undefined}
              className={`inline-flex items-center whitespace-nowrap rounded-full px-3 sm:px-4 py-1.5 transition-all duration-200 ${
                activeTab === "#overview"
                  ? "bg-teal-50 text-teal-700 border border-teal-100 shadow-sm"
                  : "bg-white text-slate-800 hover:bg-slate-100 hover:text-teal-700"
              }`}
            >
              Overview
            </a>
            <a
              href="#medical"
              onClick={() => setActiveTab("#medical")}
              aria-current={activeTab === "#medical" ? "page" : undefined}
              className={`inline-flex items-center whitespace-nowrap rounded-full px-3 sm:px-4 py-1.5 transition-all duration-200 ${
                activeTab === "#medical"
                  ? "bg-teal-50 text-teal-700 border border-teal-100 shadow-sm"
                  : "bg-white text-slate-800 hover:bg-slate-100 hover:text-teal-700"
              }`}
            >
              Medical
            </a>
            <a
              href="#billing"
              onClick={() => setActiveTab("#billing")}
              aria-current={activeTab === "#billing" ? "page" : undefined}
              className={`inline-flex items-center whitespace-nowrap rounded-full px-3 sm:px-4 py-1.5 transition-all duration-200 ${
                activeTab === "#billing"
                  ? "bg-teal-50 text-teal-700 border border-teal-100 shadow-sm"
                  : "bg-white text-slate-800 hover:bg-slate-100 hover:text-teal-700"
              }`}
            >
              Billing
            </a>
            <a
              href="#treatments"
              onClick={() => setActiveTab("#treatments")}
              aria-current={activeTab === "#treatments" ? "page" : undefined}
              className={`inline-flex items-center whitespace-nowrap rounded-full px-3 sm:px-4 py-1.5 transition-all duration-200 ${
                activeTab === "#treatments"
                  ? "bg-teal-50 text-teal-700 border border-teal-100 shadow-sm"
                  : "bg-white text-slate-800 hover:bg-slate-100 hover:text-teal-700"
              }`}
            >
              Treatments
            </a>
            <a
              href="#scheduler"
              onClick={() => setActiveTab("#scheduler")}
              aria-current={activeTab === "#scheduler" ? "page" : undefined}
              className={`inline-flex items-center whitespace-nowrap rounded-full px-3 sm:px-4 py-1.5 transition-all duration-200 ${
                activeTab === "#scheduler"
                  ? "bg-teal-50 text-teal-700 border border-teal-100 shadow-sm"
                  : "bg-white text-slate-800 hover:bg-slate-100 hover:text-teal-700"
              }`}
            >
              Scheduler
            </a>
            <a
              href="#tooth-chart"
              onClick={() => setActiveTab("#tooth-chart")}
              aria-current={activeTab === "#tooth-chart" ? "page" : undefined}
              className={`inline-flex items-center whitespace-nowrap rounded-full px-3 sm:px-4 py-1.5 transition-all duration-200 ${
                activeTab === "#tooth-chart"
                  ? "bg-teal-50 text-teal-700 border border-teal-100 shadow-sm"
                  : "bg-white text-slate-800 hover:bg-slate-100 hover:text-teal-700"
              }`}
            >
              Tooth Chart
            </a>
            <a
              href="#prescriptions"
              onClick={() => setActiveTab("#prescriptions")}
              aria-current={activeTab === "#prescriptions" ? "page" : undefined}
              className={`inline-flex items-center whitespace-nowrap rounded-full px-3 sm:px-4 py-1.5 transition-all duration-200 ${
                activeTab === "#prescriptions"
                  ? "bg-teal-50 text-teal-700 border border-teal-100 shadow-sm"
                  : "bg-white text-slate-800 hover:bg-slate-100 hover:text-teal-700"
              }`}
            >
              Prescriptions
            </a>
          </nav>
        </div>
      </div>

      {/* CORE WORKSPACE CONTENT GRID CONTAINER */}
      <div className="flex-1 p-3 sm:p-4 max-w-[1600px] w-full mx-auto space-y-4">
        {/* ==========================================
            EDITABLE PATIENT PROFILE MATRIX SECTION
           ========================================== */}
        <div
          id="overview"
          className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden scroll-mt-[160px]"
        >
          <div className="px-3 sm:px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" /> Patient Profile Matrix &amp; Ecosystem
              Records
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

          <div className="p-3 sm:p-4">
            {isProfileEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-5 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-slate-500 font-medium mb-2 uppercase tracking-[0.14em] text-[11px]">
                      Legal Name
                    </label>
                    <input
                      type="text"
                      value={editableProfile.fullName}
                      onChange={(e) =>
                        setEditableProfile({ ...editableProfile, fullName: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-2xl font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-2 uppercase tracking-[0.14em] text-[11px]">
                      Age Mapping
                    </label>
                    <input
                      type="number"
                      value={editableProfile.age}
                      onChange={(e) =>
                        setEditableProfile({
                          ...editableProfile,
                          age: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-3 border border-slate-200 rounded-2xl font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-2 uppercase tracking-[0.14em] text-[11px]">
                      Sex
                    </label>
                    <input
                      type="text"
                      value={editableProfile.sex || editableProfile.gender}
                      onChange={(e) =>
                        setEditableProfile({
                          ...editableProfile,
                          sex: e.target.value,
                          gender: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-slate-200 rounded-2xl font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-2 uppercase tracking-[0.14em] text-[11px]">
                      Blood Registry
                    </label>
                    <input
                      type="text"
                      value={editableProfile.bloodGroup}
                      onChange={(e) =>
                        setEditableProfile({ ...editableProfile, bloodGroup: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-2xl font-mono font-bold text-teal-700 bg-teal-50/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-slate-500 font-medium mb-2 uppercase tracking-[0.14em] text-[11px]">
                      Primary Phone
                    </label>
                    <input
                      type="text"
                      value={editableProfile.phone}
                      onChange={(e) =>
                        setEditableProfile({ ...editableProfile, phone: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-2xl font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-2 uppercase tracking-[0.14em] text-[11px]">
                      Secondary Phone
                    </label>
                    <input
                      type="text"
                      value={editableProfile.secondaryPhone}
                      onChange={(e) =>
                        setEditableProfile({ ...editableProfile, secondaryPhone: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-2xl font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-2 uppercase tracking-[0.14em] text-[11px]">
                      Secure Email
                    </label>
                    <input
                      type="email"
                      value={editableProfile.email}
                      onChange={(e) =>
                        setEditableProfile({ ...editableProfile, email: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-2xl font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150 space-y-3">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block tracking-wider">
                    Demographic Anchor Bounds
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                        className="w-full p-3 bg-white border border-slate-200 rounded-2xl font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100"
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
                        className="w-full p-3 bg-white border border-slate-200 rounded-2xl font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100"
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
                        className="w-full p-3 bg-white border border-slate-200 rounded-2xl font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100"
                      />
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 text-sm">
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.18em] block">
                      Legal Full Name
                    </span>
                    <span className="font-semibold text-slate-900 mt-3 block leading-6 text-base">
                      {patientData.profile.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.18em] block">
                      Email Identity
                    </span>
                    <span className="font-semibold text-slate-900 mt-3 block truncate leading-6 text-base">
                      {patientData.profile.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.18em] block">
                      Primary Phone
                    </span>
                    <span className="font-semibold text-slate-900 mt-3 block leading-6 text-base">
                      {patientData.profile.phone}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.18em] block">
                      Secondary Phone
                    </span>
                    <span className="font-semibold text-slate-900 mt-3 block leading-6 text-base">
                      {patientData.profile.secondaryPhone || "Not Provided"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.18em] block">
                      Sex
                    </span>
                    <span className="font-semibold text-slate-900 mt-3 block leading-6 text-base">
                      {patientData.profile.gender}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.18em] block">
                      Age
                    </span>
                    <span className="font-semibold text-slate-900 mt-3 block leading-6 text-base">
                      {patientData.profile.age}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.18em] block">
                      Occupation Sector
                    </span>
                    <span className="font-semibold text-slate-900 mt-3 block leading-6 text-base">
                      {patientData.profile.occupation}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.18em] block">
                      Blood Matrix Type
                    </span>
                    <span className="font-mono font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-1 rounded-xl text-xs w-max mt-2 block">
                      {patientData.profile.bloodGroup}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.18em] block mb-2">
                    Residential Boundary Reference
                  </span>
                  <p className="font-semibold text-slate-900 leading-6 text-base">
                    {patientData.profile.address.street}, {patientData.profile.address.city},{" "}
                    {patientData.profile.address.state} {patientData.profile.address.zipCode}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 pt-3 mt-3 border-t border-slate-100">
              <div
                id="medical"
                className="rounded-2xl border border-rose-100 bg-rose-50/30 p-3 flex flex-col h-full scroll-mt-[160px]"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-rose-400 font-bold mb-3">
                      Medical History &amp; Risk Disclosures
                    </p>
                    <p className="text-sm text-slate-600 max-w-2xl">
                      Medical history details are organized for a clearer clinical risk overview.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isMedicalEditing ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditableProfile({ ...patientData.profile });
                          setEditableMedicalStrings({
                            allergies: patientData.profile.medicalProfile.allergies.join(", "),
                            medications: patientData.profile.medicalProfile.medications.join(", "),
                            conditions: patientData.profile.medicalProfile.conditions.join(", "),
                          });
                          setIsMedicalEditing(true);
                        }}
                        className="inline-flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Medical History
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCancelMedicalHistory}
                          className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveMedicalHistory}
                          className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg transition"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 space-y-4 text-sm flex-1">
                  {isMedicalEditing ? (
                    <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-500 font-medium mb-2 uppercase tracking-[0.14em] text-[11px]">
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
                            className="w-full p-3 bg-white border border-rose-200 rounded-2xl font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-100"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium mb-2 uppercase tracking-[0.14em] text-[11px]">
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
                            className="w-full p-3 bg-white border border-rose-200 rounded-2xl font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-100"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium mb-2 uppercase tracking-[0.14em] text-[11px]">
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
                            className="w-full p-3 bg-white border border-rose-200 rounded-2xl font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-100"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium mb-2 uppercase tracking-[0.14em] text-[11px]">
                            Family History
                          </label>
                          <textarea
                            placeholder="e.g. Mother has hypertension; father has diabetes"
                            value={editableProfile.medicalProfile.familyHistory}
                            onChange={(e) =>
                              setEditableProfile({
                                ...editableProfile,
                                medicalProfile: {
                                  ...editableProfile.medicalProfile,
                                  familyHistory: e.target.value,
                                },
                              })
                            }
                            className="w-full p-3 bg-white border border-rose-200 rounded-2xl font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-100"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium mb-2 uppercase tracking-[0.14em] text-[11px]">
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
                            className="w-full p-3 bg-white border border-rose-200 rounded-2xl font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-100"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-rose-100 bg-white p-3">
                        <span className="text-slate-900 font-bold text-xs uppercase tracking-wide">
                          Allergies
                        </span>
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
                      <div className="rounded-2xl border border-rose-100 bg-white p-3">
                        <span className="text-slate-900 font-bold text-xs uppercase tracking-wide">
                          Medications
                        </span>
                        <div className="bg-white/90 border border-rose-100/80 shadow-xs rounded-xl p-3 mt-1.5">
                          <p className="text-slate-700 font-medium leading-relaxed">
                            {patientData.profile.medicalProfile.medications.join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-rose-100 bg-white p-3">
                        <span className="text-slate-900 font-bold text-xs uppercase tracking-wide">
                          Conditions
                        </span>
                        <div className="bg-white/90 border border-rose-100/80 shadow-xs rounded-xl p-3 mt-1.5">
                          <p className="text-slate-700 font-medium leading-relaxed">
                            {patientData.profile.medicalProfile.conditions.join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-rose-100 bg-white p-3">
                        <span className="text-slate-900 font-bold text-xs uppercase tracking-wide">
                          Family History
                        </span>
                        <div className="bg-white/90 border border-rose-100/80 shadow-xs rounded-xl p-3 mt-1.5">
                          <p className="text-slate-700 font-medium leading-relaxed">
                            {patientData.profile.medicalProfile.familyHistory ||
                              "No family history recorded."}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-rose-100 bg-white p-3">
                        <span className="text-slate-900 font-bold text-xs uppercase tracking-wide">
                          Clinical Notes
                        </span>
                        <div className="bg-white/90 border border-rose-100/80 shadow-xs rounded-xl p-3 mt-1.5">
                          <p className="text-slate-700 font-medium leading-relaxed">
                            {patientData.profile.medicalProfile.notes}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 font-bold">
                    Patient Networks &amp; Referral Workflow
                  </p>
                  <h3 className="text-base font-semibold text-slate-900">
                    Family Linking &amp; Smart Recall
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isNetworkEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleAddFamilyLink}
                        className="text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
                      >
                        Add Family Link
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelNetwork}
                        className="text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveNetwork}
                        className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg transition"
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartNetworkEditing}
                      className="text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
                    >
                      Edit Family Linking
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> Family Linking &amp; Smart
                        Recall
                      </span>
                      {!isNetworkEditing && (
                        <span className="text-[10px] text-slate-500">
                          Doctor/admin only workflow
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {isNetworkEditing ? (
                        editableNetwork.family.map((f, index) => (
                          <div
                            key={f.id}
                            className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm font-semibold text-slate-900">
                                Family Link {index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => handleDeleteFamilyLink(f.id)}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                              >
                                Delete
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              <label className="text-xs font-semibold text-slate-600">
                                Linked Person Name
                                <input
                                  type="text"
                                  value={f.fullName}
                                  onChange={(event) => {
                                    const next = [...editableNetwork.family];
                                    next[index] = { ...next[index], fullName: event.target.value };
                                    setEditableNetwork((prev) => ({ ...prev, family: next }));
                                  }}
                                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                                />
                              </label>
                              <label className="text-xs font-semibold text-slate-600">
                                Relationship
                                <input
                                  type="text"
                                  value={f.relation}
                                  onChange={(event) => {
                                    const next = [...editableNetwork.family];
                                    next[index] = { ...next[index], relation: event.target.value };
                                    setEditableNetwork((prev) => ({ ...prev, family: next }));
                                  }}
                                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                                />
                              </label>
                            </div>
                          </div>
                        ))
                      ) : patientData.family.length > 0 ? (
                        patientData.family.map((f) => (
                          <div
                            key={f.id}
                            className="rounded-2xl border border-slate-200 bg-white p-3"
                          >
                            <div className="text-sm font-semibold text-slate-900">{f.fullName}</div>
                            <div className="text-xs text-slate-500">{f.relation}</div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
                          No family recall links added yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">
                      Emergency Contact
                    </p>
                    {isNetworkEditing ? (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700">
                          Name
                          <input
                            type="text"
                            value={editableNetwork.emergencyContact.name}
                            onChange={(event) =>
                              setEditableNetwork((prev) => ({
                                ...prev,
                                emergencyContact: {
                                  ...prev.emergencyContact,
                                  name: event.target.value,
                                },
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Relation
                          <input
                            type="text"
                            value={editableNetwork.emergencyContact.relation}
                            onChange={(event) =>
                              setEditableNetwork((prev) => ({
                                ...prev,
                                emergencyContact: {
                                  ...prev.emergencyContact,
                                  relation: event.target.value,
                                },
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Phone
                          <input
                            type="text"
                            value={editableNetwork.emergencyContact.phone}
                            onChange={(event) =>
                              setEditableNetwork((prev) => ({
                                ...prev,
                                emergencyContact: {
                                  ...prev.emergencyContact,
                                  phone: event.target.value,
                                },
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                          />
                        </label>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">
                          {patientData.profile.emergencyContact.name}
                        </h4>
                        <p className="text-xs uppercase tracking-wide text-slate-400 mt-1">
                          {patientData.profile.emergencyContact.relation}
                        </p>
                        <p className="text-sm font-semibold text-teal-600 mt-2">
                          {patientData.profile.emergencyContact.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4"></div>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            REFINED OPERATIONAL ACCOUNTING LEDGER
           ========================================== */}
        <div
          id="billing"
          className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-xs overflow-hidden scroll-mt-[160px]"
        >
          <div className="px-3 sm:px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" /> Operational Ledger &amp; Billing
              Files
            </h3>
            <button
              onClick={() => setIsAddingLedger(!isAddingLedger)}
              className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Ledger Entry
            </button>
          </div>

          <div className="p-3 sm:p-4 space-y-3">
            {/* UPDATED DATED LEDGER DISPATCH INPUT SUB-SYSTEM */}
            <AnimatePresence>
              {isAddingLedger && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddLedgerEntry}
                  className="border border-emerald-100 bg-emerald-50/10 rounded-xl p-3 text-xs space-y-4 shadow-inner"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* TREATMENT CARD RECORD MODULE */}
          <div
            id="treatments"
            className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-cyan-500 shadow-xs flex flex-col justify-between overflow-hidden scroll-mt-[160px]"
          >
            <div>
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-600" /> Treatment Tracking &amp;
                  Diagnostics
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

                          <select
                            value={treatmentForm.procedure}
                            onChange={(e) => {
                              const nextProcedure = e.target.value;
                              let nextStages = treatmentForm.customStages;

                              if (nextProcedure === "Other" && nextStages.length === 0) {
                                nextStages = ["Consultation", "Completed"];
                              }

                              setTreatmentForm({
                                ...treatmentForm,
                                procedure: nextProcedure,
                                customStages: nextStages,
                              });
                            }}
                            className="w-full p-2 border border-slate-200 rounded bg-white"
                            required
                          >
                            <option value="">Select Procedure</option>

                            <option value="Root Canal">Root Canal</option>

                            <option value="Implant">Implant</option>

                            <option value="Bridge">Bridge</option>

                            <option value="Composite Filling">Composite Filling</option>

                            <option value="Scaling & Cleaning">Scaling & Cleaning</option>

                            <option value="Extraction">Extraction</option>

                            <option value="Braces">Braces</option>
                            <option value="Other">Other</option>
                          </select>
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

                      {treatmentForm.procedure === "Other" && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-4">
                          <div>
                            <label className="block text-slate-400 font-bold mb-0.5">
                              Custom Treatment Name
                            </label>
                            <input
                              type="text"
                              value={treatmentForm.customTreatmentName}
                              onChange={(e) =>
                                setTreatmentForm({
                                  ...treatmentForm,
                                  customTreatmentName: e.target.value,
                                })
                              }
                              className="w-full p-2 border border-slate-200 rounded"
                              required
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-600 text-sm font-bold">
                                Custom Treatment Stages
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setTreatmentForm((prev) => ({
                                    ...prev,
                                    customStages: [...prev.customStages, "New Stage"],
                                  }))
                                }
                                className="text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-2 py-1 rounded"
                              >
                                Add Stage
                              </button>
                            </div>
                            <div className="space-y-2">
                              {treatmentForm.customStages.map((stage, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={stage}
                                    onChange={(e) =>
                                      setTreatmentForm((prev) => ({
                                        ...prev,
                                        customStages: prev.customStages.map((item, idx) =>
                                          idx === index ? e.target.value : item,
                                        ),
                                      }))
                                    }
                                    className="flex-1 p-2 border border-slate-200 rounded"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setTreatmentForm((prev) => ({
                                        ...prev,
                                        customStages: prev.customStages.filter(
                                          (_, idx) => idx !== index,
                                        ),
                                      }))
                                    }
                                    className="text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded"
                                    disabled={treatmentForm.customStages.length <= 1}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

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

                <span className="uppercase tracking-[0.18em] text-[9px] text-slate-400">
                  Progress Controlled Below
                </span>

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

                      <div className="mt-1 text-[11px] text-slate-500 space-y-0.5">
                        <div>
                          <span className="font-semibold">Started:</span> {tx.startDate}
                        </div>
                        {tx.completedDate && (
                          <div>
                            <span className="font-semibold">Completed:</span> {tx.completedDate}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-2">
                        <div>
                          <div className="text-[10px] uppercase text-slate-400">Started</div>
                          <div className="font-semibold text-slate-700">
                            {formatDate(tx.startDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-slate-400">Completed</div>
                          <div className="font-semibold text-slate-700">
                            {tx.completedDate ? formatDate(tx.completedDate) : "-"}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h4 className="font-bold text-slate-900">{tx.procedure}</h4>
                        <span
                          className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getTreatmentStatusClasses(
                            tx.status,
                          )}`}
                        >
                          {tx.status}
                        </span>
                      </div>

                      {tx.notes && (
                        <p className="text-slate-500 font-medium leading-relaxed bg-white p-2 rounded border border-slate-200/60">
                          {tx.notes}
                        </p>
                      )}

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs pt-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex items-center gap-2 text-slate-500 font-semibold">
                            <span className="uppercase tracking-[0.18em] text-[9px]">
                              Current Stage
                            </span>
                            <select
                              value={tx.currentStage}
                              onChange={(e) => updateTreatmentStage(tx.id, e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                            >
                              {(tx.stages || []).map((stage) => (
                                <option key={stage.name} value={stage.name}>
                                  {stage.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                          {tx.currentStage}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2.5 border-t border-slate-100/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                            Treatment Plan & Progress
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleManageStages(tx.id)}
                            className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700"
                          >
                            {expandedTxId === tx.id ? "Hide Editor" : "Edit Plan Stages"}
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 py-1">
                          {(tx.stages || []).map((stage, idx) => (
                            <React.Fragment key={stage.name}>
                              <div
                                onClick={() => handleStageClick(tx.id, idx)}
                                className={`cursor-pointer px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                  stage.status === "completed"
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                    : stage.status === "active"
                                      ? "bg-cyan-50 border-cyan-300 text-cyan-700 ring-1 ring-cyan-400 hover:bg-cyan-100"
                                      : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                                }`}
                                title="Click to set as active stage"
                              >
                                {stage.name}
                              </div>
                              {idx < (tx.stages || []).length - 1 && (
                                <span className="text-slate-300">→</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      {expandedTxId === tx.id && (
                        <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 space-y-2 mt-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                            Configure Plan Stages
                          </span>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {(tx.stages || []).map((stage, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={stage.name}
                                  onChange={(e) => handleRenameStage(tx.id, idx, e.target.value)}
                                  className="flex-1 p-1 bg-white border border-slate-200 rounded text-[11px]"
                                />
                                <select
                                  value={stage.status}
                                  onChange={(e) =>
                                    handleSetStageStatus(
                                      tx.id,
                                      idx,
                                      e.target.value as "completed" | "active" | "upcoming",
                                    )
                                  }
                                  className="p-1 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-bold"
                                >
                                  <option value="completed">Completed</option>
                                  <option value="active">Active</option>
                                  <option value="upcoming">Upcoming</option>
                                </select>
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveStage(tx.id, idx, "up")}
                                  className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                  title="Move Up"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === (tx.stages || []).length - 1}
                                  onClick={() => handleMoveStage(tx.id, idx, "down")}
                                  className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                  title="Move Down"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStage(tx.id, idx)}
                                  className="p-0.5 text-red-500 hover:text-red-700"
                                  title="Delete Stage"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-1.5 pt-1.5 border-t border-slate-200/60">
                            <input
                              type="text"
                              placeholder="New stage name..."
                              id={`new-stage-${tx.id}`}
                              className="flex-1 p-1 bg-white border border-slate-200 rounded text-[11px]"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddCustomStage(
                                    tx.id,
                                    (e.currentTarget as HTMLInputElement).value,
                                  );
                                  (e.currentTarget as HTMLInputElement).value = "";
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById(
                                  `new-stage-${tx.id}`,
                                ) as HTMLInputElement | null;
                                if (input && input.value.trim()) {
                                  handleAddCustomStage(tx.id, input.value);
                                  input.value = "";
                                }
                              }}
                              className="bg-cyan-600 text-white font-bold px-2 py-1 rounded text-[10px] hover:bg-cyan-700"
                            >
                              Add Stage
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {tx.status !== "Ongoing" && tx.status !== "Completed" && (
                          <button
                            type="button"
                            onClick={() => updateTreatmentStatus(tx.id, "Ongoing")}
                            className="text-[10px] font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-2 py-1 rounded"
                          >
                            {tx.status === "Pending" ? "Start Treatment" : "Resume Treatment"}
                          </button>
                        )}
                        {tx.status === "Ongoing" && (
                          <button
                            type="button"
                            onClick={() => updateTreatmentStatus(tx.id, "Paused")}
                            className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded"
                          >
                            Pause Treatment
                          </button>
                        )}
                        {tx.status !== "Completed" && (
                          <button
                            type="button"
                            onClick={() => updateTreatmentStatus(tx.id, "Completed")}
                            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded"
                          >
                            Complete Treatment
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              typeof window !== "undefined" &&
                              window.confirm("Delete this treatment? This action cannot be undone.")
                            ) {
                              setPatientData((prev) => ({
                                ...prev,
                                treatments: prev.treatments.filter((t) => t.id !== tx.id),
                              }));
                              if (expandedTxId === tx.id) setExpandedTxId(null);
                            }
                          }}
                          className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================
              SIMPLIFIED CLINIC APPOINTMENT SCHEDULER MATRIX
             ========================================== */}
          <div
            id="scheduler"
            className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-rose-200 shadow-xs overflow-hidden flex flex-col justify-between scroll-mt-[160px]"
          >
            <div>
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" /> Operational Scheduler Matrix Grid
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMonth((prev) => {
                        if (prev === 0) {
                          setCurrentYear((y) => y - 1);
                          return 11;
                        }
                        return prev - 1;
                      });
                    }}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black text-slate-700 min-w-[80px] text-center select-none bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                    {new Date(currentYear, currentMonth).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMonth((prev) => {
                        if (prev === 11) {
                          setCurrentYear((y) => y + 1);
                          return 0;
                        }
                        return prev + 1;
                      });
                    }}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
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

                    const isCurrentSelection = day.dateStr === "2026-06-16";

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (matchedAppt) {
                            setSelectedAppointment(matchedAppt);
                          } else {
                            setCreateApptForm({
                              date: day.dateStr,
                              service: "Routine Cleaning & Checkup",
                              doctor_id: "",
                              notes: "",
                            });
                            setIsCreateApptModalOpen(true);
                          }
                        }}
                        className={`rounded-xl border p-1.5 text-left transition-all duration-200 relative h-full group
                        
                        ${
                          isCurrentSelection
                            ? "bg-rose-50/80 border-rose-200 text-rose-600 shadow-xs ring-1 ring-rose-200"
                            : matchedAppt
                              ? "bg-indigo-50/30 hover:bg-indigo-50/60 border-indigo-100 text-indigo-900 shadow-xs"
                              : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:bg-indigo-50/10 hover:text-indigo-600"
                        }
                      `}
                      >
                        <div className="flex h-full flex-col items-start justify-between">
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider opacity-70 font-semibold">
                              {day.dayName}
                            </span>

                            <span className="mt-0.5 block text-xs font-black">{day.dayNum}</span>
                          </div>

                          {matchedAppt ? (
                            <div className="flex gap-1 items-center w-full justify-between">
                              <span className="text-[8px] font-bold text-indigo-700 truncate">
                                {matchedAppt.time || "10:00 AM"}
                              </span>
                              <div
                                className={`h-2 w-2 rounded-full shrink-0 ${
                                  matchedAppt.clinicalRecord
                                    ? "bg-emerald-500"
                                    : "bg-amber-400 animate-pulse"
                                }`}
                                title={
                                  matchedAppt.clinicalRecord
                                    ? "Clinical record saved"
                                    : "Clinical record pending"
                                }
                              />
                            </div>
                          ) : (
                            <span className="text-[8px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              + Book
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-xs text-indigo-900 font-medium">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Scheduler Quick Guide:</strong> Click any cell with a green dot to view
                    or edit the Clinical Record. Click any empty cell to schedule a new appointment
                    directly for that date.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            SIMPLIFIED CLINIC APPOINTMENT SCHEDULER MATRIX
           ========================================== */}
        <div
          id="tooth-chart"
          className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden scroll-mt-[160px]"
        >
          <div className="px-3 sm:px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" /> Interactive Tooth Chart
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Click a tooth to add procedures, update status, or add notes. Changes sync to the
                patient portal (read-only).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refreshToothHistory()}
                className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="p-5">
            <div className="w-full max-w-[920px] mx-auto">
              <ToothChart
                marks={getToothMarks()}
                selected={selectedTooth ?? null}
                onSelect={openToothModal}
                size="lg"
              />
            </div>
          </div>
        </div>

        {/* ==========================================
            PRESCRIPTION MANAGEMENT & AUTHORING WORKFLOW
           ========================================== */}
        <div
          id="prescriptions"
          className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-violet-500 shadow-xs overflow-hidden scroll-mt-[160px]"
        >
          <div className="px-3 sm:px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-violet-600" /> Prescription Management Workflow
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Author prescriptions, review active orders, and keep the patient portal synced in
                read-only mode.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleOpenPrescriptionModal("create")}
                className="inline-flex items-center gap-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" /> Create Prescription
              </button>
              <button
                type="button"
                onClick={() => handleOpenPrescriptionModal("history")}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
              >
                <History className="w-3.5 h-3.5" /> View Prescription History
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4 space-y-3">
            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">
                      Latest Prescription Preview
                    </p>
                    <h4 className="mt-2 text-sm font-bold text-slate-900">
                      {latestPrescription?.associatedTreatment || "No prescription yet"}
                    </h4>
                  </div>
                  {latestPrescription ? (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                      {latestPrescription.status}
                    </span>
                  ) : null}
                </div>

                {latestPrescription ? (
                  <div className="mt-4 space-y-4 text-sm text-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-slate-500 uppercase tracking-wide">
                          Issued
                        </span>
                        <p className="font-semibold text-slate-900 mt-1">
                          {formatPrescriptionDate(latestPrescription.date)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 uppercase tracking-wide">
                          Treatment reference
                        </span>
                        <p className="font-semibold text-slate-900 mt-1">
                          {latestPrescription.linkedTreatment}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-wide text-slate-400">
                          Medicine list
                        </span>
                        <span className="text-xs text-slate-500">
                          {latestPrescription.medicines.length} item(s)
                        </span>
                      </div>
                      <div className="space-y-2">
                        {latestPrescription.medicines.map((medicine, index) => (
                          <div
                            key={index}
                            className="rounded-xl bg-slate-50 p-3 border border-slate-100"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-slate-900">
                                {medicine.name} {medicine.strength}
                              </p>
                              <span className="text-[11px] text-slate-500">
                                {medicine.duration}
                              </span>
                            </div>
                            <p className="text-slate-500 text-xs mt-1">
                              {medicine.dosage} • {medicine.frequency}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">
                        Notes / Instructions
                      </p>
                      <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                        {latestPrescription.dosageInstructions}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    No prescription has been created for this patient yet. Use Create Prescription
                    to add the first entry.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-3 bg-white space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">
                    Quick Actions
                  </p>
                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPrescriptionModal("create")}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 text-white px-3 py-2 text-xs font-bold hover:bg-violet-700 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create Prescription
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenPrescriptionModal("history")}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 text-slate-700 px-3 py-2 text-xs font-bold hover:bg-slate-200 transition"
                    >
                      <History className="w-3.5 h-3.5" /> View Prescription History
                    </button>
                    <button
                      type="button"
                      disabled={!latestPrescription}
                      onClick={() =>
                        latestPrescription && handleGeneratePrescriptionPdf(latestPrescription)
                      }
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 px-3 py-2 text-xs font-bold hover:bg-slate-50 transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FileDown className="w-3.5 h-3.5" /> Generate Prescription PDF
                    </button>
                  </div>
                </div>
                {latestPrescription ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
                    Latest prescription data is synced to the patient portal in read-only mode.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {prescriptionModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setPrescriptionModal(null)}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 px-5 py-4 bg-slate-50">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {prescriptionModal === "create"
                          ? "Create Prescription"
                          : "Prescription History"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {prescriptionModal === "create"
                          ? "Add medicines, instructions, and duration before saving the prescription."
                          : "Browse the patient’s prescription history in a read-only summary view."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPrescriptionModal(null)}
                      className="inline-flex items-center justify-center rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 space-y-4 text-sm text-slate-700">
                    {prescriptionModal === "create" ? (
                      <form onSubmit={handleAddPrescription} className="space-y-4">
                        {prescriptionErrorMessage ? (
                          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm">
                            {prescriptionErrorMessage}
                          </div>
                        ) : null}
                        {prescriptionSuccessMessage ? (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm">
                            {prescriptionSuccessMessage}
                          </div>
                        ) : null}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-500 font-bold mb-2">
                              Associated Treatment
                            </label>
                            <input
                              type="text"
                              value={prescriptionForm.associatedTreatment}
                              onChange={(e) =>
                                setPrescriptionForm({
                                  ...prescriptionForm,
                                  associatedTreatment: e.target.value,
                                })
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-2">
                              Prescription Notes
                            </label>
                            <textarea
                              rows={3}
                              value={prescriptionForm.dosageInstructions}
                              onChange={(e) =>
                                setPrescriptionForm({
                                  ...prescriptionForm,
                                  dosageInstructions: e.target.value,
                                })
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-500 font-bold mb-2">
                            Follow-up Recommendation
                          </label>
                          <textarea
                            rows={2}
                            value={prescriptionForm.followUpRecommendation}
                            onChange={(e) =>
                              setPrescriptionForm({
                                ...prescriptionForm,
                                followUpRecommendation: e.target.value,
                              })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500"
                          />
                        </div>
                        <div className="space-y-4">
                          {prescriptionRows.map((row, rowIndex) => (
                            <div
                              key={rowIndex}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                            >
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <span className="text-xs uppercase tracking-wide text-slate-400 font-bold">
                                  Medicine {rowIndex + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removePrescriptionRow(rowIndex)}
                                  className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-slate-500 text-xs font-semibold mb-1">
                                    Name
                                  </label>
                                  <input
                                    type="text"
                                    value={row.name}
                                    onChange={(e) =>
                                      updatePrescriptionRow(rowIndex, "name", e.target.value)
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500"
                                    placeholder="Ibuprofen"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-500 text-xs font-semibold mb-1">
                                    Strength
                                  </label>
                                  <input
                                    type="text"
                                    value={row.strength}
                                    onChange={(e) =>
                                      updatePrescriptionRow(rowIndex, "strength", e.target.value)
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500"
                                    placeholder="400mg"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-500 text-xs font-semibold mb-1">
                                    Dosage
                                  </label>
                                  <input
                                    type="text"
                                    value={row.dosage}
                                    onChange={(e) =>
                                      updatePrescriptionRow(rowIndex, "dosage", e.target.value)
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500"
                                    placeholder="1 tablet"
                                    required
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                <div>
                                  <label className="block text-slate-500 text-xs font-semibold mb-1">
                                    Frequency
                                  </label>
                                  <input
                                    type="text"
                                    value={row.frequency}
                                    onChange={(e) =>
                                      updatePrescriptionRow(rowIndex, "frequency", e.target.value)
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500"
                                    placeholder="Every 4-6 hours"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-500 text-xs font-semibold mb-1">
                                    Duration
                                  </label>
                                  <input
                                    type="text"
                                    value={row.duration}
                                    onChange={(e) =>
                                      updatePrescriptionRow(rowIndex, "duration", e.target.value)
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500"
                                    placeholder="5 days"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={addPrescriptionRow}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add medicine row
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 justify-end pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setPrescriptionModal(null)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isCreatingPrescription}
                            className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-60"
                          >
                            {isCreatingPrescription ? "Saving..." : "Save Prescription"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        {patientData.prescriptions.length === 0 ? (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                            No historical prescriptions are available for this patient.
                          </div>
                        ) : (
                          patientData.prescriptions.map((rx) => {
                            const isExpanded = expandedPrescriptionId === rx.id;
                            return (
                              <div
                                key={rx.id}
                                className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden"
                              >
                                <button
                                  type="button"
                                  onClick={() => togglePrescriptionExpand(rx.id)}
                                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 bg-white"
                                >
                                  <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                                        {rx.status}
                                      </span>
                                      <h4 className="text-sm font-bold text-slate-900 truncate">
                                        {rx.associatedTreatment}
                                      </h4>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">
                                      Issued {formatPrescriptionDate(rx.date)} •{" "}
                                      {rx.medicines.map((med) => med.name).join(", ")}
                                    </p>
                                  </div>
                                  <span className="text-slate-400">
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </span>
                                </button>

                                {isExpanded ? (
                                  <div className="px-5 pb-5 pt-4 space-y-3 text-sm text-slate-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div className="rounded-2xl bg-white border border-slate-200 p-3">
                                        <p className="text-[10px] uppercase tracking-wide text-slate-400 font-bold mb-2">
                                          Medicines
                                        </p>
                                        <div className="space-y-2">
                                          {rx.medicines.map((medicine, index) => (
                                            <div
                                              key={index}
                                              className="rounded-2xl bg-slate-50 p-3 border border-slate-100"
                                            >
                                              <p className="font-semibold text-slate-900">
                                                {medicine.name} {medicine.strength}
                                              </p>
                                              <p className="text-xs text-slate-500">
                                                {medicine.dosage} • {medicine.frequency} •{" "}
                                                {medicine.duration}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="rounded-2xl bg-white border border-slate-200 p-3">
                                        <p className="text-[10px] uppercase tracking-wide text-slate-400 font-bold mb-2">
                                          Directions
                                        </p>
                                        <p className="text-sm text-slate-600">
                                          {rx.dosageInstructions}
                                        </p>
                                        <div className="mt-3 text-[10px] uppercase tracking-wide text-slate-400 font-bold">
                                          Follow-up
                                        </div>
                                        <p className="text-sm text-slate-600">
                                          {rx.followUpRecommendation}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="text-xs text-slate-500">
                                        Prescription ID: {rx.id}
                                      </span>
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => triggerPrescriptionAction("Download", rx)}
                                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                        >
                                          <FileDown className="w-3.5 h-3.5" /> Download
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => triggerPrescriptionAction("Print", rx)}
                                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                        >
                                          <Printer className="w-3.5 h-3.5" /> Print
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* TOOTH CHART MODAL */}
      <AnimatePresence>
        {isToothModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsToothModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 bg-slate-50">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedTooth ? `Tooth ${selectedTooth}` : "Tooth"} — Manage
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Add a procedure, update condition, or mark completed. Patient portal receives
                    read-only updates.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsToothModalOpen(false)}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4 text-sm text-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="block text-slate-500 text-xs font-bold">Procedure</label>
                    <input
                      type="text"
                      value={toothForm.procedure}
                      disabled={!isEditing}
                      onChange={(e) => setToothForm({ ...toothForm, procedure: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                      placeholder="e.g. Composite Filling"
                    />

                    <label className="block text-slate-500 text-xs font-bold">Status</label>
                    <select
                      value={toothForm.status}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setToothForm({
                          ...toothForm,
                          status: e.target.value as ToothTreatmentStatus,
                        })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    >
                      <option value="planned">Planned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <label className="block text-slate-500 text-xs font-bold">Notes</label>
                    <textarea
                      rows={3}
                      value={toothForm.notes}
                      disabled={!isEditing}
                      onChange={(e) => setToothForm({ ...toothForm, notes: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    />

                    <label className="block text-slate-500 text-xs font-bold">
                      Linked Treatment
                    </label>
                    <input
                      type="text"
                      value={toothForm.linkedTreatment}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setToothForm({ ...toothForm, linkedTreatment: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Recent Procedures</h4>
                        <span className="text-xs text-slate-400">
                          {selectedToothHistory.length} records
                        </span>
                      </div>
                      <div className="max-h-56 overflow-auto rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                        {selectedToothHistory.length ? (
                          selectedToothHistory.map((h) => {
                            const isTargeted = selectedProcedureId === h.id && !isAddingNew;

                            return (
                              <div
                                key={h.id}
                                className="p-2 bg-white rounded border border-slate-100"
                              >
                                <div className="flex items-center justify-between text-sm">
                                  <div>
                                    <div className="font-bold text-slate-800">{h.procedure}</div>
                                    <div className="text-xs text-slate-500">
                                      {h.performedAt} • {h.status.replace("_", " ")}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setToothHistory((prev) =>
                                          prev.filter((item) => item.id !== h.id),
                                        );
                                      }}
                                      className="text-xs text-red-600 font-bold ml-2"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                                {h.notes && (
                                  <p className="mt-2 text-xs text-slate-600">{h.notes}</p>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-slate-500">
                            No procedures recorded for this tooth.
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pt-3">
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2">
                          {!isEditing && selectedProcedureId && selectedToothHistory.length > 0 ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProcedureId(null);
                                  setIsAddingNew(true);
                                  setIsEditing(true);

                                  setToothForm({
                                    toothNumber: String(selectedTooth || ""),
                                    procedure: "",
                                    status: "planned",
                                    notes: "",
                                    linkedTreatment: "",
                                  });
                                }}
                                className="inline-flex items-center gap-1.5 py-1.5 px-4 text-xs font-bold rounded-xl border border-slate-200"
                              >
                                New Procedure
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentProc = selectedToothHistory.find(
                                    (p) => p.id === selectedProcedureId,
                                  );

                                  if (currentProc) {
                                    handleInitiateEdit(currentProc);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 py-1.5 px-4 text-xs font-bold rounded-xl border border-slate-200"
                              >
                                Edit Record
                              </button>
                            </>
                          ) : (
                            <>
                              {selectedToothHistory.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isAddingNew) {
                                      loadProcedureIntoForm(selectedToothHistory[0]);
                                    } else {
                                      setIsEditing(false);
                                    }
                                  }}
                                  className="py-1.5 px-3.5 text-xs font-bold rounded-xl"
                                >
                                  Cancel
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={
                                  isAddingNew ? handleAddToothProcedure : handleSaveToothUpdates
                                }
                                className="inline-flex items-center gap-1.5 py-1.5 px-4 text-xs font-bold text-white bg-teal-600 rounded-xl"
                              >
                                {isAddingNew ? "Add Procedure" : "Save Updates"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {toothActionMessage ? (
                        <div className="mt-2 text-xs text-emerald-700 font-medium">
                          {toothActionMessage}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INDEPENDENT PREMIUM INTERACTIVE MODAL POPOVER DISPATCH AREA */}
      <AnimatePresence>
        {selectedAppointment && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAppointment(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-6xl bg-card rounded-3xl border border-border/60 shadow-card overflow-hidden text-sm flex flex-col"
            >
              {/* Header */}
              <div className="p-6 bg-muted/30 border-b border-border/60 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-primary-soft text-primary shadow-xs">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-widest block">
                      Lumident Clinical Portal
                    </span>
                    <h4 className="font-display font-bold text-foreground text-xl tracking-tight mt-0.5">
                      {selectedAppointment.type}
                    </h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 p-6 overflow-y-auto max-h-[85vh]">
                {/* Left Column: Metadata & Actions */}
                <div className="md:col-span-2 space-y-5">
                  <div className="bg-muted/20 p-5 rounded-2xl border border-border/60 space-y-4 shadow-2xs">
                    <span className="text-xs uppercase font-bold text-foreground/50 block tracking-wider font-display">
                      Appointment Info
                    </span>

                    <div className="space-y-4 text-sm font-medium">
                      <div className="flex flex-col border-b border-border/40 pb-3">
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">
                          Target Window
                        </span>
                        <span className="font-semibold text-foreground text-base mt-0.5">
                          {selectedAppointment.time || "10:00 AM"} ({selectedAppointment.date})
                        </span>
                      </div>
                      <div className="flex flex-col border-b border-border/40 pb-3">
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">
                          Assigned Staff
                        </span>
                        <span className="font-semibold text-primary text-base mt-0.5">
                          {selectedAppointment.doctor_id &&
                          doctorNameMap[selectedAppointment.doctor_id]
                            ? doctorNameMap[selectedAppointment.doctor_id]
                            : selectedAppointment.provider || "Assigned Provider"}
                        </span>
                      </div>
                      <div className="flex flex-col pb-1">
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">
                          Routing Status
                        </span>
                        <div className="mt-1">
                          <span className="bg-primary-soft text-primary font-bold px-2.5 py-1 rounded-lg text-xs inline-block">
                            {selectedAppointment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const nextDate = prompt(
                          "Input micro-reschedule date parameter (YYYY-MM-DD):",
                          selectedAppointment?.date,
                        );
                        if (nextDate && selectedAppointment) {
                          const isUuid =
                            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                              selectedAppointment.id,
                            );

                          if (isUuid) {
                            const originalTimePart = selectedAppointment.time
                              ? (() => {
                                  try {
                                    const [time, modifier] = selectedAppointment.time.split(" ");
                                    const [initialHours, mins] = time.split(":");
                                    let hours = initialHours;
                                    if (modifier === "PM" && hours !== "12") {
                                      hours = String(parseInt(hours, 10) + 12);
                                    }
                                    if (modifier === "AM" && hours === "12") {
                                      hours = "00";
                                    }
                                    return `${hours.padStart(2, "0")}:${mins.padStart(2, "0")}:00`;
                                  } catch {
                                    return "10:00:00";
                                  }
                                })()
                              : "10:00:00";
                            const nextDateTime = `${nextDate}T${originalTimePart}+00:00`;

                            const { error } = await supabase
                              .from("appointments")
                              .update({
                                appointment_date: nextDateTime,
                              })
                              .eq("id", selectedAppointment.id);

                            if (error) {
                              console.error("Failed to reschedule appointment in database:", error);
                              alert("Failed to reschedule appointment: " + error.message);
                            } else {
                              setPatientData((prev) => ({
                                ...prev,
                                appointments: prev.appointments.map((a) =>
                                  a.id === selectedAppointment.id ? { ...a, date: nextDate } : a,
                                ),
                              }));
                              setSelectedAppointment(null);
                            }
                          } else {
                            // fallback for mock
                            setPatientData((prev) => ({
                              ...prev,
                              appointments: prev.appointments.map((a) =>
                                a.id === selectedAppointment.id ? { ...a, date: nextDate } : a,
                              ),
                            }));
                            setSelectedAppointment(null);
                          }
                        }
                      }}
                      className="w-full h-11 bg-primary-soft hover:bg-primary/10 text-primary font-bold rounded-xl transition text-center text-sm border border-primary/20 cursor-pointer"
                    >
                      Quick Reschedule Date
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAppointment(null)}
                      className="w-full h-11 bg-secondary hover:bg-muted text-foreground font-bold rounded-xl transition text-sm cursor-pointer"
                    >
                      Close Modal
                    </button>
                  </div>
                </div>

                {/* Right Column: Clinical Record Fields */}
                <div className="md:col-span-3 space-y-5 border-t md:border-t-0 md:border-l border-border/60 pt-6 md:pt-0 md:pl-6">
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
                    <div>
                      <span className="text-sm uppercase tracking-wider text-foreground/80 font-bold font-display">
                        Clinical Record
                      </span>
                    </div>
                    {(() => {
                      const dbRecord: AppointmentClinicalRecord =
                        selectedAppointment.clinicalRecord || {
                          chiefComplaint: "",
                          extraOralExamination: "",
                          oralExamination: "",
                          treatmentAdvised: "",
                          clinicalNotes: "",
                        };
                      const isDraftSaved =
                        appointmentClinicalDraft.chiefComplaint ===
                          (dbRecord.chiefComplaint || "") &&
                        appointmentClinicalDraft.extraOralExamination ===
                          (dbRecord.extraOralExamination || "") &&
                        appointmentClinicalDraft.oralExamination ===
                          (dbRecord.oralExamination || "") &&
                        appointmentClinicalDraft.treatmentAdvised ===
                          (dbRecord.treatmentAdvised || "") &&
                        appointmentClinicalDraft.clinicalNotes === (dbRecord.clinicalNotes || "");
                      return isDraftSaved ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-success/10 text-success font-bold border border-success/20">
                          Saved to Database
                        </span>
                      ) : (
                        <span className="text-xs px-3 py-1 rounded-full bg-warning/10 text-warning font-bold animate-pulse border border-warning/20">
                          Unsaved Draft
                        </span>
                      );
                    })()}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-foreground/80 tracking-wide mb-1.5 uppercase">
                        Chief Complaint
                      </label>
                      <textarea
                        rows={3}
                        value={appointmentClinicalDraft.chiefComplaint}
                        onChange={(e) =>
                          setAppointmentClinicalDraft((prev) => ({
                            ...prev,
                            chiefComplaint: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition shadow-xs resize-none h-24"
                        placeholder="Write the patient's chief complaint..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-foreground/80 tracking-wide mb-1.5 uppercase">
                          Extra Oral Examination
                        </label>
                        <textarea
                          rows={3}
                          value={appointmentClinicalDraft.extraOralExamination}
                          onChange={(e) =>
                            setAppointmentClinicalDraft((prev) => ({
                              ...prev,
                              extraOralExamination: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition shadow-xs resize-none h-24"
                          placeholder="Facial symmetry, TMJ, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-foreground/80 tracking-wide mb-1.5 uppercase">
                          Oral Examination
                        </label>
                        <textarea
                          rows={3}
                          value={appointmentClinicalDraft.oralExamination}
                          onChange={(e) =>
                            setAppointmentClinicalDraft((prev) => ({
                              ...prev,
                              oralExamination: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition shadow-xs resize-none h-24"
                          placeholder="Teeth, gums, soft tissues..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-foreground/80 tracking-wide mb-1.5 uppercase">
                        Treatment Advised
                      </label>
                      <textarea
                        rows={3}
                        value={appointmentClinicalDraft.treatmentAdvised}
                        onChange={(e) =>
                          setAppointmentClinicalDraft((prev) => ({
                            ...prev,
                            treatmentAdvised: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition shadow-xs resize-none h-24"
                        placeholder="Recommended procedural plan..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-foreground/80 tracking-wide mb-1.5 uppercase">
                        Clinical Notes
                      </label>
                      <textarea
                        rows={3}
                        value={appointmentClinicalDraft.clinicalNotes}
                        onChange={(e) =>
                          setAppointmentClinicalDraft((prev) => ({
                            ...prev,
                            clinicalNotes: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition shadow-xs resize-none h-28"
                        placeholder="Add visit observations, notes..."
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedAppointment) return;

                        const isUuid =
                          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                            selectedAppointment.id,
                          );

                        if (isUuid) {
                          console.log("SAVING CLINICAL VISIT RECORD", selectedAppointment.id);

                          // Check if record exists
                          const { data: existingRecords, error: checkError } = await supabase
                            .from("appointment_clinical_records")
                            .select("id")
                            .eq("appointment_id", selectedAppointment.id);

                          if (checkError) {
                            console.error("Error checking existing clinical records:", checkError);
                            alert("Error checking database: " + checkError.message);
                            return;
                          }

                          const payload = {
                            appointment_id: selectedAppointment.id,
                            chief_complaint: appointmentClinicalDraft.chiefComplaint,
                            extra_oral_examination: appointmentClinicalDraft.extraOralExamination,
                            oral_examination: appointmentClinicalDraft.oralExamination,
                            treatment_advised: appointmentClinicalDraft.treatmentAdvised,
                            clinical_notes: appointmentClinicalDraft.clinicalNotes,
                          };

                          let saveError;
                          if (existingRecords && existingRecords.length > 0) {
                            // Update
                            const { error } = await supabase
                              .from("appointment_clinical_records")
                              .update(payload as never)
                              .eq("appointment_id", selectedAppointment.id);
                            saveError = error;
                          } else {
                            // Insert
                            const { error } = await supabase
                              .from("appointment_clinical_records")
                              .insert(payload as never);
                            saveError = error;
                          }

                          if (saveError) {
                            console.error("Failed to save clinical record to database:", saveError);
                            alert("Failed to save clinical record: " + saveError.message);
                          } else {
                            // Success update local state
                            setPatientData((prev) => ({
                              ...prev,
                              appointments: prev.appointments.map((a) =>
                                a.id === selectedAppointment.id
                                  ? { ...a, clinicalRecord: appointmentClinicalDraft }
                                  : a,
                              ),
                            }));
                            setSelectedAppointment((prev) =>
                              prev ? { ...prev, clinicalRecord: appointmentClinicalDraft } : prev,
                            );
                          }
                        } else {
                          // fallback for mock
                          setPatientData((prev) => ({
                            ...prev,
                            appointments: prev.appointments.map((a) =>
                              a.id === selectedAppointment.id
                                ? { ...a, clinicalRecord: appointmentClinicalDraft }
                                : a,
                            ),
                          }));
                          setSelectedAppointment((prev) =>
                            prev ? { ...prev, clinicalRecord: appointmentClinicalDraft } : prev,
                          );
                        }
                      }}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-base shadow-soft hover:shadow-md flex justify-center items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-5 h-5" /> Save Clinical Visit Record
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE APPOINTMENT MODAL */}
      <AnimatePresence>
        {isCreateApptModalOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateApptModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-xl bg-card rounded-3xl border border-border/60 shadow-card overflow-hidden"
            >
              <div className="p-6 bg-muted/30 border-b border-border/60 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-primary-soft text-primary shadow-xs">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-widest block">
                      Scheduler Action
                    </span>
                    <h4 className="font-display font-bold text-foreground text-xl tracking-tight">
                      Create New Appointment
                    </h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateApptModalOpen(false)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 font-medium">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-foreground/80 tracking-wide mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={createApptForm.date}
                    onChange={(e) =>
                      setCreateApptForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full h-12 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition shadow-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-foreground/80 tracking-wide mb-1.5">
                    Service
                  </label>
                  <select
                    value={createApptForm.service}
                    onChange={(e) =>
                      setCreateApptForm((prev) => ({ ...prev, service: e.target.value }))
                    }
                    className="w-full h-12 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition shadow-xs appearance-none pr-8 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat cursor-pointer"
                  >
                    <option value="Routine Cleaning & Checkup">Routine Cleaning & Checkup</option>
                    <option value="Invisalign Consultation">Invisalign Consultation</option>
                    <option value="Root Canal">Root Canal</option>
                    <option value="Composite Filling">Composite Filling</option>
                    <option value="Extraction">Extraction</option>
                    <option value="Braces Adjustment">Braces Adjustment</option>
                    <option value="Deep Scaling">Deep Scaling</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-foreground/80 tracking-wide mb-1.5">
                    Doctor / Provider
                  </label>
                  <select
                    value={createApptForm.doctor_id}
                    onChange={(e) =>
                      setCreateApptForm((prev) => ({ ...prev, doctor_id: e.target.value }))
                    }
                    className="w-full h-12 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition shadow-xs appearance-none pr-8 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat cursor-pointer"
                  >
                    <option value="">Select Doctor</option>
                    {doctorsList.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.full_name || "Unknown Doctor"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-foreground/80 tracking-wide mb-1.5">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={createApptForm.notes}
                    onChange={(e) =>
                      setCreateApptForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition shadow-xs resize-none h-28"
                    placeholder="Appointment notes, symptoms, etc."
                  />
                </div>
              </div>

              <div className="p-6 bg-muted/20 border-t border-border/60 flex items-center justify-end gap-3 text-sm font-bold">
                <button
                  type="button"
                  onClick={() => setIsCreateApptModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary h-11 px-5 rounded-xl transition font-bold flex items-center justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!createApptForm.date) {
                      alert("Please specify a date.");
                      return;
                    }

                    // Save directly into appointments table
                    const payload = {
                      patient_id: patientData.id,
                      appointment_date: `${createApptForm.date}T10:00:00+00:00`,
                      service: createApptForm.service,
                      doctor_id: createApptForm.doctor_id || null,
                      notes: createApptForm.notes || "",
                      status: "confirmed" as const,
                      priority: "normal" as const,
                      duration_minutes: 45,
                    };

                    const { data, error } = await supabase
                      .from("appointments")
                      .insert(payload as never)
                      .select();

                    if (error) {
                      console.error("Failed to insert appointment:", error);
                      alert("Error saving appointment: " + error.message);
                      return;
                    }

                    const newAppt = data?.[0];
                    if (newAppt) {
                      const mapped = {
                        id: newAppt.id,
                        date: newAppt.appointment_date
                          ? newAppt.appointment_date.split("T")[0]
                          : "",
                        time: "10:00 AM",
                        provider:
                          newAppt.doctor_id && doctorNameMap[newAppt.doctor_id]
                            ? doctorNameMap[newAppt.doctor_id]
                            : "Assigned Provider",
                        type: newAppt.service || "Routine Cleaning & Checkup",
                        status: "Upcoming" as const,
                        clinicalRecord: undefined,
                        doctor_id: newAppt.doctor_id,
                      };

                      setPatientData((prev) => ({
                        ...prev,
                        appointments: [...prev.appointments, mapped],
                      }));
                    }

                    setIsCreateApptModalOpen(false);
                  }}
                  className="bg-primary-gradient text-primary-foreground h-11 px-6 rounded-xl transition shadow-soft hover:shadow-md hover:brightness-105 font-bold flex items-center justify-center cursor-pointer"
                >
                  Create Appointment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
