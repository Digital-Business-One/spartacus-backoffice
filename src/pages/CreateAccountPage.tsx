import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";

type Role = "owner" | "teacher" | "instructor" | "assistant";

interface WizardState {
  role: Role | null;
  name: string;
  email: string;
  password: string;
  birthDate: string;
  phone: string;
  whatsapp: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const INITIAL: WizardState = {
  role: null,
  name: "",
  email: "",
  password: "",
  birthDate: "",
  phone: "",
  whatsapp: "",
  postalCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

const ROLES: { code: Role; label: string; icon: string; desc: string }[] = [
  { code: "owner", label: "Controlador", icon: "👑", desc: "Fundador / responsável legal" },
  { code: "assistant", label: "Assistente", icon: "📎", desc: "Secretária administrativa" },
  { code: "teacher", label: "Professor", icon: "🥋", desc: "Gestão completa de turmas" },
  { code: "instructor", label: "Instrutor", icon: "🎯", desc: "Auxílio em turmas" },
];

const STEPS = ["Perfil", "Dados Pessoais", "Contato", "Endereço", "Revisão"];

export function CreateAccountPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupComplete, setSignupComplete] = useState(false);

  function update(fields: Partial<WizardState>) {
    setData((prev) => ({ ...prev, ...fields }));
  }

  function next() {
    setError(null);
    setStep((s) => s + 1);
  }
  function back() {
    setError(null);
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        authMethod: "email",
        email: data.email,
        password: data.password,
        name: data.name,
        birthDate: data.birthDate,
        phone: data.phone.replace(/\D/g, ""),
        whatsapp: data.whatsapp.replace(/\D/g, ""),
        postalCode: data.postalCode,
        street: data.street,
        number: data.number,
        complement: data.complement || undefined,
        neighborhood: data.neighborhood,
        state: data.state,
        city: data.city,
        roles: [data.role],
        dependents: [],
        classIds: [],
      };
      await api.post("/auth/signup", payload);
      setSignupComplete(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
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
        <p>{STEPS[step]}</p>
      </div>

      <div className="wizard-container">
        <div className="wizard-steps">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`wizard-step ${i < step ? "done" : ""} ${i === step ? "active" : ""}`}
            />
          ))}
        </div>

        <div className="wizard-card">
          {step === 0 && <StepRole role={data.role} onSelect={(r) => { update({ role: r }); next(); }} />}
          {step === 1 && <StepPersonal data={data} update={update} next={next} back={back} />}
          {step === 2 && <StepContact data={data} update={update} next={next} back={back} />}
          {step === 3 && <StepAddress data={data} update={update} next={next} back={back} />}
          {step === 4 && (
            <StepReview
              data={data}
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
              back={back}
            />
          )}
        </div>
      </div>
    </>
  );
}

function StepRole({ role, onSelect }: { role: Role | null; onSelect: (r: Role) => void }) {
  return (
    <>
      <h3>Selecione o perfil</h3>
      <p>Escolha o tipo de conta a ser criada.</p>
      <div className="role-grid">
        {ROLES.map((r) => (
          <div
            key={r.code}
            className={`role-card ${role === r.code ? "selected" : ""}`}
            onClick={() => onSelect(r.code)}
          >
            <div style={{ fontSize: "1.75rem" }}>{r.icon}</div>
            <div className="role-card-title">{r.label}</div>
            <div className="role-card-desc">{r.desc}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function StepPersonal({
  data, update, next, back,
}: { data: WizardState; update: (f: Partial<WizardState>) => void; next: () => void; back: () => void }) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    next();
  }
  return (
    <form onSubmit={handleSubmit}>
      <h3>Dados Pessoais</h3>
      <p>Informações básicas da conta.</p>
      <div className="wizard-form">
        <div className="form-group">
          <label>Nome completo</label>
          <input className="form-input" value={data.name} onChange={(e) => update({ name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input className="form-input" type="email" value={data.email} onChange={(e) => update({ email: e.target.value })} required />
        </div>
        <div className="wizard-row">
          <div className="form-group">
            <label>Senha</label>
            <input className="form-input" type="password" minLength={8} value={data.password} onChange={(e) => update({ password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Data de nascimento</label>
            <input className="form-input" placeholder="DD/MM/AAAA" value={data.birthDate} onChange={(e) => update({ birthDate: e.target.value })} required />
          </div>
        </div>
      </div>
      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back}>Voltar</button>
        <button type="submit" className="btn btn-primary btn-sm">Próximo</button>
      </div>
    </form>
  );
}

function StepContact({
  data, update, next, back,
}: { data: WizardState; update: (f: Partial<WizardState>) => void; next: () => void; back: () => void }) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    next();
  }
  return (
    <form onSubmit={handleSubmit}>
      <h3>Contato</h3>
      <p>Telefone e WhatsApp.</p>
      <div className="wizard-form">
        <div className="wizard-row">
          <div className="form-group">
            <label>Celular</label>
            <input className="form-input" placeholder="(65) 99999-9999" value={data.phone} onChange={(e) => update({ phone: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>WhatsApp</label>
            <input className="form-input" placeholder="(65) 99999-9999" value={data.whatsapp} onChange={(e) => update({ whatsapp: e.target.value })} required />
          </div>
        </div>
      </div>
      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back}>Voltar</button>
        <button type="submit" className="btn btn-primary btn-sm">Próximo</button>
      </div>
    </form>
  );
}

function StepAddress({
  data, update, next, back,
}: { data: WizardState; update: (f: Partial<WizardState>) => void; next: () => void; back: () => void }) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    next();
  }
  return (
    <form onSubmit={handleSubmit}>
      <h3>Endereço</h3>
      <p>Endereço completo.</p>
      <div className="wizard-form">
        <div className="form-group">
          <label>CEP</label>
          <input className="form-input" value={data.postalCode} onChange={(e) => update({ postalCode: e.target.value })} required style={{ maxWidth: 200 }} />
        </div>
        <div className="wizard-row">
          <div className="form-group">
            <label>Rua</label>
            <input className="form-input" value={data.street} onChange={(e) => update({ street: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Número</label>
            <input className="form-input" value={data.number} onChange={(e) => update({ number: e.target.value })} required />
          </div>
        </div>
        <div className="form-group">
          <label>Complemento</label>
          <input className="form-input" value={data.complement} onChange={(e) => update({ complement: e.target.value })} />
        </div>
        <div className="wizard-row">
          <div className="form-group">
            <label>Bairro</label>
            <input className="form-input" value={data.neighborhood} onChange={(e) => update({ neighborhood: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Cidade</label>
            <input className="form-input" value={data.city} onChange={(e) => update({ city: e.target.value })} required />
          </div>
        </div>
        <div className="form-group">
          <label>Estado</label>
          <input className="form-input" placeholder="MT" maxLength={2} value={data.state} onChange={(e) => update({ state: e.target.value.toUpperCase() })} required style={{ maxWidth: 100 }} />
        </div>
      </div>
      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back}>Voltar</button>
        <button type="submit" className="btn btn-primary btn-sm">Próximo</button>
      </div>
    </form>
  );
}

function StepReview({
  data, loading, error, onSubmit, back,
}: { data: WizardState; loading: boolean; error: string | null; onSubmit: () => void; back: () => void }) {
  const roleLabel = ROLES.find((r) => r.code === data.role)?.label ?? data.role ?? "";
  return (
    <>
      <h3>Revisão</h3>
      <p>Confirme os dados antes de criar a conta.</p>
      <div className="wizard-form" style={{ gap: "0.5rem" }}>
        <ReviewRow label="Perfil" value={roleLabel} />
        <ReviewRow label="Nome" value={data.name} />
        <ReviewRow label="Email" value={data.email} />
        <ReviewRow label="Nascimento" value={data.birthDate} />
        <ReviewRow label="Celular" value={data.phone} />
        <ReviewRow label="WhatsApp" value={data.whatsapp} />
        <ReviewRow label="Endereço" value={`${data.street}, ${data.number}${data.complement ? ` - ${data.complement}` : ""}`} />
        <ReviewRow label="Bairro" value={data.neighborhood} />
        <ReviewRow label="Cidade/UF" value={`${data.city}/${data.state}`} />
        <ReviewRow label="CEP" value={data.postalCode} />
      </div>
      {error && <div className="login-error" style={{ marginTop: "1rem" }}>{error}</div>}
      <div className="wizard-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={back} disabled={loading}>Voltar</button>
        <button className="btn btn-primary btn-sm" onClick={onSubmit} disabled={loading}>
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </div>
    </>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{label}</span>
      <span style={{ fontSize: "0.85rem" }}>{value || "—"}</span>
    </div>
  );
}
