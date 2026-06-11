import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
// import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DifficultyStars, TypeBadge } from "@/components/shared";
import { LANGUAGES, CATEGORIES, TYPE_LABELS, BACKEND_URL } from "@/constants";
import type { Question, QuestionType } from "shared";
import { saveQuestionsToLocal } from "@/lib/utils";
import { QuestionDetail } from "../Shared";
import { FILTER_STORAGE_KEY } from "../utils";

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

const getStoredFilters = () => {
  const saved = localStorage.getItem(FILTER_STORAGE_KEY);
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch {
    return {};
  }
};

// ─── Detail panel (expanded row) ─────────────────────────────────────────────


export default function DaftarSoalPage() {
  const stored = getStoredFilters();

  // Inisialisasi state dari localStorage atau default kosong
  const [filterType, setFilterType] = useState(stored.type || "");
  const [filterCat, setFilterCat] = useState(stored.category || "");
  const [filterLang, setFilterLang] = useState(stored.language || "");
  const [filterDiff, setFilterDiff] = useState(stored.difficulty || "");
  const [filterDate, setFilterDate] = useState(stored.date || "");
  const [search, setSearch] = useState(stored.search || "");

  const [sortField, setSortField] = useState<"id" | "type" | "difficulty" | "points" | "updated_at">(stored.sortField || "id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(stored.sortDir || "desc");

  const baseUrl = BACKEND_URL || "http://localhost:3000"
  const { questions, setQuestions } = useAuth();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showCurlId, setShowCurlId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  // console.log(questions.find((q) => q.id === 150));

  const filtered = useMemo(
    () =>
      questions
        .filter((q) => {
          if (filterType && q.type !== +filterType) return false;
          if (filterCat && q.category !== +filterCat) return false;
          if (filterLang && q.language !== +filterLang) return false;
          if (filterDiff && q.difficulty !== +filterDiff) return false;
          if (search && !q.question.toLowerCase().includes(search.toLowerCase())) return false;

          // --- Filter Tanggal Baru ---
          if (filterDate) {
            if (q.updated_at === 0) return false;

            const qDate = new Date(q.updated_at).getTime();
            const now = new Date().getTime();
            const oneMinute = 60 * 1000;
            const tenMinute = 10 * 60 * 1000;
            const hour = 60 * 60 * 1000;
            const oneDay = 24 * 60 * 60 * 1000;

            if (filterDate === "minute" && now - qDate > oneMinute) return false;
            if (filterDate === "ten-minute" && now - qDate > tenMinute) return false;
            if (filterDate === "hour" && now - qDate > hour) return false;
            if (filterDate === "today" && now - qDate > oneDay) return false;
          }
          return true;
        })
        .sort((a, b) => {
          const dir = sortDir === "asc" ? 1 : -1;

          // Handle null/undefined updated_at agar tidak error saat sorting
          const valA = a[sortField] ?? 0;
          const valB = b[sortField] ?? 0;

          return (valA > valB ? 1 : -1) * dir;
        }),
    [questions, filterType, filterCat, filterLang, filterDiff, filterDate, search, sortField, sortDir]
  );

  // --- Filter Start
  // Sync filter ke localStorage setiap kali ada perubahan
  useEffect(() => {
    const filterState = {
      type: filterType,
      category: filterCat,
      language: filterLang,
      difficulty: filterDiff,
      search: search,
      sortField: sortField,
      sortDir: sortDir,
      date: filterDate
    };
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filterState));
  }, [filterType, filterCat, filterLang, filterDiff, search, sortField, sortDir, filterDate]);

  const resetFilters = () => {
    setFilterType("");
    setFilterCat("");
    setFilterLang("");
    setFilterDiff("");
    setSearch("");
    setFilterDate("");
    toast.success("Filter dibersihkan");
  };
  // --- Filter End

  const copyFilteredJSON = () => {
    if (filtered.length === 0) {
      return toast.error("Tidak ada soal yang terfilter untuk dicopy.");
    }

    try {
      // 1. Konversi data filtered (termasuk ID) ke string JSON
      const jsonString = JSON.stringify(filtered, null, 2);

      // 2. Salin ke clipboard
      navigator.clipboard.writeText(jsonString).then(() => {
        setCopiedAll(true); // Opsional: gunakan state yang sudah ada untuk feedback visual
        toast.success(`${filtered.length} soal (JSON) berhasil disalin ke clipboard!`, {
          description: "Data siap di-paste ke file questions.json Anda.",
        });

        // Reset status icon setelah beberapa detik
        setTimeout(() => setCopiedAll(false), 2500);
      });
    } catch (err) {
      console.error("Gagal menyalin JSON: ", err);
      toast.error("Gagal menyalin ke clipboard.");
    }
  };

  const onEdit = (q: Question) => navigate(`/kelola-soal/${q.id}`)

  const onQuestionsChange = (qs: Question[]) => {
    setQuestions(qs);
    saveQuestionsToLocal(qs);
  }

  const handleDelete = (id: number) => {
    toast("Hapus soal ini?", {
      action: {
        label: "Hapus",
        onClick: () => {
          const updated = questions.filter((q) => q.id !== id);
          onQuestionsChange(updated);
          saveQuestionsToLocal(updated);
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

  const byType = [1, 2, 3, 4].map((t) => ({
    type: t as QuestionType,
    count: questions.filter((q) => q.type === t).length,
  }));

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* ── Sidebar Stat Cards ── */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-3 sticky top-20">
        <Card className="p-4 flex flex-col justify-between shadow-sm border-muted">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Soal</p>
          <p className="text-3xl font-extrabold mt-1">{questions.length}</p>
        </Card>

        {byType.map(({ type, count }) => (
          <div
            key={type}
            className={`rounded-xl border p-4 flex flex-col justify-between transition-all hover:shadow-md ${STAT_CLASSES[type]}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">
              {TYPE_LABELS[type]}
            </p>
            <p className="text-2xl font-bold mt-1">{count}</p>
          </div>
        ))}
      </div>

      {/* ── Main Content (Filters & List) ── */}
      <div className="flex-1 flex flex-col gap-4 w-full selectable">
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
                  <SelectTrigger className="w-auto min-w-32.5 h-8 text-sm">
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
                  onClick={copyFilteredJSON}
                  className="gap-1.5 h-8"
                >
                  {copiedAll ? (
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedAll
                    ? "Tersalin!"
                    : filterType || filterCat || filterLang || filterDiff || search || filterDate
                      ? `Copy JSON (${filtered.length} soal)`
                      : "Copy Semua JSON"
                  }
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 text-xs text-muted-foreground"
              >
                Reset Filter
              </Button>
              {/* sort field */}
              <Select value={sortField} onValueChange={(v) => setSortField(v as typeof sortField)}>
                <SelectTrigger className="w-auto min-w-32 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Urutan Input</SelectItem>
                  <SelectItem value="updated_at">Terakhir Diperbarui</SelectItem>
                  <SelectItem value="type">Tipe</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="points">Poin</SelectItem>
                </SelectContent>
              </Select>

              {/* sort direction */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                title={sortDir === "asc" ? "Ascending" : "Descending"}
              >
                {sortDir === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {/* Dropdown Filter Berdasarkan Waktu */}
              <Select
                value={filterDate || "_all"}
                onValueChange={(v) => setFilterDate(v === "_all" ? "" : v)}
              >
                <SelectTrigger className="w-auto min-w-36 h-8 text-sm">
                  <SelectValue placeholder="Semua Waktu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Semua Waktu</SelectItem>
                  <SelectItem value="minute">1 Menit</SelectItem>
                  <SelectItem value="ten-minute">10 Menit</SelectItem>
                  <SelectItem value="hour">1 Jam</SelectItem>
                  <SelectItem value="today">Hari Ini</SelectItem>
                </SelectContent>
              </Select>
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
            {filtered.map((q, _) => (
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
                  <span className="text-xs font-bold text-muted-foreground/50 w-6 shrink-0 mt-0.5">
                    {q.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium leading-snug mb-2">
                      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                        {q.question}
                      </ReactMarkdown>
                    </div>
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
                      <Badge variant="outline" className="text-[11px] text-muted-foreground">
                        {q.updated_at ? new Date(1775502365141).toLocaleDateString('id-ID') : 'N/A'}
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
    </div>
  );
}