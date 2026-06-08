import React, { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  Phone,
  Calendar as CalendarIcon,
  Inbox,
  Plus,
  X,
} from "lucide-react";

// ==========================================
// TANSTACK ROUTE DEFINITION
// ==========================================
export const Route = createFileRoute("/_authenticated/admin/appointments")({
  component: AppointmentManagementPage,
});

type AppointmentStatus = "pending" | "approved" | "completed" | "cancelled";

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  phone: string;
  treatmentType: string;
  dateTime: string;
  duration: string;
  status: AppointmentStatus;
  notes: string;
}

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "APT-2041",
    patientName: "Eleanor Vance",
    patientId: "#P-8832",
    phone: "(555) 432-1098",
    treatmentType: "Invisalign Consultation",
    dateTime: "2026-05-26T09:00:00",
    duration: "45 mins",
    status: "pending",
    notes:
      "New patient requesting clear aligner assessment. Has panoramic X-rays from previous clinic.",
  },
  {
    id: "APT-2042",
    patientName: "Samuel Oakley",
    patientId: "#P-9831",
    phone: "(555) 234-5678",
    treatmentType: "Routine Cleaning & Checkup",
    dateTime: "2026-05-26T10:30:00",
    duration: "30 mins",
    status: "approved",
    notes: "6-month recall visit. Needs routine scaling and polishing.",
  },
  {
    id: "APT-2043",
    patientName: "Marcus Brody",
    patientId: "#P-1102",
    phone: "(555) 876-1122",
    treatmentType: "Emergency Toothache / Filling",
    dateTime: "2026-05-26T13:00:00",
    duration: "60 mins",
    status: "approved",
    notes: "Reporting acute pain on lower left molar when chewing cold food.",
  },
  {
    id: "APT-2039",
    patientName: "Clara Oswald",
    patientId: "#P-4491",
    phone: "(555) 901-2345",
    treatmentType: "Teeth Whitening",
    dateTime: "2026-05-26T15:00:00",
    duration: "45 mins",
    status: "completed",
    notes: "In-office laser whitening course completed successfully.",
  },
  {
    id: "APT-2040",
    patientName: "Arthur Pendelton",
    patientId: "#P-3091",
    phone: "(555) 654-7890",
    treatmentType: "Crown Fit Assessment",
    dateTime: "2026-05-25T11:00:00",
    duration: "90 mins",
    status: "cancelled",
    notes: "Patient cancelled due to work trip travel emergency.",
  },
];

const TIMELINE_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];

export default function AppointmentManagementPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [selectedDate, setSelectedDate] = useState<number>(26);
  const [pendingIndex, setPendingIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [formData, setFormData] = useState({
    patientName: "",
    phone: "",
    treatmentType: "Routine Cleaning & Checkup",
    date: "2026-05-26",
    timeSlot: "11:00 AM",
    notes: "",
  });

  useEffect(() => {
    async function loadAppointments() {
      const { data, error } = await supabase.from("appointments").select("*");

      console.log("APPOINTMENTS:", data);
      console.log("APPOINTMENTS ERROR:", error);

      if (data) {
        setAppointments(
          (data as any[]).map((appt) => ({
            id: appt.id,
            patientName: `Patient ${appt.patient_id.slice(0, 8)}`,
            patientId: appt.patient_id,
            phone: "",
            treatmentType: appt.appointment_type || "General Consultation",
            dateTime: appt.appointment_date,
            duration: "30 mins",
            status: appt.status === "requested" ? "pending" : appt.status,
            notes: appt.notes || "",
          })),
        );
      }
    }

    loadAppointments();
  }, []);

  const scheduleDate = new Date(2026, 4, selectedDate);
  const scheduleLabel = scheduleDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const goPreviousDay = () => setSelectedDate((prev) => Math.max(1, prev - 1));
  const goNextDay = () => setSelectedDate((prev) => Math.min(31, prev + 1));

  const handleUpdateStatus = (id: string, newStatus: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt)),
    );
  };

  const handleReschedule = (id: string) => {
    const newTime = prompt("Enter new target time slot (e.g., 2026-05-26T14:30:00):");
    if (newTime) {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === id ? { ...apt, dateTime: newTime, status: "approved" } : apt,
        ),
      );
    }
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const [hourStr, minuteStrWithAmPm] = formData.timeSlot.split(":");
    const [minuteStr, ampm] = minuteStrWithAmPm.split(" ");
    let hours = parseInt(hourStr);
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    const isoDateTime = `${formData.date}T${String(hours).padStart(2, "0")}:${minuteStr}:00`;

    const newApt: Appointment = {
      id: `APT-${Math.floor(2000 + Math.random() * 9000)}`,
      patientName: formData.patientName,
      patientId: `#P-${Math.floor(1000 + Math.random() * 9000)}`,
      phone: formData.phone,
      treatmentType: formData.treatmentType,
      dateTime: isoDateTime,
      duration: "45 mins",
      status: "approved",
      notes: formData.notes,
    };

    setAppointments((prev) => [...prev, newApt]);
    setIsModalOpen(false);
    setFormData({
      patientName: "",
      phone: "",
      treatmentType: "Routine Cleaning & Checkup",
      date: "2026-05-26",
      timeSlot: "11:00 AM",
      notes: "",
    });
    setSelectedDate(new Date(isoDateTime).getDate());
  };

  const pendingRequests = useMemo(() => {
    return appointments.filter((apt) => apt.status === "pending");
  }, [appointments]);

  const currentPendingRequest = pendingRequests[pendingIndex] ?? null;
  const pendingNavigationLabel = pendingRequests.length
    ? `${pendingIndex + 1} of ${pendingRequests.length}`
    : "0 of 0";

  const goPreviousRequest = () => {
    setPendingIndex((prev) =>
      pendingRequests.length > 1 ? (prev === 0 ? pendingRequests.length - 1 : prev - 1) : 0,
    );
  };

  const goNextRequest = () => {
    setPendingIndex((prev) =>
      pendingRequests.length > 1 ? (prev === pendingRequests.length - 1 ? 0 : prev + 1) : 0,
    );
  };

  useEffect(() => {
    if (pendingIndex >= pendingRequests.length) {
      setPendingIndex(Math.max(0, pendingRequests.length - 1));
    }
  }, [pendingRequests.length, pendingIndex]);

  const dayScheduleTimeline = useMemo(() => {
    return appointments
      .filter((apt) => {
        const aptDay = new Date(apt.dateTime).getDate();
        return aptDay === selectedDate && apt.status !== "pending";
      })
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [appointments, selectedDate]);

  const calendarBadgesMap = useMemo(() => {
    const counts: Record<number, number> = {};
    appointments.forEach((apt) => {
      if (apt.status !== "cancelled") {
        const day = new Date(apt.dateTime).getDate();
        counts[day] = (counts[day] || 0) + 1;
      }
    });
    return counts;
  }, [appointments]);

  const getSlotMatch = (isoString: string) => {
    const hours = new Date(isoString).getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    const adjustedHour = hours % 12 || 12;
    return `${String(adjustedHour).padStart(2, "0")}:00 ${ampm}`;
  };

  const formatClockTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* HEADER AREA */}
        <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Appointments
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              View daily timeline, manage incoming appointment requests, and log offline bookings.
            </p>
          </div>
        </div>

        {/* MODERN CONTROLS RIBBON (REPLACES STATIC CALENDAR CARD) */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200/80 p-1 shadow-2xs">
              <button
                type="button"
                onClick={goPreviousDay}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* CONTEXTUAL COMPACT POPOVER CALENDAR TRIGGER */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className={`inline-flex h-9 items-center gap-2 px-3.5 rounded-lg text-sm font-bold tracking-tight font-mono transition ${
                    isCalendarOpen
                      ? "bg-teal-600 text-white"
                      : "text-slate-800 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>{scheduleLabel}</span>
                </button>

                <AnimatePresence>
                  {isCalendarOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsCalendarOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 p-4 rounded-xl shadow-xl z-50 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                            May 2026
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            Select a date
                          </span>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>M</span>
                          <span>T</span>
                          <span>W</span>
                          <span>T</span>
                          <span>F</span>
                          <span>S</span>
                          <span>S</span>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-xs text-center font-semibold">
                          <span className="text-slate-200 py-1.5">27</span>
                          <span className="text-slate-200 py-1.5">28</span>
                          <span className="text-slate-200 py-1.5">29</span>
                          <span className="text-slate-200 py-1.5">30</span>

                          {Array.from({ length: 31 }, (_, i) => i + 1)
                            .slice(0, 17)
                            .map((day) => {
                              const isSelected = selectedDate === day;
                              const bookingCount = calendarBadgesMap[day] || 0;

                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    setSelectedDate(day);
                                    setIsCalendarOpen(false);
                                  }}
                                  className={`py-1.5 rounded-lg font-bold transition relative flex flex-col items-center justify-center min-h-[32px] ${
                                    isSelected
                                      ? "bg-teal-600 text-white shadow-xs"
                                      : "text-slate-800 hover:bg-slate-50"
                                  }`}
                                >
                                  <span>{day}</span>
                                  {bookingCount > 0 && (
                                    <span
                                      className={`absolute bottom-0.5 h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-teal-500"}`}
                                    />
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={goNextDay}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate(26)} // Resets back to mock layout standard anchor day
              className="hidden md:inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Today
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-xs transition"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Add Appointment
          </button>
        </div>

        {/* FULL-WIDTH primary CONTENT WRAPPER */}
        <div className="grid grid-cols-1 gap-6 items-start w-full">
          {/* PRIMARY TIMELINE - EXPANDED FOOTPRINT */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden w-full">
            <div className="p-5 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-teal-600" />
                <span>Daily Schedule Timeline</span>
              </div>
              <div className="text-xs font-semibold text-slate-500 bg-white/80 border border-slate-200 px-3 py-1 rounded-lg">
                Showing {dayScheduleTimeline.length} Active Slots
              </div>
            </div>

            <div className="p-5 space-y-4">
              {TIMELINE_SLOTS.map((slot) => {
                const matchingApts = dayScheduleTimeline.filter(
                  (a) => getSlotMatch(a.dateTime) === slot,
                );

                return (
                  <div
                    key={slot}
                    className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] gap-4 py-3 first:pt-1 last:pb-1 items-start"
                  >
                    <div className="relative text-sm font-bold font-mono text-slate-800 tracking-tight pt-1.5 pr-3">
                      <span className="relative z-10">{slot}</span>
                      <span className="absolute top-4.5 right-1 h-[calc(100%-0.5rem)] w-px bg-slate-100" />
                    </div>

                    <div className="space-y-3 min-w-0">
                      {matchingApts.length === 0 ? (
                        <div className="rounded-2xl border border-slate-100/80 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-400 italic font-medium">
                          No appointments scheduled
                        </div>
                      ) : (
                        matchingApts.map((apt) => {
                          const isCompleted = apt.status === "completed";
                          const isCancelled = apt.status === "cancelled";

                          return (
                            <div
                              key={apt.id}
                              className={`p-5 rounded-2xl border transition relative ${
                                isCompleted
                                  ? "bg-slate-50/70 border-slate-200 text-slate-500 shadow-3xs"
                                  : isCancelled
                                    ? "bg-rose-50/40 border-rose-100 text-slate-400 line-through shadow-3xs"
                                    : "bg-white border-slate-100 shadow-2xs hover:shadow-xs hover:border-slate-200"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                                <div className="min-w-0">
                                  <h3 className="text-base font-bold text-slate-900 leading-snug truncate">
                                    {apt.patientName}
                                  </h3>
                                  <p className="mt-0.5 text-sm font-semibold text-slate-600 truncate">
                                    {apt.treatmentType}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-sm font-bold font-mono text-slate-800 bg-slate-50 px-2 py-0.5 border border-slate-200/60 rounded-md">
                                    {formatClockTime(apt.dateTime)}
                                  </span>
                                  <span
                                    className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                      isCompleted
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                                        : isCancelled
                                          ? "bg-slate-100 text-slate-600 border border-slate-200/60"
                                          : "bg-teal-50 text-teal-800 border border-teal-100"
                                    }`}
                                  >
                                    {apt.status}
                                  </span>
                                </div>
                              </div>

                              {apt.notes && (
                                <p className="text-xs font-medium text-slate-500 mt-2 max-w-3xl line-clamp-2">
                                  {apt.notes}
                                </p>
                              )}

                              {!isCompleted && !isCancelled && (
                                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-50 pt-3">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(apt.id, "completed")}
                                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-3.5 py-1.5 rounded-xl transition"
                                  >
                                    Mark Complete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(apt.id, "cancelled")}
                                    className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3.5 py-1.5 rounded-xl transition"
                                  >
                                    Cancel Appointment
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECONDARY REQUESTS - BALANCED UNDER SYSTEM TIMELINE FRAME */}
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between gap-3 font-bold text-slate-900 text-sm tracking-tight px-1">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-amber-500" />
                <span>Pending Verification Stream</span>
                <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {pendingRequests.length} Requests
                </span>
              </div>

              {pendingRequests.length > 1 && (
                <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 text-slate-700 shadow-3xs">
                  <button
                    type="button"
                    onClick={goPreviousRequest}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold font-mono px-2">{pendingNavigationLabel}</span>
                  <button
                    type="button"
                    onClick={goNextRequest}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="w-full">
              {pendingRequests.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 text-center bg-white border border-slate-100 rounded-2xl text-sm font-medium text-slate-400 shadow-3xs"
                >
                  No incoming requests require verification.
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={currentPendingRequest?.id ?? "pending-empty"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:border-slate-200 transition w-full"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-900 tracking-tight text-base">
                          {currentPendingRequest?.patientName}
                        </h4>
                        <span className="text-xs font-mono font-bold text-slate-400 block">
                          {currentPendingRequest?.patientId}
                        </span>
                      </div>
                      <a
                        href={`tel:${currentPendingRequest?.phone}`}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition flex items-center justify-center"
                        title="Call Patient"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium pt-1">
                      <div className="space-y-1">
                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-bold">
                          Reason for Visit
                        </span>
                        <span className="text-slate-800 font-bold">
                          {currentPendingRequest?.treatmentType}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-bold">
                          Requested Slot
                        </span>
                        <span className="text-teal-600 font-bold flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {currentPendingRequest
                            ? `${new Date(currentPendingRequest.dateTime).toLocaleDateString(
                                "en-US",
                                { month: "long", day: "numeric" },
                              )} at ${formatClockTime(currentPendingRequest.dateTime)}`
                            : ""}
                        </span>
                      </div>
                    </div>

                    {currentPendingRequest?.notes && (
                      <div className="p-3 bg-slate-50 rounded-xl text-slate-700 text-sm border border-slate-100/60 leading-relaxed font-semibold">
                        "{currentPendingRequest.notes}"
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-50 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() =>
                          currentPendingRequest &&
                          handleUpdateStatus(currentPendingRequest.id, "approved")
                        }
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl transition shadow-2xs"
                      >
                        Approve Schedule
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          currentPendingRequest && handleReschedule(currentPendingRequest.id)
                        }
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-xl transition"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          currentPendingRequest &&
                          handleUpdateStatus(currentPendingRequest.id, "cancelled")
                        }
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100/70 border border-rose-100 px-4 py-2 rounded-xl transition"
                      >
                        Reject
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MANUAL BOOKING SLIDE DIALOG */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-xl overflow-hidden"
            >
              <div className="p-5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Book Manual Appointment</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Logs clinical schedule overrides instantly
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-hidden"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-hidden"
                    placeholder="(555) 000-0000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Time Slot
                    </label>
                    <select
                      value={formData.timeSlot}
                      onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-hidden bg-white"
                    >
                      {TIMELINE_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Treatment Category
                  </label>
                  <select
                    value={formData.treatmentType}
                    onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-hidden bg-white"
                  >
                    <option value="Routine Cleaning & Checkup">Routine Cleaning & Checkup</option>
                    <option value="Invisalign Consultation">Invisalign Consultation</option>
                    <option value="Emergency Toothache / Filling">
                      Emergency Toothache / Filling
                    </option>
                    <option value="Teeth Whitening">Teeth Whitening</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Notes / Symptoms
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-hidden resize-none h-20"
                    placeholder="Add patient context notes..."
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 text-sm font-bold">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl transition"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl transition shadow-2xs"
                  >
                    Save Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
