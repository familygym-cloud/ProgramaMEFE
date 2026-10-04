import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { botaoMarca } from "./botoes";
import { CONTAINER } from "./SecaoSite";
import { useSessao } from "./sessao";

/** Único bloco amarelo cheio do site: o convite final, antes do rodapé. */
export function CtaFinal({
  titulo = "Pronto para treinar em família?",
  texto = "Crie a sua conta e acompanhe treinos, aulas e resultados. Ou dê uma volta pela área do aluno antes, sem compromisso.",
  mostrarPlanos = false,
  mostrarGrade = false,
}: {
  titulo?: string;
  texto?: string;
  /** Inclui o atalho para /valores, a página de planos (útil em páginas que ainda não falaram deles). */
  mostrarPlanos?: boolean;
  /** Inclui o atalho para a grade de aulas (/grade). */
  mostrarGrade?: boolean;
}) {
  const { logado } = useSessao();

  return (
    <section aria-label="Comece agora" className="pb-16 sm:pb-24">
      <div className={CONTAINER}>
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-brand-yellow px-6 py-14 text-brand-black sm:px-12 sm:py-20">
          <BrandLogo
            variante="marca"
            tom="preto"
            className="pointer-events-none absolute -right-16 top-1/2 -z-10 h-[130%] -translate-y-1/2 opacity-[0.08] sm:right-6"
          />
          <div className="max-w-2xl space-y-4">
            <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              {titulo}
            </h2>
            <p className="text-base leading-relaxed text-brand-black/75 text-pretty sm:text-lg">
              {texto}
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {logado ? (
              <Link to="/app" className={botaoMarca("escuro", "lg")}>
                Ir para minha área <ArrowRight />
              </Link>
            ) : (
              <Link to="/auth" search={{ modo: "signup" }} className={botaoMarca("escuro", "lg")}>
                Criar conta <ArrowRight />
              </Link>
            )}
            {mostrarPlanos ? (
              <Link to="/valores" className={botaoMarca("contorno-escuro", "lg")}>
                Ver os planos
              </Link>
            ) : null}
            {mostrarGrade ? (
              <Link to="/grade" className={botaoMarca("contorno-escuro", "lg")}>
                Ver a grade de aulas
              </Link>
            ) : null}
            <Link to="/app" search={{ demo: true }} className={botaoMarca("contorno-escuro", "lg")}>
              Ver a área do aluno em ação
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
