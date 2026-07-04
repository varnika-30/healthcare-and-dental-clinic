import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateMyPatient } from "@/lib/patient";
import { toast } from "sonner";
import { AppointmentBookingModal } from "@/components/portal/AppointmentBookingModal";
import {
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  Plus,
  ChevronRight,
  CalendarPlus,
  X,
  LayoutDashboard,
  Activity,
  Pill,
  Smile,
  CreditCard,
  User,
} from "lucide-react";

// ==========================================
// TANSTACK ROUTE COUPLING
// ==========================================
export const Route = createFileRoute("/_authenticated/portal/appointments")({
  component: PortalAppointmentsPage,
});

// ==========================================
// DATA ENGINE TYPES
// ==========================================
interface Appointment {
  id: string;
  appointment_date: string;
  status: "requested" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  notes?: string;
  dentist_name: string;
  specialty?: string;
  service_name: string;
  patient_phone?: string;
  preferred_time_text?: string;
}

interface ServiceProfile {
  id: string;
  name: string;
}

function validatePhone(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "Enter a valid phone number (at least 10 digits).";
  if (digits.length > 15) return "Phone number is too long.";
  return undefined;
}

function PortalAppointmentsPage() {
  const { data: dbAppointments = [], isLoading } = useQuery({
    queryKey: ["portal-appointments"],
    queryFn: async () => {
      const patient = await getOrCreateMyPatient();
      if (!patient) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*, doctor:profiles(full_name, specialization)")
        .eq("patient_id", patient.id)
        .order("appointment_date", { ascending: false });

      if (error) {
        throw error;
      }
      return (data || []).map((a: any) => ({
        id: a.id,
        appointment_date: a.appointment_date,
        status: a.status,
        notes: a.notes,
        dentist_name: a.doctor?.full_name || "To be assigned",
        specialty: a.doctor?.specialization || "Healthcare & Dental Clinic Care Team",
        service_name: a.service || "General Dental Consultation",
        patient_phone: a.patient_phone,
        preferred_time_text: a.preferred_time_text || undefined,
      }));
    },
  });

  const queryClient = useQueryClient();
  const appointments = dbAppointments;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showRequestChoice, setShowRequestChoice] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [focusedAppointment, setFocusedAppointment] = useState<Appointment | null>(null);

  // Dedicated functional operational callback to alter array record states safely
  const handleCancelRequest = async (id: string) => {
    const app = dbAppointments.find((a) => a.id === id);
    if (app && app.status === "requested") {
      try {
        const { error } = await supabase
          .from("appointments")
          .update({ status: "cancelled" })
          .eq("id", id);
        if (error) throw error;

        toast.success("Appointment request cancelled successfully.");
        setFocusedAppointment((prev) =>
          prev && prev.id === id ? { ...prev, status: "cancelled" as const } : prev,
        );
        await queryClient.invalidateQueries({ queryKey: ["portal-appointments"] });
        await queryClient.invalidateQueries({ queryKey: ["portal-overview"] });
      } catch (err: any) {
        console.error("Cancel error:", err);
        toast.error("Failed to cancel appointment. Please try again.");
      }
    } else {
      toast.info(
        "Please call the clinic at (415) 555-0182 to cancel or reschedule your appointments.",
      );
    }
  };

  const now = new Date();
  const upcomingAppointments = appointments.filter((app) => {
    return app.status === "requested" || app.status === "confirmed";
  });

  const pastAppointments = appointments.filter((app) => {
    return app.status === "completed" || app.status === "cancelled" || app.status === "no_show";
  });

  const getStatusBadgeStyles = (status: Appointment["status"]) => {
    switch (status) {
      case "confirmed":
        return {
          bg: "bg-emerald-50 border-emerald-100 text-emerald-700",
          label: "Confirmed",
          icon: CheckCircle2,
        };
      case "requested":
        return {
          bg: "bg-amber-50 border-amber-100 text-amber-700",
          label: "Pending Verification",
          icon: AlertCircle,
        };
      case "completed":
        return {
          bg: "bg-teal-50 border-teal-100 text-teal-700",
          label: "Completed",
          icon: CheckCircle2,
        };
      case "cancelled":
        return {
          bg: "bg-rose-50 border-rose-100 text-rose-700",
          label: "Cancelled",
          icon: XCircle,
        };
      case "no_show":
        return {
          bg: "bg-slate-50 border-slate-100 text-slate-500",
          label: "No Show",
          icon: HelpCircle,
        };
      default:
        return {
          bg: "bg-slate-50 border-slate-100 text-slate-700",
          label: status,
          icon: HelpCircle,
        };
    }
  };

  const formatAppointmentTime = (app: Appointment) => {
    const d = new Date(app.appointment_date);
    const dateFormatted = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (app.status === "requested" && app.preferred_time_text) {
      return `${dateFormatted} · Preference: ${app.preferred_time_text}`;
    }

    if (app.status === "requested" && !app.preferred_time_text) {
      return `${dateFormatted} · Flexible Timing`;
    }

    return (
      dateFormatted +
      " · " +
      d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  return (
    <div className="min-w-0 w-full overflow-x-hidden font-sans antialiased text-slate-900">
      <div className="mx-auto w-full min-w-0 max-w-none space-y-6 px-4 pb-12 pt-2 sm:px-6 md:space-y-8 md:px-8 md:pt-4 lg:px-10">
        {/* OPTIMIZED APP HEADER BLOCK */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 whitespace-nowrap">
              My Appointments
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed max-w-2xl">
              Manage your upcoming visits, diagnostic tracks, and clinical history archives.
            </p>
          </div>

          <div className="shrink-0 w-full lg:w-auto flex justify-start lg:justify-end pt-1">
            <button
              onClick={() => setShowRequestChoice(true)}
              className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider px-5 py-3 shadow-md shadow-teal-600/10 flex items-center justify-center gap-2 shrink-0 transition-all transform hover:-translate-y-0.5 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Request Appointment</span>
            </button>
          </div>
        </div>

        {/* APPOINTMENTS TIMELINE RENDER SECTIONS */}
        {appointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-xs max-w-md mx-auto space-y-4">
            <div className="mx-auto h-14 w-14 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
              <CalendarPlus className="h-7 w-7" />
            </div>
            <p className="text-base font-semibold text-slate-700">
              No scheduled medical sessions configured.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* UPCOMING VISITS CONTAINER */}
            {upcomingAppointments.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Calendar className="h-4 w-4 text-teal-600 shrink-0" />
                  <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Upcoming Appointments
                  </h2>
                  <span className="text-xs bg-teal-50 border border-teal-100/80 px-2 py-0.5 rounded-full text-teal-700 font-bold">
                    {upcomingAppointments.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {upcomingAppointments.map((app) => {
                    const badge = getStatusBadgeStyles(app.status);
                    const StatusIcon = badge.icon;

                    return (
                      <div
                        key={app.id}
                        className="bg-white border border-slate-100/80 hover:border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-5 group overflow-hidden"
                      >
                        <div className="space-y-3 flex-1 min-w-0 w-full">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 border rounded-md px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0 ${badge.bg}`}
                            >
                              <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                              {badge.label}
                            </span>
                            <span className="text-xs sm:text-sm text-slate-500 font-semibold flex items-center gap-1.5 min-w-0">
                              <Clock className="h-4 w-4 text-slate-300 shrink-0" />
                              <span className="truncate">{formatAppointmentTime(app)}</span>
                            </span>
                          </div>

                          <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight group-hover:text-teal-950 transition-colors break-words">
                            {app.service_name}
                          </h3>

                          {app.notes && (
                            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl text-xs sm:text-sm font-medium text-slate-600 leading-relaxed flex items-start gap-3 max-w-full">
                              <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                              <div className="break-words min-w-0 flex-1">
                                <span className="font-bold text-slate-800">Patient Note:</span>{" "}
                                {app.notes}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* DESKTOP/MOBILE BALANCED INTERACTION BLOCK TRACK */}
                        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-50 shrink-0 w-full lg:w-auto gap-2.5 sm:gap-4 lg:gap-2">
                          {app.status === "requested" && (
                            <button
                              onClick={() => handleCancelRequest(app.id)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border border-rose-100 bg-rose-50/40 text-rose-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition"
                            >
                              Cancel Request
                            </button>
                          )}
                          <button
                            onClick={() => setFocusedAppointment(app)}
                            className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-slate-400 group-hover:text-teal-600 transition-colors duration-200 py-1.5 sm:py-0"
                          >
                            <span>Check details</span>
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PAST & HISTORICAL LOGS ARCHIVE */}
            {pastAppointments.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1 pt-1">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Past & Concluded Logs
                  </h2>
                  <span className="text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-500 font-bold">
                    {pastAppointments.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {pastAppointments.map((app) => {
                    const badge = getStatusBadgeStyles(app.status);
                    const StatusIcon = badge.icon;

                    return (
                      <div
                        key={app.id}
                        onClick={() => setFocusedAppointment(app)}
                        className="bg-white/70 border border-slate-100/70 opacity-90 hover:opacity-100 rounded-xl p-5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group min-w-0 hover:border-slate-200/80 hover:bg-white"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                            <h3 className="text-base font-bold text-slate-700 tracking-tight group-hover:text-teal-600 transition-colors break-words">
                              {app.service_name}
                            </h3>
                            <span className="text-xs font-semibold text-slate-400 shrink-0">
                              {formatAppointmentTime(app)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50/60 w-full sm:w-auto">
                          <span
                            className={`inline-flex items-center gap-1 border rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.bg}`}
                          >
                            <StatusIcon className="h-3 stroke-2 shrink-0" />
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AppointmentBookingModal open={isDialogOpen} onClose={() => setIsDialogOpen(false)} />

      {/* Request Choice Modal */}
      {showRequestChoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowRequestChoice(false)}
        >
          <div
            className="my-8 w-full max-w-xs animate-in zoom-in-95 space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl duration-200 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold tracking-tight text-slate-900">Request Appointment</h3>
            <p className="text-sm text-slate-500">How would you like to proceed?</p>

            <div className="space-y-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowRequestChoice(false);
                  setShowCallModal(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Call Clinic
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRequestChoice(false);
                  setIsDialogOpen(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-sm font-bold text-white hover:bg-teal-700"
              >
                Book Online
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Clinic Modal */}
      {showCallModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowCallModal(false)}
        >
          <div
            className="my-8 w-full max-w-sm animate-in zoom-in-95 space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-2xl duration-200 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold tracking-tight text-slate-900">Call the Clinic</h3>
            <p className="text-sm text-slate-500">You can reach us at:</p>
            <div className="mt-3">
              <a
                href={`tel:${"+14155550182"}`}
                className="text-xl font-bold text-teal-600 hover:underline"
              >
                (415) 555-0182
              </a>
            </div>
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setShowCallModal(false)}
                className="h-10 px-4 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          COMPACT COMPONENT DRILL DOWN OVERLAY MODAL
         ========================================== */}
      {focusedAppointment && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setFocusedAppointment(null)}
        >
          <div
            className="bg-white border border-slate-100 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 my-8 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <span
                className={`inline-flex items-center gap-1.5 border rounded-md px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2.5 ${getStatusBadgeStyles(focusedAppointment.status).bg}`}
              >
                {getStatusBadgeStyles(focusedAppointment.status).label}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight break-words">
                {focusedAppointment.service_name}
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Detailed view of your operational healthcare slot.
              </p>
            </div>

            <div className="space-y-4 py-3 border-t border-b border-slate-100 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Schedule:
                </span>
                <span className="sm:col-span-2 text-slate-700 font-semibold break-words">
                  {formatAppointmentTime(focusedAppointment)}
                </span>
              </div>
              {focusedAppointment.notes && (
                <div className="space-y-1 pt-1 max-w-full">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Your Medical Case Notes:
                  </span>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed text-xs sm:text-sm font-medium break-words">
                    {focusedAppointment.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:justify-end pt-1 gap-2">
              {focusedAppointment.status === "requested" && (
                <button
                  onClick={() => handleCancelRequest(focusedAppointment.id)}
                  className="bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 hover:text-rose-700 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition text-center"
                >
                  Cancel Request
                </button>
              )}
              <button
                onClick={() => setFocusedAppointment(null)}
                className="bg-slate-900 hover:bg-slate-800 active:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-colors text-center"
              >
                Dismiss View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
