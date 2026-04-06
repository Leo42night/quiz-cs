// HomePage.tsx
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/MainContext";
import { TIME_LIMIT } from "@/constants";

export default function HomePage() {
  const { user, questions, activeQuestion, setActiveQuestion, notAnsweredQuestionIds } = useAuth();
  const navigate = useNavigate();

  const handleStartQuiz = () => {
    if (!user) return toast.error("Silakan Login dulu!", { position: "top-left" });

    if (questions.length === 0) return toast.error("Soal belum dimuat.");

    if (notAnsweredQuestionIds.length === 0) {
      return toast.info("Semua soal sudah dijawab!");
    }

    // Tentukan soal pertama jika belum ada activeQuestion
    if (!activeQuestion) {
      const randomId = notAnsweredQuestionIds[Math.floor(Math.random() * notAnsweredQuestionIds.length)];
      // Optional: Logic filter type 4 bisa ditaruh di sini jika untuk debug
      const found = questions.find((q) => q.id === randomId);
      if (found) setActiveQuestion(found);
    }

    navigate("/question");
  };

  const isFinished = questions.length !== 0 && notAnsweredQuestionIds.length === 0;

  return (
    <div className="pt-20">
      <Card className="max-w-3xl mx-auto mt-8">
        <CardHeader className="font-semibold text-center text-2xl">
          Fase 2
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-bold">Seputar Quiz:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Materi terbagi atas: BunJs, Tailwind, Git, ElysiaJs, & Docker.</li>
              <li>Tipe Quiz: Single, Multi, Exact Code, & Regex Code.</li>
              <li>Limit waktu menjawab tiap soal {TIME_LIMIT} detik.</li>
              <li>Tekan tombol "Simpan Score" untuk mengamankan progress Anda.</li>
            </ol>
          </div>

          <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
            <p className="text-sm font-medium">
              Progress: {questions.length - notAnsweredQuestionIds.length} / {questions.length} Soal
            </p>
            <Button onClick={handleStartQuiz} disabled={isFinished}>
              {isFinished ? "Semua Soal Selesai 🎉" : activeQuestion ? "Lanjutkan Quiz" : "Mulai Quiz"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}