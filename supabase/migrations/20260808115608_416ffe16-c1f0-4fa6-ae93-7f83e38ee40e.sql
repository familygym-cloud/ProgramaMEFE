-- 1. Roles enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('staff', 'aluno');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Usuarios veem seus proprios papeis"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff gerencia papeis"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));

-- 4. Link alunos to auth accounts
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS alunos_user_id_key ON public.alunos (user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.is_meu_aluno(_aluno_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.alunos
    WHERE id = _aluno_id AND user_id = auth.uid()
  )
$$;

-- 5. Replace blanket authenticated policies
DROP POLICY IF EXISTS "Alunos visiveis para autenticados" ON public.alunos;
DROP POLICY IF EXISTS "Avaliacoes visiveis para autenticados" ON public.avaliacoes;
DROP POLICY IF EXISTS "Check-ins visiveis para autenticados" ON public.check_ins;
DROP POLICY IF EXISTS "Assinaturas visiveis para autenticados" ON public.assinaturas_relatorio;
DROP POLICY IF EXISTS "Autenticados podem registrar assinatura" ON public.assinaturas_relatorio;

-- alunos
CREATE POLICY "Staff gerencia alunos" ON public.alunos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Aluno ve sua ficha" ON public.alunos FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- avaliacoes
CREATE POLICY "Staff gerencia avaliacoes" ON public.avaliacoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Aluno ve suas avaliacoes" ON public.avaliacoes FOR SELECT TO authenticated
  USING (public.is_meu_aluno(aluno_id));

-- check_ins
CREATE POLICY "Staff gerencia check-ins" ON public.check_ins FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Aluno ve seus check-ins" ON public.check_ins FOR SELECT TO authenticated
  USING (public.is_meu_aluno(aluno_id));
CREATE POLICY "Aluno registra seu check-in" ON public.check_ins FOR INSERT TO authenticated
  WITH CHECK (public.is_meu_aluno(aluno_id));

-- assinaturas_relatorio
CREATE POLICY "Staff gerencia assinaturas" ON public.assinaturas_relatorio FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Aluno ve suas assinaturas" ON public.assinaturas_relatorio FOR SELECT TO authenticated
  USING (public.is_meu_aluno(aluno_id));
CREATE POLICY "Aluno assina seu relatorio" ON public.assinaturas_relatorio FOR INSERT TO authenticated
  WITH CHECK (public.is_meu_aluno(aluno_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alunos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_ins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assinaturas_relatorio TO authenticated;
GRANT ALL ON public.alunos TO service_role;
GRANT ALL ON public.avaliacoes TO service_role;
GRANT ALL ON public.check_ins TO service_role;
GRANT ALL ON public.assinaturas_relatorio TO service_role;