// FormTipe3.tsx

import { useState, useEffect, lazy, Suspense } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CodeEditor } from "@/components/custom/codeEditor";
import type { CodeFillExactQuestion } from "shared";
import { HL_LANGUAGES } from "@/constants";
import { PayloadPreview, SectionHeading } from "./Shared";
const CommonFields = lazy(() => import("./CommonFields").then(module => ({ default: module.CommonFields })));

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Create mode: <<jawaban>> → <<len>> + encode whitespace
 * Ambil panjang value sebagai lebar placeholder (min 4).
 */
export function editorTemplateToApi(template: string): string {
  return template
    .replace(/<<([^>]*)>>/g, (_m, ans: string) => `<<${Math.max(ans.length, 4)}>>`)
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
}

/**
 * Create mode: api answer + answers[] → <<jawaban>> template for editor
 */
export function apiTemplateToEditor(apiAnswer: string, answers: string[]): string {
  let i = 0;
  return apiAnswer
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/<<\d+>>/g, () => `<<${answers[i++] ?? ""}>>`)
}

/**
 * Create mode: extract answers from <<jawaban>> template
 * Greedy match dimatikan agar nested `>` di value tidak makan terlalu jauh.
 */
export function extractAnswersFromTemplate(template: string): string[] {
  return Array.from(template.matchAll(/<<([^>]*)>>/g)).map((m) => m[1]);
}
// ----

/** Edit mode: decode \\n \\t for display, keep <<N>> as-is */
function apiTemplateToEditMode(apiAnswer: string): string {
  return apiAnswer.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
}

/** Edit mode: count <<N>> placeholders to determine correct_answer slot count */
function countPlaceholders(template: string): number {
  return (template.match(/<<\d+>>/g) ?? []).length;
}

/** Edit mode: encode whitespace back, keep <<N>> as-is */
function editModeTemplateToApi(template: string): string {
  return template.replace(/\n/g, "\\n").replace(/\t/g, "\\t");
}

// ─── defaults ─────────────────────────────────────────────────────────────────

function makeDefault(): Omit<CodeFillExactQuestion, "id"> {
  return {
    type: 3,
    category: 1,
    language: 1,
    difficulty: 1,
    points: 20,
    question: "",
    answer: "",
    correct_answer: [],
    updated_at: 0
  };
}

function parseCorrectAnswer(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  initial?: CodeFillExactQuestion;
  onSave: (q: Omit<CodeFillExactQuestion, "id">, onSuccess: () => void) => void;
  onReady?: (reset: () => void) => void;
  onCancel?: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function FormTipe3({ initial, onSave, onReady, onCancel }: Props) {
  const isEditMode = !!initial;

  const [form, setForm] = useState<Omit<CodeFillExactQuestion, "id">>(() => {
    if (initial) {
      return {
        ...initial,
        correct_answer: parseCorrectAnswer(initial.correct_answer)
      };
    }
    return makeDefault();
  });

  // Edit mode: template shows <<N>> as-is (decoded whitespace only)
  const [template, setTemplate] = useState<string>(() => {
    const init = initial;

    if (init && "answer" in init) {
      const answers = parseCorrectAnswer(init.correct_answer);
      return isEditMode
        ? apiTemplateToEditMode(init.answer)
        : apiTemplateToEditor(init.answer, answers);
    }
    return "";
  });

  // Edit mode: correct_answer list, driven by placeholder count in template
  const [editAnswers, setEditAnswers] = useState<string[]>(() =>
    isEditMode ? parseCorrectAnswer(initial?.correct_answer) : []
  );

  useEffect(() => {
    onReady?.(() => {
      setForm(makeDefault());
      setTemplate("");
      setEditAnswers([]);
    });
  }, []);

  const set = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const langKey = HL_LANGUAGES[form.language] ?? "javascript";

  // ── Edit mode: sync template → form.answer, sync placeholder count → editAnswers slots
  useEffect(() => {
    if (!isEditMode) return;
    const count = countPlaceholders(template);
    setEditAnswers((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) return [...prev, ...Array(count - prev.length).fill("")];
      return prev.slice(0, count);
    });
    setForm((f) => ({ ...f, answer: editModeTemplateToApi(template) }));
  }, [template, isEditMode]);

  // ── Edit mode: sync editAnswers → form.correct_answer
  useEffect(() => {
    if (!isEditMode) return;
    setForm((f) => ({ ...f, correct_answer: editAnswers }));
  }, [editAnswers, isEditMode]);

  // ── Create mode: sync [ANS:xxx] template → form.answer + form.correct_answer
  useEffect(() => {
    if (isEditMode) return;
    const t = setTimeout(() => {
      setForm((f) => ({
        ...f,
        answer: editorTemplateToApi(template),
        correct_answer: extractAnswersFromTemplate(template),
      }));
    }, 50);
    return () => clearTimeout(t);
  }, [template, isEditMode]);

  // insertPlaceholder — ganti string literal
  const insertPlaceholder = () => setTemplate((t) => t + "<<jawaban>>");

  const handleSubmit = () => {
    if (!form.question.trim()) return void toast.error("Pertanyaan tidak boleh kosong.");
    if (!template.trim()) return void toast.error("Template kode tidak boleh kosong.");

    const answers = isEditMode ? editAnswers : form.correct_answer as string[];
    if (answers.length === 0) return void toast.error("Minimal satu placeholder harus ada.");
    if (answers.some((a) => !a.trim())) return void toast.error("Semua jawaban placeholder harus diisi.");

    onSave({ ...form, correct_answer: answers }, () => {
      if (!initial) {
        setForm(makeDefault());
        setTemplate("");
      }
    });
  };

  // displayed answers for preview/list
  const displayAnswers = isEditMode ? editAnswers : (form.correct_answer as string[]);

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
              onChange={set}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* ── code editor ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <SectionHeading>Template Kode</SectionHeading>
            {!isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={insertPlaceholder}
                className="gap-1.5 h-7 text-xs"
              >
                <code className="font-mono bg-muted px-1 rounded text-amber-600">
                  {"<<jawaban_benar>>"}
                </code>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isEditMode ? (
              <>
                Edit kode. Placeholder{" "}
                <code className="font-mono bg-muted px-1 rounded text-amber-600">{"<<N>>"}</code>{" "}
                tetap as-is — isi jawaban di bawah editor.
              </>
            ) : (
              <>
                Tulis kode lengkap. Tandai bagian kosong dengan{" "}
                <code className="font-mono bg-muted px-1 rounded text-amber-600">
                  {"<<N>>"}
                </code>
                . Gunakan Enter dan Tab seperti biasa.
              </>
            )}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <CodeEditor
            value={template}
            onChange={setTemplate}
            language={langKey}
            blankStyle="exact"
            minHeight={140}
          />

          {/* ── Edit mode: manual correct_answer inputs ── */}
          {isEditMode && editAnswers.length > 0 && (
            <div className="rounded-lg border bg-amber-50/60 border-amber-200 p-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 mb-2">
                Jawaban Placeholder ({editAnswers.length})
              </p>
              <div className="flex flex-col gap-2">
                {editAnswers.map((ans, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-600 font-bold shrink-0">
                      [{i}]
                    </span>
                    <span className="font-mono text-sm font-bold text-amber-700 shrink-0 text-right">
                      {ans.length}
                    </span>
                    <Input
                      value={ans}
                      placeholder={`Jawaban placeholder ke-${i}`}
                      onChange={(e) =>
                        setEditAnswers((prev) =>
                          prev.map((v, j) => (j === i ? e.target.value : v))
                        )
                      }
                      className="font-mono text-sm h-8 border-amber-200 focus-visible:ring-amber-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Create mode: auto-detected answers preview ── */}
          {!isEditMode && displayAnswers.length > 0 && (
            <div className="rounded-lg border bg-amber-50/60 border-amber-200 p-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 mb-2">
                Jawaban Terdeteksi ({displayAnswers.length})
              </p>
              <div className="flex flex-col gap-1.5">
                {displayAnswers.map((ans, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-600 font-bold w-6">
                      [{i}]
                    </span>
                    <span className="font-mono text-sm text-amber-800 flex-1 break-all">
                      {ans || <em className="text-amber-400 not-italic">kosong</em>}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-amber-600 mt-2">
                Jawaban diambil otomatis dari [ANS:…] di editor.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── payload preview ── */}
      <PayloadPreview
        data={{ type: 3, answer: form.answer, correct_answer: displayAnswers }}
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