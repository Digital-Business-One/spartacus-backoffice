import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { Pagination } from "../components/Pagination";
import { AccountListCard, type AccountListItem } from "../components/account/AccountListCard";
import { buildDetailHref } from "../lib/buildDetailHref";
import { useServerPagination } from "../hooks/useServerPagination";
import { useUrlNumber, useUrlState } from "../hooks/useUrlState";

// ── Constants ───────────────────────────────────────────────────────────────

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

type FilterTab = "pending" | "anamnese";

const TAB_STATUS_CSV: Record<FilterTab, string> = {
  pending: "pending_approval,waiting_registration_review,revised_registration",
  anamnese: "waiting_medical_history,pending_medical_history_approval",
};

const PENDING_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: TAB_STATUS_CSV.pending, label: "Todos" },
  { value: "pending_approval", label: "Pendente" },
  { value: "waiting_registration_review,revised_registration", label: "Em revisão" },
];

const DEFAULT_VISIBLE_ROLES = ["student", "guardian"];
const ALL_ROLE_ENTRIES = Object.entries(ROLE_LABELS);

const PAGE_SIZE = 12;

// ── Page ────────────────────────────────────────────────────────────────────

export function AccountsPage() {
  const [tab] = useUrlState("tab", "pending");
  const [statusFilter, setStatusFilter] = useUrlState(
    "status",
    TAB_STATUS_CSV.pending,
  );
  const [search, setSearch] = useUrlState("q", "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [roleFilters, setRoleFilters] = useUrlState("role", "");
  const [moreOpen, setMoreOpen] = useState(false);
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [sort, setSort] = useUrlState("sort", "name");
  const [page, setPage] = useUrlNumber("page", 1);
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = (tab as FilterTab) || "pending";
  const tabStatuses = TAB_STATUS_CSV[currentTab];
  const effectiveStatus = statusFilter || tabStatuses;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const roleSet = useMemo(
    () => new Set(roleFilters ? roleFilters.split(",").filter(Boolean) : []),
    [roleFilters],
  );

  const primaryRole = roleSet.size > 0 ? roleSet.values().next().value : undefined;

  const { data, isLoading, refetch } = useServerPagination<AccountListItem>({
    endpoint: "/accounts",
    params: {
      status: effectiveStatus,
      role: primaryRole,
      search: debouncedSearch || undefined,
      sort,
    },
    page,
    pageSize: PAGE_SIZE,
  });

  const items = useMemo(() => {
    const raw = data?.items ?? [];
    if (roleSet.size <= 1) return raw;
    return raw.filter((a) => a.roles.some((r) => roleSet.has(r)));
  }, [data, roleSet]);

  function switchTab(t: FilterTab) {
    setSearchParams(
      () => {
        const next = new URLSearchParams();
        if (t !== "pending") next.set("tab", t);
        next.set("status", TAB_STATUS_CSV[t]);
        return next;
      },
      { replace: true },
    );
  }

  function toggleRole(code: string, e: React.MouseEvent) {
    const next = new Set(roleSet);
    if (e.ctrlKey || e.metaKey) {
      if (next.has(code)) next.delete(code);
      else next.add(code);
    } else {
      if (next.size === 1 && next.has(code)) {
        next.clear();
      } else {
        next.clear();
        next.add(code);
      }
    }
    setRoleFilters([...next].join(","));
  }

  function toggleSort(field: "name" | "age") {
    const ascValue = field;
    const descValue = `${field}_desc`;
    if (sort === ascValue) setSort(descValue);
    else setSort(ascValue);
  }

  const sortField = sort.replace("_desc", "");
  const sortDir = sort.endsWith("_desc") ? "desc" : "asc";

  async function handleTransition(uid: string, action: string) {
    setTransitioning(uid);
    try {
      await api.post(`/accounts/${uid}/transitions`, { action });
      await refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao executar ação");
    } finally {
      setTransitioning(null);
    }
  }

  function goToDetail(uid: string) {
    navigate(buildDetailHref(uid, location));
  }

  const defaultRoles = ALL_ROLE_ENTRIES.filter(([code]) =>
    DEFAULT_VISIBLE_ROLES.includes(code),
  );
  const extraRoles = ALL_ROLE_ENTRIES.filter(
    ([code]) => !DEFAULT_VISIBLE_ROLES.includes(code),
  );
  const hiddenActiveCount = [...roleSet].filter(
    (r) => !DEFAULT_VISIBLE_ROLES.includes(r),
  ).length;
  const hideRoleFilter = currentTab === "anamnese";

  return (
    <>
      <div className="page-header">
        <h2>Onboarding</h2>
        <p>Contas em processo de validação, anamnese e aprovação</p>
      </div>

      <div className="tab-bar">
        <button
          className={`tab-btn ${currentTab === "pending" ? "active" : ""}`}
          onClick={() => switchTab("pending")}
        >
          Pendente
        </button>
        <button
          className={`tab-btn ${currentTab === "anamnese" ? "active" : ""}`}
          onClick={() => switchTab("anamnese")}
        >
          Anamnese
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="list-toolbar">
        <div className="list-toolbar-filters">
          {/* Status filter — only on pending tab */}
          {currentTab === "pending" && (
            <div className="filter-group">
              <span className="filter-label">Status:</span>
              {PENDING_STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  className={`filter-chip ${effectiveStatus === s.value ? "active" : ""}`}
                  onClick={() => setStatusFilter(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {!hideRoleFilter && (
            <div className="filter-group">
              <span className="filter-label">Perfil:</span>
              {defaultRoles.map(([code, label]) => (
                <button
                  key={code}
                  className={`filter-chip ${roleSet.has(code) ? "active" : ""}`}
                  onClick={(e) => toggleRole(code, e)}
                  title="Ctrl+clique para multi-seleção"
                >
                  {label}
                </button>
              ))}
              <RoleMoreMenu
                roles={extraRoles}
                active={roleSet}
                open={moreOpen}
                onToggle={() => setMoreOpen((v) => !v)}
                onSelect={(code, e) => toggleRole(code, e)}
                hiddenActiveCount={hiddenActiveCount}
              />
            </div>
          )}
        </div>

        <div className="list-toolbar-divider" />

        {/* Sort */}
        <div className="filter-group">
          <span className="filter-label">Ordenar:</span>
          <button
            className={`filter-chip ${sortField === "name" ? "active" : ""}`}
            onClick={() => toggleSort("name")}
          >
            Nome {sortField === "name" && (sortDir === "asc" ? "↑" : "↓")}
          </button>
          <button
            className={`filter-chip ${sortField === "age" ? "active" : ""}`}
            onClick={() => toggleSort("age")}
          >
            Idade {sortField === "age" && (sortDir === "asc" ? "↑" : "↓")}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="hub-loading">
          <span className="loading-spinner" style={{ width: 24, height: 24 }} />
          <span>Carregando...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>Nenhuma conta {currentTab === "pending" ? "pendente" : "encontrada"}</h3>
          <p>
            {currentTab === "pending"
              ? "Quando novas contas forem criadas, elas aparecerão aqui."
              : "Nenhuma conta encontrada nesta etapa."}
          </p>
        </div>
      ) : (
        <>
          <div className="account-list">
            {items.map((a, i) => (
              <AccountListCard
                key={a.uid}
                account={a}
                index={i}
                onDetail={goToDetail}
                onAction={handleTransition}
                transitioningUid={transitioning}
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

// ── Role "+ Mais" Dropdown ───────────────────────────────────────────────────

function RoleMoreMenu({
  roles, active, open, onToggle, onSelect, hiddenActiveCount,
}: {
  roles: [string, string][];
  active: Set<string>;
  open: boolean;
  onToggle: () => void;
  onSelect: (code: string, e: React.MouseEvent) => void;
  hiddenActiveCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, onToggle]);

  if (roles.length === 0) return null;

  return (
    <div className="role-more" ref={ref}>
      <button className="filter-chip filter-chip--more" onClick={onToggle}>
        + Mais{hiddenActiveCount > 0 ? ` (${hiddenActiveCount})` : ""}
      </button>
      {open && (
        <div className="role-more-dropdown">
          {roles.map(([code, label]) => (
            <button
              key={code}
              className={`role-more-item ${active.has(code) ? "role-more-item--active" : ""}`}
              onClick={(e) => onSelect(code, e)}
            >
              <span className="role-more-check">{active.has(code) ? "✓" : ""}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
