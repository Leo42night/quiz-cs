/**
 * kelola_soal/Index.tsx
 *
 * Tiga tab utama menggunakan ShadCN Tabs:
 *   · Buat Soal  — pilih tipe → render FormTipe1/2/3/4
 *   · Daftar Soal — DaftarSoal dengan filter & export
 *   · Export cURL — semua soal sekaligus
 */

import { useState, useCallback, useEffect } from "react";
import { BookOpen, PlusCircle, Terminal } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/custom/toaster";
import { toast } from "@/hooks/useToast";
import { TypeBadge } from "@/components/shared";
import FormTipe1 from "@/kelola_soal/FormTipe1";
import FormTipe2 from "@/kelola_soal/FormTipe2";
import FormTipe3 from "@/kelola_soal/FormTipe3";
import FormTipe4 from "@/kelola_soal/FormTipe4";
import DaftarSoal from "@/kelola_soal/DaftarSoal";
import { saveQuestion, saveQuestions, syncQuestions, updateQuestion } from "@/lib/utils";
import { Navigate, useSearchParams } from "react-router-dom";
import { BACKEND_URL, SECRET_KEY } from "@/constants";
import type { Question, QuestionType } from "shared";
// ─── Type selector cards ───────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  {
    type: 1 as QuestionType,
    label: "Single Answer",
    desc: "Satu jawaban benar",
    accent: "border-blue-200 hover:border-blue-400 data-[active=true]:border-blue-500 data-[active=true]:bg-blue-50",
    dot: "bg-blue-500",
  },
  {
    type: 2 as QuestionType,
    label: "Multi Answer",
    desc: "Beberapa jawaban benar",
    accent: "border-emerald-200 hover:border-emerald-400 data-[active=true]:border-emerald-500 data-[active=true]:bg-emerald-50",
    dot: "bg-emerald-500",
  },
  {
    type: 3 as QuestionType,
    label: "Code Fill Exact",
    desc: "Jawaban persis sama",
    accent: "border-amber-200 hover:border-amber-400 data-[active=true]:border-amber-500 data-[active=true]:bg-amber-50",
    dot: "bg-amber-500",
  },
  {
    type: 4 as QuestionType,
    label: "Code Fill Regex",
    desc: "Divalidasi dengan regex",
    accent: "border-rose-200 hover:border-rose-400 data-[active=true]:border-rose-500 data-[active=true]:bg-rose-50",
    dot: "bg-rose-500",
  },
] as const;

// ─── Export tab ────────────────────────────────────────────────────────────────

function ExportTab({
  questions,
  baseUrl,
  onBaseUrlChange,
}: {
  questions: Question[];
  baseUrl: string;
  onBaseUrlChange: (v: string) => void;
}) {
  const [copied, setCopied] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  function buildCurl(q: Question) {
    const { id: _id, ...payload } = q as Question & { id: number };
    return `curl -X POST ${baseUrl}/api/question \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(payload, null, 2)}'`;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Konfigurasi
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Base URL
              </label>
              <Input
                value={baseUrl}
                onChange={(e) => onBaseUrlChange(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            {questions.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  const all = questions.map(buildCurl).join("\n\n# ---\n\n");
                  navigator.clipboard.writeText(all).then(() => {
                    setCopiedAll(true);
                    setTimeout(() => setCopiedAll(false), 2500);
                  });
                }}
              >
                {copiedAll ? "✓ Tersalin!" : `Copy Semua (${questions.length})`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {questions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Terminal className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Belum ada soal untuk diekspor.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((q, idx) => {
            const curl = buildCurl(q);
            return (
              <Card key={q.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground font-bold">
                        {idx + 1}.
                      </span>
                      <TypeBadge type={q.type} />
                      <span className="text-sm truncate">{q.question}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(curl).then(() => {
                          setCopied(idx);
                          setTimeout(() => setCopied(null), 2000);
                        });
                      }}
                    >
                      {copied === idx ? "✓ Copied!" : "Copy"}
                    </Button>
                  </div>
                  <pre className="font-mono text-[11px] bg-[#1a1a2e] text-slate-300 rounded-lg p-3 overflow-x-auto whitespace-pre leading-relaxed">
                    {curl}
                  </pre>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState("create");
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedType, setSelectedType] = useState<QuestionType>(1);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [baseUrl, setBaseUrl] = useState(BACKEND_URL || "http://localhost:3000");
  const [resetForm, setResetForm] = useState<(() => void) | null>(null);

  useEffect(() => {
    syncQuestions(setQuestions);
  }, []);

  // Ambil nilai dari query param 'key'
  const accessKey = searchParams.get("key");

  // Validasi: Jika key tidak ada atau salah, tendang balik ke home
  if (accessKey !== SECRET_KEY) {
    return <Navigate to="/" replace />;
  }

  const handleSave = useCallback(
    async (data: Omit<Question, "id">, onSuccess?: () => void) => {
      try {
        if (editingQuestion) {
          const resQ = await updateQuestion(editingQuestion.id, data);
          if (!resQ.ok) throw new Error(`Jawaban quiz gagal diupdate: ${resQ.status}`);
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === editingQuestion.id
                ? ({ ...data, id: editingQuestion.id } as Question)
                : q
            )
          );
          setEditingQuestion(null);
        } else {
          const resQ = await saveQuestion(data);
          if (!resQ.ok) throw new Error(`Soal gagal disimpan: ${resQ.status}`);
          const saved = await resQ.json(); // ambil id dari backend kalau ada
          setQuestions((prev) => [...prev, { ...data, id: saved?.id ?? Date.now() } as Question]);
        }
        toast.success(editingQuestion ? "Soal berhasil diupdate!" : "Soal berhasil disimpan!", {
          position: "top-left"
        });
        onSuccess?.();
      } catch (e) {
        toast.error(`${e}`);
      }
    },
    [editingQuestion]
  );

  useEffect(() => {
    saveQuestions(questions);
  }, [questions]);

  const handleEdit = useCallback((q: Question) => {
    setEditingQuestion(q);
    setSelectedType(q.type);

    // pindahkan tampilan ke form
    setActiveTab("create");
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingQuestion(null);
    console.log("handleCancleEdit")
    resetForm?.();
  }, [resetForm]);

  return (
    <div className="min-h-screen bg-background">
      {/* ── header ── */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid grid-cols-2 gap-0.75">
              {([["bg-blue-500", "P"], ["bg-emerald-500", "P"], ["bg-amber-500", "W"], ["bg-rose-500", "L"]] as const).map(
                (c, i) => (
                  <div key={i} className={`rounded-xs ${c[0]} px-2 text-center text-xs`}>{c[1]}</div>
                )
              )}
            </div>
            <span className="font-semibold text-sm tracking-tight">
              Quiz Question Manager
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {questions.length} soal
          </Badge>
        </div>
      </header>

      {/* ── main ── */}
      <main className="max-w-4xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="create" className="flex-1 gap-1.5">
              <PlusCircle className="h-3.5 w-3.5" />
              {editingQuestion ? "Edit Soal" : "Buat Soal"}
            </TabsTrigger>
            <TabsTrigger value="list" className="flex-1 gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Daftar Soal
              {questions.length > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
                  {questions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="export" className="flex-1 gap-1.5">
              <Terminal className="h-3.5 w-3.5" />
              Export cURL
            </TabsTrigger>
          </TabsList>

          {/* ── create / edit ── */}
          <TabsContent value="create">
            {editingQuestion ? (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <TypeBadge type={editingQuestion.type} />
                <span className="text-sm text-muted-foreground flex-1">
                  Mode edit — perubahan akan menimpa soal yang ada.
                </span>
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  Batal Edit
                </Button>
              </div>
            ) : (
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Pilih Tipe Soal
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      data-active={selectedType === opt.type}
                      onClick={() => setSelectedType(opt.type)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${opt.accent}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-2 h-2 rounded-full ${opt.dot}`} />
                        <span className="text-[10px] font-bold text-muted-foreground">
                          Tipe {opt.type}
                        </span>
                      </div>
                      <p className="text-xs font-semibold leading-tight">
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(editingQuestion?.type ?? selectedType) === 1 && (
              <FormTipe1
                initial={editingQuestion?.type === 1 ? editingQuestion : undefined}
                onSave={(d, onSuccess) => handleSave(d as Omit<Question, "id">, onSuccess)}
                onReady={(reset) => setResetForm(() => reset)}
                onCancel={editingQuestion ? handleCancelEdit : undefined}
              />
            )}
            {(editingQuestion?.type ?? selectedType) === 2 && (
              <FormTipe2
                initial={editingQuestion?.type === 2 ? editingQuestion : undefined}
                onSave={(d, onSuccess) => handleSave(d as Omit<Question, "id">, onSuccess)}
                onReady={(reset) => setResetForm(() => reset)}
                onCancel={editingQuestion ? handleCancelEdit : undefined}
              />
            )}
            {(editingQuestion?.type ?? selectedType) === 3 && (
              <FormTipe3
                initial={editingQuestion?.type === 3 ? editingQuestion : undefined}
                onSave={(d, onSuccess) => handleSave(d as Omit<Question, "id">, onSuccess)}
                onReady={(reset) => setResetForm(() => reset)}
                onCancel={editingQuestion ? handleCancelEdit : undefined}
              />
            )}
            {(editingQuestion?.type ?? selectedType) === 4 && (
              <FormTipe4
                initial={editingQuestion?.type === 4 ? editingQuestion : undefined}
                onSave={(d, onSuccess) => handleSave(d as Omit<Question, "id">, onSuccess)}
                onReady={(reset) => setResetForm(() => reset)}
                onCancel={editingQuestion ? handleCancelEdit : undefined}
              />
            )}
          </TabsContent>

          {/* ── list ── */}
          <TabsContent value="list">
            <DaftarSoal
              questions={questions}
              onQuestionsChange={(qs) => {
                setQuestions(qs);
                saveQuestions(qs);
              }}
              onEdit={handleEdit}
              baseUrl={baseUrl}
            />
          </TabsContent>

          {/* ── export ── */}
          <TabsContent value="export">
            <ExportTab
              questions={questions}
              baseUrl={baseUrl}
              onBaseUrlChange={setBaseUrl}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Toaster />
    </div>
  );
}