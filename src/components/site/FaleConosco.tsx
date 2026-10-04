import { MessageCircle } from "lucide-react";
import { contatoDaAcademia, destinoFaleConosco, type ContatoAcademia } from "@/lib/site";
import { botaoMarca } from "./botoes";

type Estilo = Parameters<typeof botaoMarca>;

/**
 * "Fale conosco": abre o WhatsApp da recepção com uma mensagem pronta (ou liga, se só houver
 * telefone). Sem nenhum contato configurado, não desenha nada.
 */
export function FaleConosco({
  variante = "primario",
  tamanho = "lg",
  className,
  mensagem,
  contato = contatoDaAcademia,
}: {
  variante?: Estilo[0];
  tamanho?: Estilo[1];
  className?: string;
  /** Texto que já vai digitado na conversa; o padrão é um cumprimento genérico. */
  mensagem?: string;
  contato?: ContatoAcademia;
}) {
  const destino = destinoFaleConosco(contato, mensagem);
  if (!destino) return null;
  const externo = destino.startsWith("https://");
  return (
    <a
      href={destino}
      className={botaoMarca(variante, tamanho, className)}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <MessageCircle aria-hidden />
      Fale conosco
      {externo ? <span className="sr-only"> (abre o WhatsApp em outra aba)</span> : null}
    </a>
  );
}
