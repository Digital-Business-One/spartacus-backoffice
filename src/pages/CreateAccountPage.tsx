import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { api, ApiError, checkEmail } from "../lib/api";
import { DatePicker } from "../components/DatePicker";
import { ClassSelector } from "../components/ClassSelector";

/* ── Types ─────────────────────────────────────────────────────────────────── */

type AuthMethod = "email" | "google";
type Role = "student" | "guardian" | "teacher" | "instructor" | "supporter" | "sponsor";

interface Dependent {
  id: string;
  name: string;
  birthDate: string;
  gender: "male" | "female";
  classIds: string[];
}

interface WizardState {
  authMethod: AuthMethod | null;
  email: string;
  password: string;
  passwordConfirm: string;
  roles: Role[];
  name: string;
  birthDate: string;
  gender: "male" | "female" | "";
  phone: string;
  whatsapp: string;
  samePhone: boolean;
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  classIds: string[];
  dependents: Dependent[];
}

const INITIAL: WizardState = {
  authMethod: null,
  email: "",
  password: "",
  passwordConfirm: "",
  roles: [],
  name: "",
  birthDate: "",
  gender: "",
  phone: "",
  whatsapp: "",
  samePhone: true,
  postalCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  classIds: [],
  dependents: [],
};

/* ── Constants ─────────────────────────────────────────────────────────────── */

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "spartacus-artes-marciais";
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const ROLES: { code: Role; label: string; icon: string; desc: string }[] = [
  { code: "student", label: "Aluno", icon: "🥋", desc: "Praticante de artes marciais no projeto" },
  { code: "guardian", label: "Responsável", icon: "👨‍👧", desc: "Responsável por alunos menores de idade" },
  { code: "teacher", label: "Professor", icon: "🏅", desc: "Professor com acesso completo às turmas" },
  { code: "instructor", label: "Instrutor", icon: "🎯", desc: "Instrutor auxiliar com acesso reduzido" },
  { code: "supporter", label: "Apoiador", icon: "❤️", desc: "Apoiador da comunidade (pessoa física)" },
  { code: "sponsor", label: "Patrocinador", icon: "🏢", desc: "Patrocinador do projeto (PF ou PJ)" },
];

const CLASS_ROLES: Role[] = ["student", "teacher", "instructor"];

const STEPS = [
  "Método", "Acesso", "Perfil", "Dados Pessoais", "Contato", "Endereço",
  "Dependentes", "Turmas", "Revisão",
];

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function formatCEP(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

async function fetchCEP(cep: string) {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return data as { logradouro?: string; bairro?: string; localidade?: string; uf?: string };
  } catch {
    return null;
  }
}

interface ClassOut {
  id: string;
  name: string;
  modality: string;
  schedule: string;
  teacher?: string;
}

/** Fetch classes from the public endpoint (no auth needed). */
async function fetchClasses(): Promise<ClassOut[]> {
  try {
    const res = await fetch(`${BASE_URL}/projects/${PROJECT_ID}/classes`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.classes ?? [];
  } catch {
    return [];
  }
}

function calcAge(birthDate: string): number | null {
  const parts = birthDate.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year || year < 1900) return null;
  const dob = new Date(year, month - 1, day);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

/* ── Main Component ────────────────────────────────────────────────────────── */

export function CreateAccountPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupComplete, setSignupComplete] = useState(false);

  function update(fields: Partial<WizardState>) {
    setData((prev) => ({ ...prev, ...fields }));
  }

  function next() { setError(null); setStep((s) => s + 1); }
  function back() { setError(null); setStep((s) => s - 1); }

  const hasClassRole = data.roles.some((r) => CLASS_ROLES.includes(r));
  const isGuardian = data.roles.includes("guardian");

  const visibleSteps = STEPS.filter((s) => {
    if (s === "Acesso" && data.authMethod === "google") return false;
    if (s === "Dependentes" && !isGuardian) return false;
    if (s === "Turmas" && !hasClassRole) return false;
    return true;
  });

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        authMethod: data.authMethod,
        email: data.email,
        password: data.authMethod === "email" ? data.password : undefined,
        name: data.name,
        birthDate: data.birthDate,
        gender: data.gender,
        phone: data.phone.replace(/\D/g, ""),
        whatsapp: (data.samePhone ? data.phone : data.whatsapp).replace(/\D/g, ""),
        postalCode: data.postalCode.replace(/\D/g, ""),
        street: data.street,
        number: data.number,
        complement: data.complement || undefined,
        neighborhood: data.neighborhood,
        state: data.state,
        city: data.city,
        roles: data.roles,
        dependents: data.dependents.map((d) => ({
          id: d.id,
          name: d.name,
          birthDate: d.birthDate,
          gender: d.gender,
          classIds: d.classIds,
        })),
        classIds: data.classIds,
      };
      await api.post("/auth/signup", payload);
      setSignupComplete(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError("Já existe uma conta com esses dados. Se você já tem uma conta, faça login.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Erro inesperado. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (signupComplete) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ maxWidth: 480 }}>
          <div className="login-brand">
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✉️</div>
            <h1>E-mail enviado</h1>
            <p>Confirme seu cadastro</p>
          </div>
          <p style={{ color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6, marginBottom: "0.5rem" }}>
            Enviamos um link de confirmação para:
          </p>
          <p style={{ color: "var(--gold)", textAlign: "center", fontWeight: 600, fontSize: "1.1rem", marginBottom: "1.5rem" }}>
            {data.email}
          </p>
          <div className="notice" style={{ marginBottom: "1.5rem" }}>
            <span>ℹ️</span>
            <span>Sua conta será revisada pela equipe antes da ativação. Você receberá uma notificação assim que aprovada.</span>
          </div>
          <p style={{ color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Verifique sua caixa de entrada (e o spam) e clique no link para continuar o cadastro.
          </p>
          <Link to="/" className="btn btn-outline" style={{ width: "100%", textAlign: "center" }}>
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2>Nova Conta</h2>
        <p>{visibleSteps[step] ?? ""}</p>
      </div>

      <div className="wizard-container">
        <div className="wizard-steps">
          {visibleSteps.map((_, i) => (
            <div key={i} className={`wizard-step ${i < step ? "done" : ""} ${i === step ? "active" : ""}`} />
          ))}
        </div>

        <div className="wizard-card">
          {step === 0 && (
            <StepAuthMethod onSelect={(method, email) => {
              update({ authMethod: method, email: email ?? "" });
              method === "google" ? setStep(1) : next();
            }} />
          )}
          {visibleSteps[step] === "Acesso" && <StepCredentials data={data} update={update} next={next} back={back} />}
          {visibleSteps[step] === "Perfil" && <StepProfile data={data} update={update} next={next} back={back} />}
          {visibleSteps[step] === "Dados Pessoais" && <StepPersonal data={data} update={update} next={next} back={back} />}
          {visibleSteps[step] === "Contato" && <StepContact data={data} update={update} next={next} back={back} />}
          {visibleSteps[step] === "Endereço" && <StepAddress data={data} update={update} next={next} back={back} />}
          {visibleSteps[step] === "Dependentes" && <StepDependents data={data} update={update} next={next} back={back} />}
          {visibleSteps[step] === "Turmas" && <StepClasses data={data} update={update} next={next} back={back} />}
          {visibleSteps[step] === "Revisão" && <StepReview data={data} loading={loading} error={error} onSubmit={handleSubmit} back={back} />}
        </div>
      </div>
    </>
  );
}

/* ── Step 0: Auth Method ───────────────────────────────────────────────────── */

function StepAuthMethod({ onSelect }: { onSelect: (m: AuthMethod, email?: string) => void }) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function handleGoogle() {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onSelect("google", result.user.email ?? "");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setGoogleLoading(false);
        return;
      }
      setGoogleError("Erro ao conectar com o Google. Tente novamente.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <h3>Criar Conta</h3>
      <p>Escolha como deseja criar a conta.</p>
      <div className="method-cards">
        <div className="method-card" onClick={() => onSelect("email")}>
          <div className="method-icon">✉️</div>
          <div className="method-body">
            <div className="method-title">E-mail e Senha</div>
            <div className="method-desc">Crie uma conta com e-mail e uma senha segura</div>
          </div>
          <div className="method-chevron">›</div>
        </div>
        <div
          className={`method-card ${googleLoading ? "disabled" : ""}`}
          onClick={googleLoading ? undefined : handleGoogle}
          style={googleLoading ? { opacity: 0.6, pointerEvents: "none" } : undefined}
        >
          <div className="method-icon method-icon-google">G</div>
          <div className="method-body">
            <div className="method-title">{googleLoading ? "Aguarde..." : "Google"}</div>
            <div className="method-desc">Use sua conta Google para entrar com um clique</div>
          </div>
          <div className="method-chevron">›</div>
        </div>
      </div>
      {googleError && <div className="login-error" style={{ marginTop: "0.75rem", textAlign: "center" }}>{googleError}</div>}
      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Já tem conta? </span>
        <Link to="/" style={{ fontSize: "0.85rem" }}>Entrar</Link>
      </div>
    </>
  );
}

/* ── Step 0b: Credentials ──────────────────────────────────────────────────── */

function StepCredentials({
  data, update, next, back,
}: { data: WizardState; update: (f: Partial<WizardState>) => void; next: () => void; back: () => void }) {
  const emailRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    emailRef.current?.focus();
    return () => { abortRef.current?.abort(); };
  }, []);

  async function handleEmailBlur() {
    const email = data.email.trim();
    if (!email || !isValidEmail(email)) {
      if (email && !isValidEmail(email)) setErrors((p) => ({ ...p, email: "E-mail inválido" }));
      return;
    }
    setErrors((p) => { const n = { ...p }; delete n.email; return n; });
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setCheckingEmail(true);
    try {
      const { available } = await checkEmail(email, controller.signal);
      if (!available) setErrors((p) => ({ ...p, email: "Este e-mail já está cadastrado" }));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
    } finally {
      setCheckingEmail(false);
    }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!isValidEmail(data.email)) e.email = "E-mail inválido";
    if (data.password.length < 8) e.password = "A senha deve ter no mínimo 8 caracteres";
    if (data.password !== data.passwordConfirm) e.passwordConfirm = "As senhas não coincidem";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (validate()) next();
  }

  const canContinue = data.email.length > 0 && data.password.length >= 8 && data.passwordConfirm.length > 0 && !checkingEmail && !errors.email;

  return (
    <form onSubmit={handleSubmit}>
      <h3>E-mail e Senha</h3>
      <p>Esses dados serão usados para acessar a conta.</p>
      <div className="wizard-form">
        <div className="form-group">
          <label>E-mail {checkingEmail && <span className="loading-spinner" />}</label>
          <input ref={emailRef} className="form-input" type="email" placeholder="Informe seu e-mail" value={data.email}
            onChange={(e) => { update({ email: e.target.value }); if (errors.email) setErrors((p) => { const n = { ...p }; delete n.email; return n; }); }}
            onBlur={handleEmailBlur} required />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label>Senha</label>
          <input className="form-input" type="password" placeholder="Crie uma senha (mín. 8 caracteres)" value={data.password}
            onChange={(e) => update({ password: e.target.value })}
            onBlur={() => { if (data.password.length > 0 && data.password.length < 8) setErrors((p) => ({ ...p, password: "A senha deve ter no mínimo 8 caracteres" })); else setErrors((p) => { const n = { ...p }; delete n.password; return n; }); }}
            required />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>
        <div className="form-group">
          <label>Confirmar senha</label>
          <input className="form-input" type="password" placeholder="Repita a senha" value={data.passwordConfirm}
            onChange={(e) => update({ passwordConfirm: e.target.value })}
            onBlur={() => { if (data.passwordConfirm.length > 0 && data.passwordConfirm !== data.password) setErrors((p) => ({ ...p, passwordConfirm: "As senhas não coincidem" })); else setErrors((p) => { const n = { ...p }; delete n.passwordConfirm; return n; }); }}
            required />
          {errors.passwordConfirm && <span className="field-error">{errors.passwordConfirm}</span>}
        </div>
      </div>
      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back}>Voltar</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!canContinue}>Próximo</button>
      </div>
    </form>
  );
}

/* ── Step 1: Profile / Roles ───────────────────────────────────────────────── */

function StepProfile({
  data, update, next, back,
}: { data: WizardState; update: (f: Partial<WizardState>) => void; next: () => void; back: () => void }) {
  function toggleRole(role: Role) {
    const current = new Set(data.roles);
    if (current.has(role)) current.delete(role); else current.add(role);
    update({ roles: Array.from(current) });
  }

  return (
    <>
      <h3>Seu perfil</h3>
      <p>Selecione todos os perfis que se aplicam. Você pode ter mais de um.</p>
      <div className="role-grid">
        {ROLES.map((r) => (
          <div key={r.code} className={`role-card ${data.roles.includes(r.code) ? "selected" : ""}`} onClick={() => toggleRole(r.code)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: "1.75rem" }}>{r.icon}</div>
              <div className={`check-circle ${data.roles.includes(r.code) ? "checked" : ""}`}>
                {data.roles.includes(r.code) && "✓"}
              </div>
            </div>
            <div className="role-card-title">{r.label}</div>
            <div className="role-card-desc">{r.desc}</div>
          </div>
        ))}
      </div>
      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back}>Voltar</button>
        <button className="btn btn-primary btn-sm" onClick={next} disabled={data.roles.length === 0}>Próximo</button>
      </div>
    </>
  );
}

/* ── Step 2: Personal Data ─────────────────────────────────────────────────── */

function StepPersonal({
  data, update, next, back,
}: { data: WizardState; update: (f: Partial<WizardState>) => void; next: () => void; back: () => void }) {
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  function handleSubmit(e: FormEvent) { e.preventDefault(); next(); }
  const canContinue = data.name.trim().length >= 3 && data.birthDate.length === 10 && data.gender !== "";

  return (
    <form onSubmit={handleSubmit}>
      <h3>Dados Pessoais</h3>
      <p>Precisamos de algumas informações para criar o perfil.</p>
      <div className="wizard-form">
        <div className="form-group">
          <label>Nome completo</label>
          <input ref={nameRef} className="form-input" placeholder="Informe seu nome completo" value={data.name} onChange={(e) => update({ name: e.target.value })} required />
        </div>
        <DatePicker label="Data de nascimento" value={data.birthDate} onChange={(v) => update({ birthDate: v })} required />
        <div className="form-group">
          <label>Gênero</label>
          <div className="gender-row">
            <div className={`gender-option ${data.gender === "male" ? "active" : ""}`} onClick={() => update({ gender: "male" })}>Masculino</div>
            <div className={`gender-option ${data.gender === "female" ? "active" : ""}`} onClick={() => update({ gender: "female" })}>Feminino</div>
          </div>
        </div>
      </div>
      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back}>Voltar</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!canContinue}>Próximo</button>
      </div>
    </form>
  );
}

/* ── Step 3: Contact ───────────────────────────────────────────────────────── */

function StepContact({
  data, update, next, back,
}: { data: WizardState; update: (f: Partial<WizardState>) => void; next: () => void; back: () => void }) {
  const phoneRef = useRef<HTMLInputElement>(null);
  useEffect(() => { phoneRef.current?.focus(); }, []);

  function handlePhoneChange(e: ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value);
    update({ phone: formatted, ...(data.samePhone ? { whatsapp: formatted } : {}) });
  }

  function toggleSamePhone() {
    const val = !data.samePhone;
    update({ samePhone: val, whatsapp: val ? data.phone : "" });
  }

  function handleSubmit(e: FormEvent) { e.preventDefault(); next(); }

  const phoneDigits = data.phone.replace(/\D/g, "").length;
  const whatsappOk = data.samePhone || data.whatsapp.replace(/\D/g, "").length >= 10;
  const canContinue = phoneDigits >= 10 && whatsappOk;

  return (
    <form onSubmit={handleSubmit}>
      <h3>Contato</h3>
      <p>Seus dados de contato para que a equipe possa te alcançar.</p>
      <div className="wizard-form">
        <div className="form-group">
          <label>Celular</label>
          <input ref={phoneRef} className="form-input" placeholder="Informe o número" value={data.phone} onChange={handlePhoneChange} maxLength={15} required />
        </div>
        <div className="form-group">
          <label className="checkbox-row" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={data.samePhone} onChange={toggleSamePhone} className="checkbox-input" />
            <span style={{ textTransform: "none", letterSpacing: "normal", fontWeight: 400 }}>Meu celular e WhatsApp são iguais</span>
          </label>
          {!data.samePhone && (
            <div className="form-group" style={{ marginTop: "0.5rem" }}>
              <label>WhatsApp</label>
              <input className="form-input" placeholder="Informe o número" value={data.whatsapp} onChange={(e) => update({ whatsapp: formatPhone(e.target.value) })} maxLength={15} required />
            </div>
          )}
        </div>
      </div>
      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back}>Voltar</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!canContinue}>Próximo</button>
      </div>
    </form>
  );
}

/* ── Step 4: Address ───────────────────────────────────────────────────────── */

function StepAddress({
  data, update, next, back,
}: { data: WizardState; update: (f: Partial<WizardState>) => void; next: () => void; back: () => void }) {
  const cepRef = useRef<HTMLInputElement>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  useEffect(() => { cepRef.current?.focus(); }, []);

  async function handleCEPBlur() {
    const digits = data.postalCode.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoadingCep(true);
    const result = await fetchCEP(digits);
    setLoadingCep(false);
    if (result) update({ street: result.logradouro ?? "", neighborhood: result.bairro ?? "", city: result.localidade ?? "", state: result.uf ?? "" });
  }

  function handleSubmit(e: FormEvent) { e.preventDefault(); next(); }

  const canContinue =
    data.postalCode.replace(/\D/g, "").length === 8 &&
    data.street.trim() !== "" && data.number.trim() !== "" &&
    data.neighborhood.trim() !== "" && data.city.trim() !== "" && data.state.trim().length === 2;

  return (
    <form onSubmit={handleSubmit}>
      <h3>Endereço</h3>
      <p>Informe o endereço. Digite o CEP para preenchimento automático.</p>
      <div className="wizard-form">
        <div className="form-group">
          <label>CEP {loadingCep && <span className="loading-spinner" />}</label>
          <input ref={cepRef} className="form-input" placeholder="Informe o CEP" value={data.postalCode}
            onChange={(e) => update({ postalCode: formatCEP(e.target.value) })} onBlur={handleCEPBlur} maxLength={9} required style={{ maxWidth: 200 }} />
        </div>
        <div className="form-group">
          <label>Logradouro</label>
          <input className="form-input" placeholder="Informe o logradouro" value={data.street} onChange={(e) => update({ street: e.target.value })} required />
        </div>
        <div className="wizard-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Número</label>
            <input className="form-input" placeholder="N.º" value={data.number} onChange={(e) => update({ number: e.target.value })} required />
          </div>
          <div className="form-group" style={{ flex: 3 }}>
            <label>Complemento</label>
            <input className="form-input" placeholder="Ex: Apto, Bloco" value={data.complement} onChange={(e) => update({ complement: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Bairro</label>
          <input className="form-input" placeholder="Informe o bairro" value={data.neighborhood} onChange={(e) => update({ neighborhood: e.target.value })} required />
        </div>
        <div className="wizard-row">
          <div className="form-group" style={{ flex: 3 }}>
            <label>Cidade</label>
            <input className="form-input" placeholder="Informe a cidade" value={data.city} onChange={(e) => update({ city: e.target.value })} required />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label>UF</label>
            <input className="form-input" placeholder="UF" maxLength={2} value={data.state} onChange={(e) => update({ state: e.target.value.toUpperCase() })} required />
          </div>
        </div>
      </div>
      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back}>Voltar</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!canContinue}>Próximo</button>
      </div>
    </form>
  );
}

/* ── Step 5: Dependents (guardian flow) ─────────────────────────────────────── */

function StepDependents({
  data, update, next, back,
}: { data: WizardState; update: (f: Partial<WizardState>) => void; next: () => void; back: () => void }) {
  const [mode, setMode] = useState<"list" | "form" | "turmas">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<ClassOut[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(true);

  // Form fields for dependent
  const [depName, setDepName] = useState("");
  const [depBirth, setDepBirth] = useState("");
  const [depGender, setDepGender] = useState<"male" | "female" | "">("");

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClasses().then((c) => { setTurmas(c); setLoadingTurmas(false); });
  }, []);

  useEffect(() => {
    if (mode === "form") nameRef.current?.focus();
  }, [mode]);

  function startAdd() {
    setEditingId(null);
    setDepName(""); setDepBirth(""); setDepGender("");
    setMode("form");
  }

  function startEdit(dep: Dependent) {
    setEditingId(dep.id);
    setDepName(dep.name); setDepBirth(dep.birthDate); setDepGender(dep.gender);
    setMode("form");
  }

  function saveDepAndGoTurmas() {
    if (editingId) {
      const updated = data.dependents.map((d) =>
        d.id === editingId ? { ...d, name: depName, birthDate: depBirth, gender: depGender as "male" | "female" } : d
      );
      update({ dependents: updated });
      setMode("turmas");
    } else {
      const newId = `dep-${Date.now()}`;
      const newDep: Dependent = { id: newId, name: depName, birthDate: depBirth, gender: depGender as "male" | "female", classIds: [] };
      update({ dependents: [...data.dependents, newDep] });
      setEditingId(newId);
      setMode("turmas");
    }
  }

  function toggleDepClass(classId: string) {
    if (!editingId) return;
    const updated = data.dependents.map((d) => {
      if (d.id !== editingId) return d;
      const ids = new Set(d.classIds);
      if (ids.has(classId)) ids.delete(classId); else ids.add(classId);
      return { ...d, classIds: Array.from(ids) };
    });
    update({ dependents: updated });
  }

  function finishDepTurmas() {
    setEditingId(null);
    setMode("list");
  }

  function removeDep(id: string) {
    update({ dependents: data.dependents.filter((d) => d.id !== id) });
  }

  const depFormValid = depName.trim().length >= 2 && depBirth.length === 10 && depGender !== "";
  const currentDep = editingId ? data.dependents.find((d) => d.id === editingId) : null;
  const firstName = depName.trim().split(" ")[0] || "dependente";
  const age = calcAge(depBirth);

  // --- Dependent form ---
  if (mode === "form") {
    return (
      <>
        <h3>{editingId ? "Editar dependente" : `Dependente ${data.dependents.length + 1}`}</h3>
        <p>{editingId ? `Atualize os dados de ${depName.split(" ")[0]}.` : "Informe os dados do dependente."}</p>

        {age !== null && age >= 0 && (
          <span className="chip" style={{ marginBottom: "0.75rem", display: "inline-block" }}>🎂 {age} anos</span>
        )}

        <div className="wizard-form">
          <div className="form-group">
            <label>Nome completo</label>
            <input ref={nameRef} className="form-input" placeholder="Informe o nome do dependente" value={depName} onChange={(e) => setDepName(e.target.value)} required />
          </div>
          <DatePicker label="Data de nascimento" value={depBirth} onChange={setDepBirth} required />
          <div className="form-group">
            <label>Gênero</label>
            <div className="gender-row">
              <div className={`gender-option ${depGender === "male" ? "active" : ""}`} onClick={() => setDepGender("male")}>Masculino</div>
              <div className={`gender-option ${depGender === "female" ? "active" : ""}`} onClick={() => setDepGender("female")}>Feminino</div>
            </div>
          </div>
        </div>
        <div className="wizard-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setMode("list"); setEditingId(null); }}>Voltar</button>
          <button className="btn btn-primary btn-sm" onClick={saveDepAndGoTurmas} disabled={!depFormValid}>
            Continuar → Turmas de {firstName}
          </button>
        </div>
      </>
    );
  }

  // --- Dependent turmas ---
  if (mode === "turmas" && currentDep) {
    return (
      <>
        <h3>Turmas de {currentDep.name.split(" ")[0]}</h3>
        <p>Selecione as turmas para este dependente.</p>
        <ClassSelector classes={turmas} loading={loadingTurmas} selected={currentDep.classIds} onToggle={toggleDepClass} />
        <div className="wizard-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setMode("form")}>Voltar</button>
          <button className="btn btn-primary btn-sm" onClick={finishDepTurmas}>Confirmar</button>
        </div>
      </>
    );
  }

  // --- Dependent list ---
  return (
    <>
      <h3>Dependentes</h3>
      <p>
        {data.dependents.length === 0
          ? "Nenhum dependente adicionado ainda."
          : `${data.dependents.length} dependente${data.dependents.length !== 1 ? "s" : ""} adicionado${data.dependents.length !== 1 ? "s" : ""}.`}
      </p>

      <div className="wizard-form">
        {data.dependents.map((dep) => (
          <div key={dep.id} className="dep-card">
            <div className="dep-card-header">
              <div className="dep-avatar">{dep.name.charAt(0).toUpperCase()}</div>
              <div className="dep-info">
                <div className="dep-name">{dep.name}</div>
                <div className="dep-sub">
                  {dep.birthDate}
                  {dep.classIds.length > 0 ? ` · ${dep.classIds.length} turma${dep.classIds.length !== 1 ? "s" : ""}` : " · Sem turmas"}
                </div>
              </div>
              <button type="button" className="dep-remove" onClick={() => removeDep(dep.id)} title="Remover">✕</button>
            </div>
            <div className="dep-actions">
              <button type="button" className="dep-action-btn" onClick={() => startEdit(dep)}>Editar dados</button>
              <button type="button" className="dep-action-btn" onClick={() => { setEditingId(dep.id); setMode("turmas"); }}>Editar turmas</button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="add-more-btn" onClick={startAdd} style={{ marginTop: "1rem" }}>
        <span>+</span> Adicionar dependente
      </button>

      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back}>Voltar</button>
        <button className="btn btn-primary btn-sm" onClick={next} disabled={data.dependents.length === 0}>Próximo</button>
      </div>
    </>
  );
}

/* ── Step 6: Class Selection (student/teacher/instructor) ──────────────────── */

function StepClasses({
  data, update, next, back,
}: { data: WizardState; update: (f: Partial<WizardState>) => void; next: () => void; back: () => void }) {
  const [turmas, setTurmas] = useState<ClassOut[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(true);

  useEffect(() => {
    fetchClasses().then((c) => { setTurmas(c); setLoadingTurmas(false); });
  }, []);

  function toggleClass(id: string) {
    const current = new Set(data.classIds);
    if (current.has(id)) current.delete(id); else current.add(id);
    update({ classIds: Array.from(current) });
  }

  return (
    <>
      <h3>Suas Turmas</h3>
      <p>Selecione as turmas em que vai participar.</p>
      <ClassSelector classes={turmas} loading={loadingTurmas} selected={data.classIds} onToggle={toggleClass} />
      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back}>Voltar</button>
        <button className="btn btn-primary btn-sm" onClick={next}>Próximo</button>
      </div>
    </>
  );
}

/* ── Step 7: Review ────────────────────────────────────────────────────────── */

function StepReview({
  data, loading, error, onSubmit, back,
}: { data: WizardState; loading: boolean; error: string | null; onSubmit: () => void; back: () => void }) {
  const roleLabels = ROLES.reduce((acc, r) => ({ ...acc, [r.code]: r.label }), {} as Record<string, string>);

  return (
    <>
      <h3>Revisar dados</h3>
      <p>Confira as informações antes de enviar para aprovação.</p>

      <div className="review-sections">
        <ReviewSection title="Dados Pessoais">
          <ReviewRow label="Nome" value={data.name} />
          <ReviewRow label="Data de nasc." value={data.birthDate} />
          <ReviewRow label="Gênero" value={data.gender === "male" ? "Masculino" : "Feminino"} />
        </ReviewSection>

        <ReviewSection title="Contato">
          <ReviewRow label="Celular" value={data.phone} />
          <ReviewRow label="WhatsApp" value={data.samePhone ? data.phone : data.whatsapp} />
        </ReviewSection>

        <ReviewSection title="Endereço">
          <ReviewRow label="Endereço" value={[data.street, data.number, data.complement].filter(Boolean).join(", ")} />
          <ReviewRow label="Bairro" value={data.neighborhood} />
          <ReviewRow label="Cidade/UF" value={`${data.city}/${data.state}`} />
          <ReviewRow label="CEP" value={data.postalCode} />
        </ReviewSection>

        <ReviewSection title="Perfis">
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", padding: "0.5rem 0" }}>
            {data.roles.map((r) => <span key={r} className="chip">{roleLabels[r] ?? r}</span>)}
          </div>
        </ReviewSection>

        {data.dependents.length > 0 && (
          <ReviewSection title="Dependentes">
            {data.dependents.map((dep) => (
              <div key={dep.id} className="review-row">
                <span className="review-row-label">{dep.name}</span>
                <span className="review-row-value">{dep.birthDate} · {dep.classIds.length} turma(s)</span>
              </div>
            ))}
          </ReviewSection>
        )}

        {data.classIds.length > 0 && (
          <ReviewSection title="Turmas selecionadas">
            <ReviewRow label="Total" value={`${data.classIds.length} turma(s)`} />
          </ReviewSection>
        )}
      </div>

      <div className="notice" style={{ marginTop: "1rem" }}>
        <span>ℹ️</span>
        <span>Sua conta será revisada pela equipe antes da ativação. Você receberá uma notificação assim que aprovada.</span>
      </div>

      {error && <div className="login-error" style={{ marginTop: "1rem" }}>{error}</div>}

      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back} disabled={loading}>Voltar</button>
        <button className="btn btn-primary btn-sm" onClick={onSubmit} disabled={loading}>
          {loading ? "Enviando..." : "Enviar para aprovação"}
        </button>
      </div>
    </>
  );
}

/* ── Review sub-components ─────────────────────────────────────────────────── */

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="review-section">
      <div className="review-section-title">{title}</div>
      <div className="review-section-card">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="review-row">
      <span className="review-row-label">{label}</span>
      <span className="review-row-value">{value || "—"}</span>
    </div>
  );
}
