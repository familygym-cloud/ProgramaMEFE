import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  atualizarMeuContato,
  cancelarReservaAula,
  carregarAreaAluno,
  registrarTreinoFeito,
  removerMeta,
  reservarAula,
  salvarMeta,
  type RespostaAreaAluno,
} from "./aluno-app.functions";
import { hojeISO } from "./derive";
import { criarDadosDemo } from "./fixtures";
import type { AreaAlunoDados, NovaMeta } from "./types";

const CHAVE_DEMO = "fg-demo";

export function demoAtivo(): boolean {
  try {
    return typeof window !== "undefined" && window.sessionStorage.getItem(CHAVE_DEMO) === "1";
  } catch {
    return false;
  }
}

export function definirDemo(ativo: boolean) {
  try {
    if (ativo) window.sessionStorage.setItem(CHAVE_DEMO, "1");
    else window.sessionStorage.removeItem(CHAVE_DEMO);
  } catch {
    /* sessionStorage indisponível: o modo demonstração só vale para esta navegação */
  }
}

export type AcoesAluno = {
  reservarAula: (aulaId: string) => Promise<void>;
  cancelarReserva: (aulaId: string) => Promise<void>;
  registrarTreino: (input: { atividade: string; duracaoMin: number }) => Promise<void>;
  atualizarContato: (input: { telefone: string; email: string }) => Promise<void>;
  salvarMeta: (meta: NovaMeta) => Promise<void>;
  removerMeta: (id: string) => Promise<void>;
};

type Contexto = {
  dados: AreaAlunoDados;
  acoes: AcoesAluno;
  recarregar: () => void;
};

const AlunoAppContext = createContext<Contexto | null>(null);

export function useAlunoApp(): Contexto {
  const ctx = useContext(AlunoAppContext);
  if (!ctx) throw new Error("useAlunoApp precisa estar dentro de <AlunoAppProvider>.");
  return ctx;
}

function mensagemErro(e: unknown): string {
  return e instanceof Error ? e.message : "Algo deu errado. Tente novamente.";
}

/** Executa uma ação, mostra o resultado em toast e propaga o erro para quem chamou. */
async function comToast(sucesso: string, fn: () => Promise<void>) {
  try {
    await fn();
    toast.success(sucesso);
  } catch (e) {
    toast.error(mensagemErro(e));
    throw e;
  }
}

// ------------------------------------------------------------------ modo real

export function useAreaAlunoReal() {
  return useQuery<RespostaAreaAluno>({
    queryKey: ["area-aluno"],
    queryFn: () => carregarAreaAluno(),
    staleTime: 30_000,
  });
}

export function AlunoAppProviderReal({
  dados,
  children,
}: {
  dados: AreaAlunoDados;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const recarregar = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["area-aluno"] });
  }, [queryClient]);

  const acoes = useMemo<AcoesAluno>(
    () => ({
      reservarAula: async (aulaId) => {
        await comToast("Aula reservada! Te esperamos lá.", async () => {
          await reservarAula({ data: { aulaId } });
          recarregar();
        });
      },
      cancelarReserva: async (aulaId) => {
        await comToast("Reserva cancelada.", async () => {
          await cancelarReservaAula({ data: { aulaId } });
          recarregar();
        });
      },
      registrarTreino: async (input) => {
        await comToast("Treino registrado. Bom trabalho!", async () => {
          await registrarTreinoFeito({ data: input });
          recarregar();
        });
      },
      atualizarContato: async (input) => {
        await comToast("Dados de contato atualizados.", async () => {
          await atualizarMeuContato({ data: input });
          recarregar();
        });
      },
      salvarMeta: async (meta) => {
        await comToast("Meta salva.", async () => {
          await salvarMeta({ data: meta });
          recarregar();
        });
      },
      removerMeta: async (id) => {
        await comToast("Meta removida.", async () => {
          await removerMeta({ data: { id } });
          recarregar();
        });
      },
    }),
    [recarregar],
  );

  return (
    <AlunoAppContext.Provider value={{ dados, acoes, recarregar }}>
      {children}
    </AlunoAppContext.Provider>
  );
}

// ----------------------------------------------------------- modo demonstração

export function AlunoAppProviderDemo({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<AreaAlunoDados>(() => criarDadosDemo());

  const acoes = useMemo<AcoesAluno>(
    () => ({
      reservarAula: async (aulaId) => {
        setDados((d) => ({
          ...d,
          agenda: d.agenda.map((a) =>
            a.id === aulaId && !a.reservada
              ? { ...a, reservada: true, ocupadas: a.ocupadas + 1 }
              : a,
          ),
        }));
        toast.success("Aula reservada! (demonstração)");
      },
      cancelarReserva: async (aulaId) => {
        setDados((d) => ({
          ...d,
          agenda: d.agenda.map((a) =>
            a.id === aulaId && a.reservada
              ? { ...a, reservada: false, ocupadas: Math.max(0, a.ocupadas - 1) }
              : a,
          ),
        }));
        toast.success("Reserva cancelada. (demonstração)");
      },
      registrarTreino: async ({ atividade, duracaoMin }) => {
        setDados((d) => ({
          ...d,
          checkIns: [
            { id: `demo-ci-${Date.now()}`, data: hojeISO(), atividade, duracaoMin },
            ...d.checkIns,
          ],
        }));
        toast.success("Treino registrado. Bom trabalho! (demonstração)");
      },
      atualizarContato: async ({ telefone, email }) => {
        setDados((d) => ({
          ...d,
          perfil: { ...d.perfil, telefone: telefone || null, email: email || null },
        }));
        toast.success("Dados de contato atualizados. (demonstração)");
      },
      salvarMeta: async (meta) => {
        setDados((d) => ({
          ...d,
          metas: [
            ...d.metas.filter((m) => m.tipo !== meta.tipo),
            { id: `demo-meta-${Date.now()}`, concluida: false, ...meta },
          ],
        }));
        toast.success("Meta salva. (demonstração)");
      },
      removerMeta: async (id) => {
        setDados((d) => ({ ...d, metas: d.metas.filter((m) => m.id !== id) }));
        toast.success("Meta removida. (demonstração)");
      },
    }),
    [],
  );

  return (
    <AlunoAppContext.Provider value={{ dados, acoes, recarregar: () => undefined }}>
      {children}
    </AlunoAppContext.Provider>
  );
}
