// Pix "copia e cola" (BR Code estático, padrão EMV do Banco Central), gerado no próprio aparelho.
// A chave da academia vem de VITE_PIX_CHAVE; sem ela, o app não oferece o Pix.

export type DadosPix = {
  chave: string;
  /** Nome do recebedor (até 25 caracteres, sem acento, em maiúsculas). */
  nome: string;
  /** Cidade do recebedor (até 15 caracteres, sem acento, em maiúsculas). */
  cidade: string;
  /** Valor em reais; omitido, o aluno digita o valor no banco. */
  valor?: number;
  /** Identificador da cobrança (até 25 letras e números). */
  identificador?: string;
};

function campo(id: string, valor: string): string {
  return `${id}${String(valor.length).padStart(2, "0")}${valor}`;
}

function limpar(texto: string, max: number): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .trim()
    .slice(0, max);
}

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido no fim do código. */
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Gera o texto do Pix copia e cola, ou `null` se a chave estiver vazia. */
export function gerarPixCopiaECola(d: DadosPix): string | null {
  const chave = d.chave.trim();
  if (!chave) return null;
  const nome = limpar(d.nome, 25) || "ACADEMIA";
  const cidade = limpar(d.cidade, 15) || "SAO PAULO";
  const txid = (d.identificador ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const conta = campo("00", "br.gov.bcb.pix") + campo("01", chave);
  const valor =
    d.valor !== undefined && Number.isFinite(d.valor) && d.valor > 0
      ? campo("54", d.valor.toFixed(2))
      : "";
  const corpo =
    campo("00", "01") +
    campo("01", "11") +
    campo("26", conta) +
    campo("52", "0000") +
    campo("53", "986") +
    valor +
    campo("58", "BR") +
    campo("59", nome) +
    campo("60", cidade) +
    campo("62", campo("05", txid)) +
    "6304";
  return corpo + crc16(corpo);
}

function env(nome: string): string {
  const v = (import.meta.env as Record<string, unknown>)[nome];
  return typeof v === "string" ? v.trim() : "";
}

/** Dados da academia para o Pix; `null` quando a chave não foi configurada. */
export function pixDaAcademia(): Omit<DadosPix, "valor" | "identificador"> | null {
  const chave = env("VITE_PIX_CHAVE");
  if (!chave) return null;
  return {
    chave,
    nome: env("VITE_PIX_NOME") || "ACADEMIA FAMILY GYM",
    cidade: env("VITE_PIX_CIDADE") || "SAO PAULO",
  };
}
