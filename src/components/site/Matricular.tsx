import type { ReactNode } from "react";
import { MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import {
  contatoDaAcademia,
  destinoMatricula,
  formatarTelefoneBR,
  linkTelefone,
  linkWhatsapp,
  MENSAGEM_MATRICULA,
  type ContatoAcademia,
} from "@/lib/site";
import { botaoMarca } from "./botoes";

/** Âncora da orientação "como se matricular" em /valores (destino quando não há contato configurado). */
export const ANCORA_MATRICULA = "como-se-matricular";

type Estilo = Parameters<typeof botaoMarca>;

/**
 * "Quero me matricular": abre o WhatsApp (ou liga) quando a academia configurou o contato;
 * sem contato configurado, rola até a orientação "fale com a recepção". Por isso só deve ser
 * usado na página de planos (/valores), onde essa orientação existe.
 */
export function BotaoMatricular({
  variante = "secundario",
  tamanho = "lg",
  className,
  contato = contatoDaAcademia,
}: {
  variante?: Estilo[0];
  tamanho?: Estilo[1];
  className?: string;
  contato?: ContatoAcademia;
}) {
  const classes = botaoMarca(variante, tamanho, className);
  const destino = destinoMatricula(contato);
  if (destino) {
    const externo = destino.startsWith("https://");
    return (
      <a
        href={destino}
        className={classes}
        {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        Quero me matricular
        {externo ? <span className="sr-only"> (abre o WhatsApp em outra aba)</span> : null}
      </a>
    );
  }
  // Âncora simples (e não <Link>): na própria página de planos o link não deve virar "página atual".
  return (
    <a href={`#${ANCORA_MATRICULA}`} className={classes}>
      Quero me matricular
    </a>
  );
}

function Linha({
  icone: Icone,
  rotulo,
  children,
}: {
  icone: LucideIcon;
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-foreground/10 bg-foreground/5 text-brand-yellow">
        <Icone className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {rotulo}
        </p>
        <div className="text-base font-medium text-foreground">{children}</div>
      </div>
    </li>
  );
}

const CLASSE_LINK_CONTATO =
  "inline-flex min-h-11 items-center underline-offset-4 hover:text-brand-yellow hover:underline";

/** Contatos configurados da academia; sem nenhum, não desenha nada (devolve `null`). */
export function DadosDeContato({ contato = contatoDaAcademia }: { contato?: ContatoAcademia }) {
  const { whatsapp, telefone, endereco } = contato;
  if (!whatsapp && !telefone && !endereco) return null;
  return (
    <ul className="space-y-4">
      {whatsapp ? (
        <Linha icone={MessageCircle} rotulo="WhatsApp">
          <a
            href={linkWhatsapp(whatsapp, MENSAGEM_MATRICULA)}
            target="_blank"
            rel="noopener noreferrer"
            className={CLASSE_LINK_CONTATO}
          >
            {formatarTelefoneBR(whatsapp)}
            <span className="sr-only"> (abre o WhatsApp em outra aba)</span>
          </a>
        </Linha>
      ) : null}
      {telefone ? (
        <Linha icone={Phone} rotulo="Telefone">
          <a href={linkTelefone(telefone)} className={CLASSE_LINK_CONTATO}>
            {formatarTelefoneBR(telefone)}
          </a>
        </Linha>
      ) : null}
      {endereco ? (
        <Linha icone={MapPin} rotulo="Endereço">
          {endereco}
        </Linha>
      ) : null}
    </ul>
  );
}
