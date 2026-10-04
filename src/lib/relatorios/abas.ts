// Abas da Central de relatórios e o parâmetro de URL `aba` que as aponta (links profundos).

export const ABAS_RELATORIO = [
  "visao-geral",
  "financeiro",
  "frequencia",
  "saude",
  "termos",
  "alunos",
] as const;

export type AbaRelatorio = (typeof ABAS_RELATORIO)[number];

export const ABA_PADRAO: AbaRelatorio = "visao-geral";

export const ROTULO_ABA: Record<AbaRelatorio, string> = {
  "visao-geral": "Visão geral",
  financeiro: "Financeiro",
  frequencia: "Frequência",
  saude: "Saúde",
  termos: "Termos",
  alunos: "Alunos",
};

/** "real" = dados do banco; "demo" = dados fictícios gerados no navegador. */
export type ModoRelatorio = "real" | "demo";

export function ehAba(valor: unknown): valor is AbaRelatorio {
  return typeof valor === "string" && (ABAS_RELATORIO as readonly string[]).includes(valor);
}

/** Search params das rotas que mostram a Central. A aba padrão não vai para a URL. */
export type BuscaRelatorio = { aba?: AbaRelatorio | undefined };

/**
 * Valida `?aba=`. O roteador mantém por cima do resultado os parâmetros crus que a validação não
 * devolve, então um valor desconhecido (ou a aba padrão) é devolvido como `aba: undefined`
 * explícito para apagar o que veio da URL.
 */
export function validarBuscaRelatorio(busca: Record<string, unknown>): BuscaRelatorio {
  const aba = busca["aba"];
  return { aba: ehAba(aba) && aba !== ABA_PADRAO ? aba : undefined };
}

/** Search param para navegar até uma aba (a padrão fica sem parâmetro). */
export function buscaDaAba(aba: AbaRelatorio): BuscaRelatorio {
  return aba === ABA_PADRAO ? {} : { aba };
}

/** Aba efetiva de uma busca já validada (qualquer outra coisa cai na Visão geral). */
export function abaDaBusca(busca: { aba?: unknown }): AbaRelatorio {
  return ehAba(busca.aba) ? busca.aba : ABA_PADRAO;
}
