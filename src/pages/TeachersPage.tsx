import { useLocation, useNavigate } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { AccountListCard, type AccountListItem } from "../components/account/AccountListCard";
import { buildDetailHref } from "../lib/buildDetailHref";
import { useServerPagination } from "../hooks/useServerPagination";
import { useUrlNumber, useUrlState } from "../hooks/useUrlState";

const PAGE_SIZE = 12;

export function TeachersPage() {
  const [search, setSearch] = useUrlState("q", "");
  const [page, setPage] = useUrlNumber("page", 1);
  const navigate = useNavigate();
  const location = useLocation();

  const { data, isLoading } = useServerPagination<AccountListItem>({
    endpoint: "/accounts",
    params: {
      status: "approved",
      role: "teacher",
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
        <h2>Professores</h2>
        <p>Professores ativos do projeto</p>
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
          <h3>Nenhum professor</h3>
          <p>Membros aprovados com perfil de professor aparecerão aqui.</p>
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
              itemLabel="professor"
              itemLabelPlural="professores"
              onChange={setPage}
            />
          )}
        </>
      )}
    </>
  );
}
