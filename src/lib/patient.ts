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

  // 2. Check if an existing patient record has matching email or phone with user_id = null
  const userPhone = user.user_metadata?.phone || null;
  const userEmail = user.email || null;

  if (userEmail || userPhone) {
    let query = supabase.from("patients").select("*").is("user_id", null);
    if (userEmail && userPhone) {
      query = query.or(`email.eq.${userEmail},phone.eq.${userPhone}`);
    } else if (userEmail) {
      query = query.eq("email", userEmail);
    } else {
      query = query.eq("phone", userPhone);
    }

    const { data: matches } = await query;
    if (matches && matches.length > 0) {
      // Securely link to the first matching patient record to prevent duplicates
      const bestMatch = matches[0];
      const { data: linked, error: linkError } = await supabase
        .from("patients")
        .update({ user_id: user.id })
        .eq("id", bestMatch.id)
        .select("*")
        .maybeSingle();

      if (!linkError && linked) {
        console.log("Successfully linked existing clinic patient record:", linked.id);
        return linked;
      }
    }
  }

  // 3. No match found, so promote the user profile to a new official patient record
  const { data: created, error } = await supabase
    .from("patients")
    .insert({
      user_id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "New Patient",
      phone: userPhone,
      email: userEmail,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Error auto-creating patient profile:", error);
    return null;
  }

  return created || null;
}

export const FDI_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const FDI_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
