/**
 * DaftarSoal.tsx — Daftar & manajemen semua soal tersimpan.
 *
 * Fitur:
 *  - Statistik ringkas per tipe
 *  - Filter: tipe · kategori · bahasa · difficulty
 *  - Search teks pertanyaan
 *  - Expand row → detail jawaban + CodePreview untuk code-fill
 *  - Edit / hapus per soal
 *  - Copy cURL per soal atau semua sekaligus
 */

import { useState, useMemo } from "react";
import { toast } from "@/hooks/useToast";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Copy,
  CheckCheck,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CodePreview } from "@/components/custom/codeEditor";
import { TypeBadge, DifficultyStars } from "@/components/shared";
import type {
  Question,
  QuestionType
} from "@/types";
import { saveQuestions } from "@/types";
import { HL_LANGUAGES, LANGUAGES, CATEGORIES, TYPE_LABELS, BACKEND_URL } from "@/constants";

// ─── curl builder ─────────────────────────────────────────────────────────────

function buildCurl(q: Question, baseUrl: string): string {
  const { id: _id, ...payload } = q as Question & { id: number };
  return `curl -X POST ${baseUrl}/api/question \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(payload, null, 2)}'`;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

const STAT_CLASSES: Record<QuestionType, string> = {
  1: "bg-blue-50 border-blue-100 text-blue-700",
  2: "bg-emerald-50 border-emerald-100 text-emerald-700",
  3: "bg-amber-50 border-amber-100 text-amber-700",
  4: "bg-rose-50 border-rose-100 text-rose-700",
};

// ─── Detail panel (expanded row) ─────────────────────────────────────────────

function QuestionDetail({ q }: { q: Question }) {
  const langKey = HL_LANGUAGES[q.language] ?? "javascript";

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      {/* quiz choices */}
      {(q.type === 1 || q.type === 2) && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Pilihan Jawaban
          </p>
          <div className="flex flex-col gap-1.5">
            {q.answer.map((ans, i) => {
              const isCorrect =
                q.type === 1
                  ? q.correct_answer === i
                  : (q.correct_answer as number[]).includes(i);
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border ${isCorrect
                    ? q.type === 1
                      ? "bg-blue-50 border-blue-200 text-blue-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-muted/30 border-border text-muted-foreground"
                    }`}
                >
                  <span className="font-bold text-xs w-5">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{ans}</span>
                  {isCorrect && (
                    <CheckCheck className="h-3.5 w-3.5 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* code template */}
      {(q.type === 3 || q.type === 4) && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Template Kode
          </p>
          <CodePreview
            code={(q.answer as string)
              .replace(/\\n/g, "\n")
              .replace(/\\t/g, "\t")
              .replace(/<<\d+>>/g, (m) => `[ANS:${"_".repeat(+(m.slice(2, -2)) || 4)}]`)}
            language={langKey}
            blankStyle={q.type === 3 ? "exact" : "regex"}
          />
        </div>
      )}

      {/* correct answers */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Jawaban Benar
        </p>
        <div className="flex flex-wrap gap-2">
          {q.type === 1 && (
            <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700 border-blue-200">
              [{q.correct_answer as number}] {q.answer[q.correct_answer as number]}
            </Badge>
          )}
          {q.type === 2 &&
            (q.correct_answer as number[]).map((i) => (
              <Badge
                key={i}
                variant="outline"
                className="font-mono bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                [{i}] {q.answer[i]}
              </Badge>
            ))}
          {q.type === 3 &&
            (q.correct_answer as string[]).map((ans, i) => (
              <Badge
                key={i}
                variant="outline"
                className="font-mono bg-amber-50 text-amber-700 border-amber-200"
              >
                [{i}] {ans}
              </Badge>
            ))}
          {q.type === 4 && (
            <Badge
              variant="outline"
              className="font-mono bg-rose-50 text-rose-700 border-rose-200"
            >
              /{q.correct_answer as string}/
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  questions: Question[];
  onQuestionsChange: (qs: Question[]) => void;
  onEdit: (q: Question) => void;
  baseUrl?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DaftarSoal({
  questions,
  onQuestionsChange,
  onEdit,
  baseUrl = BACKEND_URL || "http://localhost:3000",
}: Props) {
  const [filterType, setFilterType] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterLang, setFilterLang] = useState("");
  const [filterDiff, setFilterDiff] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showCurlId, setShowCurlId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const filtered = useMemo(
    () =>
      questions.filter((q) => {
        if (filterType && q.type !== +filterType) return false;
        if (filterCat && q.category !== +filterCat) return false;
        if (filterLang && q.language !== +filterLang) return false;
        if (filterDiff && q.difficulty !== +filterDiff) return false;
        if (search && !q.question.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      }),
    [questions, filterType, filterCat, filterLang, filterDiff, search]
  );

  const handleDelete = (id: number) => {
    toast("Hapus soal ini?", {
      action: {
        label: "Hapus",
        onClick: () => {
          const updated = questions.filter((q) => q.id !== id);
          onQuestionsChange(updated);
          saveQuestions(updated);
          toast.success("Soal berhasil dihapus.");
        },
      },
      cancel: { label: "Batal", onClick: () => { } },
    });
  };

  const copyCurl = (q: Question) => {
    navigator.clipboard.writeText(buildCurl(q, baseUrl)).then(() => {
      setCopiedId(q.id);
      toast.success("cURL berhasil dicopy!");
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const copyAll = () => {
    const text = questions.map((q) => buildCurl(q, baseUrl)).join("\n\n# ---\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAll(true);
      toast.success(`${questions.length} cURL berhasil dicopy!`);
      setTimeout(() => setCopiedAll(false), 2500);
    });
  };

  const byType = [1, 2, 3, 4].map((t) => ({
    type: t as QuestionType,
    count: questions.filter((q) => q.type === t).length,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* ── stat cards ── */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="p-4 flex flex-col justify-between">
          <p className="text-xs text-muted-foreground font-medium">Total</p>
          <p className="text-2xl font-bold">{questions.length}</p>
        </Card>
        {byType.map(({ type, count }) => (
          <div
            key={type}
            className={`rounded-xl border p-4 flex flex-col justify-between ${STAT_CLASSES[type]}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">
              {TYPE_LABELS[type]}
            </p>
            <p className="text-xl font-bold">{count}</p>
          </div>
        ))}
      </div>

      {/* ── filters ── */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              placeholder="🔍 Cari pertanyaan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-45 h-8 text-sm"
            />
            {[
              {
                value: filterType,
                setter: setFilterType,
                placeholder: "Semua tipe",
                options: [1, 2, 3, 4].map((v) => ({
                  value: String(v),
                  label: TYPE_LABELS[v],
                })),
              },
              {
                value: filterCat,
                setter: setFilterCat,
                placeholder: "Semua kategori",
                options: Object.entries(CATEGORIES).map(([v, l]) => ({
                  value: v,
                  label: l,
                })),
              },
              {
                value: filterLang,
                setter: setFilterLang,
                placeholder: "Semua bahasa",
                options: Object.entries(LANGUAGES).map(([v, l]) => ({
                  value: v,
                  label: l,
                })),
              },
              {
                value: filterDiff,
                setter: setFilterDiff,
                placeholder: "Difficulty",
                options: [
                  { value: "1", label: "Easy" },
                  { value: "2", label: "Medium" },
                  { value: "3", label: "Hard" },
                ],
              },
            ].map((f, i) => (
              <Select
                key={i}
                value={f.value || "_all"}
                onValueChange={(v) => f.setter(v === "_all" ? "" : v)}
              >
                <SelectTrigger className="w-auto min-w-[130px] h-8 text-sm">
                  <SelectValue placeholder={f.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{f.placeholder}</SelectItem>
                  {f.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            {questions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyAll}
                className="gap-1.5 h-8"
              >
                {copiedAll ? (
                  <CheckCheck className="h-3.5 w-3.5" />
                ) : (
                  <Terminal className="h-3.5 w-3.5" />
                )}
                {copiedAll ? "Tersalin!" : "Copy Semua cURL"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── list ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">
            {questions.length === 0
              ? "Belum ada soal. Buat soal baru dari tab Buat Soal."
              : "Tidak ada soal yang cocok dengan filter."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((q, idx) => (
            <Card
              key={q.id}
              className={`overflow-hidden transition-colors ${expandedId === q.id ? "border-primary/30" : ""
                }`}
            >
              {/* header row */}
              <div
                className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() =>
                  setExpandedId(expandedId === q.id ? null : q.id)
                }
              >
                <span className="text-xs font-bold text-muted-foreground/50 w-6 shrink-0 mt-0.5 select-none">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug mb-2">
                    {q.question}
                  </p>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <TypeBadge type={q.type} />
                    <Badge variant="secondary" className="text-[11px]">
                      {CATEGORIES[q.category]}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px]">
                      {LANGUAGES[q.language]}
                    </Badge>
                    <DifficultyStars level={q.difficulty} />
                    <Badge variant="outline" className="text-[11px]">
                      {q.points} pts
                    </Badge>
                  </div>
                </div>

                {/* action buttons */}
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Copy cURL"
                    onClick={() => copyCurl(q)}
                  >
                    {copiedId === q.id ? (
                      <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Edit"
                    onClick={() => onEdit(q)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Hapus"
                    onClick={() => handleDelete(q.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* expand indicator */}
                <div className="shrink-0 text-muted-foreground/50 mt-0.5">
                  {expandedId === q.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>

              {/* expanded detail */}
              {expandedId === q.id && (
                <div className="px-4 pb-4">
                  <QuestionDetail q={q} />
                  <div className="mt-3">
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      onClick={() =>
                        setShowCurlId(showCurlId === q.id ? null : q.id)
                      }
                    >
                      <Terminal className="h-3 w-3" />
                      {showCurlId === q.id ? "Sembunyikan cURL" : "Lihat cURL"}
                    </button>
                    {showCurlId === q.id && (
                      <pre className="mt-2 font-mono text-[11px] bg-[#1a1a2e] text-slate-300 rounded-lg p-3 overflow-x-auto whitespace-pre leading-relaxed">
                        {buildCurl(q, baseUrl)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Menampilkan {filtered.length} dari {questions.length} soal
        </p>
      )}
    </div>
  );
}