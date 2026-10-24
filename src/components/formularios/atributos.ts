import type { FocusEvent } from "react";
import type { EstadoDoCampo } from "./armazem-react";

/** Atributos que mantêm o navegador longe do que é digitado: sem sugestões, sem histórico, sem revisão ortográfica remota. */
export const SEM_AUTOPREENCHER = {
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "off",
  spellCheck: false,
} as const;

/** Ao entrar num campo ainda automático, seleciona tudo: o que for digitado substitui o cálculo. */
export function selecionarSeAutomatico(estado: EstadoDoCampo) {
  return (evento: FocusEvent<HTMLInputElement>) => {
    if (estado.automatico && evento.currentTarget.type === "text") evento.currentTarget.select();
  };
}
