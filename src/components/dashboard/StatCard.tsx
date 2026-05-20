import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function StatCard({ icon: Icon, label, value, hint, accent }: {
  icon: LucideIcon; label: string; value: string; hint?: string; accent?: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {accent && <p className="mt-3 text-xs font-medium text-primary">{accent}</p>}
    </Card>
  );
}
