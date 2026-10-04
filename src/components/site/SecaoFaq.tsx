import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { PerguntaFrequente } from "./faq";
import { CabecalhoSecao, Secao } from "./SecaoSite";

export function SecaoFaq({
  itens,
  titulo = "Perguntas frequentes",
  texto = "Respostas diretas, com base na tabela de planos da academia.",
}: {
  itens: PerguntaFrequente[];
  titulo?: string;
  texto?: string;
}) {
  return (
    <Secao id="perguntas" className="border-t border-white/10">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <CabecalhoSecao
          eyebrow="Dúvidas"
          titulo={titulo}
          texto={texto}
          className="lg:sticky lg:top-28 lg:self-start"
        />
        <Accordion type="single" collapsible className="space-y-3">
          {itens.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="rounded-2xl border border-white/10 bg-card/60 px-5 transition-colors data-[state=open]:border-brand-yellow/40 data-[state=open]:bg-card"
            >
              <AccordionTrigger className="min-h-14 py-4 font-display text-base font-medium hover:no-underline sm:text-lg">
                {item.pergunta}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                {item.resposta}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Secao>
  );
}
