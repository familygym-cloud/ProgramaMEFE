import { useMemo, useState } from "react";
import { Check, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { gerarPixCopiaECola, pixDaAcademia } from "@/lib/pix";

async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/**
 * "Pagar com Pix": mostra o código copia e cola da mensalidade, com o valor já preenchido. Só
 * aparece quando a academia configurou a chave Pix (VITE_PIX_CHAVE). A baixa continua sendo da
 * recepção: o app não confirma pagamento sozinho.
 */
export function PagarComPix({
  valor,
  identificador,
}: {
  valor: number;
  /** Identificador da cobrança (usado no código Pix para a recepção conciliar). */
  identificador: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const codigo = useMemo(() => {
    const dados = pixDaAcademia();
    return dados ? gerarPixCopiaECola({ ...dados, valor, identificador }) : null;
  }, [valor, identificador]);

  if (!codigo) return null;

  async function aoCopiar() {
    if (!codigo) return;
    if (await copiar(codigo)) {
      setCopiado(true);
      toast.success("Código Pix copiado. Cole no aplicativo do seu banco.");
      window.setTimeout(() => setCopiado(false), 3000);
    } else {
      toast.error("Não foi possível copiar. Selecione o código e copie manualmente.");
    }
  }

  return (
    <div className="w-full space-y-3">
      <Button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="h-12 w-full rounded-full bg-brand-yellow px-6 font-semibold text-brand-black hover:bg-brand-yellow/90 md:w-auto"
      >
        <QrCode aria-hidden />
        Pagar com Pix
      </Button>
      {aberto ? (
        <div className="space-y-3 rounded-2xl border border-foreground/15 bg-background/60 p-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground/85">
            <li>Toque em &ldquo;Copiar código&rdquo;.</li>
            <li>
              No aplicativo do seu banco, escolha <strong>Pix &gt; Pix Copia e Cola</strong>.
            </li>
            <li>Confira o valor e o nome do recebedor e confirme.</li>
          </ol>
          <label className="block text-xs text-muted-foreground" htmlFor="codigo-pix">
            Código Pix
          </label>
          <textarea
            id="codigo-pix"
            readOnly
            value={codigo}
            rows={3}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full resize-none rounded-xl border border-foreground/15 bg-foreground/5 p-3 font-mono text-xs break-all"
          />
          <Button
            type="button"
            variant="outline"
            onClick={aoCopiar}
            className="h-11 w-full rounded-full border-foreground/25 bg-transparent"
          >
            {copiado ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copiado ? "Copiado" : "Copiar código"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Depois de pagar, a recepção confirma o pagamento e a parcela passa a aparecer como paga.
          </p>
        </div>
      ) : null}
    </div>
  );
}
