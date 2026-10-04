import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  Dumbbell,
  Flame,
  LineChart,
  Ruler,
  ShieldCheck,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { ProgressRing, Selo, Superficie } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { botaoMarca } from "./botoes";
import { CabecalhoSecao, Secao } from "./SecaoSite";
import { useSessao } from "./sessao";

const RECURSOS: { icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    icone: Dumbbell,
    titulo: "Treinos",
    texto: "O treino do dia na palma da mão, com registro rápido do que você fez.",
  },
  {
    icone: CalendarDays,
    titulo: "Aulas",
    texto: "Veja a agenda e reserve ou cancele a sua vaga em um toque.",
  },
  {
    icone: Ruler,
    titulo: "Avaliações",
    texto: "Peso, IMC e medidas mês a mês, sempre comparáveis.",
  },
  {
    icone: LineChart,
    titulo: "Resultados",
    texto: "Gráficos, sequência de treinos e conquistas para manter o ritmo.",
  },
  {
    icone: CreditCard,
    titulo: "Meu plano",
    texto: "Seu plano, vencimentos e pagamentos num só lugar.",
  },
  {
    icone: ShieldCheck,
    titulo: "Segurança",
    texto: "Seus dados pessoais e a proteção da sua conta sob seu controle.",
  },
];

// Barras de exemplo: só ilustram o formato do gráfico, não representam dados reais.
const BARRAS_EXEMPLO = [38, 52, 34, 66, 58, 80, 62, 92];

const AULAS_EXEMPLO = [
  { hora: "18:00", nome: "Funcional", reservada: true },
  { hora: "19:00", nome: "Yoga", reservada: false },
  { hora: "20:00", nome: "Bike Class", reservada: false },
];

function CartaoMock({
  titulo,
  children,
  className,
}: {
  titulo: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-background/60 p-4", className)}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
        {titulo}
      </p>
      {children}
    </div>
  );
}

function MockAreaAluno() {
  return (
    <div
      role="img"
      aria-label="Exemplo ilustrativo da área do aluno, com anel de progresso semanal, gráfico de frequência e agenda de aulas. Os números são fictícios."
      className="relative mx-auto w-full max-w-lg"
    >
      <div
        aria-hidden="true"
        className="absolute -inset-8 -z-10 rounded-full bg-brand-yellow/10 blur-3xl"
      />

      <Superficie className="rounded-[2rem] p-4 shadow-2xl sm:p-5" brilho>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-brand-yellow font-display text-sm font-bold text-brand-black">
              A
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">Olá, aluno</p>
              <p className="text-xs text-muted-foreground">Sua semana</p>
            </div>
          </div>
          <Selo>Exemplo ilustrativo</Selo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CartaoMock titulo="Meta da semana">
            <div className="mt-3 flex justify-center">
              <ProgressRing
                valor={75}
                tamanho={108}
                espessura={10}
                rotulo="Exemplo: 3 de 4 treinos na semana"
              >
                <div>
                  <p className="font-display text-2xl font-bold leading-none">3/4</p>
                  <p className="mt-0.5 text-[0.65rem] text-muted-foreground">treinos</p>
                </div>
              </ProgressRing>
            </div>
          </CartaoMock>

          <CartaoMock titulo="Frequência">
            <div className="mt-3 flex h-[108px] items-end gap-1.5">
              {BARRAS_EXEMPLO.map((altura, i) => (
                <span
                  key={i}
                  style={{ height: `${altura}%` }}
                  className={
                    i === BARRAS_EXEMPLO.length - 1
                      ? "flex-1 rounded-t-md bg-brand-yellow"
                      : "flex-1 rounded-t-md bg-white/15"
                  }
                />
              ))}
            </div>
          </CartaoMock>

          <CartaoMock titulo="Aulas de hoje" className="col-span-2">
            <ul className="mt-3 space-y-2">
              {AULAS_EXEMPLO.map((aula) => (
                <li
                  key={aula.nome}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5"
                >
                  <span className="font-display text-sm font-semibold tabular-nums text-muted-foreground">
                    {aula.hora}
                  </span>
                  <span className="flex-1 text-sm font-medium">{aula.nome}</span>
                  {aula.reservada ? (
                    <Selo tom="ok">
                      <Check className="size-3" /> Reservada
                    </Selo>
                  ) : (
                    <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-foreground/80">
                      Reservar
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CartaoMock>
        </div>
      </Superficie>

      <div className="absolute -bottom-7 right-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-card px-4 py-3 shadow-xl sm:-right-4">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-yellow text-brand-black">
          <Flame className="size-5" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">Sequência</p>
          <p className="font-display text-base font-bold leading-tight">5 dias seguidos</p>
        </div>
      </div>
      <div className="absolute -top-4 left-3 hidden items-center gap-2 rounded-full border border-white/10 bg-card px-3.5 py-2 text-xs font-medium shadow-xl sm:-left-4 sm:flex">
        <Trophy className="size-4 text-brand-yellow" /> Conquista desbloqueada
      </div>
    </div>
  );
}

export function AreaAlunoVitrine() {
  const { logado } = useSessao();

  return (
    <Secao id="area-do-aluno" className="border-y border-white/10 bg-sidebar/50">
      {/* No celular o exemplo vem logo após o título; no desktop ocupa a coluna da direita. */}
      <div className="grid gap-x-10 gap-y-12 lg:grid-cols-2 lg:grid-rows-[auto_1fr]">
        <CabecalhoSecao
          eyebrow="Área do aluno"
          titulo="A sua evolução, sempre à mão"
          texto="Treinos, aulas, avaliações e resultados em um só lugar, no celular ou no computador. É a Family Gym acompanhando você também fora da academia."
          className="lg:self-end"
        />

        <div className="pb-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:flex lg:items-center lg:pb-0">
          <MockAreaAluno />
        </div>

        <div className="space-y-10 lg:col-start-1 lg:row-start-2">
          <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {RECURSOS.map(({ icone: Icone, titulo, texto }) => (
              <li key={titulo} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-yellow">
                  <Icone className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold">{titulo}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/app" search={{ demo: true }} className={botaoMarca("primario", "lg")}>
                Ver a área do aluno em ação <ArrowRight />
              </Link>
              {logado ? null : (
                <Link
                  to="/auth"
                  search={{ modo: "signup" }}
                  className={botaoMarca("secundario", "lg")}
                >
                  Criar conta
                </Link>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              A demonstração usa dados fictícios e não exige conta.
            </p>
          </div>
        </div>
      </div>
    </Secao>
  );
}
