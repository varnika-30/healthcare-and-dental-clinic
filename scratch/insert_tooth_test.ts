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
  const { data, error } = await supabase
    .from("tooth_treatments")
    .insert({
      patient_id: "e8d64d20-fa4e-4ddf-bb74-272032bfd209",
      tooth_number: 14,
      notes: "Hello Note",
      status: "planned",
    } as any)
    .select();
  console.log("Insert response:", { data, error });

  if (data && data.length > 0) {
    console.log("Columns of tooth_treatments:", Object.keys(data[0]));
    // Clean up
    await supabase.from("tooth_treatments").delete().eq("id", data[0].id);
  }
}

main();
