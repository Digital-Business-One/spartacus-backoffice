import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "../lib/api";
import { formatDate } from "../components/account/types";

/* ── Types ──────────────────────────────────────────────────────────────── */

interface PendingItem {
  uid: string;
  name: string;
  submittedAt?: string | null;
}

interface PendingListResponse {
  items: PendingItem[];
}

type SymptomFrequency = "always" | "sometimes" | "never";

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

/* ── Icons ──────────────────────────────────────────────────────────────── */

const Svg = ({ children, size = 14 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcCheckCircle = () => (<Svg><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Svg>);
const IcEdit = () => (<Svg><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>);
const IcChevronDown = () => (<Svg><polyline points="6 9 12 15 18 9" /></Svg>);
const IcChevronUp = () => (<Svg><polyline points="18 15 12 9 6 15" /></Svg>);

/* ── Display maps (mirror MedicalHistoryTab) ─────────────────────────────── */

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

/* ── Page ───────────────────────────────────────────────────────────────── */

export function FichaSaudePage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PendingListResponse>("/medical-history/pending-review");
      setItems(res.items ?? []);
    } catch (err) {
      console.error("[FichaSaudePage] fetch failed:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar fichas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  function toggleExpand(uid: string) {
    setExpandedUid((prev) => (prev === uid ? null : uid));
  }

  function removeItem(uid: string) {
    setItems((prev) => prev.filter((i) => i.uid !== uid));
    if (expandedUid === uid) setExpandedUid(null);
  }

  return (
    <div className="freq-fullwidth">
      <div className="freq-header">
        <div>
          <h2 className="settings-title">FICHA DE SAÚDE</h2>
          <p>Anamneses aguardando revisão e aprovação</p>
        </div>
      </div>

      {loading ? (
        <div className="hub-loading" style={{ padding: "3rem 0" }}>
          <span className="loading-spinner" style={{ width: 22, height: 22 }} />
          <span>Carregando fichas...</span>
        </div>
      ) : error ? (
        <div className="empty-state" style={{ marginTop: "2rem" }}>
          <div className="empty-state-icon">⚠️</div>
          <h3>Erro ao carregar</h3>
          <p>{error}</p>
          <button className="btn btn-sm btn-outline" onClick={fetchList} style={{ marginTop: "1rem" }}>
            Tentar novamente
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state" style={{ marginTop: "2rem" }}>
          <div className="empty-state-icon">📋</div>
          <h3>Nenhuma ficha pendente</h3>
          <p>Todas as fichas de saúde foram revisadas.</p>
        </div>
      ) : (
        <div className="grad-grid" style={{ gridTemplateColumns: "1fr" }}>
          {items.map((item) => (
            <FichaCard
              key={item.uid}
              item={item}
              expanded={expandedUid === item.uid}
              onToggle={() => toggleExpand(item.uid)}
              onDone={() => removeItem(item.uid)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Card ───────────────────────────────────────────────────────────────── */

function FichaCard({
  item,
  expanded,
  onToggle,
  onDone,
}: {
  item: PendingItem;
  expanded: boolean;
  onToggle: () => void;
  onDone: () => void;
}) {
  const [detail, setDetail] = useState<MedicalHistoryOut | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [actingOn, setActingOn] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionNoteError, setRevisionNoteError] = useState(false);
  const revisionInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!expanded) return;
    if (detail) return; // already loaded
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    api
      .get<MedicalHistoryOut>(`/accounts/${item.uid}/medical-history`)
      .then((res) => { if (!cancelled) setDetail(res); })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setDetailError("Ficha não encontrada.");
        } else {
          setDetailError(err instanceof Error ? err.message : "Erro ao carregar ficha.");
        }
      })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [expanded, item.uid, detail]);

  async function handleApprove() {
    setActingOn(true);
    try {
      await api.patch(`/medical-history/${item.uid}/review`, { action: "approve" });
      onDone();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro ao aprovar ficha.");
    } finally {
      setActingOn(false);
    }
  }

  function openRevisionForm() {
    setRevisionNote("");
    setRevisionNoteError(false);
    setShowRevisionForm(true);
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
    setActingOn(true);
    try {
      await api.patch(`/medical-history/${item.uid}/review`, {
        action: "request_revision",
        note,
      });
      onDone();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro ao solicitar revisão.");
    } finally {
      setActingOn(false);
    }
  }

  return (
    <article className="grad-card" style={{ display: "block" }}>
      {/* Card header — always visible */}
      <div
        className="grad-card-main"
        style={{ cursor: "pointer" }}
        onClick={onToggle}
      >
        <div className="grad-card-id" style={{ flex: 1 }}>
          <div className="grad-card-name-line">
            <span className="grad-card-name">{item.name}</span>
            <span className="grad-status grad-status--pending">pendente</span>
          </div>
          {item.submittedAt && (
            <span className="grad-card-meta">
              Enviada em {formatDate(item.submittedAt)}
            </span>
          )}
        </div>
        <span style={{ color: "var(--text-secondary)", marginLeft: "0.5rem" }}>
          {expanded ? <IcChevronUp /> : <IcChevronDown />}
        </span>
      </div>

      {/* Action buttons — always visible */}
      <div className="anamnese-review-actions" style={{ padding: "0 1rem 0.75rem" }}>
        {!showRevisionForm ? (
          <>
            <button
              type="button"
              className="account-action-btn account-action-btn--primary"
              disabled={actingOn}
              onClick={(e) => { e.stopPropagation(); handleApprove(); }}
            >
              <IcCheckCircle /> {actingOn ? "Aguarde..." : "Aprovar"}
            </button>
            <button
              type="button"
              className="account-action-btn"
              disabled={actingOn}
              onClick={(e) => { e.stopPropagation(); openRevisionForm(); }}
            >
              <IcEdit /> Pedir revisão
            </button>
          </>
        ) : (
          <div className="anamnese-revision-form" style={{ width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <label className="anamnese-revision-label" htmlFor={`revision-note-${item.uid}`}>
              Motivo da revisão <span className="anamnese-revision-required">*</span>
            </label>
            <textarea
              id={`revision-note-${item.uid}`}
              ref={revisionInputRef}
              className={`anamnese-revision-textarea${revisionNoteError ? " anamnese-revision-textarea--error" : ""}`}
              rows={3}
              placeholder="Descreva o que precisa ser corrigido ou complementado..."
              value={revisionNote}
              disabled={actingOn}
              onChange={(e) => {
                setRevisionNote(e.target.value);
                if (revisionNoteError && e.target.value.trim()) setRevisionNoteError(false);
              }}
            />
            {revisionNoteError && (
              <span className="anamnese-revision-error-msg">O motivo é obrigatório.</span>
            )}
            <div className="anamnese-review-actions">
              <button
                type="button"
                className="account-action-btn account-action-btn--danger"
                disabled={actingOn}
                onClick={handleRequestRevision}
              >
                {actingOn ? "Aguarde..." : "Enviar revisão"}
              </button>
              <button
                type="button"
                className="account-action-btn"
                disabled={actingOn}
                onClick={cancelRevisionForm}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Expandable detail */}
      {expanded && (
        <div className="detail-tab-content" style={{ borderTop: "1px solid var(--border)" }}>
          {detailLoading ? (
            <div className="hub-loading" style={{ padding: "2rem 0" }}>
              <span className="loading-spinner" style={{ width: 20, height: 20 }} />
              <span>Carregando anamnese...</span>
            </div>
          ) : detailError ? (
            <div className="detail-empty-tab">
              <p>{detailError}</p>
            </div>
          ) : detail ? (
            <MedicalHistoryDetail data={detail} />
          ) : null}
        </div>
      )}
    </article>
  );
}

/* ── Read-only medical history display ───────────────────────────────────── */

function MedicalHistoryDetail({ data }: { data: MedicalHistoryOut }) {
  return (
    <>
      {data.dailyActivities && (
        <Section title="Atividades diárias">
          <Row
            label="Carga horária semanal"
            value={WEEKLY_WORK_HOURS_LABELS[data.dailyActivities.weeklyWorkHours] ?? data.dailyActivities.weeklyWorkHours}
          />
          <Row
            label="Atividades no trabalho"
            value={
              data.dailyActivities.workActivities.length > 0
                ? data.dailyActivities.workActivities.map((a) => WORK_ACTIVITY_LABELS[a] ?? a).join(", ")
                : null
            }
          />
          {data.dailyActivities.workActivitiesNotes && (
            <Row label="Observações" value={data.dailyActivities.workActivitiesNotes} />
          )}
        </Section>
      )}

      <Section title="Histórico médico">
        <Row label="Último exame médico" value={data.medicalHistory.lastMedicalExamDate || null} />
        <Row
          label="Histórico familiar cardíaco"
          value={
            data.medicalHistory.familyHeartDisease.length > 0
              ? data.medicalHistory.familyHeartDisease.map((f) => FAMILY_HEART_DISEASE_LABELS[f] ?? f).join(", ")
              : "Não"
          }
        />
        <Row
          label="Cirurgias prévias"
          value={
            data.medicalHistory.surgeries.length > 0
              ? data.medicalHistory.surgeries.map((s) => SURGERY_LABELS[s] ?? s).join(", ")
              : "Nenhuma"
          }
        />
        {data.medicalHistory.surgeriesOther && (
          <Row label="Outras cirurgias" value={data.medicalHistory.surgeriesOther} />
        )}
        <Row
          label="Doenças diagnosticadas"
          value={
            data.medicalHistory.diagnosedConditions.length > 0
              ? data.medicalHistory.diagnosedConditions.map((c) => DIAGNOSED_CONDITION_LABELS[c] ?? c).join(", ")
              : "Nenhuma"
          }
        />
        {data.medicalHistory.diagnosedConditionsOther && (
          <Row label="Outras doenças" value={data.medicalHistory.diagnosedConditionsOther} />
        )}
        <Row label="Medicamentos em uso" value={data.medicalHistory.currentMedications || "Nenhum"} />
        <Row
          label="Alergias"
          value={data.medicalHistory.hasAllergies ? data.medicalHistory.allergiesDetails : "Não"}
        />
        <Row
          label="Lesões recentes"
          value={data.medicalHistory.hasRecentInjury ? data.medicalHistory.injuryDetails : "Não"}
        />
        <Row
          label="Restrições para exercício"
          value={data.medicalHistory.hasExerciseRestriction ? data.medicalHistory.restrictionDetails : "Não"}
        />
      </Section>

      <Section title="Sintomas frequentes">
        {Object.entries(SYMPTOM_LABELS).map(([key, label]) => {
          const value = data.medicalHistory.symptoms[key as keyof SymptomsIn];
          return <Row key={key} label={label} value={<SymptomChip frequency={value} />} />;
        })}
      </Section>

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
            <Row label="Frequência" value={data.healthBehavior.physicalActivityFrequency} />
            <Row label="Duração" value={data.healthBehavior.physicalActivityDuration} />
          </>
        )}
      </Section>

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
    </>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="detail-section">
      <h3 className="detail-section-title">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | React.ReactNode | null }) {
  const isEmpty = value === null || value === undefined || value === "";
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span className={`detail-row-value ${isEmpty ? "detail-row-value--muted" : ""}`}>
        {isEmpty ? "—" : value}
      </span>
    </div>
  );
}

function SymptomChip({ frequency }: { frequency: SymptomFrequency }) {
  const variant =
    frequency === "always" ? "error" : frequency === "sometimes" ? "warning" : "success";
  return (
    <span className={`status-badge status-badge--${variant}`}>
      {FREQUENCY_LABELS[frequency]}
    </span>
  );
}
