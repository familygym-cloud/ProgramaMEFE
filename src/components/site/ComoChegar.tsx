import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Copy, ExternalLink, MapPin, Navigation, X } from "lucide-react";
import {
  Dialog,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { contatoDaAcademia, linksComoChegar } from "@/lib/site";
import { cn } from "@/lib/utils";
import { botaoMarca } from "./botoes";

type Estilo = Parameters<typeof botaoMarca>;
type SituacaoDaCopia = "copiado" | "falhou" | null;

/**
 * Plano B para navegadores sem a API de área de transferência (páginas sem HTTPS, WebViews e
 * iPhones mais antigos). O campo temporário nasce DENTRO da janela: o foco da janela fica preso
 * nela e um campo fora dela devolveria o foco antes de a cópia acontecer.
 */
function copiarPeloDocumento(texto: string, dentroDe: HTMLElement | null): boolean {
  const campo = document.createElement("textarea");
  campo.value = texto;
  campo.setAttribute("readonly", "");
  campo.setAttribute("aria-hidden", "true");
  campo.tabIndex = -1;
  campo.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;";
  (dentroDe ?? document.body).appendChild(campo);
  const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  campo.select();
  campo.setSelectionRange(0, texto.length);
  let copiou = false;
  try {
    copiou = document.execCommand("copy");
  } catch {
    copiou = false;
  }
  campo.remove();
  anterior?.focus();
  return copiou;
}

async function copiarTexto(texto: string, dentroDe: HTMLElement | null): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Permissão negada ou contexto inseguro: tenta o plano B.
  }
  return copiarPeloDocumento(texto, dentroDe);
}

/**
 * "Como chegar": abre uma janela com o endereço da academia e atalhos para traçar a rota no
 * Google Maps, no Maps da Apple e no Waze (o aplicativo abre sozinho se estiver instalado).
 * A janela é um diálogo modal: prende o foco, fecha com ESC ou ao tocar fora, trava a rolagem da
 * página e devolve o foco ao botão que a abriu. Sem endereço configurado, não desenha nada.
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
  const [copia, setCopia] = useState<SituacaoDaCopia>(null);
  const janela = useRef<HTMLDivElement>(null);
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
    if (!endereco) return;
    const copiou = await copiarTexto(endereco, janela.current);
    setCopia(copiou ? "copiado" : "falhou");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setCopia(null), 3500);
  }

  return (
    <Dialog onOpenChange={(aberto) => !aberto && setCopia(null)}>
      <DialogTrigger asChild>
        <button type="button" className={botaoMarca(variante, tamanho, className)}>
          <MapPin aria-hidden />
          Como chegar
        </button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={janela}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto overscroll-contain rounded-3xl border border-foreground/10 bg-card p-6 shadow-2xl duration-200 sm:p-8",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none",
          )}
        >
          <DialogPrimitive.Close className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground">
            <X aria-hidden className="size-5" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>

          <div className="space-y-3 pr-10">
            <span
              aria-hidden
              className="grid size-12 place-items-center rounded-2xl bg-brand-yellow text-brand-black [&_svg]:size-6"
            >
              <MapPin />
            </span>
            <DialogTitle className="font-display text-2xl leading-tight">Como chegar</DialogTitle>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Academia Family Gym
              </p>
              <DialogDescription className="select-text text-base text-foreground/85">
                {endereco}
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Escolha o aplicativo para traçar a rota:
            </p>
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
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={copiar}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
            >
              {copia === "copiado" ? (
                <Check aria-hidden className="size-4 text-brand-yellow" />
              ) : (
                <Copy aria-hidden className="size-4" />
              )}
              {copia === "copiado" ? "Endereço copiado" : "Copiar endereço"}
            </button>
            <p
              role="status"
              className={cn("text-center text-xs text-muted-foreground", !copia && "sr-only")}
            >
              {copia === "copiado" ? "Endereço copiado para a área de transferência." : null}
              {copia === "falhou"
                ? "Não foi possível copiar. Toque e segure o endereço acima para copiar."
                : null}
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
