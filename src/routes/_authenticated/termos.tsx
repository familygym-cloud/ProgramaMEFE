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

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function somarMeses(meses: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}

function dataBR(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

type Situacao = "Vencido" | "A vencer" | "Válido" | "Não registrado";

function situacaoTermo(validoAte: string | null): { situacao: Situacao; dias: number } {
  if (!validoAte) return { situacao: "Não registrado", dias: 0 };
  const dias = Math.round(
    (new Date(validoAte + "T00:00:00").getTime() - new Date(hojeISO() + "T00:00:00").getTime()) /
      86400000,
  );
  if (dias < 0) return { situacao: "Vencido", dias };
  if (dias <= 30) return { situacao: "A vencer", dias };
  return { situacao: "Válido", dias };
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

  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [novaData, setNovaData] = useState(somarMeses(12));

  const { data, isLoading, error } = useQuery({
    queryKey: ["termos"],
    queryFn: () => buscar(),
  });

  function aoSalvar(msg: string) {
    toast.success(msg);
    setSelecionados([]);
    queryClient.invalidateQueries({ queryKey: ["termos"] });
    queryClient.invalidateQueries({ queryKey: ["painel-alunos"] });
  }

  const individual = useMutation({
    mutationFn: (vars: { alunoId: string; validoAte: string }) => salvar({ data: vars }),
    onSuccess: () => aoSalvar("Termo atualizado."),
    onError: (e: Error) => toast.error(e.message),
  });

  const lote = useMutation({
    mutationFn: (vars: { alunoIds: string[]; validoAte: string }) => salvarLote({ data: vars }),
    onSuccess: (r) => aoSalvar(`${r.atualizados} termo(s) atualizado(s).`),
    onError: (e: Error) => toast.error(e.message),
  });

  const alunos = data ?? [];
  const marcados = useMemo(() => new Set(selecionados), [selecionados]);
  const todosMarcados = alunos.length > 0 && selecionados.length === alunos.length;

  const resumo = useMemo(() => {
    const base = { Vencido: 0, "A vencer": 0, Válido: 0, "Não registrado": 0 } as Record<
      Situacao,
      number
    >;
    for (const a of alunos) base[situacaoTermo(a.termoValidoAte).situacao] += 1;
    return base;
  }, [alunos]);

  const semPresenca = useMemo(
    () => alunos.filter((a) => a.presencas30d === 0).length,
    [alunos],
  );


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

        <section className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
          <div className="space-y-1.5">
            <label htmlFor="validade" className="text-xs text-muted-foreground">
              Nova validade
            </label>
            <Input
              id="validade"
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              className="w-44"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setNovaData(somarMeses(12))}>
            <CalendarClock className="size-3.5" /> +12 meses
          </Button>
          <Button variant="outline" size="sm" onClick={() => setNovaData(somarMeses(6))}>
            <CalendarClock className="size-3.5" /> +6 meses
          </Button>
          <Button
            size="sm"
            disabled={selecionados.length === 0 || lote.isPending}
            onClick={() => lote.mutate({ alunoIds: selecionados, validoAte: novaData })}
          >
            {lote.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="size-3.5" />
            )}
            Registrar para {selecionados.length} selecionado(s)
          </Button>
          {selecionados.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setSelecionados([])}>
              Limpar seleção
            </Button>
          ) : null}
        </section>

        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando alunos…
          </p>
        ) : error ? (
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        ) : (
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={todosMarcados}
                      onCheckedChange={(v) =>
                        setSelecionados(v ? alunos.map((a) => a.id) : [])
                      }
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead className="text-right">Treinos/mês</TableHead>
                  <TableHead>Frequência por modalidade (30 dias)</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunos.map((a) => {
                  const { situacao, dias } = situacaoTermo(a.termoValidoAte);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Checkbox
                          checked={marcados.has(a.id)}
                          onCheckedChange={(v) =>
                            setSelecionados((s) =>
                              v ? [...s, a.id] : s.filter((id) => id !== a.id),
                            )
                          }
                          aria-label={`Selecionar ${a.nome}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{a.plano}</TableCell>
                      <TableCell className="text-muted-foreground">{a.turno}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.frequencia}</TableCell>
                      <TableCell>
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
                      <TableCell className="text-sm text-muted-foreground">
                        {a.termoValidoAte ? dataBR(a.termoValidoAte) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={variante[situacao]}>{situacao}</Badge>
                          {situacao === "Vencido" ? (
                            <span className="text-xs text-destructive">
                              há {Math.abs(dias)} dia(s)
                            </span>
                          ) : situacao === "A vencer" ? (
                            <span className="text-xs text-muted-foreground">
                              em {dias} dia(s)
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={individual.isPending}
                          onClick={() =>
                            individual.mutate({ alunoId: a.id, validoAte: novaData })
                          }
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
    </div>
  );
}
