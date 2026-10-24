import { MessageCircle } from "lucide-react";
import { contatoDaAcademia, destinoFaleConosco } from "@/lib/site";
import type { PerfilAluno } from "@/lib/aluno-app/types";

/** Texto que já vai digitado no WhatsApp: a recepção sabe logo quem está falando. */
export function mensagemDeAjuda(perfil: Pick<PerfilAluno, "nome" | "email"> | null): string {
  const quem = perfil?.nome ? `Sou ${perfil.nome}` : "Sou aluno(a)";
  const conta = perfil?.email ? ` (conta ${perfil.email})` : "";
  return `Olá! ${quem}${conta}, aluno(a) da Family Gym, e preciso de ajuda.`;
}

/**
 * Botão fixo de ajuda na área do aluno: abre o WhatsApp da recepção. Fica acima da barra inferior
 * no celular. Sem contato configurado (nem WhatsApp nem telefone), não aparece. No modo
 * demonstração não leva a ninguém de verdade, então também fica de fora.
 */
export function AjudaFlutuante({
  perfil,
  demo,
}: {
  perfil: Pick<PerfilAluno, "nome" | "email"> | null;
  demo: boolean;
}) {
  if (demo) return null;
  const destino = destinoFaleConosco(contatoDaAcademia, mensagemDeAjuda(perfil));
  if (!destino) return null;
  const externo = destino.startsWith("https://");
  return (
    <a
      href={destino}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="fixed bottom-24 right-4 z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-yellow px-4 text-sm font-semibold text-brand-black shadow-lg transition-transform hover:scale-[1.03] focus-visible:outline-offset-2 sm:right-6 lg:bottom-6 lg:right-8"
    >
      <MessageCircle aria-hidden className="size-5" />
      <span className="hidden sm:inline">Falar com a recepção</span>
      <span className="sr-only sm:hidden">Falar com a recepção pelo WhatsApp</span>
      {externo ? <span className="sr-only"> (abre o WhatsApp em outra aba)</span> : null}
    </a>
  );
}
