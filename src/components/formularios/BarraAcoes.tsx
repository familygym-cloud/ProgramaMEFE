import { Eraser, FolderOpen, Printer, Save, ShieldCheck } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { ConfirmarAcao } from "@/components/ConfirmarAcao";
import { useGuardaDescarte } from "@/components/equipe/useGuardaDescarte";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  exportarFormulario,
  importarFormulario,
  nomeDoArquivo,
  TAMANHO_MAXIMO_DO_ARQUIVO,
} from "@/lib/formularios/estado";
import type { DefinicaoFormulario } from "@/lib/formularios/tipos";
import { useArmazem, useSujo } from "./armazem-react";

const CLASSE_BOTAO =
  "h-auto min-h-11 flex-col gap-0.5 rounded-xl px-1 py-1.5 text-[0.7rem] leading-tight sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:py-2 sm:text-sm";

interface ArquivoLido {
  readonly valores: Record<string, string>;
  readonly ignorados: number;
}

/**
 * Barra fixa de ações: imprimir / salvar PDF, salvar e abrir arquivo, limpar. Salvar e abrir só acontecem
 * por ação da pessoa (download e escolha de arquivo no próprio aparelho); nada passa pela rede.
 */
export function BarraAcoes({ definicao }: { definicao: DefinicaoFormulario }) {
  const armazem = useArmazem();
  const sujo = useSujo();
  const guarda = useGuardaDescarte(sujo);
  const entradaDeArquivo = useRef<HTMLInputElement>(null);
  const [limpando, setLimpando] = useState(false);
  const [substituindo, setSubstituindo] = useState<ArquivoLido | null>(null);

  function salvarArquivo() {
    const texto = exportarFormulario(definicao, armazem.instantaneo());
    const blob = new Blob([texto], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeDoArquivo(definicao);
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    armazem.marcarSalvo();
    toast.success(
      "Arquivo salvo no seu aparelho. Ele contém dados de saúde sem criptografia: guarde em local protegido.",
    );
  }

  function aplicar(lido: ArquivoLido) {
    armazem.substituir(lido.valores);
    const n = Object.keys(lido.valores).length;
    toast.success(
      n === 1 ? "Arquivo aberto: 1 campo preenchido." : `Arquivo aberto: ${n} campos preenchidos.`,
    );
    if (lido.ignorados > 0) {
      toast.warning(
        lido.ignorados === 1
          ? "1 item do arquivo não existe neste formulário e foi ignorado."
          : `${lido.ignorados} itens do arquivo não existem neste formulário e foram ignorados.`,
      );
    }
  }

  async function aoEscolherArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    if (arquivo.size > TAMANHO_MAXIMO_DO_ARQUIVO) {
      toast.error("O arquivo é grande demais para ser um formulário salvo.");
      return;
    }
    let texto: string;
    try {
      texto = await arquivo.text();
    } catch {
      toast.error("Não foi possível ler o arquivo.");
      return;
    }
    const resultado = importarFormulario(texto, definicao);
    if (!resultado.ok) {
      toast.error(resultado.erro);
      return;
    }
    const lido = { valores: resultado.valores, ignorados: resultado.ignorados };
    if (armazem.sujo()) setSubstituindo(lido);
    else aplicar(lido);
  }

  return (
    <>
      <div className="fm-nao-imprimir sticky top-0 z-30 border-b border-foreground/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
          <p className="flex items-center gap-1.5 text-[0.7rem] leading-tight text-muted-foreground sm:min-h-9 sm:text-xs">
            <ShieldCheck className="size-4 shrink-0 text-brand-yellow" aria-hidden />
            Nada é enviado nem guardado: os dados ficam só nesta aba.
          </p>
          <div className="grid w-full grid-cols-4 gap-1.5 sm:ml-auto sm:flex sm:w-auto sm:gap-2">
            <Button
              type="button"
              onClick={salvarArquivo}
              aria-label="Salvar arquivo"
              className={CLASSE_BOTAO}
            >
              <Save aria-hidden />
              <span className="sm:hidden">Salvar</span>
              <span className="hidden sm:inline">Salvar arquivo</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              aria-label="Imprimir ou salvar PDF"
              className={CLASSE_BOTAO}
            >
              <Printer aria-hidden />
              <span className="sm:hidden">Imprimir</span>
              <span className="hidden sm:inline">Imprimir / Salvar PDF</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => entradaDeArquivo.current?.click()}
              aria-label="Abrir arquivo"
              className={CLASSE_BOTAO}
            >
              <FolderOpen aria-hidden />
              <span className="sm:hidden">Abrir</span>
              <span className="hidden sm:inline">Abrir arquivo</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLimpando(true)}
              aria-label="Limpar formulário"
              className={`${CLASSE_BOTAO} border-destructive/60 text-destructive hover:bg-destructive/10 hover:text-destructive`}
            >
              <Eraser aria-hidden />
              <span className="sm:hidden">Limpar</span>
              <span className="hidden sm:inline">Limpar</span>
            </Button>
          </div>
          <input
            ref={entradaDeArquivo}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            tabIndex={-1}
            aria-label={`Escolher o arquivo salvo da ${definicao.nome}`}
            onChange={(e) => void aoEscolherArquivo(e)}
          />
        </div>
      </div>

      <ConfirmarAcao
        aberto={limpando}
        aoMudarAberto={setLimpando}
        titulo="Limpar o formulário?"
        descricao="Todos os campos desta tela serão apagados. Nada foi guardado em outro lugar, então isso não pode ser desfeito. Se precisar do conteúdo, salve o arquivo antes."
        rotuloConfirmar="Limpar tudo"
        destrutivo
        aoConfirmar={() => {
          armazem.limpar();
          armazem.marcarSalvo();
          toast.success("Formulário limpo.");
        }}
      />

      <ConfirmarAcao
        aberto={substituindo !== null}
        aoMudarAberto={(aberto) => {
          if (!aberto) setSubstituindo(null);
        }}
        titulo="Substituir o que está na tela?"
        descricao="O que está na tela ainda não foi salvo e será substituído pelo conteúdo do arquivo."
        rotuloConfirmar="Substituir"
        destrutivo
        aoConfirmar={() => {
          if (substituindo) aplicar(substituindo);
          setSubstituindo(null);
        }}
      />

      <AlertDialog open={guarda.aberto} onOpenChange={(abrir) => !abrir && guarda.cancelar()}>
        <AlertDialogContent className="w-[calc(100%-2rem)] rounded-3xl border-foreground/15 bg-card sm:rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">Sair sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              O que foi preenchido não está guardado em nenhum lugar e será perdido. Salve o arquivo
              ou imprima antes de sair.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-11 rounded-full border-foreground/20 bg-transparent px-6">
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 rounded-full bg-destructive px-6 text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                // Sem isto o Radix fecha o diálogo sozinho e o cancelamento dispararia em seguida.
                e.preventDefault();
                guarda.confirmar();
              }}
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
