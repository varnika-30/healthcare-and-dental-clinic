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

async function main() {
  const { data: prescriptions, error: rxError } = await supabase.from("prescriptions").select("*");
  if (rxError) {
    console.error("Error fetching prescriptions:", rxError);
  } else {
    console.log("Prescriptions:", JSON.stringify(prescriptions, null, 2));
  }

  const { data: items, error: itemsError } = await supabase.from("prescription_items").select("*");
  if (itemsError) {
    console.error("Error fetching prescription items:", itemsError);
  } else {
    console.log("Prescription Items:", JSON.stringify(items, null, 2));
  }
}

main();
