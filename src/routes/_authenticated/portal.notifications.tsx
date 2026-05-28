import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/portal/notifications")({
  component: NotificationsPage,
});
import {
  Bell,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Check,
  Trash2,
  SlidersHorizontal,
  Stethoscope,
  Pill,
} from "lucide-react";

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface DentalNotification {
  id: string;
  type: "appointment" | "payment" | "followup" | "medical";
  title: string;
  description: string;
  timestamp: string;
  isUnread: boolean;
  actionLabel?: string;
  meta?: string;
}

// ==========================================
// INITIAL PRODUCTION-READY SEED DATA
// ==========================================
const INITIAL_NOTIFICATIONS: DentalNotification[] = [
  {
    id: "notif-1",
    type: "appointment",
    title: "Confirm your upcoming visit",
    description:
      "Your Teeth Whitening session with Dr. Aisha Patel is scheduled for tomorrow at 10:30 AM. Please confirm your attendance to secure your time slot.",
    timestamp: "2 hours ago",
    isUnread: true,
    actionLabel: "Confirm Appointment",
    meta: "Tue, May 26 · 10:30 AM",
  },
  {
    id: "notif-2",
    type: "payment",
    title: "Outstanding Invoice Pending",
    description:
      "An invoice statement of $240.00 for your recent treatment (Root Canal · Session 1) is ready for settlement.",
    timestamp: "5 hours ago",
    isUnread: true,
    actionLabel: "Pay Bill Now",
  },
  {
    id: "notif-3",
    type: "medical",
    title: "Prescription Care Instructions",
    description:
      "Dr. Marco Liu updated your post-procedure clinical notes. Remember to take your Amoxicillin 500mg strictly after dinner.",
    timestamp: "1 day ago",
    isUnread: false,
  },
  {
    id: "notif-4",
    type: "followup",
    title: "6-Month Hygiene Recall Due",
    description:
      "It has been 6 months since your last professional cleaning. Book a comprehensive scale and polish to maintain optimal gum health.",
    timestamp: "3 days ago",
    isUnread: false,
    actionLabel: "Book Cleaning",
  },
];

export default function NotificationsPage() {
  // ==========================================
  // COMPONENT STATE HOOKS
  // ==========================================
  const [notifications, setNotifications] = useState<DentalNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "appointment" | "payment">(
    "all",
  );

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  // ==========================================
  // ACTION HANDLERS
  // ==========================================
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n)));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // ==========================================
  // FILTER & VISUAL HELPER LOGIC
  // ==========================================
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "unread") return n.isUnread;
    if (activeFilter === "all") return true;
    return n.type === activeFilter;
  });

  const getIconConfig = (type: DentalNotification["type"]) => {
    switch (type) {
      case "appointment":
        return { icon: Calendar, tint: "bg-teal-50 text-teal-600 ring-teal-100" };
      case "payment":
        return { icon: CreditCard, tint: "bg-amber-50 text-amber-600 ring-amber-100" };
      case "followup":
        return { icon: AlertCircle, tint: "bg-rose-50 text-rose-600 ring-rose-100" };
      case "medical":
        return { icon: Pill, tint: "bg-cyan-50 text-cyan-600 ring-cyan-100" };
    }
  };

  return (
    <div className="-mt-14 min-h-screen bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/30 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header Dashboard Block */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/10">
              <Bell className="h-3.5 w-3.5" />
              Updates Hub
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Notifications & Reminders
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Stay updated with your personalized dental schedules, billing, and clinic care
              directives.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
            >
              <Check className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Navigation Segment Control */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
          <button
            onClick={() => setActiveFilter("all")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              activeFilter === "all"
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            All Updates ({notifications.length})
          </button>
          <button
            onClick={() => setActiveFilter("unread")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              activeFilter === "unread"
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setActiveFilter("appointment")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              activeFilter === "appointment"
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            Visits
          </button>
          <button
            onClick={() => setActiveFilter("payment")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              activeFilter === "payment"
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            Billing
          </button>
        </div>

        {/* Master Feed Stream Component */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => {
              const config = getIconConfig(notif.type);
              const ItemIcon = config.icon;

              return (
                <div
                  key={notif.id}
                  className={`group relative overflow-hidden rounded-3xl border transition-all duration-200 ${
                    notif.isUnread
                      ? "border-teal-100 bg-gradient-to-r from-teal-50/20 via-white to-white shadow-sm ring-1 ring-teal-50/50"
                      : "border-slate-100 bg-white"
                  }`}
                >
                  {/* Left-aligned state indicator accent line */}
                  {notif.isUnread && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />
                  )}

                  <div className="p-5 md:p-6 flex gap-4 items-start">
                    {/* Visual Type Pill Icon Area */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${config.tint}`}
                    >
                      <ItemIcon className="h-5 w-5" />
                    </div>

                    {/* Central Layout Text Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900 md:text-base">
                            {notif.title}
                          </h3>
                          {notif.isUnread && (
                            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {notif.timestamp}
                        </span>
                      </div>

                      <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-2xl">
                        {notif.description}
                      </p>

                      {/* Explicit Metadata Sub-Badges */}
                      {notif.meta && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-100">
                          <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                          {notif.meta}
                        </div>
                      )}

                      {/* Premium Dynamic CTA Trigger */}
                      {notif.actionLabel && (
                        <div className="mt-4 pt-1">
                          <button
                            className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
                              notif.type === "payment"
                                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/10"
                                : "bg-teal-600 hover:bg-teal-700 shadow-teal-600/10"
                            }`}
                          >
                            {notif.actionLabel}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Contextual Utilities (Appears smoothly on card hover) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 self-start pt-0.5">
                      {notif.isUnread && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          title="Mark read"
                          className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif.id)}
                        title="Delete notification"
                        className="p-1.5 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* Premium Healthcare Empty State Container Box */
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-12 text-center backdrop-blur-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 ring-4 ring-teal-50/50">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">Your feed is clean</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">
                No notifications found matching your selection criteria. You are fully caught up
                with Lumident care updates.
              </p>
              <button
                onClick={() => setActiveFilter("all")}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition"
              >
                <SlidersHorizontal className="h-3 w-3" />
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
