import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card className="rounded-3xl border border-border/60 p-6 shadow-soft hover:shadow-md transition duration-200 flex flex-col justify-between min-h-[140px] bg-card">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider block truncate">
            {label}
          </p>
          <p className="text-3xl font-extrabold text-foreground block font-display leading-tight">
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary border border-primary/10 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {(hint || accent) && (
        <div className="mt-4">
          {hint && <p className="text-xs text-muted-foreground font-medium block">{hint}</p>}
          {accent && <p className="text-xs font-semibold text-primary block">{accent}</p>}
        </div>
      )}
    </Card>
  );
}
