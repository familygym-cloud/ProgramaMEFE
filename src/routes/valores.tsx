import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardList, Lock, MessageCircle, UserPlus } from "lucide-react";
import { CabecalhoPagina } from "@/components/site/CabecalhoPagina";
import { botaoMarca } from "@/components/site/botoes";
import { ComoChegar } from "@/components/site/ComoChegar";
import { CtaFinal } from "@/components/site/CtaFinal";
import { perguntasPorId } from "@/components/site/faq";
import { FiltrosPlanos } from "@/components/site/FiltrosPlanos";
import { frentesTreino } from "@/components/site/frentes";
import { ANCORA_MATRICULA, BotaoMatricular, DadosDeContato } from "@/components/site/Matricular";
import { PlanoCard } from "@/components/site/PlanoCard";
import { CabecalhoSecao, Secao } from "@/components/site/SecaoSite";
import { SecaoFaq } from "@/components/site/SecaoFaq";
import { useSessao } from "@/components/site/sessao";
import { SiteLayout } from "@/components/site/SiteLayout";
import { categoriasPlanos, planosDaCategoria, type CategoriaPlano } from "@/lib/planos-info";
import { marcasCanonicas } from "@/lib/site";

const TITULO = "Planos | Academia Family Gym";
const DESCRICAO =
  "Conheça os planos da Family Gym: musculação, terrestre, lutas, aquático, melhor idade e kids. Veja o que cada plano inclui e fale com a recepção para se matricular.";

// A canônica ignora ?categoria=: todas as variações são a mesma página para os buscadores.
const canonica = marcasCanonicas("/valores");

type BuscaValores = {
  categoria?: CategoriaPlano | undefined;
};

export const Route = createFileRoute("/valores")({
  validateSearch: (search: Record<string, unknown>): BuscaValores => ({
    categoria: categoriasPlanos.find((c) => c === search["categoria"]),
  }),
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
  component: Planos,
});

const DESCRICAO_CATEGORIA: Record<CategoriaPlano, string> = {
  Musculação: "Acesso exclusivo à musculação.",
  Terrestre: "Musculação e aulas coletivas no mesmo plano.",
  Lutas: "Artes marciais, uma ou duas vezes por semana.",
  Aquático: "Natação de 1x a 3x por semana.",
  "Melhor Idade": "Programa completo para a melhor idade.",
  Kids: "Natação infantil, com opção de esportes.",
};

/** Aviso em destaque: onde ficam os valores e como se matricular. Vai ao lado do título da página. */
function PainelValores() {
  const { logado } = useSessao();
  return (
    <section
      aria-labelledby="valores-na-area-do-aluno"
      className="rounded-3xl border border-brand-yellow/40 bg-brand-yellow/10 p-6 sm:p-7"
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-brand-yellow text-brand-black">
        <Lock aria-hidden="true" className="size-5" />
      </span>
      <h2
        id="valores-na-area-do-aluno"
        className="mt-4 font-display text-xl font-semibold leading-snug tracking-tight text-balance sm:text-2xl"
      >
        Os valores dos planos são exclusivos para alunos com plano ativo e ficam na área do aluno
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Ainda não é aluno? A recepção apresenta as condições e faz o seu cadastro.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {logado ? (
          <Link to="/app/valores" className={botaoMarca("primario", "lg")}>
            Ver os valores na minha área <ArrowRight />
          </Link>
        ) : (
          <Link to="/auth" className={botaoMarca("primario", "lg")}>
            Entrar na área do aluno <ArrowRight />
          </Link>
        )}
        <BotaoMatricular variante="secundario" tamanho="lg" />
      </div>
    </section>
  );
}

function GrupoPlanos({ categoria }: { categoria: CategoriaPlano }) {
  const Icone = frentesTreino.find((f) => f.categoria === categoria)?.icone;
  const planos = planosDaCategoria(categoria);
  const idTitulo = `planos-${categoria.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section
      aria-labelledby={idTitulo}
      className="grid gap-6 border-t border-foreground/10 py-10 first:border-t-0 first:pt-0 lg:grid-cols-[0.7fr_1.3fr] lg:gap-10"
    >
      <div className="flex items-start gap-4 lg:flex-col lg:gap-5">
        {Icone ? (
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow">
            <Icone aria-hidden="true" className="size-6" />
          </span>
        ) : null}
        <div>
          <h2
            id={idTitulo}
            className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {categoria}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{DESCRICAO_CATEGORIA[categoria]}</p>
        </div>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2">
        {planos.map((plano, i) => (
          <PlanoCard key={plano.slug} plano={plano} indice={i} />
        ))}
      </ul>
    </section>
  );
}

const PASSOS_MATRICULA = [
  {
    icone: MessageCircle,
    titulo: "Fale com a recepção",
    texto: "A equipe apresenta os planos e ajuda a escolher o que combina com a sua rotina.",
  },
  {
    icone: ClipboardList,
    titulo: "Faça o seu cadastro",
    texto: "A recepção registra os seus dados e o plano escolhido.",
  },
  {
    icone: UserPlus,
    titulo: "Crie a sua conta",
    texto: "Use o mesmo e-mail do cadastro. Os valores e o seu plano aparecem na área do aluno.",
  },
] as const;

function ComoSeMatricular() {
  return (
    <Secao id={ANCORA_MATRICULA} className="border-t border-foreground/10">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="space-y-8">
          <CabecalhoSecao
            eyebrow="Primeiros passos"
            titulo="Como se matricular"
            texto="O atendimento é feito pela recepção da Family Gym. Os valores são apresentados no cadastro e ficam disponíveis na área do aluno."
          />
          <DadosDeContato />
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <BotaoMatricular variante="primario" />
            <ComoChegar variante="secundario" tamanho="lg" />
          </div>
        </div>
        <ol className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
          {PASSOS_MATRICULA.map(({ icone: Icone, titulo, texto }, i) => (
            <li
              key={titulo}
              className="flex gap-4 rounded-3xl border border-foreground/10 bg-card/60 p-5 sm:p-6 md:flex-col lg:flex-row"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-yellow text-brand-black">
                <Icone aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Passo {i + 1}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold">{titulo}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Secao>
  );
}

function Planos() {
  const { categoria } = Route.useSearch();
  const navigate = Route.useNavigate();

  const categoriasVisiveis: readonly CategoriaPlano[] = categoria ? [categoria] : categoriasPlanos;
  const total = categoriasVisiveis.reduce((soma, nome) => soma + planosDaCategoria(nome).length, 0);

  return (
    <SiteLayout>
      <CabecalhoPagina
        eyebrow="Planos"
        titulo="Escolha o plano que cabe na sua rotina"
        texto="Musculação, aulas coletivas, lutas, natação, melhor idade e kids. Veja o que cada plano inclui e fale com a recepção para se matricular."
        lateral={<PainelValores />}
      />

      <Secao className="pt-10 sm:pt-12 lg:pt-14">
        <FiltrosPlanos
          categoria={categoria}
          aoMudarCategoria={(nova) =>
            navigate({
              search: { categoria: nova },
              replace: true,
              resetScroll: false,
            })
          }
        />
        <p aria-live="polite" className="mt-5 text-sm text-muted-foreground">
          {total === 1 ? "1 plano" : `${total} planos`}
          {categoria ? ` em ${categoria}` : ""}
        </p>

        <div className="mt-6">
          {categoriasVisiveis.map((nome) => (
            <GrupoPlanos key={nome} categoria={nome} />
          ))}
        </div>
      </Secao>

      <ComoSeMatricular />

      <SecaoFaq
        itens={perguntasPorId(["quanto-custa", "como-matricular", "natacao"])}
        titulo="Dúvidas sobre os planos"
      />
      <CtaFinal
        titulo="Gostou do que viu?"
        texto="Conheça a grade de aulas ou crie a sua conta para começar. Se preferir, veja antes a área do aluno, com dados fictícios e sem compromisso."
        mostrarGrade
      />
    </SiteLayout>
  );
}
