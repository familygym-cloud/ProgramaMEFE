import { useState } from "react";
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
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  HeartPulse,
  TrendingDown,
  Users,
  Wallet,
} from "lucide-react";
import {
  brl,
  evolucaoMensal,
  frequenciaSemanal,
  kpis,
  modalidades,
  planos,
  saudeIntegral,
} from "@/lib/familygym-data";
import { AlunoDetalhe } from "@/components/AlunoDetalhe";
import { BrandLogo } from "@/components/BrandLogo";
import type { Membro } from "@/lib/familygym-data";

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-card-foreground)",
  fontSize: "12px",
};

function Kpi({
  label,
  value,
  delta,
  icon: Icon,
  positiveIsGood = true,
}: {
  label: string;
  value: string;
  delta: number;
  icon: typeof Users;
  positiveIsGood?: boolean;
}) {
  const good = positiveIsGood ? delta >= 0 : delta <= 0;
  const Arrow = delta >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="p-5 gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="rounded-lg bg-secondary p-2 text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="text-3xl font-semibold tabular-nums">{value}</div>
      <div
        className={`flex items-center gap-1 text-xs font-medium ${
          good ? "text-primary" : "text-destructive"
        }`}
      >
        <Arrow className="size-3.5" />
        {Math.abs(delta).toLocaleString("pt-BR", { minimumFractionDigits: 1 })}%
        <span className="text-muted-foreground font-normal">vs. mês anterior</span>
      </div>
    </Card>
  );
}

const statusVariant = {
  Ativo: "default",
  Risco: "secondary",
  Inativo: "destructive",
} as const;

export function FamilyGymDashboard({ membros }: { membros: Membro[] }) {
  const [selectedAluno, setSelectedAluno] = useState<Membro | null>(membros[0] ?? null);


  return (
    <div className="min-h-screen bg-background px-5 py-8 md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <BrandLogo className="h-12" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                Academia Family Gym · Saúde Integral
              </span>
            </div>
            <h1 className="text-3xl font-semibold md:text-4xl">
              Dashboard de desempenho e saúde
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Visão consolidada de alunos, receita, frequência e indicadores de
              saúde integral — alunos, evolução de peso e check-ins vindos do
              banco de dados.
            </p>
          </div>
          <Badge variant="secondary" className="h-8 px-3">
            Julho / 2026
          </Badge>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Alunos ativos" value={String(kpis.alunosAtivos)} delta={kpis.alunosAtivosDelta} icon={Users} />
          <Kpi label="Receita mensal" value={brl(kpis.receitaMensal)} delta={kpis.receitaDelta} icon={Wallet} />
          <Kpi label="Frequência média" value={`${kpis.frequenciaMedia} treinos`} delta={kpis.frequenciaDelta} icon={Activity} />
          <Kpi label="Churn" value={`${kpis.churn}%`} delta={kpis.churnDelta} icon={TrendingDown} positiveIsGood={false} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 space-y-1">
              <h2 className="font-semibold">Evolução de alunos e receita</h2>
              <p className="text-xs text-muted-foreground">Últimos 7 meses</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucaoMensal}>
                  <defs>
                    <linearGradient id="gAlunos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="a" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="b" orientation="right" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number, n) => (n === "receita" ? brl(v) : v)}
                  />
                  <Area yAxisId="a" type="monotone" dataKey="alunos" name="alunos" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#gAlunos)" />
                  <Area yAxisId="b" type="monotone" dataKey="receita" name="receita" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#gReceita)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 space-y-1">
              <h2 className="font-semibold">Distribuição por plano</h2>
              <p className="text-xs text-muted-foreground">428 alunos ativos</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={planos} dataKey="alunos" nameKey="nome" innerRadius={58} outerRadius={92} paddingAngle={3} stroke="none">
                    {planos.map((p) => (
                      <Cell key={p.nome} fill={p.cor} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 space-y-1">
              <h2 className="font-semibold">Frequência por turno</h2>
              <p className="text-xs text-muted-foreground">Check-ins na semana</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequenciaSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="dia" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="manha" name="Manhã" stackId="t" fill="var(--color-chart-1)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="tarde" name="Tarde" stackId="t" fill="var(--color-chart-2)" />
                  <Bar dataKey="noite" name="Noite" stackId="t" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <HeartPulse className="size-4 text-primary" />
              <h2 className="font-semibold">Índice de saúde integral</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={saudeIntegral} outerRadius="72%">
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="eixo" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                  <Radar dataKey="valor" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.35} />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 space-y-1">
              <h2 className="font-semibold">Acompanhamento de alunos</h2>
              <p className="text-xs text-muted-foreground">
                Progresso em relação à meta de saúde do mês
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno / Família</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Treinos</TableHead>
                  <TableHead className="text-right">IMC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Meta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membros.map((m) => (
                  <TableRow
                    key={m.nome}
                    data-state={m.nome === selectedAluno?.nome ? "selected" : undefined}
                    className="cursor-pointer hover:bg-secondary/40 transition-colors"
                    onClick={() => setSelectedAluno(m)}
                  >

                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{m.plano}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.frequencia}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.imc.toFixed(1)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[m.status]}>{m.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={m.progresso} className="h-1.5" />
                        <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                          {m.progresso}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-5">
            <div className="mb-4 space-y-1">
              <h2 className="font-semibold">Ocupação por modalidade</h2>
              <p className="text-xs text-muted-foreground">Média das turmas</p>
            </div>
            <div className="space-y-4">
              {modalidades.map((m) => (
                <div key={m.nome} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{m.nome}</span>
                    <span className="tabular-nums text-muted-foreground">{m.ocupacao}%</span>
                  </div>
                  <Progress value={m.ocupacao} className="h-2" />
                </div>
              ))}
            </div>
          </Card>
        </section>

        {selectedAluno ? <AlunoDetalhe aluno={selectedAluno} /> : null}

      </div>
    </div>
  );
}
