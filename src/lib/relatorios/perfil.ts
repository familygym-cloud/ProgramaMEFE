// Perfil de acesso de quem está logado, a partir dos papéis gravados em user_roles.

export type PerfilAcesso = "staff" | "aluno" | "sem-perfil";

/** Quem tem o papel staff vê a Central; senão, quem é aluno vai para /app; os demais não têm perfil. */
export function perfilDosPapeis(papeis: readonly { role: string }[]): PerfilAcesso {
  if (papeis.some((p) => p.role === "staff")) return "staff";
  if (papeis.some((p) => p.role === "aluno")) return "aluno";
  return "sem-perfil";
}
