export function EventsPage() {
  return (
    <>
      <div className="page-header">
        <h2>Eventos</h2>
        <p>Calendário de eventos do projeto</p>
      </div>

      <div className="empty-state">
        <div className="empty-state-icon">🎪</div>
        <h3>Em construção</h3>
        <p>O calendário de eventos está sendo desenvolvido.</p>
      </div>
    </>
  );
}
