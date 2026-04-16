import { useLocation, useNavigate } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { AccountListCard, type AccountListItem } from "../components/account/AccountListCard";
import { buildDetailHref } from "../lib/buildDetailHref";
import { useServerPagination } from "../hooks/useServerPagination";
import { useUrlNumber, useUrlState } from "../hooks/useUrlState";

const ROLE_FILTERS: { value: string; label: string }[] = [
  { value: "teacher", label: "Professores" },
  { value: "instructor", label: "Instrutores" },
  { value: "assistant", label: "Assistentes" },
  { value: "owner", label: "Controladores" },
];

const PAGE_SIZE = 12;

export function StaffPage() {
  const [roleFilter, setRoleFilter] = useUrlState("role", "teacher");
  const [search, setSearch] = useUrlState("q", "");
  const [page, setPage] = useUrlNumber("page", 1);
  const navigate = useNavigate();
  const location = useLocation();

  const { data, isLoading } = useServerPagination<AccountListItem>({
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
        <h2>Staff</h2>
        <p>Equipe interna do projeto — professores, instrutores e administração</p>
      </div>

      <div className="controls-panel">
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-label">Função:</span>
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
          <div className="empty-state-icon">🥋</div>
          <h3>Nenhum membro encontrado</h3>
          <p>Membros aprovados com esta função aparecerão aqui.</p>
        </div>
      ) : (
        <>
          <div className="account-list">
            {items.map((a, i) => (
              <AccountListCard
                key={a.uid}
                account={a}
                index={i}
                onDetail={(uid) => navigate(buildDetailHref(uid, location))}
              />
            ))}
          </div>
          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              itemLabel="membro"
              itemLabelPlural="membros"
              onChange={setPage}
            />
          )}
        </>
      )}
    </>
  );
}
