import { z } from "zod";

// Mesmas regras da server function `atualizarMeuContato`: campo vazio apaga o contato.
const TELEFONE_PERMITIDO = /^[0-9()+\-.\s]*$/;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TELEFONE_MAX = 30;
export const EMAIL_MAX = 160;

export const esquemaContato = z.object({
  telefone: z
    .string()
    .trim()
    .refine(
      (v) => TELEFONE_PERMITIDO.test(v),
      "Use só números, espaços e os símbolos ( ) + - . no telefone.",
    )
    .refine((v) => v.length === 0 || v.length >= 8, "O telefone precisa ter ao menos 8 caracteres.")
    .refine((v) => v.length <= TELEFONE_MAX, `Use no máximo ${TELEFONE_MAX} caracteres.`),
  email: z
    .string()
    .trim()
    .refine(
      (v) => v.length === 0 || EMAIL_VALIDO.test(v),
      "Informe um e-mail válido, como nome@email.com.",
    )
    .refine((v) => v.length <= EMAIL_MAX, `Use no máximo ${EMAIL_MAX} caracteres.`),
});

export type Contato = z.infer<typeof esquemaContato>;
export type CampoContato = keyof Contato;
export type ErrosContato = Partial<Record<CampoContato, string>>;

export type ResultadoContato = { ok: true; dados: Contato } | { ok: false; erros: ErrosContato };

/** Valida e normaliza (remove espaços das pontas) os dois campos de contato. */
export function validarContato(valores: Contato): ResultadoContato {
  const leitura = esquemaContato.safeParse(valores);
  if (leitura.success) return { ok: true, dados: leitura.data };
  const erros: ErrosContato = {};
  for (const problema of leitura.error.issues) {
    const campo = problema.path[0];
    if ((campo === "telefone" || campo === "email") && erros[campo] === undefined) {
      erros[campo] = problema.message;
    }
  }
  return { ok: false, erros };
}

export function contatoIgual(a: Contato, b: Contato): boolean {
  return a.telefone.trim() === b.telefone.trim() && a.email.trim() === b.email.trim();
}
