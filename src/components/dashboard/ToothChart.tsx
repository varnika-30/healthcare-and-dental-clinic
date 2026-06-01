import { FDI_UPPER, FDI_LOWER } from "@/lib/patient";
import { cn } from "@/lib/utils";

type Status = "planned" | "in_progress" | "completed";
export type ToothMark = { tooth_number: number; status: Status; procedure: string };

const STATUS_COLORS: Record<Status, string> = {
  planned: "bg-warning/20 border-warning text-warning-foreground",
  in_progress: "bg-primary/20 border-primary text-primary",
  completed: "bg-success/20 border-success text-success",
};

export function ToothChart({
  marks = [],
  selected,
  onSelect,
  size = "md",
}: {
  marks?: ToothMark[];
  selected?: number | null;
  onSelect?: (tooth: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const byTooth = new Map<number, ToothMark>();
  marks.forEach((m) => byTooth.set(m.tooth_number, m));

  const gapClass = size === "lg" ? "gap-2" : size === "sm" ? "gap-1" : "gap-1.5";
  const buttonClass =
    size === "lg"
      ? "flex h-14 w-11 flex-col items-center justify-center rounded-md border bg-card text-[10px] font-medium transition hover:border-primary"
      : size === "sm"
        ? "flex h-11 w-8 flex-col items-center justify-center rounded-md border bg-card text-[10px] font-medium transition hover:border-primary"
        : "flex h-12 w-9 flex-col items-center justify-center rounded-md border bg-card text-[10px] font-medium transition hover:border-primary";
  const iconClass = size === "lg" ? "text-lg" : size === "sm" ? "text-sm" : "text-base";

  const Row = ({ teeth }: { teeth: number[] }) => (
    <div className={cn("flex justify-center", gapClass)}>
      {teeth.map((t) => {
        const m = byTooth.get(t);
        const active = selected === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onSelect?.(t)}
            title={m ? `${m.procedure} · ${m.status}` : `Tooth ${t}`}
            className={cn(
              buttonClass,
              m && STATUS_COLORS[m.status],
              active && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
          >
            <span className="text-[9px] text-muted-foreground">{t}</span>
            <span className={iconClass}>🦷</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3">
      <Row teeth={FDI_UPPER} />
      <div className="mx-auto h-px w-[92%] max-w-[880px] bg-border" />
      <Row teeth={FDI_LOWER} />
      <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
        <Legend color="bg-warning" label="Planned" />
        <Legend color="bg-primary" label="In progress" />
        <Legend color="bg-success" label="Completed" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} /> {label}
    </span>
  );
}
