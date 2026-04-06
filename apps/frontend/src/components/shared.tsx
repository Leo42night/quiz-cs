import { Badge } from "@/components/ui/badge";
import { TYPE_LABELS } from "@/constants";
import { cn } from "@/lib/utils";
import type { QuestionType } from "shared";


export function DifficultyStars({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="text-amber-400 text-xs tracking-tighter select-none">
      {"★".repeat(level)}
      <span className="text-muted-foreground/30">{"★".repeat(3 - level)}</span>
    </span>
  );
}

const TYPE_BADGE_CLASS: Record<QuestionType, string> = {
  1: "bg-blue-50 text-blue-700 border-blue-200",
  2: "bg-emerald-50 text-emerald-700 border-emerald-200",
  3: "bg-amber-50 text-amber-700 border-amber-200",
  4: "bg-rose-50 text-rose-700 border-rose-200",
};

export function TypeBadge({ type }: { type: QuestionType }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-semibold text-[11px]", TYPE_BADGE_CLASS[type])}
    >
      {TYPE_LABELS[type]}
    </Badge>
  );
}