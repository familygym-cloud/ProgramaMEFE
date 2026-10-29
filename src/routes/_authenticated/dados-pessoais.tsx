import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { traduzErroServidor } from "@/lib/erros-servidor";
import {
  apagarDadosDoAluno,
  exportarDadosDoAluno,
  listarAlunosParaLgpd,
  type AlunoParaLgpd,
} from "@/lib/lgpd.functions";
import { confirmacaoConfere, nomeDoArquivoDeExportacao, type ModoDeApagar } from "@/lib/lgpd";

export const Route = createFileRoute("/_authenticated/dados-pessoais")({
  head: () => ({ meta: [{ title: "Dados pessoais (LGPD) | Academia Family Gym" }] }),
  component: DadosPessoais,
});

function baixarJson(nome: string, conteudo: unknown) {
  const blob = new Blob([JSON.stringify(conteudo, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function PainelDoAluno({ aluno, aoApagar }: { aluno: AlunoParaLgpd; aoApagar: () => void }) {
  const exportar = useServerFn(exportarDadosDoAluno);
  const apagar = useServerFn(apagarDadosDoAluno);
  const [modo, setModo] = useState<ModoDeApagar | null>(null);
  const [confirmacao, setConfirmacao] = useState("");

  const baixar = useMutation({
    mutationFn: () => exportar({ data: { alunoId: aluno.id } }),
    onSuccess: ({ dados }) => {
      baixarJson(
        nomeDoArquivoDeExportacao(aluno.nome, new Date().toISOString().slice(0, 10)),
        dados,
      );
      toast.success("Arquivo gerado. Entregue-o somente ao próprio titular.");
    },
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
  });

  const remover = useMutation({
    mutationFn: (m: ModoDeApagar) => apagar({ data: { alunoId: aluno.id, modo: m, confirmacao } }),
    onSuccess: (r) => {
      toast.success(
        r.havia_conta && !r.contaRemovida
          ? "Dados apagados, mas a conta de login não foi removida. Remova-a no Supabase."
          : "Pronto. Os dados foram apagados.",
      );
      setModo(null);
      setConfirmacao("");
      aoApagar();
    },
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
  });

  const confere = confirmacaoConfere(confirmacao, aluno.nome);

  return (
    <section className="space-y-5 rounded-3xl border border-foreground/10 p-5 sm:p-6">
      <div>
        <h2 className="font-display text-xl font-semibold">{aluno.nome}</h2>
        {aluno.email ? <p className="text-sm text-muted-foreground">{aluno.email}</p> : null}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-widest">Cópia dos dados</h3>
        <p className="text-sm text-muted-foreground">
          Gera um arquivo com tudo o que o sistema guarda sobre o aluno (cadastro, avaliações,
          treinos, presenças, pagamentos e termos). Fica registrado quem pediu e quando.
        </p>
        <Button
          type="button"
          onClick={() => baixar.mutate()}
          disabled={baixar.isPending}
          className="min-h-11 gap-2 rounded-full"
        >
          {baixar.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Download className="size-4" aria-hidden />
          )}
          Baixar dados do aluno
        </Button>
      </div>

      <div className="space-y-3 border-t border-foreground/10 pt-5">
        <h3 className="text-sm font-semibold uppercase tracking-widest">Apagar dados</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setModo("anonimizar")}
            aria-pressed={modo === "anonimizar"}
            className="rounded-2xl border border-foreground/15 p-4 text-left text-sm aria-pressed:border-brand-yellow aria-pressed:bg-brand-yellow/10"
          >
            <strong className="block">Anonimizar</strong>
            Remove tudo o que identifica ou é de saúde. Mantém só os pagamentos, sem nome, por
            obrigação contábil.
          </button>
          <button
            type="button"
            onClick={() => setModo("excluir")}
            aria-pressed={modo === "excluir"}
            className="rounded-2xl border border-foreground/15 p-4 text-left text-sm aria-pressed:border-destructive aria-pressed:bg-destructive/10"
          >
            <strong className="block">Excluir tudo</strong>
            Apaga também a ficha e os pagamentos. Use só quando não houver dever de guardar.
          </button>
        </div>
        {modo ? (
          <div className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-sm">
              Isto <strong>não pode ser desfeito</strong>. A conta de login do aluno também será
              removida. Para confirmar, digite o nome completo: <strong>{aluno.nome}</strong>
            </p>
            <label htmlFor="confirmacao-lgpd" className="sr-only">
              Nome do aluno para confirmar
            </label>
            <Input
              id="confirmacao-lgpd"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              autoComplete="off"
              className="min-h-11 rounded-xl"
            />
            <Button
              type="button"
              variant="destructive"
              disabled={!confere || remover.isPending}
              onClick={() => remover.mutate(modo)}
              className="min-h-11 gap-2 rounded-full"
            >
              {remover.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-4" aria-hidden />
              )}
              {modo === "excluir" ? "Excluir definitivamente" : "Anonimizar definitivamente"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DadosPessoais() {
  const queryClient = useQueryClient();
  const listar = useServerFn(listarAlunosParaLgpd);
  const { data, isLoading, error } = useQuery({
    queryKey: ["alunos-lgpd"],
    queryFn: () => listar(),
  });
  const [busca, setBusca] = useState("");
  const [escolhidoId, setEscolhidoId] = useState<string | null>(null);

  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const achados = termo
    ? (data ?? [])
        .filter((a) => `${a.nome} ${a.email ?? ""}`.toLocaleLowerCase("pt-BR").includes(termo))
        .slice(0, 20)
    : [];
  const escolhido = (data ?? []).find((a) => a.id === escolhidoId) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-brand-yellow/20 bg-brand-black px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10" />
            <div>
              <h1 className="text-base font-bold uppercase tracking-widest text-brand-onblack">
                Dados pessoais
              </h1>
              <p className="text-xs text-brand-onblack/60">Pedidos do titular (LGPD)</p>
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
          Quando um aluno pedir uma cópia dos dados dele ou a exclusão, confirme primeiro quem é a
          pessoa (documento ou pelo contato já cadastrado). Depois procure o aluno abaixo.
        </p>
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando…
          </p>
        ) : error ? (
          <p
            role="alert"
            className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
          >
            {traduzErroServidor(error)}
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="busca-lgpd" className="text-sm font-medium">
                Buscar aluno por nome ou e-mail
              </label>
              <Input
                id="busca-lgpd"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setEscolhidoId(null);
                }}
                className="min-h-11 rounded-xl"
              />
              {achados.length > 0 && !escolhido ? (
                <ul className="divide-y divide-foreground/10 rounded-2xl border border-foreground/10">
                  {achados.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setEscolhidoId(a.id)}
                        className="min-h-11 w-full px-4 py-2 text-left text-sm hover:bg-foreground/5"
                      >
                        {a.nome}
                        {a.email ? (
                          <span className="text-muted-foreground"> · {a.email}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : termo && !escolhido ? (
                <p className="text-sm text-muted-foreground">Nenhum aluno encontrado.</p>
              ) : null}
            </div>
            {escolhido ? (
              <PainelDoAluno
                key={escolhido.id}
                aluno={escolhido}
                aoApagar={() => {
                  setEscolhidoId(null);
                  setBusca("");
                  void queryClient.invalidateQueries({ queryKey: ["alunos-lgpd"] });
                }}
              />
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
