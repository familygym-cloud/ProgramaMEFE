import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import { contatoDaAcademia, MENSAGEM_CONTATO } from "@/lib/site";
import { ComoChegar } from "./ComoChegar";
import { FaleConosco } from "./FaleConosco";
import { DadosDeContato } from "./Matricular";
import { CONTAINER } from "./SecaoSite";

const CLASSE_LINK =
  "inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground";

function Coluna({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60">
        {titulo}
      </h2>
      <ul className="mt-2 flex flex-col">{children}</ul>
    </div>
  );
}

/** Endereço, WhatsApp e os dois botões de contato. Sem contato configurado, não desenha nada. */
function BlocoContato() {
  const { whatsapp, telefone, endereco } = contatoDaAcademia;
  if (!whatsapp && !telefone && !endereco) return null;
  return (
    <section aria-labelledby="rodape-contato" className="space-y-4">
      <h2
        id="rodape-contato"
        className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60"
      >
        Contato
      </h2>
      <DadosDeContato mensagem={MENSAGEM_CONTATO} />
      <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
        <ComoChegar variante="secundario" tamanho="md" />
        <FaleConosco variante="primario" tamanho="md" />
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative border-t border-foreground/10 bg-sidebar/70">
      <div
        className={cn(
          CONTAINER,
          "grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr_1fr] lg:py-16",
        )}
      >
        <div className="max-w-md space-y-8 sm:col-span-2 lg:col-span-1">
          <div className="max-w-xs space-y-4">
            <BrandLogo variante="principal" className="h-10" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Treine em família. Evolua sempre. Musculação, aulas coletivas, lutas, natação, melhor
              idade e kids.
            </p>
          </div>
          <BlocoContato />
        </div>

        <Coluna titulo="Conheça">
          <li>
            <Link to="/modalidades" className={CLASSE_LINK}>
              Modalidades
            </Link>
          </li>
          <li>
            <Link to="/grade" className={CLASSE_LINK}>
              Grade de aulas
            </Link>
          </li>
          <li>
            <Link to="/valores" className={CLASSE_LINK}>
              Planos
            </Link>
          </li>
          <li>
            <Link to="/mefe" className={CLASSE_LINK}>
              Programa MEFE
            </Link>
          </li>
        </Coluna>

        <Coluna titulo="Para o aluno">
          <li>
            <Link to="/auth" search={{ modo: "signup" }} className={CLASSE_LINK}>
              Criar conta
            </Link>
          </li>
          <li>
            <Link to="/auth" className={CLASSE_LINK}>
              Entrar
            </Link>
          </li>
          <li>
            <Link to="/app" search={{ demo: true }} className={CLASSE_LINK}>
              Ver a área do aluno em ação
            </Link>
          </li>
        </Coluna>

        <Coluna titulo="Equipe">
          <li>
            <Link to="/auth" className={CLASSE_LINK}>
              Acesso da equipe
            </Link>
          </li>
        </Coluna>
      </div>

      <div className="border-t border-foreground/10">
        <div
          className={cn(
            CONTAINER,
            "flex flex-col gap-1 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between",
          )}
        >
          <p>© {new Date().getFullYear()} Academia Family Gym. Todos os direitos reservados.</p>
          <p>Os valores dos planos ficam na área do aluno.</p>
        </div>
      </div>
    </footer>
  );
}
