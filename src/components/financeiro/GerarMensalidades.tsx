import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hojeBrasilia, somarMeses } from "@/lib/datas";
import { traduzErroServidor } from "@/lib/erros-servidor";
import { mesDe, referenciaDoMes } from "@/lib/mensalidades";
import { gerarMensalidadesDoMes, previaMensalidadesDoMes } from "@/lib/mensalidades.functions";

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR");
const NOME_DO_MES = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Do mês passado até três meses à frente: o que a recepção realmente usa. */
function mesesDisponiveis(hoje: string): { valor: string; rotulo: string }[] {
  return [-1, 0, 1, 2, 3].map((d) => {
    const mes = mesDe(somarMeses(`${hoje.slice(0, 7)}-01`, d));
    const [ano, m] = mes.split("-").map(Number) as [number, number];
    return { valor: mes, rotulo: NOME_DO_MES.format(new Date(Date.UTC(ano, m - 1, 1))) };
  });
}

/** Gera as mensalidades de um mês para quem já tem histórico, com prévia e escolha de quem entra. */
export function GerarMensalidades({
  aberto,
  aoMudarAberto,
  aoGerar,
}: {
  aberto: boolean;
  aoMudarAberto: (aberto: boolean) => void;
  aoGerar: () => void;
}) {
  const hoje = hojeBrasilia();
  const meses = useMemo(() => mesesDisponiveis(hoje), [hoje]);
  const previa = useServerFn(previaMensalidadesDoMes);
  const gerar = useServerFn(gerarMensalidadesDoMes);
  const [mes, setMes] = useState(mesDe(hoje));
  const [fora, setFora] = useState<ReadonlySet<string>>(new Set());

  const consulta = useQuery({
    queryKey: ["previa-mensalidades", mes],
    queryFn: () => previa({ data: { mes } }),
    enabled: aberto,
    staleTime: 0,
  });
  const lista = useMemo(() => consulta.data ?? [], [consulta.data]);
  const escolhidas = useMemo(() => lista.filter((c) => !fora.has(c.alunoId)), [lista, fora]);
  const total = escolhidas.reduce((s, c) => s + c.valor, 0);

  useEffect(() => {
    if (aberto) setFora(new Set());
  }, [aberto, mes]);

  const confirmar = useMutation({
    mutationFn: () => gerar({ data: { mes, alunoIds: escolhidas.map((c) => c.alunoId) } }),
    onSuccess: (r) => {
      toast.success(
        r.geradas === 1 ? "1 mensalidade gerada." : `${r.geradas} mensalidades geradas.`,
      );
      if (r.ignoradas > 0) {
        toast.info(
          `${r.ignoradas} ficaram de fora: já tinham parcela no mês ou deixaram de estar ativos.`,
        );
      }
      aoMudarAberto(false);
      aoGerar();
    },
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
  });

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerar mensalidades do mês</DialogTitle>
          <DialogDescription>
            Para cada aluno ativo que já foi cobrado antes e ainda não tem parcela no mês, repete o
            valor, a forma de pagamento e o dia do vencimento da última parcela. Desmarque quem não
            deve receber.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mes-das-mensalidades">Mês</Label>
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger id="mes-das-mensalidades" className="min-h-11 sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meses.map((m) => (
                  <SelectItem key={m.valor} value={m.valor}>
                    {m.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {consulta.isLoading ? (
            <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Calculando…
            </p>
          ) : consulta.error ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm"
            >
              {traduzErroServidor(consulta.error)}
            </p>
          ) : lista.length === 0 ? (
            <p className="rounded-xl border border-dashed border-foreground/15 p-4 text-sm text-muted-foreground">
              Nenhuma mensalidade a gerar para {referenciaDoMes(mes)}: os alunos ativos que já foram
              cobrados antes já têm parcela neste mês, ou ainda não há histórico. O primeiro
              lançamento de cada aluno é feito em “Lançar mensalidade”.
            </p>
          ) : (
            <>
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-foreground/10">
                <table className="w-full text-sm">
                  <caption className="sr-only">Mensalidades que serão geradas</caption>
                  <thead className="bg-foreground/[0.04] text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th scope="col" className="w-10 px-3 py-2">
                        <Checkbox
                          aria-label="Marcar ou desmarcar todos"
                          checked={fora.size === 0}
                          onCheckedChange={(v) =>
                            setFora(v === true ? new Set() : new Set(lista.map((c) => c.alunoId)))
                          }
                        />
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Aluno
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Vencimento
                      </th>
                      <th scope="col" className="px-3 py-2 text-right">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((c) => (
                      <tr key={c.alunoId} className="border-t border-foreground/10">
                        <td className="px-3 py-2">
                          <Checkbox
                            aria-label={`Gerar para ${c.alunoNome}`}
                            checked={!fora.has(c.alunoId)}
                            onCheckedChange={(v) =>
                              setFora((atual) => {
                                const novo = new Set(atual);
                                if (v === true) novo.delete(c.alunoId);
                                else novo.add(c.alunoId);
                                return novo;
                              })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          {c.alunoNome}
                          <span className="block text-xs text-muted-foreground">
                            {c.plano} · como em {dataBR(c.baseadaEm)} ({c.metodo})
                          </span>
                        </td>
                        <td className="px-3 py-2 tabular-nums">{dataBR(c.vencimento)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{moeda(c.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground">
                {escolhidas.length} de {lista.length} selecionada(s) · total {moeda(total)}
              </p>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => aoMudarAberto(false)}
            className="min-h-11 rounded-full"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={escolhidas.length === 0 || confirmar.isPending}
            onClick={() => confirmar.mutate()}
            className="min-h-11 gap-2 rounded-full"
          >
            {confirmar.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {escolhidas.length > 0 ? `Gerar ${escolhidas.length} mensalidade(s)` : "Gerar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
