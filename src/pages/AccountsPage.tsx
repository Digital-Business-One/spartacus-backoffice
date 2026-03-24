import { Link } from "react-router-dom";

export function AccountsPage() {
  return (
    <>
      <div className="page-header">
        <h2>Contas</h2>
        <p>Contas pendentes de aprovação</p>
        <div className="page-actions">
          <Link to="/contas/nova" className="btn btn-primary btn-sm">
            + Nova conta
          </Link>
        </div>
      </div>
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <h3>Nenhuma conta pendente</h3>
        <p>Quando novas contas forem criadas pelo app ou backoffice, elas aparecerão aqui para aprovação.</p>
      </div>
    </>
  );
}
