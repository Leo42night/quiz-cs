import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import QuizSingle from "@/components/QuizSingle"
import QuizMulti from "@/components/QuizMulti"
import CodeFill from "@/components/CodeFill"

import { submitAnswer } from "@/lib/submitAnswer"
import { BACKEND_URL } from "@/types"
import { validateAnswer } from "@/lib/utils"
import { CATEGORIES, HL_LANGUAGES, LANGUAGES } from "@/constants"
import { DifficultyStars, TypeBadge } from "@/components/shared"
import { isJsonArray, type Question } from "shared"

function parseAnswer(value: any) {
  return isJsonArray(value) ? JSON.parse(value) : value
}

export default function ViewQuestionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [question, setQuestion] = useState<Question | null>(null)
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const answerRef = useRef<any>(null)

  const numId = Number(id)

  useEffect(() => {
    if (!id) return
    setFetching(true)
    setQuestion(null)
    fetch(`${BACKEND_URL}/api/questions/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then((data: Question) => setQuestion({
        ...data,
        answer: parseAnswer(data.answer),
        correct_answer: parseAnswer(data.correct_answer),
      }))
      .catch((e) => toast.error(`Gagal memuat soal: ${e.message}`))
      .finally(() => setFetching(false))
  }, [id])

  useEffect(() => {
    if (!question) return
    // console.log(question)
    toast.info(Array.isArray(question.correct_answer) ? JSON.stringify(question.correct_answer) : question.correct_answer, {
      position: "top-center",
      description: question.answer,
      duration: 30000
    })
  }, [question])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === "ArrowRight") goTo(numId + 1)
      if (e.key === "ArrowLeft" && numId > 1) goTo(numId - 1)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [numId])

  const goTo = (targetId: number) => navigate(`/view-question/${targetId}`)

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!question) return

    if (!validateAnswer(question, answerRef.current)) {
      toast.error("Jawaban belum lengkap!", { position: "top-center" })
      return
    }

    setLoading(true)
    try {
      const result = await submitAnswer(question, answerRef.current)
      if (result.correct) {
        toast.success("Benar! ✓", { position: "top-left" })
      } else {
        toast.error("Salah ✗", { position: "top-left" })
      }
    } catch (e) {
      toast.error(`Gagal terhubung ke server. ${e}`, { position: "top-center" })
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
        return <CodeFill template={question.answer as string} language={HL_LANGUAGES[question.language]} onAnswer={(v) => { answerRef.current = v }} />
      default:
        return null
    }
  }

  if (fetching) return <p className="text-center mt-8">Memuat soal...</p>
  if (!question) return <p className="text-center mt-8 text-destructive">Soal tidak ditemukan.</p>

  return (
    <Card className="max-w-3xl mx-auto mt-8">
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
          <div className="prose max-w-none">
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {question.question}
            </ReactMarkdown>
          </div>

          {renderQuestion()}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => goTo(numId - 1)}>
              ← Sebelumnya
            </Button>
            <Button type="button" variant="outline" onClick={() => goTo(numId + 1)}>
              Lewati →
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Memeriksa..." : "Periksa ✓"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}