// MainContext.tsx
import { TIME_LIMIT, BACKEND_URL, NOT_ANS_Q_IDS_STORAGE_KEY, SEED, ANS_Q_IDS_STORAGE_KEY, MODE } from "@/constants";
import { normalizeQuestion, safeParse } from "@/lib/utils";
import { NEW_ANS_Q_IDS_STORAGE_KEY, QUESTION_STORAGE_KEY } from "@/constants";
import { createContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Cipher, type Question } from "shared";
import { toast } from "sonner";

interface GoogleData {
  email: string;
  email_verified: boolean;
  family_name: string;
  given_name: string;
  hd: string;
  name: string;
  picture: string;
  sub: string;
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
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  handleLogin: (googleData: any) => Promise<UserProfile | undefined>;
  logout: () => void;
  newAnsweredQuestionIds: number[];
  setNewAnsweredQuestionIds: React.Dispatch<React.SetStateAction<number[]>>;
  notAnsweredQuestionIds: number[];
  setNotAnsweredQuestionIds: React.Dispatch<React.SetStateAction<number[]>>;
  activeQuestion: Question | null;
  setActiveQuestion: React.Dispatch<React.SetStateAction<Question | null>>;
  timeLimit: number;
  onTimeUpRef: React.RefObject<(() => Promise<void>) | null>;
  addScore: (points: number) => void;
  isScoreMax: boolean;
  setIsScoreMax: React.Dispatch<React.SetStateAction<boolean>>
}

export function MainProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>(() => {
    const hex = localStorage.getItem(QUESTION_STORAGE_KEY);
    if (typeof hex === "string") {
      const decodeQuestions = Cipher.decode(hex, SEED);
      const raw = safeParse(decodeQuestions, []);
      return raw.map(normalizeQuestion);
    } else {
      return [];
    }
  });

  const [user, setUserState] = useState<UserProfile | null>(() => {
    return safeParse(localStorage.getItem("user"), null);
  });
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [timeLimit, setTimeLimit] = useState(TIME_LIMIT); // Waktu limit dalam detik
  const [newAnsweredQuestionIds, setNewAnsweredQuestionIds] = useState<number[]>(
    () => safeParse(localStorage.getItem(NEW_ANS_Q_IDS_STORAGE_KEY), [])
  );
  const [isScoreMax, setIsScoreMax] = useState(false);
  const [notAnsweredQuestionIds, setNotAnsweredQuestionIds] = useState<number[]>(
    () => safeParse(localStorage.getItem(NOT_ANS_Q_IDS_STORAGE_KEY), [])
  );

  // handle paksa periksa jawaban sebelum time habis
  const onTimeUpRef = useRef<(() => Promise<void>) | null>(null);

  // Sync newAnsweredQuestionIds ke localStorage tiap berubah
  useEffect(() => {
    localStorage.setItem(NEW_ANS_Q_IDS_STORAGE_KEY, JSON.stringify(newAnsweredQuestionIds));
  }, [newAnsweredQuestionIds]);
  useEffect(() => {
    localStorage.setItem(NOT_ANS_Q_IDS_STORAGE_KEY, JSON.stringify(notAnsweredQuestionIds));
  }, [notAnsweredQuestionIds]);

  const updateAnsweredQuest = async (userId: number) => {
    if (localStorage.getItem(ANS_Q_IDS_STORAGE_KEY)) return;
    const resQs = await fetch(`${BACKEND_URL}/api/users/${userId}/question-ids`);
    if (!resQs.ok) throw new Error("Failed to fetch user question ids");
    const fetchedQs = await resQs.json();
    const answeredIds: number[] = fetchedQs || [];
    // console.log("fetchedQs", fetchedQs);
    // console.log("answeredIds", answeredIds);
    // console.log(`${BACKEND_URL}/api/users/${userId}/question-ids`)
    // 2. Simpan data answered yang sudah di-encode (jika diperlukan enkripsi)
    localStorage.setItem(ANS_Q_IDS_STORAGE_KEY, JSON.stringify(answeredIds));

    // 3. Filter ID dari semua soal yang TIDAK ada di dalam answeredIds
    const notAnsweredIds = questions
      .map((q) => q.id)
      .filter((id) => !answeredIds.includes(id));

    // 4. Update State
    setNotAnsweredQuestionIds(notAnsweredIds);

    // 5. Simpan ke LocalStorage
    localStorage.setItem(NOT_ANS_Q_IDS_STORAGE_KEY, JSON.stringify(notAnsweredIds));
  }

  // Fetch questions & users jika belum ada di localStorage
  useEffect(() => {
    const init = async () => {
      if (localStorage.getItem(QUESTION_STORAGE_KEY)) return;
      try {
        if (!BACKEND_URL) throw new Error("BACKEND_URL is undefined");

        const resQ = await fetch(`${BACKEND_URL}/api/questions`);

        if (!resQ.ok) throw new Error("Failed to fetch questions");

        const fetchedQ = await resQ.json();
        console.log({ fetchedQ });
        localStorage.setItem(QUESTION_STORAGE_KEY, fetchedQ.data); // hex data
        const decodeQuestions = Cipher.decode(fetchedQ.data, import.meta.env.VITE_SEED);
        const normalized = safeParse(decodeQuestions, []).map(normalizeQuestion);
        console.log({ normalized });
        setQuestions(normalized);

        // jika sudah ada di local storage
        if (user) {
          await updateAnsweredQuest(user.id)
        }
      } catch (err) {
        toast.error(`Gagal load questions: ${err}`);
        console.error("Initialization failed", err);
      }
    };
    init();
  }, []);

  const handleLogin = async (googleData: GoogleData): Promise<UserProfile | undefined> => {
    try {
      console.log(googleData);
      let userData: UserProfile;
      // cari dari database
      if (MODE === 'public') {
        userData = {
          id: 1,
          name: googleData.given_name,
          email: googleData.email,
          picture: googleData.picture,
          score: 0,
          score_max: 100 // agar tidak sering
        };
      } else {
        const email = encodeURIComponent(googleData.email);
        // console.log("email:", email);
        const res = await fetch(`${BACKEND_URL}/api/users/by-email?email=${email}`);
        if (!res.ok) throw new Error("Failed to fetch user");

        // Ambil sebagai text dulu untuk memastikan ada isinya
        const text = await res.text();

        if (!text || text.trim().length === 0) {
          toast.error(`Email ${googleData.email} tidak terdaftar!\nPastikan menggunakan email classroom kelas PPWL 2026.`, { duration: 5000, icon: "🚫" });
          return;
        }

        userData = JSON.parse(text);
      }

      if (userData.score > 0) toast("Riwayat Score terdeteksi");
      setUserState(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      await updateAnsweredQuest(userData.id)
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
            toast.warning("Waktu habis!", { id: "time-up", duration: 1000 });
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
    localStorage.removeItem(ANS_Q_IDS_STORAGE_KEY);
    localStorage.removeItem(NOT_ANS_Q_IDS_STORAGE_KEY);
    localStorage.removeItem(NEW_ANS_Q_IDS_STORAGE_KEY);
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
        setQuestions,
        handleLogin,
        logout,
        newAnsweredQuestionIds,
        setNewAnsweredQuestionIds,
        notAnsweredQuestionIds,
        setNotAnsweredQuestionIds,
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

export const MainContext = createContext<MainContextType | undefined>(undefined);