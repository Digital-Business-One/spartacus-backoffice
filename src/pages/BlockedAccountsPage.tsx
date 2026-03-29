import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { usePagination } from "../hooks/usePagination";

interface Account {
  uid: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
  available_actions: { action: string; label: string; target_status: string }[];
}

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  rejected: { label: "Rejeitado", variant: "error" },
  expelled: { label: "Expulso", variant: "error" },
  archived: { label: "Arquivado", variant: "muted" },
};

const ROLE_LABELS: Record<string, string> = {
  student: "Aluno",
  guardian: "Responsável",
  teacher: "Professor",
  instructor: "Instrutor",
  owner: "Controlador",
  assistant: "Assistente",
  supporter: "Apoiador",
  sponsor: "Patrocinador",
};

const BLOCKED_STATUSES = new Set(["rejected", "expelled", "archived"]);

export function BlockedAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<Account[]>("/accounts");
      setAccounts(result.filter((a) => BLOCKED_STATUSES.has(a.status)));
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const filtered = statusFilter
    ? accounts.filter((a) => a.status === statusFilter)
    : accounts;

  const { visible, total, hasMore, loadMore, sentinelRef } = usePagination({ items: filtered });

  return (
    <>
      <div className="page-header">
        <h2>Bloqueados</h2>
        <p>Contas rejeitadas, expulsas ou arquivadas</p>
      </div>

      <div className="controls-panel">
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-label">Status:</span>
            <button className={`filter-chip ${statusFilter === null ? "active" : ""}`} onClick={() => setStatusFilter(null)}>Todos</button>
            <button className={`filter-chip ${statusFilter === "rejected" ? "active" : ""}`} onClick={() => setStatusFilter(statusFilter === "rejected" ? null : "rejected")}>Rejeitados</button>
            <button className={`filter-chip ${statusFilter === "expelled" ? "active" : ""}`} onClick={() => setStatusFilter(statusFilter === "expelled" ? null : "expelled")}>Expulsos</button>
            <button className={`filter-chip ${statusFilter === "archived" ? "active" : ""}`} onClick={() => setStatusFilter(statusFilter === "archived" ? null : "archived")}>Arquivados</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="hub-loading">
          <span className="loading-spinner" style={{ width: 24, height: 24 }} />
          <span>Carregando...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <h3>Nenhuma conta bloqueada</h3>
          <p>Contas rejeitadas, expulsas ou arquivadas aparecerão aqui.</p>
        </div>
      ) : (
        <>
          <div className="account-list">
            {visible.map((a) => {
              const initials = a.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
              const statusInfo = STATUS_LABELS[a.status] ?? { label: a.status, variant: "muted" };
              return (
                <div key={a.uid} className="account-card" data-status={a.status} onClick={() => navigate(`/contas/${a.uid}`)}>
                  <div className="account-card-header">
                    <div className="account-avatar">{initials}</div>
                    <div className="account-info">
                      <div className="account-name">{a.name}</div>
                      <div className="account-email">{a.email}</div>
                      <div className="account-meta">
                        {a.roles.map((r) => (
                          <span key={r} className="account-role-chip">{ROLE_LABELS[r] ?? r}</span>
                        ))}
                      </div>
                    </div>
                    <div className="account-status">
                      <span className={`status-badge status-badge--${statusInfo.variant}`}>{statusInfo.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pagination-footer">
            <span className="pagination-count">Exibindo {visible.length} de {total}</span>
            {hasMore && <button className="btn btn-outline btn-sm" onClick={loadMore}>Ver mais ↓</button>}
            <div ref={sentinelRef} />
          </div>
        </>
      )}
    </>
  );
}
