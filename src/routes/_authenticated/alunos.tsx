import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, FileUp, Loader2, MessageCircle, Pencil, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Selo } from "@/components/app/ui";
import { FormularioDoAluno } from "@/components/alunos/FormularioDoAluno";
import { ImportarAlunos } from "@/components/alunos/ImportarAlunos";
import { BrandLogo } from "@/components/BrandLogo";
import { TabelaRelatorio } from "@/components/relatorios/blocos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { chaveDeComparacao } from "@/lib/cadastro-alunos";
import {
  alterarStatusDoAluno,
  listarCadastroDeAlunos,
  type AlunoDoCadastro,
} from "@/lib/cadastro-alunos.functions";
import { traduzErroServidor } from "@/lib/erros-servidor";
import { formatarData, formatarTelefone } from "@/lib/relatorios/formatar";
import { linkWhatsapp, normalizarTelefoneBR } from "@/lib/site";
import { cn } from "@/lib/utils";

type Busca = {
  novo?: true | undefined;
  nome?: string | undefined;
  email?: string | undefined;
  telefone?: string | undefined;
  interesse?: string | undefined;
  interessado?: string | undefined;
};

const texto = (v: unknown, max = 160): string | undefined =>
  typeof v === "string" && v.trim() !== "" ? v.trim().slice(0, max) : undefined;

export const Route = createFileRoute("/_authenticated/alunos")({
  // Quando vem de um pedido do site, a tela já abre o formulário com os dados da pessoa.
  validateSearch: (busca: Record<string, unknown>): Busca => ({
    novo: busca["novo"] === true || busca["novo"] === "1" || busca["novo"] === 1 ? true : undefined,
    nome: texto(busca["nome"], 100),
    email: texto(busca["email"]),
    telefone: texto(busca["telefone"], 30),
    interesse: texto(busca["interesse"], 80),
    interessado: texto(busca["interessado"], 36),
  }),
  head: () => ({
    meta: [{ title: "Alunos | Academia Family Gym" }, { name: "robots", content: "noindex" }],
  }),
  component: Alunos,
});

const FILTROS = [
  { id: "todos", rotulo: "Todos" },
  { id: "Ativo", rotulo: "Ativos" },
  { id: "Pendente", rotulo: "Pendentes" },
  { id: "Inativo", rotulo: "Inativos" },
  { id: "sem-conta", rotulo: "Sem conta de acesso" },
] as const;
type Filtro = (typeof FILTROS)[number]["id"];

const TOM_DO_STATUS = {
  Ativo: "ok",
  Risco: "atencao",
  Pendente: "atencao",
  Inativo: "neutro",
} as const;

function combina(a: AlunoDoCadastro, filtro: Filtro): boolean {
  if (filtro === "todos") return true;
  if (filtro === "sem-conta") return !a.comConta && a.status !== "Inativo";
  return a.status === filtro || (filtro === "Ativo" && a.status === "Risco");
}

function Alunos() {
  const queryClient = useQueryClient();
  const busca = Route.useSearch();
  const navigate = Route.useNavigate();
  const listar = useServerFn(listarCadastroDeAlunos);
  const mudarStatus = useServerFn(alterarStatusDoAluno);

  const { data, isLoading, error } = useQuery({
    queryKey: ["cadastro-de-alunos"],
    queryFn: () => listar(),
  });
  const [termo, setTermo] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [editando, setEditando] = useState<AlunoDoCadastro | null>(null);
  const [formAberto, setFormAberto] = useState(Boolean(busca.novo));
  const [importAberto, setImportAberto] = useState(false);

  const recarregar = () => {
    void queryClient.invalidateQueries({ queryKey: ["cadastro-de-alunos"] });
    void queryClient.invalidateQueries({ queryKey: ["interessados"] });
  };

  const status = useMutation({
    mutationFn: (v: { id: string; status: string }) => mudarStatus({ data: v }),
    onSuccess: (_r, v) =>
      toast.success(v.status === "Inativo" ? "Aluno inativado." : "Situação atualizada."),
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
    onSettled: recarregar,
  });

  const lista = useMemo(() => data ?? [], [data]);
  const contagem = useMemo(
    () =>
      Object.fromEntries(
        FILTROS.map((f) => [f.id, lista.filter((a) => combina(a, f.id)).length]),
      ) as Record<Filtro, number>,
    [lista],
  );
  const visiveis = useMemo(() => {
    const alvo = chaveDeComparacao(termo);
    const digitos = termo.replace(/\D/g, "");
    return lista.filter((a) => {
      if (!combina(a, filtro)) return false;
      if (alvo === "") return true;
      return (
        chaveDeComparacao(a.nome).includes(alvo) ||
        (a.email ?? "").toLowerCase().includes(alvo) ||
        (digitos.length >= 3 && (a.telefone ?? "").includes(digitos))
      );
    });
  }, [lista, termo, filtro]);

  // Dados do pedido do site, quando o formulário foi aberto por ele.
  const inicial = useMemo(
    () =>
      busca.novo
        ? {
            ...(busca.nome ? { nome: busca.nome } : {}),
            ...(busca.email ? { email: busca.email } : {}),
            ...(busca.telefone ? { telefone: busca.telefone } : {}),
            ...(busca.interesse ? { objetivo: `Interesse: ${busca.interesse}` } : {}),
          }
        : undefined,
    [busca.novo, busca.nome, busca.email, busca.telefone, busca.interesse],
  );

  function abrirNovo() {
    setEditando(null);
    setFormAberto(true);
  }
  function fecharFormulario(aberto: boolean) {
    setFormAberto(aberto);
    if (!aberto && busca.novo) void navigate({ search: {}, replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-brand-yellow/20 bg-brand-black px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10" />
            <div>
              <h1 className="text-base font-bold uppercase tracking-widest text-brand-onblack">
                Alunos
              </h1>
              <p className="text-xs text-brand-onblack/60">Cadastro, edição e importação</p>
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

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-8">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full space-y-1.5 sm:w-auto sm:min-w-72 sm:flex-1 sm:max-w-sm">
            <Label htmlFor="busca-de-alunos">Buscar por nome, e-mail ou telefone</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="busca-de-alunos"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                autoComplete="off"
                className="min-h-11 pl-9"
              />
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportAberto(true)}
              className="min-h-11 gap-2 rounded-full"
            >
              <FileUp className="size-4" aria-hidden /> Importar planilha
            </Button>
            <Button type="button" onClick={abrirNovo} className="min-h-11 gap-2 rounded-full">
              <UserPlus className="size-4" aria-hidden /> Novo aluno
            </Button>
          </div>
        </div>

        <nav aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              aria-pressed={filtro === f.id}
              className={cn(
                "min-h-11 rounded-full px-4 text-sm font-medium",
                filtro === f.id
                  ? "bg-brand-yellow text-brand-black"
                  : "border border-foreground/15 hover:bg-foreground/5",
              )}
            >
              {f.rotulo} <span className="tabular-nums opacity-70">({contagem[f.id]})</span>
            </button>
          ))}
        </nav>

        {isLoading ? (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando alunos…
          </p>
        ) : error ? (
          <div
            role="alert"
            className="space-y-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
          >
            <p>{traduzErroServidor(error)}</p>
            <p>
              <Link to="/diagnostico" className="font-semibold underline underline-offset-4">
                Abrir o diagnóstico
              </Link>{" "}
              mostra o que pode estar faltando na configuração.
            </p>
          </div>
        ) : lista.length === 0 ? (
          <div className="space-y-3 rounded-3xl border border-dashed border-foreground/15 p-8 text-center">
            <h2 className="font-display text-lg font-semibold">Nenhum aluno cadastrado ainda</h2>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Cadastre o primeiro aluno ou importe a planilha que você já tem. Os relatórios, as
              mensalidades e os treinos começam a aparecer assim que houver alunos.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={abrirNovo} className="min-h-11 gap-2 rounded-full">
                <UserPlus className="size-4" aria-hidden /> Cadastrar o primeiro aluno
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setImportAberto(true)}
                className="min-h-11 gap-2 rounded-full"
              >
                <FileUp className="size-4" aria-hidden /> Importar planilha
              </Button>
            </div>
          </div>
        ) : (
          <TabelaRelatorio
            rotulo="Alunos cadastrados"
            linhas={visiveis}
            chaveLinha={(a) => a.id}
            limiteInicial={30}
            itens={["aluno", "alunos"]}
            vazio={
              <p className="text-sm text-muted-foreground">
                Nenhum aluno encontrado com esses filtros.
              </p>
            }
            colunas={[
              {
                id: "nome",
                titulo: "Aluno",
                papel: "titulo",
                celula: (a) => (
                  <>
                    {a.nome}
                    {a.email ? (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {a.email}
                      </span>
                    ) : null}
                  </>
                ),
              },
              {
                id: "status",
                titulo: "Situação",
                papel: "selo",
                celula: (a) => (
                  <Selo tom={TOM_DO_STATUS[a.status as keyof typeof TOM_DO_STATUS] ?? "neutro"}>
                    {a.status}
                  </Selo>
                ),
              },
              { id: "plano", titulo: "Plano", papel: "subtitulo", celula: (a) => a.plano },
              { id: "turno", titulo: "Turno", celula: (a) => a.turno },
              {
                id: "contato",
                titulo: "Telefone",
                celula: (a) => {
                  const wa = normalizarTelefoneBR(a.telefone);
                  return a.telefone ? (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {formatarTelefone(a.telefone)}
                      {wa ? (
                        <a
                          href={linkWhatsapp(
                            wa,
                            `Olá, ${a.nome.split(" ")[0]}! Aqui é da Academia Family Gym.`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Chamar ${a.nome} no WhatsApp (abre em outra aba)`}
                          className="inline-flex min-h-11 items-center text-brand-yellow"
                        >
                          <MessageCircle className="size-4" aria-hidden />
                        </a>
                      ) : null}
                    </span>
                  ) : (
                    "—"
                  );
                },
              },
              { id: "matricula", titulo: "Matrícula", celula: (a) => formatarData(a.matricula) },
              {
                id: "conta",
                titulo: "Conta de acesso",
                celula: (a) =>
                  a.comConta ? <Selo tom="ok">Ligada</Selo> : <Selo tom="neutro">Sem conta</Selo>,
              },
              {
                id: "acoes",
                titulo: "Ações",
                larga: true,
                celula: (a) => (
                  <span className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditando(a);
                        setFormAberto(true);
                      }}
                      className="min-h-11 gap-1.5 rounded-full"
                    >
                      <Pencil className="size-3.5" aria-hidden /> Editar
                      <span className="sr-only"> {a.nome}</span>
                    </Button>
                    {a.status === "Inativo" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={status.isPending}
                        onClick={() => status.mutate({ id: a.id, status: "Ativo" })}
                        className="min-h-11 rounded-full"
                      >
                        Reativar<span className="sr-only"> {a.nome}</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={status.isPending}
                        onClick={() => status.mutate({ id: a.id, status: "Inativo" })}
                        className="min-h-11 rounded-full"
                      >
                        Inativar<span className="sr-only"> {a.nome}</span>
                      </Button>
                    )}
                  </span>
                ),
              },
            ]}
          />
        )}
      </main>

      <FormularioDoAluno
        aberto={formAberto}
        aoMudarAberto={fecharFormulario}
        aluno={editando}
        inicial={editando ? undefined : inicial}
        interessadoId={editando ? undefined : busca.interessado}
        aoSalvar={recarregar}
      />
      <ImportarAlunos
        aberto={importAberto}
        aoMudarAberto={setImportAberto}
        existentes={lista}
        aoImportar={recarregar}
      />
    </div>
  );
}
