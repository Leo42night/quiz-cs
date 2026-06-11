import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TypeBadge } from "@/components/shared";
import FormTipe1 from "@/kelola_soal/FormTipe1";
import FormTipe2 from "@/kelola_soal/FormTipe2";
import FormTipe3 from "@/kelola_soal/FormTipe3";
import FormTipe4 from "@/kelola_soal/FormTipe4";
import { saveQuestionToDB, updateQuestionToDB } from "../utils";
import { useMain } from "@/hooks/useMain";
import type { Question, QuestionType } from "shared";
import { saveQuestionsToLocal } from "@/lib/utils";

const TYPE_OPTIONS = [
  {
    type: 1 as QuestionType,
    label: "Single Answer", desc: "Satu jawaban benar",
    accent: "border-blue-200 hover:border-blue-400 data-[active=true]:border-blue-500 data-[active=true]:bg-blue-50",
    dot: "bg-blue-500",
  },
  {
    type: 2 as QuestionType,
    label: "Multi Answer", desc: "Beberapa jawaban benar",
    accent: "border-emerald-200 hover:border-emerald-400 data-[active=true]:border-emerald-500 data-[active=true]:bg-emerald-50",
    dot: "bg-emerald-500",
  },
  {
    type: 3 as QuestionType,
    label: "Code Fill Exact", desc: "Jawaban persis sama",
    accent: "border-amber-200 hover:border-amber-400 data-[active=true]:border-amber-500 data-[active=true]:bg-amber-50",
    dot: "bg-amber-500",
  },
  {
    type: 4 as QuestionType,
    label: "Code Fill Regex", desc: "Divalidasi dengan regex",
    accent: "border-rose-200 hover:border-rose-400 data-[active=true]:border-rose-500 data-[active=true]:bg-rose-50",
    dot: "bg-rose-500",
  },
] as const;

export default function FormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const { questions, setQuestions } = useMain();

  const editingQuestion = isNew ? null : (questions.find((q) => String(q.id) === id) ?? null);

  const [selectedType, setSelectedType] = useState<QuestionType>(
    editingQuestion?.type ?? 1
  );
  const [resetForm, setResetForm] = useState<(() => void) | null>(null);

  // Sync selectedType when editingQuestion resolves (e.g. after questions load)
  useEffect(() => {
    if (editingQuestion) setSelectedType(editingQuestion.type);
  }, [editingQuestion?.type]);

  const handleSave = useCallback(
    async (data: Omit<Question, "id">, onSuccess?: () => void) => {
      try {
        const now = Date.now();
        if (editingQuestion) {
          const payload = { ...data, updated_at: now };
          const res = await updateQuestionToDB(editingQuestion.id, payload);
          if (!res.ok) throw new Error(`Gagal update: ${res.status}`);

          const updatedList = questions.map((q) =>
            q.id === editingQuestion.id
              ? ({ ...payload, id: editingQuestion.id } as Question)
              : q
          );

          // 2. Update state
          setQuestions(updatedList);

          // 3. Simpan array terbaru yang SUDAH dihitung tadi ke LocalStorage
          saveQuestionsToLocal(updatedList);
        } else {
          // Untuk simpan baru, tambahkan created_at dan updated_at
          const payload = { ...data, updated_at: now };
          const res = await saveQuestionToDB(payload);
          if (!res.ok) throw new Error(`Gagal simpan: ${res.status}`);
          const saved = await res.json();

          // Gunakan ID dari server jika ada
          setQuestions((prev) => [
            ...prev,
            { ...payload, id: saved?.id ?? now } as Question
          ]);
        }
        toast.success(editingQuestion ? "Soal berhasil diupdate!" : "Soal berhasil disimpan!", {
          position: "top-left",
        });
        onSuccess?.();
        navigate("/kelola-soal");
      } catch (e) {
        toast.error(`${e}`);
      }
    },
    [editingQuestion, navigate, setQuestions]
  );

  const handleCancel = () => {
    resetForm?.();
    navigate("/kelola-soal");
  };

  const activeType = editingQuestion?.type ?? selectedType;
  // console.log("editingQuestion", editingQuestion)

  const commonProps = {
    onSave: (d: Omit<Question, "id">, onSuccess?: () => void) => handleSave(d, onSuccess),
    onReady: (reset: () => void) => setResetForm(() => reset),
    onCancel: handleCancel,
  };

  return (
    <>
      {editingQuestion ? (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <TypeBadge type={editingQuestion.type} />
          <span className="text-sm text-muted-foreground flex-1">
            Mode edit — perubahan akan menimpa soal yang ada.
          </span>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Batal Edit
          </Button>
        </div>
      ) : (
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Pilih Tipe Soal
          </p>
          <div className="grid grid-cols-4 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                data-active={selectedType === opt.type}
                onClick={() => setSelectedType(opt.type)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${opt.accent}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-2 h-2 rounded-full ${opt.dot}`} />
                  <span className="text-[10px] font-bold text-muted-foreground">Tipe {opt.type}</span>
                </div>
                <p className="text-xs font-semibold leading-tight">{opt.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeType === 1 && (
        <FormTipe1
          {...commonProps}
          initial={editingQuestion?.type === 1 ? editingQuestion : undefined}
        />
      )}
      {activeType === 2 && (
        <FormTipe2
          {...commonProps}
          initial={editingQuestion?.type === 2 ? editingQuestion : undefined}
        />
      )}
      {activeType === 3 && (
        <FormTipe3
          {...commonProps}
          initial={editingQuestion?.type === 3 ? editingQuestion : undefined}
        />
      )}
      {activeType === 4 && (
        <FormTipe4
          {...commonProps}
          initial={editingQuestion?.type === 4 ? editingQuestion : undefined}
        />
      )}
    </>
  );
}