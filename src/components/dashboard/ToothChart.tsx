import { FDI_UPPER, FDI_LOWER } from "@/lib/patient";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type Status = "planned" | "in_progress" | "completed";
export type ToothMark = { tooth_number: number; status: Status; procedure: string };

const STATUS_COLORS: Record<Status, string> = {
  planned: "bg-yellow-50 border-yellow-200 text-yellow-900",
  in_progress: "bg-teal-50 border-teal-200 text-teal-900",
  completed: "bg-emerald-50 border-emerald-200 text-emerald-900",
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

  const gapClass =
    size === "lg" ? "gap-1.5 sm:gap-2" : size === "sm" ? "gap-1" : "gap-1 sm:gap-1.5";
  const buttonClass =
    size === "lg"
      ? "flex sm:h-16 sm:w-11 h-12 w-8 flex-col items-center justify-between py-1.5 rounded-md border bg-card sm:text-[10px] text-[8px] font-medium transition hover:border-primary cursor-pointer"
      : size === "sm"
        ? "flex h-[50px] w-8 flex-col items-center justify-between py-1 rounded-md border bg-card text-[10px] font-medium transition hover:border-primary cursor-pointer"
        : "flex h-14 w-9 flex-col items-center justify-between py-1.5 rounded-md border bg-card text-[10px] font-medium transition hover:border-primary cursor-pointer";
  const iconClass =
    size === "lg" ? "text-xs sm:text-lg" : size === "sm" ? "text-xs" : "text-sm sm:text-base";

  const Row = ({ teeth, midIndex }: { teeth: number[]; midIndex: number }) => {
    const leftGroup = teeth.slice(0, midIndex);
    const rightGroup = teeth.slice(midIndex);

    const renderTooth = (t: number) => {
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
          <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold">{t}</span>
          <span className={iconClass}>🦷</span>
        </button>
      );
    };

    return (
      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 md:gap-6 w-full">
        <div className={cn("flex flex-wrap justify-center", gapClass)}>
          {leftGroup.map(renderTooth)}
        </div>
        <div className="hidden md:block h-10 w-px bg-slate-200" />
        <div className={cn("flex flex-wrap justify-center", gapClass)}>
          {rightGroup.map(renderTooth)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 w-full">
      <Row teeth={FDI_UPPER} midIndex={8} />
      <div className="mx-auto h-px w-[92%] max-w-[880px] bg-slate-200 my-2" />
      <Row teeth={FDI_LOWER} midIndex={8} />
      <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
        <Legend color="bg-yellow-50 border border-yellow-200" label="Planned" />
        <Legend color="bg-teal-50 border border-teal-200" label="In progress" />
        <Legend color="bg-emerald-50 border border-emerald-200" label="Completed" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-3 w-3 rounded-md", color)} /> {label}
    </span>
  );
}
