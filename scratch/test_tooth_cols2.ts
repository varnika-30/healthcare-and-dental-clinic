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
  const columnsToTest = [
    "diagnosis",
    "comments",
    "title",
    "label",
    "type",
    "created_at",
    "updated_at",
  ];

  for (const col of columnsToTest) {
    const { error } = await supabase.from("tooth_treatments").select(col).limit(1);
    if (error) {
      console.log(`Column '${col}': FAILED - ${error.message}`);
    } else {
      console.log(`Column '${col}': EXISTS`);
    }
  }
}

main();
