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
import {
  definirVinculo,
  definirVinculosEmLote,
  garantirPerfilStaff,
  listarVinculos,
} from "@/lib/vinculos.functions";

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
  const bootstrap = useServerFn(garantirPerfilStaff);
  const buscar = useServerFn(listarVinculos);
  const salvar = useServerFn(definirVinculo);

  const { data, isLoading, error } = useQuery({
    queryKey: ["vinculos"],
    queryFn: async () => {
      await bootstrap();
      return buscar();
    },
  });

  const mutation = useMutation({
    mutationFn: (vars: { alunoId: string; userId: string | null }) => salvar({ data: vars }),
    onSuccess: (_r, vars) => {
      toast.success(vars.userId ? "Aluno vinculado à conta." : "Vínculo removido.");
      queryClient.invalidateQueries({ queryKey: ["vinculos"] });
      queryClient.invalidateQueries({ queryKey: ["painel-alunos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const salvarLote = useServerFn(definirVinculosEmLote);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const lote = useMutation({
    mutationFn: (itens: { alunoId: string; userId: string | null }[]) =>
      salvarLote({ data: { itens } }),
    onSuccess: (r) => {
      toast.success(`${r.atualizados} aluno(s) atualizado(s).`);
      setSelecionados([]);
      queryClient.invalidateQueries({ queryKey: ["vinculos"] });
      queryClient.invalidateQueries({ queryKey: ["painel-alunos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const alunos = data?.alunos ?? [];
  const selecionadosSet = useMemo(() => new Set(selecionados), [selecionados]);
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
    const contasPorEmail = new Map(
      (data?.contas ?? []).map((c) => [c.email.trim().toLowerCase(), c.id]),
    );
    const itens: { alunoId: string; userId: string | null }[] = [];
    let semConta = 0;
    for (const a of alunos) {
      if (!selecionadosSet.has(a.id)) continue;
      const conta = a.email ? contasPorEmail.get(a.email.trim().toLowerCase()) : undefined;
      if (conta) itens.push({ alunoId: a.id, userId: conta });
      else semConta += 1;
    }
    if (itens.length === 0) {
      toast.error("Nenhum e-mail dos alunos selecionados tem conta criada em /auth.");
      return;
    }
    if (semConta > 0) toast.info(`${semConta} aluno(s) sem conta correspondente foram ignorados.`);
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
        ) : error ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            {(error as Error).message}
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

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
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
                          <SelectTrigger className="w-full max-w-xs">
                            <SelectValue placeholder="Selecionar conta" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SEM_VINCULO}>Sem vínculo</SelectItem>
                            {data!.contas.map((conta) => (
                              <SelectItem key={conta.id} value={conta.id}>
                                {conta.email}
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
                            onClick={() =>
                              mutation.mutate({ alunoId: aluno.id, userId: null })
                            }
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
