import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Activity,
  Calendar,
  Mail,
  Phone,
  Ruler,
  Target,
  Weight,
  TrendingUp,
  FileText,
  UserRound,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlunoPagamentos } from "@/components/AlunoPagamentos";
import { AlunoMatricula } from "@/components/AlunoMatricula";
import type { Membro } from "@/lib/familygym-data";

const statusVariant = {
  Ativo: "default",
  Risco: "secondary",
  Inativo: "destructive",
} as const;

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-card-foreground)",
  fontSize: "12px",
};

function formatDateBR(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function imcLabelFor(imc: number) {
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25) return "Peso normal";
  if (imc < 30) return "Sobrepeso";
  return "Obesidade";
}

function statusTermo(validoAte?: string | null) {
  if (!validoAte) return { tipo: "sem-termo" as const, dias: 0 };
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const limite = new Date(validoAte + "T00:00:00");
  const dias = Math.round((limite.getTime() - hoje.getTime()) / 86400000);
  if (dias < 0) return { tipo: "expirado" as const, dias };
  if (dias <= 30) return { tipo: "a-vencer" as const, dias };
  return { tipo: "valido" as const, dias };
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  sub?: string;
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

export function AlunoDetalhe({ aluno }: { aluno: Membro }) {
  const termo = statusTermo(aluno.termoValidoAte);
  const conteudo = (
    <section className="grid gap-4 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2 gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 bg-secondary text-primary">
              <AvatarFallback className="bg-secondary text-primary font-semibold">
                {initials(aluno.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{aluno.nome}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{aluno.plano}</span>
                <Badge variant={statusVariant[aluno.status]}>{aluno.status}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserRound className="size-3.5 text-primary" />
            Ficha individual · matrícula {formatDateBR(aluno.matricula)}
          </div>
        </div>

        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          <MetricCard icon={Calendar} label="Idade" value={`${aluno.idade} anos`} />
          <MetricCard icon={Ruler} label="Altura" value={`${aluno.altura} cm`} />
          <MetricCard icon={Weight} label="Peso" value={`${aluno.peso.toFixed(1)} kg`} />
          <MetricCard
            icon={Activity}
            label="IMC"
            value={aluno.imc.toFixed(1)}
            sub={imcLabelFor(aluno.imc)}
          />
          <MetricCard icon={TrendingUp} label="Progresso" value={`${aluno.progresso}%`} />
          <MetricCard icon={Target} label="Frequência" value={`${aluno.frequencia} treinos/mês`} />
          <MetricCard icon={FileText} label="Plano" value={aluno.plano} />
          <MetricCard icon={Clock} label="Turno" value={aluno.turno || "—"} />
          <MetricCard
            icon={ShieldCheck}
            label="Prazo do termo"
            value={aluno.termoValidoAte ? formatDateBR(aluno.termoValidoAte) : "—"}
            sub={
              termo.tipo === "expirado"
                ? `Vencido há ${Math.abs(termo.dias)} dia(s)`
                : termo.tipo === "sem-termo"
                  ? "Termo não registrado"
                  : `Faltam ${termo.dias} dia(s)`
            }
          />
        </div>

        {termo.tipo !== "valido" ? (
          <div
            className={`flex items-start gap-2.5 rounded-lg border p-3 text-sm ${
              termo.tipo === "expirado"
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-primary/40 bg-primary/10 text-foreground"
            }`}
            role="alert"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <div className="font-medium">
                {termo.tipo === "expirado"
                  ? "Termo expirado"
                  : termo.tipo === "sem-termo"
                    ? "Termo pendente"
                    : "Termo perto do vencimento"}
              </div>
              <p className="text-xs opacity-90">
                {termo.tipo === "expirado"
                  ? `O termo de ${aluno.nome} venceu em ${formatDateBR(aluno.termoValidoAte!)}. Renove a assinatura para manter o acesso regularizado.`
                  : termo.tipo === "sem-termo"
                    ? "Ainda não há prazo de termo registrado para este aluno."
                    : `O termo vence em ${formatDateBR(aluno.termoValidoAte!)} (${termo.dias} dia(s)). Combine a renovação com o aluno.`}
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="size-4 text-primary" />
              Objetivo
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{aluno.objetivo}</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="size-4 text-primary" />
              Observações
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{aluno.observacoes}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-lg border border-border p-3">
            <div className="mb-1 flex items-center gap-1.5 text-muted-foreground text-xs">
              <Mail className="size-3.5" />
              Email
            </div>
            <div className="truncate font-medium">{aluno.email || "—"}</div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="mb-1 flex items-center gap-1.5 text-muted-foreground text-xs">
              <Phone className="size-3.5" />
              Telefone
            </div>
            <div className="font-medium">{aluno.telefone || "—"}</div>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progresso da meta de saúde</span>
            <span className="tabular-nums text-muted-foreground">{aluno.progresso}%</span>
          </div>
          <Progress value={aluno.progresso} className="h-2" />
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <div className="mb-3 space-y-1">
            <h3 className="font-semibold text-sm">Evolução do peso</h3>
            <p className="text-xs text-muted-foreground">Últimas avaliações</p>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aluno.evolucaoPeso}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={["dataMin - 2", "dataMax + 2"]}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v.toFixed(1)} kg`, "Peso"]}
                />
                <Line
                  type="monotone"
                  dataKey="peso"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-chart-1)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 space-y-1">
            <h3 className="font-semibold text-sm">Atividades recentes</h3>
            <p className="text-xs text-muted-foreground">Últimos check-ins</p>
          </div>
          {aluno.atividadesRecentes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Atividade</TableHead>
                  <TableHead className="text-right text-xs">Duração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aluno.atividadesRecentes.map((a, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateBR(a.data)}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{a.atividade}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {a.duracaoMin} min
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma atividade registrada recentemente.
            </p>
          )}
        </Card>
      </div>
    </section>
  );

  if (!aluno.id) return conteudo;

  return (
    <Tabs defaultValue="visao" className="gap-4">
      <TabsList>
        <TabsTrigger value="visao">Visão geral</TabsTrigger>
        <TabsTrigger value="matricula">Matrícula e aulas</TabsTrigger>
        <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
      </TabsList>
      <TabsContent value="visao">{conteudo}</TabsContent>
      <TabsContent value="matricula">
        <AlunoMatricula aluno={aluno} />
      </TabsContent>
      <TabsContent value="pagamentos">
        <AlunoPagamentos alunoId={aluno.id} plano={aluno.plano} />
      </TabsContent>
    </Tabs>
  );
}
