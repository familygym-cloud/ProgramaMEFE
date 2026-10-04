import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/equipe-demo_/aluno/$alunoId")({
  ssr: false,
  component: () => <p>em construção</p>,
});
