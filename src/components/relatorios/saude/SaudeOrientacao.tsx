import { HeartHandshake } from "lucide-react";
import { SecaoRelatorio } from "@/components/relatorios/blocos";

const ORIENTACOES = [
  {
    titulo: "O IMC é triagem",
    texto:
      "Relaciona peso e altura, mas não separa músculo de gordura: um aluno forte pode ter IMC alto sem excesso de gordura. Ele aponta onde olhar com mais cuidado e não substitui a avaliação de um profissional de saúde.",
  },
  {
    titulo: "Faixas de adultos",
    texto:
      "As faixas seguem a classificação da OMS para adultos. Crianças e adolescentes têm curvas próprias, por idade, e aqui entram nas mesmas faixas: leia esses casos com cautela.",
  },
  {
    titulo: "Dado sensível",
    texto:
      "Peso e saúde são dados pessoais sensíveis. Use os números para planejar o trabalho com a turma, nunca para expor ou rotular um aluno, e compartilhe este relatório só com quem precisa dele.",
  },
] as const;

export function SaudeOrientacao({ className }: { className?: string | undefined }) {
  return (
    <SecaoRelatorio
      titulo="Como ler estes números"
      className={className}
      descricao="Orientação para a equipe usar o IMC com responsabilidade."
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="hidden size-11 shrink-0 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow sm:grid [&_svg]:size-6"
        >
          <HeartHandshake />
        </span>
        <ul className="grid min-w-0 flex-1 gap-5 md:grid-cols-3">
          {ORIENTACOES.map((o) => (
            <li key={o.titulo} className="min-w-0">
              <h3 className="text-sm font-semibold">{o.titulo}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{o.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </SecaoRelatorio>
  );
}
