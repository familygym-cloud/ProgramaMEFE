import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { chaveDeComparacao } from "@/lib/cadastro-alunos";
import { hojeBrasilia } from "@/lib/datas";
import { traduzErroServidor } from "@/lib/erros-servidor";
import {
  LIMITES_LANCAMENTO,
  montarLancamento,
  type AlunoParaCobranca,
  type CampoDoLancamento,
  type TipoDeLancamento,
} from "@/lib/mensalidades";
import { lancarMensalidades } from "@/lib/mensalidades.functions";
import { METODOS_PAGAMENTO } from "@/lib/pagamentos";
import { cn } from "@/lib/utils";

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR");

type Valores = {
  tipo: TipoDeLancamento;
  descricao: string;
  valor: string;
  primeiroVencimento: string;
  parcelas: string;
  metodo: string;
};

const INICIAL = (): Valores => ({
  tipo: "mensalidade",
  descricao: "",
  valor: "",
  primeiroVencimento: hojeBrasilia(),
  parcelas: "1",
  metodo: "Pix",
});

/** Lançamento manual: uma ou várias parcelas de um aluno (o primeiro lançamento de cada um, matrícula, taxas). */
export function LancarMensalidade({
  aberto,
  aoMudarAberto,
  alunos,
  alunoInicial,
  aoLancar,
}: {
  aberto: boolean;
  aoMudarAberto: (aberto: boolean) => void;
  alunos: readonly AlunoParaCobranca[];
  alunoInicial?: AlunoParaCobranca | null;
  aoLancar: () => void;
}) {
  const lancar = useServerFn(lancarMensalidades);
  const [aluno, setAluno] = useState<AlunoParaCobranca | null>(alunoInicial ?? null);
  const [busca, setBusca] = useState("");
  const [valores, setValores] = useState<Valores>(INICIAL);
  const [erros, setErros] = useState<Partial<Record<CampoDoLancamento, string>>>({});

  useEffect(() => {
    if (aberto) {
      setAluno(alunoInicial ?? null);
      setBusca("");
      setValores(INICIAL());
      setErros({});
    }
  }, [aberto, alunoInicial]);

  const entrada = { ...valores, alunoId: aluno?.id ?? "" };
  const previa = useMemo(() => montarLancamento(entrada, hojeBrasilia()), [valores, aluno]); // eslint-disable-line react-hooks/exhaustive-deps

  const achados = useMemo(() => {
    const alvo = chaveDeComparacao(busca);
    if (alvo === "") return [];
    return alunos.filter((a) => chaveDeComparacao(a.nome).includes(alvo)).slice(0, 8);
  }, [alunos, busca]);

  const gravar = useMutation({
    mutationFn: () => lancar({ data: entrada }),
    onSuccess: (r) => {
      if (!r.ok) {
        setErros(r.erros);
        toast.error("Confira os campos destacados.");
        return;
      }
      toast.success(r.criadas === 1 ? "Parcela lançada." : `${r.criadas} parcelas lançadas.`);
      aoMudarAberto(false);
      aoLancar();
    },
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
  });

  const mudar = (campo: keyof Valores) => (v: string) => {
    setValores((atual) => ({ ...atual, [campo]: v }));
    setErros((atual) =>
      atual[campo as CampoDoLancamento] ? { ...atual, [campo]: undefined } : atual,
    );
  };

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const r = montarLancamento(entrada, hojeBrasilia());
    if (!r.ok) {
      setErros(r.erros);
      toast.error("Confira os campos destacados.");
      return;
    }
    gravar.mutate();
  }

  const Erro = ({ campo }: { campo: CampoDoLancamento }) =>
    erros[campo] ? (
      <p role="alert" className="text-sm text-destructive">
        {erros[campo]}
      </p>
    ) : null;

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Lançar mensalidade</DialogTitle>
          <DialogDescription>
            Cria uma ou mais parcelas para um aluno. Para quem já tem histórico, use “Gerar
            mensalidades do mês”.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="busca-aluno-financeiro">Aluno</Label>
            {aluno ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-foreground/15 p-3 text-sm">
                <span>
                  <strong>{aluno.nome}</strong>
                  <span className="block text-xs text-muted-foreground">{aluno.plano}</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAluno(null)}
                  className="min-h-11 gap-1 rounded-full"
                >
                  <X className="size-4" aria-hidden /> Trocar
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="busca-aluno-financeiro"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Digite o nome do aluno"
                    autoComplete="off"
                    className="min-h-11 pl-9"
                  />
                </div>
                {achados.length > 0 ? (
                  <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/10">
                    {achados.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setAluno(a);
                            setErros((atual) => {
                              const novo = { ...atual };
                              delete novo.alunoId;
                              return novo;
                            });
                          }}
                          className="min-h-11 w-full px-3 py-2 text-left text-sm hover:bg-foreground/5"
                        >
                          {a.nome}{" "}
                          <span className="text-xs text-muted-foreground">
                            · {a.plano} · {a.status}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : busca.trim() !== "" ? (
                  <p className="text-sm text-muted-foreground">Nenhum aluno com esse nome.</p>
                ) : null}
              </>
            )}
            <Erro campo="alunoId" />
          </div>

          <div role="group" aria-label="O que será cobrado" className="flex flex-wrap gap-2">
            {(
              [
                ["mensalidade", "Mensalidade"],
                ["outro", "Outra cobrança (matrícula, taxa…)"],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                aria-pressed={valores.tipo === id}
                onClick={() => setValores((v) => ({ ...v, tipo: id }))}
                className={cn(
                  "min-h-11 rounded-full px-4 text-sm font-medium",
                  valores.tipo === id
                    ? "bg-brand-yellow text-brand-black"
                    : "border border-foreground/15 hover:bg-foreground/5",
                )}
              >
                {rotulo}
              </button>
            ))}
          </div>

          {valores.tipo === "outro" ? (
            <div className="space-y-1.5">
              <Label htmlFor="lanc-descricao">Descrição</Label>
              <Input
                id="lanc-descricao"
                value={valores.descricao}
                onChange={(e) => mudar("descricao")(e.target.value)}
                maxLength={LIMITES_LANCAMENTO.descricao}
                placeholder="Ex.: Matrícula"
                className="min-h-11"
              />
              <Erro campo="descricao" />
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lanc-valor">Valor de cada parcela (R$)</Label>
              <Input
                id="lanc-valor"
                value={valores.valor}
                onChange={(e) => mudar("valor")(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                className="min-h-11"
              />
              <Erro campo="valor" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lanc-parcelas">Parcelas</Label>
              <Input
                id="lanc-parcelas"
                value={valores.parcelas}
                onChange={(e) => mudar("parcelas")(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                className="min-h-11"
              />
              <Erro campo="parcelas" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lanc-vencimento">Primeiro vencimento</Label>
              <Input
                id="lanc-vencimento"
                type="date"
                value={valores.primeiroVencimento}
                onChange={(e) => mudar("primeiroVencimento")(e.target.value)}
                className="min-h-11"
              />
              <Erro campo="primeiroVencimento" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lanc-metodo">Forma de pagamento</Label>
              <Select value={valores.metodo} onValueChange={mudar("metodo")}>
                <SelectTrigger id="lanc-metodo" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGAMENTO.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Erro campo="metodo" />
            </div>
          </div>

          {previa.ok ? (
            <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-3 text-sm">
              <p className="mb-1 font-medium">
                {previa.linhas.length === 1
                  ? "Será lançada 1 parcela"
                  : `Serão lançadas ${previa.linhas.length} parcelas`}{" "}
                (total {moeda(previa.linhas.reduce((s, l) => s + l.valor, 0))}):
              </p>
              <ul className="max-h-28 space-y-0.5 overflow-y-auto text-muted-foreground">
                {previa.linhas.map((l) => (
                  <li key={l.parcela} className="tabular-nums">
                    {l.parcela}/{l.total_parcelas} · vence em {dataBR(l.vencimento)} ·{" "}
                    {moeda(l.valor)} · {l.referencia}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

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
              type="submit"
              disabled={gravar.isPending}
              className="min-h-11 gap-2 rounded-full"
            >
              {gravar.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Lançar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
