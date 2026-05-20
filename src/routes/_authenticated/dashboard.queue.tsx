import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { ListChecks } from "lucide-react";
export const Route = createFileRoute("/_authenticated/dashboard/queue")({
  component: () => <ComingSoon title="Queue" icon={ListChecks} description="Today's waiting room and check-in queue." />,
});
