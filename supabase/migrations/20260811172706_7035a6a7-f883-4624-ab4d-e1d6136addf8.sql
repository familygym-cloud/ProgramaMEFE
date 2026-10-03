CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION private.is_meu_aluno(_aluno_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.alunos WHERE id = _aluno_id AND user_id = auth.uid()) $$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_meu_aluno(uuid) FROM PUBLIC, anon, authenticated;

DROP POLICY "Staff gerencia alunos" ON public.alunos;
CREATE POLICY "Staff gerencia alunos" ON public.alunos FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

DROP POLICY "Aluno assina seu relatorio" ON public.assinaturas_relatorio;
CREATE POLICY "Aluno assina seu relatorio" ON public.assinaturas_relatorio FOR INSERT TO authenticated
WITH CHECK (private.is_meu_aluno(aluno_id));

DROP POLICY "Aluno ve suas assinaturas" ON public.assinaturas_relatorio;
CREATE POLICY "Aluno ve suas assinaturas" ON public.assinaturas_relatorio FOR SELECT TO authenticated
USING (private.is_meu_aluno(aluno_id));

DROP POLICY "Staff gerencia assinaturas" ON public.assinaturas_relatorio;
CREATE POLICY "Staff gerencia assinaturas" ON public.assinaturas_relatorio FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

DROP POLICY "Aluno ve suas avaliacoes" ON public.avaliacoes;
CREATE POLICY "Aluno ve suas avaliacoes" ON public.avaliacoes FOR SELECT TO authenticated
USING (private.is_meu_aluno(aluno_id));

DROP POLICY "Staff gerencia avaliacoes" ON public.avaliacoes;
CREATE POLICY "Staff gerencia avaliacoes" ON public.avaliacoes FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

DROP POLICY "Aluno registra seu check-in" ON public.check_ins;
CREATE POLICY "Aluno registra seu check-in" ON public.check_ins FOR INSERT TO authenticated
WITH CHECK (private.is_meu_aluno(aluno_id));

DROP POLICY "Aluno ve seus check-ins" ON public.check_ins;
CREATE POLICY "Aluno ve seus check-ins" ON public.check_ins FOR SELECT TO authenticated
USING (private.is_meu_aluno(aluno_id));

DROP POLICY "Staff gerencia check-ins" ON public.check_ins;
CREATE POLICY "Staff gerencia check-ins" ON public.check_ins FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

DROP POLICY "Staff gerencia papeis" ON public.user_roles;
CREATE POLICY "Staff gerencia papeis" ON public.user_roles FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

DROP POLICY "Usuarios veem seus proprios papeis" ON public.user_roles;
CREATE POLICY "Usuarios veem seus proprios papeis" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'staff'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_meu_aluno(uuid);