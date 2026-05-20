import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Pill } from "lucide-react";
export const Route = createFileRoute("/_authenticated/dashboard/prescriptions")({
  component: () => <ComingSoon title="Prescriptions" icon={Pill} description="Active and past prescriptions, signed and ready." action="New prescription" />,
});
