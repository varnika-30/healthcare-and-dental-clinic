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
  const { data: steps, error: stepsError } = await supabase.from("treatment_steps").select("*");
  console.log("=== treatment_steps ===");
  if (stepsError) console.error(stepsError);
  else console.log(JSON.stringify(steps, null, 2));

  const { data: appts, error: apptsError } = await supabase.from("appointments").select("*");
  console.log("=== appointments ===");
  if (apptsError) console.error(apptsError);
  else console.log(JSON.stringify(appts, null, 2));
}

main();
