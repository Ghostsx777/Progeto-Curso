-- DevPath Academy: endurecimento inicial de permissões.
-- Aplicar DEPOIS de 001_initial_schema.sql. Testar em projeto Supabase de desenvolvimento.

-- Impede que um aluno altere o próprio papel (student/admin) ou outros campos do perfil.
revoke update on table public.profiles from authenticated;
grant update (full_name) on table public.profiles to authenticated;

-- A política RLS existente continua limitando a atualização ao próprio perfil ou admin.
-- O privilégio por coluna acima impede a alteração de role mesmo que o cliente tente enviá-lo.

-- Alunos podem criar entregas, mas não definir nota, feedback, corretor ou data de correção.
revoke insert, update on table public.submissions from authenticated;
grant insert (student_id, activity_id, attempt_no, submission_text, submission_url)
  on table public.submissions to authenticated;

-- A leitura continua protegida por RLS. Apenas o administrador pode corrigir entregas.
-- A política "admin grades submissions" da migração 001 controla UPDATE.

-- Progresso de módulos é controlado pelo servidor/administrador, não pelo navegador do aluno.
revoke insert, update, delete on table public.student_module_progress from authenticated;

-- Alunos só podem atualizar campos de acompanhamento da própria aula.
revoke update on table public.lesson_progress from authenticated;
grant update (status, completed_at, updated_at) on table public.lesson_progress to authenticated;

-- Defesa adicional: nunca permitir que aluno insira uma submissão em nome de outro.
-- A política RLS "students submit own work" permanece obrigatória.

-- Nota: o consumo de convites deve ser feito por uma função/ação server-side transacional,
-- com token aleatório de alta entropia, hash no banco, expiração e uso único.
-- Não conceder acesso direto de aluno à tabela invites nem expor a service role key.

-- O estado de uma aula não pode ser marcado como "aprovado" pelo próprio aluno.
revoke insert on table public.lesson_progress from authenticated;
grant insert (student_id, lesson_id) on table public.lesson_progress to authenticated;

drop policy if exists "lesson progress update own" on public.lesson_progress;
create policy "lesson progress update own safe states" on public.lesson_progress
for update using (student_id = auth.uid())
with check (
  student_id = auth.uid()
  and status in ('not_started', 'in_progress', 'watched')
);

-- Conteúdo integral de aulas e atividades só fica visível quando o módulo foi liberado.
drop policy if exists "lessons read authenticated" on public.lessons;
create policy "lessons read unlocked module or admin" on public.lessons
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.modules m
    join public.student_module_progress p on p.module_id = m.id
    where m.id = lessons.module_id
      and m.published = true
      and p.student_id = auth.uid()
      and p.status in ('available', 'in_progress', 'completed')
  )
);

drop policy if exists "activities read authenticated" on public.activities;
create policy "activities read unlocked module or admin" on public.activities
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.modules m
    join public.student_module_progress p on p.module_id = m.id
    where m.id = activities.module_id
      and m.published = true
      and p.student_id = auth.uid()
      and p.status in ('available', 'in_progress', 'completed')
  )
);
