import { GraduationBadgeColumn } from "./GraduationBadge";
import {
  AccountDetail,
  GENDER_LABELS,
  ROLE_LABELS,
  STATUS_LABELS,
  calcAge,
} from "./types";

interface AccountHeaderProps {
  account: AccountDetail;
  isCurrentUser: boolean;
  onSuspend: () => void;
  suspendLoading: boolean;
}

/**
 * Header card of the account detail page (RFC-12).
 *
 * Layout:
 *   [Avatar]  [Name + email]                          [Suspender btn]
 *             [Role chips · Status]                   [Graduation badges]
 *             [Age · Gender · AgeCategory · Modalities]
 */
export function AccountHeader({
  account,
  isCurrentUser,
  onSuspend,
  suspendLoading,
}: AccountHeaderProps) {
  const initials = account.name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const age = calcAge(account.birthDate);
  const ageCategoryLabel =
    account.ageCategory === "child"
      ? "Infantil"
      : account.ageCategory === "adult"
        ? "Adulto"
        : null;

  const statusInfo = STATUS_LABELS[account.status] ?? {
    label: account.status,
    variant: "muted",
  };

  // Suspender (CNV de "expel") — só ativo se a state machine permitir e
  // a conta não for o próprio usuário logado.
  const expelAction = account.availableActions.find((a) => a.action === "expel");
  const showSuspend = !isCurrentUser && expelAction !== undefined;

  // Modalities = unique modalityName from classes (denormalized)
  const modalities = Array.from(
    new Set(account.classes.map((c) => c.modalityName).filter(Boolean)),
  );

  return (
    <div className="account-detail-header">
      <div className="account-detail-header-main">
        {account.photoUrl ? (
          <img
            src={account.photoUrl}
            alt={account.name}
            className="account-detail-avatar account-detail-avatar--photo"
          />
        ) : (
          <div className="account-detail-avatar">{initials}</div>
        )}

        <div className="account-detail-identity">
          <h2 className="account-detail-name">{account.name}</h2>
          {account.email && (
            <p className="account-detail-email">{account.email}</p>
          )}
          <div className="account-detail-chips">
            {account.roles.map((r) => (
              <span key={r} className="account-role-chip">
                {ROLE_LABELS[r] ?? r}
              </span>
            ))}
            <span
              className={`status-badge status-badge--${statusInfo.variant}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <div className="account-detail-meta">
            {age !== null && (
              <span className="account-detail-meta-item">
                <span aria-hidden>🎂</span>
                {age} anos
              </span>
            )}
            {account.gender && GENDER_LABELS[account.gender] && (
              <span className="account-detail-meta-item">
                <span aria-hidden>{account.gender === "male" ? "♂" : "♀"}</span>
                {GENDER_LABELS[account.gender]}
              </span>
            )}
            {ageCategoryLabel && (
              <span className="account-detail-meta-item">
                <span aria-hidden>🧒</span>
                {ageCategoryLabel}
              </span>
            )}
            {modalities.map((m) => (
              <span key={m} className="account-detail-meta-item account-detail-meta-item--modality">
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="account-detail-header-right">
          <GraduationBadgeColumn graduation={account.graduation} />
          {showSuspend && (
            <button
              className="btn btn-sm detail-btn--danger"
              onClick={onSuspend}
              disabled={suspendLoading}
            >
              {suspendLoading ? "..." : "Suspender"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
