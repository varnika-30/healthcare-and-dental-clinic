import ws from "ws";
globalThis.WebSocket = ws as unknown as typeof WebSocket;

import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
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

async function testMappingForPatient(patientId: string) {
  console.log(`\n================ RUNNING FOR ID: ${patientId} ================`);
  try {
    const [plansRes, appointmentsRes, toothRes] = await Promise.all([
      supabase
        .from("treatment_plans")
        .select("*, tooth_treatments(*), treatment_steps(*)")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId)
        .gte("appointment_date", new Date().toISOString())
        .order("appointment_date")
        .limit(1),
      supabase
        .from("tooth_treatments")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false, nullsFirst: false }),
    ]);

    if (plansRes.error) throw plansRes.error;
    if (appointmentsRes.error) throw appointmentsRes.error;
    if (toothRes.error) throw toothRes.error;

    const plans = plansRes.data || [];
    const nextAppt = appointmentsRes.data?.[0] || null;

    // Lookup doctor profiles
    const doctorIds = Array.from(
      new Set(plans.map((p) => p.doctor_id).filter((id): id is string => !!id)),
    );
    let doctors: any[] = [];
    if (doctorIds.length > 0) {
      const { data: docsRes } = await supabase
        .from("profiles")
        .select("id, full_name, specialization")
        .in("id", doctorIds);
      doctors = docsRes || [];
    }

    const active = plans
      .filter((p) => p.status === "planned" || p.status === "in_progress")
      .map((p) => {
        const doc = doctors.find((d) => d.id === p.doctor_id);
        const teeth = p.tooth_treatments || [];
        const toothReference =
          teeth.length > 0
            ? `Tooth ${teeth.map((t: any) => `#${t.tooth_number}`).join(", ")}`
            : undefined;

        const steps = (p.treatment_steps || [])
          .sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))
          .map((s: any, idx: number) => ({
            id: s.id,
            name: s.step_name || `Stage ${idx + 1}`,
            description: s.notes || "No details provided.",
            status:
              s.status === "completed"
                ? ("completed" as const)
                : s.status === "in_progress"
                  ? ("active" as const)
                  : ("upcoming" as const),
            date: s.completed_at ? format(new Date(s.completed_at), "MMM d, yyyy") : undefined,
            careInstructions: s.notes || undefined,
          }));

        const completedCount = steps.filter((s: any) => s.status === "completed").length;
        const progressPercent =
          steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
        const activeStep = steps.find((s: any) => s.status === "active") || steps[0];

        return {
          id: p.id,
          title: toothReference ? `${p.title} (${toothReference})` : p.title,
          doctor: doc?.full_name || "Lumident Clinician",
          startDate: p.start_date
            ? format(new Date(p.start_date), "MMM d, yyyy")
            : format(new Date(p.created_at), "MMM d, yyyy"),
          overallProgress: progressPercent,
          stageLabel: activeStep ? activeStep.name : "Initial Stage",
          notes: p.notes || "No clinical adjustments noted.",
          steps,
          nextAppointment: nextAppt
            ? {
                date: format(new Date(nextAppt.appointment_date), "eee · MMM dd, yyyy"),
                time: format(new Date(nextAppt.appointment_date), "p"),
                purpose: nextAppt.service || "Progress Check-In",
              }
            : {
                date: "—",
                time: "Flexible",
                purpose: "No upcoming visits scheduled.",
              },
        };
      });

    const past = plans
      .filter((p) => p.status === "completed" || p.status === "cancelled")
      .map((p) => {
        const doc = doctors.find((d) => d.id === p.doctor_id);
        const teeth = p.tooth_treatments || [];
        const toothReference =
          teeth.length > 0
            ? `Tooth ${teeth.map((t: any) => `#${t.tooth_number}`).join(", ")}`
            : undefined;

        return {
          id: p.id,
          title: p.title,
          toothReference,
          completedDate: p.end_date
            ? format(new Date(p.end_date), "MMM d, yyyy")
            : format(new Date(p.updated_at), "MMM d, yyyy"),
          doctor: doc?.full_name || "Lumident Clinician",
          summary: p.description || "Concluded clinical session.",
          statusLabel: p.status === "completed" ? "Completed" : "Cancelled",
        };
      });

    const toothHistory = (toothRes.data || []).map((t: any) => ({
      id: t.id,
      tooth_number: t.tooth_number,
      procedure: t.treatment_type || "Dental Procedure",
      status: t.status || "planned",
      performed_at: t.created_at,
      notes: t.notes || "",
    }));

    console.log(
      "Success! Active plans:",
      active.length,
      "Past:",
      past.length,
      "Tooth History count:",
      toothHistory.length,
    );
    if (toothHistory.length > 0) {
      console.log("Sample tooth history item:", toothHistory[0]);
    }
  } catch (err) {
    console.error("Mapping error caught:", err);
  }
}

async function main() {
  const { data: patients } = await supabase.from("patients").select("id");
  const patientIds = (patients || []).map((p) => p.id);
  for (const id of patientIds) {
    await testMappingForPatient(id);
  }
}

main();
