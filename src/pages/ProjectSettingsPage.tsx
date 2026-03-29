import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProject, type ProjectData } from "../hooks/useProject";
import { useClasses, type ClassData } from "../hooks/useClasses";

type SettingsTab = "cadastro" | "faixas" | "turmas";

const TABS: { id: SettingsTab; label: string; icon: string }[] = [
  { id: "cadastro", label: "Cadastro", icon: "🏛️" },
  { id: "faixas", label: "Faixas Etárias", icon: "👶" },
  { id: "turmas", label: "Turmas", icon: "🥋" },
];

interface AgeRange {
  label: string;
  minAge: number;
  maxAge: number | null; // null = sem limite superior
}

const DEFAULT_AGE_RANGES: AgeRange[] = [
  { label: "Kids", minAge: 0, maxAge: 10 },
  { label: "Infanto Juvenil", minAge: 11, maxAge: 17 },
  { label: "Adulto", minAge: 18, maxAge: null },
];

export function ProjectSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("cadastro");
  const { project, loading: projectLoading, updateProject } = useProject();
  const { classes, loading: classesLoading, deactivateClass } = useClasses();
  const [ageRanges, setAgeRanges] = useState<AgeRange[]>(DEFAULT_AGE_RANGES);
  const navigate = useNavigate();

  function getTabStatus(tab: SettingsTab): "complete" | "incomplete" | "default" {
    if (tab === "cadastro" && project) {
      return project.name && project.cnpj ? "complete" : "incomplete";
    }
    if (tab === "faixas") {
      return ageRanges.length > 0 ? "complete" : "incomplete";
    }
    if (tab === "turmas") {
      return classes.length > 0 ? "complete" : "incomplete";
    }
    return "default";
  }

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
        <h2>Configurações</h2>
        <p>Configurações do projeto</p>
      </div>

      <div className="settings-tabs">
        {TABS.map((tab) => {
          const status = getTabStatus(tab.id);
          return (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? "active" : ""} ${status === "complete" ? "settings-tab--complete" : ""} ${status === "incomplete" ? "settings-tab--incomplete" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
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
            onNewClass={() => navigate("/configuracoes/turmas/nova")}
            onEditClass={(id) => navigate(`/configuracoes/turmas/${encodeURIComponent(id)}/editar`)}
            onDeactivateClass={deactivateClass}
          />
        )}
      </div>
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

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="settings-panel">
        <h3 className="settings-panel-title">Identificação</h3>
        <div className="wizard-form">
          <div className="form-group">
            <label>Nome do projeto</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="wizard-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Razão Social</label>
              <input className="form-input" value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>CNPJ</label>
              <input className="form-input" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            </div>
          </div>
        </div>

        <h3 className="settings-panel-title" style={{ marginTop: "1.5rem" }}>Endereço</h3>
        <div className="wizard-form">
          <div className="form-group">
            <label>Endereço</label>
            <input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="wizard-row">
            <div className="form-group" style={{ flex: 3 }}>
              <label>Cidade</label>
              <input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>UF</label>
              <input className="form-input" maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>CEP</label>
              <input className="form-input" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} />
            </div>
          </div>
        </div>

        <h3 className="settings-panel-title" style={{ marginTop: "1.5rem" }}>Outros</h3>
        <div className="wizard-form">
          <div className="wizard-row">
            <div className="form-group">
              <label>Natureza Jurídica</label>
              <input className="form-input" value={form.legal_nature} onChange={(e) => setForm({ ...form, legal_nature: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Data de Fundação</label>
              <input className="form-input" value={form.founded_at} onChange={(e) => setForm({ ...form, founded_at: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="wizard-actions" style={{ marginTop: "1.5rem" }}>
          <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 className="settings-panel-title" style={{ margin: 0 }}>Dados do Projeto</h3>
        <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Editar</button>
      </div>
      <div className="review-section-card">
        <Row label="Nome" value={project.name} />
        <Row label="Razão Social" value={project.razao_social} />
        <Row label="CNPJ" value={project.cnpj} />
        <Row label="Endereço" value={project.address} />
        <Row label="Cidade/UF" value={project.city && project.state ? `${project.city}/${project.state}` : project.city} />
        <Row label="CEP" value={project.zip_code} />
        <Row label="Natureza Jurídica" value={project.legal_nature} />
        <Row label="Fundação" value={project.founded_at} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="review-row">
      <span className="review-row-label">{label}</span>
      <span className="review-row-value">{value || "—"}</span>
    </div>
  );
}

/* ── Turmas Tab ────────────────────────────────────────────────────────────── */

function TurmasTab({
  classes,
  loading,
  onNewClass,
  onEditClass,
  onDeactivateClass,
}: {
  classes: ClassData[];
  loading: boolean;
  onNewClass: () => void;
  onEditClass: (id: string) => void;
  onDeactivateClass: (id: string) => Promise<void>;
}) {
  return (
    <div className="settings-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 className="settings-panel-title" style={{ margin: 0 }}>Turmas</h3>
        <button className="btn btn-primary btn-sm" onClick={onNewClass}>+ Nova turma</button>
      </div>

      {loading ? (
        <div className="hub-loading-inline">
          <span className="loading-spinner" />
          <span>Carregando turmas...</span>
        </div>
      ) : classes.length === 0 ? (
        <div className="hub-empty">
          <div style={{ fontSize: "2rem" }}>🥋</div>
          <p>Nenhuma turma cadastrada.</p>
          <button className="btn btn-primary btn-sm" onClick={onNewClass}>Criar primeira turma</button>
        </div>
      ) : (
        <div className="class-list">
          {classes.map((cls) => (
            <div key={cls.id} className="class-card">
              <div className="class-card-body">
                <div className="class-card-name">{cls.name}</div>
                <div className="class-card-info">{cls.modality} · {cls.schedule}</div>
                {cls.teacher && <div className="class-card-teacher">Prof. {cls.teacher}</div>}
              </div>
              <div className="class-card-actions" style={{ opacity: 1 }}>
                <button className="class-action-btn" onClick={() => onEditClass(cls.id)} title="Editar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  className="class-action-btn class-action-btn--danger"
                  onClick={() => { if (confirm(`Desativar "${cls.name}"?`)) onDeactivateClass(cls.id); }}
                  title="Desativar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
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
  function updateRange(index: number, field: keyof AgeRange, value: string) {
    const updated = [...ranges];
    if (field === "label") {
      updated[index] = { ...updated[index], label: value };
    } else if (field === "minAge") {
      updated[index] = { ...updated[index], minAge: parseInt(value) || 0 };
    } else if (field === "maxAge") {
      updated[index] = { ...updated[index], maxAge: value === "" ? null : parseInt(value) || 0 };
    }
    onChange(updated);
  }

  function addRange() {
    const last = ranges[ranges.length - 1];
    const newMin = last ? (last.maxAge ?? last.minAge) + 1 : 0;
    onChange([...ranges, { label: "", minAge: newMin, maxAge: null }]);
  }

  function removeRange(index: number) {
    onChange(ranges.filter((_, i) => i !== index));
  }

  return (
    <div className="settings-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 className="settings-panel-title" style={{ margin: 0 }}>Faixas Etárias</h3>
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1rem", lineHeight: 1.5 }}>
        Defina as faixas etárias do projeto. Essas faixas serão usadas para classificar alunos automaticamente com base na data de nascimento.
      </p>

      <div className="age-range-list">
        {ranges.map((range, i) => (
          <div key={i} className="age-range-row">
            <div className="form-group" style={{ flex: 2 }}>
              {i === 0 && <label>Nome da faixa</label>}
              <input
                className="form-input"
                placeholder="Ex: Kids"
                value={range.label}
                onChange={(e) => updateRange(i, "label", e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              {i === 0 && <label>Idade mín.</label>}
              <input
                className="form-input"
                type="number"
                min={0}
                value={range.minAge}
                onChange={(e) => updateRange(i, "minAge", e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              {i === 0 && <label>Idade máx.</label>}
              <input
                className="form-input"
                type="number"
                min={0}
                placeholder="∞"
                value={range.maxAge ?? ""}
                onChange={(e) => updateRange(i, "maxAge", e.target.value)}
              />
            </div>
            <button
              className="age-range-remove"
              onClick={() => removeRange(i)}
              title="Remover"
              style={i === 0 ? { marginTop: "1.4rem" } : undefined}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button className="add-more-btn" onClick={addRange} style={{ marginTop: "0.75rem" }}>
        <span>+</span> Adicionar faixa
      </button>

      <div className="notice" style={{ marginTop: "1rem" }}>
        <span>ℹ️</span>
        <span>Deixe "Idade máx." vazio para faixas sem limite superior (ex: Adulto 18+).</span>
      </div>
    </div>
  );
}
