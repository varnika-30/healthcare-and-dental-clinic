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
  console.log("\n================ RUNNING ONGOING TREATMENTS CHECK ================");
  try {
    const { data, error } = await supabase
      .from("treatment_plans")
      .select(
        `
        *,
        patients (*)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log("Plans returned:", data?.length);
    if (data && data.length > 0) {
      const mapped = data.map((plan) => {
        const firstName = String((plan.patients as Record<string, unknown>)?.first_name ?? "");
        const lastName = String((plan.patients as Record<string, unknown>)?.last_name ?? "");
        return {
          id: plan.id,
          patientName: `${firstName} ${lastName}`.trim() || "Unknown Patient",
          treatment: plan.title,
        };
      });
      console.log("Mapped plans successfully! Sample:", mapped[0]);
    }
  } catch (err) {
    console.error("Caught error:", err);
  }
}

main();
