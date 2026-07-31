import { useState, useEffect, useCallback, useRef } from "react";
import { useProject, type ProjectData } from "../hooks/useProject";
import { useClasses, type ClassData } from "../hooks/useClasses";
import { api } from "../lib/api";
import { DatePicker } from "../components/DatePicker";
import { ClassWizardDrawer } from "../components/class-wizard/ClassWizardDrawer";

type SettingsTab =
  | "cadastro"
  | "faixas"
  | "modalidades"
  | "turmas"
  | "apoio"
  | "justificativas";

// ── Icons (Feather-style, stroke-only) ──────────────────────────────────────

const Svg = ({
  children,
  size = 16,
}: {
  children: React.ReactNode;
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const I = {
  building: (
    <Svg>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
    </Svg>
  ),
  users: (
    <Svg>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </Svg>
  ),
  award: (
    <Svg>
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </Svg>
  ),
  gift: (
    <Svg>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </Svg>
  ),
  edit: (
    <Svg size={14}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Svg>
  ),
  save: (
    <Svg size={14}>
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </Svg>
  ),
  tag: (
    <Svg size={14}>
      <path d="M20.59 13.41L13.42 20.58a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </Svg>
  ),
  fileText: (
    <Svg size={14}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </Svg>
  ),
  briefcase: (
    <Svg size={14}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </Svg>
  ),
  mapPin: (
    <Svg size={14}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </Svg>
  ),
  map: (
    <Svg size={14}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </Svg>
  ),
  mail: (
    <Svg size={14}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </Svg>
  ),
  calendar: (
    <Svg size={14}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </Svg>
  ),
  trash: (
    <Svg size={14}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </Svg>
  ),
  plus: (
    <Svg size={14}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  ),
  check: (
    <Svg size={14}>
      <polyline points="20 6 9 17 4 12" />
    </Svg>
  ),
  refresh: (
    <Svg size={14}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </Svg>
  ),
};

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "cadastro", label: "Cadastro", icon: I.building },
  { id: "faixas", label: "Faixas Etárias", icon: I.users },
  { id: "modalidades", label: "Modalidades", icon: I.tag },
  { id: "turmas", label: "Turmas", icon: I.award },
  { id: "apoio", label: "Apoio", icon: I.gift },
  { id: "justificativas", label: "Justificativas", icon: I.fileText },
];

// ── Domain types ────────────────────────────────────────────────────────────

interface DonationConfigItem {
  code: string;
  label: string;
  active: boolean;
}

interface AgeRange {
  label: string;
  minAge: number;
  maxAge: number | null;
  color?: string;
}

const AGE_COLORS = [
  "#E8B133", // gold
  "#4CAF50", // green
  "#3B82F6", // blue
  "#A855F7", // purple
  "#F97316", // orange
  "#EC4899", // pink
  "#14B8A6", // teal
  "#EF4444", // red
];

const DEFAULT_AGE_RANGES: AgeRange[] = [
  { label: "Kids", minAge: 0, maxAge: 10, color: "#E8B133" },
  { label: "Infanto Juvenil", minAge: 11, maxAge: 17, color: "#4CAF50" },
  { label: "Adulto", minAge: 18, maxAge: null, color: "#3B82F6" },
];

// ── Page ────────────────────────────────────────────────────────────────────

export function ProjectSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("cadastro");
  const { project, loading: projectLoading, updateProject } = useProject();
  const {
    classes,
    loading: classesLoading,
    deactivateClass,
    reactivateClass,
    createClass,
    updateClass,
  } = useClasses();
  const [ageRanges, setAgeRanges] = useState<AgeRange[]>(DEFAULT_AGE_RANGES);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardEditing, setWizardEditing] = useState<ClassData | null>(null);

  if (projectLoading) {
    return (
      <div className="hub-loading">
        <span className="loading-spinner" style={{ width: 24, height: 24 }} />
        <span>Carregando configurações...</span>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2 className="settings-title">CONFIGURAÇÕES</h2>
        <p>Configurações do projeto</p>
      </div>

      <div className="settings-tabs settings-tabs--v2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`settings-tab-v2 ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="settings-tab-v2-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeTab === "cadastro" && project && (
          <CadastroTab project={project} onUpdate={updateProject} />
        )}
        {activeTab === "faixas" && (
          <FaixasEtariasTab ranges={ageRanges} onChange={setAgeRanges} />
        )}
        {activeTab === "turmas" && (
          <TurmasTab
            classes={classes}
            loading={classesLoading}
            onNewClass={() => {
              setWizardEditing(null);
              setWizardOpen(true);
            }}
            onEditClass={(id) => {
              const cls = classes.find((c) => c.id === id) ?? null;
              setWizardEditing(cls);
              setWizardOpen(true);
            }}
            onDeactivateClass={(id) =>
              deactivateClass(id).then(() => undefined)
            }
            onDeleteOrDeactivate={deactivateClass}
            onReactivateClass={reactivateClass}
            onUpdateClass={updateClass}
          />
        )}
        {activeTab === "modalidades" && <ModalidadesTab />}
        {activeTab === "apoio" && <ApoioTab />}
        {activeTab === "justificativas" && <JustificationTypesTab />}
      </div>

      <ClassWizardDrawer
        open={wizardOpen}
        editing={wizardEditing}
        onClose={() => setWizardOpen(false)}
        onCreate={createClass}
        onUpdate={updateClass}
      />
    </>
  );
}

/* ── Cadastro Tab ──────────────────────────────────────────────────────────── */

function CadastroTab({
  project,
  onUpdate,
}: {
  project: ProjectData;
  onUpdate: (data: Partial<ProjectData>) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: project.name,
    razao_social: project.razao_social ?? "",
    cnpj: project.cnpj ?? "",
    address: project.address ?? "",
    city: project.city ?? "",
    state: project.state ?? "",
    zip_code: project.zip_code ?? "",
    legal_nature: project.legal_nature ?? "",
    founded_at: project.founded_at ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setForm({
      name: project.name,
      razao_social: project.razao_social ?? "",
      cnpj: project.cnpj ?? "",
      address: project.address ?? "",
      city: project.city ?? "",
      state: project.state ?? "",
      zip_code: project.zip_code ?? "",
      legal_nature: project.legal_nature ?? "",
      founded_at: project.founded_at ?? "",
    });
    setEditing(false);
  }

  async function handleLogoFile(file: File) {
    setUploadingLogo(true);
    try {
      // Downscale to <=256x256 and encode as data URL to keep payload small
      const dataUrl = await downscaleImage(file, 256, 0.82);
      await onUpdate({ logo_url: dataUrl });
    } catch {
      // ignore — user can retry
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const initial = (project.name ?? "S").slice(0, 1).toUpperCase();
  const logoUrl = project.logo_url;

  return (
    <div className="settings-card">
      <div className="project-hero">
        <button
          type="button"
          className="project-hero-avatar project-hero-avatar--button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingLogo}
          title="Clique para alterar o logo"
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo do projeto" className="project-hero-logo-img" />
          ) : (
            <span>{initial}</span>
          )}
          <span className="project-hero-avatar-overlay">
            {uploadingLogo ? "..." : "📷"}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleLogoFile(f);
          }}
        />
        <div className="project-hero-info">
          <div className="project-hero-name">{project.name}</div>
          <div className="project-hero-sub">
            {project.razao_social ?? "—"}
          </div>
          <div className="project-hero-tags">
            {project.legal_nature && (
              <span className="project-hero-chip">{project.legal_nature}</span>
            )}
            {project.founded_at && (
              <span className="project-hero-chip project-hero-chip--muted">
                Fundado em {project.founded_at}
              </span>
            )}
          </div>
        </div>
        <div className="project-hero-actions">
          {editing ? (
            <>
              <button
                className="btn btn-outline btn-sm"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={saving}
              >
                {I.save}
                <span>{saving ? "Salvando..." : "Salvar"}</span>
              </button>
            </>
          ) : (
            <button
              className="btn btn-outline btn-sm btn-with-icon"
              onClick={() => setEditing(true)}
            >
              {I.edit}
              <span>Editar</span>
            </button>
          )}
        </div>
      </div>

      <div className="info-grid">
        <InfoItem
          icon={I.tag}
          label="NOME"
          value={form.name}
          editing={editing}
          onChange={(v) => setForm({ ...form, name: v })}
        />
        <InfoItem
          icon={I.briefcase}
          label="RAZÃO SOCIAL"
          value={form.razao_social}
          editing={editing}
          onChange={(v) => setForm({ ...form, razao_social: v })}
        />
        <InfoItem
          icon={I.fileText}
          label="CNPJ"
          value={form.cnpj}
          editing={editing}
          onChange={(v) => setForm({ ...form, cnpj: v })}
        />
        <InfoItem
          icon={I.briefcase}
          label="NATUREZA JURÍDICA"
          value={form.legal_nature}
          editing={editing}
          onChange={(v) => setForm({ ...form, legal_nature: v })}
        />
        <InfoItem
          icon={I.mapPin}
          label="ENDEREÇO"
          value={form.address}
          editing={editing}
          onChange={(v) => setForm({ ...form, address: v })}
        />
        <InfoItem
          icon={I.map}
          label="CIDADE / UF"
          value={
            editing
              ? ""
              : form.city && form.state
                ? `${form.city} / ${form.state}`
                : form.city
          }
          editing={editing}
          onChange={(v) => {
            const parts = v.split("/").map((p) => p.trim());
            setForm({
              ...form,
              city: parts[0] ?? "",
              state: (parts[1] ?? "").toUpperCase(),
            });
          }}
          editPlaceholder="Cidade / UF"
          editValue={
            form.city && form.state ? `${form.city} / ${form.state}` : form.city
          }
        />
        <InfoItem
          icon={I.mail}
          label="CEP"
          value={form.zip_code}
          editing={editing}
          onChange={(v) => setForm({ ...form, zip_code: v })}
        />
        <div className="info-item">
          <div className="info-item-label">
            <span className="info-item-icon">{I.calendar}</span>
            <span>FUNDAÇÃO</span>
          </div>
          {editing ? (
            <div className="info-item-datepicker">
              <DatePicker
                value={form.founded_at}
                onChange={(v) => setForm({ ...form, founded_at: v })}
              />
            </div>
          ) : (
            <div className="info-item-value">{form.founded_at || "—"}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Image helpers ─────────────────────────────────────────────────────────── */

async function downscaleImage(
  file: File,
  maxDim: number,
  quality: number,
): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não disponível");
  ctx.drawImage(bmp, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function InfoItem({
  icon,
  label,
  value,
  editing,
  onChange,
  editPlaceholder,
  editValue,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  editing?: boolean;
  onChange?: (v: string) => void;
  editPlaceholder?: string;
  editValue?: string;
}) {
  return (
    <div className="info-item">
      <div className="info-item-label">
        <span className="info-item-icon">{icon}</span>
        <span>{label}</span>
      </div>
      {editing ? (
        <input
          className="info-item-input"
          value={editValue ?? value ?? ""}
          placeholder={editPlaceholder ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <div className="info-item-value">{value || "—"}</div>
      )}
    </div>
  );
}

/* ── Faixas Etárias Tab ────────────────────────────────────────────────────── */

function FaixasEtariasTab({
  ranges,
  onChange,
}: {
  ranges: AgeRange[];
  onChange: (r: AgeRange[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const emptyDraft = (): AgeRange => ({
    label: "",
    minAge: 0,
    maxAge: null,
    color: AGE_COLORS[0],
  });
  const [draft, setDraft] = useState<AgeRange>(emptyDraft());

  function saveDraft() {
    if (!draft.label.trim()) return;
    if (editingIndex !== null) {
      const next = [...ranges];
      next[editingIndex] = draft;
      onChange(next);
      setEditingIndex(null);
    } else {
      onChange([...ranges, draft]);
      setAddOpen(false);
    }
    setDraft(emptyDraft());
  }

  function startEdit(i: number) {
    setDraft({ ...ranges[i] });
    setEditingIndex(i);
    setAddOpen(false);
  }

  function removeRange(i: number) {
    onChange(ranges.filter((_, idx) => idx !== i));
    if (editingIndex === i) {
      setEditingIndex(null);
      setDraft(emptyDraft());
    }
  }

  function cancelEdit() {
    setEditingIndex(null);
    setAddOpen(false);
    setDraft(emptyDraft());
  }

  return (
    <div className="settings-card">
      <p className="settings-card-desc">
        Defina as faixas etárias do projeto. Elas são usadas para classificar
        alunos automaticamente com base na data de nascimento.
      </p>

      <div className="age-range-list-v2">
        {ranges.map((r, i) => {
          if (editingIndex === i) {
            return (
              <AgeRangeEditor
                key={i}
                title="EDITAR FAIXA ETÁRIA"
                draft={draft}
                setDraft={setDraft}
                onCancel={cancelEdit}
                onSave={saveDraft}
                saveLabel="Salvar"
              />
            );
          }
          return (
            <div key={i} className="age-range-item-v2">
              <span
                className="age-range-dot"
                style={{ backgroundColor: r.color ?? "#777" }}
              />
              <span className="age-range-name">{r.label}</span>
              <div className="age-range-spacer" />
              <span className="age-range-pill">
                {r.minAge}
                {" - "}
                {r.maxAge ?? "∞"}
                <span className="age-range-pill-unit">anos</span>
              </span>
              <div className="age-range-actions">
                <button
                  className="age-range-action"
                  onClick={() => startEdit(i)}
                  title="Editar"
                >
                  {I.edit}
                </button>
                <button
                  className="age-range-action age-range-action--danger"
                  onClick={() => removeRange(i)}
                  title="Remover"
                >
                  {I.trash}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {addOpen ? (
        <AgeRangeEditor
          title="NOVA FAIXA ETÁRIA"
          draft={draft}
          setDraft={setDraft}
          onCancel={cancelEdit}
          onSave={saveDraft}
          saveLabel="Adicionar"
        />
      ) : editingIndex === null ? (
        <button
          className="settings-add-btn"
          onClick={() => {
            setDraft(emptyDraft());
            setAddOpen(true);
          }}
        >
          {I.plus}
          <span>Adicionar faixa</span>
        </button>
      ) : null}
    </div>
  );
}

function AgeRangeEditor({
  title,
  draft,
  setDraft,
  onCancel,
  onSave,
  saveLabel,
}: {
  title: string;
  draft: AgeRange;
  setDraft: (d: AgeRange) => void;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="age-range-editor">
      <div className="age-range-editor-title">{title}</div>
      <div className="age-range-editor-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label>Nome</label>
          <input
            className="form-input"
            placeholder="Ex: Júnior"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Idade min.</label>
          <input
            className="form-input"
            type="number"
            min={0}
            value={draft.minAge}
            onChange={(e) =>
              setDraft({ ...draft, minAge: parseInt(e.target.value) || 0 })
            }
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>
            Idade máx.{" "}
            <span className="age-range-hint">(vazio = sem limite)</span>
          </label>
          <input
            className="form-input"
            type="number"
            min={0}
            placeholder="—"
            value={draft.maxAge ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                maxAge:
                  e.target.value === "" ? null : parseInt(e.target.value),
              })
            }
          />
        </div>
      </div>
      <div className="age-range-color-picker">
        {AGE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`age-range-color-swatch ${draft.color === c ? "active" : ""}`}
            style={{ backgroundColor: c }}
            onClick={() => setDraft({ ...draft, color: c })}
          />
        ))}
      </div>
      <div className="age-range-editor-actions">
        <button className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn btn-primary btn-sm" onClick={onSave}>
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

/* ── Turmas Tab ────────────────────────────────────────────────────────────── */

const MODALITY_COLORS: Record<string, string> = {
  "jiu-jitsu": "#3B82F6",
  "muay-thai": "#F97316",
  capoeira: "#4CAF50",
  mma: "#EF4444",
};

function formatIsoDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

// Local calendar day as yyyy-mm-dd. toISOString() would shift to UTC and give
// the wrong day for the whole evening in UTC-4.
function todayIso(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

function modalityColor(modalityId?: string, modalityName?: string): string {
  if (modalityId && MODALITY_COLORS[modalityId.toLowerCase()]) {
    return MODALITY_COLORS[modalityId.toLowerCase()];
  }
  const normalized = (modalityName ?? "").toLowerCase();
  if (normalized.includes("jiu")) return MODALITY_COLORS["jiu-jitsu"];
  if (normalized.includes("muay")) return MODALITY_COLORS["muay-thai"];
  if (normalized.includes("capoeira")) return MODALITY_COLORS.capoeira;
  if (normalized.includes("mma")) return MODALITY_COLORS.mma;
  return "var(--gold)";
}

const DAYS = [
  { key: "mon", label: "SEG" },
  { key: "tue", label: "TER" },
  { key: "wed", label: "QUA" },
  { key: "thu", label: "QUI" },
  { key: "fri", label: "SEX" },
  { key: "sat", label: "SÁB" },
  { key: "sun", label: "DOM" },
];

function TurmasTab({
  classes,
  loading,
  onNewClass,
  onEditClass,
  onDeleteOrDeactivate,
  onReactivateClass,
  onUpdateClass,
}: {
  classes: ClassData[];
  loading: boolean;
  onNewClass: () => void;
  onEditClass: (id: string) => void;
  onDeactivateClass: (id: string) => Promise<void>;
  onDeleteOrDeactivate: (id: string) => Promise<"deleted" | "deactivated">;
  onReactivateClass: (id: string) => Promise<void>;
  onUpdateClass: (id: string, data: Record<string, unknown>) => Promise<unknown>;
}) {
  const [modalityFilter, setModalityFilter] = useState<string>("all");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  // Only one engine mini-form open at a time (same idiom as confirmingId).
  const [engineEditingId, setEngineEditingId] = useState<string | null>(null);

  const modalityOptions = Array.from(
    new Set(classes.map((c) => c.modality_name).filter(Boolean)),
  );

  const filtered =
    modalityFilter === "all"
      ? classes
      : classes.filter((c) => c.modality_name === modalityFilter);

  const activeClasses = filtered.filter((c) => c.active !== false);
  const inactiveClasses = filtered.filter((c) => c.active === false);

  function renderCard(cls: ClassData, inactive: boolean) {
    const color = modalityColor(cls.modality_id, cls.modality_name);
    const activeDays = new Set(
      (cls.schedule_items ?? []).map((s) => s.day),
    );
    const firstItem = cls.schedule_items?.[0];
    const schedule = firstItem
      ? `${firstItem.start_time} — ${firstItem.end_time}`
      : cls.schedule;
    const isConfirming = confirmingId === cls.id;
    const isRemoving = removingId === cls.id;
    const studentCount = cls.student_count ?? 0;
    const willDeactivate = studentCount > 0;
    const isEngineEditing = engineEditingId === cls.id;

    // Badge is always rendered now — "desligado" is the state that most needs a
    // way in, since it is what blocks check-in.
    const engineOn = cls.attendanceEngineEnabled ?? false;
    const engineBroken = engineOn && !cls.attendanceStartDate;
    const engineBadgeLabel = engineBroken
      ? "MOTOR SEM DATA"
      : engineOn
        ? "MOTOR LIGADO"
        : "MOTOR DESLIGADO";
    const engineBadgeClass = engineBroken
      ? "turma-engine-badge--error"
      : engineOn
        ? "turma-engine-badge--on"
        : "turma-engine-badge--off";
    const engineBadgeTitle = engineBroken
      ? "Motor ligado sem data-base — tratado como desligado até corrigir"
      : undefined;

    if (isConfirming) {
      return (
        <div key={cls.id} className="turma-card turma-card--confirm">
          <div className="turma-card-confirm-text">
            {willDeactivate ? (
              <>
                Esta turma possui <strong>{studentCount}</strong>{" "}
                {studentCount === 1 ? "aluno matriculado" : "alunos matriculados"}.
                Ela será marcada como <strong>inativa</strong> e ocultada do app.
              </>
            ) : (
              <>
                Excluir <strong>{cls.name}</strong> permanentemente?
              </>
            )}
          </div>
          <div className="turma-card-confirm-actions">
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setConfirmingId(null)}
              disabled={isRemoving}
            >
              Cancelar
            </button>
            <button
              className="btn btn-sm iam-btn-danger"
              onClick={async () => {
                setRemovingId(cls.id);
                try {
                  await onDeleteOrDeactivate(cls.id);
                } finally {
                  setRemovingId(null);
                  setConfirmingId(null);
                }
              }}
              disabled={isRemoving}
            >
              {isRemoving
                ? "..."
                : willDeactivate
                  ? "Inativar"
                  : "Excluir"}
            </button>
          </div>
        </div>
      );
    }

    const isReactivating = reactivatingId === cls.id;
    return (
      <div
        key={cls.id}
        className={`turma-card ${inactive ? "turma-card--inactive" : ""}`}
        style={{ borderLeftColor: color }}
        onClick={() => onEditClass(cls.id)}
      >
        <div className="turma-card-header">
          <span className="turma-card-modality" style={{ color }}>
            {cls.modality_name?.toUpperCase()}
            {inactive && <span className="turma-inactive-badge">INATIVA</span>}
            {inactive ? (
              <span className={`turma-engine-badge ${engineBadgeClass}`} title={engineBadgeTitle}>
                {engineBadgeLabel}
              </span>
            ) : (
              <button
                type="button"
                className={`turma-engine-badge ${engineBadgeClass} turma-engine-badge--btn`}
                title={engineBadgeTitle ?? "Ajustar o motor de frequência"}
                aria-expanded={isEngineEditing}
                onClick={(e) => {
                  e.stopPropagation();
                  setEngineEditingId(isEngineEditing ? null : cls.id);
                }}
              >
                {engineBadgeLabel} ▾
              </button>
            )}
          </span>
          <div className="turma-card-actions">
            {inactive && (
              <button
                className="turma-card-action turma-card-action--success"
                onClick={async (e) => {
                  e.stopPropagation();
                  setReactivatingId(cls.id);
                  try {
                    await onReactivateClass(cls.id);
                  } finally {
                    setReactivatingId(null);
                  }
                }}
                disabled={isReactivating}
                title="Reativar turma"
              >
                {I.refresh}
              </button>
            )}
            <button
              className="turma-card-action"
              onClick={(e) => {
                e.stopPropagation();
                onEditClass(cls.id);
              }}
              title="Editar"
            >
              {I.edit}
            </button>
            <button
              className="turma-card-action turma-card-action--danger"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingId(cls.id);
              }}
              title={inactive ? "Excluir" : "Desativar/Excluir"}
            >
              {I.trash}
            </button>
          </div>
        </div>
        <div className="turma-card-name">{cls.name}</div>
        {isEngineEditing && !inactive && (
          <ClassEngineInlineForm
            key={cls.id}
            cls={cls}
            onSave={(data) => onUpdateClass(cls.id, data)}
            onClose={() => setEngineEditingId(null)}
          />
        )}
        <div className="turma-card-days">
          {DAYS.map((d) => (
            <span
              key={d.key}
              className={`turma-day-chip ${activeDays.has(d.key) ? "active" : ""}`}
              style={
                activeDays.has(d.key)
                  ? { backgroundColor: color, color: "#fff" }
                  : undefined
              }
            >
              {d.label}
            </span>
          ))}
        </div>
        <div className="turma-card-meta">
          {schedule && <span className="turma-meta-item">🕒 {schedule}</span>}
          {cls.location && (
            <span className="turma-meta-item">📍 {cls.location}</span>
          )}
          {cls.teacher && (
            <span className="turma-meta-item">🎓 {cls.teacher}</span>
          )}
          {cls.attendanceEngineEnabled && cls.attendanceStartDate && (
            <span className="turma-meta-item">
              ⚙️ Motor desde {formatIsoDateBR(cls.attendanceStartDate)}
            </span>
          )}
        </div>
        <div
          className="turma-card-occupancy"
          style={{ backgroundColor: color }}
        />
      </div>
    );
  }

  return (
    <div className="settings-card">
      <div className="turmas-toolbar">
        <div className="turmas-filters">
          <button
            className={`filter-chip ${modalityFilter === "all" ? "active" : ""}`}
            onClick={() => setModalityFilter("all")}
          >
            Todas
          </button>
          {modalityOptions.map((m) => (
            <button
              key={m}
              className={`filter-chip ${modalityFilter === m ? "active" : ""}`}
              onClick={() => setModalityFilter(m)}
            >
              {m}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm btn-with-icon" onClick={onNewClass}>
          {I.plus}
          <span>Nova turma</span>
        </button>
      </div>

      {loading ? (
        <div className="hub-loading-inline">
          <span className="loading-spinner" />
          <span>Carregando turmas...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="hub-empty">
          <div style={{ fontSize: "2rem" }}>🥋</div>
          <p>Nenhuma turma cadastrada.</p>
          <button className="btn btn-primary btn-sm" onClick={onNewClass}>
            Criar primeira turma
          </button>
        </div>
      ) : (
        <>
          <div className="turma-grid">
            {activeClasses.map((cls) =>
              renderCard(cls, false)
            )}
          </div>

          {inactiveClasses.length > 0 && (
            <>
              <div className="turma-inactive-separator">
                <span className="turma-inactive-separator-label">
                  Inativas · {inactiveClasses.length}
                </span>
              </div>
              <div className="turma-grid turma-grid--inactive">
                {inactiveClasses.map((cls) => renderCard(cls, true))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ── Motor de frequência inline (card da turma) ───────────────────────────── */

function ClassEngineInlineForm({
  cls,
  onSave,
  onClose,
}: {
  cls: ClassData;
  onSave: (data: Record<string, unknown>) => Promise<unknown>;
  onClose: () => void;
}) {
  const savedEnabled = cls.attendanceEngineEnabled ?? false;
  const savedDate = cls.attendanceStartDate ?? "";

  const [enabled, setEnabled] = useState(savedEnabled);
  const [startDate, setStartDate] = useState(savedDate || todayIso());
  // Turning the engine off must not persist the prefilled date, so the date is
  // only sent when it is actually relevant or the user touched it.
  const [dateTouched, setDateTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mirrors the 422 the backend raises for the same invariant.
  const validationError =
    enabled && !startDate
      ? "Informe a data-base para ativar o motor de frequência."
      : null;
  const turningOff = savedEnabled && !enabled;

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    if (enabled !== savedEnabled) payload.attendanceEngineEnabled = enabled;
    if ((enabled || dateTouched) && startDate !== savedDate) {
      payload.attendanceStartDate = startDate;
    }
    return payload;
  }

  async function save() {
    if (validationError || saving) return;
    const payload = buildPayload();
    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(payload);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Não foi possível salvar. Tente de novo.",
      );
      setSaving(false);
    }
  }

  return (
    <div
      className="turma-engine-form"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="turma-engine-form-row">
        <span className="turma-engine-form-label">Motor de frequência</span>
        <label className="donation-toggle">
          <input
            type="checkbox"
            checked={enabled}
            disabled={saving}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="donation-toggle-mark" />
        </label>
      </div>

      <div className="turma-engine-form-row">
        <span className="turma-engine-form-label">Contar desde</span>
        <input
          className="form-input turma-engine-form-date"
          type="date"
          value={startDate}
          disabled={saving}
          onChange={(e) => {
            setDateTouched(true);
            setStartDate(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
          }}
        />
      </div>

      {turningOff && (
        <div className="turma-engine-form-warning">
          Sem o motor, o check-in fica bloqueado nesta turma e as faltas param de
          ser geradas.
        </div>
      )}
      {validationError && (
        <span className="field-error">{validationError}</span>
      )}
      {error && <span className="field-error">{error}</span>}

      <div className="turma-engine-form-actions">
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={onClose}
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={save}
          disabled={saving || !!validationError}
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </div>
  );
}

/* ── Doações Tab ──────────────────────────────────────────────────────────── */

const PROJECT_ID =
  import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "spartacus-artes-marciais";

interface Modality {
  id: string;
  name: string;
  slug: string;
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function ModalidadesTab() {
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchModalities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ modalities: Modality[] }>(
        `/projects/${PROJECT_ID}/modalities`,
      );
      setModalities(data.modalities ?? []);
    } catch {
      setModalities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModalities();
  }, [fetchModalities]);

  async function addModality() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await api.post(`/projects/${PROJECT_ID}/modalities`, {
        name,
        slug: slugify(name),
      });
      setNewName("");
      await fetchModalities();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro ao adicionar.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: string) {
    const name = editName.trim();
    if (!name) {
      setEditingId(null);
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/projects/${PROJECT_ID}/modalities/${id}`, { name });
      setEditingId(null);
      await fetchModalities();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function removeModality(m: Modality) {
    if (!window.confirm(`Desativar a modalidade "${m.name}"?`)) return;
    setBusy(true);
    try {
      await api.delete(`/projects/${PROJECT_ID}/modalities/${m.id}`);
      await fetchModalities();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro ao desativar.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="hub-loading-inline">
        <span className="loading-spinner" />
        <span>Carregando modalidades...</span>
      </div>
    );
  }

  return (
    <div className="settings-card">
      <h3 className="settings-card-title">Modalidades do projeto</h3>
      <p className="settings-card-desc">
        As modalidades que o projeto oferece. Usadas em turmas e no sistema de
        graduações.
      </p>

      <div className="modality-list">
        {modalities.map((m) => (
          <div key={m.id} className="modality-row">
            {editingId === m.id ? (
              <>
                <input
                  className="modality-input"
                  value={editName}
                  autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(m.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <button
                  className="btn btn-sm btn-primary"
                  disabled={busy}
                  onClick={() => saveEdit(m.id)}
                >
                  Salvar
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setEditingId(null)}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <span className="modality-name">{m.name}</span>
                <span className="modality-slug">{m.slug}</span>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setEditingId(m.id);
                    setEditName(m.name);
                  }}
                >
                  Editar
                </button>
                <button
                  className="btn btn-sm detail-btn--danger"
                  disabled={busy}
                  onClick={() => removeModality(m)}
                >
                  Desativar
                </button>
              </>
            )}
          </div>
        ))}
        {modalities.length === 0 && (
          <p className="modality-empty">Nenhuma modalidade cadastrada.</p>
        )}
      </div>

      <div className="modality-add">
        <input
          className="modality-input"
          placeholder="Nova modalidade (ex.: Boxe)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addModality();
          }}
        />
        <button
          className="btn btn-sm btn-primary"
          disabled={busy || !newName.trim()}
          onClick={addModality}
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

/* ── Justificativas Tab ───────────────────────────────────────────────────── */

interface JustificationTypeData {
  projectId: string;
  slug: string;
  name: string;
  allowsAttachment: boolean;
  requiresAttachment: boolean;
  active: boolean;
  order: number;
}

interface JustificationTypeDraft {
  name: string;
  order: number;
  allowsAttachment: boolean;
  requiresAttachment: boolean;
  active: boolean;
}

function emptyJustificationDraft(): JustificationTypeDraft {
  return {
    name: "",
    order: 0,
    allowsAttachment: false,
    requiresAttachment: false,
    active: true,
  };
}

function JustificationTypesTab() {
  const [types, setTypes] = useState<JustificationTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<JustificationTypeDraft>(
    emptyJustificationDraft(),
  );
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ types: JustificationTypeData[] }>(
        `/projects/${PROJECT_ID}/justification-types`,
      );
      setTypes(
        (data.types ?? []).slice().sort((a, b) => a.order - b.order),
      );
    } catch {
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  function startAdd() {
    setDraft(emptyJustificationDraft());
    setFormError(null);
    setEditingSlug(null);
    setAddOpen(true);
  }

  function startEdit(t: JustificationTypeData) {
    setDraft({
      name: t.name,
      order: t.order,
      allowsAttachment: t.allowsAttachment,
      requiresAttachment: t.requiresAttachment,
      active: t.active,
    });
    setFormError(null);
    setEditingSlug(t.slug);
    setAddOpen(false);
  }

  function cancelForm() {
    setAddOpen(false);
    setEditingSlug(null);
    setFormError(null);
    setDraft(emptyJustificationDraft());
  }

  async function saveDraft() {
    const name = draft.name.trim();
    if (!name) {
      setFormError("Informe um nome.");
      return;
    }
    if (draft.requiresAttachment && !draft.allowsAttachment) {
      setFormError(
        "Para exigir anexo, é preciso também permitir anexo.",
      );
      return;
    }
    const slug = editingSlug ?? slugify(name);
    if (!editingSlug && types.some((t) => t.slug === slug)) {
      setFormError("Já existe um tipo com esse nome.");
      return;
    }
    setFormError(null);
    setBusy(true);
    try {
      await api.put(`/projects/${PROJECT_ID}/justification-types/${slug}`, {
        name,
        allowsAttachment: draft.allowsAttachment,
        requiresAttachment: draft.requiresAttachment,
        active: draft.active,
        order: draft.order,
      });
      cancelForm();
      await fetchTypes();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Erro ao salvar.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function deactivate(t: JustificationTypeData) {
    if (!window.confirm(`Desativar o tipo de justificativa "${t.name}"?`))
      return;
    setBusy(true);
    try {
      await api.delete(`/projects/${PROJECT_ID}/justification-types/${t.slug}`);
      await fetchTypes();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro ao desativar.");
    } finally {
      setBusy(false);
    }
  }

  async function reactivate(t: JustificationTypeData) {
    setBusy(true);
    try {
      await api.put(`/projects/${PROJECT_ID}/justification-types/${t.slug}`, {
        name: t.name,
        allowsAttachment: t.allowsAttachment,
        requiresAttachment: t.requiresAttachment,
        active: true,
        order: t.order,
      });
      await fetchTypes();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro ao reativar.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="hub-loading-inline">
        <span className="loading-spinner" />
        <span>Carregando tipos de justificativa...</span>
      </div>
    );
  }

  const showForm = addOpen || editingSlug !== null;

  return (
    <div className="settings-card">
      <h3 className="settings-card-title">Tipos de justificativa</h3>
      <p className="settings-card-desc">
        Motivos que alunos e responsáveis podem escolher ao justificar uma
        falta. Desative para ocultar do app sem excluir — justificativas já
        registradas mantêm o nome do tipo.
      </p>

      <div className="modality-list">
        {types.map((t) => (
          <div
            key={t.slug}
            className={`modality-row ${t.active ? "" : "donation-row--inactive"}`}
          >
            <span className="justification-order" title="Ordem de exibição">
              {t.order}
            </span>
            <span className="modality-name">{t.name}</span>
            <div className="justification-badges">
              {t.allowsAttachment && (
                <span className="status-badge status-badge--gold">
                  permite anexo
                </span>
              )}
              {t.requiresAttachment && (
                <span className="status-badge status-badge--warning">
                  exige anexo
                </span>
              )}
              <span
                className={`status-badge ${t.active ? "status-badge--success" : "status-badge--muted"}`}
              >
                {t.active ? "ativo" : "inativo"}
              </span>
            </div>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => startEdit(t)}
            >
              Editar
            </button>
            {t.active ? (
              <button
                className="btn btn-sm detail-btn--danger"
                disabled={busy}
                onClick={() => deactivate(t)}
              >
                Desativar
              </button>
            ) : (
              <button
                className="btn btn-sm btn-outline"
                disabled={busy}
                onClick={() => reactivate(t)}
              >
                Reativar
              </button>
            )}
          </div>
        ))}
        {types.length === 0 && (
          <p className="modality-empty">
            Nenhum tipo de justificativa cadastrado.
          </p>
        )}
      </div>

      {showForm ? (
        <div className="age-range-editor">
          <div className="age-range-editor-title">
            {editingSlug ? "EDITAR TIPO" : "NOVO TIPO"}
          </div>
          <div className="age-range-editor-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Nome</label>
              <input
                className="form-input"
                placeholder="Ex: Atestado médico"
                value={draft.name}
                autoFocus
                onChange={(e) =>
                  setDraft({ ...draft, name: e.target.value })
                }
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Ordem</label>
              <input
                className="form-input"
                type="number"
                min={0}
                value={draft.order}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    order: Math.max(0, parseInt(e.target.value) || 0),
                  })
                }
              />
            </div>
          </div>

          <div className="donation-row" style={{ marginTop: "0.75rem" }}>
            <label className="donation-toggle">
              <input
                type="checkbox"
                checked={draft.allowsAttachment}
                onChange={(e) => {
                  const allows = e.target.checked;
                  setDraft((d) => ({
                    ...d,
                    allowsAttachment: allows,
                    // Turning off "allows" implies "requires" no longer makes sense.
                    requiresAttachment: allows ? d.requiresAttachment : false,
                  }));
                }}
              />
              <span className="donation-toggle-mark" />
            </label>
            <span>Permite anexar comprovante</span>
          </div>
          <div className="donation-row">
            <label className="donation-toggle">
              <input
                type="checkbox"
                checked={draft.requiresAttachment}
                onChange={(e) =>
                  setDraft({ ...draft, requiresAttachment: e.target.checked })
                }
              />
              <span className="donation-toggle-mark" />
            </label>
            <span>Exige comprovante</span>
          </div>
          <div className="donation-row">
            <label className="donation-toggle">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) =>
                  setDraft({ ...draft, active: e.target.checked })
                }
              />
              <span className="donation-toggle-mark" />
            </label>
            <span>Ativo</span>
          </div>

          {formError && <p className="field-error">{formError}</p>}

          <div className="age-range-editor-actions">
            <button
              className="btn btn-outline btn-sm"
              onClick={cancelForm}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={saveDraft}
              disabled={busy}
            >
              {busy ? "Salvando..." : editingSlug ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </div>
      ) : (
        <button className="settings-add-btn" onClick={startAdd}>
          {I.plus}
          <span>Adicionar tipo de justificativa</span>
        </button>
      )}
    </div>
  );
}

interface SupportConfigData {
  donations: DonationConfigItem[];
  services: DonationConfigItem[];
  thankYouMessage: string;
}

function ApoioTab() {
  const [config, setConfig] = useState<SupportConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [thankYou, setThankYou] = useState("");
  const [kind, setKind] = useState<"donations" | "services">("donations");

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<SupportConfigData>(
        `/projects/${PROJECT_ID}/support-config`,
      );
      setConfig(data);
      setThankYou(data.thankYouMessage ?? "");
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  function updateItem(
    index: number,
    field: keyof DonationConfigItem,
    value: string | boolean,
  ) {
    if (!config) return;
    const list = [...config[kind]];
    list[index] = { ...list[index], [field]: value };
    setConfig({ ...config, [kind]: list });
  }

  function addItem() {
    if (!config) return;
    setConfig({
      ...config,
      [kind]: [
        ...config[kind],
        { code: `custom_${Date.now()}`, label: "", active: true },
      ],
    });
  }

  function removeItem(index: number) {
    if (!config) return;
    setConfig({ ...config, [kind]: config[kind].filter((_, i) => i !== index) });
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setSavedMsg(null);
    try {
      await api.patch(`/projects/${PROJECT_ID}/support-config`, {
        donations: config.donations,
        services: config.services,
        thankYouMessage: thankYou,
      });
      setSavedMsg("Configurações salvas.");
      setTimeout(() => setSavedMsg(null), 3000);
    } catch (err: unknown) {
      setSavedMsg(
        err instanceof Error ? err.message : "Erro ao salvar configurações.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="hub-loading-inline">
        <span className="loading-spinner" />
        <span>Carregando configurações de apoio...</span>
      </div>
    );
  }

  if (!config) return null;

  const items = config[kind];

  return (
    <div className="settings-card">
      <div className="apoio-seg">
        {(["donations", "services"] as const).map((k) => (
          <button
            key={k}
            className={`apoio-seg-btn ${kind === k ? "active" : ""}`}
            onClick={() => setKind(k)}
          >
            {k === "donations" ? "Doações" : "Serviços"}
          </button>
        ))}
      </div>

      <p className="settings-card-desc">
        {kind === "donations"
          ? "Itens disponíveis para doação no aplicativo."
          : "Serviços que os alunos podem oferecer como apoio."}{" "}
        Desative para ocultar sem excluir.
      </p>

      <div className="donation-list">
        {items.map((item, i) => (
          <div
            key={i}
            className={`donation-row ${item.active ? "" : "donation-row--inactive"}`}
          >
            <label className="donation-toggle">
              <input
                type="checkbox"
                checked={item.active}
                onChange={(e) => updateItem(i, "active", e.target.checked)}
              />
              <span className="donation-toggle-mark" />
            </label>
            <input
              className="donation-code"
              value={item.code}
              onChange={(e) => updateItem(i, "code", e.target.value)}
              placeholder="código"
            />
            <input
              className="donation-label"
              value={item.label}
              onChange={(e) => updateItem(i, "label", e.target.value)}
              placeholder="Descrição exibida no app"
            />
            <button
              className="donation-remove"
              onClick={() => removeItem(i)}
              title="Remover"
            >
              {I.trash}
            </button>
          </div>
        ))}
      </div>

      <button className="settings-add-btn" onClick={addItem}>
        {I.plus}
        <span>Adicionar {kind === "donations" ? "doação" : "serviço"}</span>
      </button>

      <div className="settings-section-title" style={{ marginTop: "1.5rem" }}>
        Mensagem de agradecimento
      </div>
      <p className="settings-card-desc">
        Exibida na tela de sucesso do app após o registro do apoio.
      </p>
      <textarea
        className="form-input donation-thankyou"
        rows={3}
        value={thankYou}
        onChange={(e) => setThankYou(e.target.value)}
        placeholder="Ex: Muito obrigado pelo seu apoio! Oss!"
      />

      <div className="settings-save-bar">
        {savedMsg && <span className="settings-save-msg">{savedMsg}</span>}
        <button
          className="btn btn-primary btn-sm btn-with-icon"
          onClick={handleSave}
          disabled={saving}
        >
          {I.save}
          <span>{saving ? "Salvando..." : "Salvar configurações"}</span>
        </button>
      </div>
    </div>
  );
}
