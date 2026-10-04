-- user_roles.user_id e alunos.user_id guardavam o id de uma conta sem chave estrangeira. Ao excluir uma
-- conta no Supabase o papel ficava órfão (um staff excluído continuava contando como "já existe staff" e
-- travava a promoção do próximo) e a ficha do aluno seguia presa a uma conta inexistente, aparecendo
-- como vinculada sem e-mail na tela de vínculos.
--
-- Idempotente: a limpeza só atinge linhas órfãs e cada FK só é criada se ainda não existir.

-- 1) Remove o que já está órfão: o ADD CONSTRAINT falharia por causa dessas linhas.
DELETE FROM public.user_roles r
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = r.user_id);

UPDATE public.alunos a
SET user_id = NULL
WHERE a.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = a.user_id);

-- 2) Papéis seguem a conta (CASCADE); a ficha do aluno não é apagada com a conta, só desvinculada.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_roles'::regclass AND conname = 'user_roles_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.alunos'::regclass AND conname = 'alunos_user_id_fkey'
  ) THEN
    ALTER TABLE public.alunos
      ADD CONSTRAINT alunos_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;
