import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { FileText } from "lucide-react";
export const Route = createFileRoute("/_authenticated/dashboard/records")({
  component: () => (
    <ComingSoon
      title="Medical Records"
      icon={FileText}
      description="X-rays, treatment notes and visit history."
    />
  ),
});
