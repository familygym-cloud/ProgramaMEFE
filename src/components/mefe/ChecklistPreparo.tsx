import { useId, useState } from "react";
import { CircleCheck, ListChecks, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { checklistDePreparo } from "@/lib/mefe/conteudo";
import { cn } from "@/lib/utils";

/**
 * Checklist de preparo da bioimpedância. As marcações ficam só na memória desta tela: nada é
 * enviado nem guardado, e ao recarregar a página tudo volta ao começo.
 */
export function ChecklistPreparo() {
  const idTitulo = useId();
  const [marcados, setMarcados] = useState<ReadonlySet<string>>(() => new Set());
  const total = checklistDePreparo.length;
  const feitos = marcados.size;
  const completo = feitos === total;

  function alternar(id: string) {
    setMarcados((anterior) => {
      const proximo = new Set(anterior);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  return (
    <section
      aria-labelledby={idTitulo}
      className="rounded-[2rem] border border-foreground/10 bg-card/70 p-6 sm:p-8"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-yellow text-brand-black">
          <ListChecks aria-hidden="true" className="size-6" />
        </span>
        <div className="space-y-1">
          <h3
            id={idTitulo}
            className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl"
          >
            Como se preparar
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Marque o que você já conferiu. As marcações ficam só nesta tela e não são enviadas nem
            guardadas.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p aria-live="polite" className="font-semibold">
            {feitos} de {total} itens conferidos
          </p>
          {feitos > 0 ? (
            <button
              type="button"
              onClick={() => setMarcados(new Set())}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Limpar
            </button>
          ) : null}
        </div>
        <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-brand-yellow transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${(feitos / total) * 100}%` }}
          />
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {checklistDePreparo.map((item) => {
          const marcado = marcados.has(item.id);
          return (
            <li key={item.id}>
              <label
                className={cn(
                  "flex min-h-14 cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors",
                  marcado
                    ? "border-brand-yellow/50 bg-brand-yellow/5"
                    : "border-foreground/10 bg-background/50 hover:border-foreground/30",
                )}
              >
                <Checkbox
                  checked={marcado}
                  onCheckedChange={() => alternar(item.id)}
                  className="relative mt-0.5 size-6 rounded-[0.45rem] border-2 after:absolute after:-inset-3 after:content-[''] border-input bg-transparent shadow-none data-[state=checked]:border-brand-yellow"
                />
                <span className="space-y-1">
                  <span className="block font-medium leading-snug">{item.titulo}</span>
                  <span className="block text-sm leading-relaxed text-muted-foreground">
                    {item.detalhe}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <p
        role="status"
        className={cn(
          "mt-5 flex items-start gap-3 rounded-2xl p-4 text-sm font-medium leading-relaxed",
          completo ? "border border-brand-yellow/50 bg-brand-yellow/10" : "hidden",
        )}
      >
        {completo ? (
          <>
            <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-yellow" />
            Tudo conferido. Se ficou alguma dúvida, fale com a equipe antes da avaliação.
          </>
        ) : null}
      </p>
    </section>
  );
}
