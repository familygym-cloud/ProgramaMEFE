import { useState } from "react";
import { Baby, Dumbbell, Printer, Waves } from "lucide-react";
import { botaoMarca } from "@/components/site/botoes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INFO_SETORES, SETORES_GRADE, type DiaGrade, type SetorGrade } from "@/lib/grade/dados";
import { diaDeHoje } from "@/lib/grade/grade";
import { cn } from "@/lib/utils";
import { EstilosDeImpressao } from "./EstilosDeImpressao";
import { PainelSetor, type VisaoGrade } from "./PainelSetor";
import { useAgoraGrade } from "./useAgoraGrade";

const ICONES: Record<SetorGrade, typeof Dumbbell> = {
  ginastica: Dumbbell,
  aquatica: Waves,
  infantil: Baby,
};

type Props = {
  /** Aba aberta no início. */
  setorInicial?: SetorGrade | undefined;
  /** Chamado quando a pessoa troca de aba (a página pode guardar a escolha no endereço). */
  aoMudarSetor?: ((setor: SetorGrade) => void) | undefined;
  className?: string | undefined;
};

/**
 * Grade de aulas completa da Family Gym (Ginástica, Aquática e Infantil), usada na página pública
 * /grade e na área do aluno /app/grade. Os dados vêm de src/lib/grade.
 */
export function GradeAulas({ setorInicial = "ginastica", aoMudarSetor, className }: Props) {
  const agora = useAgoraGrade();
  const hoje = agora ? diaDeHoje(agora) : null;
  const [setor, setSetor] = useState<SetorGrade>(setorInicial);
  const [diaEscolhido, setDiaEscolhido] = useState<DiaGrade | null>(null);
  const [visao, setVisao] = useState<VisaoGrade>("semana");

  // Abre no dia de hoje em Brasília; aos domingos (sem aulas), na segunda.
  const dia: DiaGrade = diaEscolhido ?? hoje ?? 1;

  function mudarSetor(valor: string) {
    const novo = SETORES_GRADE.find((s) => s === valor);
    if (!novo) return;
    setSetor(novo);
    aoMudarSetor?.(novo);
  }

  return (
    <div data-grade-raiz data-relatorio-raiz className={cn("@container w-full", className)}>
      <EstilosDeImpressao />
      <Tabs value={setor} onValueChange={mudarSetor}>
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <TabsList
            aria-label="Setor da grade"
            className="h-auto min-w-0 flex-1 gap-1 rounded-full border border-border bg-card p-1 @md:flex-none"
          >
            {SETORES_GRADE.map((valor) => {
              const Icone = ICONES[valor];
              return (
                <TabsTrigger
                  key={valor}
                  value={valor}
                  className="min-h-11 flex-1 gap-2 rounded-full px-2 text-sm font-semibold text-muted-foreground data-[state=active]:bg-brand-yellow data-[state=active]:text-brand-black data-[state=active]:shadow-none @md:flex-none @md:px-5"
                >
                  <Icone className="hidden size-4 shrink-0 @md:block" aria-hidden />
                  {INFO_SETORES[valor].rotulo}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Imprimir grade"
            className={botaoMarca("secundario", "md", "size-11 shrink-0 p-0 @md:w-auto @md:px-5")}
          >
            <Printer aria-hidden />
            <span className="hidden @md:inline">Imprimir grade</span>
          </button>
        </div>

        {SETORES_GRADE.map((valor) => (
          <TabsContent key={valor} value={valor} className="mt-6 rounded-2xl">
            <PainelSetor
              setor={valor}
              agora={agora}
              hoje={hoje}
              dia={dia}
              onDia={setDiaEscolhido}
              visao={visao}
              onVisao={setVisao}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
