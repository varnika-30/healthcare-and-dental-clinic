import { createFileRoute } from "@tanstack/react-router";

import React, { useState, useEffect } from "react";
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
  UserPlus,
  Search,
  ShieldCheck,
} from "lucide-react";
// Verified dashboard layout shell
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";

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

const mapDbToUiNotification = (dbN: any): ClinicNotification => {
  let category: NotificationCategory = "system";
  if (dbN.type === "billing") category = "billing";
  else if (dbN.type === "followup") category = "treatments";
  else if (dbN.type === "reminder") category = "appointments";

  let priority: NotificationPriority = "low";
  if (dbN.title?.toLowerCase().includes("urgent") || dbN.title?.toLowerCase().includes("overdue")) {
    priority = "high";
  } else if (dbN.title?.toLowerCase().includes("new") || dbN.type === "reminder") {
    priority = "medium";
  }

  const dateObj = new Date(dbN.created_at);
  const timeDiff = new Date().getTime() - dateObj.getTime();
  let timestamp = dbN.created_at.split("T")[0];
  if (timeDiff < 60000) {
    timestamp = "just now";
  } else if (timeDiff < 3600000) {
    timestamp = `${Math.floor(timeDiff / 60000)} mins ago`;
  } else if (timeDiff < 86400000) {
    timestamp = `${Math.floor(timeDiff / 3600000)} hours ago`;
  } else {
    const days = Math.floor(timeDiff / 86400000);
    timestamp = days === 1 ? "1 day ago" : `${days} days ago`;
  }

  return {
    id: dbN.id,
    category,
    title: dbN.title || "Clinic Alert",
    description: dbN.message || "",
    timestamp,
    priority,
    isUnread: !dbN.is_read,
    hasActions: category === "billing" || category === "treatments" || category === "appointments",
    actionType: category === "appointments" ? "approval" : "view",
  };
};

export default function AdminNotificationsPage() {
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<ClinicNotification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | NotificationCategory | "portal_requests">(
    "all",
  );

  const [portalRequests, setPortalRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [suggestedMatches, setSuggestedMatches] = useState<any[]>([]);
  const [manualSearchQuery, setManualSearchQuery] = useState("");
  const [manualSearchResults, setManualSearchResults] = useState<any[]>([]);
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);
  const [selectedPatientToLink, setSelectedPatientToLink] = useState<any | null>(null);
  const [isLinkingInProgress, setIsLinkingInProgress] = useState(false);
  const [unlinkedPatients, setUnlinkedPatients] = useState<any[]>([]);

  async function loadNotifications() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await (supabase as any)
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load notifications:", error);
    } else if (data) {
      setNotifications(data.map(mapDbToUiNotification));
    }
  }

  async function loadPortalRequests() {
    const { data, error } = await (supabase as any)
      .from("portal_link_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load portal requests:", error);
    } else if (data) {
      setPortalRequests(data);
    }
  }

  useEffect(() => {
    loadNotifications();
    loadPortalRequests();
  }, []);

  const handleStartReview = async (request: any) => {
    setSelectedRequest(request);
    setSelectedPatientToLink(null);
    setManualSearchQuery("");
    setManualSearchResults([]);
    setIsLinkingModalOpen(true);

    // Reuse patient loading logic: Fetch unlinked patients live from Supabase patients table
    const { data: allPatients, error } = await supabase
      .from("patients")
      .select("*")
      .is("user_id", null);

    if (error) {
      console.error("Failed to fetch unlinked patients:", error);
      toast.error("Failed to query chart suggestions.");
      setSuggestedMatches([]);
      setUnlinkedPatients([]);
    } else if (allPatients) {
      const patientsList = allPatients as any[];
      setUnlinkedPatients(patientsList);

      // Perform matching client-side to bypass trailing space and phone formatting bugs
      const reqName = (request.full_name || "").trim().toLowerCase();
      const reqEmail = (request.email || "").trim().toLowerCase();
      const reqPhone = (request.phone || "").replace(/\D/g, "");

      const matches = patientsList.filter((p) => {
        const pFirstName = (p.first_name || "").trim();
        const pLastName = (p.last_name || "").trim();
        const pFullName = `${pFirstName} ${pLastName}`.trim().toLowerCase();

        const nameMatch = reqName && pFullName && (pFullName.includes(reqName) || reqName.includes(pFullName));
        const emailMatch = reqEmail && p.email && p.email.trim().toLowerCase() === reqEmail;

        const pPhone = (p.phone || "").replace(/\D/g, "");
        const phoneMatch = reqPhone && pPhone && pPhone === reqPhone;

        return nameMatch || emailMatch || phoneMatch;
      });

      setSuggestedMatches(matches);
    }
  };

  const handleManualSearch = (q: string) => {
    setManualSearchQuery(q);
    if (!q.trim()) {
      setManualSearchResults([]);
      return;
    }
    const normQuery = q.toLowerCase().trim();
    const results = unlinkedPatients.filter((p) => {
      const firstName = (p.first_name || "").toLowerCase();
      const lastName = (p.last_name || "").toLowerCase();
      return firstName.includes(normQuery) || lastName.includes(normQuery);
    });
    setManualSearchResults(results.slice(0, 10));
  };

  const handlePerformLink = async () => {
    if (!selectedRequest || !selectedPatientToLink) return;
    setIsLinkingInProgress(true);
    try {
      // === TEMPORARY DEVELOPMENT-ONLY PORTAL LINK DIAGNOSTICS ===
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("[DEV] Portal Link Attempt Diagnostics:", {
        userId: session?.user?.id || null,
        email: session?.user?.email || null,
        accessTokenExists: !!session?.access_token,
        p_request_id: selectedRequest.id,
        p_patient_id: selectedPatientToLink.id,
      });
      // === END TEMPORARY DEVELOPMENT-ONLY PORTAL LINK DIAGNOSTICS ===

      const { data, error } = await (supabase as any).rpc("link_portal_to_patient", {
        p_request_id: selectedRequest.id,
        p_patient_id: selectedPatientToLink.id,
      });

      if (error) throw error;

      toast.success("Account linked successfully!");
      setIsLinkingModalOpen(false);
      await Promise.all([loadNotifications(), loadPortalRequests()]);
    } catch (err: any) {
      console.error("Linking failed:", err);
      toast.error(err.message || "Failed to link account.");
    } finally {
      setIsLinkingInProgress(false);
    }
  };

  // Interaction handlers providing localized operational feedback loops
  const handleApprove = async (id: string, title: string) => {
    const { error } = await (supabase as any)
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update notification status.");
    } else {
      toast.success(`Approved item context associated with: ${title}`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n)));
    }
  };

  const handleDismiss = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      toast.error("Failed to dismiss notification.");
    } else {
      toast.info("Notification removed from operational log view.");
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const handleView = () => {
    window.location.href = "/admin/ongoing-treatments";
  };

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any)
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      toast.error("Failed to update notifications.");
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
      toast.success("All notifications updated to read status.");
    }
  };

  const getMergedNotifications = (): ClinicNotification[] => {
    const items = [...notifications];
    portalRequests.forEach((req) => {
      const isDuplicate = notifications.some(
        (n) => n.title === "New Patient Portal Request" && n.description.includes(req.full_name),
      );

      if (!isDuplicate) {
        const dateObj = new Date(req.created_at);
        const timeDiff = new Date().getTime() - dateObj.getTime();
        let timestamp = req.created_at.split("T")[0];
        if (timeDiff < 60000) {
          timestamp = "just now";
        } else if (timeDiff < 3600000) {
          timestamp = `${Math.floor(timeDiff / 60000)} mins ago`;
        } else if (timeDiff < 86400000) {
          timestamp = `${Math.floor(timeDiff / 3600000)} hours ago`;
        } else {
          const days = Math.floor(timeDiff / 86400000);
          timestamp = days === 1 ? "1 day ago" : `${days} days ago`;
        }

        items.push({
          id: `virtual-${req.id}`,
          category: "system",
          title: "New Patient Portal Request",
          description: `${req.full_name} registered a portal account and requires linking to their medical chart.`,
          timestamp,
          priority: "medium",
          isUnread: true,
          hasActions: true,
          actionType: "approval",
        });
      }
    });
    return items;
  };

  // Tab dynamic filtering logic
  const mergedNotifications = getMergedNotifications();
  const filteredNotifications = mergedNotifications.filter((n) =>
    activeTab === "all" ? true : n.category === activeTab,
  );

  const unreadCount = mergedNotifications.filter((n) => n.isUnread).length;

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
            {(
              ["all", "appointments", "billing", "treatments", "system", "portal_requests"] as const
            ).map((tab) => {
              const isActive = activeTab === tab;
              const count =
                tab === "all"
                  ? mergedNotifications.length
                  : tab === "portal_requests"
                    ? portalRequests.length
                    : mergedNotifications.filter((n) => n.category === tab).length;

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
                  <span className="capitalize">
                    {tab === "portal_requests" ? "Portal Links" : tab}
                  </span>
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
            {activeTab === "portal_requests" ? (
              portalRequests.length > 0 ? (
                portalRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-xl p-4 transition flex items-start gap-4 shadow-2xs relative bg-white border-slate-100"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />

                    <div className="p-2 rounded-lg border shrink-0 bg-amber-50 border-amber-100/50 text-amber-700">
                      <UserPlus className="h-4 w-4" />
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Portal Link Request
                        </span>
                        <span className="text-[10px] text-slate-300 font-medium select-none">
                          •
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-bold tracking-tight text-slate-900">
                          {request.full_name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Email: {request.email} {request.phone && `• Phone: ${request.phone}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1.5 border-t border-slate-50 mt-2">
                        <button
                          onClick={() => handleStartReview(request)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded-md transition"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Review &amp; Link</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-slate-100 rounded-xl p-8 text-center max-w-md mx-auto my-6 space-y-2">
                  <div className="mx-auto h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-slate-300" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">No Pending Requests</h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      All patient portal accounts are currently linked to clinic medical charts.
                    </p>
                  </div>
                </div>
              )
            ) : filteredNotifications.length > 0 ? (
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
                      {notification.title === "New Patient Portal Request" ? (
                        <div className="flex items-center gap-2 pt-1.5 border-t border-slate-50 mt-2">
                          <button
                            onClick={() => {
                              const reqId = notification.id.startsWith("virtual-")
                                ? notification.id.replace("virtual-", "")
                                : null;
                              const req = reqId
                                ? portalRequests.find((r) => r.id === reqId)
                                : portalRequests.find((r) =>
                                    notification.description.includes(r.full_name),
                                  );
                              if (req) {
                                handleStartReview(req);
                              } else {
                                toast.error("Portal link request not found.");
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded-md transition"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Review &amp; Link</span>
                          </button>
                        </div>
                      ) : (
                        notification.hasActions && (
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
                        )
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

          {/* Account Linking Review Modal Overlay */}
          {isLinkingModalOpen && selectedRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-500" /> Link Portal Account
                  </h2>
                  <button
                    onClick={() => setIsLinkingModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Scroll Content */}
                <div className="p-5 overflow-y-auto space-y-5 text-sm leading-relaxed flex-1">
                  {/* Portal Profile Card */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Registered Portal User
                    </span>
                    <h3 className="font-extrabold text-slate-950 text-base">
                      {selectedRequest.full_name}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      Email: {selectedRequest.email}{" "}
                      {selectedRequest.phone && `• Phone: ${selectedRequest.phone}`}
                    </p>
                  </div>

                  {/* Suggested Matches */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Suggested Clinic Record Matches
                    </span>
                    {suggestedMatches.length > 0 ? (
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {suggestedMatches.map((match) => (
                          <div
                            key={match.id}
                            onClick={() => setSelectedPatientToLink(match)}
                            className={`border rounded-xl p-3 flex items-center justify-between cursor-pointer transition ${
                              selectedPatientToLink?.id === match.id
                                ? "border-teal-500 bg-teal-50/30 ring-1 ring-teal-500"
                                : "border-slate-200 hover:bg-slate-50 bg-white"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                                {match.first_name} {match.last_name}
                              </h4>
                              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                                {match.gender && `Sex: ${match.gender} • `} DOB:{" "}
                                {match.dob || "Not specified"}
                              </p>
                              <p className="text-[10px] sm:text-xs text-slate-500 font-medium font-mono">
                                {match.email} {match.phone && `• ${match.phone}`}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded transition shrink-0 ${
                                selectedPatientToLink?.id === match.id
                                  ? "bg-teal-600 text-white"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {selectedPatientToLink?.id === match.id ? "Selected" : "Select"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic font-medium">
                        No likely pre-existing patient record matched contact details.
                      </p>
                    )}
                  </div>

                  {/* Manual Search Field */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Search Patient Chart Manually
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by legal name..."
                        value={manualSearchQuery}
                        onChange={(e) => handleManualSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-slate-900 bg-white"
                      />
                    </div>

                    {manualSearchResults.length > 0 && (
                      <div className="border border-slate-100 rounded-xl max-h-[160px] overflow-y-auto bg-white p-1 space-y-1 mt-2">
                        {manualSearchResults.map((patient) => (
                          <div
                            key={patient.id}
                            onClick={() => setSelectedPatientToLink(patient)}
                            className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer text-xs transition ${
                              selectedPatientToLink?.id === patient.id
                                ? "bg-teal-50/50 border border-teal-500 text-teal-950 font-semibold"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-900">
                                {patient.first_name} {patient.last_name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                DOB: {patient.dob || "—"} • Phone: {patient.phone || "—"}
                              </div>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                selectedPatientToLink?.id === patient.id
                                  ? "bg-teal-600 text-white font-extrabold"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              Select
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirmation State Details Box */}
                  {selectedPatientToLink && (
                    <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-3.5 space-y-2 flex items-start gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-black text-teal-950 text-xs uppercase tracking-wider">
                          Linking Confirmation Required
                        </h4>
                        <p className="text-xs text-teal-900 leading-relaxed font-medium">
                          You are linking portal user{" "}
                          <strong className="font-bold">{selectedRequest.full_name}</strong> to
                          patient chart{" "}
                          <strong className="font-bold">
                            {selectedPatientToLink.first_name} {selectedPatientToLink.last_name}
                          </strong>
                          .
                        </p>
                        <p className="text-[10px] text-teal-700">
                          This grants the portal user secure read/write dashboard access to medical
                          histories, billing ledger items, and clinic prescriptions.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                  <button
                    onClick={() => setIsLinkingModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePerformLink}
                    disabled={!selectedPatientToLink || isLinkingInProgress}
                    className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition"
                  >
                    {isLinkingInProgress ? "Linking..." : "Confirm & Link Account"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: AdminNotificationsPage,
});
