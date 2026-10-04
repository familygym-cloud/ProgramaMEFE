import { contatoDaAcademia, destinoFaleConosco, linksComoChegar } from "@/lib/site";
import { ComoChegar } from "./ComoChegar";
import { FaleConosco } from "./FaleConosco";

/**
 * Barra de contato do celular: "Como chegar" e "Fale conosco" lado a lado, colados no rodapé da
 * tela enquanto a pessoa rola. Só aparece em telas pequenas (`md:hidden`) e só nas páginas públicas
 * (o `SiteLayout` é o único que a usa), então não existe em /auth nem na área do aluno.
 *
 * Fica por último no fluxo da página e é `sticky`: acompanha a rolagem e, no fim da página, assenta
 * depois do rodapé em vez de cobri-lo, sem precisar reservar altura. O `z-40` fica abaixo do
 * cabeçalho e do menu do celular (`z-50`) e das janelas (`z-50`, que vêm depois no DOM).
 */
export function BarraDeContatoMobile() {
  const temContato =
    destinoFaleConosco(contatoDaAcademia) !== null ||
    linksComoChegar(contatoDaAcademia.endereco).length > 0;
  if (!temContato) return null;

  return (
    <div
      role="group"
      aria-label="Contato rápido"
      className="sticky bottom-0 z-40 border-t border-foreground/10 bg-background/90 px-4 pt-2 backdrop-blur pb-seguro md:hidden print:hidden"
    >
      <div className="mx-auto flex max-w-md gap-3">
        <ComoChegar variante="secundario" tamanho="md" className="flex-1 px-3" />
        <FaleConosco variante="primario" tamanho="md" className="flex-1 px-3" />
      </div>
    </div>
  );
}
