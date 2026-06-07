import React, { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Phone, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ==========================================
// TANSTACK ROUTE DEFINITION
// ==========================================
export const Route = createFileRoute("/_authenticated/admin/patients")({
  component: PatientManagementPage,
});

// ==========================================
// TYPES & INTERFACES
// ==========================================
type PatientFilterStatus = "all" | "active" | "new" | "follow-up" | "pending-payment";
type PaymentBadgeStatus = "paid" | "partial" | "overdue";
type RelationshipType = "spouse" | "child" | "parent" | "emergency-contact" | "referral-link";

interface EcosystemRelation {
  type: RelationshipType;
  name: string;
  id?: string;
}

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  lastTreatment: {
    type: string;
    date: string;
  };
  upcomingAppointment: string | null;
  paymentStatus: PaymentBadgeStatus;
  balanceDue: number;
  category: "active" | "new" | "follow-up";
  joinedDate: string;
  ecosystemRelations?: EcosystemRelation[];
}

// ==========================================
// ECOSYSTEM REGISTRY & RELATIONSHIPS
// ==========================================
interface PatientEcosystem {
  primaryPatientId: string;
  familyMembers: Array<{ name: string; relation: string; id?: string }>;
  emergencyContact?: { name: string; relation: string; phone?: string };
  referredBy?: { name: string; id?: string };
  referredPatients?: Array<{ name: string; id?: string }>;
}

const PATIENT_ECOSYSTEM_REGISTRY: Record<string, PatientEcosystem> = {
  "P-8832": {
    primaryPatientId: "P-8832",
    familyMembers: [
      { name: "Thomas Vance", relation: "spouse" },
      { name: "Lily Vance", relation: "child" },
    ],
    emergencyContact: { name: "Thomas Vance", relation: "spouse", phone: "(555) 901-4433" },
    referredBy: { name: "Dr. Marcus Sterling", id: "REF-039" },
    referredPatients: [{ name: "Julianne Moore" }],
  },
};

const getEcosystemRelations = (patientId: string): EcosystemRelation[] => {
  const ecosystem = PATIENT_ECOSYSTEM_REGISTRY[patientId];
  if (!ecosystem) return [];

  const relations: EcosystemRelation[] = [];

  ecosystem.familyMembers?.forEach((member) => {
    relations.push({
      type: member.relation as RelationshipType,
      name: member.name,
      id: member.id,
    });
  });

  if (ecosystem.emergencyContact) {
    relations.push({
      type: "emergency-contact",
      name: ecosystem.emergencyContact.name,
      id: undefined,
    });
  }

  if (ecosystem.referredBy) {
    relations.push({
      type: "referral-link",
      name: ecosystem.referredBy.name,
      id: ecosystem.referredBy.id,
    });
  }

  ecosystem.referredPatients?.forEach((patient) => {
    relations.push({
      type: "referral-link",
      name: patient.name,
      id: patient.id,
    });
  });

  return relations;
};

const getEcosystemMembers = (patientId: string): Set<string> => {
  const members = new Set<string>();
  members.add(patientId);

  const ecosystem = PATIENT_ECOSYSTEM_REGISTRY[patientId];
  if (!ecosystem) return members;

  ecosystem.familyMembers?.forEach((member) => {
    if (member.id) members.add(member.id);
  });

  return members;
};

const normalizeSearchTerm = (term: string): string => {
  return term.toLowerCase().trim();
};

const matchesSearchTerm = (term: string, searchNorm: string): boolean => {
  return normalizeSearchTerm(term).includes(searchNorm);
};

const getEcosystemAwareResults = (
  patientsToSearch: PatientRecord[],
  query: string,
): PatientRecord[] => {
  if (!query.trim()) return patientsToSearch;

  const searchNorm = normalizeSearchTerm(query);
  const matchedEcosystemIds = new Set<string>();

  patientsToSearch.forEach((patient) => {
    const ecosystem = PATIENT_ECOSYSTEM_REGISTRY[patient.id];

    if (
      matchesSearchTerm(patient.name, searchNorm) ||
      matchesSearchTerm(patient.id, searchNorm) ||
      patient.phone.includes(query)
    ) {
      getEcosystemMembers(patient.id).forEach((id) => matchedEcosystemIds.add(id));
      return;
    }

    ecosystem?.familyMembers?.forEach((member) => {
      if (matchesSearchTerm(member.name, searchNorm)) {
        getEcosystemMembers(patient.id).forEach((id) => matchedEcosystemIds.add(id));
      }
    });

    if (ecosystem?.emergencyContact) {
      if (
        matchesSearchTerm(ecosystem.emergencyContact.name, searchNorm) ||
        ecosystem.emergencyContact.phone?.includes(query)
      ) {
        getEcosystemMembers(patient.id).forEach((id) => matchedEcosystemIds.add(id));
      }
    }

    if (ecosystem?.referredBy) {
      if (matchesSearchTerm(ecosystem.referredBy.name, searchNorm)) {
        getEcosystemMembers(patient.id).forEach((id) => matchedEcosystemIds.add(id));
      }
    }

    ecosystem?.referredPatients?.forEach((referred) => {
      if (matchesSearchTerm(referred.name, searchNorm)) {
        getEcosystemMembers(patient.id).forEach((id) => matchedEcosystemIds.add(id));
      }
    });
  });

  // Return patients that match or are in matched ecosystems
  return patientsToSearch.filter((p) => matchedEcosystemIds.has(p.id));
};

// ==========================================
// REALISTIC PRIVATE CLINIC PATIENT DATA
// ==========================================
const INITIAL_PATIENTS: PatientRecord[] = [
  {
    id: "P-8832",
    name: "Eleanor Vance",
    age: 28,
    gender: "Female",
    phone: "(555) 432-1098",
    lastTreatment: { type: "X-Ray & Initial Assessment", date: "2026-05-20" },
    upcomingAppointment: "2026-05-26T09:00:00",
    paymentStatus: "paid",
    balanceDue: 0,
    category: "new",
    joinedDate: "2026-05-20",
  },
  {
    id: "P-9831",
    name: "Samuel Oakley",
    age: 42,
    gender: "Male",
    phone: "(555) 234-5678",
    lastTreatment: { type: "Deep Scaling & Root Planing", date: "2025-11-24" },
    upcomingAppointment: "2026-05-26T10:30:00",
    paymentStatus: "paid",
    balanceDue: 0,
    category: "active",
    joinedDate: "2024-03-12",
  },
  {
    id: "P-1102",
    name: "Marcus Brody",
    age: 55,
    gender: "Male",
    phone: "(555) 876-1122",
    lastTreatment: { type: "Composite Filling (Molar)", date: "2026-05-15" },
    upcomingAppointment: "2026-05-26T13:00:00",
    paymentStatus: "partial",
    balanceDue: 180,
    category: "follow-up",
    joinedDate: "2023-08-19",
  },
  {
    id: "P-4491",
    name: "Clara Oswald",
    age: 31,
    gender: "Female",
    phone: "(555) 901-2345",
    lastTreatment: { type: "In-Office Laser Whitening", date: "2026-05-26" },
    upcomingAppointment: null,
    paymentStatus: "paid",
    balanceDue: 0,
    category: "active",
    joinedDate: "2025-01-10",
  },
  {
    id: "P-3091",
    name: "Arthur Pendelton",
    age: 67,
    gender: "Male",
    phone: "(555) 654-7890",
    lastTreatment: { type: "Crown Preparation", date: "2026-05-11" },
    upcomingAppointment: "2026-06-02T11:00:00",
    paymentStatus: "overdue",
    balanceDue: 650,
    category: "follow-up",
    joinedDate: "2022-11-04",
  },
  {
    id: "P-5521",
    name: "Miriam Vance",
    age: 34,
    gender: "Female",
    phone: "(555) 221-9988",
    lastTreatment: { type: "Routine Prophylaxis", date: "2026-05-21" },
    upcomingAppointment: null,
    paymentStatus: "paid",
    balanceDue: 0,
    category: "active",
    joinedDate: "2024-09-30",
  },
];

export default function PatientManagementPage() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [newPatient, setNewPatient] = useState({
    name: "",
    phone: "",
    email: "",
    age: "",
    gender: "",
    treatment: "",
    notes: "",
  });
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  useEffect(() => {
    async function loadPatients() {
      const { data, error } = await supabase
        .from("patients")
        .select("*");

      console.log("PATIENTS:", data);
      console.log("ERROR:", error);

      if (data) {
        setPatients(
          data.map((patient) => ({
            id: patient.id,
            name: `${patient.first_name} ${patient.last_name}`,
            age: 0,
            gender: patient.gender || "Unknown",
            phone: patient.phone || "",
            lastTreatment: {
              type: "No Treatment",
              date: "",
            },
            upcomingAppointment: null,
            paymentStatus: "paid",
            balanceDue: 0,
            category: "new",
            joinedDate: patient.created_at,
          }))
        );
      }
    }

    loadPatients();
  }, []);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<PatientFilterStatus>("all");

  const categoryLabelMap: Record<PatientRecord["category"], string> = {
    active: "Active Care",
    new: "New Patient",
    "follow-up": "Follow-up",
  };

  // ==========================================
  // FILTER & SEARCH LOGIC
  // ==========================================
  const filteredPatients = useMemo(() => {
    // First apply ecosystem-aware search
    let results = getEcosystemAwareResults(patients, searchQuery);

    // Then apply category filter
    results = results.filter((patient) => {
      switch (activeFilter) {
        case "active":
          return patient.category === "active";
        case "new":
          return patient.category === "new";
        case "follow-up":
          return patient.category === "follow-up";
        case "pending-payment":
          return patient.paymentStatus === "overdue" || patient.paymentStatus === "partial";
        default:
          return true;
      }
    });

    // Add ecosystem relations to each patient for display
    return results.map((patient) => ({
      ...patient,
      ecosystemRelations: getEcosystemRelations(patient.id),
    }));
  }, [patients, searchQuery, activeFilter]);

  // ==========================================
  // INSIGHTS & STATS COMPUTATIONS
  // ==========================================
  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return "No scheduled visit";
    const date = new Date(isoString);
    return (
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }) +
      " at " +
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  return (
    <DashboardShell>
      <div className="space-y-5">
        {/* CORE WORKSPACE HEADER */}
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patients</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Search patients, appointment dates, and care status in a clean operational list.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-2xs transition self-start sm:self-center"
          >
            <UserPlus className="h-4 w-4 stroke-[2.5]" />
            Register Patient
          </button>
          {showRegisterModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Register New Patient</h2>

                  <button
                    onClick={() => setShowRegisterModal(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    placeholder="Full Name"
                    value={newPatient.name}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        name: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2"
                  />

                  <input
                    placeholder="Phone Number"
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        phone: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2"
                  />

                  <input
                    placeholder="Email Address"
                    value={newPatient.email}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        email: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2"
                  />

                  <input
                    placeholder="Age"
                    value={newPatient.age}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        age: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2"
                  />

                  <select
                    value={newPatient.gender}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        gender: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>

                  <input
                    placeholder="Treatment Type"
                    value={newPatient.treatment}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        treatment: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <textarea
                  placeholder="Medical Notes"
                  rows={4}
                  value={newPatient.notes}
                  onChange={(e) =>
                    setNewPatient({
                      ...newPatient,
                      notes: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowRegisterModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      const patient: PatientRecord = {
                        id: Date.now().toString(),

                        name: newPatient.name,

                        age: Number(newPatient.age),

                        gender: newPatient.gender,

                        phone: newPatient.phone,

                        lastTreatment: {
                          type: newPatient.treatment || "General Consultation",
                          date: new Date().toLocaleDateString(),
                        },

                        upcomingAppointment: null,

                        paymentStatus: "partial",

                        balanceDue: 0,

                        category: "new",

                        joinedDate: new Date().toLocaleDateString(),
                      };

                      setPatients((prev) => [patient, ...prev]);

                      try {
                        if (typeof window !== "undefined" && window.localStorage) {
                          const ecosystem = {
                            id: patient.id,
                            profile: {
                              fullName: patient.name,
                              email: "",
                              phone: patient.phone,
                              secondaryPhone: "",
                              age: patient.age,
                              gender: patient.gender,
                              sex: patient.gender || "",
                              occupation: "",
                              bloodGroup: "",
                              address: { street: "", city: "", state: "", zipCode: "" },
                              emergencyContact: { name: "", relation: "", phone: "" },
                              medicalProfile: {
                                allergies: [],
                                medications: [],
                                conditions: [],
                                notes: "",
                                familyHistory: "",
                              },
                            },
                            appointments: [],
                            treatments: [],
                            prescriptions: [],
                            billingLogs: [],
                            notes: [],
                            family: [],
                            referrals: {
                              referredBy: null,
                              referredPatients: [],
                              trackingNotes: "",
                            },
                          };

                          localStorage.setItem(
                            `patient_ecosystem_${patient.id}`,
                            JSON.stringify(ecosystem),
                          );
                        }
                      } catch (e) {
                        // eslint-disable-next-line no-console
                        console.warn("Failed to persist patient ecosystem:", e);
                      }

                      setShowRegisterModal(false);

                      setNewPatient({
                        name: "",
                        phone: "",
                        email: "",
                        age: "",
                        gender: "",
                        treatment: "",
                        notes: "",
                      });
                    }}
                    className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    Save Patient
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* OPERATIONAL CONTROLS & CONTROLLER FILTER ROW */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-3 border border-slate-100 rounded-2xl shadow-2xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, patient ID, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl outline-none transition focus:border-teal-500 focus:bg-white w-full font-medium"
            />
          </div>

          <div className="flex items-center overflow-x-auto gap-1 bg-slate-100/70 p-1 rounded-xl shrink-0 scrollbar-none">
            {(["all", "active", "new", "follow-up", "pending-payment"] as const).map((filter) => {
              const labelMap: Record<PatientFilterStatus, string> = {
                all: "All Records",
                active: "Active Care",
                new: "New Patients",
                "follow-up": "Follow-ups",
                "pending-payment": "Pending Balance",
              };
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    activeFilter === filter
                      ? "bg-white text-slate-900 shadow-3xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {labelMap[filter]}
                </button>
              );
            })}
          </div>
        </div>

        {/* PATIENT LIST WORKSPACE */}
        <div className="space-y-3.5">
          <AnimatePresence mode="popLayout">
            {filteredPatients.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center bg-white border border-slate-100 rounded-2xl text-sm font-medium text-slate-400 shadow-2xs"
              >
                No clinic records match your search criteria.
              </motion.div>
            ) : (
              filteredPatients.map((patient) => (
                <motion.div
                  key={patient.id}
                  layoutId={`patient-card-${patient.id}`}
                  className="group"
                >
                  {/* Clickable Card Link Context */}
                  <Link
                    to="/admin/patient-details/$patientId"
                    params={{ patientId: patient.id }}
                    className="block text-left no-underline outline-none rounded-2xl cursor-pointer"
                  >
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs transition-all duration-200 group-hover:border-teal-500/40 group-hover:shadow-md">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-4 lg:max-w-2xl">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-bold text-slate-900 text-lg tracking-tight group-hover:text-teal-700 transition-colors">
                              {patient.name}
                            </h3>
                            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              {patient.id}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                            <span>
                              {patient.age} yrs • {patient.gender}
                            </span>
                            <span className="inline-flex items-center gap-2 text-slate-600">
                              <Phone className="h-4 w-4 text-slate-400" />
                              {patient.phone}
                            </span>
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
                              {categoryLabelMap[patient.category]}
                            </span>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Last Visit
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-900">
                                {patient.lastTreatment.type}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {new Date(patient.lastTreatment.date).toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Next Visit
                              </p>
                              <p
                                className={`mt-2 text-sm font-semibold ${patient.upcomingAppointment ? "text-teal-700" : "text-slate-500"}`}
                              >
                                {patient.upcomingAppointment
                                  ? formatDateTime(patient.upcomingAppointment)
                                  : "No scheduled visit"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 shrink-0 text-right lg:text-left">
                          <div className="rounded-3xl border border-slate-100 bg-white p-4 text-sm text-slate-600">
                            <p className="font-bold text-slate-900">Treatment</p>
                            <p className="mt-2 leading-tight">{patient.lastTreatment.type}</p>
                          </div>

                          {patient.ecosystemRelations?.length ? (
                            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                              <p className="font-bold text-slate-900">Ecosystem</p>
                              <div className="mt-2 space-y-2">
                                {patient.ecosystemRelations.slice(0, 3).map((relation, index) => (
                                  <div
                                    key={`${relation.name}-${index}`}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                                      {relation.type === "spouse"
                                        ? "S"
                                        : relation.type === "child"
                                          ? "C"
                                          : relation.type === "emergency-contact"
                                            ? "E"
                                            : "R"}
                                    </span>
                                    <div>
                                      <p className="text-xs font-semibold text-slate-800">
                                        {relation.name}
                                      </p>
                                      <p className="text-[11px] text-slate-500 uppercase tracking-[0.2em]">
                                        {relation.type.replace("-", " ")}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardShell>
  );
}
