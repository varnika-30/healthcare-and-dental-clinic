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

console.log("Supabase URL:", url);
console.log("Supabase Key length:", key.length);

const supabase = createClient(url, key);

async function main() {
  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("id, first_name, last_name");
  if (patientsError) {
    console.error("Error fetching patients:", patientsError);
  } else {
    console.log("Patients count:", patients?.length);
    console.log("Patients:", JSON.stringify(patients, null, 2));
  }

  const { data: plans, error: plansError } = await supabase.from("treatment_plans").select("*");
  if (plansError) {
    console.error("Error fetching treatment plans:", plansError);
  } else {
    console.log("Treatment Plans count:", plans?.length);
    console.log("Treatment Plans:", JSON.stringify(plans, null, 2));
  }

  const { data: toothTx, error: toothTxError } = await supabase
    .from("tooth_treatments")
    .select("*");
  if (toothTxError) {
    console.error("Error fetching tooth treatments:", toothTxError);
  } else {
    console.log("Tooth Treatments count:", toothTx?.length);
    console.log("Tooth Treatments:", JSON.stringify(toothTx, null, 2));
  }
}

main();
