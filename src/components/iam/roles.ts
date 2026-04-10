/**
 * Hardcoded role definitions for the IAM screen (RFC-13).
 * Descriptions and permissions are informative only — the backend
 * uses @require_roles for authorization, not granular permissions.
 */

export interface RoleDefinition {
  code: string;
  label: string;
  icon: string;
  badge?: "ADMIN" | "FULL" | "READ";
  description: string;
  permissions: string[];
}

export const ROLES: RoleDefinition[] = [
  {
    code: "student",
    label: "Aluno",
    icon: "🥋",
    description:
      "Praticante ativo no projeto. Tem acesso a check-in de presença, doações, frequência, anamnese, eventos e campeonatos.",
    permissions: [
      "Visualizar frequência pessoal",
      "Frequência, anamnese e eventos",
      "Participação em atividades",
    ],
  },
  {
    code: "guardian",
    label: "Responsável",
    icon: "👨‍👩‍👧",
    description:
      "Responsável legal por dependentes menores de idade. Gerencia contas dos filhos, preenche anamneses e registra doações em nome deles.",
    permissions: [
      "Gerenciar contas de dependentes",
      "Preencher anamnese por dependente",
      "Registrar doações",
    ],
  },
  {
    code: "teacher",
    label: "Professor",
    icon: "📚",
    description:
      "Perfil de mestre de artes. Registro de aulas, controle de presença e acesso ao backoffice do projeto.",
    permissions: [
      "Registrar e gerir aulas",
      "Controlar presença",
      "Acesso ao backoffice",
    ],
  },
  {
    code: "instructor",
    label: "Instrutor",
    icon: "🥊",
    description:
      "Instrutor auxiliar que apoia a condução dos treinos.",
    permissions: [
      "Faz tudo de um aluno (exceto lecionar)",
      "Registrar frequência",
    ],
  },
  {
    code: "assistant",
    label: "Assistente",
    icon: "⚙️",
    badge: "FULL",
    description:
      "Perfil de operação plena. Faz tudo o que o controlador faz, porém não pode: cadastrar ou remover perfis.",
    permissions: [
      "Aprovar e reprovar contas",
      "Gerenciar configurações",
      "Validar frequência e doações de alunos",
      "Criar e editar turmas e modalidades",
    ],
  },
  {
    code: "supporter",
    label: "Apoiador",
    icon: "❤️",
    description:
      "Membro da comunidade que apoia o projeto. Não pratica, mas contribui.",
    permissions: [
      "Registrar contribuições e doações",
      "Participar de eventos",
      "Apoiar eventos e doações",
    ],
  },
  {
    code: "sponsor",
    label: "Patrocinador",
    icon: "💰",
    description:
      "Pessoa física ou jurídica que patrocina o projeto via PJ ou PF.",
    permissions: [
      "Registrar contribuições e doações",
      "Participar de eventos",
    ],
  },
  {
    code: "owner",
    label: "Controlador",
    icon: "👑",
    badge: "ADMIN",
    description:
      "Perfil com acesso irrestrito ao projeto. Acessa tudo, aprova contas acadêmicas e é responsável legal pelo projeto.",
    permissions: [
      "Acesso irrestrito e completo",
      "Aprovar e rejeitar contas",
      "Cadastrar e remover perfis de acesso",
      "Configurar o perfil do projeto",
      "Gerenciar dados sensíveis",
    ],
  },
  {
    code: "master",
    label: "Mestre",
    icon: "🔍",
    badge: "READ",
    description:
      "Perfil de observação estratégica. Tem acesso somente leitura a KPIs, índices, indicadores, turmas, calendário e cadastro de alunos. Ideal para mestres, diretores técnicos ou auditores que precisam acompanhar sem interferir.",
    permissions: [
      "Visualizar KPIs e indicadores gerais",
      "Acompanhar índices de frequência e doações",
      "Ver turmas e modalidades (somente leitura)",
      "Consultar calendário e eventos",
      "Acessar cadastro de alunos (somente leitura)",
    ],
  },
  {
    code: "social",
    label: "Social",
    icon: "📱",
    description:
      "Perfil voltado para a criação e gestão de conteúdos na timeline.",
    permissions: [
      "Criar publicações na timeline",
      "Publicar eventos e campeonatos",
      "Criar e gerenciar conteúdos",
    ],
  },
];

export function findRole(code: string): RoleDefinition | undefined {
  return ROLES.find((r) => r.code === code);
}
