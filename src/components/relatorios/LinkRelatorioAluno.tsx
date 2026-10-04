import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ModoRelatorio } from "@/lib/relatorios/abas";
import { cn } from "@/lib/utils";

const CLASSE =
  "h-11 shrink-0 gap-2 rounded-full border-brand-yellow/50 bg-transparent px-4 text-sm text-brand-yellow hover:bg-brand-yellow hover:text-brand-black sm:h-9 print:hidden";

/**
 * Leva ao relatório individual do aluno: na versão real, a página da equipe; na demonstração, a
 * página pública com os mesmos dados fictícios da Central.
 */
export function LinkRelatorioAluno({
  alunoId,
  nome,
  modo,
  rotulo = "Relatório",
  className,
}: {
  alunoId: string;
  /** Nome do aluno: completa o rótulo para leitores de tela ("Relatório de Ana Lima"). */
  nome: string;
  modo: ModoRelatorio;
  /** Texto visível; o nome do aluno é acrescentado só para leitores de tela. */
  rotulo?: string;
  className?: string;
}) {
  const conteudo = (
    <>
      <FileText aria-hidden />
      {rotulo}
      <span className="sr-only"> do aluno {nome}</span>
    </>
  );
  return (
    <Button asChild variant="outline" className={cn(CLASSE, className)}>
      {modo === "demo" ? (
        <Link to="/equipe-demo/aluno/$alunoId" params={{ alunoId }}>
          {conteudo}
        </Link>
      ) : (
        <Link to="/relatorio-aluno/$alunoId" params={{ alunoId }}>
          {conteudo}
        </Link>
      )}
    </Button>
  );
}
