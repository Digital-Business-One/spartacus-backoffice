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
}

const SUPPORT_ROLES = new Set(["supporter", "sponsor"]);

const ROLE_LABELS: Record<string, string> = {
  supporter: "Apoiador",
  sponsor: "Patrocinador",
};

export function SupportPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<Account[]>("/accounts");
      setAccounts(result.filter((a) =>
        a.status === "approved" && a.roles.some((r) => SUPPORT_ROLES.has(r))
      ));
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const { visible, total, hasMore, loadMore, sentinelRef } = usePagination({ items: accounts });

  return (
    <>
      <div className="page-header">
        <h2>Apoio</h2>
        <p>Apoiadores e patrocinadores do projeto</p>
      </div>

      {loading ? (
        <div className="hub-loading">
          <span className="loading-spinner" style={{ width: 24, height: 24 }} />
          <span>Carregando...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">❤️</div>
          <h3>Nenhum apoiador ou patrocinador</h3>
          <p>Membros aprovados com perfil de apoiador ou patrocinador aparecerão aqui.</p>
        </div>
      ) : (
        <>
          <div className="account-list">
            {visible.map((a) => {
              const initials = a.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
              const supportRoles = a.roles.filter((r) => SUPPORT_ROLES.has(r));
              return (
                <div key={a.uid} className="account-card" onClick={() => navigate(`/contas/${a.uid}`)}>
                  <div className="account-card-header">
                    <div className="account-avatar">{initials}</div>
                    <div className="account-info">
                      <div className="account-name">{a.name}</div>
                      <div className="account-email">{a.email}</div>
                      <div className="account-meta">
                        {supportRoles.map((r) => (
                          <span key={r} className="account-role-chip">
                            {ROLE_LABELS[r] ?? r}
                          </span>
                        ))}
                      </div>
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
