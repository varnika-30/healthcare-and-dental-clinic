import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Receipt } from "lucide-react";
export const Route = createFileRoute("/_authenticated/dashboard/billing")({
  component: () => <ComingSoon title="Billing" icon={Receipt} description="Invoices, payments and revenue reports." action="Generate invoice" />,
});
