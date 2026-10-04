import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CalendarPlus,
  Clock,
  LayoutList,
  Loader2,
  Pencil,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BrandLogo } from "@/components/BrandLogo";
import { ConfirmarAcao } from "@/components/ConfirmarAcao";
import {
  agruparPorModalidade,
  alunosVisiveis,
  aplicarSelecao,
  entradaDoFormulario,
  formularioDaAula,
  formularioVazio,
  LIMITES_AULA,
  type Formulario,
} from "@/lib/aulas";
import { excluirAula, listarAulas, salvarAula, type Aula } from "@/lib/aulas.functions";
import { hojeBrasilia } from "@/lib/datas";
import { traduzErroServidor } from "@/lib/erros-servidor";

export const Route = createFileRoute("/_authenticated/aulas")({
  head: () => ({
    meta: [
      { title: "Aulas e presenças | Academia Family Gym" },
      {
        name: "description",
        content:
          "Cadastre as aulas da Academia Family Gym com data, modalidade, horário e a lista de alunos presentes.",
      },
      { property: "og:title", content: "Aulas e presenças | Academia Family Gym" },
      {
        property: "og:description",
        content: "Registre aulas e marque a presença dos alunos da Academia Family Gym.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Aulas,
});

const MODALIDADES = [
  "Musculação",
  "Natação",
  "Hidroginástica",
  "Funcional",
  "Pilates Solo",
  "Yoga",
  "Bike Class",
  "Zumba",
  "Muay-Thai",
  "Jiu-jitsu",
  "Alongamento",
  "Dança do Ventre",
];

function dataBR(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    weekday: "short",
  });
}

function Aulas() {
  const queryClient = useQueryClient();
  const buscar = useServerFn(listarAulas);
  const gravar = useServerFn(salvarAula);
  const apagar = useServerFn(excluirAula);

  // A data de hoje é a de Brasília e é calculada na hora de abrir/limpar o formulário: uma aba aberta
  // de um dia para o outro não oferece a data de ontem como padrão.
  const [form, setForm] = useState<Formulario>(() => formularioVazio(hojeBrasilia()));
  const [aulaParaExcluir, setAulaParaExcluir] = useState<Aula | null>(null);
  const [busca, setBusca] = useState("");
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["aulas"],
    queryFn: () => buscar(),
  });

  const alunos = useMemo(() => data?.alunos ?? [], [data]);
  const aulas = useMemo(() => data?.aulas ?? [], [data]);
  const marcados = useMemo(() => new Set(form.alunoIds), [form.alunoIds]);

  // Agrupa as aulas por modalidade e soma a frequência de cada aluno (pelo aluno, não pelo nome).
  const porModalidade = useMemo(() => agruparPorModalidade(aulas, hojeBrasilia()), [aulas]);

  const visiveis = useMemo(
    () => alunosVisiveis(alunos, { busca, mostrarInativos, marcados }),
    [alunos, busca, mostrarInativos, marcados],
  );
  const inativosOcultos = useMemo(
    () => alunos.filter((a) => a.status === "Inativo" && !marcados.has(a.id)).length,
    [alunos, marcados],
  );

  function recarregar() {
    queryClient.invalidateQueries({ queryKey: ["aulas"] });
    queryClient.invalidateQueries({ queryKey: ["termos"] });
  }

  const salvarMutation = useMutation({
    mutationFn: (vars: Formulario) => gravar({ data: entradaDoFormulario(vars) }),
    onSuccess: (r) => {
      toast.success(`Aula salva com ${r.presentes} aluno(s) presente(s).`);
      setForm(formularioVazio(hojeBrasilia()));
      recarregar();
    },
    onError: (e: Error) => {
      toast.error(traduzErroServidor(e));
      // A gravação é tudo ou nada, mas uma falha de rede depois do commit deixaria a lista velha na
      // tela: recarregar mostra o estado real e evita salvar de novo uma aula que já existe.
      recarregar();
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (vars: { id: string }) => apagar({ data: vars }),
    onSuccess: (_resultado, vars) => {
      toast.success("Aula removida.");
      // Só zera o formulário se a aula excluída é a que estava sendo editada.
      setForm((f) => (f.id === vars.id ? formularioVazio(hojeBrasilia()) : f));
      recarregar();
    },
    onError: (e: Error) => {
      toast.error(traduzErroServidor(e));
      recarregar();
    },
  });

  function editar(aula: Aula) {
    setForm(formularioDaAula(aula));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function alternarAluno(id: string) {
    setForm((f) => ({
      ...f,
      alunoIds: f.alunoIds.includes(id) ? f.alunoIds.filter((x) => x !== id) : [...f.alunoIds, id],
    }));
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-brand-yellow/20 bg-brand-black/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <BrandLogo className="h-8 w-auto" />
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-brand-yellow">
            Aulas e presenças
          </span>
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
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {traduzErroServidor(error)}
          </div>
        ) : null}

        <section className="rounded-2xl border border-border bg-card p-5">
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarPlus className="size-5 text-brand-yellow" />
            {form.id ? "Editar aula" : "Cadastrar aula"}
          </h1>

          <div className="mt-4 grid gap-4 md:grid-cols-5">
            <div className="space-y-1.5">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={form.data}
                onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horario">Horário</Label>
              <Input
                id="horario"
                type="time"
                value={form.horario}
                onChange={(e) => setForm((f) => ({ ...f, horario: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modalidade">Modalidade</Label>
              <Input
                id="modalidade"
                list="modalidades-familygym"
                placeholder="Ex.: Natação"
                value={form.modalidade}
                maxLength={LIMITES_AULA.modalidade}
                onChange={(e) => setForm((f) => ({ ...f, modalidade: e.target.value }))}
              />
              <datalist id="modalidades-familygym">
                {MODALIDADES.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="professor">Professor(a)</Label>
              <Input
                id="professor"
                placeholder="Opcional"
                value={form.professor}
                maxLength={LIMITES_AULA.professor}
                onChange={(e) => setForm((f) => ({ ...f, professor: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vagas">Vagas</Label>
              <Input
                id="vagas"
                type="number"
                inputMode="numeric"
                min={1}
                max={LIMITES_AULA.vagas}
                step={1}
                value={form.vagas}
                onChange={(e) => setForm((f) => ({ ...f, vagas: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              rows={2}
              placeholder="Opcional"
              value={form.observacoes}
              maxLength={LIMITES_AULA.observacoes}
              onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
            />
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-sans flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <Users className="size-4 text-brand-yellow" /> Alunos presentes
              </h2>
              <span className="text-xs text-muted-foreground" aria-live="polite">
                {form.alunoIds.length} de {alunos.length} marcados
              </span>
            </div>

            {isLoading ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Carregando alunos...
              </p>
            ) : (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="relative min-w-48 flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      aria-label="Buscar aluno pelo nome"
                      placeholder="Buscar aluno"
                      className="pl-8"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={visiveis.length === 0}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        alunoIds: aplicarSelecao(f.alunoIds, visiveis, true),
                      }))
                    }
                  >
                    Marcar {busca.trim() ? "os filtrados" : "todos"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={visiveis.length === 0}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        alunoIds: aplicarSelecao(f.alunoIds, visiveis, false),
                      }))
                    }
                  >
                    Limpar
                  </Button>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={mostrarInativos}
                      onCheckedChange={(v) => setMostrarInativos(v === true)}
                    />
                    Mostrar inativos
                    {!mostrarInativos && inativosOcultos > 0 ? ` (${inativosOcultos} ocultos)` : ""}
                  </label>
                </div>

                {visiveis.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {alunos.length === 0
                      ? "Nenhum aluno cadastrado."
                      : "Nenhum aluno encontrado com esse filtro."}
                  </p>
                ) : (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {visiveis.map((a) => (
                      <label
                        key={a.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm hover:border-brand-yellow/50"
                      >
                        <Checkbox
                          checked={marcados.has(a.id)}
                          onCheckedChange={() => alternarAluno(a.id)}
                        />
                        <span className="flex-1 truncate">{a.nome}</span>
                        <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                          {a.status === "Inativo" ? "Inativo" : a.turno}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              className="gap-2 rounded-full bg-brand-yellow text-brand-black hover:bg-brand-yellow/90"
              disabled={salvarMutation.isPending}
              onClick={() => salvarMutation.mutate(form)}
            >
              {salvarMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CalendarPlus className="size-4" />
              )}
              {form.id ? "Salvar alterações" : "Cadastrar aula"}
            </Button>
            {form.id ? (
              <Button
                variant="outline"
                className="gap-2 rounded-full"
                onClick={() => setForm(formularioVazio(hojeBrasilia()))}
              >
                <X className="size-4" /> Cancelar edição
              </Button>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <LayoutList className="size-5 text-brand-yellow" /> Aulas coletivas por modalidade
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Aulas programadas (hoje em diante) e a frequência de cada aluno na modalidade.
          </p>

          {isLoading ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando modalidades...
            </p>
          ) : porModalidade.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Cadastre aulas para ver o acompanhamento por modalidade.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {porModalidade.map((grupo) => (
                <div
                  key={grupo.modalidade}
                  className="rounded-xl border border-border bg-background/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold">{grupo.modalidade}</h3>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">{grupo.aulas.length} aula(s)</Badge>
                      <Badge className="bg-brand-yellow text-brand-black hover:bg-brand-yellow">
                        {grupo.totalPresencas} presença(s)
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Programadas
                    </p>
                    {grupo.programadas.length === 0 ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Nenhuma aula programada para os próximos dias.
                      </p>
                    ) : (
                      <ul className="mt-1 space-y-1 text-sm">
                        {grupo.programadas.slice(0, 5).map((aula) => (
                          <li key={aula.id} className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{dataBR(aula.data)}</span>
                            <span className="text-muted-foreground">{aula.horario}</span>
                            {aula.professor ? (
                              <span className="text-xs text-muted-foreground">
                                · {aula.professor}
                              </span>
                            ) : null}
                            <Badge variant="outline" className="text-[0.65rem]">
                              {aula.presentes.length} presente(s)
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {aula.vagas} vaga(s)
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Frequência dos alunos
                    </p>
                    {grupo.ranking.length === 0 ? (
                      <p className="mt-1 text-sm text-destructive">
                        Nenhum aluno registrou presença nesta modalidade.
                      </p>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {grupo.ranking.map((r) => (
                          <Badge key={r.alunoId} variant="outline">
                            {r.nome} · {r.presencas}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="size-5 text-brand-yellow" /> Aulas cadastradas
          </h2>

          {isLoading ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando aulas...
            </p>
          ) : aulas.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhuma aula cadastrada ainda. Use o formulário acima para registrar a primeira.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Professor(a)</TableHead>
                    <TableHead>Vagas</TableHead>
                    <TableHead>Alunos presentes</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aulas.map((aula) => (
                    <TableRow key={aula.id}>
                      <TableCell className="whitespace-nowrap">{dataBR(aula.data)}</TableCell>
                      <TableCell className="whitespace-nowrap">{aula.horario}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{aula.modalidade}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {aula.professor || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm tabular-nums">
                        {aula.vagas}
                      </TableCell>
                      <TableCell>
                        {aula.presentes.length === 0 ? (
                          <span className="text-sm text-destructive">Nenhum aluno presente</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            <Badge className="bg-brand-yellow text-brand-black hover:bg-brand-yellow">
                              {aula.presentes.length} presente(s)
                            </Badge>
                            {aula.presentes.map((p) => (
                              <Badge key={p.alunoId} variant="outline">
                                {p.nome}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 rounded-full"
                            onClick={() => editar(aula)}
                          >
                            <Pencil className="size-3.5" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 rounded-full text-destructive hover:text-destructive"
                            disabled={excluirMutation.isPending}
                            onClick={() => setAulaParaExcluir(aula)}
                          >
                            <Trash2 className="size-3.5" /> Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </main>

      <ConfirmarAcao
        aberto={aulaParaExcluir !== null}
        aoMudarAberto={(aberto) => {
          if (!aberto) setAulaParaExcluir(null);
        }}
        titulo="Excluir esta aula?"
        descricao={
          aulaParaExcluir
            ? `${aulaParaExcluir.modalidade}, ${dataBR(aulaParaExcluir.data)} às ${aulaParaExcluir.horario}. ` +
              `As ${aulaParaExcluir.presentes.length} presença(s) registradas e as reservas dos alunos ` +
              "nessa aula também serão removidas. Isso não pode ser desfeito."
            : ""
        }
        rotuloConfirmar="Excluir aula"
        destrutivo
        aoConfirmar={() => {
          if (aulaParaExcluir) excluirMutation.mutate({ id: aulaParaExcluir.id });
          setAulaParaExcluir(null);
        }}
      />
    </div>
  );
}
