CREATE TABLE public.alunos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  plano text NOT NULL,
  status text NOT NULL DEFAULT 'Ativo',
  idade integer NOT NULL,
  altura integer NOT NULL,
  peso numeric(5,1) NOT NULL,
  imc numeric(4,1) NOT NULL,
  frequencia integer NOT NULL DEFAULT 0,
  progresso integer NOT NULL DEFAULT 0,
  objetivo text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  email text,
  telefone text,
  matricula date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  mes text NOT NULL,
  referencia date NOT NULL,
  peso numeric(5,1) NOT NULL,
  imc numeric(4,1) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX avaliacoes_aluno_idx ON public.avaliacoes (aluno_id, referencia);

CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  data date NOT NULL,
  atividade text NOT NULL,
  duracao_min integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX check_ins_aluno_idx ON public.check_ins (aluno_id, data DESC);

GRANT SELECT ON public.alunos TO anon, authenticated;
GRANT SELECT ON public.avaliacoes TO anon, authenticated;
GRANT SELECT ON public.check_ins TO anon, authenticated;
GRANT ALL ON public.alunos TO service_role;
GRANT ALL ON public.avaliacoes TO service_role;
GRANT ALL ON public.check_ins TO service_role;

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alunos visiveis publicamente" ON public.alunos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Avaliacoes visiveis publicamente" ON public.avaliacoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Check-ins visiveis publicamente" ON public.check_ins FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.alunos (nome, plano, status, idade, altura, peso, imc, frequencia, progresso, objetivo, observacoes, email, telefone, matricula) VALUES
('Ana Ribeiro','Família','Ativo',34,168,63.2,22.4,18,86,'Manter condicionamento e melhorar resistência cardiovascular.','Excelente adesão aos treinos funcionais. Última avaliação mostrou queda de 1,2% de gordura corporal.','ana.ribeiro@email.com','(11) 98765-4321','2024-03-15'),
('Carlos Menezes','Individual','Ativo',42,178,88.2,27.8,14,64,'Reduzir percentual de gordura e fortalecer a coluna lombar.','Trabalhando carga progressiva na musculação. Evitar impacto inicial até liberação médica.','carlos.menezes@email.com','(11) 91234-5678','2023-08-10'),
('Família Duarte (4)','Família','Ativo',38,172,71.3,24.1,22,91,'Treinar em família e incentivar hábitos saudáveis nos filhos.','Titular da matrícula familiar. Alta frequência nos finais de semana.','duarte.familia@email.com','(11) 99876-5432','2025-01-08'),
('Beatriz Lima','Kids','Risco',10,142,38.7,19.2,9,42,'Desenvolver coordenação motora e introduzir atividade física regular.','Pais relatam dificuldade de constância. Acompanhamento pediátrico em dia.','bia.lima@email.com','(11) 93456-7890','2025-06-12'),
('Joaquim Alves','Sênior','Ativo',67,174,79.6,26.3,12,70,'Preservar mobilidade, equilíbrio e qualidade de vida.','Participa ativamente das aulas de hidroginástica. Pressão arterial controlada.','joaquim.alves@email.com','(11) 94567-8901','2022-11-03'),
('Marina Souza','Individual','Risco',29,165,80.5,29.6,4,28,'Retomar rotina de treinos e reduzir ansiedade relacionada à balança.','Baixa adesão. Agendada reavaliação com nutricionista para próxima semana.','marina.souza@email.com','(11) 95678-9012','2025-09-20'),
('Pedro Nogueira','Família','Inativo',51,181,102.2,31.2,0,11,'Reingressar na academia e iniciar acompanhamento multidisciplinar.','Sem frequência nos últimos 60 dias. Contato de reativação enviado.','pedro.nogueira@email.com','(11) 96789-0123','2024-02-14'),
('Luísa Campos','Individual','Ativo',26,170,62.8,21.7,16,79,'Ganhar massa muscular e melhorar desempenho nos treinos de força.','Progresso consistente na musculação. Aumento de carga de 15% no último bimestre.','luisa.campos@email.com','(11) 97890-1234','2023-05-22');

INSERT INTO public.avaliacoes (aluno_id, mes, referencia, peso, imc)
SELECT a.id, v.mes, v.referencia, v.peso, v.imc
FROM public.alunos a
JOIN (VALUES
('Ana Ribeiro','Jan','2026-01-01'::date,65.8,23.3),('Ana Ribeiro','Mar','2026-03-01',64.9,23.0),('Ana Ribeiro','Mai','2026-05-01',64.2,22.7),('Ana Ribeiro','Jul','2026-07-01',63.2,22.4),
('Carlos Menezes','Jan','2026-01-01',91.5,28.9),('Carlos Menezes','Mar','2026-03-01',90.1,28.4),('Carlos Menezes','Mai','2026-05-01',89.2,28.1),('Carlos Menezes','Jul','2026-07-01',88.2,27.8),
('Família Duarte (4)','Jan','2026-01-01',73.5,24.9),('Família Duarte (4)','Mar','2026-03-01',72.8,24.6),('Família Duarte (4)','Mai','2026-05-01',72.0,24.3),('Família Duarte (4)','Jul','2026-07-01',71.3,24.1),
('Beatriz Lima','Jan','2026-01-01',37.5,18.6),('Beatriz Lima','Mar','2026-03-01',38.1,18.9),('Beatriz Lima','Mai','2026-05-01',38.5,19.1),('Beatriz Lima','Jul','2026-07-01',38.7,19.2),
('Joaquim Alves','Jan','2026-01-01',81.4,26.9),('Joaquim Alves','Mar','2026-03-01',80.5,26.6),('Joaquim Alves','Mai','2026-05-01',80.0,26.4),('Joaquim Alves','Jul','2026-07-01',79.6,26.3),
('Marina Souza','Jan','2026-01-01',78.9,29.0),('Marina Souza','Mar','2026-03-01',79.6,29.2),('Marina Souza','Mai','2026-05-01',80.2,29.5),('Marina Souza','Jul','2026-07-01',80.5,29.6),
('Pedro Nogueira','Jan','2026-01-01',99.0,30.2),('Pedro Nogueira','Mar','2026-03-01',100.5,30.7),('Pedro Nogueira','Mai','2026-05-01',101.4,31.0),('Pedro Nogueira','Jul','2026-07-01',102.2,31.2),
('Luísa Campos','Jan','2026-01-01',61.0,21.1),('Luísa Campos','Mar','2026-03-01',61.5,21.3),('Luísa Campos','Mai','2026-05-01',62.2,21.5),('Luísa Campos','Jul','2026-07-01',62.8,21.7)
) AS v(nome, mes, referencia, peso, imc) ON v.nome = a.nome;

INSERT INTO public.check_ins (aluno_id, data, atividade, duracao_min)
SELECT a.id, c.data, c.atividade, c.duracao_min
FROM public.alunos a
JOIN (VALUES
('Ana Ribeiro','2026-07-28'::date,'Funcional',55),('Ana Ribeiro','2026-07-26','Yoga',50),('Ana Ribeiro','2026-07-24','Musculação',65),
('Carlos Menezes','2026-07-29','Musculação',70),('Carlos Menezes','2026-07-27','Pilates',60),('Carlos Menezes','2026-07-24','Musculação',65),
('Família Duarte (4)','2026-07-30','Natação',45),('Família Duarte (4)','2026-07-28','Funcional',55),('Família Duarte (4)','2026-07-25','Musculação',60),
('Beatriz Lima','2026-07-22','Dança',40),('Beatriz Lima','2026-07-15','Natação',35),('Beatriz Lima','2026-07-08','Dança',40),
('Joaquim Alves','2026-07-29','Hidroginástica',50),('Joaquim Alves','2026-07-27','Yoga',45),('Joaquim Alves','2026-07-24','Hidroginástica',50),
('Marina Souza','2026-07-20','Musculação',40),('Marina Souza','2026-07-13','Funcional',45),('Marina Souza','2026-07-06','Yoga',50),
('Luísa Campos','2026-07-30','Musculação',75),('Luísa Campos','2026-07-28','Funcional',50),('Luísa Campos','2026-07-26','Musculação',70)
) AS c(nome, data, atividade, duracao_min) ON c.nome = a.nome;