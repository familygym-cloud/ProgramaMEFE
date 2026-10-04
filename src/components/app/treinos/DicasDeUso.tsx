import { HeartPulse, Lightbulb } from "lucide-react";
import { Eyebrow, Superficie } from "@/components/app/ui";

const PASSOS = [
  {
    titulo: "Comece pelo treino do dia",
    texto:
      "Abra o treino e toque em Começar. O cronômetro também liga sozinho quando você marca a primeira série.",
  },
  {
    titulo: "Marque cada série feita",
    texto:
      "O descanso do exercício começa em seguida. Você pode pausar, somar tempo ou pular quando quiser.",
  },
  {
    titulo: "Conclua e registre",
    texto:
      "Ao terminar, toque em Concluir treino. Ele entra na sua sequência, nas metas e nas conquistas.",
  },
] as const;

export function DicasDeUso() {
  return (
    <Superficie as="section" className="space-y-6">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow">
          <Lightbulb className="size-5" aria-hidden />
        </span>
        <div className="space-y-1">
          <Eyebrow>Dica de uso</Eyebrow>
          <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Como aproveitar a sua ficha
          </h2>
        </div>
      </div>

      <ol className="grid gap-5 md:grid-cols-3">
        {PASSOS.map((passo, i) => (
          <li key={passo.titulo} className="flex gap-4">
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-full border border-white/15 font-display text-sm font-bold"
            >
              {i + 1}
            </span>
            <div className="space-y-1">
              <h3 className="font-semibold">{passo.titulo}</h3>
              <p className="text-sm text-muted-foreground">{passo.texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
        <HeartPulse className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden />
        Sentiu dor ou desconforto? Pare o exercício e avise seu professor. Técnica e conforto vêm
        antes da carga.
      </p>
    </Superficie>
  );
}
