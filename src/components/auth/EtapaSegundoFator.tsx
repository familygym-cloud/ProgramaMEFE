import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { CampoCodigo } from "@/components/auth/CampoCodigo";
import { BOTAO_INCOMPLETO } from "@/components/auth/estilos";
import { Button } from "@/components/ui/button";
import {
  confirmarCodigo,
  primeiroFatorVerificado,
  TAMANHO_CODIGO,
  traduzErroMfa,
} from "@/lib/auth-mfa";
import { cn } from "@/lib/utils";

/** Etapa "Código de verificação": pede o código do aplicativo autenticador para elevar a sessão a aal2. */
export function EtapaSegundoFator({
  titulo = "Código de verificação",
  texto = "Abra o aplicativo autenticador e digite o código de 6 dígitos da Family Gym.",
  rotuloVoltar,
  aoVerificar,
  aoVoltar,
}: {
  titulo?: string;
  texto?: string;
  rotuloVoltar: string;
  aoVerificar: () => void | Promise<void>;
  aoVoltar: () => void | Promise<void>;
}) {
  const [fatorId, setFatorId] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    primeiroFatorVerificado()
      .then((fator) => {
        if (!ativo) return;
        if (fator) setFatorId(fator.id);
        else
          setErro(
            "Não encontramos um aparelho de verificação nesta conta. Saia e entre novamente.",
          );
      })
      .catch((e: unknown) => {
        if (ativo) setErro(traduzErroMfa(e));
      });
    return () => {
      ativo = false;
    };
  }, []);

  async function verificar(valor: string) {
    if (!fatorId || valor.length !== TAMANHO_CODIGO || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await confirmarCodigo(fatorId, valor);
      await aoVerificar();
    } catch (e) {
      setErro(traduzErroMfa(e));
      setCodigo("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fg-entrada space-y-7">
      <div className="space-y-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow [&_svg]:size-7">
          <ShieldCheck aria-hidden />
        </span>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight">{titulo}</h1>
          <p className="text-muted-foreground">{texto}</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void verificar(codigo);
        }}
        className="space-y-5"
      >
        <CampoCodigo
          valor={codigo}
          aoMudar={(v) => {
            setCodigo(v);
            if (erro) setErro(null);
          }}
          aoCompletar={(v) => void verificar(v)}
          desabilitado={enviando || !fatorId}
          invalido={Boolean(erro)}
          autoFocar
        />

        {erro ? (
          <p
            role="alert"
            className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200"
          >
            {erro}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={enviando || !fatorId || codigo.length !== TAMANHO_CODIGO}
          className={cn(
            "h-12 w-full rounded-2xl text-base font-semibold",
            !enviando && BOTAO_INCOMPLETO,
          )}
        >
          {enviando ? <Loader2 aria-hidden className="animate-spin" /> : null}
          {enviando ? "Verificando…" : "Verificar e entrar"}
        </Button>
      </form>

      <div className="space-y-3 text-center">
        <button
          type="button"
          onClick={() => void aoVoltar()}
          disabled={enviando}
          className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {rotuloVoltar}
        </button>
        <p className="text-xs text-muted-foreground">
          Sem acesso ao aplicativo? Fale com a recepção da Family Gym.
        </p>
      </div>
    </div>
  );
}
