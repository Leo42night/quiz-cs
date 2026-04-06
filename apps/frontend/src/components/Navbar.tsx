// Navbar.tsx
import { useAuth } from "@/context/MainContext";
import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Timer } from "lucide-react";
import { BACKEND_URL } from "@/types";
import { TIME_LIMIT } from "@/constants";

export function Navbar() {
  const {
    user,
    handleLogin,
    logout,
    newAnsweredQuestionIds,
    setNewAnsweredQuestionIds,
    activeQuestion,
    timeLimit,
    isScoreMax
  } = useAuth();
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingSaveScore, setLoadingSaveScore] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!res.ok) throw new Error("Gagal ambil user info");
        const data = await res.json();
        await handleLogin(data);
      } catch (e) {
        toast.error(`Gagal ambil user info: ${e}`);
      } finally {
        setLoadingLogin(false);
      }
    },
    onError: () => {
      toast.error("Login gagal");
      setLoadingLogin(false);
    },
  });

  const handleClickLogin = () => {
    setLoadingLogin(true);
    login();
  };

  const saveScore = async () => {
    if (!user || newAnsweredQuestionIds.length === 0) {
      return toast.error("Tidak ada user atau jawaban baru");
    }

    setLoadingSaveScore(true);
    try {
      if (!user) return toast.error("Tidak ada user");
      // Simpan score user
      const resScore = await fetch(`${BACKEND_URL}/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: user.score }),
      });
      if (!resScore.ok) throw new Error(`Score gagal disimpan: ${resScore.status}`);

      // Simpan answered question IDs
      const resIds = await fetch(`${BACKEND_URL}/api/users/${user.id}/question-ids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_answered_question_ids: newAnsweredQuestionIds }),
      });
      if (!resIds.ok) throw new Error(`Jawaban quiz gagal disimpan: ${resIds.status}`);

      toast.success(`Score & ${newAnsweredQuestionIds.length} jawaban berhasil disimpan`);

      // Reset setelah berhasil simpan
      setNewAnsweredQuestionIds([]);
    } catch (e) {
      toast.error(`${e}`);
    } finally {
      setLoadingSaveScore(false);
    }
  };

  // Warna timer berubah sesuai sisa waktu
  const timerColor =
    timeLimit <= Math.floor(TIME_LIMIT / 3) ? "text-red-500" :
      timeLimit <= Math.floor(TIME_LIMIT * 2 / 3) ? "text-yellow-500" :
        "text-green-500";

  return (
    <nav className="border-b bg-background/95 px-2 lg:px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-xl">
          <span className="text-[10px] sm:text-xl bg-primary text-primary-foreground px-2 py-1 rounded-md">PPWL</span>
          <span className="hidden md:inline">2026</span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1 text-sm font-medium min-w-15 justify-center">
          {activeQuestion && (
            <>
              <Timer className={`w-4 h-4 ${timerColor}`} />
              <span className={`font-mono font-bold text-lg ${timerColor}`}>{timeLimit}s</span>
            </>
          )}
        </div>

        {/* Auth Section */}
        <div className="flex items-center">
          {user ? (
            <div className="flex items-center sm:gap-3">
              <TooltipProvider>
                <div className="flex flex-col items-end md:gap-2 mr-1">
                  {/* Label Header */}
                  <span className="text-[6px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">
                    Your Progress
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Tombol Simpan Score - Diluar Badge agar lebih lega */}
                    {newAnsweredQuestionIds.length > 0 && (
                      // 1. Tambahkan state untuk mengontrol visibilitas manual jika diperlukan
                      // Atau langsung gunakan prop jika ingin "dipaksa" tampil terus saat score max
                      <Tooltip open={isScoreMax ? true : undefined}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="default" // Ubah ke default agar lebih kontras sebagai aksi utama
                            size="sm"
                            onClick={saveScore}
                            disabled={loadingSaveScore}
                            className="md:h-8 md:px-3 text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
                          >
                            {loadingSaveScore ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin md:mr-1" />
                            ) : (
                              <Save className="w-3.5 h-3.5 mr-1" />
                            )}
                            <span className="hidden md:inline-block">
                              {loadingSaveScore ? "Menyimpan..." : "Simpan Score"}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Simpan progres Anda sekarang!</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Skor Container */}
                    <Badge
                      variant="secondary"
                      className="md:h-8 md:px-3 font-mono text-xs md:text-sm flex items-center md:gap-1.5 border-muted"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-primary font-bold cursor-help">{user.score}</span>
                        </TooltipTrigger>
                        <TooltipContent><p>Skor saat ini</p></TooltipContent>
                      </Tooltip>

                      <span className="text-muted-foreground/50">/</span>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-muted-foreground cursor-help">{user.score_max}</span>
                        </TooltipTrigger>
                        <TooltipContent><p>Skor maksimal</p></TooltipContent>
                      </Tooltip>
                    </Badge>
                  </div>
                </div>
              </TooltipProvider>

              {/* Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.picture} alt={user.name} />
                      <AvatarFallback>{user.name?.charAt(0) ?? ":)"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={logout}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button variant="default" onClick={handleClickLogin} disabled={loadingLogin} className="gap-2">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 488 512">
                <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
              </svg>
              {loadingLogin ? <Loader2 className="animate-spin w-4 h-4" /> : "Login"}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}