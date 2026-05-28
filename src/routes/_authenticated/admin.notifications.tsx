import { createFileRoute } from "@tanstack/react-router";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  Calendar,
  CreditCard,
  Activity,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Check,
  Trash2,
} from "lucide-react";
// Verified dashboard layout shell
import { DashboardShell } from "@/components/dashboard/DashboardShell";

// Type definitions to keep the notification matrix strictly defined
type NotificationCategory = "appointments" | "billing" | "treatments" | "system";
type NotificationPriority = "high" | "medium" | "low";

interface ClinicNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  timestamp: string;
  priority: NotificationPriority;
  isUnread: boolean;
  hasActions?: boolean;
  actionType?: "approval" | "view";
}

// Mock operational clinic logs
const INITIAL_NOTIFICATIONS: ClinicNotification[] = [
  {
    id: "ntf-1",
    category: "appointments",
    title: "Appointment Cancelled",
    description:
      "Patient Robert Chen cancelled tomorrow's 10:30 AM root canal surgery. Slot unblocked.",
    timestamp: "10 mins ago",
    priority: "high",
    isUnread: true,
  },
  {
    id: "ntf-2",
    category: "appointments",
    title: "New Appointment Request",
    description: "Elena Rostova requested an initial checkup consultation for Friday at 2:00 PM.",
    timestamp: "45 mins ago",
    priority: "medium",
    isUnread: true,
    hasActions: true,
    actionType: "approval",
  },
  {
    id: "ntf-3",
    category: "billing",
    title: "Pending Payment Overdue",
    description:
      "Invoice #LUM-8902 for patient Marcus Vance (Crown Installation) is 14 days overdue.",
    timestamp: "2 hours ago",
    priority: "high",
    isUnread: true,
    hasActions: true,
    actionType: "view",
  },
  {
    id: "ntf-4",
    category: "treatments",
    title: "Treatment Milestone Reminder",
    description:
      "Lab results for lab case #991 (Invisalign adjustments for Clara Croft) have been uploaded.",
    timestamp: "5 hours ago",
    priority: "low",
    isUnread: false,
    hasActions: true,
    actionType: "view",
  },
  {
    id: "ntf-5",
    category: "system",
    title: "System Update Completed",
    description:
      "Ecosystem engine updated to v4.12.0. Patient records ledger encryption protocols optimized.",
    timestamp: "1 day ago",
    priority: "low",
    isUnread: false,
  },
];

export default function AdminNotificationsPage() {
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<ClinicNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<"all" | NotificationCategory>("all");

  // Interaction handlers providing localized operational feedback loops
  const handleApprove = (id: string, title: string) => {
    toast.success(`Approved item context associated with: ${title}`);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n)));
  };

  const handleDismiss = (id: string) => {
    toast.info("Notification removed from operational log view.");
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleView = () => {
    window.location.href = "/admin/ongoing-treatments";
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    toast.success("All notifications updated to read status.");
  };

  // Tab dynamic filtering logic
  const filteredNotifications = notifications.filter((n) =>
    activeTab === "all" ? true : n.category === activeTab,
  );

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  // Render contextual categories with structural styles and icons
  const getCategoryMeta = (category: NotificationCategory) => {
    switch (category) {
      case "appointments":
        return {
          icon: Calendar,
          bg: "bg-teal-50 border-teal-100/50",
          text: "text-teal-700",
          label: "Appointment",
        };
      case "billing":
        return {
          icon: CreditCard,
          bg: "bg-amber-50 border-amber-100/50",
          text: "text-amber-700",
          label: "Billing",
        };
      case "treatments":
        return {
          icon: Activity,
          bg: "bg-indigo-50 border-indigo-100/50",
          text: "text-indigo-700",
          label: "Treatment",
        };
      case "system":
        return {
          icon: Sliders,
          bg: "bg-slate-100 border-slate-200/60",
          text: "text-slate-700",
          label: "System",
        };
    }
  };

  const getPriorityStyle = (priority: NotificationPriority) => {
    switch (priority) {
      case "high":
        return "text-rose-600 bg-rose-50 border-rose-100/50";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-100/50";
      case "low":
        return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  return (
    <DashboardShell>
      <div className="min-w-0 w-full overflow-x-hidden text-slate-900 bg-slate-50/40 min-h-[calc(100vh-4rem)]">
        <div className="mx-auto w-full min-w-0 max-w-4xl space-y-5 px-4 pb-12 pt-2 sm:px-6 md:space-y-5 md:px-8 md:pt-4">
          {/* ==========================================
              NOTIFICATIONS HEADER BLOCK
             ========================================== */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
            <div className="space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                Notification Center
                {unreadCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-teal-600 text-white rounded-full tracking-normal">
                    {unreadCount} new
                  </span>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Monitor system logs, transactional billing alerts, and incoming booking
                configurations.
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1.5 self-start sm:self-center px-3 py-1.5 text-xs font-bold tracking-wider uppercase border border-slate-200 bg-white rounded-lg text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition"
              >
                <Check className="h-3.5 w-3.5 text-slate-400" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          {/* ==========================================
              COMPACT FILTER TABS SYSTEM
             ========================================== */}
          <div className="flex flex-wrap pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none border-b border-slate-100/60 gap-1.5">
            {(["all", "appointments", "billing", "treatments", "system"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const count =
                tab === "all"
                  ? notifications.length
                  : notifications.filter((n) => n.category === tab).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border whitespace-nowrap transition flex items-center gap-2 ${
                    isActive
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span className="capitalize">{tab}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ==========================================
              OPERATIONAL LOG STREAM LISTING
             ========================================== */}
          <div className="space-y-3">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => {
                const meta = getCategoryMeta(notification.category);
                const CategoryIcon = meta.icon;

                return (
                  <div
                    key={notification.id}
                    className={`border rounded-xl p-4 transition flex items-start gap-4 shadow-2xs relative overflow-hidden ${
                      notification.isUnread
                        ? "bg-teal-50/15 border-teal-600/20 ring-1 ring-teal-600/5"
                        : "bg-white border-slate-100"
                    }`}
                  >
                    {/* Unread Left Highlight Accent Bar */}
                    {notification.isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-600" />
                    )}

                    {/* Category Column Icon */}
                    <div className={`p-2 rounded-lg border shrink-0 ${meta.bg} ${meta.text}`}>
                      <CategoryIcon className="h-4 w-4" />
                    </div>

                    {/* Core Notification Meta Column */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-slate-300 font-medium select-none">
                          •
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{notification.timestamp}</span>
                        </div>
                        <span
                          className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border ml-auto ${getPriorityStyle(notification.priority)}`}
                        >
                          {notification.priority}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <h3
                          className={`text-sm font-bold tracking-tight text-slate-900 ${notification.isUnread ? "font-extrabold" : "font-semibold"}`}
                        >
                          {notification.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl">
                          {notification.description}
                        </p>
                        {expandedNotification === notification.id && (
                          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 space-y-2">
                            <p>
                              <span className="font-semibold text-slate-800">Patient:</span> Clara
                              Croft
                            </p>

                            <p>
                              <span className="font-semibold text-slate-800">Treatment ID:</span>{" "}
                              #991
                            </p>

                            <p>
                              <span className="font-semibold text-slate-800">Notes:</span> Updated
                              lab results and aligner adjustment scans are now available for review.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* ==========================================
                          CONTEXT ACTION BUTTON WRAPPER
                         ========================================== */}
                      {notification.hasActions && (
                        <div className="flex items-center gap-2 pt-1.5 border-t border-slate-50 mt-2">
                          {notification.actionType === "approval" ? (
                            <>
                              <button
                                onClick={() => handleApprove(notification.id, notification.title)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-teal-600 text-white rounded-md hover:bg-teal-700 active:bg-teal-800 transition"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleDismiss(notification.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 active:bg-slate-100 transition"
                              >
                                <XCircle className="h-3 w-3 text-slate-400" />
                                <span>Dismiss</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={handleView}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white rounded-md hover:bg-slate-800 active:bg-slate-950 transition"
                              >
                                <Eye className="h-3 w-3" />
                                <span>View Details</span>
                              </button>
                              <button
                                onClick={() =>
                                  setExpandedNotification(
                                    expandedNotification === notification.id
                                      ? null
                                      : notification.id,
                                  )
                                }
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Dismiss notification"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              /* Empty Boundary State Wrapper */
              <div className="bg-white border border-slate-100 rounded-xl p-8 text-center max-w-md mx-auto my-6 space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-slate-300" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-800">Clear Notification Matrix</h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    No active clinic operational warnings or record modifications found matching
                    this filter group.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: AdminNotificationsPage,
});
