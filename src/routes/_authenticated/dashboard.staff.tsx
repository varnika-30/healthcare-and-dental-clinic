import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { UserCog } from "lucide-react";
export const Route = createFileRoute("/_authenticated/dashboard/staff")({
  component: () => <ComingSoon title="Staff" icon={UserCog} description="Manage doctors, receptionists and admin accounts." action="Add staff" />,
});
