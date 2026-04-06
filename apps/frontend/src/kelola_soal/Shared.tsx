import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function PayloadPreview({ data }: { data: unknown }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/40 p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
        Preview Payload
      </p>
      <pre className="text-xs text-muted-foreground font-mono overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}