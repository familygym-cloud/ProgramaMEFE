import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowLeft, CircleCheck, Clock, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { traduzErroServidor } from "@/lib/erros-servidor";
import { METODOS_PAGAMENTO, type MetodoPagamento } from "@/lib/pagamentos";
import {
  definirPagamento,
  listarFinanceiro,
  type PagamentoFinanceiro,
} from "@/lib/pagamentos.functions";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro | Academia Family Gym" },
      {
        name: "description",
        content:
          "Financeiro da Academia Family Gym: total de mensalidades, parcelas pagas, em aberto e atrasadas, com filtro por plano.",
      },
      { property: "og:title", content: "Financeiro | Academia Family Gym" },
      {
        property: "og:description",
        content:
          "Acompanhe mensalidades, parcelas pagas e atrasos dos alunos da Academia Family Gym.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Financeiro,
});

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataBR(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

type FiltroStatus = "Todos" | "Pago" | "Pendente" | "Atrasado";

function Financeiro() {
  const queryClient = useQueryClient();
  const buscar = useServerFn(listarFinanceiro);
  const marcar = useServerFn(definirPagamento);

  const [plano, setPlano] = useState("Todos");
  const [status, setStatus] = useState<FiltroStatus>("Todos");
  // Forma de pagamento escolhida em cada linha (Pix quando não escolhida) e parcela a reabrir.
  const [metodos, setMetodos] = useState<Record<string, MetodoPagamento>>({});
  const [parcelaParaReabrir, setParcelaParaReabrir] = useState<PagamentoFinanceiro | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["financeiro"],
    queryFn: () => buscar(),
  });

  const pagamentos = useMemo(() => data ?? [], [data]);

  const planos = useMemo(
    () => ["Todos", ...Array.from(new Set(pagamentos.map((p) => p.plano))).sort()],
    [pagamentos],
  );

  const filtrados = useMemo(
    () =>
      pagamentos.filter(
        (p) =>
          (plano === "Todos" || p.plano === plano) && (status === "Todos" || p.status === status),
      ),
    [pagamentos, plano, status],
  );

  const totais = useMemo(() => {
    const soma = (lista: typeof filtrados) => lista.reduce((t, p) => t + p.valor, 0);
    const pagos = filtrados.filter((p) => p.status === "Pago");
    const pendentes = filtrados.filter((p) => p.status === "Pendente");
    const atrasados = filtrados.filter((p) => p.status === "Atrasado");
    return {
      total: soma(filtrados),
      pagoValor: soma(pagos),
      abertoValor: soma(pendentes) + soma(atrasados),
      atrasoValor: soma(atrasados),
      pagos: pagos.length,
      pendentes: pendentes.length,
      atrasados: atrasados.length,
      alunosEmAtraso: new Set(atrasados.map((p) => p.alunoId)).size,
    };
  }, [filtrados]);

  const alternar = useMutation({
    mutationFn: (vars: { id: string; pago: boolean; metodo?: MetodoPagamento }) =>
      marcar({ data: vars }),
    onSuccess: (r) => {
      if (r.alterada) toast.success("Parcela atualizada.");
      else toast.info("Esta parcela já estava nessa situação. A lista foi atualizada.");
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
    },
    onError: (e: Error) => {
      toast.error(traduzErroServidor(e));
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-brand-yellow/20 bg-brand-black/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <BrandLogo className="h-8 w-auto" />
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-brand-yellow">
            Financeiro
          </span>
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
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {traduzErroServidor(error)}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Wallet className="size-4 text-brand-yellow" /> Total em mensalidades
            </p>
            <p className="mt-2 text-2xl font-bold">{moeda(totais.total)}</p>
            <p className="text-xs text-muted-foreground">{filtrados.length} parcela(s)</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <CircleCheck className="size-4 text-brand-yellow" /> Pagas
            </p>
            <p className="mt-2 text-2xl font-bold">{moeda(totais.pagoValor)}</p>
            <p className="text-xs text-muted-foreground">{totais.pagos} parcela(s)</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Clock className="size-4 text-brand-yellow" /> Em aberto
            </p>
            <p className="mt-2 text-2xl font-bold">{moeda(totais.abertoValor)}</p>
            <p className="text-xs text-muted-foreground">
              {totais.pendentes} a vencer · {totais.atrasados} em atraso
            </p>
          </div>
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-destructive">
              <AlertTriangle className="size-4" /> Em atraso
            </p>
            <p className="mt-2 text-2xl font-bold text-destructive">{moeda(totais.atrasoValor)}</p>
            <p className="text-xs text-destructive/80">
              {totais.alunosEmAtraso} aluno(s) com atraso
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Plano</p>
              <div className="flex flex-wrap gap-1.5">
                {planos.map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={plano === p ? "default" : "outline"}
                    className="rounded-full text-xs"
                    onClick={() => setPlano(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Situação</p>
              <div className="flex flex-wrap gap-1.5">
                {(["Todos", "Pago", "Pendente", "Atrasado"] as FiltroStatus[]).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={status === s ? "default" : "outline"}
                    className="rounded-full text-xs"
                    onClick={() => setStatus(s)}
                  >
                    {s === "Pendente" ? "A vencer" : s}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando mensalidades...
            </p>
          ) : filtrados.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhuma parcela encontrada com esses filtros.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap font-medium">{p.alunoNome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.plano}</TableCell>
                      <TableCell className="text-sm">{p.referencia}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {p.parcela}/{p.totalParcelas}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {dataBR(p.vencimento)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{moeda(p.valor)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === "Pago"
                              ? "default"
                              : p.status === "Atrasado"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {p.status === "Pendente" ? "A vencer" : p.status}
                        </Badge>
                        {p.status === "Pago" && p.pagoEm ? (
                          <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                            em {dataBR(p.pagoEm)}
                            {p.metodo ? ` · ${p.metodo}` : ""}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === "Pago" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full text-xs"
                            disabled={alternar.isPending}
                            onClick={() => setParcelaParaReabrir(p)}
                          >
                            Reabrir
                          </Button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <select
                              aria-label={`Forma de pagamento da parcela ${p.parcela}/${p.totalParcelas} de ${p.alunoNome}`}
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                              value={metodos[p.id] ?? "Pix"}
                              onChange={(e) =>
                                setMetodos((m) => ({
                                  ...m,
                                  [p.id]: e.target.value as MetodoPagamento,
                                }))
                              }
                            >
                              {METODOS_PAGAMENTO.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full text-xs"
                              disabled={alternar.isPending}
                              onClick={() =>
                                alternar.mutate({
                                  id: p.id,
                                  pago: true,
                                  metodo: metodos[p.id] ?? "Pix",
                                })
                              }
                            >
                              Marcar pago
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </main>

      <ConfirmarAcao
        aberto={parcelaParaReabrir !== null}
        aoMudarAberto={(aberto) => {
          if (!aberto) setParcelaParaReabrir(null);
        }}
        titulo="Reabrir esta parcela?"
        descricao={
          parcelaParaReabrir
            ? `Parcela ${parcelaParaReabrir.parcela}/${parcelaParaReabrir.totalParcelas} de ${parcelaParaReabrir.alunoNome} ` +
              `(${moeda(parcelaParaReabrir.valor)}). Ela volta a ficar em aberto` +
              (parcelaParaReabrir.pagoEm
                ? ` e a data do pagamento (${dataBR(parcelaParaReabrir.pagoEm)}) será apagada.`
                : ".")
            : ""
        }
        rotuloConfirmar="Reabrir parcela"
        destrutivo
        aoConfirmar={() => {
          if (parcelaParaReabrir) alternar.mutate({ id: parcelaParaReabrir.id, pago: false });
          setParcelaParaReabrir(null);
        }}
      />
    </div>
  );
}
