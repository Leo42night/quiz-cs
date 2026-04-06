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

import { useState, useEffect, lazy, Suspense, useMemo } from "react";
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
const CommonFields = lazy(() => import("./CommonFields").then(module => ({ default: module.CommonFields })));


// ─── Helpers ──────────────────────────────────────────────────────────────────

/** * Mengonversi template editor <<regex>> menjadi format API <<N>> 
 * Menggunakan array maxChars yang diinput user.
 */
export function editorTemplateToApi(template: string, maxChars: number[]): string {
  let i = 0;
  return template
    .replace(/<<([^>]*)>>/g, () => {
      const n = maxChars[i++] || 5; // Default ke 5 jika tidak diisi
      return `<<${n}>>`;
    })
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
}

/** API <<N>> + Regex List → Editor <<Regex>> */
export function apiTemplateToEditor(apiAnswer: string, regexPatterns: string[]): string {
  let i = 0;
  return apiAnswer
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/<<\d+>>/g, () => `<<${regexPatterns[i++] ?? ""}>>`);
}

/** Default state */
function makeDefault(): Omit<CodeFillRegexQuestion, "id"> {
  return {
    type: 4, category: 1, language: 1, difficulty: 2, points: 20,
    question: "", answer: "", correct_answer: "",
    updated_at: 0
  };
}

function testRegex(pattern: string, input: string): boolean | null {
  if (!pattern || !input) return null;
  try { return new RegExp(`^(?:${pattern})$`).test(input); } catch { return null; }
}

function validateRegex(pattern: string): string {
  if (!pattern) return "";
  try { new RegExp(pattern); return ""; } catch (e: any) { return e.message; }
}

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  initial?: CodeFillRegexQuestion;
  onSave: (q: Omit<CodeFillRegexQuestion, "id">, onSuccess: () => void) => void;
  onReady?: (reset: () => void) => void;
  onCancel?: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function FormTipe4({ initial, onSave, onReady, onCancel }: Props) {
  const isEditMode = !!initial;
  console.log("initial", initial)

  const [form, setForm] = useState(() => (initial ? { ...initial } : makeDefault()));

  // 1. Load patterns (regex list)
  const [patterns, setPatterns] = useState<string[]>(() => {
    const rawValue = initial?.correct_answer;

    if (!rawValue) return [];

    try {
      // Coba parse jika formatnya string JSON (misal: '["abc", "def"]')
      const parsed = JSON.parse(rawValue);

      // Jika hasil parse adalah array, gunakan itu. 
      // Jika hasil parse bukan array (misal parse angka atau string tunggal), bungkus jadi array.
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      // Jika JSON.parse gagal, berarti rawValue adalah string biasa (misal: "t.String()")
      // Maka langsung bungkus ke dalam array
      return [rawValue];
    }
  });


  const [maxChars, setMaxChars] = useState<number[]>(() => {
    const matches = initial?.answer?.match(/<<(\d+)>>/g) || [];
    return matches.map(m => parseInt(m.match(/\d+/)?.[0] || "5", 10));
  });

  // 2. Load template (convert API <<len>> to Editor <<regex_hint>>)
  const [template, setTemplate] = useState<string>(() =>
    initial?.answer ? apiTemplateToEditor(initial.answer, patterns) : ""
  );
  console.log("template", template)
  console.log("patterns", patterns)

  const [testInputs, setTestInputs] = useState<string[]>([]);

  // Sync ke Payload Utama
  useEffect(() => {
    setForm((f) => ({
      ...f,
      answer: editorTemplateToApi(template, maxChars),
      correct_answer: JSON.stringify(patterns)
    }));
  }, [template, patterns, maxChars]);

  useEffect(() => {
    onReady?.(() => {
      setForm(makeDefault());
      setTemplate("");
      setPatterns([]);
    });
  }, []);

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  // Detect placeholders <<...>> secara real-time
  const placeholders = useMemo(() => {
    const matches = Array.from(template.matchAll(/<<([^>]*?)>>/g));
    return matches.map((m, i) => ({ raw: m[0], content: m[1], index: i }));
  }, [template]);

  // Adjust arrays (patterns & maxChars) saat jumlah << >> berubah
  useEffect(() => {
    if (patterns.length !== placeholders.length) {
      setPatterns(prev => {
        const next = [...prev];
        if (placeholders.length > prev.length) {
          for (let i = prev.length; i < placeholders.length; i++) next.push(placeholders[i].content || "");
        } else next.splice(placeholders.length);
        return next;
      });

      setMaxChars(prev => {
        const next = [...prev];
        if (placeholders.length > prev.length) {
          for (let i = prev.length; i < placeholders.length; i++) next.push(5); // Default 5 chars
        } else next.splice(placeholders.length);
        return next;
      });
    }
  }, [placeholders.length]);

  const updateMaxChar = (idx: number, val: string) => {
    const next = [...maxChars];
    next[idx] = parseInt(val) || 0;
    setMaxChars(next);
  };

  // Sync placeholder count dengan jumlah input regex
  useEffect(() => {
    // Di mode Create, kita ambil "isi" dari <<isi>> sebagai default regex jika array masih kosong
    if (!isEditMode && patterns.length === 0 && placeholders.length > 0) {
      setPatterns(placeholders.map(p => p.content));
      return;
    }

    if (patterns.length !== placeholders.length) {
      const newPatterns = [...patterns];
      if (placeholders.length > patterns.length) {
        for (let i = patterns.length; i < placeholders.length; i++) {
          newPatterns.push(placeholders[i].content || "");
        }
      } else {
        newPatterns.splice(placeholders.length);
      }
      setPatterns(newPatterns);
    }
  }, [placeholders.length, isEditMode]);

  const insertPlaceholder = () => setTemplate((t) => t + `<<regex>>`);

  const handleSubmit = () => {
    if (!form.question.trim()) return void toast.error("Pertanyaan tidak boleh kosong.");
    if (!template.trim()) return void toast.error("Template kode tidak boleh kosong.");
    if (placeholders.length === 0) return void toast.error("Minimal harus ada satu placeholder <<...>>");
    if (patterns.some(p => !p.trim())) return void toast.error("Semua pattern regex harus diisi.");

    const err = patterns.map(validateRegex).find(e => e !== "");
    if (err) return void toast.error(`Regex Error: ${err}`);

    onSave(form, () => {
      if (!initial) {
        setForm(makeDefault());
        setTemplate("");
        setPatterns([]);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-2"><SectionHeading>Informasi Soal</SectionHeading></CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading Form...</div>}>
            <CommonFields
              categoryId={form.category} languageId={form.language}
              difficulty={form.difficulty} points={form.points}
              question={form.question} onChange={set}
            />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <SectionHeading>Template Kode</SectionHeading>
            <Button variant="outline" size="sm" onClick={insertPlaceholder} className="gap-1.5 h-7 text-xs">
              <Code2 className="h-3 w-3" /> Insert {"<<regex>>"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tulis kode dengan placeholder <code className="text-rose-500 font-mono">{"<<pattern_regex>>"}</code>.
          </p>
        </CardHeader>
        <CardContent>
          <CodeEditor
            value={template}
            onChange={setTemplate}
            language={HL_LANGUAGES[form.language] ?? "javascript"}
            blankStyle="regex"
            minHeight={140}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <SectionHeading>Validasi & Konfigurasi Placeholder</SectionHeading>
          <p className="text-xs text-muted-foreground">Atur regex dan lebar kotak input (N) untuk tiap placeholder.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {placeholders.map((ph, idx) => (
            <div key={idx} className="space-y-4 p-4 border rounded-xl bg-muted/10 relative overflow-hidden">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-background">#{idx + 1}</Badge>
                  <code className="text-xs text-rose-500 font-bold">{ph.raw}</code>
                </div>

                {/* Input Max Character (N) */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Max Chars (N):</span>
                  <Input
                    type="number"
                    value={maxChars[idx]}
                    onChange={(e) => updateMaxChar(idx, e.target.value)}
                    className="w-16 h-7 text-xs text-center font-bold"
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Regex Input */}
                <Field label="Regex Pattern">
                  <Input
                    value={patterns[idx] || ""}
                    onChange={(e) => {
                      const next = [...patterns];
                      next[idx] = e.target.value;
                      setPatterns(next);
                    }}
                    className="font-mono text-sm h-9"
                    placeholder="e.g. (let|const)"
                  />
                </Field>

                {/* Tester */}
                <div className="space-y-2 bg-background p-2 rounded-lg border shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <FlaskConical className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Tester</span>
                    {testInputs[idx]?.length > 0 && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-mono border-amber-200 text-amber-700 bg-amber-50">
                        Len: {testInputs[idx].length}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Uji jawaban..."
                      className="h-8 text-xs font-mono"
                      value={testInputs[idx] || ""}
                      onChange={(e) => {
                        const val = e.target.value;

                        // 1. Update testInputs state
                        const nextTest = [...testInputs];
                        nextTest[idx] = val;
                        setTestInputs(nextTest);

                        // 2. Logika otomatis update Max Chars (N)
                        // Jika panjang input tester > maxChars saat ini, naikkan maxChars
                        if (val.length > (maxChars[idx] || 0)) {
                          const nextMax = [...maxChars];
                          nextMax[idx] = val.length;
                          setMaxChars(nextMax);
                        }
                      }}
                    />
                    {testInputs[idx] && (
                      <Badge className={testRegex(patterns[idx], testInputs[idx]) ? "bg-emerald-500" : "bg-rose-500"}>
                        {testRegex(patterns[idx], testInputs[idx]) ? "Match" : "Fail"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <PayloadPreview data={{ type: 4, answer: form.answer, correct_answer: patterns }} />

      <Separator />
      <div className="flex justify-end gap-2">
        {onCancel && <Button variant="outline" onClick={onCancel}>Batal</Button>}
        <Button onClick={handleSubmit}>{isEditMode ? "Update Soal" : "Simpan Soal"}</Button>
      </div>
    </div>
  );
}