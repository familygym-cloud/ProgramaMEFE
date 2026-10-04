import { useMemo } from "react";
import { MessageSquareQuote } from "lucide-react";
import { GraficoLinhas } from "@/components/app/charts";
import { EstadoVazio, Eyebrow, ModuloIndisponivel, Superficie } from "@/components/app/ui";
import type { MedidaCorporal } from "@/lib/aluno-app/types";
import { dataCurta, dataPorExtenso, formatarNumero } from "./avaliacoes";
import { ordenarMedidas, resumirMedidas, serieCircunferencias, type ItemMedida } from "./medidas";
import { Sparkline } from "./Sparkline";
import { Variacao } from "./Variacao";

const COR_CINTURA = "var(--brand-yellow)";
const COR_QUADRIL = "oklch(0.97 0 0)";

function CartaoMedida({ item }: { item: ItemMedida }) {
  return (
    <Superficie as="li" className="flex flex-col p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {item.rotulo}
      </p>
      <p className="mt-3 font-display text-3xl font-bold leading-none tracking-tight">
        {formatarNumero(item.atual)}
        <span className="ml-1 text-sm font-semibold text-muted-foreground">{item.unidade}</span>
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
        <Variacao valor={item.variacao} unidade={item.unidade} melhor={item.melhor} />
        {item.variacao !== null ? <span>desde o início</span> : null}
      </p>
      <div className="mt-auto pt-4">
        <Sparkline valores={item.serie} />
      </div>
    </Superficie>
  );
}

/** Fecha a grade com o contexto das medições: quantas foram e o intervalo coberto. */
function ResumoDasMedicoes({ medidas }: { medidas: MedidaCorporal[] }) {
  const ordenadas = ordenarMedidas(medidas);
  const primeira = ordenadas[0];
  const ultima = ordenadas[ordenadas.length - 1];
  if (!primeira || !ultima) return null;
  return (
    <li className="flex flex-col justify-between gap-3 rounded-3xl border border-dashed border-white/15 p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Acompanhamento
      </p>
      <div>
        <p className="font-display text-3xl font-bold leading-none tracking-tight">
          {ordenadas.length}
          <span className="ml-1.5 text-sm font-semibold text-muted-foreground">
            {ordenadas.length === 1 ? "medição" : "medições"}
          </span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {ordenadas.length === 1
            ? `Registrada em ${dataCurta(ultima.data)}`
            : `De ${dataCurta(primeira.data)} a ${dataCurta(ultima.data)}`}
        </p>
      </div>
    </li>
  );
}

function CinturaXQuadril({ medidas }: { medidas: MedidaCorporal[] }) {
  const serie = useMemo(() => serieCircunferencias(medidas), [medidas]);
  if (serie.length < 2) return null;
  return (
    <Superficie as="section">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">Cintura e quadril</h3>
        <ul className="flex items-center gap-4 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ background: COR_CINTURA }}
            />
            Cintura (cm)
          </li>
          <li className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ background: COR_QUADRIL }}
            />
            Quadril (cm)
          </li>
        </ul>
      </div>
      <GraficoLinhas
        dados={serie}
        eixoX="data"
        series={[
          { chave: "cintura", rotulo: "Cintura (cm)", cor: COR_CINTURA },
          { chave: "quadril", rotulo: "Quadril (cm)", cor: COR_QUADRIL },
        ]}
      />
    </Superficie>
  );
}

export function MedidasCorporais({
  medidas,
  disponivel,
}: {
  medidas: MedidaCorporal[];
  disponivel: boolean;
}) {
  const info = useMemo(() => {
    const ordenadas = ordenarMedidas(medidas);
    return {
      itens: resumirMedidas(medidas),
      ultima: ordenadas[ordenadas.length - 1],
    };
  }, [medidas]);

  const anotacao = info.ultima?.observacoes.trim();

  return (
    <section aria-labelledby="titulo-medidas" className="space-y-5">
      <div className="space-y-2">
        <Eyebrow>Medidas corporais</Eyebrow>
        <h2 id="titulo-medidas" className="font-display text-2xl font-bold sm:text-3xl">
          Como o seu corpo está mudando
        </h2>
        {disponivel && info.ultima ? (
          <p className="text-sm text-muted-foreground">
            Última medição em {dataPorExtenso(info.ultima.data)}. A variação compara com a primeira
            vez em que cada medida foi registrada.
          </p>
        ) : null}
      </div>

      {!disponivel ? (
        <ModuloIndisponivel nome="O acompanhamento de medidas" />
      ) : info.itens.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma medida registrada ainda"
          texto="Na próxima avaliação, seu professor pode registrar gordura corporal, massa magra e circunferências para você acompanhar aqui."
        />
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {info.itens.map((item) => (
              <CartaoMedida key={item.chave} item={item} />
            ))}
            <ResumoDasMedicoes medidas={medidas} />
          </ul>
          <CinturaXQuadril medidas={medidas} />
          {anotacao ? (
            <figure className="flex items-start gap-3 rounded-3xl border border-white/10 p-4 sm:p-5">
              <MessageSquareQuote
                className="mt-0.5 size-5 shrink-0 text-brand-yellow"
                aria-hidden
              />
              <div className="space-y-1">
                <figcaption className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Anotação da última medição
                </figcaption>
                <blockquote className="text-sm leading-relaxed">{anotacao}</blockquote>
              </div>
            </figure>
          ) : null}
        </>
      )}
    </section>
  );
}
