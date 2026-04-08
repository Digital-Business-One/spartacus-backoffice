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
  birth_date?: string;
  gender?: string;
  is_dependent: boolean;
  guardian_uid?: string;
}

const PAGE_SIZE = 12;

function calcAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const parts = birthDate.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  const dob = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const md = now.getMonth() - dob.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export function StudentsPage() {
  const [search, setSearch] = useUrlState("q", "");
  const [page, setPage] = useUrlNumber("page", 1);
  const navigate = useNavigate();
  const location = useLocation();

  const { data, isLoading } = useServerPagination<Account>({
    endpoint: "/accounts",
    params: {
      status: "approved",
      role: "student",
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
        <h2>Alunos</h2>
        <p>Alunos ativos do projeto</p>
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
          <span>Carregando alunos...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🥋</div>
          <h3>Nenhum aluno ativo</h3>
          <p>
            Quando contas forem aprovadas com perfil de aluno,
            elas aparecerão aqui.
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
              const age = calcAge(a.birth_date);
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
                        <span className="account-role-chip">Aluno</span>
                        {a.is_dependent && (
                          <span className="account-role-chip account-role-chip--warning">
                            Dependente
                          </span>
                        )}
                        {age !== null && (
                          <span className="account-role-chip account-role-chip--success">
                            {age} anos
                          </span>
                        )}
                        {a.gender && (
                          <span className="account-role-chip">
                            {a.gender === "male" ? "Masculino" : "Feminino"}
                          </span>
                        )}
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
              itemLabel="aluno"
              itemLabelPlural="alunos"
              onChange={setPage}
            />
          )}
        </>
      )}
    </>
  );
}
