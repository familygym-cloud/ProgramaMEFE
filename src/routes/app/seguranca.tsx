import { createFileRoute } from "@tanstack/react-router";
import { AlterarSenha } from "@/components/app/seguranca/AlterarSenha";
import { ResumoProtecao } from "@/components/app/seguranca/ResumoProtecao";
import { SessoesDoDispositivo } from "@/components/app/seguranca/SessoesDoDispositivo";
import { useDoisFatores } from "@/components/app/seguranca/useDoisFatores";
import { VerificacaoEmDuasEtapas } from "@/components/app/seguranca/VerificacaoEmDuasEtapas";
import { PageHeader } from "@/components/app/ui";
import { useAlunoApp } from "@/lib/aluno-app/store";

export const Route = createFileRoute("/app/seguranca")({
  head: () => ({ meta: [{ title: "Segurança | Academia Family Gym" }] }),
  component: Pagina,
});

function Pagina() {
  const { dados } = useAlunoApp();
  const dois = useDoisFatores(dados.demo);

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="fg-entrada">
        <PageHeader
          eyebrow="Minha conta"
          titulo="Segurança"
          descricao="Proteja o seu acesso à Family Gym: verificação em duas etapas, senha e aparelhos conectados."
        />
      </div>

      <div className="fg-entrada" style={{ animationDelay: "80ms" }}>
        <ResumoProtecao duasEtapas={dois.fatores.length > 0} carregando={dois.carregando} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <div className="fg-entrada" style={{ animationDelay: "140ms" }}>
          <VerificacaoEmDuasEtapas dois={dois} demo={dados.demo} />
        </div>
        <div className="fg-entrada" style={{ animationDelay: "200ms" }}>
          <AlterarSenha demo={dados.demo} />
        </div>
        <div className="fg-entrada lg:col-span-2" style={{ animationDelay: "260ms" }}>
          <SessoesDoDispositivo demo={dados.demo} />
        </div>
      </div>
    </div>
  );
}
