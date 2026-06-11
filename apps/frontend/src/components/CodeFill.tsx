// gabungan type 3 & 4 (bedanya logika di onAnswer)
import { useEffect, useMemo, useState } from "react"
import hljs from "@/lib/highlight"
import { Input } from "@/components/ui/input"

interface Props {
  template: string
  language: string
  onAnswer: (answers: string[]) => void
  classNames?: string
}

function decodeEscapes(str: string) {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
}

export default function CodeFill({ template, language, onAnswer, classNames = "" }: Props) {
  const [answers, setAnswers] = useState<string[]>([])
  const decodedTemplate = decodeEscapes(template)

  // Reset saat soal (template) berganti
  useEffect(() => {
    setAnswers([]);
    onAnswer([]);
  }, [template]);

  const parts = useMemo(() => {
    return decodedTemplate.split(/(<<\d+>>)/g)
  }, [decodedTemplate])

  function handleChange(i: number, val: string) {
    const copy = [...answers]
    copy[i] = val
    setAnswers(copy)
    onAnswer(copy)
  }

  let blankIndex = 0

  return (
    <pre className={`hljs px-4 py-2 rounded-md overflow-x-auto ${classNames}`}>
      <code>
        {parts.map((p, i) => {
          if (p.match(/<<\d+>>/)) {
            const index = blankIndex++
            const maxChar = Number(p.match(/\d+/)?.[0] ?? 8)

            return (
              <Input
                key={i}
                maxLength={maxChar}
                value={answers[index] ?? ""}
                style={{ width: `${maxChar + 3}ch`, fontFamily: "monospace" }}
                className="inline mx-1 py-0 h-8 my-1"
                onChange={(e) => handleChange(index, e.target.value)}
              />
            )
          }

          const html = hljs.highlight(p, { language, ignoreIllegals: true }).value
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
        })}
      </code>
    </pre>
  )
}