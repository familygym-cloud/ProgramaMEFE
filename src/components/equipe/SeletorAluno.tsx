import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useState } from "react";
import { Selo } from "@/components/app/ui";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AlunoEquipe } from "@/lib/equipe-app";
import { cn } from "@/lib/utils";
import { iniciais, semAcento } from "./formatar";

export function SeloStatus({ status }: { status: string }) {
  const tom = status === "Ativo" ? "ok" : status === "Risco" ? "atencao" : "neutro";
  return <Selo tom={tom}>{status}</Selo>;
}

export function AvatarAluno({ nome, className }: { nome: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-2xl bg-foreground/[0.07] font-display text-sm font-bold tracking-wide text-foreground",
        className,
      )}
    >
      {iniciais(nome)}
    </span>
  );
}

/** Busca por nome ou plano ignorando acentos. `value` é o id; nome e plano entram como palavras-chave. */
function filtrar(_valor: string, busca: string, palavras?: string[]): number {
  const alvo = semAcento((palavras ?? []).join(" "));
  return alvo.includes(semAcento(busca.trim())) ? 1 : 0;
}

export function SeletorAluno({
  alunos,
  valor,
  onChange,
}: {
  alunos: readonly AlunoEquipe[];
  valor: string | null;
  onChange: (alunoId: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const atual = alunos.find((a) => a.id === valor) ?? null;

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Aluno
      </span>
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={atual ? `Aluno selecionado: ${atual.nome}. Trocar aluno` : "Escolher aluno"}
            className="flex min-h-16 w-full items-center gap-4 rounded-2xl border border-foreground/15 bg-foreground/[0.03] px-4 py-2.5 text-left transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/60 data-[state=open]:border-brand-yellow/60"
          >
            {atual ? (
              <>
                <AvatarAluno nome={atual.nome} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg font-semibold leading-tight">
                    {atual.nome}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    Plano {atual.plano} · {atual.status}
                  </span>
                </span>
              </>
            ) : (
              <>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-dashed border-foreground/20 text-muted-foreground">
                  <Search className="size-5" aria-hidden />
                </span>
                <span className="flex-1 text-base text-muted-foreground">
                  Buscar e escolher um aluno
                </span>
              </>
            )}
            <ChevronsUpDown className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) max-w-[36rem] overflow-hidden rounded-2xl border-foreground/15 bg-popover p-0"
        >
          <Command filter={filtrar}>
            <CommandInput placeholder="Buscar pelo nome do aluno" className="h-12 text-base" />
            <CommandList className="max-h-72">
              <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
              {alunos.map((aluno) => (
                <CommandItem
                  key={aluno.id}
                  value={aluno.id}
                  keywords={[aluno.nome, aluno.plano]}
                  onSelect={() => {
                    setAberto(false);
                    onChange(aluno.id);
                  }}
                  className="min-h-12 gap-3 rounded-xl px-3 py-2 data-[selected=true]:bg-foreground/10 data-[selected=true]:text-foreground"
                >
                  <AvatarAluno nome={aluno.nome} className="size-9 rounded-xl text-xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{aluno.nome}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      Plano {aluno.plano} · {aluno.status}
                    </span>
                  </span>
                  {aluno.id === valor ? (
                    <Check className="size-4 text-brand-yellow" aria-hidden />
                  ) : null}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
