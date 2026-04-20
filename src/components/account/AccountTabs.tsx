import {
  type AccountTabId,
  visibleTabsForRoles,
} from "./tabsConfig";

interface AccountTabsProps {
  roles: string[];
  active: AccountTabId;
  onChange: (tab: AccountTabId) => void;
}

export function AccountTabs({ roles, active, onChange }: AccountTabsProps) {
  const tabs = visibleTabsForRoles(roles);
  return (
    <div className="account-detail-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`account-detail-tab ${active === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
