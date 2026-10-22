import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const CHAVE = "fg:aviso-armazenamento-lido";

/**
 * Aviso curto e discreto: o site só usa o armazenamento essencial do navegador (login, preferências),
 * sem rastreamento. Some depois do "Entendi" e não volta naquele aparelho.
 */
export function AvisoDeArmazenamento() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    try {
      setVisivel(window.localStorage.getItem(CHAVE) !== "1");
    } catch {
      setVisivel(true);
    }
  }, []);

  if (!visivel) return null;

  function fechar() {
    try {
      window.localStorage.setItem(CHAVE, "1");
    } catch {
      // Sem armazenamento: o aviso volta na próxima visita, sem prejuízo.
    }
    setVisivel(false);
  }

  return (
    <div
      role="region"
      aria-label="Aviso sobre privacidade"
      className="fixed inset-x-3 bottom-20 z-40 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-foreground/15 bg-background/95 p-4 text-sm shadow-lg backdrop-blur sm:bottom-4 sm:flex-row sm:items-center"
    >
      <p className="flex-1 text-foreground/85">
        Usamos só o armazenamento essencial do navegador (login e preferências), sem rastreamento
        nem publicidade.{" "}
        <Link to="/privacidade" className="font-medium underline underline-offset-2">
          Saiba mais
        </Link>
        .
      </p>
      <Button
        type="button"
        onClick={fechar}
        className="min-h-11 rounded-full bg-brand-yellow px-5 font-semibold text-brand-black hover:bg-brand-yellow/90"
      >
        Entendi
      </Button>
    </div>
  );
}
