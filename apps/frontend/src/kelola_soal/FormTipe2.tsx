/**
 * FormTipe2.tsx — Quiz Multi Answer
 *
 * Satu pertanyaan pilihan ganda, satu atau lebih jawaban bisa benar.
 * Menggunakan Radix Checkbox via ShadCN.
 *
 * Payload yang dihasilkan:
 *   type            : 2
 *   answer          : string[]   — teks setiap pilihan
 *   correct_answer  : number[]   — array index pilihan benar (sorted)
 */

import { useEffect, useState } from "react";
import { toast } from "@/hooks/useToast";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Trash2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CommonFields,
  SectionHeading,
  PayloadPreview,
} from "@/components/shared";
import type { QuizMultiQuestion } from "shared";

// ─── defaults ─────────────────────────────────────────────────────────────────

function makeDefault(): Omit<QuizMultiQuestion, "id"> {
  return {
    type: 2,
    category: 3,
    language: 3,
    difficulty: 1,
    points: 10,
    question: "",
    answer: ["", "", "", ""],
    correct_answer: [],
  };
}

function parseCorrectAnswer(val: unknown): number[] {
  if (Array.isArray(val)) return val.map(Number);
  if (typeof val === "string") {
    try { return (JSON.parse(val) as unknown[]).map(Number); } catch { return []; }
  }
  return [];
}

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  initial?: QuizMultiQuestion;
  onSave: (q: Omit<QuizMultiQuestion, "id">, onSuccess: () => void) => void;
  onReady?: (reset: () => void) => void;
  onCancel?: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function FormTipe2({ initial, onSave, onReady, onCancel }: Props) {
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        ...initial,
        correct_answer: parseCorrectAnswer(initial.correct_answer),
      };
    }
    return makeDefault();
  });

  useEffect(() => {
    onReady?.(() => setForm(makeDefault()));
  }, []);

  const set = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setAnswer = (idx: number, value: string) =>
    setForm((f) => {
      const answer = [...f.answer];
      answer[idx] = value;
      return { ...f, answer };
    });

  const toggleCorrect = (idx: number) =>
    setForm((f) => {
      const correct_answer_arr = f.correct_answer as number[];
      const correct_answer: number[] = correct_answer_arr.includes(idx)
        ? correct_answer_arr.filter((i) => i !== idx)
        : [...correct_answer_arr, idx].sort((a, b) => a - b);
      return { ...f, correct_answer };
    });

  const addOption = () => {
    if (form.answer.length >= 6) return;
    setForm((f) => ({ ...f, answer: [...f.answer, ""] }));
  };

  const removeOption = (idx: number) =>
    setForm((f) => {
      const answer = f.answer.filter((_, i) => i !== idx);
      const correct_answer: number[] = (f.correct_answer as number[])
        .filter((i) => i !== idx)
        .map((i) => (i > idx ? i - 1 : i));
      return { ...f, answer, correct_answer };
    });

  const handleSubmit = () => {
    if (!form.question.trim()) return void toast.error("Pertanyaan tidak boleh kosong.");
    if (form.answer.some((a) => !a.trim())) return void toast.error("Semua pilihan harus diisi.");
    if (form.correct_answer.length === 0) return void toast.error("Pilih minimal satu jawaban benar.");
    onSave(form, () => {  // pass reset callback
      if (!initial) setForm(makeDefault());
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── info soal ── */}
      <Card>
        <CardHeader className="pb-2">
          <SectionHeading>Informasi Soal</SectionHeading>
        </CardHeader>
        <CardContent>
          <CommonFields
            categoryId={form.category}
            languageId={form.language}
            difficulty={form.difficulty}
            points={form.points}
            question={form.question}
            onChange={set}
          />
        </CardContent>
      </Card>

      {/* ── pilihan jawaban ── */}
      <Card>
        <CardHeader className="pb-2">
          <SectionHeading>Pilihan Jawaban</SectionHeading>
          <p className="text-xs text-muted-foreground">
            Centang <strong>satu atau lebih</strong> pilihan yang benar.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {form.answer.map((ans, idx) => {
              const isCorrect = form.correct_answer.includes(idx);
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${isCorrect
                    ? "border-emerald-300 bg-emerald-50/60"
                    : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                >
                  <CheckboxPrimitive.Root
                    checked={isCorrect}
                    onCheckedChange={() => toggleCorrect(idx)}
                    className="w-4 h-4 rounded border-2 border-primary shrink-0 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <CheckboxPrimitive.Indicator>
                      <Check className="h-3 w-3 text-white" />
                    </CheckboxPrimitive.Indicator>
                  </CheckboxPrimitive.Root>

                  <span className={`text-xs font-bold w-4 shrink-0 ${isCorrect ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {OPTION_LABELS[idx]}
                  </span>

                  <Input
                    value={ans}
                    placeholder={`Pilihan ${OPTION_LABELS[idx]}`}
                    onChange={(e) => setAnswer(idx, e.target.value)}
                    className={`flex-1 h-8 text-sm ${isCorrect ? "border-emerald-200" : ""}`}
                  />

                  {isCorrect && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white shrink-0">
                      ✓
                    </span>
                  )}

                  {form.answer.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {form.answer.length < 6 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={addOption}
              className="mt-3 gap-1.5 text-muted-foreground"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Tambah Pilihan
            </Button>
          )}

          {form.correct_answer.length > 0 && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-medium text-emerald-700">
                Benar:{" "}
                {form.correct_answer
                  .map((i) => `${OPTION_LABELS[i]}`)
                  .join(", ")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── payload preview ── */}
      <PayloadPreview
        data={{
          type: 2,
          answer: form.answer,
          correct_answer: form.correct_answer,
        }}
      />

      {/* ── actions ── */}
      <Separator />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button onClick={handleSubmit}>{initial ? "Update Soal" : "Simpan Soal"}</Button>
      </div>
    </div>
  );
}