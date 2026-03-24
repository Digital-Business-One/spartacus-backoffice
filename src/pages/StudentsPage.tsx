export function StudentsPage() {
  return (
    <>
      <div className="page-header">
        <h2>Alunos</h2>
        <p>Alunos com conta ativa no projeto</p>
      </div>
      <div className="empty-state">
        <div className="empty-state-icon">🥋</div>
        <h3>Nenhum aluno ativo</h3>
        <p>Alunos aprovados pelo fluxo de contas aparecerão aqui.</p>
      </div>
    </>
  );
}
