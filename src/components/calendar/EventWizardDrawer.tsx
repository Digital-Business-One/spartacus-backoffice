import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { ENTRY_LABELS, ENTRY_COLORS, type EntryKind } from "../../lib/calendar";

interface Modality { id: string; name: string; slug: string }

interface Props {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}

const CATEGORIES: { id: Exclude<EntryKind, "class">; hint: string }[] = [
  { id: "own", hint: "Evento do projeto (ex.: defesa pessoal na praça)" },
  { id: "external", hint: "Evento de terceiros (ex.: campeonato em Sapezal)" },
  { id: "guest_class", hint: "Aulão que substitui uma aula no mesmo horário" },
];

function combine(date: string, time: string): string | null {
  if (!date) return null;
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  return `${date}T${t}:00`;
}

export function EventWizardDrawer({ projectId, onClose, onCreated }: Props) {
  const [category, setCategory] = useState<Exclude<EntryKind, "class">>("own");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [modalityId, setModalityId] = useState("");
  const [link, setLink] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ modalities: Modality[] }>(`/projects/${projectId}/modalities`)
      .then((r) => setModalities(r.modalities ?? []))
      .catch(() => setModalities([]));
  }, [projectId]);

  async function save() {
    if (!title.trim() || !startDate) {
      setError("Título e data de início são obrigatórios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post(`/projects/${projectId}/events`, {
        type: "event",
        eventCategory: category,
        title: title.trim(),
        description: description.trim(),
        eventDate: combine(startDate, startTime),
        eventEndDate: combine(endDate || startDate, endTime),
        eventLocation: location.trim() || null,
        modalityId: modalityId || null,
        linkPreview: link.trim() ? { url: link.trim() } : null,
        organizer: category === "external" ? organizer.trim() || null : null,
        registrationLink:
          category === "external" ? registrationLink.trim() || null : null,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar evento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cal-drawer-overlay" onClick={onClose}>
      <div className="cal-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cal-drawer-head">
          <h3>Novo evento</h3>
          <button className="cal-drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="cal-drawer-body">
          <label className="cal-field-label">Tipo</label>
          <div className="cal-type-grid">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`cal-type-btn ${category === c.id ? "active" : ""}`}
                onClick={() => setCategory(c.id)}
                style={category === c.id ? { borderColor: ENTRY_COLORS[c.id], background: `${ENTRY_COLORS[c.id]}1f` } : undefined}
              >
                <span className="cal-type-dot" style={{ background: ENTRY_COLORS[c.id] }} />
                <span className="cal-type-name">{ENTRY_LABELS[c.id]}</span>
                <span className="cal-type-hint">{c.hint}</span>
              </button>
            ))}
          </div>

          <label className="cal-field-label">Título *</label>
          <input className="cal-input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
            placeholder="Ex.: Aula de defesa pessoal para mulheres" />

          <label className="cal-field-label">Descrição</label>
          <textarea className="cal-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="cal-row">
            <div>
              <label className="cal-field-label">Data início *</label>
              <input className="cal-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="cal-field-label">Hora início</label>
              <input className="cal-input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>
          <div className="cal-row">
            <div>
              <label className="cal-field-label">Data fim</label>
              <input className="cal-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="cal-field-label">Hora fim</label>
              <input className="cal-input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <label className="cal-field-label">Local</label>
          <input className="cal-input" value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex.: Praça Central / Ginásio de Sapezal" />

          <label className="cal-field-label">Modalidade</label>
          <select className="cal-input" value={modalityId} onChange={(e) => setModalityId(e.target.value)}>
            <option value="">—</option>
            {modalities.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <label className="cal-field-label">Link (opcional)</label>
          <input className="cal-input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />

          {category === "external" && (
            <>
              <label className="cal-field-label">Organizador</label>
              <input className="cal-input" value={organizer} onChange={(e) => setOrganizer(e.target.value)}
                placeholder="Ex.: Federação de JJ do MT" />
              <label className="cal-field-label">Link de inscrição</label>
              <input className="cal-input" value={registrationLink} onChange={(e) => setRegistrationLink(e.target.value)}
                placeholder="https://inscricoes..." />
            </>
          )}

          {error && <p className="cal-error">{error}</p>}
        </div>

        <div className="cal-drawer-foot">
          <button className="btn btn-sm btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-sm btn-primary" onClick={save} disabled={saving || !title.trim() || !startDate}>
            {saving ? "..." : "Publicar evento"}
          </button>
        </div>
      </div>
    </div>
  );
}
