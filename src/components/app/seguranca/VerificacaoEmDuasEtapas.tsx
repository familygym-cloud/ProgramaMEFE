import { useState } from "react";
import { LockKeyhole, Loader2, ShieldCheck, Smartphone, Timer } from "lucide-react";
import { Selo, Superficie } from "@/components/app/ui";
import { AtivarDoisFatores } from "@/components/app/seguranca/AtivarDoisFatores";
import { FatoresAtivos } from "@/components/app/seguranca/FatoresAtivos";
import type { DoisFatores } from "@/components/app/seguranca/useDoisFatores";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { traduzErroMfa, type CadastroTotp } from "@/lib/auth-mfa";

const MOTIVOS = [
  {
    icone: LockKeyhole,
    texto: "Mesmo que alguém descubra a sua senha, não consegue entrar sem o seu celular.",
  },
  {
    icone: Smartphone,
    texto: "Funciona com apps como Google Authenticator, Microsoft Authenticator e Authy.",
  },
  { icone: Timer, texto: "Leva cerca de dois minutos para configurar." },
] as const;

function Apresentacao({
  iniciando,
  erro,
  aoComecar,
}: {
  iniciando: boolean;
  erro: string | null;
  aoComecar: () => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Uma segunda camada de proteção: além da senha, você confirma o acesso com um código gerado
        no seu celular.
      </p>
      <ul className="space-y-3">
        {MOTIVOS.map(({ icone: Icone, texto }) => (
          <li key={texto} className="flex items-start gap-3 text-sm text-foreground/90">
            <Icone aria-hidden className="mt-0.5 size-[1.15rem] shrink-0 text-muted-foreground" />
            {texto}
          </li>
        ))}
      </ul>
      {erro ? (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {erro}
        </p>
      ) : null}
      <Button
        type="button"
        onClick={aoComecar}
        disabled={iniciando}
        className="h-12 w-full rounded-2xl px-6 text-base font-semibold sm:w-auto"
      >
        {iniciando ? <Loader2 aria-hidden className="animate-spin" /> : <ShieldCheck aria-hidden />}
        {iniciando ? "Preparando…" : "Ativar verificação em duas etapas"}
      </Button>
    </div>
  );
}

/** Bloco principal da página: mostra o estado atual e conduz a ativação ou a remoção. */
export function VerificacaoEmDuasEtapas({ dois, demo }: { dois: DoisFatores; demo: boolean }) {
  const [cadastro, setCadastro] = useState<CadastroTotp | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [erroInicio, setErroInicio] = useState<string | null>(null);

  const ativa = dois.fatores.length > 0;

  async function comecar() {
    setIniciando(true);
    setErroInicio(null);
    try {
      setCadastro(await dois.iniciar());
    } catch (e) {
      setErroInicio(traduzErroMfa(e));
    } finally {
      setIniciando(false);
    }
  }

  function cancelar() {
    const atual = cadastro;
    setCadastro(null);
    if (atual) void dois.descartar(atual);
  }

  return (
    <Superficie as="section" className="space-y-6" brilho={!ativa && !dois.carregando}>
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow">
            <ShieldCheck aria-hidden className="size-6" />
          </span>
          <h2 className="font-display text-xl font-bold leading-tight sm:text-2xl">
            Verificação em duas etapas
          </h2>
        </div>
        {dois.carregando ? null : (
          <Selo tom={ativa ? "ok" : "neutro"}>{ativa ? "Ativada" : "Desativada"}</Selo>
        )}
      </div>

      <div className="relative">
        {dois.carregando ? (
          <div className="space-y-3" aria-busy="true" aria-label="Carregando">
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <Skeleton className="h-5 w-1/2 rounded-lg" />
            <Skeleton className="h-12 w-60 rounded-2xl" />
          </div>
        ) : dois.erro ? (
          <div className="space-y-4">
            <p
              role="alert"
              className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {dois.erro}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={dois.recarregar}
              className="h-11 rounded-xl border-foreground/15 bg-transparent"
            >
              Tentar de novo
            </Button>
          </div>
        ) : cadastro ? (
          <AtivarDoisFatores
            cadastro={cadastro}
            demo={demo}
            aoConfirmar={dois.confirmar}
            aoCancelar={cancelar}
            aoConcluir={() => setCadastro(null)}
          />
        ) : ativa ? (
          <FatoresAtivos fatores={dois.fatores} aoRemover={dois.remover} />
        ) : (
          <Apresentacao iniciando={iniciando} erro={erroInicio} aoComecar={comecar} />
        )}
      </div>
    </Superficie>
  );
}
