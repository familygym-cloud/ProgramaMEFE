import type { Conquista } from "@/lib/aluno-app/derive";

/**
 * Conquistas desbloqueadas que o aluno ainda não viu. Na primeira vez (nada guardado), nada é
 * comemorado: as que ele já tinha viram "vistas" em silêncio, para não disparar uma chuva de avisos
 * sobre o passado.
 */
export function novasConquistas(
  atuais: readonly Conquista[],
  vistas: readonly string[] | null,
): { novas: Conquista[]; vistasAtualizadas: string[] } {
  const desbloqueadas = atuais.filter((c) => c.desbloqueada);
  const ids = desbloqueadas.map((c) => c.id);
  if (vistas === null) return { novas: [], vistasAtualizadas: ids };
  const jaVistas = new Set(vistas);
  return {
    novas: desbloqueadas.filter((c) => !jaVistas.has(c.id)),
    vistasAtualizadas: [...new Set([...vistas, ...ids])],
  };
}

const CHAVE = (alunoId: string) => `fg:conquistas-vistas:${alunoId}`;

export function lerVistas(alunoId: string): string[] | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE(alunoId));
    if (bruto === null) return null;
    const lista: unknown = JSON.parse(bruto);
    return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === "string") : null;
  } catch {
    return null;
  }
}

export function gravarVistas(alunoId: string, vistas: string[]): void {
  try {
    window.localStorage.setItem(CHAVE(alunoId), JSON.stringify(vistas));
  } catch {
    // Sem armazenamento (navegação privada etc.): só deixa de lembrar o que já foi comemorado.
  }
}
