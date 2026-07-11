import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type TreatmentPlanRow = Database["public"]["Tables"]["treatment_plans"]["Row"];
type TransactionRow = Database["public"]["Tables"]["payment_transactions"]["Row"];

export interface PlanBillingSummary {
  totalCost: number;
  discountAmount: number;
  finalCost: number;
  totalPaid: number;
  outstandingAmount: number;
  paymentStatus: "unpaid" | "partial" | "paid";
}

/**
 * Pure helper function to calculate billing metrics from a treatment plan
 * and its associated payment transactions.
 *
 * @param plan An object representing the treatment plan with estimated, actual, and discount amounts
 * @param transactions An array of payment transactions associated with the plan
 */
export function calculatePlanBilling(
  plan: Pick<TreatmentPlanRow, "estimated_cost" | "actual_cost" | "discount_amount">,
  transactions: Pick<TransactionRow, "amount">[],
): PlanBillingSummary {
  const estimatedCost = plan.estimated_cost ?? 0;
  const actualCost = plan.actual_cost ?? 0;

  // total_cost is actual_cost if actual_cost is set and non-zero; otherwise fallback to estimated_cost
  const totalCost = actualCost > 0 ? actualCost : estimatedCost;

  const discountAmount = plan.discount_amount ?? 0;

  // final_cost = total_cost - discount_amount (clamped to >= 0)
  const finalCost = Math.max(0, totalCost - discountAmount);

  // total_paid is the sum of transaction amounts
  const totalPaid = transactions.reduce((sum, tx) => sum + (tx.amount ?? 0), 0);

  // outstanding_amount = final_cost - total_paid (clamped to >= 0)
  const outstandingAmount = Math.max(0, finalCost - totalPaid);

  // Determine payment_status
  let paymentStatus: "unpaid" | "partial" | "paid" = "unpaid";
  if (finalCost === 0 || totalPaid >= finalCost) {
    paymentStatus = "paid";
  } else if (totalPaid > 0) {
    paymentStatus = "partial";
  }

  return {
    totalCost,
    discountAmount,
    finalCost,
    totalPaid,
    outstandingAmount,
    paymentStatus,
  };
}

/**
 * Asynchronously fetches transactions for a given treatment plan and computes its billing summary.
 *
 * @param plan The full treatment plan record
 */
export async function fetchPlanBillingSummary(plan: TreatmentPlanRow): Promise<PlanBillingSummary> {
  const { data: transactions, error } = await supabase
    .from("payment_transactions")
    .select("amount")
    .eq("plan_id", plan.id);

  if (error) {
    console.error("Failed to fetch payment transactions for plan:", plan.id, error);
    // Return calculations assuming zero transactions on error
    return calculatePlanBilling(plan, []);
  }

  return calculatePlanBilling(plan, transactions || []);
}

/**
 * Calculates simplified billing dashboard metrics from raw treatment plans and transactions.
 *
 * @param plans An array of raw treatment plan records
 * @param transactions An array of raw transaction records
 */
export function calculateBillingMetrics(
  plans: any[],
  transactions: any[],
) {
  const pendingPatients = new Set<string>();
  const ongoingPatients = new Set<string>();
  const overduePatients = new Set<string>();

  const now = new Date();

  plans.forEach((plan) => {
    // 1. Pending Payments
    const dbPaymentStatus = plan.payment_status?.toLowerCase();
    if (dbPaymentStatus === "pending" || dbPaymentStatus === "partial") {
      pendingPatients.add(plan.patient_id);
    }

    // 2. Ongoing Treatments
    const dbTreatmentStatus = plan.status?.toLowerCase();
    if (dbTreatmentStatus === "in_progress") {
      ongoingPatients.add(plan.patient_id);
    }

    // 3. Overdue Patients
    // Overdue logic: due_date in the past and outstanding amount > 0
    if (plan.due_date && new Date(plan.due_date) < now) {
      const planTransactions = transactions.filter((tx) => tx.plan_id === plan.id);
      const estimatedCost = plan.estimated_cost ?? 0;
      const actualCost = plan.actual_cost ?? 0;
      const totalCost = actualCost > 0 ? actualCost : estimatedCost;
      const discountAmount = plan.discount_amount ?? 0;
      const finalCost = Math.max(0, totalCost - discountAmount);
      const totalPaid = planTransactions.reduce((sum, tx) => sum + (tx.amount ?? 0), 0);
      const outstandingAmount = Math.max(0, finalCost - totalPaid);

      if (outstandingAmount > 0) {
        overduePatients.add(plan.patient_id);
      }
    }
  });

  return {
    pendingPaymentsCount: pendingPatients.size,
    ongoingTreatmentsCount: ongoingPatients.size,
    overduePatientsCount: overduePatients.size,
  };
}
