import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { usePagination } from "../hooks/usePagination";

interface AccountAction {
  action: string;
  label: string;
  target_status: string;
}

interface Account {
  uid: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
  email_verified: boolean;
  birth_date?: string;
  gender?: string;
  phone?: string;
  created_at?: string;
  is_dependent: boolean;
  guardian_uid?: string;
  class_ids: string[];
  class_names: string[];
  available_actions: AccountAction[];
}

interface AccountGroup {
  lead: Account;
  dependents: Account[];
}

// ── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  pending_approval: { label: "Pendente", variant: "gold" },
  waiting_medical_history: { label: "Aguardando anamnese", variant: "warning" },
  pending_medical_history_approval: { label: "Anamnese em revisão", variant: "warning" },
  waiting_registration_review: { label: "Revisão solicitada", variant: "warning" },
  revised_registration: { label: "Revisado", variant: "warning" },
};

const PRIMARY_ACTIONS = new Set([
  "approve", "approve_to_medical", "approve_medical", "reactivate",
]);

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

const AGE_RANGES = [
  { label: "Kids", min: 0, max: 10 },
  { label: "Infanto Juvenil", min: 11, max: 17 },
  { label: "Adulto", min: 18, max: null as number | null },
];

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

function getAgeRangeLabel(age: number): string {
  for (const r of AGE_RANGES) {
    if (age >= r.min && (r.max === null || age <= r.max)) return r.label;
  }
  return "";
}

type FilterTab = "pending" | "anamnese";
type SortField = "name" | "age";
type SortDir = "asc" | "desc";

const TAB_STATUSES: Record<FilterTab, string[]> = {
  pending: ["pending_approval", "waiting_registration_review", "revised_registration"],
  anamnese: ["waiting_medical_history", "pending_medical_history_approval"],
};

const PENDING_STATUS_FILTER: { value: string | null; label: string }[] = [
  { value: null, label: "Todos" },
  { value: "pending_approval", label: "Pendente" },
  { value: "revision", label: "Em revisão" },
];

const REVISION_STATUSES = new Set(["waiting_registration_review", "revised_registration"]);

// Visible by default in the profile filter
const DEFAULT_VISIBLE_ROLES = ["student", "guardian"];
const ALL_ROLE_ENTRIES = Object.entries(ROLE_LABELS);

// ── Grouping ────────────────────────────────────────────────────────────────

function buildGroups(filtered: Account[], allAccounts: Account[]): AccountGroup[] {
  const allMap = new Map(allAccounts.map((a) => [a.uid, a]));
  const depsByGuardian = new Map<string, Account[]>();
  const standalones: Account[] = [];
  const guardiansUsed = new Set<string>();

  for (const a of filtered) {
    if (a.is_dependent && a.guardian_uid) {
      const list = depsByGuardian.get(a.guardian_uid) ?? [];
      list.push(a);
      depsByGuardian.set(a.guardian_uid, list);
    } else {
      standalones.push(a);
    }
  }

  const groups: AccountGroup[] = [];
  const emitted = new Set<string>();

  for (const a of standalones) {
    const deps = depsByGuardian.get(a.uid) ?? [];
    groups.push({ lead: a, dependents: deps });
    emitted.add(a.uid);
    deps.forEach((d) => emitted.add(d.uid));
    if (deps.length > 0) guardiansUsed.add(a.uid);
  }

  for (const [guardianUid, deps] of depsByGuardian) {
    if (guardiansUsed.has(guardianUid)) continue;
    const guardian = allMap.get(guardianUid);
    if (guardian && !emitted.has(guardian.uid)) {
      groups.push({ lead: guardian, dependents: deps });
      emitted.add(guardian.uid);
      deps.forEach((d) => emitted.add(d.uid));
    } else {
      for (const d of deps) {
        if (!emitted.has(d.uid)) {
          groups.push({ lead: d, dependents: [] });
          emitted.add(d.uid);
        }
      }
    }
  }

  return groups;
}

// ── Page ────────────────────────────────────────────────────────────────────

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("pending");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [roleFilters, setRoleFilters] = useState<Set<string>>(new Set());
  const [moreOpen, setMoreOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      setAccounts(await api.get<Account[]>("/accounts"));
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  async function handleTransition(uid: string, action: string) {
    setTransitioning(uid);
    try {
      await api.post(`/accounts/${uid}/transitions`, { action });
      await fetchAccounts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao executar ação");
    } finally {
      setTransitioning(null);
    }
  }

  function toggleRole(code: string, e: React.MouseEvent) {
    if (e.ctrlKey || e.metaKey) {
      setRoleFilters((prev) => {
        const next = new Set(prev);
        if (next.has(code)) next.delete(code); else next.add(code);
        return next;
      });
    } else {
      setRoleFilters((prev) =>
        prev.size === 1 && prev.has(code) ? new Set() : new Set([code]),
      );
    }
  }

  const statuses = TAB_STATUSES[tab];

  const filtered = useMemo(() =>
    accounts
      .filter((a) => {
        if (!statuses.includes(a.status)) return false;
        // Status sub-filter on pending tab
        if (tab === "pending" && statusFilter) {
          if (statusFilter === "pending_approval" && a.status !== "pending_approval") return false;
          if (statusFilter === "revision" && !REVISION_STATUSES.has(a.status)) return false;
        }
        if (roleFilters.size > 0 && !a.roles.some((r) => roleFilters.has(r))) return false;
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase();
          if (!a.name.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const cmp = sortField === "name"
          ? a.name.localeCompare(b.name, "pt-BR")
          : (calcAge(a.birth_date) ?? 999) - (calcAge(b.birth_date) ?? 999);
        return sortDir === "asc" ? cmp : -cmp;
      }),
    [accounts, statuses, tab, statusFilter, roleFilters, debouncedSearch, sortField, sortDir],
  );

  const groups = useMemo(() => buildGroups(filtered, accounts), [filtered, accounts]);

  const counts: Record<FilterTab, number> = {
    pending: accounts.filter((a) => TAB_STATUSES.pending.includes(a.status)).length,
    anamnese: accounts.filter((a) => TAB_STATUSES.anamnese.includes(a.status)).length,
  };

  const { visible, total, hasMore, loadMore, sentinelRef } = usePagination({ items: groups });

  function switchTab(t: FilterTab) {
    setTab(t);
    setStatusFilter(null);
    setRoleFilters(new Set());
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  const defaultRoles = ALL_ROLE_ENTRIES.filter(([code]) => DEFAULT_VISIBLE_ROLES.includes(code));
  const extraRoles = ALL_ROLE_ENTRIES.filter(([code]) => !DEFAULT_VISIBLE_ROLES.includes(code));
  const hiddenActiveCount = [...roleFilters].filter((r) => !DEFAULT_VISIBLE_ROLES.includes(r)).length;
  const hideRoleFilter = tab === "anamnese";

  return (
    <>
      <div className="page-header">
        <h2>Em análise</h2>
        <p>Contas em processamento</p>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === "pending" ? "active" : ""}`} onClick={() => switchTab("pending")}>
          Pendente {counts.pending > 0 && <span className="tab-badge">{counts.pending}</span>}
        </button>
        <button className={`tab-btn ${tab === "anamnese" ? "active" : ""}`} onClick={() => switchTab("anamnese")}>
          Anamnese {counts.anamnese > 0 && <span className="tab-badge tab-badge--warning">{counts.anamnese}</span>}
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
          {tab === "pending" && (
            <div className="filter-group">
              <span className="filter-label">Status:</span>
              {PENDING_STATUS_FILTER.map((s) => (
                <button
                  key={s.value ?? "all"}
                  className={`filter-chip ${statusFilter === s.value ? "active" : ""}`}
                  onClick={() => setStatusFilter(statusFilter === s.value ? null : s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Profile filter */}
          {!hideRoleFilter && (
            <div className="filter-group">
              <span className="filter-label">Perfil:</span>
              {defaultRoles.map(([code, label]) => (
                <button
                  key={code}
                  className={`filter-chip ${roleFilters.has(code) ? "active" : ""}`}
                  onClick={(e) => toggleRole(code, e)}
                  title="Ctrl+clique para multi-seleção"
                >
                  {label}
                </button>
              ))}
              <RoleMoreMenu
                roles={extraRoles}
                active={roleFilters}
                open={moreOpen}
                onToggle={() => setMoreOpen((v) => !v)}
                onSelect={(code, e) => { toggleRole(code, e); }}
                hiddenActiveCount={hiddenActiveCount}
              />
            </div>
          )}
        </div>

        <div className="list-toolbar-divider" />

        {/* Sort */}
        <div className="filter-group">
          <span className="filter-label">Ordenar:</span>
          <button className={`filter-chip ${sortField === "name" ? "active" : ""}`} onClick={() => toggleSort("name")}>
            Nome {sortField === "name" && (sortDir === "asc" ? "↑" : "↓")}
          </button>
          <button className={`filter-chip ${sortField === "age" ? "active" : ""}`} onClick={() => toggleSort("age")}>
            Idade {sortField === "age" && (sortDir === "asc" ? "↑" : "↓")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="hub-loading">
          <span className="loading-spinner" style={{ width: 24, height: 24 }} />
          <span>Carregando...</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>Nenhuma conta {tab === "pending" ? "pendente" : "encontrada"}</h3>
          <p>
            {tab === "pending"
              ? "Quando novas contas forem criadas, elas aparecerão aqui."
              : "Nenhuma conta encontrada nesta etapa."}
          </p>
        </div>
      ) : (
        <>
          <div className="account-list">
            {visible.map((group, i) => (
              <AccountGroupCard
                key={group.lead.uid}
                group={group}
                index={i}
                onAction={handleTransition}
                onDetail={(uid) => navigate(`/contas/${uid}`)}
                transitioningUid={transitioning}
              />
            ))}
          </div>
          <div className="pagination-footer">
            <span className="pagination-count">Exibindo {visible.length} de {total} {total === 1 ? "registro" : "registros"}</span>
            {hasMore && (
              <button className="btn btn-outline btn-sm" onClick={loadMore} style={{ marginTop: "0.5rem" }}>
                Ver mais ↓
              </button>
            )}
            <div ref={sentinelRef} />
          </div>
        </>
      )}
    </>
  );
}

// ── Account Group Card ──────────────────────────────────────────────────────

function AccountGroupCard({
  group, index, onAction, onDetail, transitioningUid,
}: {
  group: AccountGroup;
  index: number;
  onAction: (uid: string, action: string) => void;
  onDetail: (uid: string) => void;
  transitioningUid: string | null;
}) {
  const { lead, dependents } = group;

  if (dependents.length === 0) {
    return (
      <div className="account-group" style={{ animationDelay: `${index * 0.04}s` }}>
        <AccountCard
          account={lead}
          onAction={(a) => onAction(lead.uid, a)}
          onDetail={() => onDetail(lead.uid)}
          loading={transitioningUid === lead.uid}
        />
      </div>
    );
  }

  return (
    <div className="account-group" style={{ animationDelay: `${index * 0.04}s` }}>
      <FamilyCard
        guardian={lead}
        dependents={dependents}
        onAction={onAction}
        onDetail={onDetail}
        transitioningUid={transitioningUid}
      />
    </div>
  );
}

// ── Family Card (guardian + deps inside) ────────────────────────────────────

function FamilyCard({
  guardian, dependents, onAction, onDetail, transitioningUid,
}: {
  guardian: Account;
  dependents: Account[];
  onAction: (uid: string, action: string) => void;
  onDetail: (uid: string) => void;
  transitioningUid: string | null;
}) {
  const [depsOpen, setDepsOpen] = useState(false);
  const statusInfo = STATUS_LABELS[guardian.status] ?? { label: guardian.status, variant: "muted" };
  const initials = guardian.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const primary = guardian.available_actions.find((a) => PRIMARY_ACTIONS.has(a.action));
  const secondary = guardian.available_actions.filter((a) => a !== primary);

  return (
    <div className="account-card account-card--family" data-status={guardian.status}>
      <div className="account-card-header" onClick={() => onDetail(guardian.uid)} style={{ cursor: "pointer" }}>
        <div className="account-avatar">{initials}</div>
        <div className="account-info">
          <div className="account-name">{guardian.name}</div>
          <div className="account-email">{guardian.email}</div>
          <div className="account-meta">
            {guardian.roles.map((r) => (
              <span key={r} className="account-role-chip">{ROLE_LABELS[r] ?? r}</span>
            ))}
          </div>
        </div>
        <div className="account-header-right" onClick={(e) => e.stopPropagation()}>
          <span className={`status-badge status-badge--${statusInfo.variant}`}>{statusInfo.label}</span>
          {primary && (
            <button
              className="account-action-btn account-action-btn--primary"
              onClick={() => onAction(guardian.uid, primary.action)}
              disabled={transitioningUid === guardian.uid}
            >
              {transitioningUid === guardian.uid ? "..." : primary.label}
            </button>
          )}
          {secondary.length > 0 && (
            <MoreMenu
              actions={secondary}
              onAction={(a) => onAction(guardian.uid, a)}
              onDetail={() => onDetail(guardian.uid)}
              disabled={transitioningUid === guardian.uid}
            />
          )}
        </div>
      </div>

      <div
        className="account-dependents-toggle"
        onClick={() => setDepsOpen((v) => !v)}
      >
        <span className="account-dependents-toggle-icon">{depsOpen ? "▾" : "▸"}</span>
        <span className="account-dependents-label">Dependentes ({dependents.length})</span>
      </div>

      {depsOpen && (
        <div className="account-dependents-inner">
          {dependents.map((dep) => (
            <DepRow
              key={dep.uid}
              account={dep}
              onAction={(a) => onAction(dep.uid, a)}
              onDetail={() => onDetail(dep.uid)}
              loading={transitioningUid === dep.uid}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Standalone Account Card ─────────────────────────────────────────────────

function AccountCard({
  account, onAction, onDetail, loading,
}: {
  account: Account;
  onAction: (action: string) => void;
  onDetail: () => void;
  loading: boolean;
}) {
  const statusInfo = STATUS_LABELS[account.status] ?? { label: account.status, variant: "muted" };
  const initials = account.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const age = calcAge(account.birth_date);
  const ageLabel = age !== null ? getAgeRangeLabel(age) : "";
  const primary = account.available_actions.find((a) => PRIMARY_ACTIONS.has(a.action));
  const secondary = account.available_actions.filter((a) => a !== primary);

  return (
    <div className="account-card" data-status={account.status} onClick={onDetail}>
      <div className="account-card-header">
        <div className="account-avatar">{initials}</div>
        <div className="account-info">
          <div className="account-name">{account.name}</div>
          <div className="account-email">{account.email}</div>
          <div className="account-meta">
            {account.roles.map((r) => (
              <span key={r} className="account-role-chip">{ROLE_LABELS[r] ?? r}</span>
            ))}
            {account.is_dependent && <span className="account-role-chip account-role-chip--warning">Dependente</span>}
            {age !== null && (
              <span className="account-role-chip account-role-chip--success">
                {age} anos{ageLabel ? ` · ${ageLabel}` : ""}
              </span>
            )}
          </div>
          {account.class_names.length > 0 && (
            <div className="account-classes">{account.class_names.join(", ")}</div>
          )}
        </div>
        <div className="account-header-right" onClick={(e) => e.stopPropagation()}>
          <span className={`status-badge status-badge--${statusInfo.variant}`}>{statusInfo.label}</span>
          {primary && (
            <button
              className="account-action-btn account-action-btn--primary"
              onClick={() => onAction(primary.action)}
              disabled={loading}
            >
              {loading ? "..." : primary.label}
            </button>
          )}
          {secondary.length > 0 && (
            <MoreMenu actions={secondary} onAction={onAction} onDetail={onDetail} disabled={loading} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dependent Row ───────────────────────────────────────────────────────────

function DepRow({
  account, onAction, onDetail, loading,
}: {
  account: Account;
  onAction: (action: string) => void;
  onDetail: () => void;
  loading: boolean;
}) {
  const statusInfo = STATUS_LABELS[account.status] ?? { label: account.status, variant: "muted" };
  const initials = account.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const age = calcAge(account.birth_date);
  const ageLabel = age !== null ? getAgeRangeLabel(age) : "";
  const primary = account.available_actions.find((a) => PRIMARY_ACTIONS.has(a.action));
  const secondary = account.available_actions.filter((a) => a !== primary);

  return (
    <div className="dep-row" onClick={onDetail}>
      <div className="dep-row-header">
        <div className="account-avatar account-avatar--sm">{initials}</div>
        <div className="dep-row-info">
          <span className="dep-row-name">{account.name}</span>
          {age !== null && (
            <span className="dep-row-age">{age} anos{ageLabel ? ` · ${ageLabel}` : ""}</span>
          )}
        </div>
        <div className="dep-row-right" onClick={(e) => e.stopPropagation()}>
          <span className={`status-badge status-badge--${statusInfo.variant}`}>{statusInfo.label}</span>
          {primary && (
            <button
              className="account-action-btn account-action-btn--sm account-action-btn--primary"
              onClick={() => onAction(primary.action)}
              disabled={loading}
            >
              {loading ? "..." : primary.label}
            </button>
          )}
          <MoreMenu actions={secondary} onAction={onAction} onDetail={onDetail} disabled={loading} small />
        </div>
      </div>
    </div>
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

// ── More Menu (…) ───────────────────────────────────────────────────────────

const DANGER_ACTIONS = new Set(["reject", "expel"]);

function MoreMenu({
  actions, onAction, onDetail, disabled, small,
}: {
  actions: AccountAction[];
  onAction: (action: string) => void;
  onDetail: () => void;
  disabled: boolean;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const normal = actions.filter((a) => !DANGER_ACTIONS.has(a.action));
  const danger = actions.filter((a) => DANGER_ACTIONS.has(a.action));

  return (
    <div className="more-menu" ref={ref}>
      <button
        className={`more-menu-trigger ${small ? "more-menu-trigger--sm" : ""}`}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && (
        <div className="more-menu-dropdown">
          {/* Navigation items */}
          <button className="more-menu-item" onClick={() => { onDetail(); setOpen(false); }}>
            Ver perfil
          </button>
          {/* State machine actions */}
          {normal.length > 0 && (
            <>
              <div className="more-menu-divider" />
              {normal.map((act) => (
                <button
                  key={act.action}
                  className="more-menu-item"
                  onClick={() => { onAction(act.action); setOpen(false); }}
                >
                  {act.label}
                </button>
              ))}
            </>
          )}
          {/* Danger actions at the bottom */}
          {danger.length > 0 && (
            <>
              <div className="more-menu-divider" />
              {danger.map((act) => (
                <button
                  key={act.action}
                  className="more-menu-item more-menu-item--danger"
                  onClick={() => { onAction(act.action); setOpen(false); }}
                >
                  {act.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
