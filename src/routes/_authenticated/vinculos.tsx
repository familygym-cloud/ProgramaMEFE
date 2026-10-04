import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Link2, Link2Off, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/BrandLogo";
import { traduzErroServidor } from "@/lib/erros-servidor";
import {
  definirVinculo,
  definirVinculosEmLote,
  garantirPerfilStaff,
  listarVinculos,
  podeAtivarPerfilStaff,
} from "@/lib/vinculos.functions";
import { ERRO_APENAS_EQUIPE, type ContaUsuario } from "@/lib/vinculos";

export const Route = createFileRoute("/_authenticated/vinculos")({
  head: () => ({
    meta: [
      { title: "Vínculos de alunos | Academia Family Gym" },
      {
        name: "description",
        content:
          "Vincule cada aluno da Academia Family Gym à conta de acesso dele para liberar a ficha individual.",
      },
      { property: "og:title", content: "Vínculos de alunos | Academia Family Gym" },
      {
        property: "og:description",
        content: "Tela da equipe para ligar alunos às contas de acesso do painel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Vinculos,
});

const SEM_VINCULO = "__nenhum__";

function Vinculos() {
  const queryClient = useQueryClient();
  const buscar = useServerFn(listarVinculos);
  const salvar = useServerFn(definirVinculo);
  const verSePodeAtivar = useServerFn(podeAtivarPerfilStaff);
  const ativar = useServerFn(garantirPerfilStaff);

  const { data, isLoading, error } = useQuery({
    queryKey: ["vinculos"],
    queryFn: () => buscar(),
    // Quem não é da equipe não deve esperar as tentativas automáticas para ver o aviso.
    retry: (tentativas, e) => e.message !== ERRO_APENAS_EQUIPE && tentativas < 2,
  });

  const semPermissao = error?.message === ERRO_APENAS_EQUIPE;

  // O bootstrap do primeiro staff é uma ação explícita, oferecida só à conta autorizada
  // (STAFF_BOOTSTRAP_EMAIL) e só enquanto não existe nenhum staff.
  const podeAtivar = useQuery({
    queryKey: ["vinculos-pode-ativar-equipe"],
    queryFn: () => verSePodeAtivar(),
    enabled: semPermissao,
    retry: false,
  });

  const ativarEquipe = useMutation({
    mutationFn: () => ativar(),
    onSuccess: (r) => {
      if (r.promovido) {
        toast.success("Perfil da equipe ativado.");
        queryClient.invalidateQueries({ queryKey: ["vinculos"] });
        queryClient.invalidateQueries({ queryKey: ["painel-alunos"] });
      } else {
        toast.error("Esta conta não pode ativar o perfil da equipe.");
      }
      queryClient.invalidateQueries({ queryKey: ["vinculos-pode-ativar-equipe"] });
    },
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
  });

  // Em sucesso e em erro: uma falha pode ter mudado o banco antes de falhar, e a tabela precisa
  // refletir o que realmente está gravado.
  const sincronizar = () => {
    queryClient.invalidateQueries({ queryKey: ["vinculos"] });
    queryClient.invalidateQueries({ queryKey: ["painel-alunos"] });
  };

  const mutation = useMutation({
    mutationFn: (vars: { alunoId: string; userId: string | null }) => salvar({ data: vars }),
    onSuccess: (_r, vars) => {
      toast.success(vars.userId ? "Aluno vinculado à conta." : "Vínculo removido.");
    },
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
    onSettled: sincronizar,
  });

  const salvarLote = useServerFn(definirVinculosEmLote);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const lote = useMutation({
    mutationFn: (itens: { alunoId: string; userId: string | null }[]) =>
      salvarLote({ data: { itens } }),
    onSuccess: (r) => {
      toast.success(`${r.atualizados} aluno(s) atualizado(s).`);
      setSelecionados([]);
    },
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
    onSettled: sincronizar,
  });

  const alunos = data?.alunos ?? [];
  const selecionadosSet = useMemo(() => new Set(selecionados), [selecionados]);
  const idsDeContas = useMemo(() => new Set((data?.contas ?? []).map((c) => c.id)), [data]);
  const todosMarcados = alunos.length > 0 && selecionados.length === alunos.length;

  function alternar(id: string) {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  }

  function desvincularSelecionados() {
    const itens = alunos
      .filter((a) => selecionadosSet.has(a.id) && a.userId)
      .map((a) => ({ alunoId: a.id, userId: null }));
    if (itens.length === 0) {
      toast.info("Nenhum dos alunos selecionados está vinculado.");
      return;
    }
    lote.mutate(itens);
  }

  function vincularPorEmail() {
    const contasPorEmail = new Map<string, ContaUsuario>(
      (data?.contas ?? []).map((c) => [c.email.trim().toLowerCase(), c]),
    );
    const itens: { alunoId: string; userId: string | null }[] = [];
    let semConta = 0;
    let naoConfirmadas = 0;
    for (const a of alunos) {
      if (!selecionadosSet.has(a.id)) continue;
      const conta = a.email ? contasPorEmail.get(a.email.trim().toLowerCase()) : undefined;
      if (!conta) semConta += 1;
      // Casar só pelo texto do e-mail seria perigoso se qualquer um pudesse se cadastrar com o
      // e-mail de um aluno: o vínculo automático só vale para e-mail confirmado.
      else if (!conta.emailConfirmado) naoConfirmadas += 1;
      else itens.push({ alunoId: a.id, userId: conta.id });
    }
    if (itens.length === 0) {
      toast.error(
        naoConfirmadas > 0
          ? "As contas encontradas ainda não confirmaram o e-mail. Peça aos alunos para confirmar antes de vincular."
          : "Nenhum e-mail dos alunos selecionados tem conta criada em /auth.",
      );
      return;
    }
    if (semConta > 0) toast.info(`${semConta} aluno(s) sem conta correspondente foram ignorados.`);
    if (naoConfirmadas > 0) {
      toast.info(`${naoConfirmadas} aluno(s) com e-mail ainda não confirmado foram ignorados.`);
    }
    lote.mutate(itens);
  }

  const vinculados = alunos.filter((a) => a.userId).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-brand-yellow/20 bg-brand-black px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10" />
            <div>
              <h1 className="text-base font-bold uppercase tracking-widest text-brand-onblack">
                Vínculos de acesso
              </h1>
              <p className="text-xs text-brand-onblack/60">
                Ligue cada aluno à conta que ele usa para entrar
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

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando contas e alunos…
          </div>
        ) : semPermissao ? (
          <div className="space-y-3 rounded-lg border border-border bg-card p-4 text-sm">
            <p>Esta tela é exclusiva da equipe da academia, e a sua conta não tem esse perfil.</p>
            {podeAtivar.data === true ? (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Esta conta está autorizada a assumir o perfil da equipe, porque ainda não existe
                  ninguém com ele.
                </p>
                <Button
                  size="sm"
                  className="gap-2 rounded-full bg-brand-yellow text-xs text-brand-black hover:bg-brand-yellow/90"
                  disabled={ativarEquipe.isPending}
                  onClick={() => ativarEquipe.mutate()}
                >
                  {ativarEquipe.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Ativar perfil da equipe
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Se você deveria ter acesso, peça a quem administra a academia para liberar a sua
                conta.
              </p>
            )}
          </div>
        ) : error ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            {traduzErroServidor(error)}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
              <Badge className="gap-1 bg-brand-yellow text-brand-black">
                <Link2 className="size-3" /> {vinculados} de {data!.alunos.length} vinculados
              </Badge>
              <span className="text-xs text-muted-foreground">
                {data!.contas.length} conta(s) cadastrada(s). Peça ao aluno para criar a conta em{" "}
                <span className="font-semibold text-foreground">/auth</span> e ela aparecerá aqui
                automaticamente.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-yellow/30 bg-card p-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Ações em lote · {selecionados.length} selecionado(s)
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="gap-1 rounded-full bg-brand-yellow text-xs text-brand-black hover:bg-brand-yellow/90"
                  disabled={selecionados.length === 0 || lote.isPending}
                  onClick={vincularPorEmail}
                >
                  <Wand2 className="size-3.5" /> Vincular por e-mail
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 rounded-full text-xs"
                  disabled={selecionados.length === 0 || lote.isPending}
                  onClick={desvincularSelecionados}
                >
                  <Link2Off className="size-3.5" /> Desvincular selecionados
                </Button>
                {selecionados.length > 0 ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-xs"
                    onClick={() => setSelecionados([])}
                  >
                    Limpar seleção
                  </Button>
                ) : null}
              </div>
              {lote.isPending ? (
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Aplicando…
                </span>
              ) : null}
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[40rem] text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <Checkbox
                        checked={todosMarcados}
                        aria-label="Selecionar todos os alunos"
                        onCheckedChange={(v) =>
                          setSelecionados(v === true ? alunos.map((a) => a.id) : [])
                        }
                      />
                    </th>
                    <th className="px-4 py-3">Aluno</th>
                    <th className="px-4 py-3">Conta de acesso</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.alunos.map((aluno) => (
                    <tr key={aluno.id} className="border-t border-border/60">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selecionadosSet.has(aluno.id)}
                          aria-label={`Selecionar ${aluno.nome}`}
                          onCheckedChange={() => alternar(aluno.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{aluno.nome}</div>
                        {aluno.email ? (
                          <div className="text-xs text-muted-foreground">{aluno.email}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={aluno.userId ?? SEM_VINCULO}
                          onValueChange={(v) =>
                            mutation.mutate({
                              alunoId: aluno.id,
                              userId: v === SEM_VINCULO ? null : v,
                            })
                          }
                        >
                          <SelectTrigger
                            className="w-full max-w-xs"
                            aria-label={`Conta de acesso de ${aluno.nome}`}
                          >
                            <SelectValue placeholder="Selecionar conta" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SEM_VINCULO}>Sem vínculo</SelectItem>
                            {aluno.userId && !idsDeContas.has(aluno.userId) ? (
                              <SelectItem value={aluno.userId}>Conta não encontrada</SelectItem>
                            ) : null}
                            {data!.contas.map((conta) => (
                              <SelectItem
                                key={conta.id}
                                value={conta.id}
                                disabled={!conta.emailConfirmado && conta.id !== aluno.userId}
                              >
                                {conta.emailConfirmado
                                  ? conta.email
                                  : `${conta.email} (e-mail não confirmado)`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {aluno.userId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs"
                            aria-label={`Desvincular ${aluno.nome}`}
                            onClick={() => mutation.mutate({ alunoId: aluno.id, userId: null })}
                          >
                            <Link2Off className="size-3.5" /> Desvincular
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {mutation.isPending ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Salvando…
              </p>
            ) : mutation.isSuccess ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="size-3.5 text-brand-yellow" /> Alterações salvas.
              </p>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
