// Respostas padronizadas da API pública: { erro: { codigo, mensagem } } com o status HTTP certo.

export type CorpoErro = { erro: { codigo: string; mensagem: string } };

const CABECALHOS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
} as const;

export function resposta(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status, headers: CABECALHOS });
}

export function erro(status: number, codigo: string, mensagem: string): Response {
  return resposta({ erro: { codigo, mensagem } } satisfies CorpoErro, status);
}

/** Limite do corpo de uma chamada: nenhuma rota da API precisa de mais que isto. */
export const MAX_CORPO_BYTES = 16 * 1024;

export class ErroDeEntrada extends Error {
  constructor(
    public readonly codigo: string,
    mensagem: string,
    public readonly status = 400,
  ) {
    super(mensagem);
  }
}

/** Lê o corpo JSON de um POST/PUT, recusando corpo grande, vazio ou que não seja um objeto. */
export async function lerCorpoJson(request: Request): Promise<Record<string, unknown>> {
  const declarado = Number(request.headers.get("content-length") ?? 0);
  if (declarado > MAX_CORPO_BYTES)
    throw new ErroDeEntrada("corpo_grande", "Corpo grande demais.", 413);
  const texto = await request.text();
  if (texto.length > MAX_CORPO_BYTES)
    throw new ErroDeEntrada("corpo_grande", "Corpo grande demais.", 413);
  let valor: unknown;
  try {
    valor = JSON.parse(texto);
  } catch {
    throw new ErroDeEntrada("json_invalido", "O corpo precisa ser um JSON válido.");
  }
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) {
    throw new ErroDeEntrada("json_invalido", "O corpo precisa ser um objeto JSON.");
  }
  return valor as Record<string, unknown>;
}
