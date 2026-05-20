import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Settings } from "lucide-react";
export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  component: () => <ComingSoon title="Settings" icon={Settings} description="Profile, availability and clinic preferences." />,
});
