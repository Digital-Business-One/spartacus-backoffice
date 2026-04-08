/**
 * Mirrors the backend AccountDetailOut (RFC-12).
 *
 * The backend serializes with `populate_by_name + alias_generator=to_camel`
 * so the wire format is camelCase.
 */

export interface AccountAction {
  action: string;
  label: string;
  targetStatus: string;
}

export interface Address {
  postalCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface ClassDetail {
  id: string;
  name: string;
  modalityId: string;
  modalityName: string;
  schedule: string;
  scheduleItems: { day: string; startTime?: string; endTime?: string }[];
  teacher?: string | null;
  location?: string | null;
  active: boolean;
}

export interface GraduationEntry {
  belt: string;
  degree: number;
  prajied?: number | null;
}

export interface Competition {
  weightKg?: number | null;
  targetCategories: string[];
  calculatedAgeCategory?: string | null;
  calculatedWeightCategory?: string | null;
}

export interface AccountDetail {
  // Identity
  uid: string;
  name: string;
  email?: string | null;
  emailVerified: boolean;
  taxId?: string | null;
  photoUrl?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  phone?: string | null;
  whatsapp?: string | null;

  // Context
  roles: string[];
  status: string;
  isDependent: boolean;
  guardianUid?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianRelationship?: string | null;

  // Address
  address?: Address | null;

  // Classes
  classes: ClassDetail[];

  // Graduation per modality (key = modality slug)
  graduation?: Record<string, GraduationEntry> | null;

  // Competition
  competition?: Competition | null;

  // Audit
  createdAt?: string | null;
  updatedAt?: string | null;
  lastUpdatedBy?: string | null;
  lastUpdatedByName?: string | null;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  authProvider?: string | null;

  // Derived
  ageCategory?: "child" | "adult" | null;

  // Available actions (state machine)
  availableActions: AccountAction[];
}

// ── Display helpers ─────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  student: "Aluno",
  guardian: "Responsável",
  teacher: "Professor",
  instructor: "Instrutor",
  owner: "Controlador",
  assistant: "Assistente",
  supporter: "Apoiador",
  sponsor: "Patrocinador",
  social: "Comunicação",
};

export const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  pending_approval: { label: "Pendente", variant: "gold" },
  waiting_email_confirmation: { label: "Aguardando e-mail", variant: "warning" },
  waiting_medical_history: { label: "Aguardando anamnese", variant: "warning" },
  pending_medical_history_approval: { label: "Anamnese em revisão", variant: "warning" },
  waiting_registration_review: { label: "Em revisão", variant: "warning" },
  revised_registration: { label: "Revisão enviada", variant: "warning" },
  approved: { label: "Aprovado", variant: "success" },
  rejected: { label: "Rejeitado", variant: "error" },
  expelled: { label: "Suspenso", variant: "error" },
  archived: { label: "Arquivado", variant: "muted" },
  incomplete: { label: "Incompleto", variant: "muted" },
};

export const AUTH_PROVIDER_LABELS: Record<string, string> = {
  password: "E-mail e senha",
  "google.com": "Google",
  guardian_created: "Criado por responsável",
};

export const GENDER_LABELS: Record<string, string> = {
  male: "Masculino",
  female: "Feminino",
};

export const RELATIONSHIP_LABELS: Record<string, string> = {
  mother: "Mãe",
  father: "Pai",
  grandmother: "Avó",
  grandfather: "Avô",
  aunt: "Tia",
  uncle: "Tio",
  sister: "Irmã",
  brother: "Irmão",
  guardian: "Responsável legal",
  other: "Outro",
};

export function calcAge(birthDate?: string | null): number | null {
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

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch {
    return iso;
  }
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return iso;
  }
}
