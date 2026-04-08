import { useLocation, useNavigate } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { buildDetailHref } from "../lib/buildDetailHref";
import { useServerPagination } from "../hooks/useServerPagination";
import { useUrlNumber, useUrlState } from "../hooks/useUrlState";

interface Account {
  uid: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
}

const ROLE_LABELS: Record<string, string> = {
  supporter: "Apoiador",
  sponsor: "Patrocinador",
};

const ROLE_FILTERS: { value: string; label: string }[] = [
  { value: "supporter", label: "Apoiadores" },
  { value: "sponsor", label: "Patrocinadores" },
];

const PAGE_SIZE = 12;

export function SupportPage() {
  const [roleFilter, setRoleFilter] = useUrlState("role", "supporter");
  const [search, setSearch] = useUrlState("q", "");
  const [page, setPage] = useUrlNumber("page", 1);
  const navigate = useNavigate();
  const location = useLocation();

  const { data, isLoading } = useServerPagination<Account>({
    endpoint: "/accounts",
    params: {
      status: "approved",
      role: roleFilter,
      search: search || undefined,
      sort: "name",
    },
    page,
    pageSize: PAGE_SIZE,
  });

  const items = data?.items ?? [];

  return (
    <>
      <div className="page-header">
        <h2>Apoio</h2>
        <p>Apoiadores e patrocinadores do projeto</p>
      </div>

      <div className="controls-panel">
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-label">Tipo:</span>
            {ROLE_FILTERS.map((opt) => (
              <button
                key={opt.value}
                className={`filter-chip ${roleFilter === opt.value ? "active" : ""}`}
                onClick={() => setRoleFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="hub-loading">
          <span className="loading-spinner" style={{ width: 24, height: 24 }} />
          <span>Carregando...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">❤️</div>
          <h3>Nenhum apoiador ou patrocinador</h3>
          <p>
            Membros aprovados com perfil de apoiador ou patrocinador
            aparecerão aqui.
          </p>
        </div>
      ) : (
        <>
          <div className="account-list">
            {items.map((a) => {
              const initials = a.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const supportRoles = a.roles.filter(
                (r) => r === "supporter" || r === "sponsor",
              );
              return (
                <div
                  key={a.uid}
                  className="account-card"
                  onClick={() => navigate(buildDetailHref(a.uid, location))}
                >
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
          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              itemLabel="conta"
              itemLabelPlural="contas"
              onChange={setPage}
            />
          )}
        </>
      )}
    </>
  );
}
