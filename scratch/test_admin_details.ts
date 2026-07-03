import ws from "ws";
globalThis.WebSocket = ws as unknown as typeof WebSocket;

import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import * as fs from "fs";

// read .env manually
let url = "";
let key = "";
try {
  const envContent = fs.readFileSync(".env", "utf8");
  for (const line of envContent.split("\n")) {
    const matchUrl = line.match(/^\s*VITE_SUPABASE_URL\s*=\s*(.+)/);
    if (matchUrl) url = matchUrl[1].replace(/['"]/g, "").trim();
    const matchKey = line.match(/^\s*VITE_SUPABASE_PUBLISHABLE_KEY\s*=\s*(.+)/);
    if (matchKey) key = matchKey[1].replace(/['"]/g, "").trim();
  }
} catch (e) {
  console.error("Could not read .env file:", e);
}

const supabase = createClient(url, key);

async function testAdminDetailsForPatient(patientId: string) {
  console.log(`\n================ RUNNING ADMIN DETAILS FOR ID: ${patientId} ================`);
  try {
    const patientQuery = supabase.from("patients").select("*").eq("id", patientId).single();
    const patientResponse = await patientQuery;
    if (patientResponse.error) throw patientResponse.error;
    const dbPatient = patientResponse.data;

    // Fetch treatment plans
    const { data: dbPlans, error: plansError } = await supabase
      .from("treatment_plans")
      .select("*")
      .eq("patient_id", dbPatient.id);

    if (plansError) throw plansError;

    const planIds = dbPlans ? dbPlans.map((p) => p.id) : [];

    const stepsResponse =
      planIds.length > 0
        ? await supabase.from("treatment_steps").select("*").in("treatment_plan_id", planIds)
        : { data: null, error: null };

    if (stepsResponse.error) throw stepsResponse.error;
    const dbSteps = stepsResponse.data || [];

    // Fetch tooth treatments
    const toothTxResponse = await supabase
      .from("tooth_treatments")
      .select("*")
      .eq("patient_id", dbPatient.id);

    if (toothTxResponse.error) throw toothTxResponse.error;
    const dbToothTreatments = toothTxResponse.data || [];

    const mappedToothHistory = (dbToothTreatments || []).map((tt: any) => {
      const plan = (dbPlans || []).find((p) => p.id === tt.treatment_plan_id);
      const linkedTreatment = plan ? plan.title : "";

      return {
        id: tt.id,
        patientId: tt.patient_id,
        toothNumber: tt.tooth_number,
        procedure: tt.treatment_type || "",
        status: tt.status || "planned",
        notes: tt.notes || "",
        performedAt: tt.created_at
          ? tt.created_at.split("T")[0]
          : new Date().toISOString().split("T")[0],
        linkedTreatment,
      };
    });

    const mapStepStatusToUi = (status: string) => {
      switch (status) {
        case "completed":
          return "completed";
        case "in_progress":
          return "active";
        case "pending":
        default:
          return "upcoming";
      }
    };

    const mappedTreatments =
      dbPlans && dbPlans.length > 0
        ? dbPlans.map((plan) => {
            const planSteps = dbSteps
              .filter((step) => step.plan_id === plan.id)
              .sort((a, b) => a.step_order - b.step_order);

            const planToothTx = dbToothTreatments.filter((tt) => tt.plan_id === plan.id);
            const toothNumber =
              planToothTx.length > 0
                ? planToothTx.map((tt) => `#${tt.tooth_number}`).join(", ")
                : "General";

            let stages: any[] = [];
            let currentStage = "Consultation";

            if (planSteps.length > 0) {
              stages = planSteps.map((step) => ({
                name: step.title,
                status: mapStepStatusToUi(step.status),
              }));
              const activeStep = planSteps.find((step) => step.status === "in_progress");
              currentStage = activeStep ? activeStep.title : planSteps[0]?.title || "Consultation";
            }

            return {
              id: plan.id,
              title: plan.title,
              status: plan.status,
              stages,
              currentStage,
              toothNumber,
            };
          })
        : [];

    console.log(
      "Success! mappedTreatments count:",
      mappedTreatments.length,
      "mappedToothHistory count:",
      mappedToothHistory.length,
    );
  } catch (err) {
    console.error("Caught error:", err);
  }
}

async function main() {
  const { data: patients } = await supabase.from("patients").select("id");
  const patientIds = (patients || []).map((p) => p.id);
  for (const id of patientIds) {
    await testAdminDetailsForPatient(id);
  }
}

main();
