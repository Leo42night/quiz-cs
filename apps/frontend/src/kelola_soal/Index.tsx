// kelola_soal/Index.tsx
import { NavLink, Outlet } from "react-router-dom";
import { BookOpen, PlusCircle, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/MainContext";

export default function KelolaSoalLayout() {
  const { questions } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid grid-cols-2 gap-0.75">
              {(["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"] as const).map(
                (c, i) => (
                  <div key={i} className={`rounded-xs ${c} px-2 text-center text-xs text-white`}>
                    {["P", "P", "W", "L"][i]}
                  </div>
                )
              )}
            </div>
            <span className="font-semibold text-sm tracking-tight">
              Quiz Question Manager
            </span>
          </div>
          <nav className="flex">
            {[
              { to: "/kelola-soal/new", icon: <PlusCircle className="h-3.5 w-3.5" />, label: "Buat Soal" },
              { to: "/kelola-soal", icon: <BookOpen className="h-3.5 w-3.5" />, label: "Daftar Soal", count: questions.length },
              { to: "/kelola-soal/curl", icon: <Terminal className="h-3.5 w-3.5" />, label: "Export cURL" },
            ].map(({ to, icon, label, count }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/kelola-soal"}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors ${isActive
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {icon}
                {label}
                {count != null && count > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
                    {count}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>
          <Badge variant="secondary" className="text-xs">
            {questions.length} soal
          </Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 selectable">
        <Outlet />
      </main>
    </div>
  );
}