import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarCheck,
  CalendarDays,
  Clock,
  Dumbbell,
  IdCard,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listarAgendaAluno } from "@/lib/aluno-agenda.functions";
import { descreverOpcao, formatarBRL, planoDoAluno } from "@/lib/planos-catalogo";
import type { Membro } from "@/lib/familygym-data";

function dataBR(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function diaSemana(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long" });
}

function Info({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  sub?: string | undefined;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 text-primary" />
        {label}
      </div>
      <div className="text-sm font-semibold">{value}</div>
      {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function AlunoMatricula({ aluno }: { aluno: Membro }) {
  const buscar = useServerFn(listarAgendaAluno);
  const { data, isLoading, error } = useQuery({
    queryKey: ["agenda-aluno", aluno.id],
    queryFn: () => buscar({ data: { alunoId: aluno.id! } }),
    enabled: Boolean(aluno.id),
  });

  const catalogo = planoDoAluno(aluno.plano);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2 gap-5">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Dados da matrícula</h3>
          <p className="text-xs text-muted-foreground">
            Tudo o que está registrado no seu contrato com a Academia Family Gym.
          </p>
        </div>

        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          <Info icon={IdCard} label="Aluno" value={aluno.nome} sub={`Status: ${aluno.status}`} />
          <Info
            icon={CalendarDays}
            label="Matriculado em"
            value={dataBR(aluno.matricula)}
            sub={diaSemana(aluno.matricula)}
          />
          <Info icon={Dumbbell} label="Plano" value={catalogo?.nome ?? aluno.plano} sub={catalogo?.resumo} />
          <Info icon={Clock} label="Turno" value={aluno.turno || "—"} />
          <Info
            icon={ShieldCheck}
            label="Termo válido até"
            value={aluno.termoValidoAte ? dataBR(aluno.termoValidoAte) : "Não registrado"}
          />
          <Info
            icon={Users}
            label="Taxa de matrícula"
            value={catalogo ? formatarBRL(catalogo.matricula) : "—"}
            sub="Cobrada na adesão"
          />
        </div>

        {catalogo ? (
          <div className="space-y-3 rounded-xl border border-border p-4">
            <div className="text-sm font-medium">Formas de pagamento do plano</div>
            <div className="flex flex-wrap gap-2">
              {catalogo.opcoes.map((o) => (
                <Badge key={o.label} variant="secondary" className="font-normal">
                  {o.label}: {descreverOpcao(o)}
                </Badge>
              ))}
              {catalogo.familia ? (
                <Badge variant="outline" className="font-normal">
                  {catalogo.familia.label}: {catalogo.familia.parcelas}x de{" "}
                  {formatarBRL(catalogo.familia.valor)}
                </Badge>
              ) : null}
            </div>
            {catalogo.inclui?.length ? (
              <p className="text-xs text-muted-foreground">Inclui: {catalogo.inclui.join(", ")}.</p>
            ) : null}
            {catalogo.observacoes?.length ? (
              <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                {catalogo.observacoes.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {catalogo?.modalidades?.length ? (
          <div className="space-y-2 rounded-xl border border-border p-4">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="size-4 text-primary" />
              Modalidades liberadas no seu plano
            </div>
            <div className="flex flex-wrap gap-1.5">
              {catalogo.modalidades.map((m) => (
                <Badge key={m} variant="outline" className="font-normal">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-2 rounded-xl border border-border p-4">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <CalendarCheck className="size-4 text-primary" />
            Minhas modalidades e horários
          </div>
          {isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando aulas…
            </p>
          ) : error ? (
            <p className="text-sm text-destructive">Não foi possível carregar suas aulas.</p>
          ) : data && data.modalidades.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.modalidades.map((m) => (
                <div key={m.nome} className="rounded-lg border border-border p-3 text-sm">
                  <div className="font-medium">{m.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.presencas} aula(s) frequentada(s)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {m.proximoHorario
                      ? `Próxima: ${dataBR(m.proximoHorario.slice(0, 10))} às ${m.proximoHorario.slice(11)}`
                      : "Sem próxima aula marcada"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Você ainda não está em nenhuma aula coletiva. Fale com a equipe para se inscrever.
            </p>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <div className="mb-3 space-y-1">
            <h3 className="text-sm font-semibold">Próximas aulas</h3>
            <p className="text-xs text-muted-foreground">Data, modalidade e horário</p>
          </div>
          {data && data.proximas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Modalidade</TableHead>
                  <TableHead className="text-right text-xs">Horário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.proximas.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs text-muted-foreground">{dataBR(a.data)}</TableCell>
                    <TableCell className="text-xs font-medium">
                      {a.modalidade}
                      {a.professor ? (
                        <span className="block text-muted-foreground">{a.professor}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{a.horario}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma aula programada por enquanto.</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 space-y-1">
            <h3 className="text-sm font-semibold">Aulas já realizadas</h3>
            <p className="text-xs text-muted-foreground">Histórico recente de presença</p>
          </div>
          {data && data.anteriores.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Modalidade</TableHead>
                  <TableHead className="text-right text-xs">Horário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.anteriores.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs text-muted-foreground">{dataBR(a.data)}</TableCell>
                    <TableCell className="text-xs font-medium">{a.modalidade}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{a.horario}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Ainda não há presenças registradas.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
