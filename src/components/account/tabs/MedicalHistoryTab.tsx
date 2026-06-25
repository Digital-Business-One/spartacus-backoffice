import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import { formatDate } from "../types";

interface MedicalHistoryTabProps {
  uid: string;
}

interface SymptomsIn {
  coughingBlood: SymptomFrequency;
  abdominalPain: SymptomFrequency;
  legPain: SymptomFrequency;
  armPain: SymptomFrequency;
  backNeckPain: SymptomFrequency;
  chestPain: SymptomFrequency;
  jointPain: SymptomFrequency;
  shortnessOfBreath: SymptomFrequency;
  feelingWeak: SymptomFrequency;
  dizziness: SymptomFrequency;
  heartPalpitation: SymptomFrequency;
}

type SymptomFrequency = "always" | "sometimes" | "never";

interface DailyActivitiesIn {
  weeklyWorkHours: string;
  workActivities: string[];
  workActivitiesNotes: string;
}

interface MedicalHistoryIn {
  lastMedicalExamDate: string;
  familyHeartDisease: string[];
  surgeries: string[];
  surgeriesOther: string;
  diagnosedConditions: string[];
  diagnosedConditionsOther: string;
  currentMedications: string;
  symptoms: SymptomsIn;
  hasAllergies: boolean;
  allergiesDetails: string;
  hasRecentInjury: boolean;
  injuryDetails: string;
  hasExerciseRestriction: boolean;
  restrictionDetails: string;
}

interface HealthBehaviorIn {
  smokes: boolean;
  cigarettesPerDay: string;
  practicesPhysicalActivity: boolean;
  physicalActivityDescription: string;
  physicalActivityFrequency: string;
  physicalActivityDuration: string;
}

interface MedicalHistoryOut {
  projectId: string;
  userId: string;
  status: "pending_approval" | "approved" | "needs_revision" | string;
  dailyActivities?: DailyActivitiesIn | null;
  medicalHistory: MedicalHistoryIn;
  healthBehavior: HealthBehaviorIn;
  goals: string[];
  goalsOther: string;
  generalComments: string;
  filledAt?: string | null;
  filledBy?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

const FREQUENCY_LABELS: Record<SymptomFrequency, string> = {
  always: "Sempre",
  sometimes: "Às vezes",
  never: "Nunca",
};

const SYMPTOM_LABELS: Record<keyof SymptomsIn, string> = {
  coughingBlood: "Tosse com sangue",
  abdominalPain: "Dor abdominal",
  legPain: "Dor nas pernas",
  armPain: "Dor nos braços",
  backNeckPain: "Dor nas costas ou pescoço",
  chestPain: "Dor no peito",
  jointPain: "Dores articulares",
  shortnessOfBreath: "Falta de ar com esforço leve",
  feelingWeak: "Sentir-se fraco",
  dizziness: "Tontura",
  heartPalpitation: "Palpitação cardíaca",
};

const WEEKLY_WORK_HOURS_LABELS: Record<string, string> = {
  less_than_20: "Menos de 20h",
  "20_to_40": "20 a 40h",
  "41_to_60": "41 a 60h",
  more_than_60: "Mais de 60h",
};

const WORK_ACTIVITY_LABELS: Record<string, string> = {
  sitting: "Sentado",
  lifting_weights: "Carregando peso",
  standing: "Em pé",
  walking: "Caminhando",
  driving: "Dirigindo",
  other: "Outro",
};

const FAMILY_HEART_DISEASE_LABELS: Record<string, string> = {
  father: "Pai",
  mother: "Mãe",
  sibling: "Irmão/Irmã",
  grandparent: "Avô/Avó",
};

const SURGERY_LABELS: Record<string, string> = {
  spine: "Coluna",
  heart: "Coração",
  joint: "Articulação",
  herniated_disc: "Hérnia de disco",
  kidney: "Rim",
  lung: "Pulmão",
  eyes: "Olhos",
  other: "Outra",
};

// Must mirror the app's CONDITION_OPTIONS exactly (StepMedicalHistory.tsx) —
// these are the values actually stored, so the display map keys/labels have to
// match what the input form emits.
const DIAGNOSED_CONDITION_LABELS: Record<string, string> = {
  high_blood_pressure: "Hipertensão",
  diabetes: "Diabetes",
  asthma: "Asma",
  arthritis: "Artrite",
  obesity: "Obesidade",
  anemia: "Anemia",
  stroke: "AVC",
  kidney_disease: "Doença renal",
  emphysema: "Enfisema",
  ulcer: "Úlcera",
  eye_problems: "Problemas oculares",
  muscle_problems: "Problemas musculares",
  alcoholism: "Alcoolismo",
  other: "Outra",
};

const GOAL_LABELS: Record<string, string> = {
  discipline: "Disciplina",
  self_defense: "Defesa pessoal",
  socialization: "Socialização",
  health: "Saúde",
  competition: "Competição",
  physical_conditioning: "Condicionamento físico",
  therapeutic: "Terapêutico",
  leisure: "Lazer",
  other: "Outro",
};

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  pending_approval: { label: "Aguardando aprovação", variant: "warning" },
  approved: { label: "Aprovado", variant: "success" },
  needs_revision: { label: "Revisão solicitada", variant: "error" },
};

export function MedicalHistoryTab({ uid }: MedicalHistoryTabProps) {
  const [data, setData] = useState<MedicalHistoryOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review action state
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionNoteError, setRevisionNoteError] = useState(false);
  const revisionInputRef = useRef<HTMLTextAreaElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const result = await api.get<MedicalHistoryOut>(
        `/accounts/${uid}/medical-history`,
      );
      setData(result);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : "Erro ao carregar");
      }
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const result = await api.get<MedicalHistoryOut>(
          `/accounts/${uid}/medical-history`,
        );
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : "Erro ao carregar");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  async function handleApprove() {
    setReviewLoading(true);
    try {
      await api.patch(`/medical-history/${uid}/review`, { action: "approve" });
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao aprovar";
      window.alert(msg);
    } finally {
      setReviewLoading(false);
    }
  }

  function openRevisionForm() {
    setRevisionNote("");
    setRevisionNoteError(false);
    setShowRevisionForm(true);
    // Focus the textarea on next paint
    setTimeout(() => revisionInputRef.current?.focus(), 50);
  }

  function cancelRevisionForm() {
    setShowRevisionForm(false);
    setRevisionNote("");
    setRevisionNoteError(false);
  }

  async function handleRequestRevision() {
    const note = revisionNote.trim();
    if (!note) {
      setRevisionNoteError(true);
      revisionInputRef.current?.focus();
      return;
    }
    setReviewLoading(true);
    try {
      await api.patch(`/medical-history/${uid}/review`, {
        action: "request_revision",
        note,
      });
      setShowRevisionForm(false);
      setRevisionNote("");
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao solicitar revisão";
      window.alert(msg);
    } finally {
      setReviewLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="hub-loading">
        <span className="loading-spinner" style={{ width: 24, height: 24 }} />
        <span>Carregando anamnese...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="detail-empty-tab">
        <div style={{ fontSize: "2rem" }}>📋</div>
        <h3 style={{ margin: "0.5rem 0", color: "var(--text-primary)" }}>
          Anamnese não preenchida
        </h3>
        <p>O aluno ainda não enviou o formulário de anamnese.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="detail-empty-tab">
        <div style={{ fontSize: "2rem" }}>⚠️</div>
        <p>{error ?? "Erro ao carregar anamnese."}</p>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[data.status] ?? {
    label: data.status,
    variant: "muted",
  };

  return (
    <div className="detail-tab-content">
      {/* Status banner */}
      <div className={`anamnese-status-banner anamnese-status-banner--${statusInfo.variant}`}>
        <div className="anamnese-status-row">
          <span className={`status-badge status-badge--${statusInfo.variant}`}>
            {statusInfo.label}
          </span>
          {data.filledAt && (
            <span className="anamnese-status-meta">
              Preenchida em {formatDate(data.filledAt)}
            </span>
          )}
          {data.reviewedAt && (
            <span className="anamnese-status-meta">
              Avaliada em {formatDate(data.reviewedAt)}
              {data.reviewedBy ? ` por ${data.reviewedBy}` : ""}
            </span>
          )}
        </div>

        {/* Review note (needs_revision or approved with note) */}
        {data.reviewNote && (
          <div className="anamnese-review-note">
            <span className="anamnese-review-note-label">Motivo:</span>{" "}
            {data.reviewNote}
          </div>
        )}

        {data.status === "pending_approval" && (
          <>
            <div className="anamnese-status-disclaimer">
              ⓘ Esta aprovação faz parte do fluxo administrativo de aprovação
              de contas e não constitui validação clínica.
            </div>

            {/* Review actions */}
            {!showRevisionForm ? (
              <div className="anamnese-review-actions">
                <button
                  type="button"
                  className="account-action-btn account-action-btn--primary"
                  disabled={reviewLoading}
                  onClick={handleApprove}
                >
                  {reviewLoading ? "Aguarde..." : "Aprovar"}
                </button>
                <button
                  type="button"
                  className="account-action-btn"
                  disabled={reviewLoading}
                  onClick={openRevisionForm}
                >
                  Pedir revisão
                </button>
              </div>
            ) : (
              <div className="anamnese-revision-form">
                <label className="anamnese-revision-label" htmlFor="revision-note">
                  Motivo da revisão <span className="anamnese-revision-required">*</span>
                </label>
                <textarea
                  id="revision-note"
                  ref={revisionInputRef}
                  className={`anamnese-revision-textarea${revisionNoteError ? " anamnese-revision-textarea--error" : ""}`}
                  rows={3}
                  placeholder="Descreva o que precisa ser corrigido ou complementado..."
                  value={revisionNote}
                  disabled={reviewLoading}
                  onChange={(e) => {
                    setRevisionNote(e.target.value);
                    if (revisionNoteError && e.target.value.trim()) {
                      setRevisionNoteError(false);
                    }
                  }}
                />
                {revisionNoteError && (
                  <span className="anamnese-revision-error-msg">
                    O motivo é obrigatório.
                  </span>
                )}
                <div className="anamnese-review-actions">
                  <button
                    type="button"
                    className="account-action-btn account-action-btn--danger"
                    disabled={reviewLoading}
                    onClick={handleRequestRevision}
                  >
                    {reviewLoading ? "Aguarde..." : "Enviar revisão"}
                  </button>
                  <button
                    type="button"
                    className="account-action-btn"
                    disabled={reviewLoading}
                    onClick={cancelRevisionForm}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Daily activities (16+ only) */}
      {data.dailyActivities && (
        <Section title="Atividades diárias">
          <Row
            label="Carga horária semanal"
            value={
              WEEKLY_WORK_HOURS_LABELS[data.dailyActivities.weeklyWorkHours] ??
              data.dailyActivities.weeklyWorkHours
            }
          />
          <Row
            label="Atividades no trabalho"
            value={
              data.dailyActivities.workActivities.length > 0
                ? data.dailyActivities.workActivities
                    .map((a) => WORK_ACTIVITY_LABELS[a] ?? a)
                    .join(", ")
                : null
            }
          />
          {data.dailyActivities.workActivitiesNotes && (
            <Row
              label="Observações"
              value={data.dailyActivities.workActivitiesNotes}
            />
          )}
        </Section>
      )}

      {/* Medical history */}
      <Section title="Histórico médico">
        <Row
          label="Último exame médico"
          value={data.medicalHistory.lastMedicalExamDate || null}
        />
        <Row
          label="Histórico familiar cardíaco"
          value={
            data.medicalHistory.familyHeartDisease.length > 0
              ? data.medicalHistory.familyHeartDisease
                  .map((f) => FAMILY_HEART_DISEASE_LABELS[f] ?? f)
                  .join(", ")
              : "Não"
          }
        />
        <Row
          label="Cirurgias prévias"
          value={
            data.medicalHistory.surgeries.length > 0
              ? data.medicalHistory.surgeries
                  .map((s) => SURGERY_LABELS[s] ?? s)
                  .join(", ")
              : "Nenhuma"
          }
        />
        {data.medicalHistory.surgeriesOther && (
          <Row
            label="Outras cirurgias"
            value={data.medicalHistory.surgeriesOther}
          />
        )}
        <Row
          label="Doenças diagnosticadas"
          value={
            data.medicalHistory.diagnosedConditions.length > 0
              ? data.medicalHistory.diagnosedConditions
                  .map((c) => DIAGNOSED_CONDITION_LABELS[c] ?? c)
                  .join(", ")
              : "Nenhuma"
          }
        />
        {data.medicalHistory.diagnosedConditionsOther && (
          <Row
            label="Outras doenças"
            value={data.medicalHistory.diagnosedConditionsOther}
          />
        )}
        <Row
          label="Medicamentos em uso"
          value={data.medicalHistory.currentMedications || "Nenhum"}
        />
        <Row
          label="Alergias"
          value={
            data.medicalHistory.hasAllergies
              ? data.medicalHistory.allergiesDetails
              : "Não"
          }
        />
        <Row
          label="Lesões recentes"
          value={
            data.medicalHistory.hasRecentInjury
              ? data.medicalHistory.injuryDetails
              : "Não"
          }
        />
        <Row
          label="Restrições para exercício"
          value={
            data.medicalHistory.hasExerciseRestriction
              ? data.medicalHistory.restrictionDetails
              : "Não"
          }
        />
      </Section>

      {/* Symptoms */}
      <Section title="Sintomas frequentes">
        {Object.entries(SYMPTOM_LABELS).map(([key, label]) => {
          const value =
            data.medicalHistory.symptoms[key as keyof SymptomsIn];
          return (
            <Row
              key={key}
              label={label}
              value={
                <SymptomChip frequency={value} />
              }
            />
          );
        })}
      </Section>

      {/* Health behavior */}
      <Section title="Comportamento de saúde">
        <Row
          label="Fuma"
          value={
            data.healthBehavior.smokes
              ? `Sim — ${data.healthBehavior.cigarettesPerDay} cigarros/dia`
              : "Não"
          }
        />
        <Row
          label="Pratica atividade física"
          value={
            data.healthBehavior.practicesPhysicalActivity
              ? data.healthBehavior.physicalActivityDescription
              : "Não"
          }
        />
        {data.healthBehavior.practicesPhysicalActivity && (
          <>
            <Row
              label="Frequência"
              value={data.healthBehavior.physicalActivityFrequency}
            />
            <Row
              label="Duração"
              value={data.healthBehavior.physicalActivityDuration}
            />
          </>
        )}
      </Section>

      {/* Goals */}
      <Section title="Objetivos">
        <Row
          label="Objetivos selecionados"
          value={
            data.goals.length > 0
              ? data.goals.map((g) => GOAL_LABELS[g] ?? g).join(", ")
              : null
          }
        />
        {data.goalsOther && <Row label="Outro objetivo" value={data.goalsOther} />}
      </Section>

      {data.generalComments && (
        <Section title="Comentários gerais">
          <p className="anamnese-comments">{data.generalComments}</p>
        </Section>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="detail-section">
      <h3 className="detail-section-title">{title}</h3>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value?: string | React.ReactNode | null;
}) {
  const isEmpty = value === null || value === undefined || value === "";
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span
        className={`detail-row-value ${isEmpty ? "detail-row-value--muted" : ""}`}
      >
        {isEmpty ? "—" : value}
      </span>
    </div>
  );
}

function SymptomChip({ frequency }: { frequency: SymptomFrequency }) {
  const variant =
    frequency === "always"
      ? "error"
      : frequency === "sometimes"
        ? "warning"
        : "success";
  return (
    <span className={`status-badge status-badge--${variant}`}>
      {FREQUENCY_LABELS[frequency]}
    </span>
  );
}
