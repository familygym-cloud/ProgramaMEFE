import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, MessageCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { traduzErroServidor } from "@/lib/erros-servidor";
import {
  atualizarInteressado,
  listarInteressados,
  type InteressadoListado,
} from "@/lib/interessados.functions";
import {
  mensagemParaInteressado,
  ROTULO_STATUS,
  STATUS_DO_INTERESSADO,
  TIPOS_DE_PEDIDO,
  type StatusDoInteressado,
} from "@/lib/interessados";
import { formatarTelefoneBR, linkWhatsapp } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/interessados")({
  head: () => ({ meta: [{ title: "Interessados | Academia Family Gym" }] }),
  component: Interessados,
});

const QUANDO = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function Cartao({ i }: { i: InteressadoListado }) {
  const queryClient = useQueryClient();
  const atualizar = useServerFn(atualizarInteressado);
  const [anotacao, setAnotacao] = useState(i.anotacao ?? "");
  const salvar = useMutation({
    mutationFn: (m: { status?: StatusDoInteressado; anotacao?: string }) =>
      atualizar({ data: { id: i.id, ...m } }),
    onSuccess: () => toast.success("Atualizado."),
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["interessados"] }),
  });
  const tipo = TIPOS_DE_PEDIDO.find((t) => t.valor === i.tipo)?.rotulo ?? i.tipo;

  return (
    <li
      className={cn(
        "space-y-3 rounded-3xl border border-foreground/10 p-4 sm:p-5",
        i.status === "novo" && "border-brand-yellow/50 bg-brand-yellow/[0.06]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold">{i.nome}</p>
          <p className="text-sm text-muted-foreground">
            {tipo} · {i.interesse} · {QUANDO.format(new Date(i.criadoEm))}
          </p>
          <p className="text-sm">
            {formatarTelefoneBR(i.telefone)}
            {i.email ? ` · ${i.email}` : ""}
          </p>
        </div>
        <Badge variant={i.status === "novo" ? "default" : "outline"}>
          {ROTULO_STATUS[i.status]}
        </Badge>
      </div>
      {i.mensagem ? <p className="rounded-xl bg-foreground/5 p-3 text-sm">{i.mensagem}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" className="min-h-11 gap-2 rounded-full">
          <a
            href={linkWhatsapp(i.telefone, mensagemParaInteressado(i.nome, i.tipo))}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="size-4" aria-hidden /> Chamar no WhatsApp
            <span className="sr-only"> (abre em outra aba)</span>
          </a>
        </Button>
        {i.status !== "matriculado" ? (
          <Button asChild size="sm" variant="outline" className="min-h-11 gap-2 rounded-full">
            <Link
              to="/alunos"
              search={{
                novo: true,
                nome: i.nome,
                telefone: i.telefone,
                interesse: i.interesse,
                interessado: i.id,
                ...(i.email ? { email: i.email } : {}),
              }}
            >
              <UserPlus className="size-4" aria-hidden /> Cadastrar como aluno
              <span className="sr-only"> ({i.nome})</span>
            </Link>
          </Button>
        ) : null}
        {STATUS_DO_INTERESSADO.filter((s) => s !== i.status).map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant="outline"
            disabled={salvar.isPending}
            onClick={() => salvar.mutate({ status: s })}
            className="min-h-11 rounded-full"
          >
            Marcar como {ROTULO_STATUS[s].toLowerCase()}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <label
          htmlFor={`an-${i.id}`}
          className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
        >
          Anotação da equipe
        </label>
        <Textarea
          id={`an-${i.id}`}
          value={anotacao}
          onChange={(e) => setAnotacao(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full rounded-xl"
        />
        {anotacao !== (i.anotacao ?? "") ? (
          <Button
            type="button"
            size="sm"
            disabled={salvar.isPending}
            onClick={() => salvar.mutate({ anotacao })}
            className="min-h-11 rounded-full"
          >
            Salvar anotação
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function Interessados() {
  const buscar = useServerFn(listarInteressados);
  const { data, isLoading, error } = useQuery({
    queryKey: ["interessados"],
    queryFn: () => buscar(),
  });
  const [filtro, setFiltro] = useState<StatusDoInteressado | "todos">("novo");
  const lista = (data ?? []).filter((i) => filtro === "todos" || i.status === filtro);
  const novos = (data ?? []).filter((i) => i.status === "novo").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-brand-yellow/20 bg-brand-black px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10" />
            <div>
              <h1 className="text-base font-bold uppercase tracking-widest text-brand-onblack">
                Interessados
              </h1>
              <p className="text-xs text-brand-onblack/60">Pedidos do formulário do site</p>
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
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-8">
        <nav aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
          {(["novo", "contatado", "matriculado", "descartado", "todos"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              aria-pressed={filtro === f}
              className={cn(
                "min-h-11 rounded-full px-4 text-sm font-medium",
                filtro === f
                  ? "bg-brand-yellow text-brand-black"
                  : "border border-foreground/15 hover:bg-foreground/5",
              )}
            >
              {f === "todos" ? "Todos" : ROTULO_STATUS[f]}
              {f === "novo" && novos > 0 ? ` (${novos})` : ""}
            </button>
          ))}
        </nav>
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando…
          </p>
        ) : error ? (
          <p
            role="alert"
            className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
          >
            {traduzErroServidor(error instanceof Error ? error : new Error("erro"))}
          </p>
        ) : lista.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pedido nesta situação.</p>
        ) : (
          <ul className="space-y-4">
            {lista.map((i) => (
              <Cartao key={i.id} i={i} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
