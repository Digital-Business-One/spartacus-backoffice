import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useClasses } from "../hooks/useClasses";
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "spartacus-artes-marciais";

interface ModalityData {
  id: string;
  name: string;
  slug: string;
}

const DAYS = [
  { code: "mon", label: "Seg" },
  { code: "tue", label: "Ter" },
  { code: "wed", label: "Qua" },
  { code: "thu", label: "Qui" },
  { code: "fri", label: "Sex" },
  { code: "sat", label: "Sáb" },
  { code: "sun", label: "Dom" },
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
  ageMin: string;
  ageMax: string;
  attendanceEngineEnabled: boolean;
  attendanceStartDate: string; // ISO YYYY-MM-DD, "" when unset
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
  ageMin: "",
  ageMax: "",
  attendanceEngineEnabled: false,
  attendanceStartDate: "",
};

function attendanceEngineError(form: ClassForm): string | null {
  if (form.attendanceEngineEnabled && !form.attendanceStartDate) {
    return "Informe a data-base para ativar o motor de frequência.";
  }
  return null;
}

function formatIsoDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function ClassWizardPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { classes, createClass, updateClass } = useClasses();
  const [modalities, setModalities] = useState<ModalityData[]>([]);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ClassForm>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const fetchModalities = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/projects/${PROJECT_ID}/modalities`);
      if (res.ok) {
        const data = await res.json();
        setModalities(data.modalities ?? []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchModalities(); }, [fetchModalities]);

  // Pre-fill form when editing
  useEffect(() => {
    if (!isEdit || classes.length === 0) return;
    const cls = classes.find((c) => c.id === id);
    if (!cls) return;
    // Parse schedule back to days + times
    const scheduleParts = cls.schedule.split(" ");
    const dayLabels = (scheduleParts[0] ?? "").split("/");
    const dayMap: Record<string, string> = {};
    DAYS.forEach((d) => { dayMap[d.label] = d.code; });
    const days = dayLabels.map((l) => dayMap[l]).filter(Boolean);
    const timePart = scheduleParts.slice(1).join(" ");
    const [startTime, endTime] = timePart.split("–").map((t) => t.trim());

    setForm({
      slug: cls.id.split("_").slice(1).join("_") || cls.id,
      name: cls.name,
      modalityId: cls.modality_id,
      days,
      startTime: startTime ?? "",
      endTime: endTime ?? "",
      teacherName: cls.teacher ?? "",
      location: cls.location ?? "",
      ageMin: cls.age_range?.min?.toString() ?? "",
      ageMax: cls.age_range?.max?.toString() ?? "",
      attendanceEngineEnabled: cls.attendanceEngineEnabled ?? false,
      attendanceStartDate: cls.attendanceStartDate ?? "",
    });
  }, [isEdit, id, classes]);

  useEffect(() => { if (step === 0) nameRef.current?.focus(); }, [step]);

  function update(fields: Partial<ClassForm>) {
    setForm((prev) => ({ ...prev, ...fields }));
  }

  function next() { setError(null); setStep((s) => s + 1); }
  function back() { setError(null); setStep((s) => s - 1); }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit() {
    // Fail fast client-side — the server also enforces this (422) but there's
    // no reason to round-trip for a check we can do locally.
    const engineError = attendanceEngineError(form);
    if (engineError) {
      setError(engineError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
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
        age_range: form.ageMin ? { min: parseInt(form.ageMin), max: form.ageMax ? parseInt(form.ageMax) : undefined } : undefined,
        attendanceEngineEnabled: form.attendanceEngineEnabled,
        attendanceStartDate: form.attendanceStartDate || undefined,
      };

      if (isEdit && id) {
        await updateClass(id, payload);
      } else {
        await createClass(payload);
      }
      navigate("/configuracoes");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar turma.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>{isEdit ? "Editar Turma" : "Nova Turma"}</h2>
        <p>{STEPS[step]}</p>
      </div>

      <div className="wizard-container">
        <div className="wizard-steps">
          {STEPS.map((_, i) => (
            <div key={i} className={`wizard-step ${i < step ? "done" : ""} ${i === step ? "active" : ""}`} />
          ))}
        </div>

        <div className="wizard-card">
          {step === 0 && (
            <StepIdentificacao form={form} update={update} next={next} back={() => navigate("/configuracoes")} nameRef={nameRef} modalities={modalities} />
          )}
          {step === 1 && (
            <StepAgenda form={form} update={update} next={next} back={back} />
          )}
          {step === 2 && (
            <StepDetalhes form={form} update={update} next={next} back={back} />
          )}
          {step === 3 && (
            <StepConfirmacao form={form} loading={loading} error={error} onSubmit={handleSubmit} back={back} isEdit={isEdit} modalities={modalities} />
          )}
        </div>
      </div>
    </>
  );
}

/* ── Step 1: Identificação ─────────────────────────────────────────────────── */

function StepIdentificacao({
  form, update, next, back, nameRef, modalities,
}: { form: ClassForm; update: (f: Partial<ClassForm>) => void; next: () => void; back: () => void; nameRef: React.RefObject<HTMLInputElement>; modalities: ModalityData[] }) {
  function handleSubmit(e: FormEvent) { e.preventDefault(); next(); }
  const canContinue = form.name.trim().length >= 3 && form.modalityId !== "";

  return (
    <form onSubmit={handleSubmit}>
      <h3>Identificação</h3>
      <p>Nome e modalidade da turma.</p>
      <div className="wizard-form">
        <div className="form-group">
          <label>Nome da turma</label>
          <input ref={nameRef} className="form-input" placeholder="Ex: Kids Matutino, Adultos" value={form.name} onChange={(e) => update({ name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Modalidade</label>
          <select className="form-input" value={form.modalityId} onChange={(e) => update({ modalityId: e.target.value })} required>
            <option value="">Selecione a modalidade</option>
            {modalities.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back}>Voltar ao projeto</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!canContinue}>Próximo</button>
      </div>
    </form>
  );
}

/* ── Step 2: Agenda ────────────────────────────────────────────────────────── */

function StepAgenda({
  form, update, next, back,
}: { form: ClassForm; update: (f: Partial<ClassForm>) => void; next: () => void; back: () => void }) {
  function toggleDay(code: string) {
    const current = new Set(form.days);
    if (current.has(code)) { current.delete(code); } else { current.add(code); }
    update({ days: Array.from(current) });
  }

  function handleSubmit(e: FormEvent) { e.preventDefault(); next(); }
  const canContinue = form.days.length > 0 && form.startTime !== "" && form.endTime !== "";

  return (
    <form onSubmit={handleSubmit}>
      <h3>Agenda</h3>
      <p>Dias da semana e horário da turma.</p>
      <div className="wizard-form">
        <div className="form-group">
          <label>Dias da semana</label>
          <div className="day-selector">
            {DAYS.map((d) => (
              <button
                key={d.code}
                type="button"
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
            <label>Início</label>
            <input className="form-input" type="time" value={form.startTime} onChange={(e) => update({ startTime: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Término</label>
            <input className="form-input" type="time" value={form.endTime} onChange={(e) => update({ endTime: e.target.value })} required />
          </div>
        </div>
      </div>
      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back}>Voltar</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!canContinue}>Próximo</button>
      </div>
    </form>
  );
}

/* ── Step 3: Detalhes ──────────────────────────────────────────────────────── */

function StepDetalhes({
  form, update, next, back,
}: { form: ClassForm; update: (f: Partial<ClassForm>) => void; next: () => void; back: () => void }) {
  function handleSubmit(e: FormEvent) { e.preventDefault(); next(); }
  const engineError = attendanceEngineError(form);

  return (
    <form onSubmit={handleSubmit}>
      <h3>Detalhes</h3>
      <p>Informações opcionais da turma.</p>
      <div className="wizard-form">
        <div className="form-group">
          <label>Professor (opcional)</label>
          <input className="form-input" placeholder="Nome do professor" value={form.teacherName} onChange={(e) => update({ teacherName: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Local (opcional)</label>
          <input className="form-input" placeholder="Ex: Tatame Principal" value={form.location} onChange={(e) => update({ location: e.target.value })} />
        </div>
        <div className="wizard-row">
          <div className="form-group">
            <label>Idade mínima (opcional)</label>
            <input className="form-input" type="number" min={0} placeholder="Ex: 5" value={form.ageMin} onChange={(e) => update({ ageMin: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Idade máxima (opcional)</label>
            <input className="form-input" type="number" min={0} placeholder="Ex: 17" value={form.ageMax} onChange={(e) => update({ ageMax: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Motor de frequência</label>
          <div className="attendance-engine-row">
            <label className="donation-toggle">
              <input
                type="checkbox"
                checked={form.attendanceEngineEnabled}
                onChange={(e) => update({ attendanceEngineEnabled: e.target.checked })}
              />
              <span className="donation-toggle-mark" />
            </label>
            <span className={`attendance-engine-status ${form.attendanceEngineEnabled ? "on" : ""}`}>
              {form.attendanceEngineEnabled ? "LIGADO" : "DESLIGADO"}
            </span>
          </div>
          <small className="form-hint">
            Quando ligado, os alunos fazem check-in e a frequência desta turma passa a ser contabilizada.
          </small>
        </div>
        {form.attendanceEngineEnabled && (
          <div className="form-group">
            <label>Data-base da contagem *</label>
            <input
              className="form-input"
              type="date"
              value={form.attendanceStartDate}
              onChange={(e) => update({ attendanceStartDate: e.target.value })}
            />
            <small className="form-hint">Presenças e faltas só contam a partir desta data.</small>
            {engineError && <span className="field-error">{engineError}</span>}
          </div>
        )}
      </div>
      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back}>Voltar</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!!engineError}>Próximo</button>
      </div>
    </form>
  );
}

/* ── Step 4: Confirmação ───────────────────────────────────────────────────── */

function StepConfirmacao({
  form, loading, error, onSubmit, back, isEdit, modalities,
}: { form: ClassForm; loading: boolean; error: string | null; onSubmit: () => void; back: () => void; isEdit: boolean; modalities: ModalityData[] }) {
  const dayLabels: Record<string, string> = {};
  DAYS.forEach((d) => { dayLabels[d.code] = d.label; });
  const daysFormatted = form.days.map((d) => dayLabels[d] ?? d).join("/");
  const modalityName = modalities.find((m) => m.id === form.modalityId)?.name ?? form.modalityId;

  return (
    <>
      <h3>Confirmação</h3>
      <p>Revise os dados da turma.</p>
      <div className="review-section-card">
        <ReviewRow label="Nome" value={form.name} />
        <ReviewRow label="Modalidade" value={modalityName} />
        <ReviewRow label="Dias" value={daysFormatted} />
        <ReviewRow label="Horário" value={`${form.startTime}–${form.endTime}`} />
        {form.teacherName && <ReviewRow label="Professor" value={form.teacherName} />}
        {form.ageMin && <ReviewRow label="Faixa etária" value={`${form.ageMin}–${form.ageMax || "∞"} anos`} />}
        <ReviewRow
          label="Motor de frequência"
          value={
            form.attendanceEngineEnabled
              ? `Ligado — desde ${form.attendanceStartDate ? formatIsoDateBR(form.attendanceStartDate) : "—"}`
              : "Desligado"
          }
        />
      </div>
      {error && <div className="login-error" style={{ marginTop: "1rem" }}>{error}</div>}
      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back} disabled={loading}>Voltar</button>
        <button className="btn btn-primary btn-sm" onClick={onSubmit} disabled={loading}>
          {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar turma"}
        </button>
      </div>
    </>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="review-row">
      <span className="review-row-label">{label}</span>
      <span className="review-row-value">{value || "—"}</span>
    </div>
  );
}
