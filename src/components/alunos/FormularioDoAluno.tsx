import { useEffect, useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  LIMITES_ALUNO,
  PLANOS_OFICIAIS,
  STATUS_DO_ALUNO,
  TURNOS_DO_ALUNO,
  validarAluno,
  type CampoDoAluno,
} from "@/lib/cadastro-alunos";
import { salvarAluno, type AlunoDoCadastro } from "@/lib/cadastro-alunos.functions";
import { hojeBrasilia } from "@/lib/datas";
import { traduzErroServidor } from "@/lib/erros-servidor";

type Valores = Record<CampoDoAluno, string>;

const VAZIO: Valores = {
  nome: "",
  email: "",
  telefone: "",
  plano: "",
  turno: "Manhã",
  status: "Ativo",
  idade: "",
  altura: "",
  peso: "",
  matricula: "",
  objetivo: "",
  observacoes: "",
};

const medida = (n: number, casas = 0) =>
  n > 0 ? n.toLocaleString("pt-BR", { maximumFractionDigits: casas }) : "";

function valoresDe(aluno: AlunoDoCadastro | null, inicial: Partial<Valores> | undefined): Valores {
  if (!aluno) return { ...VAZIO, ...inicial };
  return {
    nome: aluno.nome,
    email: aluno.email ?? "",
    telefone: aluno.telefone ?? "",
    plano: aluno.plano,
    turno: aluno.turno,
    status: aluno.status,
    idade: medida(aluno.idade),
    altura: medida(aluno.altura),
    peso: medida(aluno.peso, 1),
    matricula: aluno.matricula,
    objetivo: aluno.objetivo,
    observacoes: aluno.observacoes,
  };
}

function Campo({
  id,
  rotulo,
  erro,
  dica,
  obrigatorio,
  children,
}: {
  id: string;
  rotulo: string;
  erro: string | undefined;
  dica?: string;
  obrigatorio?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {rotulo}
        {obrigatorio ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {erro ? (
        <p id={`${id}-erro`} role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : dica ? (
        <p className="text-xs text-muted-foreground">{dica}</p>
      ) : null}
    </div>
  );
}

/** Formulário de novo aluno ou de edição da ficha. Valida no navegador com as mesmas regras do servidor. */
export function FormularioDoAluno({
  aberto,
  aoMudarAberto,
  aluno,
  inicial,
  interessadoId,
  aoSalvar,
}: {
  aberto: boolean;
  aoMudarAberto: (aberto: boolean) => void;
  /** Ficha em edição; `null` cadastra um aluno novo. */
  aluno: AlunoDoCadastro | null;
  /** Dados já conhecidos (por exemplo, de um pedido do site) para um aluno novo. */
  inicial?: Partial<Valores> | undefined;
  /** Pedido do site que vira "matriculado" quando o aluno é cadastrado. */
  interessadoId?: string | undefined;
  aoSalvar: () => void;
}) {
  const salvar = useServerFn(salvarAluno);
  const [valores, setValores] = useState<Valores>(() => valoresDe(aluno, inicial));
  const [erros, setErros] = useState<Partial<Record<CampoDoAluno, string>>>({});

  // Cada abertura começa do zero (ou da ficha escolhida).
  useEffect(() => {
    if (aberto) {
      setValores(valoresDe(aluno, inicial));
      setErros({});
    }
  }, [aberto, aluno, inicial]);

  const gravar = useMutation({
    mutationFn: () =>
      salvar({
        data: {
          ...(aluno ? { id: aluno.id } : {}),
          dados: valores,
          ...(interessadoId ? { interessadoId } : {}),
        },
      }),
    onSuccess: (r) => {
      if (!r.ok) {
        setErros(r.erros);
        toast.error("Confira os campos destacados.");
        return;
      }
      toast.success(r.criado ? "Aluno cadastrado." : "Ficha atualizada.");
      aoMudarAberto(false);
      aoSalvar();
    },
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
  });

  const mudar = (campo: CampoDoAluno) => (v: string) => {
    setValores((atual) => ({ ...atual, [campo]: v }));
    setErros((atual) => (atual[campo] ? { ...atual, [campo]: undefined } : atual));
  };
  const campoTexto = (campo: CampoDoAluno) => ({
    id: `aluno-${campo}`,
    value: valores[campo],
    onChange: (e: { target: { value: string } }) => mudar(campo)(e.target.value),
    "aria-invalid": erros[campo] ? true : undefined,
    "aria-describedby": erros[campo] ? `aluno-${campo}-erro` : undefined,
  });

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const r = validarAluno(valores, hojeBrasilia());
    if (!r.ok) {
      setErros(r.erros);
      toast.error("Confira os campos destacados.");
      return;
    }
    gravar.mutate();
  }

  const previa = validarAluno(valores, hojeBrasilia());
  const imc = previa.ok && previa.aluno.imc > 0 ? previa.aluno.imc : null;
  const statusOpcoes = [...STATUS_DO_ALUNO, ...(valores.status === "Risco" ? ["Risco"] : [])];

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{aluno ? "Editar aluno" : "Novo aluno"}</DialogTitle>
          <DialogDescription>
            Só o nome e o plano são obrigatórios. O e-mail faz a conta do aluno se ligar sozinha à
            ficha quando ele criar o acesso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Campo id="aluno-nome" rotulo="Nome completo" erro={erros.nome} obrigatorio>
                <Input
                  {...campoTexto("nome")}
                  maxLength={LIMITES_ALUNO.nome}
                  autoComplete="off"
                  className="min-h-11"
                />
              </Campo>
            </div>
            <Campo id="aluno-email" rotulo="E-mail" erro={erros.email}>
              <Input
                {...campoTexto("email")}
                type="email"
                inputMode="email"
                maxLength={LIMITES_ALUNO.email}
                autoComplete="off"
                className="min-h-11"
              />
            </Campo>
            <Campo
              id="aluno-telefone"
              rotulo="Telefone (WhatsApp)"
              erro={erros.telefone}
              dica="Com DDD."
            >
              <Input
                {...campoTexto("telefone")}
                type="tel"
                inputMode="tel"
                autoComplete="off"
                className="min-h-11"
              />
            </Campo>
            <div className="sm:col-span-2">
              <Campo
                id="aluno-plano"
                rotulo="Plano"
                erro={erros.plano}
                dica="Escolha da lista ou digite outro nome."
                obrigatorio
              >
                <Input
                  {...campoTexto("plano")}
                  list="planos-da-academia"
                  maxLength={LIMITES_ALUNO.plano}
                  autoComplete="off"
                  className="min-h-11"
                />
                <datalist id="planos-da-academia">
                  {PLANOS_OFICIAIS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </Campo>
            </div>
            <Campo id="aluno-turno" rotulo="Turno" erro={erros.turno}>
              <Select value={valores.turno} onValueChange={mudar("turno")}>
                <SelectTrigger id="aluno-turno" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TURNOS_DO_ALUNO.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>
            <Campo id="aluno-status" rotulo="Situação" erro={erros.status}>
              <Select value={valores.status} onValueChange={mudar("status")}>
                <SelectTrigger id="aluno-status" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOpcoes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>
            <Campo
              id="aluno-matricula"
              rotulo="Data da matrícula"
              erro={erros.matricula}
              dica="Em branco: hoje."
            >
              <Input
                {...campoTexto("matricula")}
                type="date"
                max={hojeBrasilia()}
                className="min-h-11"
              />
            </Campo>
            <Campo id="aluno-idade" rotulo="Idade" erro={erros.idade}>
              <Input {...campoTexto("idade")} inputMode="numeric" className="min-h-11" />
            </Campo>
            <Campo
              id="aluno-altura"
              rotulo="Altura (cm)"
              erro={erros.altura}
              dica="Ex.: 170 ou 1,70."
            >
              <Input {...campoTexto("altura")} inputMode="decimal" className="min-h-11" />
            </Campo>
            <Campo
              id="aluno-peso"
              rotulo="Peso (kg)"
              erro={erros.peso}
              dica={
                imc
                  ? `IMC calculado: ${imc.toLocaleString("pt-BR")}.`
                  : "Com altura e peso, o IMC é calculado."
              }
            >
              <Input {...campoTexto("peso")} inputMode="decimal" className="min-h-11" />
            </Campo>
            <div className="sm:col-span-2">
              <Campo id="aluno-objetivo" rotulo="Objetivo" erro={erros.objetivo}>
                <Input
                  {...campoTexto("objetivo")}
                  maxLength={LIMITES_ALUNO.objetivo}
                  className="min-h-11"
                />
              </Campo>
            </div>
            <div className="sm:col-span-2">
              <Campo
                id="aluno-observacoes"
                rotulo="Observações"
                erro={erros.observacoes}
                dica="Só a equipe vê. Lesões, restrições, cuidados."
              >
                <Textarea
                  {...campoTexto("observacoes")}
                  rows={3}
                  maxLength={LIMITES_ALUNO.observacoes}
                />
              </Campo>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => aoMudarAberto(false)}
              className="min-h-11 rounded-full"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={gravar.isPending}
              className="min-h-11 gap-2 rounded-full"
            >
              {gravar.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {aluno ? "Salvar alterações" : "Cadastrar aluno"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
