import { createFileRoute } from "@tanstack/react-router";
import { DadosCadastro } from "@/components/app/perfil/DadosCadastro";
import { FormularioContato } from "@/components/app/perfil/FormularioContato";
import { IdentidadeAluno } from "@/components/app/perfil/IdentidadeAluno";
import { PrivacidadeDados } from "@/components/app/perfil/PrivacidadeDados";
import { PageHeader } from "@/components/app/ui";
import { useAlunoApp } from "@/lib/aluno-app/store";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "Informações pessoais | Academia Family Gym" }] }),
  component: Pagina,
});

function Pagina() {
  const { dados } = useAlunoApp();

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="fg-entrada">
        <PageHeader
          eyebrow="Minha conta"
          titulo="Informações pessoais"
          descricao="Confira os dados do seu cadastro e mantenha o seu contato sempre atualizado."
        />
      </div>

      <div className="fg-entrada" style={{ animationDelay: "80ms" }}>
        <IdentidadeAluno perfil={dados.perfil} />
      </div>

      <div
        className="fg-entrada grid gap-4 lg:grid-cols-5 lg:items-stretch lg:gap-5"
        style={{ animationDelay: "140ms" }}
      >
        <div className="lg:col-span-3">
          <DadosCadastro perfil={dados.perfil} />
        </div>
        <div className="lg:col-span-2">
          <FormularioContato />
        </div>
      </div>

      <div className="fg-entrada" style={{ animationDelay: "200ms" }}>
        <PrivacidadeDados />
      </div>
    </div>
  );
}
