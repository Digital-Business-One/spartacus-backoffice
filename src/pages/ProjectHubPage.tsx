import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../hooks/useProject";
import { useClasses, type ClassData } from "../hooks/useClasses";
import { HubSection } from "../components/HubSection";

export function ProjectHubPage() {
  const { project, loading: projectLoading, updateProject } = useProject();
  const { classes, loading: classesLoading, deactivateClass } = useClasses();
  const navigate = useNavigate();

  if (projectLoading) {
    return (
      <div className="hub-loading">
        <span className="loading-spinner" style={{ width: 24, height: 24 }} />
        <span>Carregando projeto...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="hub-loading">
        <p>Projeto não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="hub-page">
      <div className="hub-header">
        {project.logo_url ? (
          <img src={project.logo_url} alt={project.name} className="hub-logo-img" />
        ) : (
          <div className="hub-logo-placeholder">{project.name[0]}</div>
        )}
        <h1 className="hub-title">{project.name}</h1>
        {project.city && (
          <p className="hub-subtitle">{project.city}{project.state ? `, ${project.state}` : ""}</p>
        )}
      </div>

      <div className="hub-sections">
        <ProjectInfoSection project={project} onUpdate={updateProject} />

        <HubSection
          icon="🥋"
          title="Turmas"
          subtitle={classesLoading ? "Carregando..." : `${classes.length} turma${classes.length !== 1 ? "s" : ""} ativa${classes.length !== 1 ? "s" : ""}`}
          action={{ label: "+ Nova turma", onClick: () => navigate("/turmas/nova") }}
        >
          {classesLoading ? (
            <div className="hub-loading-inline">
              <span className="loading-spinner" />
              <span>Carregando turmas...</span>
            </div>
          ) : classes.length === 0 ? (
            <div className="hub-empty">
              <div style={{ fontSize: "2rem" }}>🥋</div>
              <p>Nenhuma turma cadastrada ainda.</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate("/turmas/nova")}>
                Criar primeira turma
              </button>
            </div>
          ) : (
            <div className="class-list">
              {classes.map((cls) => (
                <ClassHubCard
                  key={cls.id}
                  cls={cls}
                  onEdit={() => navigate(`/turmas/${encodeURIComponent(cls.id)}/editar`)}
                  onDeactivate={() => {
                    if (confirm(`Desativar a turma "${cls.name}"?`)) {
                      deactivateClass(cls.id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </HubSection>

        <HubSection
          icon="📋"
          title="Contas"
          subtitle="Contas pendentes de aprovação"
          action={{ label: "Revisar", onClick: () => navigate("/contas") }}
        >
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Acesse a área de contas para revisar cadastros pendentes de aprovação.
          </p>
        </HubSection>

        <HubSection icon="📅" title="Calendário" subtitle="Em breve" disabled>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Agenda de aulas e eventos estará disponível em breve.
          </p>
        </HubSection>
      </div>
    </div>
  );
}

/* ── Project Info Section ──────────────────────────────────────────────────── */

function ProjectInfoSection({
  project,
  onUpdate,
}: {
  project: NonNullable<ReturnType<typeof useProject>["project"]>;
  onUpdate: (data: Record<string, unknown>) => Promise<unknown>;
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
      <HubSection icon="🏛️" title="Dados do Projeto">
        <div className="wizard-form">
          <div className="form-group">
            <label>Nome do projeto</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Razão Social</label>
            <input className="form-input" value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
          </div>
          <div className="form-group">
            <label>CNPJ</label>
            <input className="form-input" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          </div>
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
          <div className="wizard-actions">
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      </HubSection>
    );
  }

  return (
    <HubSection
      icon="🏛️"
      title="Dados do Projeto"
      action={{ label: "Editar", onClick: () => setEditing(true) }}
    >
      <div className="review-section-card">
        <InfoRow label="Nome" value={project.name} />
        <InfoRow label="Razão Social" value={project.razao_social} />
        <InfoRow label="CNPJ" value={project.cnpj} />
        <InfoRow label="Endereço" value={project.address} />
        <InfoRow label="Cidade/UF" value={project.city && project.state ? `${project.city}/${project.state}` : project.city} />
        <InfoRow label="CEP" value={project.zip_code} />
        {project.founded_at && <InfoRow label="Fundação" value={project.founded_at} />}
      </div>
    </HubSection>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="review-row">
      <span className="review-row-label">{label}</span>
      <span className="review-row-value">{value || "—"}</span>
    </div>
  );
}

/* ── Class Hub Card ────────────────────────────────────────────────────────── */

function ClassHubCard({
  cls,
  onEdit,
  onDeactivate,
}: {
  cls: ClassData;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  return (
    <div className="class-card">
      <div className="class-card-body">
        <div className="class-card-name">{cls.name}</div>
        <div className="class-card-info">{cls.modality} · {cls.schedule}</div>
        {cls.teacher && <div className="class-card-teacher">Prof. {cls.teacher}</div>}
        {cls.age_range && (
          <div className="class-card-teacher">
            {cls.age_range.min}–{cls.age_range.max ?? "∞"} anos
          </div>
        )}
      </div>
      <div className="class-card-actions">
        <button className="class-action-btn" onClick={onEdit} title="Editar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button className="class-action-btn class-action-btn--danger" onClick={onDeactivate} title="Desativar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
