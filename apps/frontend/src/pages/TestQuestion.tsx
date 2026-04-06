import { useEffect, useState, useRef, useMemo, lazy } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const QuizSingle = lazy(() => import("@/components/QuizSingle"));
const QuizMulti = lazy(() => import("@/components/QuizMulti"));
const CodeFill = lazy(() => import("@/components/CodeFill"));

import { submitAnswer } from "@/lib/submitAnswer"
import { saveQuestionsToLocal, validateAnswer } from "@/lib/utils"
import { BACKEND_URL, CATEGORIES, HL_LANGUAGES, LANGUAGES } from "@/constants"
import { DifficultyStars, TypeBadge } from "@/components/shared"
import { useAuth } from "@/context/MainContext"
import { RotateCw } from "lucide-react"

export default function TestQuestion() {
  const { questions, setQuestions } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const answerRef = useRef<any>(null)

  const useFilterType = false; // Set ke true jika ingin filter tipe tertentu
  const targetType = 4;        // Tipe yang diinginkan jika useFilterType = true

  // 1. Dapatkan soal secara stabil (hanya berubah jika ID di URL atau list questions berubah)
  const question = useMemo(() => {

    if (!questions || questions.length === 0) return null;

    // 1. Jika ada ID di URL, cari soal tersebut (tanpa peduli tipe)
    if (id) {
      const targetId = Number(id);
      return questions.find((q) => q.id === targetId) || null;
    }

    // 2. Jika tidak ada ID, tentukan daftar soal yang tersedia
    const availableQuestions = useFilterType
      ? questions.filter((q) => q.type === targetType)
      : questions;

    if (availableQuestions.length === 0) return null;

    // 3. Ambil acak dari daftar yang tersedia
    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  }, [questions, id, useFilterType, targetType]);

  useEffect(() => {
    // 1. Jangan jalankan jika soal belum terpilih
    if (!question) return;

    // 2. Gunakan toast.dismiss() untuk membersihkan toast sebelumnya 
    // atau gunakan ID unik agar toast baru menimpa yang lama
    const toastId = `question-hint-${question.id}`;
    console.log("toastId", toastId);

    // 3. Beri sedikit delay agar transisi render selesai
    const timeout = setTimeout(() => {
      const message = Array.isArray(question.correct_answer)
        ? JSON.stringify(question.correct_answer)
        : String(question.correct_answer);

      toast.info(message, {
        id: toastId, // Ini kunci agar tidak duplikat/delay
        position: "top-center",
        duration: Infinity,
        closeButton: true
      });
    }, 200);

    return () => {
      clearTimeout(timeout);
      toast.dismiss(toastId);
    };
  }, [question?.id]); // Gunakan ID sebagai dependensi agar lebih spesifik


  // Pastikan useEffect Keyboard menangkap perubahan question
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Cek apakah tombol Ctrl (Windows/Linux) atau Command (Mac) ditekan
      const isControlPressed = e.ctrlKey || e.metaKey;

      if (isControlPressed) {
        if (e.key === "ArrowRight") {
          // Mencegah perilaku default browser jika ada (misal: pindah fokus)
          e.preventDefault();
          goTo('next');
        }

        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goTo('prev');
        }
      }
    };

    // 2. Gunakan listener pada window
    // Kita TIDAK lagi mem-filter HTMLInputElement agar shortcut tetap jalan saat fokus di input
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [question, questions, useFilterType, targetType]); // Pastikan semua deps navigasi masuk

  const refreshCurrentQuestion = async () => {
    if (!question?.id) return;

    setRefreshing(true);
    const toastId = toast.loading("Mengambil data terbaru dari server...");

    try {
      const response = await fetch(`${BACKEND_URL}/api/questions/${question.id}`);
      if (!response.ok) throw new Error("Gagal mengambil data");

      const loadedQuestion = await response.json();

      // 1. Update data questions di state global
      const updatedQuestions = questions.map((q: any) =>
        q.id === loadedQuestion.id ? loadedQuestion : q
      );

      // 2. Panggil setQuestions (Context)
      setQuestions(updatedQuestions);

      // 3. Simpan ke Local Storage agar persist setelah refresh
      saveQuestionsToLocal(updatedQuestions);

      toast.success("Soal diperbarui dari database!", { id: toastId });

      // 4. Refresh halaman untuk memastikan state editor/komponen reset total
      window.location.reload();

    } catch (error) {
      console.error(error);
      toast.error("Gagal sinkronisasi dengan database.", { id: toastId });
    } finally {
      setRefreshing(false);
    }
  };

  const goTo = (direction: 'next' | 'prev') => {
    if (!questions || !question) return;

    const currentIndex = questions.findIndex((q) => q.id === question.id);

    // Fungsi pembantu untuk mengecek apakah soal sesuai kriteria
    const isValidType = (q: any) => !useFilterType || q.type === targetType;

    if (direction === 'next') {
      // Cari soal setelahnya yang memenuhi kriteria
      const nextQuestion = questions
        .slice(currentIndex + 1)
        .find(isValidType);

      if (nextQuestion) {
        navigate(`/test-question/${nextQuestion.id}`);
      } else {
        toast.info("Sudah mencapai soal terakhir.");
      }
    } else {
      // Cari soal sebelumnya yang memenuhi kriteria
      const prevQuestion = [...questions]
        .slice(0, currentIndex)
        .reverse()
        .find(isValidType);

      if (prevQuestion) {
        navigate(`/test-question/${prevQuestion.id}`);
      } else {
        toast.info("Ini adalah soal pertama.");
      }
    }
  };

  // ... fungsi handleSubmit dan renderQuestion tetap sama ...
  async function handleSubmit(e?: React.SubmitEvent) {
    e?.preventDefault()
    if (!question) return

    if (!validateAnswer(question, answerRef.current)) {
      toast.error("Jawaban belum lengkap!", { position: "top-center", duration: 1000 })
      return
    }

    setLoading(true)
    try {
      const result = await submitAnswer(question, answerRef.current)
      if (result.correct) {
        toast.success("Benar! ✓", { position: "top-left", duration: 1000 })
      } else {
        const data = Array.isArray(question.correct_answer) ? JSON.stringify(question.correct_answer) : question.correct_answer;
        toast.info(`Salah: ${data}`, {
          position: "top-left"
        })
      }
    } catch (e) {
      toast.error(`Gagal terhubung ke server.`, { position: "top-center", duration: 1000 })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (question?.type === 3 || question?.type === 4) return
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }
  }

  function renderQuestion() {
    if (!question) return null
    switch (question.type) {
      case 1:
        return <QuizSingle options={question.answer as string[]} onAnswer={(v) => { answerRef.current = v }} />
      case 2:
        return <QuizMulti options={question.answer as string[]} onAnswer={(v) => { answerRef.current = v }} />
      case 3:
      case 4:
        return <CodeFill classNames="selectable" template={question.answer as string} language={HL_LANGUAGES[question.language]} onAnswer={(v) => { answerRef.current = v }} />
      default:
        return null
    }
  }

  // Jika data questions belum ada (masih loading dari Context)
  if (!questions) return <p className="text-center mt-8">Memuat soal...</p>

  if (!question) return (
    <div className="text-center mt-8">
      <p className="text-destructive">Soal tidak ditemukan.</p>
      <Button className="mt-4" onClick={() => navigate("/")}>Kembali ke Beranda</Button>
    </div>
  )

  return (
    <div className="pt-20">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-center">Testing Soal (Development)</h1>
        {/* Tombol Refresh */}
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshCurrentQuestion}
          disabled={refreshing}
          className="text-muted-foreground hover:text-primary gap-2"
        >
          <RotateCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh dari DB
        </Button>
      </div>
      <Card className="max-w-3xl mx-auto mt-8">
        {/* Isi Card tetap sama */}
        <CardHeader className="font-semibold">
          <div className="flex flex-wrap gap-1.5 items-center">
            <TypeBadge type={question.type} />
            <Badge variant="secondary" className="text-[11px]">{CATEGORIES[question.category]}</Badge>
            <Badge variant="secondary" className="text-[11px]">{LANGUAGES[question.language]}</Badge>
            <DifficultyStars level={question.difficulty} />
            <Badge variant="outline" className="text-[11px]">{question.points} pts</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
            <div className="prose max-w-none selectable">
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {question.question}
              </ReactMarkdown>
            </div>

            {renderQuestion()}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => goTo('prev')}>
                ← Sebelumnya
              </Button>
              <Button type="button" variant="outline" onClick={() => goTo('next')}>
                Lewati →
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Memeriksa..." : "Periksa ✓"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}