import { supabase } from "@/integrations/supabase/client";

/** Get or create the patients row for the currently authenticated user. */
export async function getOrCreateMyPatient() {
  const { data: u } = await supabase.auth.getUser();
  const user = u.user;
  if (!user) return null;

  const { data: existing } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return existing;

  const meta = (user.user_metadata ?? {}) as Record<string, string>;
  const { data: created, error } = await supabase
    .from("patients")
    .insert({
      user_id: user.id,
      full_name: meta.full_name || user.email?.split("@")[0] || "Patient",
      phone: meta.phone || null,
      email: user.email ?? null,
    })
    .select("*")
    .single();
  if (error) {
    console.error("create patient failed", error);
    return null;
  }
  return created;
}

export const FDI_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const FDI_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
