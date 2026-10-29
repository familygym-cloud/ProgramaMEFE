import { useState } from "react";
import { Dumbbell, Trophy } from "lucide-react";
import { GraficoTendencia } from "@/components/app/charts";
import { EstadoVazio, Eyebrow, ModuloIndisponivel, Selo, Superficie } from "@/components/app/ui";
import { resumirExercicios, type ResumoDoExercicio } from "@/lib/aluno-app/cargas";
import type { AreaAlunoDados } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";

const FORMATO_DATA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function dataCurta(iso: string): string {
  return FORMATO_DATA.format(new Date(`${iso}T12:00:00`)).replace(".", "");
}

const kg = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;

function Variacao({ valor }: { valor: number | null }) {
  if (valor === null) return <Selo>Primeira marca</Selo>;
  if (valor === 0) return <Selo>Igual ao treino anterior</Selo>;
  return (
    <Selo tom={valor > 0 ? "ok" : "neutro"}>
      {valor > 0 ? "+" : ""}
      {valor.toLocaleString("pt-BR")} kg desde o treino anterior
    </Selo>
  );
}

function Cartao({
  resumo,
  aberto,
  aoAlternar,
}: {
  resumo: ResumoDoExercicio;
  aberto: boolean;
  aoAlternar: () => void;
}) {
  const pontos = resumo.registros.map((r) => ({ mes: dataCurta(r.data), carga: r.cargaKg }));
  return (
    <li>
      <Superficie as="article" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-bold leading-tight">{resumo.exercicio}</h3>
            <p className="text-sm text-muted-foreground">
              Último treino em {dataCurta(resumo.ultimo.data)}: {kg(resumo.ultimo.cargaKg)} ×{" "}
              {resumo.ultimo.repeticoes}
            </p>
          </div>
          <Variacao valor={resumo.variacaoKg} />
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Trophy className="size-3.5 text-brand-yellow" aria-hidden /> Recorde
            </dt>
            <dd className="font-display text-2xl font-bold">{kg(resumo.recorde.cargaKg)}</dd>
            <dd className="text-xs text-muted-foreground">
              × {resumo.recorde.repeticoes} em {dataCurta(resumo.recorde.data)}
            </dd>
          </div>
          <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Força estimada (1 repetição)
            </dt>
            <dd className="font-display text-2xl font-bold">{kg(resumo.recordeEstimadoKg)}</dd>
            <dd className="text-xs text-muted-foreground">Calculada pela fórmula de Epley</dd>
          </div>
        </dl>
        {pontos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={aoAlternar}
              aria-expanded={aberto}
              className={cn(
                "min-h-11 rounded-full border border-foreground/15 px-4 text-sm font-medium hover:bg-foreground/5",
              )}
            >
              {aberto ? "Esconder evolução" : "Ver evolução"}
            </button>
            {aberto ? (
              <GraficoTendencia
                dados={pontos}
                chave="carga"
                rotulo="Carga"
                unidade="kg"
                casas={1}
                altura={200}
              />
            ) : null}
          </>
        ) : null}
      </Superficie>
    </li>
  );
}

/** Carga usada em cada exercício, recordes pessoais e evolução. */
export function Cargas({ dados }: { dados: AreaAlunoDados }) {
  const [aberto, setAberto] = useState<string | null>(null);
  if (!dados.modulos.cargas) return <ModuloIndisponivel nome="Cargas e recordes" />;
  const resumos = resumirExercicios(dados.cargas);

  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Suas cargas</Eyebrow>
        <h2 className="mt-2 font-display text-2xl font-bold">Cada quilo a mais conta</h2>
      </div>
      {resumos.length === 0 ? (
        <EstadoVazio
          icone={<Dumbbell />}
          titulo="Nenhuma carga registrada ainda"
          texto="No treino, preencha a carga que você usou em cada exercício e conclua a sessão. Aqui aparecem seus recordes e sua evolução."
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {resumos.map((r) => (
            <Cartao
              key={r.exercicio.toLowerCase()}
              resumo={r}
              aberto={aberto === r.exercicio}
              aoAlternar={() => setAberto((a) => (a === r.exercicio ? null : r.exercicio))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
