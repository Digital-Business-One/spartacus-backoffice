import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../hooks/useProject";
import { useClasses } from "../hooks/useClasses";
import { api } from "../lib/api";

interface Account {
  uid: string;
  status: string;
  roles: string[];
}

export function ProjectHubPage() {
  const { project, loading: projectLoading } = useProject();
  const { classes, loading: classesLoading } = useClasses();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Account[]>("/accounts")
      .then(setAccounts)
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false));
  }, []);

  if (projectLoading) {
    return (
      <div className="hub-loading">
        <span className="loading-spinner" style={{ width: 24, height: 24 }} />
        <span>Carregando...</span>
      </div>
    );
  }

  if (!project) {
    return <div className="hub-loading"><p>Projeto não encontrado.</p></div>;
  }

  const pendingCount = accounts.filter((a) =>
    ["pending_approval", "waiting_email_confirmation"].includes(a.status)
  ).length;
  const activeCount = accounts.filter((a) => a.status === "approved").length;
  const anamneseCount = accounts.filter((a) =>
    ["waiting_medical_history", "pending_medical_history_approval"].includes(a.status)
  ).length;

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

      <div className="dashboard-cards">
        <DashboardCard
          icon="📋"
          label="Pendentes"
          value={accountsLoading ? "..." : String(pendingCount)}
          onClick={() => navigate("/contas")}
          accent={pendingCount > 0}
        />
        <DashboardCard
          icon="📝"
          label="Anamnese"
          value={accountsLoading ? "..." : String(anamneseCount)}
          onClick={() => navigate("/contas")}
          accent={anamneseCount > 0}
        />
        <DashboardCard
          icon="🥋"
          label="Alunos ativos"
          value={accountsLoading ? "..." : String(activeCount)}
          onClick={() => navigate("/alunos")}
        />
        <DashboardCard
          icon="🏋️"
          label="Turmas"
          value={classesLoading ? "..." : String(classes.length)}
          onClick={() => navigate("/configuracoes")}
        />
      </div>
    </div>
  );
}

function DashboardCard({
  icon,
  label,
  value,
  onClick,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button className={`dashboard-card ${accent ? "dashboard-card--accent" : ""}`} onClick={onClick}>
      <div className="dashboard-card-icon">{icon}</div>
      <div className="dashboard-card-value">{value}</div>
      <div className="dashboard-card-label">{label}</div>
    </button>
  );
}
