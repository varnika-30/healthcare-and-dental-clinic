import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

console.log("Supabase URL:", url);
console.log("Supabase Key length:", key.length);

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.from("patients").select("*");
  if (error) {
    console.error("Error fetching patients:", error);
  } else {
    console.log("Patients count:", data?.length);
    console.log("Patients:", JSON.stringify(data, null, 2));
  }
  
  const { data: family, error: familyError } = await supabase.from("family_links").select("*");
  if (familyError) {
    console.error("Error fetching family links:", familyError);
  } else {
    console.log("Family Links count:", family?.length);
    console.log("Family Links:", JSON.stringify(family, null, 2));
  }
}

main();
