-- Recria as policies das tabelas anteriores a 20261004000000 na forma que o Postgres avalia uma vez
-- por consulta, e não uma vez por linha lida:
--   (SELECT private.has_role((SELECT auth.uid()), 'staff'))   e   aluno_id = (SELECT private.meu_aluno_id())
-- não dependem da linha, então viram InitPlan. Chamadas diretas a private.has_role(auth.uid(), ...) e
-- private.is_meu_aluno(aluno_id) rodam por linha: em check_ins com 120 mil linhas, a leitura da equipe
-- caiu de ~330 ms para ~11 ms e a de um aluno de ~970 ms para ~7 ms (Postgres 16, medido localmente).
-- A semântica de acesso não muda; as tabelas novas de 20261004000000 já nascem nesta forma.
-- Idempotente: DROP POLICY IF EXISTS antes de cada CREATE POLICY.

-- alunos
DROP POLICY IF EXISTS "Staff gerencia alunos" ON public.alunos;
CREATE POLICY "Staff gerencia alunos" ON public.alunos FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Aluno ve sua ficha" ON public.alunos;
CREATE POLICY "Aluno ve sua ficha" ON public.alunos FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

-- avaliacoes
DROP POLICY IF EXISTS "Staff gerencia avaliacoes" ON public.avaliacoes;
CREATE POLICY "Staff gerencia avaliacoes" ON public.avaliacoes FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Aluno ve suas avaliacoes" ON public.avaliacoes;
CREATE POLICY "Aluno ve suas avaliacoes" ON public.avaliacoes FOR SELECT TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));

-- check_ins
DROP POLICY IF EXISTS "Staff gerencia check-ins" ON public.check_ins;
CREATE POLICY "Staff gerencia check-ins" ON public.check_ins FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Aluno ve seus check-ins" ON public.check_ins;
CREATE POLICY "Aluno ve seus check-ins" ON public.check_ins FOR SELECT TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));

DROP POLICY IF EXISTS "Aluno registra seu check-in" ON public.check_ins;
CREATE POLICY "Aluno registra seu check-in" ON public.check_ins FOR INSERT TO authenticated
WITH CHECK (aluno_id = (SELECT private.meu_aluno_id()));

-- assinaturas_relatorio
-- O aluno não assina mais pelo banco: com a policy "Aluno assina seu relatorio" qualquer aluno logado
-- gravava, direto pelo PostgREST, uma assinatura com o nome que quisesse (inclusive o de um
-- profissional) e data retroativa. O app só LÊ esta tabela; a equipe segue gerenciando pela policy
-- abaixo. Se o aluno precisar assinar no futuro, a gravação deve ir por uma função que fixe o
-- assinante (nome do aluno) e a data (now()).
DROP POLICY IF EXISTS "Aluno assina seu relatorio" ON public.assinaturas_relatorio;

DROP POLICY IF EXISTS "Staff gerencia assinaturas" ON public.assinaturas_relatorio;
CREATE POLICY "Staff gerencia assinaturas" ON public.assinaturas_relatorio FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Aluno ve suas assinaturas" ON public.assinaturas_relatorio;
CREATE POLICY "Aluno ve suas assinaturas" ON public.assinaturas_relatorio FOR SELECT TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));

-- user_roles
DROP POLICY IF EXISTS "Staff gerencia papeis" ON public.user_roles;
CREATE POLICY "Staff gerencia papeis" ON public.user_roles FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Usuarios veem seus proprios papeis" ON public.user_roles;
CREATE POLICY "Usuarios veem seus proprios papeis" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR (SELECT private.has_role((SELECT auth.uid()), 'staff')));

-- pagamentos
DROP POLICY IF EXISTS "Staff gerencia pagamentos" ON public.pagamentos;
CREATE POLICY "Staff gerencia pagamentos" ON public.pagamentos FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Aluno ve seus pagamentos" ON public.pagamentos;
CREATE POLICY "Aluno ve seus pagamentos" ON public.pagamentos FOR SELECT TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));

-- aulas
DROP POLICY IF EXISTS "Staff gerencia aulas" ON public.aulas;
CREATE POLICY "Staff gerencia aulas" ON public.aulas FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Aluno ve aulas que participou" ON public.aulas;
CREATE POLICY "Aluno ve aulas que participou" ON public.aulas FOR SELECT TO authenticated
USING (id IN (
  SELECT p.aula_id FROM public.aula_presencas p WHERE p.aluno_id = (SELECT private.meu_aluno_id())
));

-- aula_presencas
DROP POLICY IF EXISTS "Staff gerencia presencas" ON public.aula_presencas;
CREATE POLICY "Staff gerencia presencas" ON public.aula_presencas FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Aluno ve suas presencas" ON public.aula_presencas;
CREATE POLICY "Aluno ve suas presencas" ON public.aula_presencas FOR SELECT TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));
