import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { GraduationBadgeColumn } from "./GraduationBadge";
import {
  AccountDetail,
  GENDER_LABELS,
  ROLE_LABELS,
  STATUS_LABELS,
  calcAge,
} from "./types";

const PencilIcon = () => (
  <svg
    className="nickname-inline-pencil"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

interface AccountHeaderProps {
  account: AccountDetail;
  isCurrentUser: boolean;
  onSuspend: () => void;
  onWarn: () => void;
  canWarn?: boolean;
  canAssignNickname?: boolean;
  onNicknameSaved?: () => void;
}

const MoreVerticalIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

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
  onWarn,
  canWarn = false,
  canAssignNickname = false,
  onNicknameSaved,
}: AccountHeaderProps) {
  const [editingNick, setEditingNick] = useState(false);
  const [nickValue, setNickValue] = useState(account.nickname ?? "");
  const [nickSaving, setNickSaving] = useState(false);
  const savingRef = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const canEditNick = canAssignNickname && !isCurrentUser;

  function startEditNick() {
    setNickValue(account.nickname ?? "");
    setEditingNick(true);
  }

  function cancelEditNick() {
    // Reset to original so a trailing onBlur commit becomes a no-op.
    setNickValue(account.nickname ?? "");
    setEditingNick(false);
  }

  async function commitNick() {
    if (savingRef.current) return;
    const value = nickValue.trim();
    if (value === (account.nickname ?? "")) {
      setEditingNick(false);
      return;
    }
    savingRef.current = true;
    setNickSaving(true);
    try {
      await api.patch(`/accounts/${account.uid}/nickname`, { nickname: value });
      setEditingNick(false);
      onNicknameSaved?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar apelido";
      window.alert(msg);
    } finally {
      savingRef.current = false;
      setNickSaving(false);
    }
  }

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
          <h2 className="account-detail-name">
            <span>{account.name}</span>
            {editingNick ? (
              <span className="nickname-inline">
                <span className="nickname-inline-sep">/</span>
                <input
                  className="nickname-inline-input"
                  type="text"
                  maxLength={30}
                  placeholder="apelido"
                  value={nickValue}
                  autoFocus
                  disabled={nickSaving}
                  onChange={(e) => setNickValue(e.target.value)}
                  onBlur={commitNick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitNick();
                    if (e.key === "Escape") cancelEditNick();
                  }}
                />
              </span>
            ) : account.nickname ? (
              <button
                type="button"
                className="nickname-inline-display"
                onClick={canEditNick ? startEditNick : undefined}
                title={canEditNick ? "Editar apelido" : undefined}
                disabled={!canEditNick}
              >
                <span className="nickname-inline-sep">/</span> {account.nickname}
                {canEditNick && <PencilIcon />}
              </button>
            ) : (
              canEditNick && (
                <button
                  type="button"
                  className="nickname-inline-add"
                  onClick={startEditNick}
                >
                  <PencilIcon /> apelido
                </button>
              )
            )}
          </h2>
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
          {(canWarn || showSuspend) && (
            <div className="account-actions-menu" ref={menuRef}>
              <button
                className="account-actions-trigger"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Mais ações"
                title="Mais ações"
              >
                <MoreVerticalIcon />
              </button>
              {menuOpen && (
                <div className="account-actions-dropdown">
                  {canWarn && (
                    <button
                      className="account-actions-item"
                      onClick={() => {
                        setMenuOpen(false);
                        onWarn();
                      }}
                    >
                      Advertir
                    </button>
                  )}
                  {showSuspend && (
                    <button
                      className="account-actions-item account-actions-item--danger"
                      onClick={() => {
                        setMenuOpen(false);
                        onSuspend();
                      }}
                    >
                      Suspender
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
