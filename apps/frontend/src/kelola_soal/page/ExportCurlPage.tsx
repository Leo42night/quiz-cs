import { useState } from "react";
import { Terminal } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TypeBadge } from "@/components/shared";
import { useAuth } from "@/context/MainContext";
import { BACKEND_URL } from "@/constants";
import type { Question } from "shared";

export default function ExportCurlPage() {
  const { questions } = useAuth();
  const [baseUrl, setBaseUrl] = useState(BACKEND_URL || "http://localhost:3000");
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
                onChange={(e) => setBaseUrl(e.target.value)}
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
                      <span className="text-xs text-muted-foreground font-bold">{idx + 1}.</span>
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