/**
 * FormTipe3.tsx — Code Fill (Exact Match)
 *
 * Editor kode interaktif dengan highlight.js via CodeJar.
 * Placeholder ditulis sebagai [ANS:jawaban_benar] di editor,
 * dikonversi ke <<N>> saat disimpan ke API.
 *
 * Payload yang dihasilkan:
 *   type            : 3
 *   answer          : string   — kode dengan <<N>>, literal \n \t
 *   correct_answer  : string[] — jawaban per placeholder (urut kemunculan)
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { toast } from "sonner";
import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CodeEditor } from "@/components/custom/codeEditor";

import type { CodeFillExactQuestion } from "shared";
import { HL_LANGUAGES } from "@/constants";
import { extractAnswersFromTemplate, apiTemplateToEditor, editorTemplateToApi } from "@/lib/utils";
import { PayloadPreview, SectionHeading } from "./Shared";
const CommonFields = lazy(() => import("./CommonFields").then(module => ({ default: module.CommonFields })));

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

  // Editor state: human-friendly [ANS:xxx] template
  const [template, setTemplate] = useState<string>(() =>
    initial?.answer
      ? apiTemplateToEditor(initial.answer, initial.correct_answer)
      : ""
  );

  // Sync template → form.answer + form.correct_answer
  useEffect(() => {
    const t = setTimeout(() => {
      setForm((f) => ({
        ...f,
        answer: editorTemplateToApi(template),
        correct_answer: extractAnswersFromTemplate(template),
      }));
    }, 50);

    return () => clearTimeout(t);
  }, [template]);

  const set = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  // When language changes we need the editor to re-highlight
  const langKey = HL_LANGUAGES[form.language] ?? "javascript";

  const insertPlaceholder = () => setTemplate((t) => t + "[ANS:jawaban]");

  const handleSubmit = () => {
    if (!form.question.trim()) return void toast.error("Pertanyaan tidak boleh kosong.");
    if (!template.trim()) return void toast.error("Template kode tidak boleh kosong.");
    if (form.correct_answer.some((a) => !a.trim()))
      return void toast.error("Semua jawaban placeholder harus diisi.");
    onSave(form, () => {  // pass reset callback
      if (!initial) {
        setForm(makeDefault());
        setTemplate("");
      }
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

      {/* ── code editor ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <SectionHeading>Template Kode</SectionHeading>
            <Button
              variant="outline"
              size="sm"
              onClick={insertPlaceholder}
              className="gap-1.5 h-7 text-xs"
            >
              <Code2 className="h-3 w-3" /> [ANS:…]
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tulis kode lengkap. Tandai bagian kosong dengan{" "}
            <code className="font-mono bg-muted px-1 rounded text-amber-600">
              [ANS:jawaban_benar]
            </code>
            . Gunakan Enter dan Tab seperti biasa.
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

          {/* ── jawaban terdeteksi ── */}
          {form.correct_answer.length > 0 && (
            <div className="rounded-lg border bg-amber-50/60 border-amber-200 p-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 mb-2">
                Jawaban Terdeteksi ({form.correct_answer.length})
              </p>
              <div className="flex flex-col gap-1.5">
                {form.correct_answer.map((ans, i) => (
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
                Jawaban diambil otomatis dari [ANS:…] di editor. Edit template untuk mengubah.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── payload preview ── */}
      <PayloadPreview
        data={{
          type: 3,
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