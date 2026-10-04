export const TAMANHO_MINIMO_SENHA = 6;

export type ForcaSenha = {
  /** 0 (vazia ou curta demais) a 4 (forte). */
  nivel: 0 | 1 | 2 | 3 | 4;
  rotulo: string;
};

const ROTULOS = ["Muito curta", "Fraca", "Razoável", "Boa", "Forte"] as const;

/** Indicador simples e didático, não um verificador de vazamentos: o servidor continua sendo a palavra final. */
export function forcaDaSenha(senha: string): ForcaSenha {
  if (senha.length < TAMANHO_MINIMO_SENHA) return { nivel: 0, rotulo: ROTULOS[0] };

  const pontos =
    Number(senha.length >= 8) +
    Number(senha.length >= 12) +
    Number(/[a-zà-ú]/.test(senha) && /[A-ZÀ-Ú]/.test(senha)) +
    Number(/\d/.test(senha)) +
    Number(/[^\p{L}\d]/u.test(senha));

  const nivel = Math.max(1, Math.min(4, pontos - 1)) as 1 | 2 | 3 | 4;
  return { nivel, rotulo: ROTULOS[nivel] };
}
