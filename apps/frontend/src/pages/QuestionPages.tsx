import { useEffect, useState, useRef, Suspense, lazy } from "react"
// Import statis tetap untuk yang ringan/core
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import MarkdownLite from "@/components/MarkdownLite"

// Lazy load komponen yang berat atau kondisional
const QuizSingle = lazy(() => import("@/components/QuizSingle"))
const QuizMulti = lazy(() => import("@/components/QuizMulti"))
const CodeFill = lazy(() => import("@/components/CodeFill"))

import { submitAnswer } from "@/lib/submitAnswer"
import { useAuth } from "@/context/MainContext"
import { ANS_Q_IDS_STORAGE_KEY, BACKEND_URL, NOT_ANS_Q_IDS_STORAGE_KEY, type AnsweredLog } from "@/types"
import { safeParse, validateAnswer } from "@/lib/utils"
import { CATEGORIES, HL_LANGUAGES, LANGUAGES } from "@/constants"
import { DifficultyStars, TypeBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import fireCelebration from "@/components/Confetty"

import { TIME_LIMIT } from "@/constants"

export default function QuestionPage() {
  const {
    user,
    questions,
    activeQuestion,
    setActiveQuestion,
    setNewAnsweredQuestionIds,
    onTimeUpRef,
    addScore,
    isScoreMax,
    setIsScoreMax
  } = useAuth();

  const [answer, setAnswer] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<number[]>(
    () => safeParse(localStorage.getItem("answered_question_ids"), [])
  );
  const [notAnsweredQuestionIds, setNotAnsweredQuestionIds] = useState<number[]>(
    () => safeParse(localStorage.getItem(NOT_ANS_Q_IDS_STORAGE_KEY), [])
  );

  // --- START: handle paksa periksa answer ketika timer habis
  const answerRef = useRef<any>(null);
  // Wrapper setter agar ref selalu sync dengan state
  const handleSetAnswer = (val: any) => {
    answerRef.current = val;
    setAnswer(val);
  };

  // Register/unregister handler tiap activeQuestion berubah
  useEffect(() => {
    if (!activeQuestion) {
      onTimeUpRef.current = null;
      return;
    }

    onTimeUpRef.current = async () => {
      const currentAnswer = answerRef.current;

      // Answer kosong → skip, biarkan context lanjut ke setActiveQuestion + toast.warning
      if (!validateAnswer(activeQuestion, currentAnswer)) return;

      try {
        const result = await submitAnswer(activeQuestion, currentAnswer);

        if (result.correct) {
          toast.success(`Benar! ✓ +${activeQuestion.points} poin`, { position: "top-left" })
          handleCorrect(activeQuestion.id, activeQuestion.points);
        } else {
          toast.error("Salah ✗", { position: "top-left" })
          getNextQuestion(notAnsweredQuestionIds); // ← tambah ini
        }
      } catch (e) {
        console.error(`Gagal submit ke server. ${e}`)
        toast.error(`Gagal terhubung ke server. ${e}`, { position: "top-center" });
      }
      // Setelah resolve, context akan lanjut: setActiveQuestion(null) → toast.warning
    };

    return () => {
      onTimeUpRef.current = null;
    };
  }, [activeQuestion]);


  // --- END: handle paksa periksa answer ketika timer habis


  const fetchAnsweredIds = async () => {
    if (!user || questions.length === 0) return;
    // console.log("fetchAnsweredIds user", user);
    const res = await fetch(`${BACKEND_URL}/api/users/${user.id}/question-ids`);
    if (!res.ok) return toast.error(`Gagal ambil riwayat quiz user: ${res.statusText}`);

    const userQuestionsIds: number[] = await res.json();
    setAnsweredQuestionIds(userQuestionsIds);
    localStorage.setItem(ANS_Q_IDS_STORAGE_KEY, JSON.stringify(userQuestionsIds));

    // Hitung soal yang belum dijawab
    if (userQuestionsIds.length < questions.length) {
      const unanswered = questions
        .filter((q) => !userQuestionsIds.includes(q.id))
        .map((q) => q.id);
      setNotAnsweredQuestionIds(unanswered);
      localStorage.setItem(NOT_ANS_Q_IDS_STORAGE_KEY, JSON.stringify(unanswered));
    } else {
      // Semua soal sudah dijawab
      setNotAnsweredQuestionIds([]);
      localStorage.setItem(NOT_ANS_Q_IDS_STORAGE_KEY, JSON.stringify([]));
    }
  };

  useEffect(() => {
    fetchAnsweredIds();
  }, [user, questions]);

  // Jika notAnsweredQuestionIds kosong, reload answeredQuestionIds dari server
  useEffect(() => {
    if (notAnsweredQuestionIds.length === 0 && user && questions.length > 0) {
      fetchAnsweredIds();
    }
  }, [notAnsweredQuestionIds]);

  // jawaban berhasil
  useEffect(() => {
    if (!user || isScoreMax) return;
    if (user.score >= user.score_max) {
      fireCelebration();
      toast.success("Achieved score max!", { position: "bottom-left", icon: '🎉' });
      setIsScoreMax(true);
    }
  }, [user?.score]);

  const getNextQuestion = (currentNotAnswered: number[]) => {
    if (currentNotAnswered.length === 0) {
      setActiveQuestion(null);
      return;
    }
    const randomId = currentNotAnswered[Math.floor(Math.random() * currentNotAnswered.length)];
    
    // -- Main --
    // const found = questions.find((q) => q.id === randomId);
    // --- Custom debug: Per type --- 
    const found = questions.find((q) => q.id === randomId && q.type === 4);
    // --- Custom debug: Spesific ID ---
    // const randomId = 34;
    // const found = questions.find((q) => q.id === randomId);
    if (found) {
      // console.log("activeQuestion", found);
      setActiveQuestion(found);
      setAnswer(null);
      answerRef.current = null; // reset ref juga
    } else {
      getNextQuestion(currentNotAnswered);
    }
  };

  // Helper: hapus id dari notAnswered lalu lanjut ke soal berikutnya
  const handleCorrect = (qId: number, points: number) => {
    saveProgress(qId);
    if (!user) return;

    addScore(points);
    setNewAnsweredQuestionIds((prev) =>
      prev.includes(qId) ? prev : [...prev, qId]
    );

    // ✅ Hitung updated di luar updater, lalu panggil setState dan getNextQuestion terpisah
    const updated = notAnsweredQuestionIds.filter((id) => id !== qId);
    localStorage.setItem(NOT_ANS_Q_IDS_STORAGE_KEY, JSON.stringify(updated));
    setNotAnsweredQuestionIds(updated);
    getNextQuestion(updated); // aman — dipanggil di event handler, bukan di updater
  };

  const getRandomQuestion = () => {
    if (!user) return toast.error("Silakan Login dulu!", { position: "top-left" });
    if (questions.length === 0 || notAnsweredQuestionIds.length === 0) {
      toast.info("Semua soal sudah dijawab!");
      return;
    }
    getNextQuestion(notAnsweredQuestionIds);
  };

  const saveProgress = (qId: number) => {
    if (!user) return;

    const existingLogs: AnsweredLog[] = safeParse(localStorage.getItem(ANS_Q_IDS_STORAGE_KEY), []);
    const isAlreadyAnswered = existingLogs.some(
      (log) => log.user_id === user.id && log.question_id === qId
    );

    if (!isAlreadyAnswered) {
      const updatedLogs = [...existingLogs, { user_id: user.id, question_id: qId }];
      localStorage.setItem(ANS_Q_IDS_STORAGE_KEY, JSON.stringify(updatedLogs));
    }
  };

  async function onSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!activeQuestion) return;

    if (!validateAnswer(activeQuestion, answer)) {
      toast.error("Jawaban belum lengkap!", { position: "top-right" });
      return;
    }

    setLoading(true);
    try {
      const result = await submitAnswer(activeQuestion, answer);

      if (result.correct) {
        toast.success(`Benar! +${activeQuestion.points} poin`, {
          duration: 1000,
          position: "top-left",
          className: "w-full max-w-[90vw] md:max-w-md text-sm md:text-base"
        });
        handleCorrect(activeQuestion.id, activeQuestion.points);
      } else {
        toast.error("Jawaban Salah", {
          duration: 1000,
          className: "w-full max-w-[90vw] md:max-w-md text-sm md:text-base"
        });
        getNextQuestion(notAnsweredQuestionIds); // ← tambah ini
      }
    } catch (e) {
      toast.error("Error", {
        description: `Gagal terhubung ke server. ${e}`,
        position: "top-center"
      });
    } finally {
      setLoading(false);
    }
  }

  function renderQuestion() {
    if (!activeQuestion) return null;

    return (
      // Loading fallback bisa berupa spinner atau skeleton
      <Suspense fallback={<div className="h-20 animate-pulse bg-gray-100 rounded" />}>
        {(() => {
          switch (activeQuestion.type) {
            case 1:
              return <QuizSingle options={activeQuestion.answer as string[]} onAnswer={handleSetAnswer} />;
            case 2:
              return <QuizMulti options={activeQuestion.answer as string[]} onAnswer={handleSetAnswer} />;
            case 3:
            case 4:
              return <CodeFill template={activeQuestion.answer as string} language={HL_LANGUAGES[activeQuestion.language]} onAnswer={handleSetAnswer} />;
            default:
              return null;
          }
        })()}
      </Suspense>
    );
  }

  // Tambah handler ini di dalam component
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Type 3 & 4 (CodeFill) — biarkan Enter natural di textarea
    if (activeQuestion?.type === 3 || activeQuestion?.type === 4) return;

    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      onSubmit();
    }
  };

  if (activeQuestion) {
    return (
      <Card className="max-w-3xl my-auto mx-auto mt-2 sm:mt-8">
        <CardHeader className="font-semibold">
          <div className="flex flex-wrap gap-1.5 items-center">
            <TypeBadge type={activeQuestion.type} />
            <Badge variant="secondary" className="text-[11px]">
              {CATEGORIES[activeQuestion.category]}
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              {LANGUAGES[activeQuestion.language]}
            </Badge>
            <DifficultyStars level={activeQuestion.difficulty} />
            <Badge variant="outline" className="text-[11px]">
              {activeQuestion.points} pts
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={onSubmit} onKeyDown={handleFormKeyDown}>
            <div className="prose max-w-none mb-3">
              <MarkdownLite content={activeQuestion.question} />
            </div>

            {renderQuestion()}

            <Button type="submit" disabled={loading} className="mt-4">
              {loading ? "Submitting..." : "Submit Answer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto mt-8">
      <CardHeader className="font-semibold">
        <Button onClick={getRandomQuestion} disabled={questions.length !== 0 && answeredQuestionIds.length !== 0 && notAnsweredQuestionIds.length === 0}>
          {questions.length !== 0 && answeredQuestionIds.length !== 0 && notAnsweredQuestionIds.length === 0 ? "Semua Soal Selesai 🎉" : "Mulai Quiz"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <h3>Seputar Quiz:</h3>
        <ol>
          <li>Materi terbagi atas: BunJs, Tailwind, Git, ElysiaJs, & Docker.</li>
          <li>Tipe Quiz terbagi atas; Single answer, multi answer, exact code fill &amp; regex code fill</li>
          <li>Limit waktu menjawab tiap soal {TIME_LIMIT} detik</li>
          <li>Tekan tombol "Simpan Score" di kanan atas layar untuk menyimpan</li>
        </ol>
        <p className="text-sm text-muted-foreground">
          Progress: {answeredQuestionIds.length} / {questions.length} soal dijawab
        </p>
      </CardContent>
    </Card>
  );
}