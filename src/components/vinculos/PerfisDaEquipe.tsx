import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { traduzErroServidor } from "@/lib/erros-servidor";
import { PAPEIS_DA_EQUIPE, ROTULO_PAPEL, type PapelEquipe } from "@/lib/papeis";
import { definirPapelDaEquipe } from "@/lib/vinculos.functions";
import type { ContaUsuario } from "@/lib/vinculos";

const SEM_PERFIL = "__nenhum__";

const DESCRICAO: Record<PapelEquipe, string> = {
  staff: "Acesso total, inclusive relatórios e perfis da equipe.",
  recepcao:
    "Cadastro, vínculos, termos, financeiro, valores dos planos e aulas. Não vê avaliações físicas nem treinos.",
  professor: "Treinos, avaliações físicas e aulas. Não vê financeiro nem valores dos planos.",
};

/**
 * Quem da equipe usa o quê. Só a gestão enxerga esta seção. A pessoa precisa ter criado a conta e
 * confirmado o e-mail antes; o perfil só vale em sessão com verificação em duas etapas.
 */
export function PerfisDaEquipe({
  contas,
  perfis,
}: {
  contas: ContaUsuario[];
  perfis: Record<string, PapelEquipe>;
}) {
  const queryClient = useQueryClient();
  const salvar = useServerFn(definirPapelDaEquipe);

  const mutation = useMutation({
    mutationFn: (vars: { userId: string; papel: PapelEquipe | null }) => salvar({ data: vars }),
    onSuccess: (_r, vars) =>
      toast.success(
        vars.papel ? `Perfil definido: ${ROTULO_PAPEL[vars.papel]}.` : "Perfil retirado.",
      ),
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["vinculos"] }),
  });

  const elegiveis = contas
    .filter((c) => c.emailConfirmado || perfis[c.id])
    .sort(
      (a, b) =>
        Number(Boolean(perfis[b.id])) - Number(Boolean(perfis[a.id])) ||
        a.email.localeCompare(b.email),
    );

  return (
    <section
      aria-labelledby="titulo-perfis"
      className="space-y-4 rounded-3xl border border-foreground/10 p-5 sm:p-6"
    >
      <header className="space-y-1">
        <h2 id="titulo-perfis" className="font-display text-lg uppercase tracking-wide">
          Perfis da equipe
        </h2>
        <p className="text-sm text-muted-foreground">
          Defina o que cada pessoa da equipe pode usar. Quem ainda não tem perfil entra apenas como
          aluno.
        </p>
      </header>

      <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
        {PAPEIS_DA_EQUIPE.map((p) => (
          <li key={p} className="rounded-2xl bg-foreground/5 p-3">
            <strong className="block text-foreground">{ROTULO_PAPEL[p]}</strong>
            {DESCRICAO[p]}
          </li>
        ))}
      </ul>

      <ul className="divide-y divide-foreground/10">
        {elegiveis.map((conta) => {
          const atual = perfis[conta.id];
          return (
            <li key={conta.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="min-w-0 break-all text-sm">{conta.email}</span>
              <span className="flex items-center gap-2">
                {atual ? <Badge variant="outline">{ROTULO_PAPEL[atual]}</Badge> : null}
                <Select
                  value={atual ?? SEM_PERFIL}
                  disabled={mutation.isPending}
                  onValueChange={(v) =>
                    mutation.mutate({
                      userId: conta.id,
                      papel: v === SEM_PERFIL ? null : (v as PapelEquipe),
                    })
                  }
                >
                  <SelectTrigger className="min-h-11 w-44" aria-label={`Perfil de ${conta.email}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_PERFIL}>Sem perfil de equipe</SelectItem>
                    {PAPEIS_DA_EQUIPE.map((p) => (
                      <SelectItem key={p} value={p}>
                        {ROTULO_PAPEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
