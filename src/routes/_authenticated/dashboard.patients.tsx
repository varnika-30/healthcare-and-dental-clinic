import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Users } from "lucide-react";
export const Route = createFileRoute("/_authenticated/dashboard/patients")({
  component: () => <ComingSoon title="Patients" icon={Users} description="Full patient directory, records and history." action="Add patient" />,
});
