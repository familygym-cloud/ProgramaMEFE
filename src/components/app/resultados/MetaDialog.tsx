import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
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
import { META_MENSAL_PADRAO, ROTULO_META, hojeISO } from "@/lib/aluno-app/derive";
import { useAlunoApp } from "@/lib/aluno-app/store";
import type { MetaAluno, TipoMeta } from "@/lib/aluno-app/types";
import { formatarNumero } from "./dados";

const LIMITES: Record<TipoMeta, { min: number; max: number; inteiro: boolean; unidade: string }> = {
  peso: { min: 30, max: 300, inteiro: false, unidade: "kg" },
  imc: { min: 10, max: 50, inteiro: false, unidade: "" },
  frequencia: { min: 1, max: 31, inteiro: true, unidade: "treinos por mês" },
};

function ehTipoMeta(v: string): v is TipoMeta {
  return v === "peso" || v === "imc" || v === "frequencia";
}

function esquemaMeta(tipo: TipoMeta) {
  const { min, max, inteiro, unidade } = LIMITES[tipo];
  const faixa = `${formatarNumero(min, 0)} e ${formatarNumero(max, 0)}${unidade ? ` ${unidade}` : ""}`;
  let alvo = z
    .number({ invalid_type_error: "Informe o valor da meta." })
    .min(min, `Use um valor entre ${faixa}.`)
    .max(max, `Use um valor entre ${faixa}.`);
  if (inteiro) alvo = alvo.int("Use um número inteiro de treinos.");
  return z.object({
    alvo,
    prazo: z
      .string()
      .refine((p) => p === "" || p >= hojeISO(), "Escolha uma data a partir de hoje.")
      .transform((p) => (p === "" ? null : p)),
  });
}

type Props = {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  /** Meta em edição; null para criar uma nova. */
  meta: MetaAluno | null;
  /** Tipos que ainda não têm meta (usados na criação). */
  tiposLivres: TipoMeta[];
  /** Valores atuais do aluno, para ajudar a escolher um alvo realista. */
  atuais: Partial<Record<TipoMeta, number>>;
};

export function MetaDialog({ aberto, aoMudar, meta, tiposLivres, atuais }: Props) {
  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] gap-6 overflow-y-auto rounded-3xl border-white/10 p-6 sm:max-w-md sm:rounded-3xl sm:p-7">
        <DialogHeader className="space-y-2 pr-6 text-left">
          <DialogTitle className="font-display text-2xl font-bold leading-tight">
            {meta ? "Ajustar meta" : "Nova meta"}
          </DialogTitle>
          <DialogDescription>
            Metas realistas mantêm a motivação lá em cima. Você pode mudar quando quiser.
          </DialogDescription>
        </DialogHeader>
        {/* Montado só com o diálogo aberto, para os campos sempre começarem do valor certo. */}
        <Formulario
          meta={meta}
          tiposLivres={tiposLivres}
          atuais={atuais}
          aoConcluir={() => aoMudar(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function dica(tipo: TipoMeta, atual: number | undefined): string {
  if (tipo === "peso")
    return atual !== undefined
      ? `Seu peso atual é ${formatarNumero(atual)} kg.`
      : "Informe o peso que quer alcançar, em kg.";
  if (tipo === "imc") {
    return `${atual !== undefined ? `Seu IMC atual é ${formatarNumero(atual)}. ` : ""}A faixa de peso saudável vai de 18,5 a 24,9.`;
  }
  return `Quantos dias por mês você quer treinar. A sugestão da academia é ${META_MENSAL_PADRAO}.`;
}

function Formulario({
  meta,
  tiposLivres,
  atuais,
  aoConcluir,
}: Pick<Props, "meta" | "tiposLivres" | "atuais"> & { aoConcluir: () => void }) {
  const { acoes } = useAlunoApp();
  const [tipo, setTipo] = useState<TipoMeta>(meta?.tipo ?? tiposLivres[0] ?? "peso");
  const [alvo, setAlvo] = useState(meta ? String(meta.alvo).replace(".", ",") : "");
  const [prazo, setPrazo] = useState(meta?.prazo ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const tipos = meta ? [meta.tipo] : tiposLivres;
  const limites = LIMITES[tipo];

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const texto = alvo.trim().replace(",", ".");
    const leitura = esquemaMeta(tipo).safeParse({
      alvo: texto === "" ? Number.NaN : Number(texto),
      prazo,
    });
    if (!leitura.success) {
      setErro(leitura.error.issues[0]?.message ?? "Confira os dados informados.");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await acoes.salvarMeta({ tipo, alvo: leitura.data.alvo, prazo: leitura.data.prazo });
      aoConcluir();
    } catch {
      // O store já avisou o erro em toast; o formulário segue aberto para outra tentativa.
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <div className="space-y-2">
        <Label
          htmlFor="meta-tipo"
          className="text-xs uppercase tracking-widest text-muted-foreground"
        >
          Tipo de meta
        </Label>
        <Select
          value={tipo}
          onValueChange={(v) => {
            if (ehTipoMeta(v)) {
              setTipo(v);
              setErro(null);
            }
          }}
          disabled={meta !== null || tipos.length < 2}
        >
          <SelectTrigger id="meta-tipo" className="h-12 rounded-xl text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tipos.map((t) => (
              <SelectItem key={t} value={t}>
                {ROTULO_META[t].titulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="meta-alvo"
          className="text-xs uppercase tracking-widest text-muted-foreground"
        >
          Valor alvo {limites.unidade ? `(${limites.unidade})` : ""}
        </Label>
        <Input
          id="meta-alvo"
          inputMode="decimal"
          value={alvo}
          onChange={(e) => {
            setAlvo(e.target.value.replace(/[^\d.,]/g, "").slice(0, 6));
            setErro(null);
          }}
          aria-describedby="meta-alvo-dica"
          className="h-12 rounded-xl text-base"
        />
        <p id="meta-alvo-dica" className="text-xs text-muted-foreground">
          {dica(tipo, atuais[tipo])}
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="meta-prazo"
          className="text-xs uppercase tracking-widest text-muted-foreground"
        >
          Prazo (opcional)
        </Label>
        <Input
          id="meta-prazo"
          type="date"
          min={hojeISO()}
          value={prazo}
          onChange={(e) => {
            setPrazo(e.target.value);
            setErro(null);
          }}
          className="h-12 rounded-xl text-base [color-scheme:dark]"
        />
      </div>

      {erro ? (
        <p role="alert" className="text-sm text-red-300">
          {erro}
        </p>
      ) : null}

      <DialogFooter className="gap-2 sm:space-x-0">
        <Button
          type="button"
          variant="ghost"
          onClick={aoConcluir}
          disabled={enviando}
          className="h-12 rounded-full px-6 text-base"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={enviando}
          className="h-12 rounded-full px-7 text-base font-semibold"
        >
          {enviando ? <Loader2 className="animate-spin" /> : null}
          {enviando ? "Salvando..." : "Salvar meta"}
        </Button>
      </DialogFooter>
    </form>
  );
}
