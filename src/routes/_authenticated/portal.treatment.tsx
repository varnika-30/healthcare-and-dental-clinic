import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Calendar,
  Stethoscope,
  Activity,
  ChevronRight,
  FileText,
  User,
  ExternalLink,
  Circle,
  X,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ==========================================
// TANSTACK ROUTE DEFINITION
// ==========================================
export const Route = createFileRoute("/_authenticated/portal/treatment")({
  component: TreatmentProgressPage,
});

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface TreatmentStep {
  id: string;
  name: string;
  description: string;
  status: "completed" | "active" | "upcoming";
  date?: string;
  careInstructions?: string;
}

interface ActiveTreatmentPlan {
  id: string;
  title: string;
  doctor: string;
  startDate: string;
  overallProgress: number;
  notes: string;
  stageLabel: string;
  steps: TreatmentStep[];
  nextAppointment: {
    date: string;
    time: string;
    purpose: string;
  };
}

interface PastTreatment {
  id: string;
  title: string;
  toothReference?: string;
  completedDate: string;
  doctor: string;
  summary: string;
  statusLabel: string;
}

// ==========================================
// REALISTIC CLINIC DATASTORE POOLS
// ==========================================
const ACTIVE_TREATMENTS_POOL: ActiveTreatmentPlan[] = [
  {
    id: "invisalign",
    title: "Clear Aligner Therapy (Invisalign)",
    doctor: "Dr. Aisha Rahman",
    startDate: "Feb 10, 2026",
    overallProgress: 60,
    stageLabel: "Stage 3 of 5",
    notes:
      "Patient is tracking well on tray 12 of 20. Interproximal reduction (IPR) completed successfully on lower anterior quadrant. Maintain strict 22-hour daily compliance.",
    steps: [
      {
        id: "inv-1",
        name: "Initial Consultation & 3D Scanning",
        description:
          "Digital impressions captured via iTero element scanner and customized digital plan approved.",
        status: "completed",
        date: "Feb 10, 2026",
        careInstructions:
          "Review initial ClinCheck digital treatment setup shared via portal vault link.",
      },
      {
        id: "inv-2",
        name: "Attachment Placement & Initial Trays",
        description:
          "Composite tooth attachments bonded and first set of tracking trays delivered to patient.",
        status: "completed",
        date: "Feb 24, 2026",
        careInstructions:
          "Use chewies for 5 minutes daily to ensure optimal tray seating. Avoid hot water when rinsing trays.",
      },
      {
        id: "inv-3",
        name: "Mid-Course Assessment",
        description:
          "Verification of tracking accuracy, validation of bite space, and distribution of trays 11-16.",
        status: "active",
        date: "May 26, 2026",
        careInstructions:
          "Wear active alignment trays strictly 22 hours per day. Transition to tray 13 as scheduled next week.",
      },
      {
        id: "inv-4",
        name: "Final Tray Refinements",
        description:
          "Minor detailing of minor rotations, comprehensive scan verification for precision finishing.",
        status: "upcoming",
        careInstructions:
          "Secondary refinements scanning phase will evaluate any persistent rotational discrepancies.",
      },
      {
        id: "inv-5",
        name: "Retention Phase Setup",
        description:
          "Removal of clinical anchors and configuration of permanent protective night Vivera retainers.",
        status: "upcoming",
        careInstructions:
          "Nighttime protective retainer protocol will execute immediately following complete attachment removal.",
      },
    ],
    nextAppointment: {
      date: "Tue · May 26, 2026",
      time: "10:30 AM",
      purpose: "Mid-course aligner check-in & delivery of next tracking set",
    },
  },
  {
    id: "root-canal",
    title: "Root Canal Therapy",
    doctor: "Dr. Aisha Rahman",
    startDate: "Apr 14, 2026",
    overallProgress: 66,
    stageLabel: "Stage 2 of 3",
    notes:
      "Canal bio-mechanical preparation fully completed. Local inflammation has completely settled. Final appointment will handle complete gutta-percha obturation.",
    steps: [
      {
        id: "rc-1",
        name: "Pulpectomy & Emergency Debridement",
        description:
          "Removal of infected inner pulp tissue, absolute disinfecting flush, and emergency sedative temporary dressing application.",
        status: "completed",
        date: "Apr 14, 2026",
        careInstructions:
          "Avoid chewing directly on the left mandibular quadrant until permanent protection is installed.",
      },
      {
        id: "rc-2",
        name: "Canal Shaping & Disinfection",
        description:
          "Endodontic rotary instrumentation shaping of distal and mesial canals, combined with deep chemical irrigation matrix treatment.",
        status: "completed",
        date: "May 12, 2026",
        careInstructions:
          "Mild tenderness is normal. Use warm saltwater rinses up to 3 times a day as needed.",
      },
      {
        id: "rc-3",
        name: "Obturation & Permanent Core Build-up",
        description:
          "Complete dimensional sealing of structural root canals using customized sterile root filling materials.",
        status: "active",
        date: "Jun 02, 2026",
        careInstructions:
          "A permanent structural protective overlay crown restoration should follow within 14-21 calendar days.",
      },
    ],
    nextAppointment: {
      date: "Tue · Jun 02, 2026",
      time: "02:15 PM",
      purpose: "Final endodontic root sealing and structural core build-up",
    },
  },
  {
    id: "deep-cleaning",
    title: "Periodontal Deep Cleaning Plan",
    doctor: "Dr. Marco Liu",
    startDate: "May 05, 2026",
    overallProgress: 50,
    stageLabel: "Stage 2 of 4",
    notes:
      "Right side quadrants finished seamlessly. Pocket depths demonstrating early architecture improvements. Left side planned next.",
    steps: [
      {
        id: "dc-1",
        name: "Right Maxillary/Mandibular Scaling",
        description:
          "Ultrasonic sub-gingival calculus removal and root planing on quadrants 1 and 4 under localized anesthesia.",
        status: "completed",
        date: "May 05, 2026",
        careInstructions:
          "Use prescribed antiseptic chlorhexidine mouthwash twice daily for 7 days without swallowing.",
      },
      {
        id: "dc-2",
        name: "Left Maxillary/Mandibular Scaling",
        description:
          "Sub-gingival bio-film remediation and target root micro-smoothing on quadrants 2 and 3.",
        status: "active",
        date: "Jun 16, 2026",
        careInstructions:
          "Continue flossing thoroughly down into the sulcus space once tenderness recedes.",
      },
      {
        id: "dc-3",
        name: "Periodontal Maintenance Check-In",
        description:
          "Comprehensive 4-week tissue architecture assessment and calibration metrics charting.",
        status: "upcoming",
        careInstructions:
          "Pocket depth comparisons will evaluate the localized standard stabilization curve.",
      },
    ],
    nextAppointment: {
      date: "Tue · Jun 16, 2026",
      time: "09:00 AM",
      purpose: "Left side sub-gingival scaling & planning completion",
    },
  },
];

const PAST_TREATMENTS: PastTreatment[] = [
  {
    id: "past-1",
    title: "Emergency Diagnostic Evaluation",
    toothReference: "Tooth #19",
    completedDate: "Apr 12, 2026",
    doctor: "Dr. Aisha Rahman",
    summary:
      "Targeted localized diagnostic radiography mapping to evaluate active left molar structural breakdown triggers.",
    statusLabel: "Archived Log",
  },
  {
    id: "past-2",
    title: "Composite Restoration",
    toothReference: "Tooth #14 Disto-Occlusal",
    completedDate: "Nov 04, 2025",
    doctor: "Dr. Aisha Rahman",
    summary:
      "Removal of localized dentin decay followed by structural aesthetic mercury-free composite fill layer reconstruction.",
    statusLabel: "Completed",
  },
  {
    id: "past-3",
    title: "Comprehensive Preventive Prophylaxis",
    completedDate: "Sep 18, 2025",
    doctor: "Dr. Marco Liu",
    summary:
      "Routine dental hygiene maintenance, surface stain scaling, and topical high-potency fluoride varnish treatment application.",
    statusLabel: "Completed",
  },
  {
    id: "past-4",
    title: "Bicuspid Direct Resin Sealant Placement",
    toothReference: "Tooth #4 & #5",
    completedDate: "May 14, 2025",
    doctor: "Dr. Aisha Rahman",
    summary:
      "Preventive preventative micro-fissure resin conditioning treatment configured to guard localized anatomical pits from structural decay vectors.",
    statusLabel: "Completed",
  },
  {
    id: "past-5",
    title: "Diagnostic Bitewing Radiography Cluster",
    completedDate: "Jan 10, 2025",
    doctor: "Dr. Aisha Rahman",
    summary:
      "Interproximal dynamic radiographic monitoring evaluating standard alveolar bone profiles and potential micro-lesions.",
    statusLabel: "Archived Log",
  },
  {
    id: "past-6",
    title: "Palliative Sedative Sedation Dressing",
    toothReference: "Tooth #3",
    completedDate: "Oct 22, 2024",
    doctor: "Dr. Marco Liu",
    summary:
      "Emergency localized zinc-oxide eugenol application executed to comfortably mute hyperemic nerve signals prior to final structural repair protocols.",
    statusLabel: "Completed",
  },
];

// Helper to map doctor-defined treatments to ActiveTreatmentPlan interface
const mapDoctorTreatmentToActivePlan = (tx: any): ActiveTreatmentPlan => {
  const steps: TreatmentStep[] = (tx.stages || []).map((stage: any, idx: number) => ({
    id: `${tx.id}-step-${idx}`,
    name: stage.name,
    description: `Stage ${idx + 1} of the ${tx.procedure} protocol.`,
    status: stage.status || "upcoming",
    careInstructions:
      stage.status === "active"
        ? "Follow lead provider's guidance during this active stage."
        : undefined,
  }));

  const totalSteps = steps.length;
  const completedStepsCount = steps.filter((s) => s.status === "completed").length;
  const progressPercent = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

  const activeStepIdx = (tx.stages || []).findIndex((s: any) => s.status === "active");
  const stageLabelText =
    activeStepIdx !== -1
      ? `Stage ${activeStepIdx + 1} of ${totalSteps}`
      : completedStepsCount === totalSteps
        ? "Completed"
        : `Stage 1 of ${totalSteps}`;

  return {
    id: tx.id,
    title: `${tx.procedure} (Tooth ${tx.toothNumber})`,
    doctor: "Dr. Aisha Rahman",
    startDate: tx.date || "May 20, 2026",
    overallProgress: progressPercent,
    stageLabel: stageLabelText,
    notes: tx.notes || "Treatment tracking dynamically managed by clinical provider.",
    steps,
    nextAppointment: {
      date: "Tue · Jun 02, 2026",
      time: "02:15 PM",
      purpose: `Follow-up for ${tx.procedure}`,
    },
  };
};

const getCombinedActiveTreatments = (): ActiveTreatmentPlan[] => {
  const stored = localStorage.getItem("patient_ecosystem_P-8832");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.treatments)) {
        // Map ongoing/pending/paused treatments to active plans
        const doctorPlans = parsed.treatments
          .filter((tx: any) => tx.status !== "Completed")
          .map(mapDoctorTreatmentToActivePlan);

        if (doctorPlans.length > 0) {
          return doctorPlans;
        }
      }
    } catch (e) {
      console.error("Failed to parse patient treatments from localStorage:", e);
    }
  }

  // Fallback to static Eleanor Vance's treatment if no localStorage exists
  const defaultData = {
    treatments: [
      {
        id: "TX-901",
        date: "May 20, 2026",
        toothNumber: "#14, #15",
        procedure: "Composite Filling (2 Surfaces)",
        notes: "Deep decay isolated. Clean margins achieved. Patient tolerated anesthesia well.",
        status: "Ongoing",
        currentStage: "Filling",
        stages: [
          { name: "Consultation", status: "completed" },
          { name: "Decay Removal", status: "completed" },
          { name: "Filling", status: "active" },
          { name: "Polishing", status: "upcoming" },
          { name: "Completed", status: "upcoming" },
        ],
      },
    ],
  };
  return defaultData.treatments.map(mapDoctorTreatmentToActivePlan);
};

export default function TreatmentProgressPage() {
  const activePlans = getCombinedActiveTreatments();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(activePlans[0]?.id || "invisalign");
  const [selectedStep, setSelectedStep] = useState<TreatmentStep | null>(null);
  const [showFullHistory, setShowFullHistory] = useState<boolean>(false);

  const currentActivePlan = activePlans.find((p) => p.id === selectedPlanId) || activePlans[0];

  const visiblePastTreatments = showFullHistory ? PAST_TREATMENTS : PAST_TREATMENTS.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 md:p-6 -mt-2 font-sans antialiased text-slate-900">
      <div className="-mt-4 mx-auto max-w-5xl space-y-6">
        {/* ==========================================
            SUBTLE HEADER SECTION
           ========================================== */}
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-teal-600" />
            Treatment Journey
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Interactive visualization of your operational care timelines and clinical adjustments.
          </p>
        </div>

        {/* ==========================================
            ROW 1: MAIN TIMELINE & SIDEBAR COUPLING
           ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ROW 1 LEFT: ACTIVE TIMELINE PROGRESS BLOCK */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-sm space-y-8 relative">
              {/* Profile/Plan Banner Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-50 pb-5">
                <div className="space-y-0.5">
                  <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/10">
                    Active Plan View
                  </span>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-1 transition-all duration-200">
                    {currentActivePlan.title}
                  </h2>
                  <p className="text-sm text-slate-400 font-medium flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-teal-600" /> Lead Provider:{" "}
                    {currentActivePlan.doctor}
                  </p>
                </div>

                {/* Progress Circle Arc Gauge Component */}
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 shrink-0 self-start sm:self-center">
                  <div className="relative h-10 w-10 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <motion.path
                        key={currentActivePlan.id}
                        initial={{ strokeDasharray: "0, 100" }}
                        animate={{ strokeDasharray: `${currentActivePlan.overallProgress}, 100` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-teal-600"
                        strokeWidth="3"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-bold text-slate-700">
                      {currentActivePlan.overallProgress}%
                    </span>
                  </div>
                  <div className="leading-tight">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Completed
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                      {currentActivePlan.stageLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* INFOGRAPHIC TIMELINE TRACK FEED */}
              <div className="relative pl-8 space-y-5 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-1 before:bg-slate-100">
                {currentActivePlan.steps.map((step) => {
                  const isCompleted = step.status === "completed";
                  const isActive = step.status === "active";
                  const isUpcoming = step.status === "upcoming";

                  return (
                    <motion.div
                      key={step.id}
                      whileHover={{ x: 4 }}
                      onClick={() => setSelectedStep(step)}
                      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-teal-50/30 to-transparent border-teal-200 shadow-sm shadow-teal-500/5 ring-1 ring-teal-500/5"
                          : isUpcoming
                            ? "border-slate-100/70 opacity-60 bg-slate-50/10"
                            : "border-slate-100 hover:bg-slate-50/40"
                      }`}
                    >
                      {/* Timeline Stem Node Bullets */}
                      <div className="absolute -left-[24px] sm:-left-[24px] bg-white p-0.5 rounded-full z-10">
                        {isCompleted ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm shadow-teal-600/20">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        ) : isActive ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-600 border border-teal-300 shadow-sm shadow-teal-500/10 ring-4 ring-teal-500/10">
                            <Clock className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-slate-200 text-slate-300">
                            <Circle className="h-2 w-2 stroke-slate-300 fill-slate-300" />
                          </div>
                        )}
                      </div>

                      {/* Info Context Text Items */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h4
                            className={`text-sm font-bold tracking-tight ${isActive ? "text-teal-950 text-base" : "text-slate-800"}`}
                          >
                            {step.name}
                          </h4>
                          {isActive && (
                            <span className="inline-flex items-center rounded bg-teal-100/60 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 uppercase tracking-wide">
                              In Progress
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 font-medium line-clamp-1">
                          {step.description}
                        </p>
                      </div>

                      {/* Meta Context Dates Stamp */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-50">
                        {step.date ? (
                          <span className="text-xs text-slate-400 font-mono font-semibold">
                            {step.date}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 font-medium italic">
                            Pending Schedule
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-teal-600 transition">
                          <span>Details</span>
                          <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ROW 1 RIGHT: SIDEBAR CONTAINER STACK */}
          <div className="lg:col-span-1 space-y-4">
            {/* NEXT SCHEDULED STEP CARD */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-12 w-12 bg-teal-50/40 rounded-bl-full pointer-events-none flex items-center justify-center pl-3 pb-3">
                <Calendar className="h-3.5 w-3.5 text-teal-600/50" />
              </div>

              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Next Scheduled Step
              </h3>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/70 space-y-2.5">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-slate-800 block transition-all">
                    {currentActivePlan.nextAppointment.date}
                  </span>
                  <span className="text-xs text-teal-600 font-mono font-bold block">
                    {currentActivePlan.nextAppointment.time}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-500 border-t border-slate-200/60 pt-2 leading-snug min-h-[40px]">
                  {currentActivePlan.nextAppointment.purpose}
                </p>
              </div>
            </div>

            {/* MOVED SECTION: OTHER ACTIVE TREATMENTS (Stacked cleanly on the right side) */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-teal-600" />
                  Other Active Treatments
                </h3>
              </div>

              <div className="space-y-2">
                {activePlans.map((plan) => {
                  const isSelected = plan.id === selectedPlanId;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 outline-none ${
                        isSelected
                          ? "border-teal-500 ring-2 ring-teal-500/10 shadow-sm bg-gradient-to-b from-teal-50/10 to-transparent"
                          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/40"
                      }`}
                    >
                      <div className="flex flex-col space-y-1.5">
                        <div className="min-w-0">
                          <h4
                            className={`text-sm font-bold tracking-tight truncate transition-colors ${isSelected ? "text-teal-700" : "text-slate-800"}`}
                          >
                            {plan.title}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium truncate">
                            {plan.doctor}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                            {plan.stageLabel}
                          </span>
                          <span className="text-xs font-bold text-teal-600 font-mono">
                            {plan.overallProgress}%
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            ROW 2: FULL WIDTH - COMPLETED HISTORY ARCHIVE
           ========================================== */}
        <div className="w-full">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 flex-wrap gap-2">
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="h-5 w-5 text-teal-600" />
                Completed History Archive
              </h3>
              <span className="text-xs font-bold font-mono text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                Total Files: {PAST_TREATMENTS.length} Records
              </span>
            </div>

            {/* SCALABLE ARCHIVE SCROLL CONTAINER */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                showFullHistory
                  ? "max-height-[410px] overflow-y-auto pr-2 space-y-3 custom-scrollbar"
                  : "space-y-3"
              }`}
              style={{ maxHeight: showFullHistory ? "410px" : "none" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {visiblePastTreatments.map((past) => (
                  <div
                    key={past.id}
                    className="p-4 border border-slate-100/80 rounded-xl bg-slate-50/20 space-y-2 hover:bg-slate-50/60 hover:border-slate-200/80 transition duration-200 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center rounded-md bg-emerald-50/60 border border-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                          {past.statusLabel}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono font-bold">
                          {past.completedDate}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                          {past.title}
                        </h4>
                        {past.toothReference ? (
                          <span className="inline-block text-[11px] text-teal-600 font-mono font-bold mt-0.5 bg-teal-50/40 px-1.5 py-0.2 rounded">
                            {past.toothReference}
                          </span>
                        ) : (
                          <span className="inline-block text-[11px] text-slate-400 font-mono italic mt-0.5">
                            General Procedure
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs font-medium text-slate-400 border-t border-slate-100/60 pt-2 line-clamp-2 leading-relaxed">
                      {past.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* EXPANSION CONTROL TRIGGER BUTTON */}
            {PAST_TREATMENTS.length > 3 && (
              <div className="pt-2 flex justify-center border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowFullHistory(!showFullHistory)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50/50 hover:bg-teal-50 border border-teal-100/60 transition-all shadow-3xs"
                >
                  {showFullHistory ? (
                    <>
                      <span>Collapse Historical View</span>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Show Full History ({PAST_TREATMENTS.length})</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==========================================
          MODAL INTERACTIVE ACTION POP-UP
         ========================================== */}
      <AnimatePresence>
        {selectedStep && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStep(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl p-5 md:p-6 space-y-5 z-10 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      selectedStep.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : selectedStep.status === "active"
                          ? "bg-teal-50 text-teal-700 border border-teal-100"
                          : "bg-slate-50 text-slate-500 border border-slate-100"
                    }`}
                  >
                    {selectedStep.status}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
                    {selectedStep.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStep(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="text-sm text-slate-600 space-y-4">
                <p className="leading-relaxed font-medium text-slate-500 bg-slate-50/60 p-3 rounded-xl border border-slate-100/50">
                  {selectedStep.description}
                </p>

                {selectedStep.careInstructions && (
                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-teal-600" />
                      Care Directives & Instructions
                    </div>
                    <p className="font-medium text-slate-500 bg-teal-50/10 p-3 rounded-xl border border-teal-100/40 leading-relaxed text-sm">
                      {selectedStep.careInstructions}
                    </p>
                  </div>
                )}

                {selectedStep.status === "active" && (
                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-teal-600" />
                      Clinical Adjustments Note
                    </div>
                    <p className="font-medium text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed text-sm">
                      {currentActivePlan.notes}
                    </p>
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 text-xs text-teal-600 font-bold hover:underline cursor-pointer">
                        <ExternalLink className="h-3 w-3" /> View Align 3D Model Map
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {selectedStep.date && (
                <div className="pt-3 border-t border-slate-100 text-xs font-mono text-slate-400 flex justify-between items-center">
                  <span>Log Verification: Checked & Synced</span>
                  <span className="font-semibold">{selectedStep.date}</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
