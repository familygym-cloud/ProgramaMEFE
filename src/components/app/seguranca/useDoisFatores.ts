import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmarCodigo,
  descartarCadastroTotp,
  iniciarCadastroTotp,
  listarFatoresTotp,
  removerFatorTotp,
  traduzErroMfa,
  type CadastroTotp,
  type FatorVerificado,
} from "@/lib/auth-mfa";

export const CODIGO_DEMO = "123456";
const SEGREDO_DEMO = "FGYMDEMO2345ABCD";

const pausa = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Aparelhos de verificação em duas etapas. No modo demonstração nada toca o Supabase:
 * o cache do react-query faz o papel de banco, então o estado sobrevive à navegação entre páginas.
 */
export function useDoisFatores(demo: boolean) {
  const queryClient = useQueryClient();
  const chave = ["seguranca", "fatores", demo ? "demo" : "real"] as const;

  const consulta = useQuery<FatorVerificado[]>({
    queryKey: chave,
    queryFn: demo
      ? () => queryClient.getQueryData<FatorVerificado[]>(chave) ?? []
      : async () => (await listarFatoresTotp()).verificados,
    staleTime: demo ? Infinity : 0,
  });

  async function iniciar(): Promise<CadastroTotp> {
    if (!demo) return iniciarCadastroTotp();
    await pausa(350);
    return { fatorId: "demo-aparelho", qrCode: "", segredo: SEGREDO_DEMO, uri: "" };
  }

  async function confirmar(cadastro: CadastroTotp, codigo: string): Promise<void> {
    if (!demo) {
      await confirmarCodigo(cadastro.fatorId, codigo);
      await queryClient.invalidateQueries({ queryKey: chave });
      return;
    }
    await pausa(500);
    if (codigo !== CODIGO_DEMO)
      throw new Error(`Código incorreto. Na demonstração, use ${CODIGO_DEMO}.`);
    queryClient.setQueryData<FatorVerificado[]>(chave, (atuais = []) => [
      ...atuais,
      {
        id: cadastro.fatorId,
        nome: "Aplicativo autenticador (demonstração)",
        criadoEm: new Date().toISOString(),
      },
    ]);
  }

  async function descartar(cadastro: CadastroTotp): Promise<void> {
    if (!demo) await descartarCadastroTotp(cadastro.fatorId);
  }

  async function remover(fatorId: string): Promise<void> {
    if (!demo) {
      await removerFatorTotp(fatorId);
      await queryClient.invalidateQueries({ queryKey: chave });
      return;
    }
    await pausa(400);
    queryClient.setQueryData<FatorVerificado[]>(chave, (atuais = []) =>
      atuais.filter((f) => f.id !== fatorId),
    );
  }

  return {
    fatores: consulta.data ?? [],
    carregando: consulta.isPending,
    erro: consulta.error ? traduzErroMfa(consulta.error) : null,
    recarregar: () => void consulta.refetch(),
    iniciar,
    confirmar,
    descartar,
    remover,
  };
}

export type DoisFatores = ReturnType<typeof useDoisFatores>;
