import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { botaoMarca } from "@/components/site/botoes";
import { CabecalhoPagina } from "@/components/site/CabecalhoPagina";
import { CtaFinal } from "@/components/site/CtaFinal";
import { frentesTreino } from "@/components/site/frentes";
import { GrupoModalidades } from "@/components/site/GrupoModalidades";
import { SiteLayout } from "@/components/site/SiteLayout";
import { marcasCanonicas } from "@/lib/site";

const TITULO = "Modalidades | Academia Family Gym";
const DESCRICAO =
  "Musculação, aulas coletivas, lutas, natação, melhor idade e kids: conheça as modalidades da Family Gym e encontre a que combina com você e com a sua família.";

const canonica = marcasCanonicas("/modalidades");

export const Route = createFileRoute("/modalidades")({
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITULO },
      { name: "twitter:description", content: DESCRICAO },
      ...canonica.meta,
    ],
    links: canonica.links,
  }),
  component: Modalidades,
});

function IndiceModalidades() {
  return (
    <div className="space-y-5">
      <nav aria-label="Ir para uma modalidade">
        <ul className="grid grid-cols-2 gap-3">
          {frentesTreino.map(({ id, titulo, icone: Icone }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="group flex min-h-14 items-center gap-3 rounded-2xl border border-foreground/10 bg-card/60 px-4 py-3 text-sm font-medium backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand-yellow/40 hover:bg-card"
              >
                <Icone aria-hidden="true" className="size-5 shrink-0 text-brand-yellow" />
                {titulo}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <Link to="/grade" className={botaoMarca("secundario", "lg", "w-full sm:w-auto")}>
        <CalendarDays aria-hidden="true" /> Ver a grade de aulas
      </Link>
    </div>
  );
}

function Modalidades() {
  return (
    <SiteLayout>
      <CabecalhoPagina
        eyebrow="Modalidades"
        titulo="Movimento para cada fase da vida"
        texto="Da primeira braçada das crianças ao treino da melhor idade, a Family Gym reúne seis frentes de treino sob o mesmo teto. Escolha uma e veja os planos que a incluem."
        lateral={<IndiceModalidades />}
      />
      {frentesTreino.map((frente, i) => (
        <GrupoModalidades key={frente.id} frente={frente} indice={i} />
      ))}
      <CtaFinal
        titulo="Encontrou a sua modalidade?"
        texto="Veja os planos que incluem cada modalidade, confira a grade de aulas ou crie a sua conta para começar. Horários e vagas das aulas ficam na agenda da área do aluno."
        mostrarPlanos
        mostrarGrade
      />
    </SiteLayout>
  );
}
