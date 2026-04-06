/**
 * FormTipe4.tsx — Code Fill (Regex Match)
 *
 * Sama seperti tipe 3, namun jawaban divalidasi menggunakan regex pattern.
 * Dilengkapi regex tester real-time langsung di form.
 *
 * Payload yang dihasilkan:
 *   type            : 4
 *   answer          : string  — kode dengan <<N>>, literal \n \t
 *   correct_answer  : string  — regex pattern (tanpa ^ $, ditambahkan saat validasi)
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { toast } from "sonner";
import { Code2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CodeEditor } from "@/components/custom/codeEditor";
import { Field, PayloadPreview, SectionHeading } from "./Shared";

import type { CodeFillRegexQuestion } from "shared";
import { HL_LANGUAGES } from "@/constants";
import { apiTemplateToEditor, editorTemplateToApi } from "@/lib/utils";
const CommonFields = lazy(() => import("./CommonFields").then(module => ({ default: module.CommonFields })));

// ─── defaults ─────────────────────────────────────────────────────────────────

function makeDefault(): Omit<CodeFillRegexQuestion, "id"> {
  return {
    type: 4,
    category: 1,
    language: 1,
    difficulty: 2,
    points: 20,
    question: "",
    answer: "",
    correct_answer: "",
  };
}

// ─── regex tester ─────────────────────────────────────────────────────────────

function testRegex(pattern: string, input: string): boolean | null {
  if (!pattern || !input) return null;
  try {
    return new RegExp(`^(?:${pattern})$`).test(input);
  } catch {
    return null;
  }
}

function validateRegex(pattern: string): string {
  if (!pattern) return "";
  try {
    new RegExp(pattern);
    return "";
  } catch (e: unknown) {
    return e instanceof Error ? e.message : "Regex tidak valid";
  }
}

// ─── quick patterns ───────────────────────────────────────────────────────────

const QUICK_PATTERNS = [
  { label: "console.log|error", pattern: "console\\.(log|error)" },
  { label: "let|const|var", pattern: "(let|const|var)" },
  { label: "===|==", pattern: "===?" },
  { label: "async fn", pattern: "async\\s+function" },
  { label: "arrow =>", pattern: "\\(.*\\)\\s*=>" },
];

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  initial?: CodeFillRegexQuestion;
  onSave: (q: Omit<CodeFillRegexQuestion, "id">, onSuccess: () => void) => void;
  onReady?: (reset: () => void) => void;
  onCancel?: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function FormTipe4({ initial, onSave, onReady, onCancel }: Props) {
  const [form, setForm] = useState(() => (initial ? { ...initial } : makeDefault()));

  useEffect(() => {
    onReady?.(() => setForm(makeDefault()));
  }, []);

  const [template, setTemplate] = useState<string>(() =>
    initial?.answer ? apiTemplateToEditor(initial.answer, []) : ""
  );

  const [testInput, setTestInput] = useState("");

  // Sync template → form.answer
  useEffect(() => {
    setForm((f) => ({ ...f, answer: editorTemplateToApi(template) }));
  }, [template]);

  const set = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const langKey = HL_LANGUAGES[form.language] ?? "javascript";

  const insertPlaceholder = () => setTemplate((t) => t + "[ANS:placeholder]");

  const regexError = validateRegex(form.correct_answer);
  const testResult = testRegex(form.correct_answer, testInput);

  // count placeholders for warning
  const placeholderCount = (template.match(/\[ANS:[^\]]*\]/g) ?? []).length;

  const handleSubmit = () => {
    if (!form.question.trim()) return void toast.error("Pertanyaan tidak boleh kosong.");
    if (!template.trim()) return void toast.error("Template kode tidak boleh kosong.");
    if (!form.correct_answer.trim()) return void toast.error("Regex pattern tidak boleh kosong.");
    if (regexError) return void toast.error(`Regex tidak valid: ${regexError}`);
    onSave(form, () => {  // pass reset callback
      if (!initial) {
        setForm(makeDefault());
        setTemplate("");
        setTestInput("");
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
            <div className="flex items-center gap-2">
              {placeholderCount > 1 && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                  ⚠ idealnya 1 placeholder
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={insertPlaceholder}
                className="gap-1.5 h-7 text-xs"
              >
                <Code2 className="h-3 w-3" /> [ANS:…]
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Gunakan{" "}
            <code className="font-mono bg-muted px-1 rounded text-rose-500">
              [ANS:contoh]
            </code>{" "}
            sebagai placeholder visual. Jawaban sesungguhnya divalidasi oleh regex di bawah.
          </p>
        </CardHeader>
        <CardContent>
          <CodeEditor
            value={template}
            onChange={setTemplate}
            language={langKey}
            blankStyle="regex"
            minHeight={140}
          />
        </CardContent>
      </Card>

      {/* ── regex pattern + tester ── */}
      <Card>
        <CardHeader className="pb-2">
          <SectionHeading>Regex Pattern Jawaban</SectionHeading>
          <p className="text-xs text-muted-foreground">
            Digunakan sebagai{" "}
            <code className="font-mono bg-muted px-1 rounded">
              ^(?:pattern)$
            </code>{" "}
            saat validasi jawaban.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* pattern input */}
          <Field label="Pattern">
            <Input
              value={form.correct_answer}
              onChange={(e) => set("correct_answer", e.target.value)}
              placeholder={`console\\.(log|error)`}
              className={`font-mono text-sm ${regexError ? "border-destructive" : ""}`}
              spellCheck={false}
            />
            {regexError && (
              <p className="text-xs text-destructive">⚠ {regexError}</p>
            )}
          </Field>

          {/* quick patterns */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Contoh cepat:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PATTERNS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => set("correct_answer", p.pattern)}
                  className="font-mono text-xs px-2 py-1 rounded border border-border bg-muted hover:bg-accent transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* regex tester */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground">Regex Tester</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Ketik jawaban untuk ditest..."
                className="font-mono text-sm flex-1"
              />
              {testResult !== null && (
                <Badge
                  className={
                    testResult
                      ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                      : "bg-rose-100 text-rose-600 border-rose-300"
                  }
                  variant="outline"
                >
                  {testResult ? "✓ Match" : "✗ No match"}
                </Badge>
              )}
            </div>
            {form.correct_answer && !regexError && (
              <p className="text-[10px] font-mono text-muted-foreground">
                Testing:{" "}
                <span className="text-foreground">
                  /^(?:{form.correct_answer})$/
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── payload preview ── */}
      <PayloadPreview
        data={{
          type: 4,
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