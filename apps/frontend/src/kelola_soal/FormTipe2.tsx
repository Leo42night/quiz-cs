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

import { lazy, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Trash2, PlusCircle, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { QuizMultiQuestion } from "shared";
import { PayloadPreview, SectionHeading } from "./Shared";
const CommonFields = lazy(() => import("./CommonFields").then(module => ({ default: module.CommonFields })));

// ─── helpers ─────────────────────────────────────────────────────────────────

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

  // ─── Handler Drag & Drop ──────────────────────────────────────────────────
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;

    const items = Array.from(form.answer);

    // 1. Catat teks jawaban mana saja yang saat ini "Benar"
    const currentCorrectValues = form.correct_answer.map(idx => items[idx]);

    // 2. Lakukan reorder array answer
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);

    // 3. Cari index baru untuk teks-teks jawaban benar tadi di array yang baru
    const newCorrectIndices = currentCorrectValues
      .map(val => items.indexOf(val))
      .filter(idx => idx !== -1)
      .sort((a, b) => a - b); // Selalu simpan dalam keadaan sorted

    setForm((f) => ({
      ...f,
      answer: items,
      correct_answer: newCorrectIndices
    }));
  };

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
          <Suspense fallback={<div>Loading Form...</div>}>
            <CommonFields
              categoryId={form.category}
              languageId={form.language}
              difficulty={form.difficulty}
              points={form.points}
              question={form.question}
              onChange={set} />
          </Suspense>
        </CardContent>
      </Card>

      {/* ── pilihan jawaban ── */}
      <Card>
        <CardHeader className="pb-2">
          <SectionHeading>Pilihan Jawaban</SectionHeading>
          <p className="text-xs text-muted-foreground">
            Tarik <GripVertical className="inline h-3 w-3" /> untuk urutan. Centang <strong>satu atau lebih</strong> jawaban benar.
          </p>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="multi-answers">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex flex-col gap-2"
                >
                  {form.answer.map((ans, idx) => {
                    const isCorrect = form.correct_answer.includes(idx);
                    return (
                      <Draggable key={`drag-2-${idx}`} draggableId={`drag-2-${idx}`} index={idx}>
                        {(dragProvided, snapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${isCorrect
                              ? "border-emerald-300 bg-emerald-50/60"
                              : "border-border bg-muted/20"
                              } ${snapshot.isDragging ? "shadow-lg border-primary/50 bg-background z-50 scale-[1.02]" : ""}`}
                          >
                            {/* Drag Handle */}
                            <div
                              {...dragProvided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>

                            <CheckboxPrimitive.Root
                              checked={isCorrect}
                              onCheckedChange={() => toggleCorrect(idx)}
                              className="w-4 h-4 rounded border-2 border-primary shrink-0 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 flex items-center justify-center focus:outline-none"
                            >
                              <CheckboxPrimitive.Indicator>
                                <Check className="h-3 w-3 text-white" />
                              </CheckboxPrimitive.Indicator>
                            </CheckboxPrimitive.Root>

                            <span className={`text-[10px] font-bold w-4 shrink-0 text-center ${isCorrect ? "text-emerald-600" : "text-muted-foreground"}`}>
                              {OPTION_LABELS[idx]}
                            </span>

                            <Input
                              value={ans}
                              placeholder={`Pilihan ${OPTION_LABELS[idx]}`}
                              onChange={(e) => setAnswer(idx, e.target.value)}
                              className={`flex-1 h-8 text-xs ${isCorrect ? "border-emerald-200 bg-background" : "bg-background/50"}`}
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
                                className="text-muted-foreground/30 hover:text-destructive transition-colors shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

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