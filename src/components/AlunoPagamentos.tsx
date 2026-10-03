import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, CreditCard, Loader2, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listarPagamentos, type Pagamento } from "@/lib/pagamentos.functions";

const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function dataBR(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const badgeVariant: Record<Pagamento["status"], "default" | "secondary" | "destructive"> = {
  Pago: "default",
  Pendente: "secondary",
  Atrasado: "destructive",
};

export function AlunoPagamentos({ alunoId, plano }: { alunoId: string; plano: string }) {
  const buscar = useServerFn(listarPagamentos);
  const { data, isLoading, error } = useQuery({
    queryKey: ["pagamentos", alunoId],
    queryFn: () => buscar({ data: { alunoId } }),
  });

  if (isLoading) {
    return (
      <Card className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando pagamentos…
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-sm text-destructive">
        Não foi possível carregar os pagamentos: {(error as Error).message}
      </Card>
    );
  }

  const parcelas = data ?? [];
  const atrasadas = parcelas.filter((p) => p.status === "Atrasado");
  const emAberto = parcelas.filter((p) => p.status !== "Pago");
  const valorPlano = parcelas[0]?.valor ?? 0;
  const totalAberto = emAberto.reduce((s, p) => s + p.valor, 0);
  const totalParcelas = parcelas[0]?.totalParcelas ?? parcelas.length;
  const pagas = parcelas.filter((p) => p.status === "Pago").length;

  return (
    <div className="space-y-4">
      {atrasadas.length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <div className="font-medium">
              {atrasadas.length} parcela(s) em atraso · {moeda(atrasadas.reduce((s, p) => s + p.valor, 0))}
            </div>
            <p className="text-xs opacity-90">
              Vencimento mais antigo em {dataBR(atrasadas[0]!.vencimento)}. Combine a
              regularização com o aluno antes de liberar novos treinos.
            </p>
          </div>
        </div>
      ) : parcelas.length > 0 ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
          <CheckCircle2 className="size-4 text-primary" />
          Pagamentos em dia.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="gap-1 p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wallet className="size-3.5 text-primary" /> Valor do plano {plano}
          </div>
          <div className="text-lg font-semibold tabular-nums">{moeda(valorPlano)}</div>
          <div className="text-xs text-muted-foreground">por mês</div>
        </Card>
        <Card className="gap-1 p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CreditCard className="size-3.5 text-primary" /> Parcelas pagas
          </div>
          <div className="text-lg font-semibold tabular-nums">
            {pagas} / {totalParcelas}
          </div>
          <div className="text-xs text-muted-foreground">{emAberto.length} em aberto</div>
        </Card>
        <Card className="gap-1 p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="size-3.5 text-primary" /> Total em aberto
          </div>
          <div className="text-lg font-semibold tabular-nums">{moeda(totalAberto)}</div>
          <div className="text-xs text-muted-foreground">
            {atrasadas.length > 0 ? `${atrasadas.length} em atraso` : "sem atrasos"}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 space-y-1">
          <h3 className="text-sm font-semibold">Parcelas</h3>
          <p className="text-xs text-muted-foreground">Mensalidades registradas</p>
        </div>
        {parcelas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma mensalidade registrada para este aluno.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Referência</TableHead>
                <TableHead className="text-xs">Parcela</TableHead>
                <TableHead className="text-xs">Vencimento</TableHead>
                <TableHead className="text-right text-xs">Valor</TableHead>
                <TableHead className="text-xs">Forma</TableHead>
                <TableHead className="text-xs">Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parcelas.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs font-medium">{p.referencia}</TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">
                    {p.parcela}/{p.totalParcelas}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {dataBR(p.vencimento)}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {moeda(p.valor)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.metodo}</TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant[p.status]}>{p.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
