import {
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { CircleCheck, Loader2, Mail, Phone, Undo2 } from "lucide-react";
import { Superficie } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlunoApp } from "@/lib/aluno-app/store";
import { cn } from "@/lib/utils";
import {
  EMAIL_MAX,
  TELEFONE_MAX,
  contatoIgual,
  validarContato,
  type CampoContato,
  type Contato,
  type ErrosContato,
} from "./contato";

function Campo({
  id,
  rotulo,
  icone,
  ajuda,
  erro,
  ...entrada
}: {
  id: string;
  rotulo: string;
  icone: ReactNode;
  ajuda: string;
  erro: string | undefined;
} & Omit<ComponentProps<"input">, "id">) {
  const idAjuda = `${id}-ajuda`;
  const idErro = `${id}-erro`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs uppercase tracking-widest text-muted-foreground">
        {rotulo}
      </Label>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-[1.15rem]"
        >
          {icone}
        </span>
        <Input
          id={id}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${idAjuda} ${idErro}` : idAjuda}
          className={cn(
            "h-12 rounded-2xl bg-foreground/[0.03] pl-11 pr-4 text-base md:text-base",
            erro && "border-destructive/70",
          )}
          {...entrada}
        />
      </div>
      <p id={idAjuda} className="text-xs text-muted-foreground">
        {ajuda}
      </p>
      {erro ? (
        <p id={idErro} role="alert" className="text-sm font-medium text-destructive">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

/** Contato que o aluno pode editar sozinho: telefone e e-mail. */
export function FormularioContato() {
  const { dados, acoes } = useAlunoApp();
  const { telefone: telefonePerfil, email: emailPerfil } = dados.perfil;

  const doPerfil = useMemo<Contato>(
    () => ({ telefone: telefonePerfil ?? "", email: emailPerfil ?? "" }),
    [telefonePerfil, emailPerfil],
  );
  // Logo após salvar, o cadastro ainda pode estar sendo recarregado: usamos o que foi salvo até o
  // perfil mudar (nova identidade de `doPerfil`), para o botão não reabrir sem motivo.
  const [salvo, setSalvo] = useState<{ valores: Contato; deOnde: Contato } | null>(null);
  const base = salvo && salvo.deOnde === doPerfil ? salvo.valores : doPerfil;

  const [valores, setValores] = useState<Contato>(doPerfil);
  const [tocados, setTocados] = useState<Partial<Record<CampoContato, boolean>>>({});
  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const telefoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const validacao = validarContato(valores);
  const erros: ErrosContato = validacao.ok ? {} : validacao.erros;
  const alterado = !contatoIgual(valores, base);

  const alterar = (campo: CampoContato, valor: string) => {
    setValores((atual) => ({ ...atual, [campo]: valor }));
    setConfirmado(false);
  };
  const marcar = (campo: CampoContato) => setTocados((atual) => ({ ...atual, [campo]: true }));

  const desfazer = () => {
    setValores(base);
    setTocados({});
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setTocados({ telefone: true, email: true });
    if (!validacao.ok) {
      (validacao.erros.telefone ? telefoneRef : emailRef).current?.focus();
      return;
    }
    setEnviando(true);
    setConfirmado(false);
    try {
      await acoes.atualizarContato(validacao.dados);
      setSalvo({ valores: validacao.dados, deOnde: doPerfil });
      setValores(validacao.dados);
      setConfirmado(true);
    } catch {
      // O aviso de erro já foi exibido pelo store; o formulário segue editável para nova tentativa.
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Superficie as="section" className="flex h-full flex-col gap-6">
      <div className="space-y-1.5">
        <h2 className="font-display text-xl font-semibold">Contato</h2>
        <p className="text-sm text-muted-foreground">
          É por aqui que a equipe fala com você. Esta é a parte do cadastro que você mesmo(a) pode
          atualizar.
        </p>
      </div>

      <form onSubmit={enviar} noValidate className="flex flex-1 flex-col gap-5">
        <Campo
          id="contato-telefone"
          rotulo="Telefone"
          icone={<Phone />}
          ajuda="Com DDD. Deixe em branco para remover."
          erro={tocados.telefone ? erros.telefone : undefined}
          ref={telefoneRef}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(00) 90000-0000"
          maxLength={TELEFONE_MAX}
          value={valores.telefone}
          onChange={(e) => alterar("telefone", e.target.value)}
          onBlur={() => marcar("telefone")}
        />
        <Campo
          id="contato-email"
          rotulo="E-mail"
          icone={<Mail />}
          ajuda="Deixe em branco para remover."
          erro={tocados.email ? erros.email : undefined}
          ref={emailRef}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="nome@email.com"
          maxLength={EMAIL_MAX}
          value={valores.email}
          onChange={(e) => alterar("email", e.target.value)}
          onBlur={() => marcar("email")}
        />

        <div className="mt-auto space-y-3 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={!alterado || enviando}
              className="h-12 rounded-full px-7 text-base font-semibold"
            >
              {enviando ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {enviando ? "Salvando..." : "Salvar contato"}
            </Button>
            {alterado && !enviando ? (
              <Button
                type="button"
                variant="ghost"
                onClick={desfazer}
                className="h-12 rounded-full px-5 text-base"
              >
                <Undo2 aria-hidden /> Desfazer
              </Button>
            ) : null}
          </div>
          <p
            role="status"
            className={cn(
              "flex min-h-5 items-center gap-1.5 text-sm",
              confirmado && !alterado ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {confirmado && !alterado ? (
              <>
                <CircleCheck className="size-4 shrink-0" aria-hidden /> Contato atualizado.
              </>
            ) : alterado ? (
              "Você tem alterações ainda não salvas."
            ) : (
              "Sem alterações para salvar."
            )}
          </p>
        </div>
      </form>
    </Superficie>
  );
}
