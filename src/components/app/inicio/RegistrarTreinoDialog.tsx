import { useState, type FormEvent } from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Loader2, Minus, Plus } from "lucide-react";
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
import { useAlunoApp } from "@/lib/aluno-app/store";
import { cn } from "@/lib/utils";

// Modalidades oficiais da academia (catálogo de planos) mais a musculação.
const ATIVIDADES = [
  "Musculação",
  "Funcional",
  "Bike Class",
  "Zumba",
  "Yoga",
  "Pilates Solo",
  "Muay-Thai",
  "Jiu-jitsu",
  "Alongamento",
] as const;
const OUTRA = "outra";
const DURACOES_RAPIDAS = [30, 45, 60, 90] as const;
const PASSO_MINUTOS = 5;

const esquema = z.object({
  atividade: z
    .string()
    .trim()
    .min(2, "Conte qual foi a atividade.")
    .max(80, "Use até 80 caracteres."),
  duracaoMin: z
    .number({ invalid_type_error: "Informe a duração em minutos." })
    .int("Use minutos inteiros.")
    .min(1, "A duração mínima é de 1 minuto.")
    .max(600, "A duração máxima é de 600 minutos."),
});

const classeChip =
  "inline-flex h-11 items-center justify-center rounded-full border border-foreground/15 px-4 text-sm font-medium transition-colors hover:bg-foreground/5 data-[state=checked]:border-brand-yellow data-[state=checked]:bg-brand-yellow data-[state=checked]:text-brand-black";

type Props = {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  /** Duração sugerida em minutos (ex.: tempo estimado do treino de hoje). */
  sugestaoMin?: number | undefined;
};

export function RegistrarTreinoDialog({ aberto, aoMudar, sugestaoMin }: Props) {
  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] gap-6 overflow-y-auto rounded-3xl border-foreground/10 p-6 sm:max-w-md sm:rounded-3xl sm:p-7">
        <DialogHeader className="space-y-2 pr-6 text-left">
          <DialogTitle className="font-display text-2xl font-bold leading-tight">
            Registrar treino
          </DialogTitle>
          <DialogDescription>
            Conte o que você fez hoje. Cada treino conta para a sua sequência, as metas e as
            conquistas.
          </DialogDescription>
        </DialogHeader>
        {/* O formulário só existe com o diálogo aberto: ao reabrir, os campos voltam ao início. */}
        <Formulario sugestaoMin={sugestaoMin} aoConcluir={() => aoMudar(false)} />
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  sugestaoMin,
  aoConcluir,
}: {
  sugestaoMin: number | undefined;
  aoConcluir: () => void;
}) {
  const { acoes } = useAlunoApp();
  const [escolha, setEscolha] = useState<string>(ATIVIDADES[0]);
  const [outra, setOutra] = useState("");
  const [duracao, setDuracao] = useState(String(sugestaoMin ?? 60));
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const minutos = Number.parseInt(duracao, 10);

  const ajustar = (delta: number) => {
    const base = Number.isFinite(minutos) ? minutos : 0;
    setDuracao(String(Math.min(600, Math.max(1, base + delta))));
    setErro(null);
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const leitura = esquema.safeParse({
      atividade: escolha === OUTRA ? outra : escolha,
      duracaoMin: duracao.trim() === "" ? Number.NaN : Number(duracao),
    });
    if (!leitura.success) {
      setErro(leitura.error.issues[0]?.message ?? "Confira os dados informados.");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await acoes.registrarTreino(leitura.data);
      aoConcluir();
    } catch {
      // O aviso de erro já foi exibido pelo store; o formulário continua aberto para nova tentativa.
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      <div className="space-y-3">
        <Label
          id="rotulo-atividade"
          className="text-xs uppercase tracking-widest text-muted-foreground"
        >
          Atividade
        </Label>
        <RadioGroupPrimitive.Root
          aria-labelledby="rotulo-atividade"
          value={escolha}
          onValueChange={(v) => {
            setEscolha(v);
            setErro(null);
          }}
          className="flex flex-wrap gap-2"
        >
          {[...ATIVIDADES, OUTRA].map((a) => (
            <RadioGroupPrimitive.Item key={a} value={a} className={classeChip}>
              {a === OUTRA ? "Outra" : a}
            </RadioGroupPrimitive.Item>
          ))}
        </RadioGroupPrimitive.Root>
        {escolha === OUTRA ? (
          <Input
            value={outra}
            onChange={(e) => setOutra(e.target.value)}
            maxLength={80}
            placeholder="Ex.: Caminhada, Corrida, Natação"
            aria-label="Nome da atividade"
            autoFocus
            className="h-11 rounded-xl text-base"
          />
        ) : null}
      </div>

      <div className="space-y-3">
        <Label
          htmlFor="duracao-treino"
          className="text-xs uppercase tracking-widest text-muted-foreground"
        >
          Duração (minutos)
        </Label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => ajustar(-PASSO_MINUTOS)}
            aria-label={`Diminuir ${PASSO_MINUTOS} minutos`}
            className="size-11 shrink-0 rounded-full bg-transparent"
          >
            <Minus />
          </Button>
          <Input
            id="duracao-treino"
            inputMode="numeric"
            value={duracao}
            onChange={(e) => {
              setDuracao(e.target.value.replace(/\D/g, "").slice(0, 3));
              setErro(null);
            }}
            className="h-14 rounded-2xl text-center font-display text-3xl font-bold md:text-3xl"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => ajustar(PASSO_MINUTOS)}
            aria-label={`Aumentar ${PASSO_MINUTOS} minutos`}
            className="size-11 shrink-0 rounded-full bg-transparent"
          >
            <Plus />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Durações rápidas">
          {DURACOES_RAPIDAS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={minutos === d}
              onClick={() => {
                setDuracao(String(d));
                setErro(null);
              }}
              className={cn(
                "h-11 rounded-full border px-4 text-sm font-medium transition-colors hover:bg-foreground/5",
                minutos === d ? "border-foreground bg-foreground/10" : "border-foreground/15",
              )}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      {erro ? (
        <p role="alert" className="text-sm text-destructive">
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
          {enviando ? "Registrando..." : "Registrar treino"}
        </Button>
      </DialogFooter>
    </form>
  );
}
