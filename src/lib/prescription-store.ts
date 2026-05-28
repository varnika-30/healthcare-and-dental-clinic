export interface MedicineEntry {
  name: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface PrescriptionRecord {
  id: string;
  date: string;
  clinicName: string;
  prescribingDoctor: string;
  licenseNumber: string;
  issueDate: string;
  linkedTreatment: string;
  associatedTreatment: string;
  medicines: MedicineEntry[];
  dosageInstructions: string;
  followUpRecommendation: string;
  status: "Active" | "Completed" | "Expired";
}

interface PrescriptionStore {
  [patientId: string]: PrescriptionRecord[];
}

const PRESCRIPTION_STORE: PrescriptionStore = {
  "P-8832": [
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
};

export function getPatientPrescriptions(patientId: string) {
  return PRESCRIPTION_STORE[patientId] ? [...PRESCRIPTION_STORE[patientId]] : [];
}

export function addPatientPrescription(patientId: string, prescription: PrescriptionRecord) {
  if (!PRESCRIPTION_STORE[patientId]) {
    PRESCRIPTION_STORE[patientId] = [];
  }
  PRESCRIPTION_STORE[patientId] = [prescription, ...PRESCRIPTION_STORE[patientId]];
  return prescription;
}
