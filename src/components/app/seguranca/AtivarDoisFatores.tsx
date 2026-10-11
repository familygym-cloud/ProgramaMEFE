import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FlaskConical,
  KeyRound,
  Loader2,
  ScanLine,
  Smartphone,
} from "lucide-react";
import { Selo } from "@/components/app/ui";
import { ChaveSecreta } from "@/components/app/seguranca/ChaveSecreta";
import { PassosAtivacao } from "@/components/app/seguranca/PassosAtivacao";
import { QrDemonstracao } from "@/components/app/seguranca/QrDemonstracao";
import { CODIGO_DEMO } from "@/components/app/seguranca/useDoisFatores";
import { CampoCodigo } from "@/components/auth/CampoCodigo";
import { BOTAO_INCOMPLETO } from "@/components/auth/estilos";
import { Button } from "@/components/ui/button";
import { TAMANHO_CODIGO, traduzErroMfa, type CadastroTotp } from "@/lib/auth-mfa";
import { cn } from "@/lib/utils";

type Passo = 0 | 1 | 2;

function AvisoSimulacao() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 p-3.5 text-sm">
      <FlaskConical aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
      <p className="text-foreground/90">
        <strong className="font-semibold">Simulação.</strong> Na demonstração nada é enviado ao
        servidor e o código aceito é{" "}
        <code className="rounded bg-background/30 px-1.5 py-0.5 font-mono text-brand-yellow">
          {CODIGO_DEMO}
        </code>
        .
      </p>
    </div>
  );
}

function PassoEscanear({
  cadastro,
  demo,
  aoCancelar,
  aoContinuar,
}: {
  cadastro: CadastroTotp;
  demo: boolean;
  aoCancelar: () => void;
  aoContinuar: () => void;
}) {
  const podeAbrirNoApp = cadastro.uri.startsWith("otpauth://");
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="mx-auto space-y-3 sm:mx-0">
          <div className="rounded-3xl bg-foreground p-3 shadow-lg shadow-background/30">
            {demo ? (
              <QrDemonstracao className="size-44" />
            ) : (
              <img
                src={cadastro.qrCode}
                alt="QR code para adicionar a Family Gym ao aplicativo autenticador"
                className="size-44"
              />
            )}
          </div>
          {demo ? (
            <p className="text-center">
              <Selo tom="atencao">QR de demonstração</Selo>
            </p>
          ) : null}
        </div>

        <ul className="space-y-4 text-sm">
          <li className="flex gap-3">
            <Smartphone aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <p className="text-foreground/90">
              Abra seu aplicativo autenticador, como Google Authenticator, Microsoft Authenticator
              ou Authy. Ainda não tem um? Instale pela loja de aplicativos do celular.
            </p>
          </li>
          <li className="flex gap-3">
            <ScanLine aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <p className="text-foreground/90">
              Adicione uma conta nova e aponte a câmera para o QR code.
            </p>
          </li>
        </ul>
      </div>

      {podeAbrirNoApp ? (
        <Button
          asChild
          variant="outline"
          className="h-11 w-full rounded-xl border-foreground/15 bg-transparent hover:bg-foreground/10 md:hidden"
        >
          <a href={cadastro.uri}>Estou no celular: abrir no aplicativo</a>
        </Button>
      ) : null}

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <KeyRound aria-hidden className="size-4" />
          Sem câmera? Digite esta chave no aplicativo:
        </p>
        <ChaveSecreta segredo={cadastro.segredo} />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={aoCancelar}
          className="h-11 rounded-xl px-5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        >
          Cancelar
        </Button>
        <Button type="button" onClick={aoContinuar} className="h-11 rounded-xl px-6 font-semibold">
          Já adicionei, continuar
          <ArrowRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function PassoConfirmar({
  demo,
  aoVoltar,
  aoConfirmar,
}: {
  demo: boolean;
  aoVoltar: () => void;
  aoConfirmar: (codigo: string) => Promise<void>;
}) {
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar(valor: string) {
    if (valor.length !== TAMANHO_CODIGO || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await aoConfirmar(valor);
    } catch (e) {
      setErro(traduzErroMfa(e));
      setCodigo("");
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void confirmar(codigo);
      }}
      className="space-y-6"
    >
      <p className="text-foreground/90">
        Digite o código de 6 dígitos que o aplicativo mostra agora. Ele muda a cada 30 segundos.
      </p>

      <CampoCodigo
        valor={codigo}
        aoMudar={(v) => {
          setCodigo(v);
          if (erro) setErro(null);
        }}
        aoCompletar={(v) => void confirmar(v)}
        desabilitado={enviando}
        invalido={Boolean(erro)}
        autoFocar
      />

      {demo ? (
        <p className="text-center text-sm text-muted-foreground">
          Demonstração: digite{" "}
          <span className="font-mono font-semibold text-foreground">{CODIGO_DEMO}</span>.
        </p>
      ) : null}

      {erro ? (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {erro}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={aoVoltar}
          disabled={enviando}
          className="h-11 rounded-xl px-5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        >
          <ArrowLeft aria-hidden />
          Voltar
        </Button>
        <Button
          type="submit"
          disabled={enviando || codigo.length !== TAMANHO_CODIGO}
          className={cn("h-11 rounded-xl px-6 font-semibold", !enviando && BOTAO_INCOMPLETO)}
        >
          {enviando ? <Loader2 aria-hidden className="animate-spin" /> : null}
          {enviando ? "Verificando…" : "Confirmar e ativar"}
        </Button>
      </div>
    </form>
  );
}

function PassoPronto({ aoConcluir }: { aoConcluir: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-brand-yellow text-brand-black">
        <Check aria-hidden className="size-8" strokeWidth={3} />
      </span>
      <div className="space-y-2">
        <h3 className="font-display text-2xl font-bold">Tudo pronto!</h3>
        <p className="mx-auto max-w-sm text-muted-foreground">
          Ao entrar na sua conta, além da senha, vamos pedir o código do aplicativo autenticador.
        </p>
      </div>
      <p className="max-w-md rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-left text-sm text-muted-foreground">
        <strong className="font-semibold text-foreground">Vai trocar de celular?</strong> Antes de
        se desfazer do atual, remova este aparelho aqui em Segurança e ative de novo no celular
        novo.
      </p>
      <Button type="button" onClick={aoConcluir} className="h-11 rounded-xl px-8 font-semibold">
        Concluir
      </Button>
    </div>
  );
}

/** Passo a passo de ativação: escanear o QR code, confirmar com um código e concluir. */
export function AtivarDoisFatores({
  cadastro,
  demo,
  aoConfirmar,
  aoCancelar,
  aoConcluir,
}: {
  cadastro: CadastroTotp;
  demo: boolean;
  aoConfirmar: (cadastro: CadastroTotp, codigo: string) => Promise<void>;
  aoCancelar: () => void;
  aoConcluir: () => void;
}) {
  const [passo, setPasso] = useState<Passo>(0);

  return (
    <div className="space-y-6">
      <PassosAtivacao atual={passo} />
      {demo ? <AvisoSimulacao /> : null}
      <div key={passo} className="fg-entrada">
        {passo === 0 ? (
          <PassoEscanear
            cadastro={cadastro}
            demo={demo}
            aoCancelar={aoCancelar}
            aoContinuar={() => setPasso(1)}
          />
        ) : passo === 1 ? (
          <PassoConfirmar
            demo={demo}
            aoVoltar={() => setPasso(0)}
            aoConfirmar={async (codigo) => {
              await aoConfirmar(cadastro, codigo);
              setPasso(2);
            }}
          />
        ) : (
          <PassoPronto aoConcluir={aoConcluir} />
        )}
      </div>
    </div>
  );
}
