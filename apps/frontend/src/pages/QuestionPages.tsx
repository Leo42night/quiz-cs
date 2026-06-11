// QuestionPage.tsx
import { useEffect, useState, useRef, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

const QuizSingle = lazy(() => import("@/components/QuizSingle"));
const QuizMulti = lazy(() => import("@/components/QuizMulti"));
const CodeFill = lazy(() => import("@/components/CodeFill"));

import { submitAnswer } from "@/lib/submitAnswer";
import { useAuth } from "@/hooks/useAuth";
import { ANS_Q_IDS_STORAGE_KEY, NOT_ANS_Q_IDS_STORAGE_KEY, HL_LANGUAGES, CATEGORIES, LANGUAGES } from "@/constants";
import { safeParse, validateAnswer } from "@/lib/utils";
import { DifficultyStars, TypeBadge } from "@/components/shared";
import fireCelebration from "@/components/Confetty";

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
    setIsScoreMax,
    notAnsweredQuestionIds,
    setNotAnsweredQuestionIds
  } = useAuth();

  const navigate = useNavigate();
  const [answer, setAnswer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const answerRef = useRef<any>(null);

  const handleSetAnswer = (val: any) => {
    answerRef.current = val;
    setAnswer(val);
  };

  // Redirect jika tidak ada soal aktif (mencegah akses langsung URL)
  useEffect(() => {
    if (!activeQuestion && questions.length > 0) {
      navigate("/");
    }
  }, [activeQuestion, questions, navigate]);

  // Handler Timer Habis
  useEffect(() => {
    if (!activeQuestion) {
      onTimeUpRef.current = null;
      return;
    }

    onTimeUpRef.current = async () => {
      const currentAnswer = answerRef.current;
      if (!validateAnswer(activeQuestion, currentAnswer)) return;

      try {
        const result = await submitAnswer(activeQuestion, currentAnswer);
        if (result.correct) {
          toast.success(`Waktu Habis! Benar ✓ +${activeQuestion.points} pts`);
          handleCorrect(activeQuestion.id, activeQuestion.points);
        } else {
          toast.error("Waktu Habis! Jawaban Salah ✗");
          getNextQuestion(notAnsweredQuestionIds);
        }
      } catch (e) {
        toast.error("Gagal sinkronisasi waktu.");
      }
    };

    return () => { onTimeUpRef.current = null; };
  }, [activeQuestion]);

  // Selebrasi Max Score
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
      navigate("/"); // Kembali ke home jika habis
      return;
    }
    const randomId = currentNotAnswered[Math.floor(Math.random() * currentNotAnswered.length)];
    const found = questions.find((q) => q.id === randomId);

    if (found) {
      setActiveQuestion(found);
      setAnswer(null);
      answerRef.current = null;
    } else {
      getNextQuestion(currentNotAnswered);
    }
  };

  const handleCorrect = (qId: number, points: number) => {
    if (!user) return;


    const existingLogs = safeParse(localStorage.getItem(ANS_Q_IDS_STORAGE_KEY), []);
    if (!existingLogs.some((log: any) => log.question_id === qId)) {
      const updatedLogs = [...existingLogs, { user_id: user.id, question_id: qId }];
      localStorage.setItem(ANS_Q_IDS_STORAGE_KEY, JSON.stringify(updatedLogs));
    }

    addScore(points);
    setNewAnsweredQuestionIds((prev) => prev.includes(qId) ? prev : [...prev, qId]);

    const updated = notAnsweredQuestionIds.filter((id) => id !== qId);
    localStorage.setItem(NOT_ANS_Q_IDS_STORAGE_KEY, JSON.stringify(updated));
    setNotAnsweredQuestionIds(updated);
    getNextQuestion(updated);
  };

  async function onSubmit(e?: React.SubmitEvent) {
    if (e) e.preventDefault();
    if (!activeQuestion) return;

    if (!validateAnswer(activeQuestion, answer)) {
      return toast.error("Jawaban belum lengkap!");
    }

    setLoading(true);
    try {
      const result = await submitAnswer(activeQuestion, answer);
      if (result.correct) {
        toast.success(`Benar! +${activeQuestion.points} poin`, { position: "top-left" });
        handleCorrect(activeQuestion.id, activeQuestion.points);
      } else {
        toast.error("Jawaban Salah");
        getNextQuestion(notAnsweredQuestionIds);
      }
    } catch (e) {
      toast.error("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  if (!activeQuestion) return null;

  return (
    <div className="pt-2 sm:pt-8">
      <Card className="max-w-3xl mx-auto border-t-4 border-t-primary">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap gap-1.5 items-center">
            <TypeBadge type={activeQuestion.type} />
            <Badge variant="secondary" className="text-[11px]">{CATEGORIES[activeQuestion.category]}</Badge>
            <Badge variant="secondary" className="text-[11px]">{LANGUAGES[activeQuestion.language]}</Badge>
            <DifficultyStars level={activeQuestion.difficulty} />
            <Badge variant="outline" className="text-[11px]">{activeQuestion.points} pts</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={onSubmit} onKeyDown={(e) => {
            if ((activeQuestion.type === 3 || activeQuestion.type === 4) || loading) return;
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); }
          }}>
            <div className="prose max-w-none dark:prose-invert mb-6">
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {activeQuestion.question}
              </ReactMarkdown>
            </div>

            <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
              {activeQuestion.type === 1 && <QuizSingle options={activeQuestion.answer as string[]} onAnswer={handleSetAnswer} />}
              {activeQuestion.type === 2 && <QuizMulti options={activeQuestion.answer as string[]} onAnswer={handleSetAnswer} />}
              {(activeQuestion.type === 3 || activeQuestion.type === 4) && (
                <CodeFill template={activeQuestion.answer as string} language={HL_LANGUAGES[activeQuestion.language]} onAnswer={handleSetAnswer} />
              )}
            </Suspense>

            <div className="mt-8 flex justify-between items-center">
              <Button type="button" variant="ghost" onClick={() => navigate("/")}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="px-8 font-bold">
                {loading ? "Memeriksa..." : "Kirim Jawaban"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}