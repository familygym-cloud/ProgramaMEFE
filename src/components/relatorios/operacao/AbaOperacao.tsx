import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { ModuloIndisponivel } from "@/components/app/ui";
import { useOperacao } from "@/components/relatorios/operacao/useOperacao";
import type { PropsAba } from "@/components/relatorios/tipos";
import { Button } from "@/components/ui/button";
import { traduzErroServidor } from "@/lib/erros-servidor";
import type { ModulosOperacao, RelatorioOperacao } from "@/lib/relatorios/operacao";

/**
 * Moldura das abas de operação: busca os dados, mostra "carregando" e erro e avisa quando a
 * atualização do banco que cria aquela parte ainda não foi aplicada.
 */
export function AbaOperacao({
  relatorio,
  modo,
  modulo,
  nomeDoModulo,
  children,
}: PropsAba & {
  modulo: keyof ModulosOperacao;
  nomeDoModulo: string;
  children: (dados: RelatorioOperacao) => ReactNode;
}) {
  const estado = useOperacao(relatorio, modo);

  if (estado.estado === "carregando") {
    return (
      <p role="status" className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
        Carregando os dados de {nomeDoModulo.toLowerCase()}…
      </p>
    );
  }
  if (estado.estado === "erro") {
    return (
      <div
        role="alert"
        className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
      >
        <p>{traduzErroServidor(estado.erro)}</p>
        <Button
          type="button"
          variant="outline"
          onClick={estado.tentarDeNovo}
          className="rounded-full"
        >
          Tentar de novo
        </Button>
      </div>
    );
  }
  if (!estado.dados.modulos[modulo]) return <ModuloIndisponivel nome={nomeDoModulo} />;
  return <>{children(estado.dados)}</>;
}
