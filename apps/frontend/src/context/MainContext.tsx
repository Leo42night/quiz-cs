// MainContext.tsx
import { TIME_LIMIT } from "@/constants";
import { safeParse } from "@/lib/utils";
import { BACKEND_URL, type Question } from "@/types";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Cipher } from "shared";
import { toast } from "sonner";

function normalizeQuestion(q: any): Question {
  const answer =
    (q.type === 1 || q.type === 2) && typeof q.answer === "string"
      ? JSON.parse(q.answer)
      : q.answer;

  return { ...q, answer };
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  picture: string;
  score: number;
  score_max: number;
}

interface MainContextType {
  user: UserProfile | null;
  questions: Question[];
  handleLogin: (googleData: any) => Promise<UserProfile | undefined>;
  logout: () => void;
  newAnsweredQuestionIds: number[];
  setNewAnsweredQuestionIds: React.Dispatch<React.SetStateAction<number[]>>;
  activeQuestion: Question | null;
  setActiveQuestion: React.Dispatch<React.SetStateAction<Question | null>>;
  timeLimit: number;
  onTimeUpRef: React.MutableRefObject<(() => Promise<void>) | null>;
  addScore: (points: number) => void;
  isScoreMax: boolean;
  setIsScoreMax: React.Dispatch<React.SetStateAction<boolean>>
}

const MainContext = createContext<MainContextType | undefined>(undefined);

export function MainProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>(() => {
    const raw = safeParse(localStorage.getItem("questions"), []);
    return raw.map(normalizeQuestion);
  });

  const [user, setUserState] = useState<UserProfile | null>(() => {
    return safeParse(localStorage.getItem("user"), null);
  });
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [timeLimit, setTimeLimit] = useState(TIME_LIMIT); // Waktu limit dalam detik
  const [newAnsweredQuestionIds, setNewAnsweredQuestionIds] = useState<number[]>(
    () => safeParse(localStorage.getItem("new_answered_question_ids"), [])
  );
  const [isScoreMax, setIsScoreMax] = useState(false);

  // handle paksa periksa jawaban sebelum time habis
  const onTimeUpRef = useRef<(() => Promise<void>) | null>(null);

  // Sync newAnsweredQuestionIds ke localStorage tiap berubah
  useEffect(() => {
    localStorage.setItem("new_answered_question_ids", JSON.stringify(newAnsweredQuestionIds));
  }, [newAnsweredQuestionIds]);

  // Fetch questions & users jika belum ada di localStorage
  useEffect(() => {
    const init = async () => {
      if (localStorage.getItem("questions")) return;
      try {
        if (!BACKEND_URL) throw new Error("BACKEND_URL is undefined");

        const resQ = await fetch(`${BACKEND_URL}/api/questions`);

        if (!resQ.ok) throw new Error("Failed to fetch questions");

        const fetchedQ = await resQ.json();
        // console.log("fetchedQ:", fetchedQ);
        const decodeQuestions = Cipher.decode(fetchedQ.data, import.meta.env.VITE_SEED);
        // console.log("decodeQuestions:", decodeQuestions);
        const normalized = safeParse(decodeQuestions, []).map(normalizeQuestion);
        // console.log("Normalized questions:", normalized);
        setQuestions(normalized);
        localStorage.setItem("questions", JSON.stringify(normalized));

      } catch (err) {
        toast.error(`Gagal load questions: ${err}`);
        console.error("Initialization failed", err);
      }
    };
    init();
  }, []);

  const handleLogin = async (googleData: any): Promise<UserProfile | undefined> => {
    try {
      // cari dari database
      const email = encodeURIComponent(googleData.email);
      // console.log("email:", email);
      // console.log(`${BACKEND_URL}/api/users/by-email?email=${email}`);
      const res = await fetch(`${BACKEND_URL}/api/users/by-email?email=${email}`);
      if (!res.ok) throw new Error("Failed to fetch user");

      // Ambil sebagai text dulu untuk memastikan ada isinya
      const text = await res.text();
      // console.log("textData", text);

      if (!text || text.trim().length === 0) {
        toast.error(`Email ${googleData.email} tidak terdaftar!\nPastikan menggunakan email classroom kelas PPWL 2026.`, { duration: 5000, icon: "🚫" });
        return;
      }

      const userData: UserProfile = JSON.parse(text);

      if (userData.score > 0) toast("Riwayat Score terdeteksi");
      setUserState(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    } catch (error) {
      toast.error(`Gagal login: ${error}`);
    }
  };

  // Timer — reset ke TIME_LIMIT tiap soal baru, countdown, auto-clear saat habis
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeQuestionRef = useRef<Question | null>(null);

  // Sync ref tiap activeQuestion berubah
  useEffect(() => {
    activeQuestionRef.current = activeQuestion;
  }, [activeQuestion]);

  useEffect(() => {
    // 1. Bersihkan interval yang mungkin masih nyangkut dari render sebelumnya
    if (intervalRef.current) clearInterval(intervalRef.current);

    // 2. Jika tidak ada pertanyaan aktif, reset waktu dan berhenti
    if (!activeQuestion) {
      setTimeLimit(TIME_LIMIT);
      return;
    }

    // 3. Set waktu awal untuk pertanyaan baru
    setTimeLimit(TIME_LIMIT);

    // Gunakan flag internal untuk memastikan fungsi 'run' hanya dipanggil sekali per siklus
    let isFinished = false;

    intervalRef.current = setInterval(() => {
      setTimeLimit((prev) => {
        // Jika sudah 0 atau sudah ditandai selesai, abaikan
        if (prev <= 0 || isFinished) return 0;

        if (prev <= 1) {
          isFinished = true; // Kunci agar tidak masuk ke sini lagi

          // Langsung stop interval di sini
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Jalankan logika submit & toast
          const run = async () => {
            if (onTimeUpRef.current) {
              await onTimeUpRef.current(); // submit jawaban (jika ada)
            }
            setActiveQuestion(null);

            // Toast aman di sini karena isFinished mengunci eksekusi ganda
            toast.warning("Waktu habis!", { id: "time-up" });
          };
          run();
          return 0;
        }
        return prev - 1;
      });
    }, 1000); // Bug lama: tidak ada delay (ms), seharusnya 1000ms

    // 4. Cleanup saat komponen unmount atau activeQuestion berubah
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeQuestion]); // Timer akan reset setiap kali activeQuestion berubah

  const logout = () => {
    setUserState(null);
    localStorage.removeItem("user");
    localStorage.removeItem("answered_question_ids");
    localStorage.removeItem("not_answered_question_ids");
    localStorage.removeItem("new_answered_question_ids");
  };

  // Tambah di dalam MainProvider
  const addScore = (points: number) => {
    setUserState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, score: prev.score + points };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <MainContext.Provider
      value={{
        user,
        questions,
        handleLogin,
        logout,
        newAnsweredQuestionIds,
        setNewAnsweredQuestionIds,
        activeQuestion,
        setActiveQuestion,
        timeLimit,
        onTimeUpRef,
        addScore,
        isScoreMax,
        setIsScoreMax
      }}
    >
      {children}
    </MainContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(MainContext);
  if (!context) throw new Error("useAuth must be used within MainProvider");
  return context;
};