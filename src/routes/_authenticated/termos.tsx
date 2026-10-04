import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BrandLogo } from "@/components/BrandLogo";
import { ConfirmarAcao } from "@/components/ConfirmarAcao";
import { dataExiste, hojeBrasilia, somarMeses } from "@/lib/datas";
import { traduzErroServidor } from "@/lib/erros-servidor";
import {
  avisoDaNovaData,
  DATA_MAXIMA_TERMO,
  DATA_MINIMA_TERMO,
  situacaoTermo,
  type Situacao,
} from "@/lib/termos";
import { listarTermos, registrarTermo, registrarTermosEmLote } from "@/lib/termos.functions";

export const Route = createFileRoute("/_authenticated/termos")({
  head: () => ({
    meta: [
      { title: "Termos dos alunos | Academia Family Gym" },
      {
        name: "description",
        content:
          "Controle dos termos de adesão da Academia Family Gym: prazo de validade, alunos vencidos e renovação em poucos cliques.",
      },
      { property: "og:title", content: "Termos dos alunos | Academia Family Gym" },
      {
        property: "og:description",
        content: "Acompanhe e renove os termos de adesão dos alunos da Academia Family Gym.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Termos,
});

function dataBR(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

const variante: Record<Situacao, "default" | "secondary" | "destructive" | "outline"> = {
  Válido: "default",
  "A vencer": "secondary",
  Vencido: "destructive",
  "Não registrado": "outline",
};

function Termos() {
  const queryClient = useQueryClient();
  const buscar = useServerFn(listarTermos);
  const salvar = useServerFn(registrarTermo);
  const salvarLote = useServerFn(registrarTermosEmLote);

  // Dia de Brasília, recalculado a cada renderização: a conta não depende do fuso do navegador.
  const hoje = hojeBrasilia();

  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [novaData, setNovaData] = useState(() => somarMeses(hojeBrasilia(), 12));
  const [pergunta, setPergunta] = useState<{ aviso: string; executar: () => void } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["termos"],
    queryFn: () => buscar(),
  });

  function recarregar() {
    queryClient.invalidateQueries({ queryKey: ["termos"] });
    queryClient.invalidateQueries({ queryKey: ["painel-alunos"] });
  }

  // A seleção só perde quem foi atualizado: renovar uma linha não apaga o lote que a pessoa montou.
  const individual = useMutation({
    mutationFn: (vars: { alunoId: string; validoAte: string }) => salvar({ data: vars }),
    onSuccess: (_resultado, vars) => {
      toast.success("Termo atualizado.");
      setSelecionados((s) => s.filter((id) => id !== vars.alunoId));
      recarregar();
    },
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
  });

  const lote = useMutation({
    mutationFn: (vars: { alunoIds: string[]; validoAte: string }) => salvarLote({ data: vars }),
    onSuccess: (r, vars) => {
      const enviados = new Set(vars.alunoIds);
      setSelecionados((s) => s.filter((id) => !enviados.has(id)));
      if (r.atualizados === r.solicitados) {
        toast.success(`${r.atualizados} termo(s) atualizado(s).`);
      } else {
        toast.warning(
          `${r.atualizados} de ${r.solicitados} termo(s) atualizado(s). Os demais alunos não foram encontrados; atualize a página.`,
        );
      }
      recarregar();
    },
    onError: (e: Error) => {
      toast.error(traduzErroServidor(e));
      // Uma falha no meio do lote pode ter gravado parte dos alunos: mostra o estado real.
      recarregar();
    },
  });

  const alunos = useMemo(() => data ?? [], [data]);
  const marcados = useMemo(() => new Set(selecionados), [selecionados]);
  const alvos = useMemo(() => alunos.filter((a) => marcados.has(a.id)), [alunos, marcados]);
  const todosMarcados = alunos.length > 0 && alvos.length === alunos.length;
  const parcial = alvos.length > 0 && !todosMarcados;

  const novaDataValida =
    dataExiste(novaData) && novaData >= DATA_MINIMA_TERMO && novaData <= DATA_MAXIMA_TERMO;
  const avisoData = !novaData
    ? "Informe a data de validade."
    : !novaDataValida
      ? "Data inválida. Use uma data entre os anos 2000 e 2100."
      : novaData < hoje
        ? "Data anterior a hoje: o termo ficará vencido."
        : null;

  // Pergunta antes de gravar quando a data parece engano (já passou, ou encurta um prazo maior).
  function confirmarOuExecutar(
    alvosDoPedido: readonly { nome: string; termoValidoAte: string | null }[],
    executar: () => void,
  ) {
    const aviso = avisoDaNovaData(alvosDoPedido, novaData, hoje);
    if (aviso) setPergunta({ aviso, executar });
    else executar();
  }

  function registrarSelecionados() {
    confirmarOuExecutar(alvos, () =>
      lote.mutate({ alunoIds: alvos.map((a) => a.id), validoAte: novaData }),
    );
  }

  function renovar(aluno: (typeof alunos)[number]) {
    confirmarOuExecutar([aluno], () =>
      individual.mutate({ alunoId: aluno.id, validoAte: novaData }),
    );
  }

  const resumo = useMemo(() => {
    const base = { Vencido: 0, "A vencer": 0, Válido: 0, "Não registrado": 0 } as Record<
      Situacao,
      number
    >;
    for (const a of alunos) base[situacaoTermo(a.termoValidoAte, hoje).situacao] += 1;
    return base;
  }, [alunos, hoje]);

  const semPresenca = useMemo(() => alunos.filter((a) => a.presencas30d === 0).length, [alunos]);

  return (
    <div className="min-h-screen bg-background px-5 py-8 md:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <BrandLogo className="h-11" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                Termos de adesão
              </span>
            </div>
            <h1 className="text-2xl font-semibold md:text-3xl">Controle de termos</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Veja de uma vez a situação, o plano e a frequência de cada aluno — e renove ou
              registre o termo direto daqui.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2 rounded-full text-xs uppercase tracking-widest"
          >
            <Link to="/dashboard">
              <ArrowLeft className="size-3.5" /> Painel
            </Link>
          </Button>
        </header>

        <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(["Vencido", "A vencer", "Válido", "Não registrado"] as Situacao[]).map((s) => (
            <div key={s} className="rounded-xl border border-border p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{s}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{resumo[s]}</div>
            </div>
          ))}
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-destructive">
              <AlertTriangle className="size-3.5" /> Sem presença (30d)
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-destructive">
              {semPresenca}
            </div>
          </div>
        </section>

        <section className="space-y-2 rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label htmlFor="validade" className="text-xs text-muted-foreground">
                Nova validade
              </label>
              <Input
                id="validade"
                type="date"
                value={novaData}
                min={DATA_MINIMA_TERMO}
                max={DATA_MAXIMA_TERMO}
                aria-invalid={!novaDataValida}
                aria-describedby={avisoData ? "validade-ajuda" : undefined}
                onChange={(e) => setNovaData(e.target.value)}
                className="w-44"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNovaData(somarMeses(hojeBrasilia(), 12))}
            >
              <CalendarClock className="size-3.5" /> +12 meses
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNovaData(somarMeses(hojeBrasilia(), 6))}
            >
              <CalendarClock className="size-3.5" /> +6 meses
            </Button>
            <Button
              size="sm"
              disabled={alvos.length === 0 || lote.isPending || !novaDataValida}
              onClick={registrarSelecionados}
            >
              {lote.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="size-3.5" />
              )}
              Registrar para {alvos.length} selecionado(s)
            </Button>
            {alvos.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setSelecionados([])}>
                Limpar seleção
              </Button>
            ) : null}
          </div>
          {avisoData ? (
            <p
              id="validade-ajuda"
              className={`text-xs ${novaDataValida ? "text-muted-foreground" : "text-destructive"}`}
              role={novaDataValida ? "status" : "alert"}
            >
              {avisoData}
            </p>
          ) : null}
        </section>

        {isLoading ? (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando alunos…
          </p>
        ) : error ? (
          <p role="alert" className="text-sm text-destructive">
            {traduzErroServidor(error)}
          </p>
        ) : (
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={todosMarcados ? true : parcial ? "indeterminate" : false}
                      onCheckedChange={(v) => setSelecionados(v ? alunos.map((a) => a.id) : [])}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="hidden md:table-cell">Turno</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Treinos/mês</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Frequência por modalidade (30 dias)
                  </TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="sticky right-0 bg-background text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunos.map((a) => {
                  const { situacao, dias } = situacaoTermo(a.termoValidoAte, hoje);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Checkbox
                          checked={marcados.has(a.id)}
                          onCheckedChange={(v) =>
                            setSelecionados((s) =>
                              v ? [...new Set([...s, a.id])] : s.filter((id) => id !== a.id),
                            )
                          }
                          aria-label={`Selecionar ${a.nome}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {a.nome}
                        {/* Abaixo de lg a coluna de frequência some; o alerta importante vai para cá. */}
                        {a.presencas30d === 0 ? (
                          <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-destructive lg:hidden">
                            <AlertTriangle className="size-3" />
                            Sem presença em 30 dias
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.plano}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {a.turno}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">
                        {a.frequencia}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {a.modalidades.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {a.modalidades.map((m) => (
                              <Badge key={m.nome} variant="secondary" className="font-normal">
                                {m.nome} · {m.presencas}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                            <AlertTriangle className="size-3.5" />
                            Sem presença nos últimos 30 dias
                            {a.ultimoCheckin ? (
                              <span className="font-normal text-muted-foreground">
                                (última: {dataBR(a.ultimoCheckin)})
                              </span>
                            ) : (
                              <span className="font-normal text-muted-foreground">
                                (nunca compareceu)
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {a.termoValidoAte ? dataBR(a.termoValidoAte) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-x-2">
                          <Badge variant={variante[situacao]}>{situacao}</Badge>
                          {situacao === "Vencido" ? (
                            <span className="text-xs text-destructive">
                              há {Math.abs(dias)} dia(s)
                            </span>
                          ) : situacao === "A vencer" ? (
                            <span className="text-xs text-muted-foreground">
                              {dias === 0 ? "vence hoje" : `em ${dias} dia(s)`}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="sticky right-0 bg-background text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={individual.isPending || !novaDataValida}
                          aria-label={`${a.termoValidoAte ? "Renovar" : "Registrar"} termo de ${a.nome}`}
                          onClick={() => renovar(a)}
                        >
                          <RefreshCw className="size-3.5" />
                          {a.termoValidoAte ? "Renovar" : "Registrar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ConfirmarAcao
        aberto={pergunta !== null}
        aoMudarAberto={(aberto) => {
          if (!aberto) setPergunta(null);
        }}
        titulo="Confirmar a nova validade?"
        descricao={pergunta ? `${pergunta.aviso} Deseja continuar?` : ""}
        rotuloConfirmar="Continuar"
        aoConfirmar={() => {
          pergunta?.executar();
          setPergunta(null);
        }}
      />
    </div>
  );
}
