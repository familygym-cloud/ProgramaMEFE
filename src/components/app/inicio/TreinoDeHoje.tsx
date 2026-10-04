import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Dumbbell,
  Layers,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Eyebrow, Selo, Superficie } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { resumoTreino } from "@/lib/aluno-app/derive";
import type { CheckIn, Treino } from "@/lib/aluno-app/types";

type Props = {
  treino: Treino | null;
  /** O aluno tem alguma ficha cadastrada (mesmo que não seja para hoje). */
  temFicha: boolean;
  /** Check-ins registrados hoje; se houver algum, o aluno já treinou. */
  checkInsHoje: CheckIn[];
  sequencia: number;
  primeiroNome: string;
  aoRegistrar: () => void;
};

const BOTAO_PRINCIPAL =
  "h-12 rounded-full px-7 text-base font-semibold shadow-[0_12px_32px_-12px] shadow-brand-yellow/80";
const BOTAO_SECUNDARIO =
  "h-12 rounded-full border-foreground/20 bg-transparent px-6 text-base hover:bg-foreground/10";

/** Separa "Treino A — Peito e Tríceps" em rótulo e título; sem separador, só há título. */
function separarNome(nome: string): { rotulo: string | null; titulo: string } {
  const [rotulo, ...resto] = nome.split(/\s+[—–-]\s+/);
  return resto.length
    ? { rotulo: rotulo ?? null, titulo: resto.join(" — ") }
    : { rotulo: null, titulo: nome };
}

function MarcaDeAgua() {
  return (
    <div aria-hidden className="pointer-events-none absolute -bottom-14 -right-10 opacity-[0.045]">
      <BrandLogo variante="marca" className="h-64 sm:h-72" />
    </div>
  );
}

function Indicador({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-3.5 py-1.5 text-sm [&_svg]:size-4 [&_svg]:text-brand-yellow">
      {icone}
      {children}
    </li>
  );
}

export function TreinoDeHoje(props: Props) {
  const { treino, checkInsHoje, temFicha } = props;
  if (checkInsHoje.length > 0) return <TreinoConcluido {...props} />;
  if (treino) return <TreinoPendente treino={treino} aoRegistrar={props.aoRegistrar} />;
  return <SemTreino temFicha={temFicha} aoRegistrar={props.aoRegistrar} />;
}

function TreinoPendente({ treino, aoRegistrar }: { treino: Treino; aoRegistrar: () => void }) {
  const { exercicios, series, minutos } = resumoTreino(treino);
  const { rotulo, titulo } = separarNome(treino.nome);
  const previa = [...treino.exercicios].sort((a, b) => a.ordem - b.ordem).slice(0, 3);
  const restantes = exercicios - previa.length;

  return (
    <Superficie brilho className="flex h-full flex-col gap-6 border-brand-yellow/25 sm:p-8">
      <MarcaDeAgua />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Eyebrow>Treino de hoje</Eyebrow>
          {rotulo ? <Selo>{rotulo}</Selo> : null}
        </div>
        <h2 className="font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          {titulo}
        </h2>
        {treino.foco ? (
          <p className="text-base text-muted-foreground sm:text-lg">{treino.foco}</p>
        ) : null}
      </div>

      <ul className="relative flex flex-wrap gap-2" aria-label="Resumo do treino">
        <Indicador icone={<Dumbbell aria-hidden />}>
          {exercicios} {exercicios === 1 ? "exercício" : "exercícios"}
        </Indicador>
        <Indicador icone={<Layers aria-hidden />}>{series} séries</Indicador>
        <Indicador icone={<Clock aria-hidden />}>cerca de {minutos} min</Indicador>
      </ul>

      {previa.length > 0 ? (
        <ol className="relative divide-y divide-foreground/10 rounded-2xl border border-foreground/10 bg-background/20">
          {previa.map((e, i) => (
            <li key={e.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground/10 text-xs font-semibold">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{e.nome}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {e.series}×{e.repeticoes}
              </span>
            </li>
          ))}
          {restantes > 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              + {restantes} {restantes === 1 ? "exercício" : "exercícios"} no treino completo
            </li>
          ) : null}
        </ol>
      ) : null}

      <div className="relative mt-auto flex flex-wrap items-center gap-3">
        <Button asChild size="lg" className={BOTAO_PRINCIPAL}>
          <Link to="/app/treinos/$treinoId" params={{ treinoId: treino.id }}>
            <Play className="fill-current" aria-hidden />
            Começar treino
          </Link>
        </Button>
        <Button type="button" variant="outline" onClick={aoRegistrar} className={BOTAO_SECUNDARIO}>
          <Check aria-hidden />
          Já treinei hoje
        </Button>
      </div>
    </Superficie>
  );
}

function TreinoConcluido({ checkInsHoje, sequencia, primeiroNome, treino }: Props) {
  const minutos = checkInsHoje.reduce((s, c) => s + c.duracaoMin, 0);
  const atividades = [...new Set(checkInsHoje.map((c) => c.atividade))];
  return (
    <Superficie brilho className="flex h-full flex-col gap-6 border-brand-yellow/25 sm:p-8">
      <MarcaDeAgua />
      <div className="relative flex items-center gap-4">
        <span className="relative grid size-16 shrink-0 place-items-center rounded-full bg-brand-yellow text-brand-black">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-brand-yellow/50 motion-safe:animate-ping [animation-iteration-count:2]"
          />
          <Check className="relative size-8" strokeWidth={3} aria-hidden />
        </span>
        <div className="space-y-1">
          <Eyebrow>Treino de hoje</Eyebrow>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-brand-yellow" aria-hidden />
            Concluído
          </p>
        </div>
      </div>

      <div className="relative space-y-3">
        <h2 className="font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          Missão cumprida, {primeiroNome}!
        </h2>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          {sequencia > 1
            ? `Você já soma ${sequencia} dias seguidos treinando. Hidrate-se, descanse bem e volte amanhã.`
            : "Ótimo começo. Hidrate-se, descanse bem e volte amanhã para criar o hábito."}
        </p>
      </div>

      <ul className="relative flex flex-wrap gap-2" aria-label="O que você fez hoje">
        <Indicador icone={<Clock aria-hidden />}>{minutos} min de treino</Indicador>
        {atividades.map((a) => (
          <Indicador key={a} icone={<Dumbbell aria-hidden />}>
            {a}
          </Indicador>
        ))}
      </ul>

      <div className="relative mt-auto flex flex-wrap items-center gap-3">
        <Button asChild size="lg" className={BOTAO_PRINCIPAL}>
          <Link to="/app/resultados">
            Ver minha evolução
            <ArrowRight aria-hidden />
          </Link>
        </Button>
        {treino ? (
          <Button asChild variant="outline" className={BOTAO_SECUNDARIO}>
            <Link to="/app/treinos/$treinoId" params={{ treinoId: treino.id }}>
              Rever treino de hoje
            </Link>
          </Button>
        ) : null}
      </div>
    </Superficie>
  );
}

function SemTreino({ temFicha, aoRegistrar }: { temFicha: boolean; aoRegistrar: () => void }) {
  return (
    <Superficie brilho className="flex h-full flex-col gap-6 sm:p-8">
      <MarcaDeAgua />
      <div className="relative space-y-3">
        <Eyebrow>Hoje</Eyebrow>
        <h2 className="font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          {temFicha ? "Hoje é dia de aula ou descanso" : "Seu treino está a caminho"}
        </h2>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          {temFicha
            ? "Não há treino da sua ficha marcado para hoje. Reserve uma aula coletiva, faça um treino livre ou aproveite para recuperar."
            : "Seu professor ainda não cadastrou uma ficha de treino. Enquanto isso, reserve uma aula coletiva e treine com a turma."}
        </p>
      </div>
      <div className="relative mt-auto flex flex-wrap items-center gap-3">
        <Button asChild size="lg" className={BOTAO_PRINCIPAL}>
          <Link to="/app/aulas">
            <CalendarDays aria-hidden />
            Ver aulas
          </Link>
        </Button>
        <Button type="button" variant="outline" onClick={aoRegistrar} className={BOTAO_SECUNDARIO}>
          <Plus aria-hidden />
          Registrar treino
        </Button>
        {temFicha ? (
          <Button asChild variant="ghost" className="h-12 rounded-full px-5 text-base">
            <Link to="/app/treinos">Ver minha ficha</Link>
          </Button>
        ) : null}
      </div>
    </Superficie>
  );
}
