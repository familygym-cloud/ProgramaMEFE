-- alunos
DROP POLICY IF EXISTS "Alunos visiveis publicamente" ON public.alunos;
CREATE POLICY "Alunos visiveis para autenticados"
  ON public.alunos FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.alunos FROM anon;
GRANT SELECT ON public.alunos TO authenticated;
GRANT ALL ON public.alunos TO service_role;

-- avaliacoes
DROP POLICY IF EXISTS "Avaliacoes visiveis publicamente" ON public.avaliacoes;
CREATE POLICY "Avaliacoes visiveis para autenticados"
  ON public.avaliacoes FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.avaliacoes FROM anon;
GRANT SELECT ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;

-- check_ins
DROP POLICY IF EXISTS "Check-ins visiveis publicamente" ON public.check_ins;
CREATE POLICY "Check-ins visiveis para autenticados"
  ON public.check_ins FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.check_ins FROM anon;
GRANT SELECT ON public.check_ins TO authenticated;
GRANT ALL ON public.check_ins TO service_role;

-- assinaturas_relatorio
DROP POLICY IF EXISTS "Assinaturas visiveis publicamente" ON public.assinaturas_relatorio;
DROP POLICY IF EXISTS "Qualquer um pode registrar assinatura" ON public.assinaturas_relatorio;
CREATE POLICY "Assinaturas visiveis para autenticados"
  ON public.assinaturas_relatorio FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem registrar assinatura"
  ON public.assinaturas_relatorio FOR INSERT TO authenticated WITH CHECK (true);
REVOKE ALL ON public.assinaturas_relatorio FROM anon;
GRANT SELECT, INSERT ON public.assinaturas_relatorio TO authenticated;
GRANT ALL ON public.assinaturas_relatorio TO service_role;