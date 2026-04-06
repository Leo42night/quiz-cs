import { lazy, Suspense } from "react";
// import { Textarea } from "@/components/ui/textarea"; // ganti pakai Markdown
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CATEGORIES, LANGUAGES } from "@/constants";
import { Field } from "./Shared";
// Impor commands untuk mengambil preset tombol

const MDEditor = lazy(() => import("@uiw/react-md-editor"));


// ─── CommonFields (kategori / bahasa / difficulty / points / pertanyaan) ──────

interface CommonFieldsProps {
  categoryId: number;
  languageId: number;
  difficulty: number;
  points: number;
  question: string;
  onChange: (key: string, value: string | number) => void;
}

function SelectField({
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
          {/* 2. Bungkus dengan Suspense */}
          <Suspense fallback={<div className="h-50 w-full animate-pulse bg-muted rounded-md" />}>
            <MDEditor
              value={question}
              onChange={(val) => onChange("question", val || "")}
              height={200}
              preview="edit"
              // 3. Matikan fitur yang tidak perlu untuk menghemat render
              extraCommands={[]}
            />
          </Suspense>
        </div>
      </Field>
    </>
  );
}