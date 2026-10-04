import { useId, type CSSProperties, type ReactNode } from "react";
import { Superficie } from "@/components/app/ui";
import { cn } from "@/lib/utils";

// Blocos do relatório individual: seção do documento, indicador numérico e campo de texto. Na tela
// são cartões escuros da marca; no papel (tokens trocados em styles.css) viram quadros leves,
// compactos e sem sombra, para o relatório caber em uma ou duas folhas A4.

/**
 * Seção do documento: título com filete amarelo, descrição opcional e o conteúdo. Na tela é um
 * cartão. No papel vira uma seção "chapada" (só um filete no topo), que flui de uma folha para a
 * outra: quem evita ser partido são os blocos de dentro (indicadores, gráfico, linhas da tabela) e
 * o título, que nunca fica sozinho no fim da folha. Com `cartaoNoPapel` ela segue um quadro inteiro
 * que não se parte (o bloco de assinaturas).
 */
export function SecaoAluno({
  titulo,
  descricao,
  acao,
  children,
  atraso = 0,
  cartaoNoPapel = false,
  className,
}: {
  titulo: string;
  descricao?: ReactNode;
  /** Elemento ao lado do título (selo de situação). */
  acao?: ReactNode;
  children: ReactNode;
  /** Atraso (ms) da animação de entrada, que cria o escalonamento entre seções. */
  atraso?: number;
  cartaoNoPapel?: boolean;
  className?: string;
}) {
  const idTitulo = useId();
  const estilo: CSSProperties = { animationDelay: `${atraso}ms` };
  return (
    <section
      aria-labelledby={idTitulo}
      className={cn("fg-entrada min-w-0", cartaoNoPapel && "break-inside-avoid", className)}
      style={estilo}
    >
      <Superficie
        className={cn(
          "p-4 sm:p-6 print:shadow-none print:backdrop-blur-none",
          cartaoNoPapel
            ? "print:rounded-2xl print:p-4"
            : "print:rounded-none print:border-0 print:border-t print:bg-transparent print:p-0 print:pt-3",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 break-after-avoid">
          <div className="min-w-0 space-y-1">
            <h2
              id={idTitulo}
              className="font-display text-lg font-semibold leading-tight sm:text-xl print:text-lg"
            >
              {titulo}
            </h2>
            <span aria-hidden className="block h-0.5 w-8 rounded-full bg-brand-yellow" />
            {descricao ? (
              <p className="max-w-prose pt-1 text-sm leading-relaxed text-muted-foreground">
                {descricao}
              </p>
            ) : null}
          </div>
          {acao ? <div className="shrink-0">{acao}</div> : null}
        </div>
        <div className="mt-5 print:mt-3">{children}</div>
      </Superficie>
    </section>
  );
}

/** Grade de indicadores (<dl>): duas colunas no celular, três a partir de `sm`. */
export function GradeIndicadores({
  rotulo,
  colunas = 3,
  children,
}: {
  rotulo: string;
  colunas?: 3 | 4;
  children: ReactNode;
}) {
  return (
    <dl
      aria-label={rotulo}
      className={cn(
        "grid grid-cols-2 gap-2.5 break-inside-avoid sm:gap-3 print:gap-2",
        colunas === 3
          ? "sm:grid-cols-3 print:grid-cols-3"
          : "sm:grid-cols-2 md:grid-cols-4 print:grid-cols-4",
      )}
    >
      {children}
    </dl>
  );
}

/** Um número do relatório: rótulo pequeno, valor grande e uma linha de apoio. */
export function Indicador({
  rotulo,
  valor,
  detalhe,
  tom = "neutro",
}: {
  rotulo: string;
  /** Já formatado em pt-BR; "—" quando não há dado. */
  valor: ReactNode;
  detalhe?: ReactNode;
  tom?: "neutro" | "alerta";
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 print:p-2.5">
      <dt className="min-h-7 text-[0.68rem] font-semibold uppercase leading-tight tracking-wider text-muted-foreground sm:min-h-0">
        {rotulo}
      </dt>
      <dd
        className={cn(
          "mt-1 break-words font-display text-xl font-bold leading-tight tabular-nums sm:text-2xl print:text-xl",
          tom === "alerta" && "text-red-300",
        )}
      >
        {valor}
      </dd>
      {detalhe ? (
        <dd className="mt-1 text-xs leading-snug text-muted-foreground">{detalhe}</dd>
      ) : null}
    </div>
  );
}

/** Campo de cadastro: rótulo pequeno e valor em texto corrido (quebra linha, nunca estoura). */
export function Campo({
  rotulo,
  valor,
  className,
}: {
  rotulo: string;
  valor: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[0.68rem] font-semibold uppercase leading-tight tracking-wider text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium leading-snug sm:text-base print:text-sm">
        {valor}
      </dd>
    </div>
  );
}
