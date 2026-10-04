import { useBlocker } from "@tanstack/react-router";
import { useCallback, useState } from "react";

/**
 * Protege alterações não salvas. `proteger(acao)` executa a ação na hora quando está tudo salvo e,
 * caso contrário, pede confirmação. Sair da página (link, voltar, fechar a aba) passa pelo mesmo aviso.
 * Mudar só a busca da URL (trocar de aluno) não é "sair": quem troca de aluno usa `proteger`.
 */
export function useGuardaDescarte(sujo: boolean) {
  const [pendente, setPendente] = useState<{ acao: () => void } | null>(null);
  const bloqueio = useBlocker({
    shouldBlockFn: ({ current, next }) => sujo && current.pathname !== next.pathname,
    enableBeforeUnload: () => sujo,
    withResolver: true,
  });

  const proteger = useCallback(
    (acao: () => void) => {
      if (sujo) setPendente({ acao });
      else acao();
    },
    [sujo],
  );

  const confirmar = () => {
    if (pendente) {
      const { acao } = pendente;
      setPendente(null);
      acao();
    } else if (bloqueio.status === "blocked") {
      bloqueio.proceed();
    }
  };

  const cancelar = () => {
    if (pendente) setPendente(null);
    else if (bloqueio.status === "blocked") bloqueio.reset();
  };

  return {
    proteger,
    aberto: pendente !== null || bloqueio.status === "blocked",
    confirmar,
    cancelar,
  };
}
