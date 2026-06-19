import ws from "ws";
globalThis.WebSocket = ws as unknown as typeof WebSocket;

import { createClient } from "@supabase/supabase-js";
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

async function simulate(patientId: string) {
  console.log(`\n================ SIMULATING FOR ID: ${patientId} ================`);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId);
  console.log("isUuid:", isUuid);

  let patientQuery = supabase.from("patients").select("*");
  if (isUuid) {
    patientQuery = patientQuery.eq("id", patientId);
  } else {
    patientQuery = patientQuery.limit(1);
  }

  const { data: dbPatients, error: patientError } = await patientQuery;
  if (patientError) {
    console.error("Patient query error:", patientError);
    return;
  }

  const dbPatient = dbPatients?.[0];
  if (!dbPatient) {
    console.log("No patient found");
    return;
  }
  console.log("Loaded Patient:", dbPatient.id, `${dbPatient.first_name} ${dbPatient.last_name}`);

  // Fetch treatment plans
  const { data: dbPlans, error: plansError } = await supabase
    .from("treatment_plans")
    .select("*")
    .eq("patient_id", dbPatient.id);

  if (plansError) {
    console.error("Plans query error:", plansError);
    return;
  }

  console.log("Treatment plans count:", dbPlans?.length);
  console.log(
    "Treatment plans:",
    dbPlans?.map((p) => ({ id: p.id, title: p.title, status: p.status })),
  );
}

async function main() {
  // Test with mock patient ID "P-8832"
  await simulate("P-8832");

  // Test with Rahul Sharma UUID
  await simulate("48d42e4f-de9a-467a-9020-c0ca0203fd97");

  // Test with Priya Sharma UUID
  await simulate("e8d64d20-fa4e-4ddf-bb74-272032bfd209");
}

main();
