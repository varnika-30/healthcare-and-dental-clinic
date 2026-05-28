import { createFileRoute } from "@tanstack/react-router";

import { useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Lock,
  LogOut,
  AlertCircle,
} from "lucide-react";
// Verified dashboard layout shell
import { DashboardShell } from "@/components/dashboard/DashboardShell";

const INITIAL_DOCTOR_DATA = {
  name: "Dr. Sarah Jenkins",
  specialization: "General Dentistry & Endodontics",
  clinicName: "Lumident Premium Care",
  avatarUrl: "", // Blank invokes text-initials fallback badge
  email: "s.jenkins@lumidentcare.com",
  phone: "(415) 555-0182",
  address: "450 Sutter St, Suite 1800, San Francisco, CA 94108",
  schedule: {
    workingDays: "Monday – Friday",
    timings: "8:30 AM – 5:00 PM",
    unavailableDays: "Saturdays, Sundays, and Public Holidays",
  },
};

export default function AdminProfilePage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    window.location.href = "/auth/login";
  };

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [doctorData, setDoctorData] = useState(INITIAL_DOCTOR_DATA);

  const [isEditing, setIsEditing] = useState(false);

  const handleEditProfile = () => {
    setIsEditing((prev) => !prev);
  };

  const handleChangePassword = () => {
    setShowPasswordForm((prev) => !prev);
  };

  // Clean initials generator matching avatar specifications
  const profileInitials = doctorData.name
    .split(" ")
    .filter((namePart: string) => namePart.toLowerCase() !== "dr.")
    .map((namePart: string) => namePart[0])
    .join("")
    .toUpperCase();

  return (
    <DashboardShell>
      <div className="min-w-0 w-full overflow-x-hidden text-slate-900 bg-slate-50/40 min-h-[calc(100vh-4rem)]">
        <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 px-4 pb-8 pt-2 sm:px-6 md:space-y-6 md:px-6 md:pt-4">
          {/* ==========================================
              SUBDUED ACCOUNT HEADER SECTION
             ========================================== */}
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900">
              Account Profile
            </h1>
            <p className="text-sm sm:text-base text-slate-500 font-semibold mt-0.5">
              Review and manage your professional clinic credentials, active locations, and system
              availability matrices.
            </p>
          </div>

          {/* ==========================================
              TOP SECTION: FULL-WIDTH HORIZONTAL BANNER CARD
             ========================================== */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 sm:8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                {doctorData.avatarUrl ? (
                  <img
                    src={doctorData.avatarUrl}
                    alt={doctorData.name}
                    className="h-16 w-16 rounded-xl object-cover ring-4 ring-teal-50 shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-teal-600/5 text-teal-700 font-black text-xl flex items-center justify-center border border-teal-100/50 tracking-wider shrink-0">
                    {profileInitials}
                  </div>
                )}
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {isEditing ? (
                      <input
                        value={doctorData.name}
                        onChange={(e) =>
                          setDoctorData({
                            ...doctorData,
                            name: e.target.value,
                          })
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-lg font-bold text-slate-900 tracking-tight"
                      />
                    ) : (
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        {doctorData.name}
                      </h2>
                    )}
                    {isEditing ? (
                      <input
                        value={doctorData.specialization}
                        onChange={(e) =>
                          setDoctorData({
                            ...doctorData,
                            specialization: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900">
                        {doctorData.specialization}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                    <User className="h-3.5 w-3.5 text-slate-300" />
                    {isEditing ? (
                      <input
                        value={doctorData.clinicName}
                        onChange={(e) =>
                          setDoctorData({
                            ...doctorData,
                            clinicName: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900">
                        {doctorData.clinicName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleEditProfile}
                className="sm:self-center inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-bold uppercase tracking-wider rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition self-start"
              >
                <User className="h-3.5 w-3.5 text-slate-500" />
                {isEditing ? "Save Changes" : "Edit Profile"}
              </button>
            </div>
          </div>

          {/* ==========================================
              SECOND ROW: BALANCED 2-COLUMN GRID
             ========================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* LEFT CARD: CONTACT INVENTORY */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-3.5">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-50 pb-1.5">
                  Contact Information
                </h3>

                <div className="space-y-3 text-sm font-semibold">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Clinic Email Address
                      </span>
                      {isEditing ? (
                        <input
                          value={doctorData.email}
                          onChange={(e) =>
                            setDoctorData({
                              ...doctorData,
                              email: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{doctorData.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Direct Telephone Line
                      </span>
                      {isEditing ? (
                        <input
                          value={doctorData.phone}
                          onChange={(e) =>
                            setDoctorData({
                              ...doctorData,
                              phone: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{doctorData.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Practice Headquarters
                      </span>
                      {isEditing ? (
                        <input
                          value={doctorData.address}
                          onChange={(e) =>
                            setDoctorData({
                              ...doctorData,
                              address: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{doctorData.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT CARD: OPERATIONAL AVAILABILITY */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 sm:7 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-3.5 w-full">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-50 pb-1.5">
                  Operational Availability
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-semibold">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Clinical Days
                      </span>
                      {isEditing ? (
                        <input
                          value={doctorData.schedule.workingDays}
                          onChange={(e) =>
                            setDoctorData({
                              ...doctorData,
                              schedule: {
                                ...doctorData.schedule,
                                workingDays: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                        />
                      ) : (
                        doctorData.schedule.workingDays
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Clinic Timings
                      </span>
                      {isEditing ? (
                        <input
                          value={doctorData.schedule.timings}
                          onChange={(e) =>
                            setDoctorData({
                              ...doctorData,
                              schedule: {
                                ...doctorData.schedule,
                                timings: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                        />
                      ) : (
                        doctorData.schedule.timings
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {doctorData.schedule.unavailableDays && (
                <div className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-lg text-[11px] font-semibold text-slate-500 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <div className="leading-normal">
                    <span className="font-bold text-slate-700">Scheduled Closures:</span>{" "}
                    {isEditing ? (
                      <input
                        value={doctorData.schedule.unavailableDays}
                        onChange={(e) =>
                          setDoctorData({
                            ...doctorData,
                            schedule: {
                              ...doctorData.schedule,
                              unavailableDays: e.target.value,
                            },
                          })
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                      />
                    ) : (
                      doctorData.schedule.unavailableDays
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ==========================================
              THIRD SECTION: COMPACT ACCOUNT ACTIONS CARD
             ========================================== */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-slate-800">Security & Session</h4>
                <p className="text-[14px] text-slate-500 font-semibold">
                  Manage access permissions and system authentications.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                {!showPasswordForm && (
                  <button
                    onClick={handleChangePassword}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-bold uppercase tracking-wider rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition"
                  >
                    <Lock className="h-3.5 w-3.5 text-slate-500" />
                    <span>Change Password</span>
                  </button>
                )}

                {showPasswordForm && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                    <input
                      type="password"
                      placeholder="Current Password"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />

                    <input
                      type="password"
                      placeholder="New Password"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />

                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />

                    <button
                      onClick={() => {
                        alert("Password updated successfully");
                        setShowPasswordForm(false);
                      }}
                      className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
                    >
                      Update Password
                    </button>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-bold uppercase tracking-wider rounded-lg border border-rose-100 bg-rose-50/30 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export const Route = createFileRoute("/_authenticated/admin/profile")({
  component: AdminProfilePage,
});
