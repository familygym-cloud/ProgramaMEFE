import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CircleCheck,
  ClipboardCopy,
  Loader2,
  OctagonAlert,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { resumirDiagnostico, textoDoDiagnostico, type EstadoItem } from "@/lib/diagnostico";
import { obterDiagnostico } from "@/lib/diagnostico.functions";
import { traduzErroServidor } from "@/lib/erros-servidor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/diagnostico")({
  head: () => ({
    meta: [{ title: "Diagnóstico | Academia Family Gym" }, { name: "robots", content: "noindex" }],
  }),
  component: Diagnostico,
});

const VISUAL: Record<EstadoItem, { Icone: typeof CircleCheck; rotulo: string; classe: string }> = {
  ok: { Icone: CircleCheck, rotulo: "Certo", classe: "text-brand-yellow" },
  atencao: { Icone: TriangleAlert, rotulo: "Atenção", classe: "text-brand-yellow" },
  erro: { Icone: OctagonAlert, rotulo: "Erro", classe: "text-destructive" },
};

const HORA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function Diagnostico() {
  const buscar = useServerFn(obterDiagnostico);
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["diagnostico"],
    queryFn: () => buscar(),
    retry: false,
    staleTime: 0,
  });

  const resumo = data ? resumirDiagnostico(data.itens) : null;

  async function copiar() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(
        textoDoDiagnostico(data.itens, HORA.format(new Date(data.geradoEm))),
      );
      toast.success(
        "Resumo copiado. Pode colar na conversa de suporte: ele não tem nenhuma senha ou chave.",
      );
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto da página e copie manualmente.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-brand-yellow/20 bg-brand-black px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10" />
            <div>
              <h1 className="text-base font-bold uppercase tracking-widest text-brand-onblack">
                Diagnóstico
              </h1>
              <p className="text-xs text-brand-onblack/60">
                O que está certo e o que falta ajustar
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2 rounded-full border-brand-yellow/40 bg-transparent text-xs uppercase tracking-widest text-brand-onblack hover:bg-brand-yellow hover:text-brand-black"
          >
            <Link to="/dashboard">
              <ArrowLeft className="size-3.5" /> Painel
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-8">
        <p className="text-sm text-muted-foreground">
          Esta página confere as chaves e o banco do servidor e explica, em português, como corrigir
          cada problema. Ela nunca mostra senhas nem chaves, só se estão certas.
        </p>

        {isLoading ? (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Conferindo a configuração…
          </p>
        ) : error ? (
          <div
            role="alert"
            className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
          >
            <p>{traduzErroServidor(error)}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
              className="rounded-full"
            >
              Tentar de novo
            </Button>
          </div>
        ) : data && resumo ? (
          <>
            <div
              role="status"
              className={cn(
                "rounded-2xl border p-4 text-sm font-medium",
                resumo.erros > 0
                  ? "border-destructive/40 bg-destructive/10"
                  : resumo.atencoes > 0
                    ? "border-brand-yellow/40 bg-brand-yellow/10"
                    : "border-foreground/15 bg-foreground/[0.03]",
              )}
            >
              {resumo.erros > 0
                ? `${resumo.erros} problema(s) para corrigir${resumo.atencoes > 0 ? ` e ${resumo.atencoes} ponto(s) de atenção` : ""}.`
                : resumo.atencoes > 0
                  ? `Nenhum erro, mas ${resumo.atencoes} ponto(s) de atenção.`
                  : "Tudo certo com a configuração."}
            </div>

            <ul className="space-y-3">
              {data.itens.map((item) => {
                const v = VISUAL[item.estado];
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "space-y-2 rounded-2xl border p-4",
                      item.estado === "erro" ? "border-destructive/40" : "border-foreground/10",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <v.Icone className={cn("mt-0.5 size-5 shrink-0", v.classe)} aria-hidden />
                      <div className="min-w-0 space-y-1">
                        <h2 className="font-display text-base font-semibold leading-tight">
                          {item.titulo} <span className="sr-only">: {v.rotulo}</span>
                        </h2>
                        <p className="text-sm">{item.detalhe}</p>
                      </div>
                    </div>
                    {item.correcao ? (
                      <p className="ml-8 rounded-xl bg-foreground/[0.05] p-3 text-sm text-muted-foreground">
                        <strong className="text-foreground">O que fazer: </strong>
                        {item.correcao}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="min-h-11 gap-2 rounded-full"
              >
                <RefreshCw className={cn("size-4", isFetching && "animate-spin")} aria-hidden />
                Conferir de novo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void copiar()}
                className="min-h-11 gap-2 rounded-full"
              >
                <ClipboardCopy className="size-4" aria-hidden /> Copiar resumo para suporte
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Conferido em {HORA.format(new Date(data.geradoEm))}.
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}
