import { supabase } from "@/integrations/supabase/client";

/** Get or create the patients row for the currently authenticated user. */
export async function getOrCreateMyPatient() {
  // Temporary testing setup resolving Priya Sharma
  const { data: existing } = await supabase
    .from("patients")
    .select("*")
    .eq("id", "e8d64d20-fa4e-4ddf-bb74-272032bfd209")
    .maybeSingle();
  return existing || null;
}

export const FDI_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const FDI_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
