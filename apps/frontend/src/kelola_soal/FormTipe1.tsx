/**
 * FormTipe1.tsx — Quiz Single Answer
 *
 * Satu pertanyaan pilihan ganda, tepat satu jawaban benar.
 * Menggunakan Radix RadioGroup via ShadCN untuk aksesibilitas.
 *
 * Payload yang dihasilkan:
 *   type            : 1
 *   answer          : string[]   — teks setiap pilihan
 *   correct_answer  : number     — index pilihan yang benar (0-based)
 */

import { useEffect, useState } from "react";
import { toast } from "@/hooks/useToast";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { Trash2, PlusCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CommonFields, SectionHeading, PayloadPreview, } from "@/components/shared";
import type { QuizSingleQuestion } from "shared";

// ─── defaults ─────────────────────────────────────────────────────────────────

function makeDefault(): Omit<QuizSingleQuestion, "id"> {
  return {
    type: 1,
    category: 1,
    language: 3,
    difficulty: 1,
    points: 10,
    question: "",
    answer: ["", "", "", ""],
    correct_answer: 0,
  };
}

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  initial?: QuizSingleQuestion;
  onSave: (q: Omit<QuizSingleQuestion, "id">, onSuccess: () => void) => void;
  onReady?: (reset: () => void) => void;
  onCancel?: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function FormTipe1({ initial, onSave, onReady, onCancel }: Props) {
  const [form, setForm] = useState(() => (initial ? { ...initial } : makeDefault()));

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

  const addOption = () => {
    if (form.answer.length >= 6) return;
    setForm((f) => ({ ...f, answer: [...f.answer, ""] }));
  };

  const removeOption = (idx: number) =>
    setForm((f) => {
      const answer = f.answer.filter((_, i) => i !== idx);
      const correct_answer =
        f.correct_answer === idx
          ? 0
          : f.correct_answer > idx
            ? f.correct_answer - 1
            : f.correct_answer;
      return { ...f, answer, correct_answer };
    });

  const handleSubmit = () => {
    if (!form.question.trim()) return void toast.error("Pertanyaan tidak boleh kosong.");
    if (form.answer.some((a) => !a.trim())) return void toast.error("Semua pilihan harus diisi.");
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
            Klik radio button untuk menandai <strong>satu</strong> jawaban yang benar.
          </p>
        </CardHeader>
        <CardContent>
          <RadioGroup.Root
            value={String(form.correct_answer)}
            onValueChange={(v) => set("correct_answer", +v)}
            className="flex flex-col gap-2"
          >
            {form.answer.map((ans, idx) => {
              const isCorrect = form.correct_answer === idx;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${isCorrect
                    ? "border-blue-300 bg-blue-50/60"
                    : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                >
                  <RadioGroup.Item
                    value={String(idx)}
                    id={`opt-${idx}`}
                    className="w-4 h-4 rounded-full border-2 border-primary shrink-0 data-[state=checked]:border-blue-500 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <RadioGroup.Indicator className="flex items-center justify-center w-full h-full">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </RadioGroup.Indicator>
                  </RadioGroup.Item>

                  <span className={`text-xs font-bold w-4 shrink-0 ${isCorrect ? "text-blue-600" : "text-muted-foreground"}`}>
                    {OPTION_LABELS[idx]}
                  </span>

                  <Input
                    value={ans}
                    placeholder={`Pilihan ${OPTION_LABELS[idx]}`}
                    onChange={(e) => setAnswer(idx, e.target.value)}
                    className={`flex-1 h-8 text-sm ${isCorrect ? "border-blue-200" : ""}`}
                  />

                  {isCorrect && (
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
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
          </RadioGroup.Root>

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
        </CardContent>
      </Card>

      {/* ── payload preview ── */}
      <PayloadPreview
        data={{ type: 1, answer: form.answer, correct_answer: form.correct_answer }}
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