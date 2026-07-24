import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculatePlanBilling } from "@/lib/billing";
import { toast } from "sonner";
import { X } from "lucide-react";

interface ManageTreatmentPlanModalProps {
  planId: string;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

export default function ManageTreatmentPlanModal({
  planId,
  onClose,
  onSaveSuccess,
}: ManageTreatmentPlanModalProps) {
  const [currentRecord, setCurrentRecord] = useState<any | null>(null);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "cash" | "bank_transfer">(
    "upi",
  );
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [paymentPurpose, setPaymentPurpose] = useState<string>("Treatment Payment");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSavingDiscount, setIsSavingDiscount] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);

  const selectedPlanTransactions = useMemo(() => {
    return allTransactions.sort((a, b) => {
      const dateDiff = new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.id || "").localeCompare(a.id || "");
    });
  }, [allTransactions]);

  async function loadModalData() {
    try {
      // 1. Fetch treatment plan with patient
      const { data: plan, error: planError } = await supabase
        .from("treatment_plans")
        .select("*, patients(*)")
        .eq("id", planId)
        .single();

      if (planError) {
        console.error("Failed to load treatment plan:", planError);
        return;
      }

      // 2. Fetch payment transactions
      const { data: txsData, error: txsError } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("plan_id", planId);

      if (txsError) {
        console.error("Failed to load payment transactions:", txsError);
        return;
      }

      if (txsData) {
        setAllTransactions(txsData);
      }

      if (plan) {
        const billing = calculatePlanBilling(plan, txsData || []);
        const patientName = plan.patients
          ? `${(plan.patients as Record<string, unknown>)["first_name"] ?? ""} ${(plan.patients as Record<string, unknown>)["last_name"] ?? ""}`.trim()
          : "Unknown Patient";

        let status = "Payments Due";
        if (billing.paymentStatus === "paid") {
          status = "Paid";
        } else if (
          plan.due_date &&
          new Date(plan.due_date) < new Date() &&
          billing.outstandingAmount > 0
        ) {
          status = "Overdue";
        } else if (billing.paymentStatus === "partial") {
          status = "Partial Payments";
        }

        const mappedRecord = {
          id: plan.id,
          patientId: plan.patient_id,
          patientName,
          treatment: plan.title,
          estimatedCost: plan.estimated_cost ?? 0,
          discount: billing.discountAmount,
          discountReason: plan.discount_reason ?? "",
          finalCost: billing.finalCost,
          paidAmount: billing.totalPaid,
          outstandingAmount: billing.outstandingAmount,
          dueDate: plan.due_date ?? "",
          status,
        };

        setCurrentRecord(mappedRecord);
      }
    } catch (err) {
      console.error("Unexpected error in loadModalData:", err);
    }
  }

  useEffect(() => {
    loadModalData();
  }, [planId]);

  useEffect(() => {
    if (currentRecord && !editingTransaction) {
      setPaymentAmount(currentRecord.outstandingAmount);
      setPaymentMethod("upi");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setPaymentNotes("");
      setPaymentPurpose("");
      setDiscountAmount(currentRecord.discount || 0);
      setDiscountReason(currentRecord.discountReason || "");
    }
  }, [currentRecord, editingTransaction]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecord) return;

    if (!paymentPurpose.trim()) {
      toast.error("Payment Purpose is required.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingTransaction) {
        // Update existing transaction
        const { error } = await supabase
          .from("payment_transactions")
          .update({
            amount: paymentAmount,
            payment_method: paymentMethod,
            payment_date: paymentDate,
            notes: paymentNotes || null,
            purpose: paymentPurpose,
          })
          .eq("id", editingTransaction.id);

        if (error) {
          console.error("Failed to update payment:", error);
          toast.error("Failed to update payment: " + error.message);
          return;
        }

        toast.success("Payment updated successfully.");
        setEditingTransaction(null);
      } else {
        // Insert new transaction
        const { error } = await supabase.from("payment_transactions").insert({
          patient_id: currentRecord.patientId,
          plan_id: currentRecord.id,
          amount: paymentAmount,
          payment_method: paymentMethod,
          payment_date: paymentDate,
          notes: paymentNotes || null,
          purpose: paymentPurpose,
        });

        if (error) {
          console.error("Failed to record payment:", error);
          toast.error("Failed to record payment: " + error.message);
          return;
        }

        toast.success("Payment added successfully.");
      }

      await loadModalData();
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error("Unexpected error saving payment:", err);
      toast.error("Unexpected error occurred while saving payment.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDiscount = async () => {
    if (!currentRecord) return;

    setIsSavingDiscount(true);
    try {
      const { error } = await supabase
        .from("treatment_plans")
        .update({
          discount_amount: discountAmount,
          discount_reason: discountReason || null,
        })
        .eq("id", currentRecord.id);

      if (error) {
        console.error("Failed to save discount:", error);
        toast.error("Failed to save discount: " + error.message);
        return;
      }

      toast.success("Discount saved successfully.");
      await loadModalData();
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error("Unexpected error saving discount:", err);
      toast.error("Unexpected error occurred while saving discount.");
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const startEditTransaction = (tx: any) => {
    setEditingTransaction(tx);
    setPaymentAmount(tx.amount);
    setPaymentMethod(tx.payment_method);
    setPaymentDate(tx.payment_date);
    setPaymentNotes(tx.notes || "");
    setPaymentPurpose(tx.purpose || "");
  };

  const cancelEditTransaction = () => {
    setEditingTransaction(null);
    if (currentRecord) {
      setPaymentAmount(currentRecord.outstandingAmount);
      setPaymentMethod("upi");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setPaymentNotes("");
      setPaymentPurpose("");
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!window.confirm("Are you sure you want to delete this payment transaction?")) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("payment_transactions").delete().eq("id", txId);

      if (error) {
        console.error("Failed to delete payment:", error);
        toast.error("Failed to delete payment: " + error.message);
        return;
      }

      toast.success("Payment deleted successfully.");

      if (editingTransaction?.id === txId) {
        setEditingTransaction(null);
      }

      await loadModalData();
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error("Unexpected error deleting payment:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentRecord) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Fixed Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3.5 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-extrabold tracking-tight">Manage Treatment Plan</h3>
            <p className="text-[11px] text-teal-100 font-mono mt-0.5">ID: {currentRecord.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-teal-100 hover:text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-slate-800">
          {/* Patient Overview */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Patient Name
              </span>
              <div className="text-base font-black text-slate-900">{currentRecord.patientName}</div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
              Active Case File
            </span>
          </div>

          {/* Compact Billing Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Billing Summary
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Treatment:</span>
                <span className="font-bold text-slate-800">
                  ₹{currentRecord.estimatedCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Discount:</span>
                <span className="font-bold text-rose-600">
                  -₹{currentRecord.discount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200/60 pt-2">
                <span className="font-bold">Net Total:</span>
                <span className="font-bold text-slate-900">
                  ₹{currentRecord.finalCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200/60 pt-2">
                <span>Paid Amount:</span>
                <span className="font-bold text-emerald-600">
                  ₹{currentRecord.paidAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/80 pt-2 col-span-2 text-sm">
                <span className="font-extrabold text-slate-800">Outstanding Balance:</span>
                <span
                  className={`font-extrabold ${
                    currentRecord.outstandingAmount > 0 ? "text-rose-600" : "text-slate-400"
                  }`}
                >
                  ₹{currentRecord.outstandingAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Treatment Discount Section */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Apply Treatment Discount
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Discount Amount (₹)"
                value={discountAmount}
                disabled={isSaving || isSavingDiscount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg placeholder:text-slate-400 bg-white"
              />
              <input
                type="text"
                placeholder="Reason for discount"
                value={discountReason}
                disabled={isSaving || isSavingDiscount}
                onChange={(e) => setDiscountReason(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg placeholder:text-slate-400 bg-white"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveDiscount}
              disabled={isSaving || isSavingDiscount}
              className="w-full py-2 px-4 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              {isSavingDiscount ? "Saving..." : "Save Discount"}
            </button>
          </div>

          {/* Record Payment Form */}
          <form
            id="payment-form"
            onSubmit={handleSave}
            className="space-y-3 pt-3 border-t border-slate-100"
          >
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {editingTransaction ? "Edit Payment Details" : "Record New Payment"}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Amount */}
              <div className="space-y-1">
                <label
                  htmlFor="payment-amount"
                  className="text-[10px] uppercase font-bold text-slate-400 block"
                >
                  Payment Amount (₹) *
                </label>
                <input
                  id="payment-amount"
                  type="number"
                  min="0"
                  value={paymentAmount}
                  disabled={isSaving || isSavingDiscount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg placeholder:text-slate-400 bg-white"
                  placeholder="Enter amount"
                  required
                />
              </div>

              {/* Method */}
              <div className="space-y-1">
                <label
                  htmlFor="payment-method"
                  className="text-[10px] uppercase font-bold text-slate-400 block"
                >
                  Payment Method
                </label>
                <select
                  id="payment-method"
                  value={paymentMethod}
                  disabled={isSaving || isSavingDiscount}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Purpose */}
              <div className="space-y-1">
                <label
                  htmlFor="payment-purpose"
                  className="text-[10px] uppercase font-bold text-slate-400 block"
                >
                  Payment Purpose *
                </label>
                <input
                  id="payment-purpose"
                  type="text"
                  value={paymentPurpose}
                  disabled={isSaving || isSavingDiscount}
                  onChange={(e) => setPaymentPurpose(e.target.value)}
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg placeholder:text-slate-400 bg-white"
                  placeholder="e.g. Advance for Implant"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label
                  htmlFor="payment-date"
                  className="text-[10px] uppercase font-bold text-slate-400 block"
                >
                  Payment Date
                </label>
                <input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  disabled={isSaving || isSavingDiscount}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label
                htmlFor="payment-notes"
                className="text-[10px] uppercase font-bold text-slate-400 block"
              >
                Notes (Optional)
              </label>
              <textarea
                id="payment-notes"
                value={paymentNotes}
                disabled={isSaving || isSavingDiscount}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={2}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg resize-none placeholder:text-slate-400 bg-white"
                placeholder="Add optional remarks..."
              />
            </div>
          </form>

          {/* Transaction History */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Transaction History
            </h4>
            {selectedPlanTransactions.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                <p className="text-xs text-slate-400 font-medium">
                  No payments recorded for this plan yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {selectedPlanTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-3 border border-slate-200 bg-white rounded-lg shadow-2xs gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm">
                          ₹{tx.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {tx.payment_method === "bank_transfer"
                            ? "Net Banking"
                            : tx.payment_method.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {tx.payment_date}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium truncate">
                        <span className="text-slate-400 font-normal">Purpose: </span>
                        {tx.purpose}
                      </div>
                      {tx.notes && (
                        <div className="text-[11px] text-slate-400 italic truncate">
                          "{tx.notes}"
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditTransaction(tx)}
                        className="text-xs text-teal-600 font-bold hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      {editingTransaction?.id === tx.id && (
                        <button
                          type="button"
                          onClick={cancelEditTransaction}
                          className="text-xs text-slate-500 font-bold hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="bg-slate-50 px-5 py-3 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving || isSavingDiscount}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            Close
          </button>
          <button
            type="submit"
            form="payment-form"
            disabled={isSaving || isSavingDiscount}
            className="px-4 py-2 text-xs font-bold text-white bg-teal-600 rounded-lg cursor-pointer disabled:opacity-50 hover:bg-teal-700 transition shadow-2xs"
          >
            {isSaving ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
