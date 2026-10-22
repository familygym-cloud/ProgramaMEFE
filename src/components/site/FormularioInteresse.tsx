import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { enviarInteresse } from "@/lib/interessados.functions";
import { INTERESSES, TIPOS_DE_PEDIDO, validarPedido } from "@/lib/interessados";
import { traduzErroServidor } from "@/lib/erros-servidor";
import { contatoDaAcademia, destinoFaleConosco } from "@/lib/site";
import { botaoMarca } from "./botoes";

type Erros = Record<string, string>;

const CAMPO =
  "min-h-12 w-full rounded-2xl border border-foreground/15 bg-foreground/5 px-4 text-base outline-none focus-visible:border-brand-yellow focus-visible:ring-2 focus-visible:ring-brand-yellow/40";

function Rotulo({
  id,
  children,
  erro,
}: {
  id: string;
  children: string;
  erro?: string | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {children}
      </label>
      {erro ? (
        <p id={`${id}-erro`} role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

/** Formulário de pedido de entrada: quero me matricular, visita ou dúvida. O pedido cai na tela da recepção; ninguém precisa de conta. */
export function FormularioInteresse() {
  const enviar = useServerFn(enviarInteresse);
  const [valores, setValores] = useState({
    nome: "",
    telefone: "",
    email: "",
    tipo: TIPOS_DE_PEDIDO[0].valor as string,
    interesse: "",
    mensagem: "",
    consentimento: false,
    site: "",
  });
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [concluido, setConcluido] = useState<{ duplicado: boolean } | null>(null);

  function mudar<K extends keyof typeof valores>(campo: K, valor: (typeof valores)[K]) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setFalha(null);
    const verificacao = validarPedido(valores);
    if (!verificacao.ok) {
      setErros(verificacao.erros as Erros);
      return;
    }
    setErros({});
    setEnviando(true);
    try {
      const r = await enviar({ data: valores });
      if (!r.ok) setErros(r.erros);
      else setConcluido({ duplicado: r.resultado === "duplicado" });
    } catch (err) {
      setFalha(traduzErroServidor(err instanceof Error ? err : new Error("erro")));
    } finally {
      setEnviando(false);
    }
  }

  if (concluido) {
    const whats = destinoFaleConosco(
      contatoDaAcademia,
      `Olá! Acabei de enviar o formulário no site (${valores.nome}). Podem me ajudar?`,
    );
    return (
      <div
        role="status"
        className="space-y-5 rounded-3xl border border-brand-yellow/40 bg-brand-yellow/10 p-6 sm:p-8"
      >
        <CheckCircle2 aria-hidden className="size-10 text-brand-yellow" />
        <h2 className="font-display text-3xl font-bold">
          {concluido.duplicado ? "Já recebemos o seu pedido" : "Pedido enviado!"}
        </h2>
        <p className="text-foreground/85">
          {concluido.duplicado
            ? "Você já enviou um pedido igual hoje. A recepção da Family Gym vai falar com você em breve."
            : "A recepção da Family Gym vai entrar em contato pelo WhatsApp que você informou."}{" "}
          Se preferir, adiante a conversa agora.
        </p>
        <div className="flex flex-wrap gap-3">
          {whats ? (
            <a
              href={whats}
              target="_blank"
              rel="noopener noreferrer"
              className={botaoMarca("primario", "lg")}
            >
              Falar agora no WhatsApp
              <span className="sr-only"> (abre em outra aba)</span>
            </a>
          ) : null}
          <Link to="/" className={botaoMarca("secundario", "lg")}>
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={aoEnviar} noValidate className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">O que você procura?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {TIPOS_DE_PEDIDO.map((t) => (
            <label
              key={t.valor}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-foreground/15 bg-foreground/5 px-4 has-[:checked]:border-brand-yellow has-[:checked]:bg-brand-yellow/10"
            >
              <input
                type="radio"
                name="tipo"
                value={t.valor}
                checked={valores.tipo === t.valor}
                onChange={() => mudar("tipo", t.valor)}
                className="size-4 accent-[#F9DB5D]"
              />
              <span className="text-sm font-medium">{t.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Rotulo id="f-nome" erro={erros["nome"]}>
            Seu nome
          </Rotulo>
          <Input
            id="f-nome"
            value={valores.nome}
            onChange={(e) => mudar("nome", e.target.value)}
            autoComplete="name"
            maxLength={100}
            aria-invalid={!!erros["nome"]}
            aria-describedby={erros["nome"] ? "f-nome-erro" : undefined}
            className={CAMPO}
          />
        </div>
        <div className="space-y-2">
          <Rotulo id="f-tel" erro={erros["telefone"]}>
            WhatsApp com DDD
          </Rotulo>
          <Input
            id="f-tel"
            type="tel"
            inputMode="tel"
            value={valores.telefone}
            onChange={(e) => mudar("telefone", e.target.value)}
            autoComplete="tel"
            placeholder="(11) 98888-7777"
            aria-invalid={!!erros["telefone"]}
            aria-describedby={erros["telefone"] ? "f-tel-erro" : undefined}
            className={CAMPO}
          />
        </div>
        <div className="space-y-2">
          <Rotulo id="f-email" erro={erros["email"]}>
            E-mail (opcional)
          </Rotulo>
          <Input
            id="f-email"
            type="email"
            value={valores.email}
            onChange={(e) => mudar("email", e.target.value)}
            autoComplete="email"
            maxLength={160}
            aria-invalid={!!erros["email"]}
            aria-describedby={erros["email"] ? "f-email-erro" : undefined}
            className={CAMPO}
          />
        </div>
        <div className="space-y-2">
          <Rotulo id="f-interesse" erro={erros["interesse"]}>
            Qual o seu interesse?
          </Rotulo>
          <select
            id="f-interesse"
            value={valores.interesse}
            onChange={(e) => mudar("interesse", e.target.value)}
            aria-invalid={!!erros["interesse"]}
            aria-describedby={erros["interesse"] ? "f-interesse-erro" : undefined}
            className={`${CAMPO} appearance-none`}
          >
            <option value="">Escolha uma opção</option>
            {INTERESSES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Rotulo id="f-msg" erro={erros["mensagem"]}>
          Quer contar mais? (opcional)
        </Rotulo>
        <Textarea
          id="f-msg"
          value={valores.mensagem}
          onChange={(e) => mudar("mensagem", e.target.value)}
          rows={4}
          maxLength={500}
          className="min-h-28 w-full rounded-2xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-base"
        />
      </div>

      {/* Campo-isca: invisível para pessoas, tentador para robôs. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Não preencha este campo
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={valores.site}
            onChange={(e) => mudar("site", e.target.value)}
          />
        </label>
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={valores.consentimento}
            onChange={(e) => mudar("consentimento", e.target.checked)}
            aria-invalid={!!erros["consentimento"]}
            aria-describedby={erros["consentimento"] ? "f-consent-erro" : undefined}
            className="mt-1 size-5 shrink-0 accent-[#F9DB5D]"
          />
          <span>
            Concordo que a Academia Family Gym entre em contato comigo pelos dados informados,
            conforme a{" "}
            <Link to="/privacidade" className="font-medium underline underline-offset-2">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>
        {erros["consentimento"] ? (
          <p id="f-consent-erro" role="alert" className="text-sm text-destructive">
            {erros["consentimento"]}
          </p>
        ) : null}
      </div>

      {falha ? (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
        >
          {falha}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className={botaoMarca("primario", "lg", "w-full sm:w-auto disabled:opacity-60")}
      >
        {enviando ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        {enviando ? "Enviando…" : "Enviar pedido"}
      </button>
    </form>
  );
}
