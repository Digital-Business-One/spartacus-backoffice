/**
 * Tabs of the account detail page (RFC-12 §1.3 — matriz de visibilidade).
 *
 * Visibility per role:
 *
 * | Tab            | Stud. | Guard. | Teach. | Instr. | Owner | Asst. | Supp. | Spons. |
 * |----------------|-------|--------|--------|--------|-------|-------|-------|--------|
 * | personal-data  |   ✓   |   ✓    |   ✓    |   ✓    |   ✓   |   ✓   |   ✓   |   ✓    |
 * | address        |   ✓   |   ✓    |   ✓    |   ✓    |   ✓   |   ✓   |   ✓   |   ✓    |
 * | classes        |   ✓   |   —    |   —    |   —    |   —   |   —   |   —   |   —    |
 * | medical-history|   ✓   |   —    |   —    |   —    |   —   |   —   |   —   |   —    |
 * | attendance     |   ✓   |   —    |   —    |   —    |   —   |   —   |   —   |   —    |
 * | donations      |   ✓   |   ✓    |   ✓    |   ✓    |   ✓   |   ✓   |   ✓   |   ✓    |
 * | dependents     |   —   |   ✓    |   —    |   —    |   —   |   —   |   —   |   —    |
 * | history        |   ✓   |   ✓    |   ✓    |   ✓    |   ✓   |   ✓   |   ✓   |   ✓    |
 *
 * Order is fixed; non-applicable tabs are omitted (not disabled).
 */

export type AccountTabId =
  | "personal-data"
  | "address"
  | "classes"
  | "medical-history"
  | "attendance"
  | "donations"
  | "dependents"
  | "history";

export interface TabSpec {
  id: AccountTabId;
  label: string;
  /** Returns true if the tab should be visible for the given roles. */
  isVisible: (roles: Set<string>) => boolean;
}

const ALL = () => true;
const HAS_STUDENT = (r: Set<string>) => r.has("student");
const HAS_GUARDIAN = (r: Set<string>) => r.has("guardian");

const TABS: TabSpec[] = [
  { id: "personal-data", label: "Dados Pessoais", isVisible: ALL },
  { id: "address", label: "Endereço", isVisible: ALL },
  { id: "classes", label: "Turmas", isVisible: HAS_STUDENT },
  { id: "medical-history", label: "Anamnese", isVisible: HAS_STUDENT },
  { id: "attendance", label: "Frequência", isVisible: HAS_STUDENT },
  { id: "donations", label: "Doações", isVisible: ALL },
  { id: "dependents", label: "Dependentes", isVisible: HAS_GUARDIAN },
  { id: "history", label: "Histórico", isVisible: ALL },
];

export const DEFAULT_TAB: AccountTabId = "personal-data";

/** Returns the visible tabs for a given set of roles. */
export function visibleTabsForRoles(roles: string[]): TabSpec[] {
  const set = new Set(roles);
  return TABS.filter((t) => t.isVisible(set));
}

/** Returns true if `tabId` is visible for the given roles. */
export function isTabVisible(tabId: AccountTabId, roles: string[]): boolean {
  return visibleTabsForRoles(roles).some((t) => t.id === tabId);
}
