import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateMyPatient } from "@/lib/patient";
import { toast } from "sonner";
import { AlertCircle, X, CheckCircle2 } from "lucide-react";

interface AppointmentBookingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ServiceProfile {
  id: string;
  name: string;
}

const AVAILABLE_SERVICES: ServiceProfile[] = [
  { id: "s1", name: "Dental Cleaning & Examination" },
  { id: "s2", name: "Invisalign Progress Check" },
  { id: "s3", name: "Deep Root Canal Therapy" },
  { id: "s4", name: "Teeth Whitening Session" },
];

function validatePhone(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "Enter a valid phone number (at least 10 digits).";
  if (digits.length > 15) return "Phone number is too long.";
  return undefined;
}

export function AppointmentBookingModal({
  open,
  onClose,
  onSuccess,
}: AppointmentBookingModalProps) {
  const queryClient = useQueryClient();

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [appointmentDate, setAppointmentDate] = useState("");
  const [hasTimePreference, setHasTimePreference] = useState<"no" | "yes">("no");
  const [preferredTimeText, setPreferredTimeText] = useState("");
  const [notes, setNotes] = useState("");
  const [patientStatus, setPatientStatus] = useState<"existing" | "new">("existing");
  const [dateError, setDateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear fields when modal closes or opens
  useEffect(() => {
    if (!open) {
      setSelectedServiceId("");
      setPatientPhone("");
      setPhoneError(undefined);
      setAppointmentDate("");
      setHasTimePreference("no");
      setPreferredTimeText("");
      setNotes("");
      setPatientStatus("existing");
      setDateError("");
      setIsSubmitting(false);
    }
  }, [open]);

  const getMinDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneValidation = validatePhone(patientPhone);
    if (phoneValidation) {
      setPhoneError(phoneValidation);
      toast.error(phoneValidation);
      return;
    }
    if (!selectedServiceId || !appointmentDate) {
      toast.error("Please complete all required fields before requesting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const patient = await getOrCreateMyPatient();
      if (!patient) {
        throw new Error("Patient record could not be resolved.");
      }

      const service = AVAILABLE_SERVICES.find((s) => s.id === selectedServiceId);
      const fallbackTimeStr = "09:00:00";
      const combinedDateTime = new Date(`${appointmentDate}T${fallbackTimeStr}`).toISOString();

      let formattedNotes = notes.trim();
      if (hasTimePreference === "yes" && preferredTimeText.trim()) {
        formattedNotes = `[Pref Time: ${preferredTimeText.trim()}] ${formattedNotes}`;
      }
      if (patientPhone.trim()) {
        formattedNotes = `[Phone: ${patientPhone.trim()}] ${formattedNotes}`;
      }

      const { error } = await supabase.from("appointments").insert({
        patient_id: patient.id,
        appointment_date: combinedDateTime,
        status: "requested",
        service: service?.name || "General Dental Consultation",
        notes: formattedNotes || null,
      });

      if (error) throw error;

      toast.success("Appointment Request Submitted", {
        description:
          "Your request has been sent to the clinic. A coordinator will contact you shortly.",
      });

      // Invalidate target keys to trigger full UI data sync
      await queryClient.invalidateQueries({ queryKey: ["portal-appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["portal-overview"] });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Booking error:", err);
      toast.error(err.message || "Failed to submit booking request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-md animate-in zoom-in-95 space-y-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-2xl duration-200 sm:p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Schedule Clinical Care
            </h3>
            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400 sm:text-sm">
              Request your preferred slot. A coordinator will assign your clinician and confirm
              within 2 business hours.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Have you visited our clinic before?
            </span>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => setPatientStatus("existing")}
                className={`flex items-center justify-center rounded-lg border text-xs font-semibold tracking-wide transition-all ${
                  patientStatus === "existing"
                    ? "border-teal-600 bg-teal-50 text-teal-700 font-bold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setPatientStatus("new")}
                className={`flex items-center justify-center rounded-lg border text-xs font-semibold tracking-wide transition-all ${
                  patientStatus === "new"
                    ? "border-teal-600 bg-teal-50 text-teal-700 font-bold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                No
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="clinical-service"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Clinical Service Required
            </label>
            <select
              id="clinical-service"
              required
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm transition-all focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">Select treatment type...</option>
              {AVAILABLE_SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="patient-phone"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Phone Number
            </label>
            <input
              id="patient-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              maxLength={20}
              placeholder="(415) 555-0142"
              value={patientPhone}
              onChange={(e) => {
                setPatientPhone(e.target.value);
                if (phoneError) setPhoneError(validatePhone(e.target.value));
              }}
              onBlur={() => setPhoneError(validatePhone(patientPhone))}
              className={`h-12 w-full rounded-lg border bg-white px-3 text-base sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${
                phoneError
                  ? "border-rose-300 focus:border-rose-500"
                  : "border-slate-200 focus:border-teal-600"
              }`}
            />
            {phoneError && (
              <p className="flex items-center gap-1 text-xs font-medium text-rose-500">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {phoneError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="preferred-date"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Preferred Date
              </label>
              <input
                id="preferred-date"
                type="date"
                required
                min={getMinDateString()}
                value={appointmentDate}
                onChange={(e) => {
                  setAppointmentDate(e.target.value);
                  if (dateError) setDateError("");
                }}
                className={`h-11 w-full rounded-lg border px-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 border-slate-200 focus:border-teal-600`}
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Do you have a preferred time?
              </span>
              <div className="grid grid-cols-2 gap-2 h-11">
                <button
                  type="button"
                  onClick={() => {
                    setHasTimePreference("no");
                    setPreferredTimeText("");
                  }}
                  className={`flex items-center justify-center rounded-lg border text-xs font-semibold tracking-wide transition-all ${
                    hasTimePreference === "no"
                      ? "border-teal-600 bg-teal-50 text-teal-700 font-bold"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  No preference
                </button>
                <button
                  type="button"
                  onClick={() => setHasTimePreference("yes")}
                  className={`flex items-center justify-center rounded-lg border text-xs font-semibold tracking-wide transition-all ${
                    hasTimePreference === "yes"
                      ? "border-teal-600 bg-teal-50 text-teal-700 font-bold"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>

          {hasTimePreference === "yes" && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <label
                htmlFor="preferred-time-text"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Preferred Time Window Details
              </label>
              <input
                id="preferred-time-text"
                type="text"
                required
                placeholder="e.g. 4 PM – 6 PM, Morning preferred, After 5 PM"
                value={preferredTimeText}
                onChange={(e) => setPreferredTimeText(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm transition-all focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="health-notes"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Health Notes / Symptoms (Optional)
            </label>
            <textarea
              id="health-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe any current sensitivity..."
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm transition-all focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="order-2 h-11 rounded-lg px-3 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-50 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="order-1 h-11 rounded-lg bg-teal-600 px-5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-teal-700 disabled:opacity-60 sm:order-2"
            >
              {isSubmitting ? "Submitting..." : "Confirm Booking Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
