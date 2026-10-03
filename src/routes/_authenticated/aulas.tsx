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
import { excluirAula, listarAulas, salvarAula, type Aula } from "@/lib/aulas.functions";

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

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function dataBR(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    weekday: "short",
  });
}

type Formulario = {
  id?: string;
  data: string;
  modalidade: string;
  horario: string;
  professor: string;
  observacoes: string;
  alunoIds: string[];
};

const formVazio: Formulario = {
  data: hojeISO(),
  modalidade: "",
  horario: "07:00",
  professor: "",
  observacoes: "",
  alunoIds: [],
};

function Aulas() {
  const queryClient = useQueryClient();
  const buscar = useServerFn(listarAulas);
  const gravar = useServerFn(salvarAula);
  const apagar = useServerFn(excluirAula);

  const [form, setForm] = useState<Formulario>(formVazio);

  const { data, isLoading, error } = useQuery({
    queryKey: ["aulas"],
    queryFn: () => buscar(),
  });

  const alunos = data?.alunos ?? [];
  const aulas = data?.aulas ?? [];
  const marcados = useMemo(() => new Set(form.alunoIds), [form.alunoIds]);

  // Agrupa as aulas por modalidade e soma a frequência de cada aluno na modalidade.
  const porModalidade = useMemo(() => {
    const hoje = hojeISO();
    const grupos = new Map<
      string,
      {
        modalidade: string;
        aulas: Aula[];
        programadas: Aula[];
        frequencia: Map<string, number>;
        totalPresencas: number;
      }
    >();

    for (const aula of aulas) {
      const grupo =
        grupos.get(aula.modalidade) ??
        {
          modalidade: aula.modalidade,
          aulas: [] as Aula[],
          programadas: [] as Aula[],
          frequencia: new Map<string, number>(),
          totalPresencas: 0,
        };
      grupo.aulas.push(aula);
      if (aula.data >= hoje) grupo.programadas.push(aula);
      for (const p of aula.presentes) {
        grupo.frequencia.set(p.nome, (grupo.frequencia.get(p.nome) ?? 0) + 1);
        grupo.totalPresencas += 1;
      }
      grupos.set(aula.modalidade, grupo);
    }

    return [...grupos.values()]
      .map((g) => ({
        ...g,
        programadas: [...g.programadas].sort((a, b) =>
          a.data === b.data ? a.horario.localeCompare(b.horario) : a.data.localeCompare(b.data),
        ),
        ranking: [...g.frequencia.entries()]
          .map(([nome, presencas]) => ({ nome, presencas }))
          .sort((a, b) => b.presencas - a.presencas || a.nome.localeCompare(b.nome, "pt-BR")),
      }))
      .sort((a, b) => a.modalidade.localeCompare(b.modalidade, "pt-BR"));
  }, [aulas]);

  function recarregar() {
    queryClient.invalidateQueries({ queryKey: ["aulas"] });
    queryClient.invalidateQueries({ queryKey: ["termos"] });
  }

  const salvarMutation = useMutation({
    mutationFn: (vars: Formulario) => gravar({ data: vars }),
    onSuccess: (r) => {
      toast.success(`Aula salva com ${r.presentes} aluno(s) presente(s).`);
      setForm(formVazio);
      recarregar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirMutation = useMutation({
    mutationFn: (vars: { id: string }) => apagar({ data: vars }),
    onSuccess: () => {
      toast.success("Aula removida.");
      setForm((f) => f.id ? formVazio : f);
      recarregar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function editar(aula: Aula) {
    setForm({
      id: aula.id,
      data: aula.data,
      modalidade: aula.modalidade,
      horario: aula.horario,
      professor: aula.professor,
      observacoes: aula.observacoes,
      alunoIds: aula.presentes.map((p) => p.alunoId),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function alternarAluno(id: string) {
    setForm((f) => ({
      ...f,
      alunoIds: f.alunoIds.includes(id)
        ? f.alunoIds.filter((x) => x !== id)
        : [...f.alunoIds, id],
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
            {(error as Error).message}
          </div>
        ) : null}

        <section className="rounded-2xl border border-border bg-card p-5">
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarPlus className="size-5 text-brand-yellow" />
            {form.id ? "Editar aula" : "Cadastrar aula"}
          </h1>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
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
                onChange={(e) => setForm((f) => ({ ...f, professor: e.target.value }))}
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
              onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
            />
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <Users className="size-4 text-brand-yellow" /> Alunos presentes
              </h2>
              <span className="text-xs text-muted-foreground">
                {form.alunoIds.length} de {alunos.length} marcados
              </span>
            </div>

            {isLoading ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Carregando alunos...
              </p>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {alunos.map((a) => (
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
                      {a.turno}
                    </span>
                  </label>
                ))}
              </div>
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
              <Button variant="outline" className="gap-2 rounded-full" onClick={() => setForm(formVazio)}>
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
                          <Badge key={r.nome} variant="outline">
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
                            onClick={() => excluirMutation.mutate({ id: aula.id })}
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
    </div>
  );
}
