import { createContext, useContext } from "react";

export type Sessao = { logado: boolean };

/** Sem provedor, o visitante é tratado como anônimo (é também o que o servidor renderiza). */
export const SessaoContext = createContext<Sessao>({ logado: false });

export function useSessao() {
  return useContext(SessaoContext);
}
