import { supabase } from "@/integrations/supabase/client";

/** Get the patient row linked to the currently authenticated user. */
export async function getOrCreateMyPatient() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Check if we are already linked to a patient record
  const { data: existing } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return existing;

  // Manual linking workflow is required. No auto-linking or auto-creation.
  return null;
}

export const FDI_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const FDI_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
