import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { usePagination } from "../hooks/usePagination";

interface Account {
  uid: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
  birth_date?: string;
  gender?: string;
  phone?: string;
  is_dependent: boolean;
  guardian_uid?: string;
}

interface StudentGroup {
  guardian: Account | null;
  dependents: Account[];
}

function calcAge(birthDate?: string): number | null {
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

function groupStudents(accounts: Account[]): StudentGroup[] {
  const approved = accounts.filter((a) => a.status === "approved");
  const guardians = approved.filter((a) => a.roles.includes("guardian"));
  const students = approved.filter((a) => a.roles.includes("student"));

  const groups: StudentGroup[] = [];
  const assigned = new Set<string>();

  for (const g of guardians) {
    const deps = students.filter((s) => s.is_dependent && s.guardian_uid === g.uid);
    deps.forEach((d) => assigned.add(d.uid));
    groups.push({ guardian: g, dependents: deps });
  }

  for (const s of students) {
    if (!assigned.has(s.uid) && !s.roles.includes("guardian")) {
      groups.push({ guardian: null, dependents: [s] });
    }
  }

  return groups;
}

export function StudentsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<Account[]>("/accounts");
      setAccounts(result);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const groups = groupStudents(accounts);
  const { visible, total, hasMore, loadMore, sentinelRef } = usePagination({ items: groups });

  return (
    <>
      <div className="page-header">
        <h2>Alunos</h2>
        <p>Alunos ativos e seus responsáveis</p>
      </div>

      {loading ? (
        <div className="hub-loading">
          <span className="loading-spinner" style={{ width: 24, height: 24 }} />
          <span>Carregando alunos...</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🥋</div>
          <h3>Nenhum aluno ativo</h3>
          <p>Quando contas forem aprovadas com perfil de aluno ou responsável, elas aparecerão aqui.</p>
        </div>
      ) : (
        <>
          <div className="student-list">
            {visible.map((group, i) => (
              <StudentGroupCard key={group.guardian?.uid ?? `ind-${i}`} group={group} />
            ))}
          </div>
          <div className="pagination-footer">
            <span className="pagination-count">
              Exibindo {visible.length} de {total} {total === 1 ? "grupo" : "grupos"}
            </span>
            {hasMore && (
              <button className="btn btn-outline btn-sm" onClick={loadMore} style={{ marginTop: "0.5rem" }}>
                Ver mais ↓
              </button>
            )}
            <div ref={sentinelRef} />
          </div>
        </>
      )}
    </>
  );
}

function StudentGroupCard({ group }: { group: StudentGroup }) {
  const { guardian, dependents } = group;

  if (!guardian && dependents.length === 1) {
    const s = dependents[0];
    const age = calcAge(s.birth_date);
    return (
      <div className="student-card">
        <div className="student-header">
          <div className="account-avatar">{s.name[0]?.toUpperCase()}</div>
          <div className="student-info">
            <div className="student-name">{s.name}</div>
            <div className="student-meta">{s.email}</div>
            {age !== null && (
              <div className="student-meta">
                {age} anos · {s.gender === "male" ? "Masculino" : "Feminino"}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-card">
      {guardian && (
        <div className="student-header">
          <div className="account-avatar">{guardian.name[0]?.toUpperCase()}</div>
          <div className="student-info">
            <div className="student-name">{guardian.name}</div>
            <div className="student-meta">{guardian.email}</div>
          </div>
          <span className="chip" style={{ fontSize: "0.7rem", padding: "0.1rem 0.5rem" }}>
            Responsável
          </span>
        </div>
      )}
      {dependents.length > 0 && (
        <div className="student-dependents">
          {dependents.map((dep) => {
            const age = calcAge(dep.birth_date);
            return (
              <div key={dep.uid} className="student-dep-row">
                <span className="student-dep-arrow">›</span>
                <span className="student-dep-name">{dep.name}</span>
                {age !== null && <span className="student-dep-detail">{age} anos</span>}
                <span className="student-dep-detail">
                  {dep.gender === "male" ? "Masculino" : "Feminino"}
                </span>
                <span className="student-dep-detail">—</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
