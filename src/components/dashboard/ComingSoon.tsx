import { DashboardShell } from "./DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  title,
  icon: Icon,
  description,
  action,
}: {
  title: string;
  icon: LucideIcon;
  description: string;
  action?: string;
}) {
  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Card className="flex flex-col items-center justify-center rounded-3xl border-dashed border-border p-16 text-center shadow-soft">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold">Module in progress</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The {title.toLowerCase()} module is ready to be wired up. Ask the assistant to build out
          tables, forms, and full CRUD next.
        </p>
        {action && <Button className="mt-5 bg-primary-gradient">{action}</Button>}
      </Card>
    </DashboardShell>
  );
}
