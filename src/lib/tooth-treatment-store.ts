export type ToothTreatmentStatus = "planned" | "in_progress" | "completed";

export interface ToothProcedureEntry {
  id: string;
  patientId: string;
  toothNumber: number;
  procedure: string;
  status: ToothTreatmentStatus;
  notes: string;
  performedAt: string;
  linkedTreatment: string;
}

interface ToothTreatmentStore {
  [patientId: string]: ToothProcedureEntry[];
}

const TOOTH_TREATMENT_STORE: ToothTreatmentStore = {
  "P-8832": [
    {
      id: "TT-1001",
      patientId: "P-8832",
      toothNumber: 14,
      procedure: "Composite Filling",
      status: "completed",
      notes: "Occlusion verified and margins polished.",
      performedAt: "2026-05-20",
      linkedTreatment: "Composite Filling (#14, #15)",
    },
    {
      id: "TT-1002",
      patientId: "P-8832",
      toothNumber: 15,
      procedure: "Cavity preparation",
      status: "in_progress",
      notes: "Deep caries identified on mesial surface.",
      performedAt: "2026-05-20",
      linkedTreatment: "Composite Filling (#14, #15)",
    },
    {
      id: "TT-1003",
      patientId: "P-8832",
      toothNumber: 9,
      procedure: "Routine cleaning",
      status: "completed",
      notes: "Polishing with medium paste completed.",
      performedAt: "2026-04-10",
      linkedTreatment: "Hygiene Visit",
    },
  ],
};

export function getPatientToothHistory(patientId: string): ToothProcedureEntry[] {
  return TOOTH_TREATMENT_STORE[patientId] ? [...TOOTH_TREATMENT_STORE[patientId]] : [];
}

export function savePatientToothProcedure(
  patientId: string,
  procedureEntry: Omit<ToothProcedureEntry, "id" | "patientId" | "performedAt">,
) {
  const now = new Date().toISOString().split("T")[0];
  const entry: ToothProcedureEntry = {
    ...procedureEntry,
    id: `TT-${Math.floor(1000 + Math.random() * 9000)}`,
    patientId,
    performedAt: now,
  };

  if (!TOOTH_TREATMENT_STORE[patientId]) {
    TOOTH_TREATMENT_STORE[patientId] = [];
  }

  TOOTH_TREATMENT_STORE[patientId] = [entry, ...TOOTH_TREATMENT_STORE[patientId]];
  return entry;
}

export function updatePatientToothProcedure(patientId: string, updatedEntry: ToothProcedureEntry) {
  if (!TOOTH_TREATMENT_STORE[patientId]) {
    TOOTH_TREATMENT_STORE[patientId] = [];
  }

  TOOTH_TREATMENT_STORE[patientId] = TOOTH_TREATMENT_STORE[patientId].map((entry) =>
    entry.id === updatedEntry.id ? { ...entry, ...updatedEntry } : entry,
  );

  return updatedEntry;
}
