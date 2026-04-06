import { CodePreview } from "@/components/custom/codeEditor";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { HL_LANGUAGES } from "@/constants";
import { cn } from "@/lib/utils";
import { CheckCheck } from "lucide-react";
import type { Question } from "shared";

export function PayloadPreview({ data }: { data: unknown }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/40 p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
        Preview Payload
      </p>
      <pre className="text-xs text-muted-foreground font-mono overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// export ke DaftarSoalPage.tsx
export function parseCorrectAnswer(val: unknown): unknown {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

export function QuestionDetail({ q }: { q: Question }) {
  const langKey = HL_LANGUAGES[q.language] ?? "javascript";

  // Memastikan correct_answer ter-parse dengan benar (string JSON -> Object/Array)
  const correctAnswer = parseCorrectAnswer(q.correct_answer);
  const pq = { ...q, correct_answer: correctAnswer } as Question;

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-4">

      {/* 2. Visual Code Template (Tipe 3 & 4) */}
      {(pq.type === 3 || pq.type === 4) && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Preview Editor
          </p>
          <CodePreview
            code={(pq.answer as string)
              .replace(/\\n/g, "\n")
              .replace(/\\t/g, "\t")}
            language={langKey}
            blankStyle={pq.type === 3 ? "exact" : "regex"}
          />
        </div>
      )}

      {/* 3. Validasi Pilihan (Tipe 1 & 2) */}
      {(pq.type === 1 || pq.type === 2) && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Opsi & Kunci
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {Array.isArray(pq.answer) && pq.answer.map((ans, i) => {
              const isCorrect = pq.type === 1
                ? Number(pq.correct_answer) === i
                : Array.isArray(pq.correct_answer) && pq.correct_answer.includes(i);

              return (
                <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border ${isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-background border-border text-muted-foreground"
                  }`}>
                  <Badge variant={isCorrect ? "default" : "outline"} className="h-5 w-5 p-0 flex justify-center text-[10px]">
                    {String.fromCharCode(65 + i)}
                  </Badge>
                  <span className="flex-1">{ans}</span>
                  {isCorrect && <CheckCheck className="h-3.5 w-3.5" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Detail Jawaban Benar (Handling List & Number) */}
      {[3, 4].includes(pq.type) && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Data Correct Answer (Kunci)
          </p>
          <div className="flex flex-wrap gap-2 p-3 bg-background border rounded-lg">
            {/* JIKA ARRAY (Tipe 2, 3, atau 4 multi-placeholder) */}
            {Array.isArray(pq.correct_answer) ? (
              pq.correct_answer.map((val, i) => (
                <Badge key={i} variant="secondary" className="font-mono text-[11px] py-1">
                  <span className="opacity-50 mr-1.5">[{i}]</span>
                  {pq.type === 4 ? `/${val}/` : String(val)}
                </Badge>
              ))
            ) : (
              /* JIKA SINGLE VALUE (Number atau String) */
              <Badge variant="secondary" className="font-mono text-[11px] py-1">
                {pq.type === 4 ? `/${pq.correct_answer}/` : String(pq.correct_answer)}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
