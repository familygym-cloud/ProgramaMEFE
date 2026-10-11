import { LockKeyhole } from "lucide-react";
import type { DefinicaoFormulario } from "@/lib/formularios/tipos";

/** Aviso permanente (não se fecha): o que acontece e o que NÃO acontece com o que é digitado. */
export function PainelPrivacidade({ definicao }: { definicao: DefinicaoFormulario }) {
  return (
    <section
      aria-labelledby="aviso-privacidade"
      className="fm-nao-imprimir rounded-2xl border border-brand-yellow/40 bg-card p-4 sm:p-5"
    >
      <h2 id="aviso-privacidade" className="flex items-center gap-2 text-base text-foreground">
        <LockKeyhole className="size-5 shrink-0 text-brand-yellow" aria-hidden />
        {definicao.sigilo}: nada é enviado nem guardado
      </h2>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
        <li>
          O que você digita{" "}
          <strong className="font-semibold text-foreground">não é enviado ao servidor</strong>, não
          é gravado no navegador e não vai para nenhum banco de dados. Existe só nesta aba: se
          fechá-la sem salvar, tudo se perde.
        </li>
        <li>
          Para continuar depois, use{" "}
          <strong className="font-semibold text-foreground">Salvar arquivo</strong> e, mais tarde,{" "}
          <strong className="font-semibold text-foreground">Abrir arquivo</strong>; para entregar,
          use Imprimir / Salvar PDF. Os dois têm dados sensíveis de saúde (LGPD), sem criptografia:
          guarde em local protegido e apague quando não precisar mais.
        </li>
        <li>
          Campos <span className="font-semibold text-foreground">automáticos</span> mostram a
          fórmula e aceitam outro valor por cima. Os cálculos apoiam o profissional; a conduta é
          sempre dele. Para desmarcar uma opção, toque nela de novo (ou use Delete no teclado).
        </li>
      </ul>
    </section>
  );
}
