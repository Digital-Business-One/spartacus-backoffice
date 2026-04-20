import { useLocation, useNavigate } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { AccountListCard, type AccountListItem } from "../components/account/AccountListCard";
import { buildDetailHref } from "../lib/buildDetailHref";
import { useServerPagination } from "../hooks/useServerPagination";
import { useUrlNumber, useUrlState } from "../hooks/useUrlState";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "rejected,expelled,archived", label: "Todos" },
  { value: "rejected", label: "Rejeitados" },
  { value: "expelled", label: "Suspensos" },
  { value: "archived", label: "Arquivados" },
];

const PAGE_SIZE = 12;

export function BlockedAccountsPage() {
  const [statusFilter, setStatusFilter] = useUrlState(
    "status",
    "rejected,expelled,archived",
  );
  const [search, setSearch] = useUrlState("q", "");
  const [page, setPage] = useUrlNumber("page", 1);
  const navigate = useNavigate();
  const location = useLocation();

  const { data, isLoading } = useServerPagination<AccountListItem>({
    endpoint: "/accounts",
    params: {
      status: statusFilter,
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
        <h2>Lixeira</h2>
        <p>Contas bloqueadas, suspensas ou arquivadas</p>
      </div>

      <div className="controls-panel">
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-label">Status:</span>
            {STATUS_FILTERS.map((opt) => (
              <button
                key={opt.value}
                className={`filter-chip ${statusFilter === opt.value ? "active" : ""}`}
                onClick={() => setStatusFilter(opt.value)}
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
          <div className="empty-state-icon">🔒</div>
          <h3>Nenhuma conta bloqueada</h3>
          <p>Contas rejeitadas, suspensas ou arquivadas aparecerão aqui.</p>
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
