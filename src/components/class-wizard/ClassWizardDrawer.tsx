import { useCallback, useEffect, useState, type FormEvent } from "react";
import { type ClassData } from "../../hooks/useClasses";
import { api } from "../../lib/api";

const PROJECT_ID =
  import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "spartacus-artes-marciais";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface ModalityData {
  id: string;
  name: string;
  slug: string;
}

interface TeacherOption {
  uid: string;
  name: string;
  email?: string;
}

interface TeachersApiResponse {
  items: TeacherOption[];
}

const DAYS = [
  { code: "sun", label: "Dom" },
  { code: "mon", label: "Seg" },
  { code: "tue", label: "Ter" },
  { code: "wed", label: "Qua" },
  { code: "thu", label: "Qui" },
  { code: "fri", label: "Sex" },
  { code: "sat", label: "Sáb" },
];

const STEPS = ["Identificação", "Agenda", "Detalhes", "Confirmação"];

interface ClassForm {
  slug: string;
  name: string;
  modalityId: string;
  days: string[];
  startTime: string;
  endTime: string;
  teacherName: string;
  location: string;
  totalSlots: string;
}

const INITIAL: ClassForm = {
  slug: "",
  name: "",
  modalityId: "",
  days: [],
  startTime: "",
  endTime: "",
  teacherName: "",
  location: "",
  totalSlots: "",
};

interface ClassPayload {
  id: string;
  name: string;
  modality_id: string;
  schedule: { day: string; start_time: string; end_time: string }[];
  teacher_name?: string;
  location?: string;
}

interface ClassWizardDrawerProps {
  open: boolean;
  editing?: ClassData | null;
  onClose: () => void;
  onCreate: (data: ClassPayload) => Promise<unknown>;
  onUpdate: (id: string, data: Partial<ClassPayload>) => Promise<unknown>;
}

export function ClassWizardDrawer({
  open,
  editing,
  onClose,
  onCreate,
  onUpdate,
}: ClassWizardDrawerProps) {
  const [modalities, setModalities] = useState<ModalityData[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ClassForm>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModalities = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/projects/${PROJECT_ID}/modalities`);
      if (res.ok) {
        const data = await res.json();
        setModalities(data.modalities ?? []);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const data = await api.get<TeachersApiResponse>(
        "/accounts?role=teacher&status=approved&pageSize=50&sort=name",
      );
      setTeachers(data.items ?? []);
    } catch (err) {
      console.error("[ClassWizardDrawer] failed to load teachers:", err);
      setTeachers([]);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchModalities();
      fetchTeachers();
    }
  }, [open, fetchModalities, fetchTeachers]);

  // Reset + preload when opening
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setError(null);
    if (editing) {
      const first = editing.schedule_items?.[0];
      const days = (editing.schedule_items ?? []).map((s) => s.day);
      setForm({
        slug: editing.id.split("_").slice(1).join("_") || editing.id,
        name: editing.name,
        modalityId: editing.modality_id,
        days,
        startTime: first?.start_time ?? "",
        endTime: first?.end_time ?? "",
        teacherName: editing.teacher ?? "",
        location: editing.location ?? "",
        totalSlots: "",
      });
    } else {
      setForm(INITIAL);
    }
  }, [open, editing]);

  function update(fields: Partial<ClassForm>) {
    setForm((prev) => ({ ...prev, ...fields }));
  }

  function next() {
    setError(null);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const payload: ClassPayload = {
        id: form.slug || generateSlug(form.name),
        name: form.name,
        modality_id: form.modalityId,
        schedule: form.days.map((d) => ({
          day: d,
          start_time: form.startTime,
          end_time: form.endTime,
        })),
        teacher_name: form.teacherName || undefined,
        location: form.location || undefined,
      };
      if (editing) {
        await onUpdate(editing.id, payload);
      } else {
        await onCreate(payload);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar turma.");
    } finally {
      setLoading(false);
    }
  }

  // Modality options for step 1 (grid of color-dot buttons)
  const MODALITY_DOT: Record<string, string> = {
    "jiu-jitsu": "#3B82F6",
    "muay-thai": "#F97316",
    capoeira: "#4CAF50",
    mma: "#EF4444",
  };
  function modalityColor(m: ModalityData): string {
    return MODALITY_DOT[m.slug?.toLowerCase() ?? ""] ??
      MODALITY_DOT[m.id?.toLowerCase() ?? ""] ??
      "var(--gold)";
  }

  return (
    <>
      <div
        className={`class-drawer-overlay ${open ? "open" : ""}`}
        onClick={onClose}
      />
      <aside className={`class-drawer ${open ? "open" : ""}`}>
        <div className="class-drawer-header">
          <div>
            <div className="class-drawer-title">
              {editing ? "Editar turma" : "Nova turma"}
            </div>
            <div className="class-drawer-sub">{STEPS[step]}</div>
          </div>
          <button
            className="class-drawer-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Step progress with labels */}
        <div className="class-drawer-steps">
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <div key={label} className="class-drawer-step-wrap">
                <span
                  className={`class-drawer-step ${done ? "done" : ""} ${current ? "current" : ""}`}
                />
                <span
                  className={`class-drawer-step-label ${current ? "current" : done ? "done" : ""}`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="class-drawer-body">
          {step === 0 && (
            <StepIdentificacao
              form={form}
              update={update}
              modalities={modalities}
              modalityColor={modalityColor}
            />
          )}
          {step === 1 && <StepAgenda form={form} update={update} />}
          {step === 2 && (
            <StepDetalhes form={form} update={update} teachers={teachers} />
          )}
          {step === 3 && (
            <StepConfirmacao
              form={form}
              modalities={modalities}
              modalityColor={modalityColor}
              error={error}
            />
          )}
        </div>

        <div className="class-drawer-footer">
          {step > 0 && (
            <button
              className="btn btn-outline btn-sm"
              onClick={back}
              disabled={loading}
            >
              Voltar
            </button>
          )}
          {step === 0 && (
            <button
              className="btn btn-outline btn-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={next}
              disabled={!canAdvance(step, form)}
            >
              Próximo ›
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm btn-with-icon"
              onClick={handleSubmit}
              disabled={loading}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>
                {loading
                  ? "Salvando..."
                  : editing
                    ? "Salvar alterações"
                    : "Criar turma"}
              </span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function canAdvance(step: number, form: ClassForm): boolean {
  if (step === 0)
    return form.name.trim().length >= 3 && form.modalityId !== "";
  if (step === 1)
    return form.days.length > 0 && form.startTime !== "" && form.endTime !== "";
  return true;
}

// ── Steps ──────────────────────────────────────────────────────────────────

function StepIdentificacao({
  form,
  update,
  modalities,
  modalityColor,
}: {
  form: ClassForm;
  update: (f: Partial<ClassForm>) => void;
  modalities: ModalityData[];
  modalityColor: (m: ModalityData) => string;
}) {
  return (
    <form onSubmit={(e: FormEvent) => e.preventDefault()}>
      <div className="form-group">
        <label>NOME DA TURMA *</label>
        <input
          className="form-input"
          placeholder="Ex: Jiu-Jitsu Matutino"
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label>MODALIDADE *</label>
        <div className="modality-grid">
          {modalities.map((m) => {
            const color = modalityColor(m);
            const active = form.modalityId === m.id;
            return (
              <button
                type="button"
                key={m.id}
                className={`modality-btn ${active ? "active" : ""}`}
                onClick={() => update({ modalityId: m.id })}
                style={
                  active
                    ? {
                        borderColor: color,
                        background: `${color}22`,
                      }
                    : undefined
                }
              >
                <span
                  className="modality-dot"
                  style={{ backgroundColor: color }}
                />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-group">
        <label>VAGAS TOTAIS</label>
        <input
          className="form-input"
          type="number"
          min={0}
          placeholder="20"
          value={form.totalSlots}
          onChange={(e) => update({ totalSlots: e.target.value })}
        />
      </div>
    </form>
  );
}

function StepAgenda({
  form,
  update,
}: {
  form: ClassForm;
  update: (f: Partial<ClassForm>) => void;
}) {
  function toggleDay(code: string) {
    const s = new Set(form.days);
    if (s.has(code)) s.delete(code);
    else s.add(code);
    update({ days: Array.from(s) });
  }
  return (
    <form onSubmit={(e: FormEvent) => e.preventDefault()}>
      <div className="form-group">
        <label>DIAS DA SEMANA *</label>
        <div className="day-selector day-selector--compact">
          {DAYS.map((d) => (
            <button
              type="button"
              key={d.code}
              className={`day-btn ${form.days.includes(d.code) ? "active" : ""}`}
              onClick={() => toggleDay(d.code)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="wizard-row">
        <div className="form-group">
          <label>INÍCIO *</label>
          <input
            className="form-input"
            type="time"
            value={form.startTime}
            onChange={(e) => update({ startTime: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>TÉRMINO *</label>
          <input
            className="form-input"
            type="time"
            value={form.endTime}
            onChange={(e) => update({ endTime: e.target.value })}
          />
        </div>
      </div>
    </form>
  );
}

function StepDetalhes({
  form,
  update,
  teachers,
}: {
  form: ClassForm;
  update: (f: Partial<ClassForm>) => void;
  teachers: TeacherOption[];
}) {
  return (
    <form onSubmit={(e: FormEvent) => e.preventDefault()}>
      <div className="form-group">
        <label>PROFESSOR (opcional)</label>
        <select
          className="form-input"
          value={form.teacherName}
          onChange={(e) => update({ teacherName: e.target.value })}
        >
          <option value="">— Selecionar professor —</option>
          {teachers.map((t) => (
            <option key={t.uid} value={t.name}>
              {t.name}
            </option>
          ))}
          {form.teacherName &&
            !teachers.some((t) => t.name === form.teacherName) && (
              <option value={form.teacherName}>{form.teacherName}</option>
            )}
        </select>
        {teachers.length === 0 && (
          <small className="form-hint">
            Nenhum professor aprovado encontrado no projeto.
          </small>
        )}
      </div>
      <div className="form-group">
        <label>LOCAL (opcional)</label>
        <input
          className="form-input"
          placeholder="Ex: Tatame principal"
          value={form.location}
          onChange={(e) => update({ location: e.target.value })}
        />
      </div>
    </form>
  );
}

function StepConfirmacao({
  form,
  modalities,
  modalityColor,
  error,
}: {
  form: ClassForm;
  modalities: ModalityData[];
  modalityColor: (m: ModalityData) => string;
  error: string | null;
}) {
  const mod = modalities.find((m) => m.id === form.modalityId);
  const color = mod ? modalityColor(mod) : "var(--gold)";
  const modalityName = (mod?.name ?? "").toUpperCase();

  const activeDaySet = new Set(form.days);
  const activeDays = DAYS.filter((d) => activeDaySet.has(d.code));
  const schedule =
    form.startTime && form.endTime
      ? `${form.startTime}–${form.endTime}`
      : "";

  return (
    <div>
      <p className="class-drawer-review-intro">
        Revise os dados antes de criar a turma.
      </p>

      <div
        className="confirm-card"
        style={{
          backgroundColor: `${color}14`,
          borderColor: `${color}44`,
        }}
      >
        <div className="confirm-card-modality">
          <span
            className="confirm-card-modality-dot"
            style={{ backgroundColor: color }}
          />
          <span
            className="confirm-card-modality-label"
            style={{ color }}
          >
            {modalityName || "—"}
          </span>
        </div>

        <div className="confirm-card-title">{form.name || "—"}</div>

        <div className="confirm-card-schedule">
          <div className="confirm-card-days">
            {activeDays.length > 0 ? (
              activeDays.map((d) => (
                <span
                  key={d.code}
                  className="confirm-day-chip"
                  style={{
                    color,
                    backgroundColor: `${color}22`,
                    borderColor: `${color}55`,
                  }}
                >
                  {d.label}
                </span>
              ))
            ) : (
              <span className="confirm-card-empty">—</span>
            )}
          </div>
          {schedule && (
            <span className="confirm-card-time">{schedule}</span>
          )}
        </div>

        {form.location && (
          <div className="confirm-card-location">{form.location}</div>
        )}
      </div>

      <div className="confirm-details">
        {form.totalSlots && (
          <div className="confirm-detail-row">
            <span className="confirm-detail-label">Vagas</span>
            <span className="confirm-detail-value">
              {form.totalSlots} vagas
            </span>
          </div>
        )}
        {form.teacherName && (
          <div className="confirm-detail-row">
            <span className="confirm-detail-label">Professor</span>
            <span className="confirm-detail-value">{form.teacherName}</span>
          </div>
        )}
        {form.location && (
          <div className="confirm-detail-row">
            <span className="confirm-detail-label">Local</span>
            <span className="confirm-detail-value">{form.location}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="login-error" style={{ marginTop: "1rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}
