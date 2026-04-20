import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { AccountListCard, type AccountListItem } from "../components/account/AccountListCard";
import { buildDetailHref } from "../lib/buildDetailHref";
import { useServerPagination } from "../hooks/useServerPagination";
import { useUrlNumber, useUrlState } from "../hooks/useUrlState";

const PAGE_SIZE = 12;

type Scope = "students" | "guardians";

const SCOPE_OPTIONS: { value: Scope; label: string }[] = [
  { value: "students", label: "Alunos" },
  { value: "guardians", label: "Responsáveis" },
];

export function StudentsPage() {
  const [scope, setScope] = useUrlState("scope", "students");
  const [search, setSearch] = useUrlState("q", "");
  const [page, setPage] = useUrlNumber("page", 1);
  const navigate = useNavigate();
  const location = useLocation();

  const currentScope = (scope as Scope) || "students";

  const { data, isLoading } = useServerPagination<AccountListItem>({
    endpoint: "/accounts",
    params: {
      status: "approved",
      role: currentScope === "students" ? "student" : "guardian",
      search: search || undefined,
      sort: "name",
    },
    page,
    pageSize: PAGE_SIZE,
  });

  // Keep hierarchical rendering (GuardianCard w/ nested dependents).
  // When viewing "guardians", each card already groups their dependents;
  // when viewing "students", orphan students are rendered individually.
  const items = useMemo(() => data?.items ?? [], [data]);

  const emptyCopy =
    currentScope === "students"
      ? {
          title: "Nenhum aluno ativo",
          msg: "Quando contas forem aprovadas com perfil de aluno, elas aparecerão aqui.",
        }
      : {
          title: "Nenhum responsável ativo",
          msg: "Responsáveis com dependentes aprovados aparecerão aqui.",
        };

  return (
    <>
      <div className="page-header">
        <h2>Alunos</h2>
        <p>Alunos aprovados e seus responsáveis</p>
      </div>

      <div className="controls-panel">
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-label">Ver:</span>
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`filter-chip ${currentScope === opt.value ? "active" : ""}`}
                onClick={() => setScope(opt.value)}
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
          placeholder="Buscar por nome de aluno ou responsável..."
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
          <h3>{emptyCopy.title}</h3>
          <p>{emptyCopy.msg}</p>
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
              itemLabel={currentScope === "students" ? "aluno" : "responsável"}
              itemLabelPlural={
                currentScope === "students" ? "alunos" : "responsáveis"
              }
              onChange={setPage}
            />
          )}
        </>
      )}
    </>
  );
}
