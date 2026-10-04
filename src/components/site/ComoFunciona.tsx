import { ClipboardList, TrendingUp, UserPlus, type LucideIcon } from "lucide-react";
import { CabecalhoSecao, Secao } from "./SecaoSite";

const PASSOS: { icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    icone: ClipboardList,
    titulo: "Escolha o seu plano",
    texto:
      "Conheça as modalidades e o que cada plano inclui. Para se matricular, fale com a recepção da Family Gym.",
  },
  {
    icone: UserPlus,
    titulo: "Crie a sua conta",
    texto:
      "Cadastre o seu e-mail. A recepção vincula a conta ao seu cadastro de aluno e libera a sua área.",
  },
  {
    icone: TrendingUp,
    titulo: "Treine e acompanhe",
    texto: "Reserve aulas, siga o seu treino e veja a evolução avaliação após avaliação.",
  },
];

export function ComoFunciona() {
  return (
    <Secao id="como-funciona">
      <CabecalhoSecao
        eyebrow="Como funciona"
        titulo="Do primeiro dia à evolução, em três passos"
        centralizado
      />
      <ol className="mt-14 grid gap-5 md:grid-cols-3">
        {PASSOS.map(({ icone: Icone, titulo, texto }, i) => (
          <li
            key={titulo}
            className="fg-entrada relative overflow-hidden rounded-3xl border border-foreground/10 bg-card/60 p-6 sm:p-7"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-2 -top-4 select-none font-display text-[7rem] font-bold leading-none text-foreground/[0.04]"
            >
              {i + 1}
            </span>
            <div className="relative flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-brand-yellow text-brand-black">
                <Icone className="size-6" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Passo {i + 1}
              </p>
            </div>
            <h3 className="relative mt-5 font-display text-2xl font-semibold tracking-tight">
              {titulo}
            </h3>
            <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{texto}</p>
          </li>
        ))}
      </ol>
    </Secao>
  );
}
