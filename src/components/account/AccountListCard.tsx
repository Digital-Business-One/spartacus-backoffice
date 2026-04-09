import { useState } from "react";
import { AccountAvatar } from "./AccountAvatar";
import { GraduationBadgeColumn } from "./GraduationBadge";
import type { GraduationEntry } from "./types";
import { ROLE_LABELS, STATUS_LABELS, calcAge } from "./types";

// ── Types (matching enriched AccountOut from the backend) ───────────────────

export interface AccountListItem {
  uid: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
  photoUrl?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  isDependant?: boolean;
  isDependent?: boolean;
  guardianUid?: string | null;
  guardianName?: string | null;
  guardianPhotoUrl?: string | null;
  classNames?: string[];
  modalityNames?: string[];
  graduation?: Record<string, GraduationEntry> | null;
  availableActions?: AccountAction[];
  dependents?: AccountListItem[];
  // legacy snake_case compat
  photo_url?: string | null;
  birth_date?: string | null;
  is_dependent?: boolean;
  guardian_uid?: string | null;
  guardian_name?: string | null;
  guardian_photo_url?: string | null;
  class_names?: string[];
  modality_names?: string[];
  available_actions?: AccountAction[];
}

interface AccountAction {
  action: string;
  label: string;
  target_status?: string;
  targetStatus?: string;
}

// ── Normalize helper (snake_case backend → camelCase) ───────────────────────

interface NormAccount {
  uid: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
  photoUrl: string | null;
  birthDate: string | null;
  gender: string | null;
  isDependent: boolean;
  guardianUid: string | null;
  guardianName: string | null;
  guardianPhotoUrl: string | null;
  classNames: string[];
  modalityNames: string[];
  graduation: Record<string, GraduationEntry> | null;
  availableActions: AccountAction[];
  dependents: NormAccount[];
}

function norm(a: AccountListItem): NormAccount {
  return {
    uid: a.uid,
    name: a.name,
    email: a.email,
    roles: a.roles ?? [],
    status: a.status,
    photoUrl: a.photoUrl ?? a.photo_url ?? null,
    birthDate: a.birthDate ?? a.birth_date ?? null,
    gender: a.gender ?? null,
    isDependent: a.isDependent ?? a.isDependant ?? a.is_dependent ?? false,
    guardianUid: a.guardianUid ?? a.guardian_uid ?? null,
    guardianName: a.guardianName ?? a.guardian_name ?? null,
    guardianPhotoUrl: a.guardianPhotoUrl ?? a.guardian_photo_url ?? null,
    classNames: a.classNames ?? a.class_names ?? [],
    modalityNames: a.modalityNames ?? a.modality_names ?? [],
    graduation: a.graduation ?? null,
    availableActions: a.availableActions ?? a.available_actions ?? [],
    dependents: (a.dependents ?? []).map(norm),
  };
}

// ── Props ───────────────────────────────────────────────────────────────────

const PRIMARY_ACTIONS = new Set([
  "approve", "approve_to_medical", "approve_medical", "reactivate",
]);

const DANGER_ACTIONS = new Set(["reject", "expel"]);

const AGE_RANGES = [
  { label: "Kids", min: 0, max: 10 },
  { label: "Infanto Juvenil", min: 11, max: 17 },
  { label: "Adulto", min: 18, max: null as number | null },
];

function ageRangeLabel(age: number): string {
  for (const r of AGE_RANGES) {
    if (age >= r.min && (r.max === null || age <= r.max)) return r.label;
  }
  return "";
}

// ── Exported component ──────────────────────────────────────────────────────

interface AccountListCardProps {
  account: AccountListItem;
  onDetail: (uid: string) => void;
  onAction?: (uid: string, action: string) => void;
  transitioningUid?: string | null;
  /** Animation delay index for staggered fade-in */
  index?: number;
}

/**
 * Reusable account card for all listing pages (RFC-12 componentization).
 *
 * Features:
 * - Avatar with photo fallback to initials
 * - Role chips + status badge
 * - Age, gender, age category
 * - Modality chips
 * - Graduation badges (vertical, compact)
 * - Dependent hierarchy (collapsible)
 * - Action buttons (approve, reject, etc.)
 */
export function AccountListCard({
  account: raw,
  onDetail,
  onAction,
  transitioningUid,
  index = 0,
}: AccountListCardProps) {
  const a = norm(raw);
  const hasDeps = a.dependents.length > 0;

  if (hasDeps) {
    return (
      <div className="account-group" style={{ animationDelay: `${index * 0.04}s` }}>
        <GuardianCard
          account={a}
          dependents={a.dependents}
          onDetail={onDetail}
          onAction={onAction}
          transitioningUid={transitioningUid}
        />
      </div>
    );
  }

  return (
    <div className="account-group" style={{ animationDelay: `${index * 0.04}s` }}>
      <StandaloneCard
        account={a}
        onDetail={onDetail}
        onAction={onAction}
        loading={transitioningUid === a.uid}
      />
    </div>
  );
}

// ── Internal sub-components ─────────────────────────────────────────────────

function StandaloneCard({
  account: a,
  onDetail,
  onAction,
  loading = false,
}: {
  account: NormAccount;
  onDetail: (uid: string) => void;
  onAction?: (uid: string, action: string) => void;
  loading?: boolean;
}) {
  const age = calcAge(a.birthDate);
  const ageRange = age !== null ? ageRangeLabel(age) : "";
  const statusInfo = STATUS_LABELS[a.status] ?? { label: a.status, variant: "muted" };
  const primary = a.availableActions.find((act) => PRIMARY_ACTIONS.has(act.action));
  const secondary = a.availableActions.filter((act) => act !== primary);

  return (
    <div className="account-card" data-status={a.status} onClick={() => onDetail(a.uid)}>
      <div className="account-card-header">
        <AccountAvatar name={a.name} photoUrl={a.photoUrl} />
        <div className="account-info">
          <div className="account-name">{a.name}</div>
          <div className="account-email">{a.email}</div>
          <div className="account-meta">
            {a.roles.map((r) => (
              <span key={r} className="account-role-chip">{ROLE_LABELS[r] ?? r}</span>
            ))}
            {a.isDependent && (
              <span className="account-role-chip account-role-chip--warning">Dependente</span>
            )}
            {age !== null && (
              <span className="account-role-chip account-role-chip--success">
                {age} anos{ageRange ? ` · ${ageRange}` : ""}
              </span>
            )}
            {a.gender && (
              <span className="account-role-chip">
                {a.gender === "male" ? "Masculino" : "Feminino"}
              </span>
            )}
          </div>
          {a.modalityNames.length > 0 && (
            <div className="account-modalities">
              {a.modalityNames.join(" — ")}
            </div>
          )}
          {a.classNames.length > 0 && a.modalityNames.length === 0 && (
            <div className="account-classes">{a.classNames.join(", ")}</div>
          )}
        </div>
        <div className="account-header-right" onClick={(e) => e.stopPropagation()}>
          <GraduationBadgeColumn graduation={a.graduation} />
          <span className={`status-badge status-badge--${statusInfo.variant}`}>
            {statusInfo.label}
          </span>
          {primary && onAction && (
            <button
              className="account-action-btn account-action-btn--primary"
              onClick={() => onAction(a.uid, primary.action)}
              disabled={loading}
            >
              {loading ? "..." : primary.label}
            </button>
          )}
          {secondary.length > 0 && onAction && (
            <MoreMenu
              actions={secondary}
              onAction={(act) => onAction(a.uid, act)}
              onDetail={() => onDetail(a.uid)}
              disabled={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function GuardianCard({
  account: a,
  dependents,
  onDetail,
  onAction,
  transitioningUid,
}: {
  account: NormAccount;
  dependents: NormAccount[];
  onDetail: (uid: string) => void;
  onAction?: (uid: string, action: string) => void;
  transitioningUid?: string | null;
}) {
  const [depsOpen, setDepsOpen] = useState(false);
  const statusInfo = STATUS_LABELS[a.status] ?? { label: a.status, variant: "muted" };
  const primary = a.availableActions.find((act) => PRIMARY_ACTIONS.has(act.action));
  const secondary = a.availableActions.filter((act) => act !== primary);
  const isLoading = transitioningUid === a.uid;

  return (
    <div className="account-card account-card--family" data-status={a.status}>
      <div className="account-card-header" onClick={() => onDetail(a.uid)} style={{ cursor: "pointer" }}>
        <AccountAvatar name={a.name} photoUrl={a.photoUrl} />
        <div className="account-info">
          <div className="account-name">{a.name}</div>
          <div className="account-email">{a.email}</div>
          <div className="account-meta">
            {a.roles.map((r) => (
              <span key={r} className="account-role-chip">{ROLE_LABELS[r] ?? r}</span>
            ))}
          </div>
          {a.modalityNames.length > 0 && (
            <div className="account-modalities">{a.modalityNames.join(" — ")}</div>
          )}
        </div>
        <div className="account-header-right" onClick={(e) => e.stopPropagation()}>
          <GraduationBadgeColumn graduation={a.graduation} />
          <span className={`status-badge status-badge--${statusInfo.variant}`}>
            {statusInfo.label}
          </span>
          {primary && onAction && (
            <button
              className="account-action-btn account-action-btn--primary"
              onClick={() => onAction(a.uid, primary.action)}
              disabled={isLoading}
            >
              {isLoading ? "..." : primary.label}
            </button>
          )}
          {secondary.length > 0 && onAction && (
            <MoreMenu
              actions={secondary}
              onAction={(act) => onAction(a.uid, act)}
              onDetail={() => onDetail(a.uid)}
              disabled={isLoading}
            />
          )}
        </div>
      </div>

      <div className="account-dependents-toggle" onClick={() => setDepsOpen((v) => !v)}>
        <span className="account-dependents-toggle-icon">{depsOpen ? "▾" : "▸"}</span>
        <span className="account-dependents-label">Dependentes ({dependents.length})</span>
      </div>

      {depsOpen && (
        <div className="account-dependents-inner">
          {dependents.map((dep) => (
            <DepRow
              key={dep.uid}
              account={dep}
              onDetail={() => onDetail(dep.uid)}
              onAction={onAction ? (act) => onAction(dep.uid, act) : undefined}
              loading={transitioningUid === dep.uid}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DepRow({
  account: a,
  onDetail,
  onAction,
  loading = false,
}: {
  account: NormAccount;
  onDetail: () => void;
  onAction?: (action: string) => void;
  loading?: boolean;
}) {
  const statusInfo = STATUS_LABELS[a.status] ?? { label: a.status, variant: "muted" };
  const age = calcAge(a.birthDate);
  const ageRange = age !== null ? ageRangeLabel(age) : "";
  const primary = a.availableActions.find((act) => PRIMARY_ACTIONS.has(act.action));
  const secondary = a.availableActions.filter((act) => act !== primary);

  return (
    <div className="dep-row" onClick={onDetail}>
      <div className="dep-row-header">
        <AccountAvatar name={a.name} photoUrl={a.photoUrl} size="sm" />
        <div className="dep-row-info">
          <span className="dep-row-name">{a.name}</span>
          {age !== null && (
            <span className="dep-row-age">{age} anos{ageRange ? ` · ${ageRange}` : ""}</span>
          )}
          {a.gender && (
            <span className="dep-row-age">
              {a.gender === "male" ? "Masculino" : "Feminino"}
            </span>
          )}
        </div>
        <div className="dep-row-right" onClick={(e) => e.stopPropagation()}>
          <GraduationBadgeColumn graduation={a.graduation} />
          <span className={`status-badge status-badge--${statusInfo.variant}`}>
            {statusInfo.label}
          </span>
          {primary && onAction && (
            <button
              className="account-action-btn account-action-btn--sm account-action-btn--primary"
              onClick={() => onAction(primary.action)}
              disabled={loading}
            >
              {loading ? "..." : primary.label}
            </button>
          )}
          {secondary.length > 0 && onAction && (
            <MoreMenu
              actions={secondary}
              onAction={onAction}
              onDetail={onDetail}
              disabled={loading}
              small
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── More Menu (…) ───────────────────────────────────────────────────────────

function MoreMenu({
  actions,
  onAction,
  onDetail,
  disabled,
  small,
}: {
  actions: { action: string; label: string }[];
  onAction: (action: string) => void;
  onDetail: () => void;
  disabled: boolean;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const normal = actions.filter((a) => !DANGER_ACTIONS.has(a.action));
  const danger = actions.filter((a) => DANGER_ACTIONS.has(a.action));

  return (
    <div className="more-menu">
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
          <button className="more-menu-item" onClick={() => { onDetail(); setOpen(false); }}>
            Ver perfil
          </button>
          {normal.length > 0 && (
            <>
              <div className="more-menu-divider" />
              {normal.map((act) => (
                <button key={act.action} className="more-menu-item" onClick={() => { onAction(act.action); setOpen(false); }}>
                  {act.label}
                </button>
              ))}
            </>
          )}
          {danger.length > 0 && (
            <>
              <div className="more-menu-divider" />
              {danger.map((act) => (
                <button key={act.action} className="more-menu-item more-menu-item--danger" onClick={() => { onAction(act.action); setOpen(false); }}>
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
