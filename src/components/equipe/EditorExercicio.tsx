import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { LIMITES } from "@/lib/equipe-app";
import { cn } from "@/lib/utils";
import { Campo, CampoNumerico, CLASSE_CAMPO } from "./Campos";
import type { FormExercicio } from "./treino-form";

export const ID_LISTA_EXERCICIOS = "equipe-exercicios-sugeridos";
export const ID_LISTA_GRUPOS = "equipe-grupos-musculares";

type Mudancas = Partial<Omit<FormExercicio, "chave">>;

/** Botão quadrado de 44px. Usa aria-disabled (e não disabled) para o foco não se perder ao chegar no limite. */
function BotaoIcone({
  rotulo,
  icone,
  inativo = false,
  perigo = false,
  onClick,
}: {
  rotulo: string;
  icone: ReactNode;
  inativo?: boolean;
  perigo?: boolean;
  onClick: ComponentProps<"button">["onClick"];
}) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      aria-disabled={inativo || undefined}
      onClick={inativo ? undefined : onClick}
      className={cn(
        "grid size-11 place-items-center rounded-xl text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/60 [&_svg]:size-[1.15rem]",
        inativo
          ? "cursor-not-allowed opacity-30"
          : perigo
            ? "hover:bg-red-500/15 hover:text-red-300"
            : "hover:bg-white/10 hover:text-foreground",
      )}
    >
      {icone}
    </button>
  );
}

/** Cartão de um exercício da prescrição: nome, séries, repetições, carga, descanso e ordem. */
export function EditorExercicio({
  exercicio,
  indice,
  total,
  erros,
  autoFoco,
  onAlterar,
  onMover,
  onRemover,
}: {
  exercicio: FormExercicio;
  indice: number;
  total: number;
  erros: Record<string, string>;
  autoFoco: boolean;
  onAlterar: (mudancas: Mudancas) => void;
  onMover: (passo: -1 | 1) => void;
  onRemover: () => void;
}) {
  const numero = indice + 1;
  const erro = (campo: string) => erros[`exercicios.${indice}.${campo}`];
  const titulo = exercicio.nome.trim() || "Novo exercício";

  return (
    <li
      aria-label={`Exercício ${numero} de ${total}: ${titulo}`}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-yellow/10 font-display text-base font-bold text-brand-yellow"
        >
          {numero}
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground/80">{titulo}</p>
        <div className="-mr-1 flex shrink-0 items-center">
          <BotaoIcone
            rotulo={`Mover o exercício ${numero} para cima`}
            icone={<ArrowUp />}
            inativo={indice === 0}
            onClick={() => onMover(-1)}
          />
          <BotaoIcone
            rotulo={`Mover o exercício ${numero} para baixo`}
            icone={<ArrowDown />}
            inativo={indice === total - 1}
            onClick={() => onMover(1)}
          />
          <BotaoIcone
            rotulo={`Remover o exercício ${numero}`}
            icone={<Trash2 />}
            perigo
            onClick={onRemover}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_15rem]">
        <Campo rotulo="Exercício" erro={erro("nome")}>
          {(props) => (
            <Input
              {...props}
              list={ID_LISTA_EXERCICIOS}
              autoFocus={autoFoco}
              autoComplete="off"
              maxLength={LIMITES.exercicio.nome}
              placeholder="Ex.: Supino reto"
              value={exercicio.nome}
              onChange={(e) => onAlterar({ nome: e.target.value })}
              className={CLASSE_CAMPO}
            />
          )}
        </Campo>
        <Campo rotulo="Grupo muscular" opcional erro={erro("grupoMuscular")}>
          {(props) => (
            <Input
              {...props}
              list={ID_LISTA_GRUPOS}
              autoComplete="off"
              maxLength={LIMITES.exercicio.grupo}
              placeholder="Ex.: Peito"
              value={exercicio.grupoMuscular}
              onChange={(e) => onAlterar({ grupoMuscular: e.target.value })}
              className={CLASSE_CAMPO}
            />
          )}
        </Campo>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CampoNumerico
          rotulo="Séries"
          inteiro
          valor={exercicio.series}
          onChange={(series) => onAlterar({ series })}
          erro={erro("series")}
        />
        <Campo rotulo="Repetições" erro={erro("repeticoes")}>
          {(props) => (
            <Input
              {...props}
              autoComplete="off"
              maxLength={LIMITES.exercicio.repeticoes}
              placeholder="12 ou 8-12"
              value={exercicio.repeticoes}
              onChange={(e) => onAlterar({ repeticoes: e.target.value })}
              className={CLASSE_CAMPO}
            />
          )}
        </Campo>
        <CampoNumerico
          rotulo="Carga"
          unidade="kg"
          opcional
          placeholder="Livre"
          valor={exercicio.carga}
          onChange={(carga) => onAlterar({ carga })}
          erro={erro("cargaKg")}
        />
        <CampoNumerico
          rotulo="Descanso"
          unidade="s"
          inteiro
          valor={exercicio.descanso}
          onChange={(descanso) => onAlterar({ descanso })}
          erro={erro("descansoSeg")}
        />
      </div>

      <Campo rotulo="Orientação ao aluno" opcional erro={erro("observacoes")} className="mt-4">
        {(props) => (
          <Input
            {...props}
            autoComplete="off"
            maxLength={LIMITES.exercicio.observacoes}
            placeholder="Ex.: Descida lenta e controlada"
            value={exercicio.observacoes}
            onChange={(e) => onAlterar({ observacoes: e.target.value })}
            className={CLASSE_CAMPO}
          />
        )}
      </Campo>
    </li>
  );
}
