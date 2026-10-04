import * as RadioGroup from "@radix-ui/react-radio-group";
import { AlertCircle } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Visual dos campos de texto da equipe: 48px de altura (alvo de toque confortável) e cantos largos. */
export const CLASSE_CAMPO =
  "h-12 rounded-2xl border-white/15 bg-white/[0.03] px-4 text-base shadow-none hover:border-white/25 focus-visible:border-brand-yellow/70 focus-visible:ring-2 focus-visible:ring-brand-yellow/40 aria-[invalid=true]:border-red-400/70 aria-[invalid=true]:ring-red-400/30 md:text-base";

export const CLASSE_AREA_TEXTO =
  "min-h-24 rounded-2xl border-white/15 bg-white/[0.03] px-4 py-3 text-base shadow-none hover:border-white/25 focus-visible:border-brand-yellow/70 focus-visible:ring-2 focus-visible:ring-brand-yellow/40 aria-[invalid=true]:border-red-400/70 aria-[invalid=true]:ring-red-400/30 md:text-base";

type PropsDoControle = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

/** Rótulo + controle + dica/erro, com os atributos de acessibilidade ligados ao controle. */
export function Campo({
  rotulo,
  dica,
  erro,
  opcional = false,
  className,
  children,
}: {
  rotulo: string;
  dica?: string | undefined;
  erro?: string | undefined;
  opcional?: boolean | undefined;
  className?: string | undefined;
  children: (props: PropsDoControle) => ReactNode;
}) {
  const id = useId();
  const idMensagem = `${id}-msg`;
  const mensagem = erro ?? dica;
  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-medium">
        <span>{rotulo}</span>
        {opcional ? (
          <span className="text-xs font-normal text-muted-foreground">Opcional</span>
        ) : null}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(erro),
        "aria-describedby": mensagem ? idMensagem : undefined,
      })}
      {mensagem ? (
        <p
          id={idMensagem}
          className={cn(
            "flex items-start gap-1.5 text-xs leading-relaxed",
            erro ? "text-red-300" : "text-muted-foreground",
          )}
        >
          {erro ? <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> : null}
          <span>{mensagem}</span>
        </p>
      ) : null}
    </div>
  );
}

/** Campo numérico com unidade fixa à direita. Aceita vírgula (teclado decimal no celular). */
export function CampoNumerico({
  rotulo,
  unidade,
  inteiro = false,
  valor,
  onChange,
  erro,
  dica,
  opcional,
  placeholder,
  desabilitado,
  className,
}: {
  rotulo: string;
  /** Texto fixo à direita do número (kg, cm, s). Vazio = sem unidade. */
  unidade?: string | undefined;
  /** Teclado numérico sem separador decimal. */
  inteiro?: boolean | undefined;
  valor: string;
  onChange: (valor: string) => void;
  erro?: string | undefined;
  dica?: string | undefined;
  opcional?: boolean | undefined;
  placeholder?: string | undefined;
  desabilitado?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <Campo rotulo={rotulo} erro={erro} opcional={opcional} className={className} dica={dica}>
      {(props) => (
        <div className="relative">
          <Input
            {...props}
            type="text"
            inputMode={inteiro ? "numeric" : "decimal"}
            autoComplete="off"
            value={valor}
            placeholder={placeholder ?? ""}
            disabled={desabilitado ?? false}
            onChange={(e) => onChange(e.target.value)}
            className={cn(CLASSE_CAMPO, "tabular-nums", unidade && "pr-12")}
          />
          {unidade ? (
            <span
              aria-hidden
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
            >
              {unidade}
            </span>
          ) : null}
        </div>
      )}
    </Campo>
  );
}

export type OpcaoSegmentada<T> = { valor: T; rotulo: string; descricao?: string };

/** Escolha única em botões grandes (radiogroup: setas do teclado movem a seleção). */
export function OpcoesSegmentadas<T extends string | number | null>({
  rotulo,
  valor,
  opcoes,
  onChange,
  className,
  classeGrade = "grid-cols-3",
}: {
  rotulo: string;
  valor: T;
  opcoes: readonly OpcaoSegmentada<T>[];
  onChange: (valor: T) => void;
  className?: string;
  classeGrade?: string;
}) {
  const idRotulo = useId();
  const selecionada = opcoes.findIndex((o) => o.valor === valor);
  return (
    <div className={cn("space-y-2", className)}>
      <span id={idRotulo} className="block text-sm font-medium">
        {rotulo}
      </span>
      <RadioGroup.Root
        aria-labelledby={idRotulo}
        value={selecionada >= 0 ? String(selecionada) : ""}
        onValueChange={(indice) => {
          const opcao = opcoes[Number(indice)];
          if (opcao) onChange(opcao.valor);
        }}
        className={cn("grid gap-2", classeGrade)}
      >
        {opcoes.map((opcao, indice) => (
          <RadioGroup.Item
            key={opcao.rotulo}
            value={String(indice)}
            title={opcao.descricao}
            className="flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-3 text-sm font-medium text-foreground/80 transition-colors hover:border-white/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/60 data-[state=checked]:border-brand-yellow data-[state=checked]:bg-brand-yellow/10 data-[state=checked]:text-brand-yellow"
          >
            {opcao.rotulo}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  );
}
