import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Copy, KeyRound, Link2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DESCRICAO_ESCOPO, ESCOPOS, type Escopo } from "@/lib/api/chaves";
import { traduzErroServidor } from "@/lib/erros-servidor";
import {
  carregarIntegracoes,
  criarChaveDeApi,
  removerVinculoExterno,
  revogarChaveDeApi,
  salvarVinculoExterno,
} from "@/lib/integracoes.functions";

export const Route = createFileRoute("/_authenticated/integracoes")({
  head: () => ({ meta: [{ title: "Integrações | Academia Family Gym" }] }),
  component: Integracoes,
});

const QUANDO = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const quando = (iso: string | null) => (iso ? QUANDO.format(new Date(iso)) : "nunca");

function Secao({
  titulo,
  texto,
  children,
}: {
  titulo: string;
  texto: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-3xl border border-foreground/10 p-5 sm:p-6">
      <header className="space-y-1">
        <h2 className="font-display text-lg uppercase tracking-wide">{titulo}</h2>
        <p className="text-sm text-muted-foreground">{texto}</p>
      </header>
      {children}
    </section>
  );
}

function ChavesDeApi({
  chaves,
}: {
  chaves: Awaited<ReturnType<typeof carregarIntegracoes>>["chaves"];
}) {
  const queryClient = useQueryClient();
  const criar = useServerFn(criarChaveDeApi);
  const revogar = useServerFn(revogarChaveDeApi);
  const [nome, setNome] = useState("");
  const [escopos, setEscopos] = useState<Escopo[]>(["acessos:escrever", "acessos:ler"]);
  const [novaChave, setNovaChave] = useState<string | null>(null);
  const [copiada, setCopiada] = useState(false);

  const sincronizar = () => queryClient.invalidateQueries({ queryKey: ["integracoes"] });

  const criando = useMutation({
    mutationFn: () => criar({ data: { nome, escopos } }),
    onSuccess: (r) => {
      setNovaChave(r.chave);
      setNome("");
      toast.success("Chave criada. Copie agora: ela não aparece de novo.");
    },
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
    onSettled: sincronizar,
  });
  const revogando = useMutation({
    mutationFn: (id: string) => revogar({ data: { id } }),
    onSuccess: () => toast.success("Chave revogada. Ela deixa de funcionar agora."),
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
    onSettled: sincronizar,
  });

  function alternar(escopo: Escopo, marcado: boolean) {
    setEscopos((atual) => (marcado ? [...atual, escopo] : atual.filter((e) => e !== escopo)));
  }

  async function copiar() {
    if (!novaChave) return;
    try {
      await navigator.clipboard.writeText(novaChave);
      setCopiada(true);
      window.setTimeout(() => setCopiada(false), 3000);
    } catch {
      toast.error("Não foi possível copiar. Selecione a chave e copie manualmente.");
    }
  }

  return (
    <Secao
      titulo="Chaves de API"
      texto="Cada sistema (catraca, Tecnofit, outro) usa a sua chave, com só as permissões de que precisa. Revogue a chave de quem não deve mais acessar."
    >
      {novaChave ? (
        <div
          role="status"
          className="space-y-3 rounded-2xl border border-brand-yellow/40 bg-brand-yellow/10 p-4"
        >
          <p className="text-sm font-semibold">
            Copie esta chave agora e guarde em local seguro. Por segurança, ela não será mostrada de
            novo.
          </p>
          <code className="block break-all rounded-xl bg-foreground/10 p-3 font-mono text-xs">
            {novaChave}
          </code>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={copiar} className="min-h-11 gap-2 rounded-full">
              {copiada ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
              {copiada ? "Copiada" : "Copiar chave"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNovaChave(null)}
              className="min-h-11 rounded-full"
            >
              Já guardei
            </Button>
          </div>
        </div>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          criando.mutate();
        }}
      >
        <div className="space-y-1.5">
          <label htmlFor="nome-chave" className="text-sm font-medium">
            Nome da integração
          </label>
          <Input
            id="nome-chave"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Catraca da entrada"
            maxLength={80}
            className="min-h-11"
          />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Permissões</legend>
          {ESCOPOS.map((escopo) => (
            <label key={escopo} className="flex min-h-11 items-center gap-3 text-sm">
              <Checkbox
                checked={escopos.includes(escopo)}
                onCheckedChange={(v) => alternar(escopo, v === true)}
              />
              <span>
                {DESCRICAO_ESCOPO[escopo]}{" "}
                <code className="text-xs text-muted-foreground">{escopo}</code>
              </span>
            </label>
          ))}
        </fieldset>
        <Button
          type="submit"
          disabled={criando.isPending || nome.trim().length < 2 || escopos.length === 0}
          className="min-h-11 gap-2 rounded-full"
        >
          {criando.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <KeyRound className="size-4" aria-hidden />
          )}
          Criar chave
        </Button>
      </form>

      <ul className="divide-y divide-foreground/10">
        {chaves.length === 0 ? (
          <li className="py-3 text-sm text-muted-foreground">Nenhuma chave criada.</li>
        ) : null}
        {chaves.map((c) => (
          <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div className="min-w-0 space-y-1">
              <p className="font-medium">
                {c.nome} {c.ativa ? null : <Badge variant="outline">Revogada</Badge>}
              </p>
              <p className="text-xs text-muted-foreground">
                fgk_{c.prefixo}_… · criada em {quando(c.criadaEm)} · último uso:{" "}
                {quando(c.ultimoUsoEm)}
              </p>
              <p className="text-xs text-muted-foreground">{c.escopos.join(", ")}</p>
            </div>
            {c.ativa ? (
              <Button
                type="button"
                variant="outline"
                disabled={revogando.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      `Revogar a chave "${c.nome}"? O sistema que a usa deixa de funcionar.`,
                    )
                  ) {
                    revogando.mutate(c.id);
                  }
                }}
                className="min-h-11 gap-2 rounded-full"
              >
                <Trash2 className="size-4" aria-hidden /> Revogar
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </Secao>
  );
}

function VinculosExternos({
  vinculos,
  alunos,
}: {
  vinculos: Awaited<ReturnType<typeof carregarIntegracoes>>["vinculos"];
  alunos: Awaited<ReturnType<typeof carregarIntegracoes>>["alunos"];
}) {
  const queryClient = useQueryClient();
  const salvar = useServerFn(salvarVinculoExterno);
  const remover = useServerFn(removerVinculoExterno);
  const [alunoId, setAlunoId] = useState("");
  const [provedor, setProvedor] = useState("tecnofit");
  const [idExterno, setIdExterno] = useState("");
  const sincronizar = () => queryClient.invalidateQueries({ queryKey: ["integracoes"] });

  const salvando = useMutation({
    mutationFn: () => salvar({ data: { alunoId, provedor, idExterno } }),
    onSuccess: () => {
      toast.success("Código vinculado ao aluno.");
      setIdExterno("");
    },
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
    onSettled: sincronizar,
  });
  const removendo = useMutation({
    mutationFn: (id: string) => remover({ data: { id } }),
    onSuccess: () => toast.success("Vínculo removido."),
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
    onSettled: sincronizar,
  });

  return (
    <Secao
      titulo="Códigos em outros sistemas"
      texto="Ligue cada aluno ao código dele na Tecnofit (ou outro sistema). É com esse código que a catraca diz quem entrou."
    >
      <form
        className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          salvando.mutate();
        }}
      >
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="vinculo-aluno">
            Aluno
          </label>
          <Select value={alunoId} onValueChange={setAlunoId}>
            <SelectTrigger id="vinculo-aluno" className="min-h-11 w-full">
              <SelectValue placeholder="Escolha o aluno" />
            </SelectTrigger>
            <SelectContent>
              {alunos.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="vinculo-provedor">
            Sistema
          </label>
          <Input
            id="vinculo-provedor"
            value={provedor}
            onChange={(e) => setProvedor(e.target.value.toLowerCase())}
            className="min-h-11"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="vinculo-codigo">
            Código do aluno
          </label>
          <Input
            id="vinculo-codigo"
            value={idExterno}
            onChange={(e) => setIdExterno(e.target.value)}
            maxLength={80}
            className="min-h-11"
          />
        </div>
        <Button
          type="submit"
          disabled={salvando.isPending || !alunoId || !idExterno.trim() || !provedor.trim()}
          className="min-h-11 gap-2 rounded-full"
        >
          <Link2 className="size-4" aria-hidden /> Vincular
        </Button>
      </form>

      <ul className="divide-y divide-foreground/10">
        {vinculos.length === 0 ? (
          <li className="py-3 text-sm text-muted-foreground">Nenhum vínculo ainda.</li>
        ) : null}
        {vinculos.map((v) => (
          <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <span>
              <strong>{v.alunoNome}</strong> · {v.provedor}: <code>{v.idExterno}</code>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={removendo.isPending}
              onClick={() => removendo.mutate(v.id)}
              className="min-h-11 gap-2 rounded-full"
              aria-label={`Remover o vínculo de ${v.alunoNome}`}
            >
              <Trash2 className="size-4" aria-hidden /> Remover
            </Button>
          </li>
        ))}
      </ul>
    </Secao>
  );
}

function Integracoes() {
  const buscar = useServerFn(carregarIntegracoes);
  const { data, isLoading, error } = useQuery({
    queryKey: ["integracoes"],
    queryFn: () => buscar(),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-brand-yellow/20 bg-brand-black px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10" />
            <div>
              <h1 className="text-base font-bold uppercase tracking-widest text-brand-onblack">
                Integrações
              </h1>
              <p className="text-xs text-brand-onblack/60">
                Catraca, Tecnofit e outros sistemas, por API
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2 rounded-full border-brand-yellow/40 bg-transparent text-xs uppercase tracking-widest text-brand-onblack hover:bg-brand-yellow hover:text-brand-black"
          >
            <Link to="/dashboard">
              <ArrowLeft className="size-3.5" /> Painel
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8">
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando…
          </p>
        ) : error || !data ? (
          <p
            role="alert"
            className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
          >
            {traduzErroServidor(error instanceof Error ? error : new Error("erro"))}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Guia para quem vai configurar o outro sistema: <code>docs/api-integracao.md</code> (no
              repositório) e a descrição da API em{" "}
              <a className="underline" href="/api/v1/openapi.json">
                /api/v1/openapi.json
              </a>
              .
            </p>
            {data.souGestao ? <ChavesDeApi chaves={data.chaves} /> : null}
            <VinculosExternos vinculos={data.vinculos} alunos={data.alunos} />
            {data.souGestao ? (
              <Secao
                titulo="Últimas chamadas"
                texto="As 50 chamadas mais recentes que gravaram dados ou falharam (leituras bem-sucedidas não entram)."
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">Quando</th>
                        <th className="py-2 pr-3 font-medium">Integração</th>
                        <th className="py-2 pr-3 font-medium">Rota</th>
                        <th className="py-2 pr-3 font-medium">Resultado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/10">
                      {data.chamadas.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-3 text-muted-foreground">
                            Nenhuma chamada registrada.
                          </td>
                        </tr>
                      ) : null}
                      {data.chamadas.map((c) => (
                        <tr key={c.id}>
                          <td className="py-2 pr-3 whitespace-nowrap">{quando(c.criadaEm)}</td>
                          <td className="py-2 pr-3">{c.chaveNome ?? "—"}</td>
                          <td className="py-2 pr-3 font-mono text-xs">{c.rota}</td>
                          <td className="py-2 pr-3">
                            {c.status < 400 ? "OK" : "Falhou"} ({c.status})
                            {c.detalhe ? ` · ${c.detalhe}` : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Secao>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
