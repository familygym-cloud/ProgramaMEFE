import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, MapPin, Navigation } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { contatoDaAcademia, linksComoChegar } from "@/lib/site";
import { botaoMarca } from "./botoes";

type Estilo = Parameters<typeof botaoMarca>;

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/**
 * "Como chegar": abre uma janela com o endereço da academia e atalhos para traçar a rota no
 * Google Maps, no Maps da Apple e no Waze (o aplicativo abre sozinho se estiver instalado).
 * Sem endereço configurado, não desenha nada.
 */
export function ComoChegar({
  variante = "secundario",
  tamanho = "lg",
  className,
  endereco = contatoDaAcademia.endereco,
}: {
  variante?: Estilo[0];
  tamanho?: Estilo[1];
  className?: string;
  endereco?: string | null;
}) {
  const [copiado, setCopiado] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  const links = linksComoChegar(endereco);
  if (!endereco || links.length === 0) return null;

  async function copiar() {
    if (!endereco || !(await copiarTexto(endereco))) return;
    setCopiado(true);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={botaoMarca(variante, tamanho, className)}>
          <MapPin aria-hidden />
          Como chegar
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-3xl border-foreground/10 bg-card p-6 sm:p-8">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="font-display text-2xl leading-tight">Como chegar</DialogTitle>
          <DialogDescription className="text-base text-foreground/80">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Academia Family Gym
            </span>
            {endereco}
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">Escolha o aplicativo para traçar a rota:</p>
        <ul className="grid gap-2.5">
          {links.map((link) => (
            <li key={link.app}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-foreground/15 bg-foreground/5 px-4 text-base font-semibold text-foreground transition-colors hover:border-brand-yellow/60 hover:bg-foreground/10"
              >
                <span className="flex items-center gap-3">
                  <Navigation aria-hidden className="size-5 text-brand-yellow" />
                  {link.nome}
                </span>
                <ExternalLink aria-hidden className="size-4 text-muted-foreground" />
                <span className="sr-only">(abre em outra aba)</span>
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={copiar}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl text-sm font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
        >
          {copiado ? (
            <Check aria-hidden className="size-4 text-brand-yellow" />
          ) : (
            <Copy aria-hidden className="size-4" />
          )}
          {copiado ? "Endereço copiado" : "Copiar endereço"}
        </button>
        <span role="status" className="sr-only">
          {copiado ? "Endereço copiado para a área de transferência" : ""}
        </span>
      </DialogContent>
    </Dialog>
  );
}
