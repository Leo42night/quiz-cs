/**
 * shared.tsx — komponen & helper UI yang dipakai di semua form soal.
 */

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea"; // ganti pakai Markdown
import MDEditor from "@uiw/react-md-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CATEGORIES, LANGUAGES, TYPE_LABELS } from "@/constants";
import type { QuestionType } from "shared";
// ─── Field wrapper ────────────────────────────────────────────────────────────

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

// ─── SelectField (wraps ShadCN Select) ───────────────────────────────────────

export function SelectField({
  value,
  onValueChange,
  options,
  placeholder,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── TypeBadge ────────────────────────────────────────────────────────────────

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

// ─── DifficultyStars ──────────────────────────────────────────────────────────

export function DifficultyStars({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="text-amber-400 text-xs tracking-tighter select-none">
      {"★".repeat(level)}
      <span className="text-muted-foreground/30">{"★".repeat(3 - level)}</span>
    </span>
  );
}

// ─── SectionHeading ───────────────────────────────────────────────────────────

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  );
}

// ─── CommonFields (kategori / bahasa / difficulty / points / pertanyaan) ──────

interface CommonFieldsProps {
  categoryId: number;
  languageId: number;
  difficulty: number;
  points: number;
  question: string;
  onChange: (key: string, value: string | number) => void;
}

export function CommonFields({
  categoryId,
  languageId,
  difficulty,
  points,
  question,
  onChange,
}: CommonFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Field label="Kategori">
          <SelectField
            value={String(categoryId)}
            onValueChange={(v) => onChange("category", +v)}
            options={Object.entries(CATEGORIES).map(([v, l]) => ({ value: v, label: l }))}
          />
        </Field>
        <Field label="Bahasa">
          <SelectField
            value={String(languageId)}
            onValueChange={(v) => onChange("language", +v)}
            options={Object.entries(LANGUAGES).map(([v, l]) => ({ value: v, label: l }))}
          />
        </Field>
        <Field label="Difficulty">
          <SelectField
            value={String(difficulty)}
            onValueChange={(v) => onChange("difficulty", +v)}
            options={[
              { value: "1", label: "1 · Easy" },
              { value: "2", label: "2 · Medium" },
              { value: "3", label: "3 · Hard" },
            ]}
          />
        </Field>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <Field label="Points">
          <Input
            type="number"
            min={1}
            value={points}
            onChange={(e) => onChange("points", +e.target.value)}
          />
        </Field>
      </div>

      {/* <Field label="Pertanyaan">
        <Textarea
          rows={2}
          placeholder="Tulis pertanyaan di sini..."
          value={question}
          onChange={(e) => onChange("question", e.target.value)}
        />
      </Field> */}

      <Field label="Pertanyaan">
        <div data-color-mode="dark">
          <MDEditor
            value={question}
            onChange={(val) => onChange("question", val || "")}
            height={200}
            preview="edit"
          />
        </div>
      </Field>
    </>
  );
}

// ─── PayloadPreview ───────────────────────────────────────────────────────────

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