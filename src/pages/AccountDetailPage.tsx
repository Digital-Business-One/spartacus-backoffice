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
import { PersonalDataTab } from "../components/account/tabs/PersonalDataTab";
import { PlaceholderTab } from "../components/account/tabs/PlaceholderTab";
import type { AccountDetail } from "../components/account/types";
import { useUrlState } from "../hooks/useUrlState";

export function AccountDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useUrlState("tab", DEFAULT_TAB);
  const [suspendLoading, setSuspendLoading] = useState(false);

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

  const handleSuspend = useCallback(async () => {
    if (!uid) return;
    const ok = window.confirm(
      "Suspender esta conta? O usuário perderá acesso ao app.",
    );
    if (!ok) return;
    setSuspendLoading(true);
    try {
      await api.post(`/accounts/${uid}/transitions`, { action: "expel" });
      await fetchAccount();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao suspender";
      window.alert(message);
    } finally {
      setSuspendLoading(false);
    }
  }, [uid, fetchAccount]);

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

  return (
    <>
      <div className="page-header">
        <BackLink fallback="/em-analise">← Voltar às contas</BackLink>
      </div>

      <AccountHeader
        account={account}
        isCurrentUser={isCurrentUser}
        onSuspend={handleSuspend}
        suspendLoading={suspendLoading}
      />

      <AccountTabs
        roles={account.roles}
        active={safeTab}
        onChange={(t) => setTab(t)}
      />

      {safeTab === "dados-pessoais" && <PersonalDataTab account={account} />}
      {safeTab === "endereco" && <AddressTab account={account} />}
      {safeTab === "turmas" && (
        <PlaceholderTab
          icon="🥋"
          title="Turmas"
          message="Em breve — implementação na Fase 4 da RFC-12."
        />
      )}
      {safeTab === "anamnese" && (
        <PlaceholderTab
          icon="📋"
          title="Anamnese"
          message="Em breve — implementação na Fase 4 da RFC-12."
        />
      )}
      {safeTab === "frequencia" && (
        <PlaceholderTab
          icon="📅"
          title="Frequência"
          message="Em breve — implementação na Fase 4 da RFC-12."
        />
      )}
      {safeTab === "doacoes" && (
        <PlaceholderTab
          icon="💝"
          title="Doações"
          message="Em breve — implementação na Fase 4 da RFC-12."
        />
      )}
      {safeTab === "dependentes" && (
        <PlaceholderTab
          icon="👨‍👩‍👧"
          title="Dependentes"
          message="Em breve — implementação na Fase 4 da RFC-12."
        />
      )}
      {safeTab === "historico" && (
        <PlaceholderTab
          icon="🕒"
          title="Histórico"
          message="Em breve — implementação na Fase 5 da RFC-12."
        />
      )}
    </>
  );
}
