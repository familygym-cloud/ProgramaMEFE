import { useEffect, useState } from "react";
import { Download, Share, Smartphone } from "lucide-react";
import { Eyebrow, Superficie } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { aoMudarInstalacao, ehIos, instalarApp, jaInstalado, podeInstalar } from "@/lib/pwa";

/**
 * "Instalar o app": o treino abre direto da tela inicial do celular e o treino do dia fica salvo
 * para ser aberto sem internet. No Android/Chrome há botão; no iPhone, o caminho é pelo Safari.
 */
export function InstalarApp() {
  const [disponivel, setDisponivel] = useState(false);
  const [instalado, setInstalado] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setInstalado(jaInstalado());
    setIos(ehIos());
    setDisponivel(podeInstalar());
    return aoMudarInstalacao(() => {
      setDisponivel(podeInstalar());
      setInstalado(jaInstalado());
    });
  }, []);

  if (instalado) return null;

  return (
    <Superficie className="space-y-4">
      <Eyebrow>App no celular</Eyebrow>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-yellow/15 text-brand-yellow [&_svg]:size-5"
        >
          <Smartphone />
        </span>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold">Leve a Family Gym no bolso</h2>
          <p className="text-sm text-muted-foreground">
            Instale na tela inicial para abrir com um toque. O treino do dia fica salvo no aparelho
            e abre mesmo sem internet na academia.
          </p>
        </div>
      </div>
      {disponivel ? (
        <Button
          type="button"
          onClick={() => void instalarApp()}
          className="h-11 rounded-full bg-brand-yellow px-6 font-semibold text-brand-black hover:bg-brand-yellow/90"
        >
          <Download aria-hidden />
          Instalar o app
        </Button>
      ) : ios ? (
        <p className="flex items-center gap-2 text-sm">
          <Share aria-hidden className="size-4 shrink-0" />
          No Safari, toque em <strong>Compartilhar</strong> e depois em{" "}
          <strong>Adicionar à Tela de Início</strong>.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          No menu do navegador, procure por &ldquo;Instalar app&rdquo; ou &ldquo;Adicionar à tela
          inicial&rdquo;.
        </p>
      )}
    </Superficie>
  );
}
