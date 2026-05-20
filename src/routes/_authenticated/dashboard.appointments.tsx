import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Calendar } from "lucide-react";
export const Route = createFileRoute("/_authenticated/dashboard/appointments")({
  component: () => <ComingSoon title="Appointments" icon={Calendar} description="Browse, filter and manage all clinic appointments." action="New appointment" />,
});
