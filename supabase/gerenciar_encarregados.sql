-- ============================================
-- GERENCIAMENTO DE ENCARREGADOS (aba no admin)
-- Rode no SQL Editor do Supabase
-- ============================================

-- 1) Admin pode CRIAR perfil de encarregado (insert na tabela usuarios)
drop policy if exists "usuarios_insert_admin" on public.usuarios;
create policy "usuarios_insert_admin"
  on public.usuarios
  for insert
  to authenticated
  with check (public.is_admin());

-- 2) Admin pode EDITAR / ativar / desativar / trocar tipo (update)
drop policy if exists "usuarios_update_admin" on public.usuarios;
create policy "usuarios_update_admin"
  on public.usuarios
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3) Verificação:
-- deve listar TODOS os encarregados/pintura (ativos e inativos)
select id, nome, email, perfil, ativo
from public.usuarios
where perfil in ('encarregado', 'pintura')
order by nome;

-- 4) Criar NOVO encarregado que consiga LOGAR (sem UUID manual):
-- O app agora chama a Edge Function `criar-encarregado`, que cria o
-- usuário no Auth + o perfil em `usuarios` de uma vez (com a senha
-- informada no formulário). É preciso implantar a função uma vez:
--
--   supabase login
--   supabase link --project-ref <SEU_PROJECT_REF>
--   supabase functions deploy criar-encarregado
--
-- A função usa SUPABASE_SERVICE_ROLE_KEY (já disponível no Edge
-- Functions) e só aceita chamadas de admin ativo. As policies 1/2
-- acima continuam úteis para editar/ativar direto pelo app.
