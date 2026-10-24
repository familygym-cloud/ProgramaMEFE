import { ehEquipe } from "@/lib/papeis";

// Perfil de acesso de quem está logado, a partir dos papéis gravados em user_roles. "staff" aqui quer
// dizer "pertence à equipe" (gestão, recepção ou professor); o que cada um pode usar está em papeis.ts.

export type PerfilAcesso = "staff" | "aluno" | "sem-perfil";

/** Quem tem o papel staff vê a Central; senão, quem é aluno vai para /app; os demais não têm perfil. */
export function perfilDosPapeis(papeis: readonly { role: string }[]): PerfilAcesso {
  if (ehEquipe(papeis.map((p) => p.role))) return "staff";
  if (papeis.some((p) => p.role === "aluno")) return "aluno";
  return "sem-perfil";
}
