# Supabase remoto — 17/11/2026

Projeto confirmado: `wwizysqyxiavcftwagrq`.

- Conexão PostgreSQL com validação TLS e hostname, usando a CA pública oficial do Supabase.
- Banco inspecionado antes da alteração: nenhuma tabela pública e nenhuma conta Auth.
- Migrações 001–009 aplicadas em uma transação; COMMIT confirmado. Histórico e SHA-256 em `devpath_meta.migrations`.
- REST confirmou profiles, invites, enrollments e tutor_requests disponíveis.
- Três aulas importadas como rascunhos. O conteúdo completo de 234 horas continua pendente.
- Verificação no PostgreSQL remoto confirmou: consumo único de convite, rejeição sem convite, perfis privados, progresso e notas pessoais isolados e rejeição de alteração de função/nota pelo aluno.
- Fixtures fictícias criadas numa transação e revertidas; ausência de contas de teste confirmada após ROLLBACK. Este teste usa os papéis reais PostgreSQL, mas não substitui E2E por navegador/Auth API ou concorrência.

## Operação

`npm run db:inspect` inspeciona sem aplicar. `npm run db:migrate` aplica somente arquivos pendentes e rejeita divergência de checksum. O primeiro uso recusa banco já ocupado sem histórico. `npm run db:verify` executa o smoke test transacional antes da criação do proprietário real.

Definir SUPABASE_DB_URL e SUPABASE_DB_CA_FILE no ambiente privado local. A URL contém senha e nunca deve ser versionada. A CA usada pelo próprio painel está em https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt, conforme https://github.com/supabase/supabase/blob/master/apps/studio/hooks/custom-content/custom-content.json. Não desativar verificação TLS.

## Bloqueios para acesso externo funcional

1. Conta Netlify e vínculo com o repositório; nenhum link externo criado nesta etapa.
2. Desativar Allow new users to sign up no Supabase Auth. O trigger bloqueia acesso sem convite, mas a configuração do serviço ainda está aberta.
3. Criar proprietário com email, nome e senha fornecidos no ambiente privado para `npm run bootstrap`.
4. Configurar SMTP, origem HTTPS e redirects e validar login, convite e recuperação por email.
5. Executar testes de hospedagem, navegador e concorrência ainda pendentes. Não repetir as suítes locais já aprovadas sem mudança relevante.

Tutor continua desativado. Nenhum serviço pago foi ativado. Nenhum deploy realizado.
