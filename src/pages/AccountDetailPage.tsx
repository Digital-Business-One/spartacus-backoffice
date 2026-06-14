import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { auth } from "../lib/firebase";
import { BackLink } from "../components/BackLink";
import { AccountHeader } from "../components/account/AccountHeader";
import { AccountTabs } from "../components/account/AccountTabs";
import {
  type AccountTabId,
  DEFAULT_TAB,
  isTabVisible,
} from "../components/account/tabsConfig";
import { AddressTab } from "../components/account/tabs/AddressTab";
import { AttendanceTab } from "../components/account/tabs/AttendanceTab";
import { ClassesTab } from "../components/account/tabs/ClassesTab";
import { DependentsTab } from "../components/account/tabs/DependentsTab";
import { DonationsTab } from "../components/account/tabs/DonationsTab";
import { HistoryTab } from "../components/account/tabs/HistoryTab";
import { MedicalHistoryTab } from "../components/account/tabs/MedicalHistoryTab";
import { PersonalDataTab } from "../components/account/tabs/PersonalDataTab";
import type { AccountDetail } from "../components/account/types";
import { useUrlState } from "../hooks/useUrlState";

export function AccountDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useUrlState("tab", DEFAULT_TAB);
  const [myRoles, setMyRoles] = useState<string[]>([]);
  // Moderação (advertir/suspender) — modal com campo de motivo
  const [modAction, setModAction] = useState<"warn" | "suspend" | null>(null);
  const [modReason, setModReason] = useState("");
  const [modSubmitting, setModSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<{ roles?: string[] }>("/auth/me")
      .then((me) => setMyRoles(me.roles ?? []))
      .catch(() => setMyRoles([]));
  }, []);

  const fetchAccount = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setNotFound(false);
    try {
      const data = await api.get<AccountDetail>(`/accounts/${uid}`);
      setAccount(data);
    } catch {
      setAccount(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  function openModeration(action: "warn" | "suspend") {
    setModReason("");
    setModAction(action);
  }

  const submitModeration = useCallback(async () => {
    if (!uid || !modAction) return;
    const reason = modReason.trim();
    if (!reason) return;
    setModSubmitting(true);
    try {
      if (modAction === "warn") {
        await api.post(`/accounts/${uid}/warning`, { reason });
      } else {
        await api.post(`/accounts/${uid}/transitions`, {
          action: "expel",
          reason,
        });
      }
      setModAction(null);
      await fetchAccount();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao registrar a ação";
      window.alert(message);
    } finally {
      setModSubmitting(false);
    }
  }, [uid, modAction, modReason, fetchAccount]);

  if (loading) {
    return (
      <div className="hub-loading">
        <span className="loading-spinner" style={{ width: 24, height: 24 }} />
        <span>Carregando conta...</span>
      </div>
    );
  }

  if (notFound || !account) {
    return (
      <>
        <div className="page-header">
          <BackLink fallback="/em-analise">← Voltar às contas</BackLink>
          <h2>Conta não encontrada</h2>
        </div>
      </>
    );
  }

  // If the URL tab is not visible for the current account's roles,
  // fall back to the default tab.
  const currentTab = (tab as AccountTabId) || DEFAULT_TAB;
  const safeTab: AccountTabId = isTabVisible(currentTab, account.roles)
    ? currentTab
    : DEFAULT_TAB;

  const isCurrentUser = auth.currentUser?.uid === account.uid;
  const isStaffActor = ["owner", "assistant", "teacher", "instructor"].some(
    (r) => myRoles.includes(r),
  );

  return (
    <>
      <div className="page-header">
        <BackLink fallback="/em-analise">← Voltar às contas</BackLink>
      </div>

      <AccountHeader
        account={account}
        isCurrentUser={isCurrentUser}
        onSuspend={() => openModeration("suspend")}
        onWarn={() => openModeration("warn")}
        canWarn={isStaffActor && !isCurrentUser}
        canAssignNickname={["assistant", "teacher", "instructor"].some((r) =>
          myRoles.includes(r),
        )}
        onNicknameSaved={fetchAccount}
      />

      {modAction && (
        <div className="mod-modal-overlay" onClick={() => setModAction(null)}>
          <div className="mod-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="mod-modal-title">
              {modAction === "warn" ? "Advertir aluno" : "Suspender conta"}
            </h3>
            <p className="mod-modal-subtitle">
              {modAction === "warn"
                ? `Registrar uma advertência para ${account.name}.`
                : `Suspender ${account.name}. O usuário perderá acesso ao app.`}
            </p>
            <textarea
              className="mod-modal-textarea"
              placeholder="Descreva o motivo..."
              maxLength={500}
              rows={4}
              value={modReason}
              onChange={(e) => setModReason(e.target.value)}
              autoFocus
            />
            <div className="mod-modal-actions">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setModAction(null)}
                disabled={modSubmitting}
              >
                Cancelar
              </button>
              <button
                className={`btn btn-sm ${
                  modAction === "warn" ? "btn-primary" : "detail-btn--danger"
                }`}
                onClick={submitModeration}
                disabled={modSubmitting || !modReason.trim()}
              >
                {modSubmitting
                  ? "..."
                  : modAction === "warn"
                    ? "Advertir"
                    : "Suspender"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AccountTabs
        roles={account.roles}
        active={safeTab}
        onChange={(t) => setTab(t)}
      />

      {safeTab === "personal-data" && <PersonalDataTab account={account} />}
      {safeTab === "address" && <AddressTab account={account} />}
      {safeTab === "classes" && <ClassesTab account={account} />}
      {safeTab === "medical-history" && <MedicalHistoryTab uid={account.uid} />}
      {safeTab === "attendance" && <AttendanceTab uid={account.uid} />}
      {safeTab === "donations" && <DonationsTab uid={account.uid} />}
      {safeTab === "dependents" && <DependentsTab uid={account.uid} />}
      {safeTab === "history" && <HistoryTab uid={account.uid} />}
    </>
  );
}
