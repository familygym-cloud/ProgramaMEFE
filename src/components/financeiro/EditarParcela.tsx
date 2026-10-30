import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
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
import { hojeBrasilia } from "@/lib/datas";
import { traduzErroServidor } from "@/lib/erros-servidor";
import { lerValorEmReais, validarEdicaoDeParcela, type CampoDaEdicao } from "@/lib/mensalidades";
import { editarParcela } from "@/lib/mensalidades.functions";
import { METODOS_PAGAMENTO } from "@/lib/pagamentos";
import type { PagamentoFinanceiro } from "@/lib/pagamentos.functions";

type Valores = { valor: string; vencimento: string; metodo: string };

/** 123.4 -> "123,40": o campo mostra o valor como a equipe digita. */
const valorParaCampo = (v: number) => v.toFixed(2).replace(".", ",");

const doBanco = (p: PagamentoFinanceiro): Valores => ({
  valor: valorParaCampo(p.valor),
  vencimento: p.vencimento,
  metodo: (METODOS_PAGAMENTO as readonly string[]).includes(p.metodo) ? p.metodo : "Pix",
});

/** Corrige uma parcela em aberto: valor, vencimento e forma de pagamento. Parcela paga não abre aqui. */
export function EditarParcela({
  parcela,
  aoMudarAberto,
  aoSalvar,
}: {
  parcela: PagamentoFinanceiro | null;
  aoMudarAberto: (aberto: boolean) => void;
  aoSalvar: () => void;
}) {
  const editar = useServerFn(editarParcela);
  const [valores, setValores] = useState<Valores>({ valor: "", vencimento: "", metodo: "Pix" });
  const [erros, setErros] = useState<Partial<Record<CampoDaEdicao, string>>>({});

  useEffect(() => {
    if (parcela) {
      setValores(doBanco(parcela));
      setErros({});
    }
  }, [parcela]);

  const gravar = useMutation({
    mutationFn: (id: string) => editar({ data: { id, ...valores } }),
    onSuccess: (r) => {
      if (!r.ok) {
        setErros(r.erros);
        toast.error("Confira os campos destacados.");
        return;
      }
      toast.success("Parcela atualizada.");
      aoMudarAberto(false);
      aoSalvar();
    },
    onError: (e: Error) => {
      toast.error(traduzErroServidor(e));
      // A parcela pode ter sido paga ou excluída por outra pessoa: atualiza a lista.
      aoSalvar();
    },
  });

  const mudar = (campo: keyof Valores) => (v: string) => {
    setValores((atual) => ({ ...atual, [campo]: v }));
    setErros((atual) => (atual[campo] ? { ...atual, [campo]: undefined } : atual));
  };

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!parcela) return;
    const r = validarEdicaoDeParcela(valores, hojeBrasilia());
    if (!r.ok) {
      setErros(r.erros);
      toast.error("Confira os campos destacados.");
      return;
    }
    const antes = doBanco(parcela);
    if (
      r.campos.valor === lerValorEmReais(antes.valor) &&
      r.campos.vencimento === antes.vencimento &&
      r.campos.metodo === antes.metodo
    ) {
      toast.info("Nada foi alterado.");
      aoMudarAberto(false);
      return;
    }
    gravar.mutate(parcela.id);
  }

  const Erro = ({ campo }: { campo: CampoDaEdicao }) =>
    erros[campo] ? (
      <p role="alert" className="text-sm text-destructive">
        {erros[campo]}
      </p>
    ) : null;

  return (
    <Dialog open={parcela !== null} onOpenChange={aoMudarAberto}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar parcela</DialogTitle>
          <DialogDescription>
            {parcela
              ? `Parcela ${parcela.parcela}/${parcela.totalParcelas} de ${parcela.alunoNome} · referência ${parcela.referencia}. A referência não muda.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="editar-valor">Valor (R$)</Label>
              <Input
                id="editar-valor"
                value={valores.valor}
                onChange={(e) => mudar("valor")(e.target.value)}
                inputMode="decimal"
                className="min-h-11"
              />
              <Erro campo="valor" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editar-vencimento">Vencimento</Label>
              <Input
                id="editar-vencimento"
                type="date"
                value={valores.vencimento}
                onChange={(e) => mudar("vencimento")(e.target.value)}
                className="min-h-11"
              />
              <Erro campo="vencimento" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editar-metodo">Forma de pagamento</Label>
            <Select value={valores.metodo} onValueChange={mudar("metodo")}>
              <SelectTrigger id="editar-metodo" className="min-h-11">
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
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
