import { Link } from "@tanstack/react-router";
import { Link2, LogOut, RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react";
import { EstadoVazio } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { classificarErro } from "@/lib/relatorios/erros";

const BLOCO = "rounded-3xl bg-white/[0.06] motion-reduce:animate-none";

/** Esqueleto da Central: mesma estrutura da tela pronta (cabeçalho, abas, indicadores e gráficos). */
export function CarregandoCentral({ rotulo = "Carregando os relatórios" }: { rotulo?: string }) {
  return (
    <div role="status" aria-live="polite" aria-label={rotulo} className="space-y-6 sm:space-y-8">
      <div className="space-y-5">
        <Skeleton className="h-9 w-40 rounded-lg bg-white/[0.06] motion-reduce:animate-none" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-72 max-w-full rounded-xl bg-white/[0.06] motion-reduce:animate-none" />
          <Skeleton className="h-4 w-56 max-w-full rounded-full bg-white/[0.06] motion-reduce:animate-none" />
        </div>
      </div>
      <Skeleton className="h-13 w-full rounded-full bg-white/[0.06] motion-reduce:animate-none sm:w-[34rem]" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className={`h-36 ${BLOCO}`} />
        ))}
      </div>
      <Skeleton className={`h-48 ${BLOCO}`} />
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Skeleton className={`h-80 lg:col-span-2 ${BLOCO}`} />
        <Skeleton className={`h-80 ${BLOCO}`} />
      </div>
      <span className="sr-only">{rotulo}</span>
    </div>
  );
}

/** Falha ao carregar: explica em português e oferece tentar de novo (e sair, quando a sessão caiu). */
export function ErroCentral({
  erro,
  aoTentar,
  aoSair,
}: {
  erro: unknown;
  aoTentar: () => void;
  aoSair: () => void;
}) {
  const { tipo, mensagem } = classificarErro(erro);
  return (
    <div role="alert" className="mx-auto max-w-xl pt-6 sm:pt-12">
      <EstadoVazio
        icone={<TriangleAlert />}
        titulo="Não foi possível carregar os relatórios"
        texto={mensagem}
        acao={
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {tipo !== "sessao" && tipo !== "permissao" ? (
              <Button
                type="button"
                onClick={aoTentar}
                className="h-11 gap-2 rounded-full bg-brand-yellow px-5 font-semibold text-brand-black hover:bg-brand-yellow/90"
              >
                <RefreshCw aria-hidden /> Tentar de novo
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={aoSair}
              className="h-11 gap-2 rounded-full border-white/20 bg-transparent px-5 hover:bg-white/10 hover:text-foreground"
            >
              <LogOut aria-hidden /> {tipo === "sessao" ? "Entrar de novo" : "Sair"}
            </Button>
          </div>
        }
      />
    </div>
  );
}

/** Conta sem perfil de acesso: explica o que fazer, sem prometer o que ela não pode fazer. */
export function SemPerfil() {
  return (
    <div className="mx-auto max-w-xl pt-6 sm:pt-12">
      <EstadoVazio
        icone={<ShieldAlert />}
        titulo="Seu acesso ainda não foi liberado"
        texto="Esta conta ainda não tem um perfil na Academia Family Gym. Peça à equipe para liberar seu acesso como aluno ou como equipe; assim que isso for feito, é só entrar de novo."
        acao={
          <p className="max-w-md text-sm text-muted-foreground">
            Faz parte da equipe e precisa configurar os acessos?{" "}
            <Link
              to="/vinculos"
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-yellow underline underline-offset-4"
            >
              <Link2 className="size-4" aria-hidden /> Abrir vínculos
            </Link>
          </p>
        }
      />
    </div>
  );
}
