import { useMemo, useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  CalendarCheck,
  Pencil,
  Plus,
  Scale,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";
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
import {
  BarraProgresso,
  EstadoVazio,
  Eyebrow,
  ModuloIndisponivel,
  Selo,
  Superficie,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import {
  ROTULO_META,
  hojeISO,
  progressoMeta,
  resumoPeso,
  treinosNoMes,
} from "@/lib/aluno-app/derive";
import { useAlunoApp } from "@/lib/aluno-app/store";
import type { AreaAlunoDados, MetaAluno, TipoMeta } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";
import { formatarNumero } from "./dados";
import { MetaDialog } from "./MetaDialog";

const TIPOS: TipoMeta[] = ["peso", "frequencia", "imc"];
/** Como cada tipo aparece no meio de uma frase ("meta de peso"). */
const NOME_NA_FRASE: Record<TipoMeta, string> = {
  peso: "peso",
  imc: "IMC",
  frequencia: "treinos por mês",
};
const ICONES: Record<TipoMeta, LucideIcon> = {
  peso: Scale,
  frequencia: CalendarCheck,
  imc: Activity,
};

function formatarValor(tipo: TipoMeta, valor: number): string {
  if (tipo === "peso") return `${formatarNumero(valor)} kg`;
  if (tipo === "imc") return formatarNumero(valor);
  return `${formatarNumero(valor, 0)} ${valor === 1 ? "treino" : "treinos"}/mês`;
}

function textoPrazo(prazo: string, concluida: boolean): string {
  const data = format(parseISO(prazo), "dd 'de' MMM yyyy", { locale: ptBR });
  if (concluida) return `Prazo: ${data}`;
  const dias = differenceInCalendarDays(parseISO(prazo), parseISO(hojeISO()));
  if (dias < 0) return `Prazo de ${data} já passou. Que tal ajustar a meta?`;
  if (dias === 0) return `Prazo é hoje (${data})`;
  return `Até ${data} · ${dias} ${dias === 1 ? "dia restante" : "dias restantes"}`;
}

export function Metas({ dados }: { dados: AreaAlunoDados }) {
  const { acoes } = useAlunoApp();
  const [editando, setEditando] = useState<MetaAluno | null>(null);
  const [criando, setCriando] = useState(false);
  const [removendo, setRemovendo] = useState<MetaAluno | null>(null);
  const [removendoEmAndamento, setRemovendoEmAndamento] = useState(false);

  const info = useMemo(() => {
    const peso = resumoPeso(dados.avaliacoes);
    const atuais: Partial<Record<TipoMeta, number>> = { frequencia: treinosNoMes(dados.checkIns) };
    if (peso) {
      atuais.peso = peso.atual;
      atuais.imc = peso.imcAtual;
    }
    const ordenadas = [...dados.metas].sort(
      (a, b) => TIPOS.indexOf(a.tipo) - TIPOS.indexOf(b.tipo),
    );
    return {
      atuais,
      pesoInicial: peso?.inicial,
      metas: ordenadas.map((meta) => ({ meta, progresso: progressoMeta(meta, dados) })),
      tiposLivres: TIPOS.filter((t) => !dados.metas.some((m) => m.tipo === t)),
    };
  }, [dados]);

  if (!dados.modulos.metas) return <ModuloIndisponivel nome="Metas" />;

  const confirmarRemocao = async () => {
    if (!removendo) return;
    setRemovendoEmAndamento(true);
    try {
      await acoes.removerMeta(removendo.id);
      setRemovendo(null);
    } catch {
      // O store já mostrou o erro; mantemos o diálogo aberto para tentar de novo.
    } finally {
      setRemovendoEmAndamento(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>Suas metas</Eyebrow>
          <h2 className="mt-2 font-display text-2xl font-bold">O que você quer alcançar</h2>
        </div>
        {info.tiposLivres.length > 0 ? (
          <Button
            type="button"
            onClick={() => setCriando(true)}
            className="h-11 rounded-full px-5 font-semibold"
          >
            <Plus aria-hidden />
            Nova meta
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Uma meta de cada tipo. Ajuste qualquer uma abaixo.
          </p>
        )}
      </div>

      {info.metas.length === 0 ? (
        <EstadoVazio
          icone={<Target />}
          titulo="Defina sua primeira meta"
          texto="Peso, IMC ou treinos por mês: escolha um alvo, acompanhe o progresso e comemore cada passo."
          acao={
            <Button
              type="button"
              onClick={() => setCriando(true)}
              className="h-11 rounded-full px-6 font-semibold"
            >
              <Plus aria-hidden />
              Criar meta
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {info.metas.map(({ meta, progresso }) => (
            <CartaoMeta
              key={meta.id}
              meta={meta}
              progresso={progresso}
              atual={info.atuais[meta.tipo]}
              pesoInicial={meta.tipo === "peso" ? info.pesoInicial : undefined}
              aoEditar={() => setEditando(meta)}
              aoRemover={() => setRemovendo(meta)}
            />
          ))}
        </ul>
      )}

      <MetaDialog
        aberto={criando || editando !== null}
        aoMudar={(aberto) => {
          if (!aberto) {
            setCriando(false);
            setEditando(null);
          }
        }}
        meta={editando}
        tiposLivres={info.tiposLivres}
        atuais={info.atuais}
      />

      <AlertDialog
        open={removendo !== null}
        onOpenChange={(aberto) => !aberto && setRemovendo(null)}
      >
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl border-foreground/10 sm:max-w-md sm:rounded-3xl">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="font-display text-xl">Remover esta meta?</AlertDialogTitle>
            <AlertDialogDescription>
              {removendo
                ? `A meta de ${NOME_NA_FRASE[removendo.tipo]} deixa de aparecer, mas seus treinos e avaliações continuam salvos.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel
              disabled={removendoEmAndamento}
              className="mt-0 h-11 rounded-full px-6"
            >
              Manter meta
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={removendoEmAndamento}
              onClick={(e) => {
                e.preventDefault();
                void confirmarRemocao();
              }}
              className="h-11 rounded-full bg-destructive px-6 text-destructive-foreground hover:bg-destructive/90"
            >
              {removendoEmAndamento ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CartaoMeta({
  meta,
  progresso,
  atual,
  pesoInicial,
  aoEditar,
  aoRemover,
}: {
  meta: MetaAluno;
  progresso: number;
  atual: number | undefined;
  pesoInicial: number | undefined;
  aoEditar: () => void;
  aoRemover: () => void;
}) {
  const { titulo } = ROTULO_META[meta.tipo];
  const Icone = ICONES[meta.tipo];
  const concluida = meta.concluida || progresso >= 100;
  return (
    <Superficie
      as="li"
      className={cn(
        "flex flex-col gap-4",
        concluida && "border-brand-yellow/40 bg-brand-yellow/10",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-2xl bg-foreground/5 text-brand-yellow [&_svg]:size-5"
          >
            <Icone />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{titulo}</h3>
            <div className="mt-1">
              <Selo tom={concluida ? "ok" : "neutro"}>
                {concluida ? "Concluída" : "Em andamento"}
              </Selo>
            </div>
          </div>
        </div>
        <div className="-mr-2 -mt-2 flex shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={aoEditar}
            aria-label={`Editar meta de ${NOME_NA_FRASE[meta.tipo]}`}
            className="size-11 rounded-full"
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={aoRemover}
            aria-label={`Remover meta de ${NOME_NA_FRASE[meta.tipo]}`}
            className="size-11 rounded-full hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <p className="font-display text-4xl font-bold leading-none tracking-tight">
        {formatarValor(meta.tipo, meta.alvo)}
      </p>

      <div className="space-y-2">
        <BarraProgresso
          valor={progresso}
          rotulo={`Progresso da meta de ${NOME_NA_FRASE[meta.tipo]}`}
        />
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="min-w-0">
            {atual !== undefined
              ? `Agora: ${formatarValor(meta.tipo, atual)}`
              : "Sem medição ainda"}
          </span>
          <span className="shrink-0 font-semibold tabular-nums text-foreground">{progresso}%</span>
        </div>
        {pesoInicial !== undefined ? (
          <p className="text-xs text-muted-foreground">
            Ponto de partida: {formatarValor("peso", pesoInicial)}
          </p>
        ) : null}
      </div>

      {meta.prazo ? (
        <p className="mt-auto border-t border-foreground/10 pt-3 text-xs text-muted-foreground">
          {textoPrazo(meta.prazo, concluida)}
        </p>
      ) : null}
    </Superficie>
  );
}
