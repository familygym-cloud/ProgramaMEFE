import type { CSSProperties } from "react";
import { CalendarCheck, Dumbbell, TrendingUp, type LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const BENEFICIOS: { icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    icone: Dumbbell,
    titulo: "Seu treino no bolso",
    texto: "Séries, cargas e descanso do dia, direto no celular.",
  },
  {
    icone: CalendarCheck,
    titulo: "Aulas em poucos toques",
    texto: "Veja a agenda da semana e garanta sua vaga com a turma.",
  },
  {
    icone: TrendingUp,
    titulo: "Evolução que dá para ver",
    texto: "Avaliações, medidas e conquistas em gráficos simples.",
  },
];

/** Painel de marca do acesso: só aparece em telas largas, onde há espaço para contar a história. */
export function PainelMarca() {
  return (
    <aside
      aria-label="Academia Family Gym"
      className="bg-grade relative hidden flex-col justify-between overflow-hidden border-r border-foreground/10 bg-sidebar px-12 py-12 lg:sticky lg:top-0 lg:flex lg:h-dvh xl:px-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/3 size-[26rem] rounded-full bg-brand-yellow/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-0 size-[22rem] rounded-full bg-brand-yellow/10 blur-3xl"
      />

      {/* O SVG vertical tem margem interna: a altura é proporcional à tela e o recuo negativo alinha o desenho à coluna de texto. */}
      <div
        className="fg-entrada relative"
        style={{ "--altura-logo": "min(19rem, 34dvh)" } as CSSProperties}
      >
        <BrandLogo
          variante="vertical"
          className="h-[var(--altura-logo)] -ml-[calc(var(--altura-logo)*0.346)]"
        />
      </div>

      <div className="relative space-y-10">
        <div className="fg-entrada space-y-3" style={{ animationDelay: "100ms" }}>
          <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight xl:text-5xl">
            Treine em família.
            <br />
            Evolua sempre.
          </h2>
          <p className="max-w-md text-base text-muted-foreground">
            Sua área na Family Gym reúne treinos, aulas e resultados num só lugar.
          </p>
        </div>

        <ul className="space-y-5">
          {BENEFICIOS.map(({ icone: Icone, titulo, texto }, i) => (
            <li
              key={titulo}
              className="fg-entrada flex items-start gap-4"
              style={{ animationDelay: `${200 + i * 90}ms` }}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-foreground/10 bg-foreground/[0.05] text-foreground [&_svg]:size-5">
                <Icone aria-hidden />
              </span>
              <div>
                <p className="font-display text-base font-semibold">{titulo}</p>
                <p className="text-sm text-muted-foreground">{texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
