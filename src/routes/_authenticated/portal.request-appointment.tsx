import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Stethoscope,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/request-appointment")({
  component: RequestAppointmentPage,
});

// ==========================================
// TYPES & CONSTANTS
// ==========================================
interface AppointmentForm {
  treatmentId: string;
  preferredDate: string;
  hasSpecificTime: boolean;
  preferredTime: string;
  additionalNotes: string;
}

const TREATMENTS = [
  { id: "follow-up", name: "Follow-Up Visit" },
  { id: "first-appointment", name: "First Appointment Intake" },
  { id: "regular-checkup", name: "Regular Routine Checkup" },
  { id: "pain", name: "Pain & Emergency Assessment" },
];

// Mock database list of fully booked slots for validation display
const BOOKED_SLOTS = [
  { date: "2026-05-22", time: "18:00" },
  { date: "2026-05-22", time: "19:30" },
  { date: "2026-05-25", time: "17:30" },
];

const TIME_SLOTS = [
  { value: "17:30", label: "5:30 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "18:30", label: "6:30 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "19:30", label: "7:30 PM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "20:30", label: "8:30 PM" },
  { value: "21:00", label: "9:00 PM" },
  { value: "21:30", label: "9:30 PM" },
];

export default function RequestAppointmentPage() {
  // ==========================================
  // COMPONENT STATE HOOKS
  // ==========================================
  const [form, setForm] = useState<AppointmentForm>({
    treatmentId: "",
    preferredDate: "",
    hasSpecificTime: false,
    preferredTime: "",
    additionalNotes: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AppointmentForm, string>>>({});

  // ==========================================
  // CALCULATIONS & HELPERS
  // ==========================================
  const selectedTreatment = TREATMENTS.find((t) => t.id === form.treatmentId);

  const getMinDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const isSlotBooked = (timeValue: string) => {
    if (!form.preferredDate) return false;
    return BOOKED_SLOTS.some((slot) => slot.date === form.preferredDate && slot.time === timeValue);
  };

  // ==========================================
  // ACTION HANDLERS
  // ==========================================
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof AppointmentForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setForm((prev) => ({
      ...prev,
      hasSpecificTime: checked,
      preferredTime: checked ? prev.preferredTime : "",
    }));
    if (!checked && errors.preferredTime) {
      setErrors((prev) => ({ ...prev, preferredTime: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AppointmentForm, string>> = {};
    if (!form.treatmentId) newErrors.treatmentId = "Please pick a treatment reason.";
    if (!form.preferredDate) newErrors.preferredDate = "Please choose a calendar date.";
    if (form.hasSpecificTime && !form.preferredTime) {
      newErrors.preferredTime = "Please pick an available time slot option.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitted(true);
    }
  };

  const handleReset = () => {
    setForm({
      treatmentId: "",
      preferredDate: "",
      hasSpecificTime: false,
      preferredTime: "",
      additionalNotes: "",
    });
    setIsSubmitted(false);
    setErrors({});
  };

  // ==========================================
  // SUCCESS FEEDBACK SUMMARY
  // ==========================================
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/30 p-6 md:p-10 flex items-center justify-center">
        <div className="mx-auto max-w-md w-full bg-white rounded-3xl border border-teal-100 p-8 text-center shadow-xl shadow-teal-900/5 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 ring-4 ring-teal-50/50">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
            Request Received!
          </h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Your appointment reservation request has been transmitted. Our desk team will reach out
            shortly to lock in your calendar spot.
          </p>

          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-left space-y-3">
            <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Overview Summary
            </div>
            <div className="text-sm text-slate-700 font-medium flex justify-between">
              <span className="text-slate-400">Reason:</span> {selectedTreatment?.name}
            </div>
            <div className="text-sm text-slate-700 font-medium flex justify-between">
              <span className="text-slate-400">Date:</span> {form.preferredDate}
            </div>
            <div className="text-sm text-slate-700 font-medium flex justify-between">
              <span className="text-slate-400">Timing:</span>{" "}
              {form.hasSpecificTime ? form.preferredTime : "Anytime Available"}
            </div>
          </div>

          <button
            onClick={handleReset}
            className="mt-8 w-full inline-flex items-center justify-center rounded-full bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 shadow-teal-600/10"
          >
            Submit New Request
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // DATA INTERACTIVE ENTRY VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/30 p-6 md:p-10">
      <div className="-mt-12 mx-auto max-w-5xl space-y-8">
        {/* Header Dashboard Frame */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/10">
            <Calendar className="h-3.5 w-3.5" />
            Scheduling System
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Book a Chair Appointment
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose your required treatment layout option and state your scheduling criteria below.
          </p>
        </div>

        {/* Master Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Request Form Column */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 space-y-6 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm"
          >
            {/* Treatment Selector Dropdown */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-teal-600" />
                Select Required Treatment
              </label>
              <select
                name="treatmentId"
                value={form.treatmentId}
                onChange={handleInputChange}
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${
                  errors.treatmentId
                    ? "border-rose-300 focus:border-rose-500"
                    : "border-slate-200 focus:border-teal-500"
                }`}
              >
                <option value="">-- Choose from available services --</option>
                {TREATMENTS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errors.treatmentId && (
                <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.treatmentId}
                </p>
              )}
            </div>

            {/* Target Date Choice Picker */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" />
                Target Date Choice
              </label>
              <input
                type="date"
                name="preferredDate"
                min={getMinDateString()}
                value={form.preferredDate}
                onChange={handleInputChange}
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${
                  errors.preferredDate
                    ? "border-rose-300 focus:border-rose-500"
                    : "border-slate-200 focus:border-teal-500"
                }`}
              />
              {errors.preferredDate && (
                <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.preferredDate}
                </p>
              )}
            </div>

            {/* Checkbox Timeline Preferences Segment */}
            <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="hasSpecificTime"
                  checked={form.hasSpecificTime}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-semibold text-slate-900">
                  I have a specific preferred timing request
                </span>
              </label>

              {/* Conditional Timing Block View */}
              {form.hasSpecificTime && (
                <div className="space-y-3 pt-2 border-t border-slate-200/60 animate-in fade-in duration-200">
                  <div className="text-xs font-medium text-slate-400">
                    {!form.preferredDate
                      ? "⚠️ Please choose a date above first to view matching slot availabilities"
                      : "Select Available Sitting Spot:"}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const selected = form.preferredTime === slot.value;
                      const booked = isSlotBooked(slot.value);
                      const disabled = !form.preferredDate || booked;

                      return (
                        <button
                          key={slot.value}
                          type="button"
                          disabled={disabled}
                          onClick={() => setForm((p) => ({ ...p, preferredTime: slot.value }))}
                          className={`h-10 rounded-xl font-medium text-xs border transition flex flex-col items-center justify-center ${
                            selected
                              ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                              : booked
                                ? "bg-slate-100 border-slate-100 text-slate-300 line-through cursor-not-allowed"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <span>{slot.label}</span>
                          {booked && <span className="text-[8px] opacity-75">Booked</span>}
                        </button>
                      );
                    })}
                  </div>
                  {errors.preferredTime && (
                    <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.preferredTime}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Notes Textarea */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600" />
                Additional Clinical Notes / Comments
              </label>
              <textarea
                name="additionalNotes"
                rows={3}
                value={form.additionalNotes}
                onChange={handleInputChange}
                placeholder="Optional"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-teal-600/10 transition hover:bg-teal-700"
            >
              Transmit Appointment Request
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>

          {/* Appointment Live Summary Card Column */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Live Request Overview
            </h2>

            {!selectedTreatment && !form.preferredDate ? (
              <div className="py-8 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-dashed border-slate-200">
                  <Clock className="h-4 w-4" />
                </div>
                <p className="text-xs text-slate-400 max-w-[180px] mx-auto leading-relaxed">
                  Fill out the structural form items to view your real-time data overview summary
                  frame here.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                {selectedTreatment && (
                  <div className="pb-3 border-b border-slate-50 space-y-1">
                    <div className="text-xs font-medium text-slate-400">Treatment Reason</div>
                    <div className="font-semibold text-slate-800">{selectedTreatment.name}</div>
                  </div>
                )}

                {form.preferredDate && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-slate-400">
                      Target Time Configuration
                    </div>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-teal-600" />
                      {form.preferredDate}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Timing:{" "}
                      {form.hasSpecificTime && form.preferredTime
                        ? TIME_SLOTS.find((t) => t.value === form.preferredTime)?.label
                        : "First Available (Evening Block)"}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
