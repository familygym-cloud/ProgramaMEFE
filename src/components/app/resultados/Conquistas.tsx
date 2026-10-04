import { useMemo } from "react";
import { Check, Lock } from "lucide-react";
import { BarraProgresso, Eyebrow, Selo, Superficie } from "@/components/app/ui";
import { conquistas, nivelAluno, type Conquista } from "@/lib/aluno-app/derive";
import type { AreaAlunoDados } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";
import { IconeConquista } from "./IconeConquista";

export function Conquistas({ dados }: { dados: AreaAlunoDados }) {
  const info = useMemo(() => {
    const todas = conquistas(dados);
    const total = new Set(dados.checkIns.map((c) => c.data)).size;
    // Desbloqueadas primeiro; as bloqueadas ficam da mais próxima de ser conquistada para a mais distante.
    const ordenadas = [
      ...todas.filter((c) => c.desbloqueada),
      ...todas.filter((c) => !c.desbloqueada).sort((a, b) => b.progresso - a.progresso),
    ];
    return {
      ordenadas,
      desbloqueadas: todas.filter((c) => c.desbloqueada).length,
      total: todas.length,
      treinos: total,
      nivel: nivelAluno(total),
    };
  }, [dados]);

  const { nivel } = info;
  const ultimoNivel = info.treinos >= nivel.proximo;
  const faltam = Math.max(0, nivel.proximo - info.treinos);
  const proximoTitulo = ultimoNivel ? null : nivelAluno(nivel.proximo).titulo;

  return (
    <div className="space-y-4 lg:space-y-5">
      <Superficie brilho className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8">
        <div className="flex items-center gap-4">
          <span className="grid size-20 shrink-0 place-items-center rounded-3xl bg-brand-yellow font-display text-5xl font-bold leading-none text-brand-black">
            {nivel.nivel}
          </span>
          <div>
            <Eyebrow>Seu nível</Eyebrow>
            <p className="mt-1 font-display text-2xl font-bold leading-tight">{nivel.titulo}</p>
          </div>
        </div>
        <div className="space-y-3">
          <BarraProgresso
            valor={nivel.pct}
            rotulo={`Progresso até o próximo nível: ${nivel.pct}%`}
          />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              {proximoTitulo
                ? `${faltam} ${faltam === 1 ? "treino" : "treinos"} para ${proximoTitulo}`
                : "Você chegou ao topo. Orgulho da família!"}
            </span>
            <span>
              <strong className="font-semibold text-foreground">{info.desbloqueadas}</strong> de{" "}
              {info.total} conquistas
            </span>
          </div>
        </div>
      </Superficie>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {info.ordenadas.map((c) => (
          <CartaoConquista key={c.id} conquista={c} />
        ))}
      </ul>
    </div>
  );
}

function CartaoConquista({ conquista: c }: { conquista: Conquista }) {
  return (
    <Superficie
      as="li"
      className={cn(
        "flex flex-col gap-4 p-5",
        c.desbloqueada && "border-brand-yellow/40 bg-brand-yellow/10",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-2xl [&_svg]:size-6",
            c.desbloqueada
              ? "bg-brand-yellow text-brand-black"
              : "bg-foreground/5 text-muted-foreground",
          )}
        >
          <IconeConquista id={c.id} />
        </span>
        {c.desbloqueada ? (
          <Selo>
            <Check className="size-3" strokeWidth={3} aria-hidden />
            Conquistada
          </Selo>
        ) : (
          <Selo>
            <Lock className="size-3" aria-hidden />
            Bloqueada
          </Selo>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-lg font-semibold leading-tight">{c.titulo}</h3>
        <p className="text-sm text-muted-foreground">{c.descricao}</p>
      </div>
      {c.desbloqueada ? null : (
        <div className="mt-auto space-y-1.5">
          <BarraProgresso
            valor={c.progresso}
            rotulo={`Progresso em ${c.titulo}`}
            className="h-1.5"
          />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{c.progresso}%</span> do
            caminho
          </p>
        </div>
      )}
    </Superficie>
  );
}
