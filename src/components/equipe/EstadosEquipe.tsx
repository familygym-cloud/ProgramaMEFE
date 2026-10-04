import { DatabaseZap, RefreshCw, TriangleAlert } from "lucide-react";
import { EstadoVazio } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function CarregandoEquipe({ rotulo }: { rotulo: string }) {
  return (
    <div role="status" aria-label={rotulo} className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32 rounded-full bg-foreground/[0.06] motion-reduce:animate-none" />
        <Skeleton className="h-10 w-72 max-w-full rounded-xl bg-foreground/[0.06] motion-reduce:animate-none" />
        <Skeleton className="h-4 w-96 max-w-full rounded-full bg-foreground/[0.06] motion-reduce:animate-none" />
      </div>
      <Skeleton className="h-28 rounded-3xl bg-foreground/[0.06] motion-reduce:animate-none" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[23rem_minmax(0,1fr)]">
        <Skeleton className="h-64 rounded-3xl bg-foreground/[0.06] motion-reduce:animate-none" />
        <Skeleton className="h-96 rounded-3xl bg-foreground/[0.06] motion-reduce:animate-none" />
      </div>
      <span className="sr-only">{rotulo}</span>
    </div>
  );
}

function BotaoTentar({ onTentar }: { onTentar: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onTentar}
      className="mt-1 h-11 gap-2 rounded-full border-foreground/20 bg-transparent px-5"
    >
      <RefreshCw /> Tentar de novo
    </Button>
  );
}

export function ErroEquipe({ mensagem, onTentar }: { mensagem: string; onTentar: () => void }) {
  return (
    <div role="alert">
      <EstadoVazio
        icone={<TriangleAlert />}
        titulo="Não foi possível carregar os dados"
        texto={mensagem}
        acao={<BotaoTentar onTentar={onTentar} />}
      />
    </div>
  );
}

/** A migration do módulo ainda não foi aplicada: orienta a equipe técnica em vez de mostrar uma tela quebrada. */
export function ModuloPendente({ nome, onTentar }: { nome: string; onTentar: () => void }) {
  return (
    <EstadoVazio
      icone={<DatabaseZap />}
      titulo={`${nome} ainda não está ativado`}
      texto={
        <>
          A tabela deste módulo não existe no banco de dados. Aplique a migration{" "}
          <code className="rounded bg-foreground/10 px-1.5 py-0.5 text-xs">
            20261004000000_modulos_area_do_aluno.sql
          </code>{" "}
          no Supabase e recarregue esta página.
        </>
      }
      acao={<BotaoTentar onTentar={onTentar} />}
    />
  );
}
