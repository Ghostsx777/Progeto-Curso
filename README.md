# DevPath Academy

Aplicação independente Next.js + React + TypeScript + Tailwind, integrada ao Supabase Auth/PostgreSQL. Evolução do ZIP original, preservando a página inicial e migrações 001/002. GitHub guarda o código; VS Code é um editor opcional. Não depende de Render nem de ChatGPT/Sites para executar.

**Em desenvolvimento. Não está pronta para receber alunos reais.** Veja IMPLEMENTATION_STATUS.md. Nenhum painel usa alunos ou notas fictícios como fallback.

## Executar

Node.js 24 LTS recomendado. Execute `npm ci` e `npm run dev`, depois abra http://localhost:3000. A página pública funciona sem credenciais; o login informa que a configuração está pendente.

## Configurar Supabase

1. Crie um projeto de desenvolvimento, copie `.env.example` para `.env.local` e preencha os valores reais. Nunca envie a chave de serviço ao GitHub ou ao navegador.
2. Execute as migrações em `supabase/migrations` na ordem num banco novo. Não reaplique migrações já executadas.
3. Em Authentication, desative cadastros públicos, ative confirmação de email, configure SMTP, limites de Auth, Site URL e URLs de redirecionamento.
4. Template de confirmação: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`. Template de recuperação: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`.
5. Defina temporariamente ADMIN_EMAIL, ADMIN_PASSWORD (12+ caracteres) e ADMIN_NAME no ambiente privado. Execute `npm run bootstrap`. Remova ADMIN_PASSWORD após o uso. O banco impede dois proprietários.
6. Entre em `/login`, abra `/admin` e gere um convite. Compartilhe o link manualmente com o aluno. Teste os fluxos com contas fictícias antes de usar dados reais.
7. Em Conteúdos, publique material revisado e abra as matrículas da formação. Em “Estudar como aluno”, matricule-se normalmente; o progresso do proprietário segue as regras pedagógicas. A turma tem limite de dez contas incluindo o proprietário.

A criação Auth consome o convite na mesma transação PostgreSQL. Token aleatório de 32 bytes; somente SHA-256 no banco. Emails de alunos não são confirmados arbitrariamente pelo servidor. A migração 005 acrescenta data/hora exata, histórico completo e irreversibilidade de consumo/revogação. Falhas na transação do cadastro não consomem o convite; falha posterior no envio de email não desfaz uma conta já criada.

## Testar

`npm test`, `npm run typecheck` e `npm run build`.

`npm run check:setup` verifica presença de configuração e, quando disponível, acessibilidade do serviço sem imprimir chaves. `npm run test:pending` executa somente os testes de tutor e capacidade, sem repetir a suíte completa.

Os testes usam PostgreSQL embarcado PGlite com roles e RLS reais; somente o esquema Auth é simulado. O teste omite a extensão pgcrypto porque UUID já existe nativamente no PGlite; não altera o SQL de produção. Contas usam example.invalid. Isso não substitui testes com Supabase Auth real, SMTP, navegador e concorrência em produção.

## Hospedagem posterior

CI no GitHub executa testes e build, sem deploy. A preferência atual é Netlify Free + Supabase Free para dez pessoas, usando endereço gratuito e sem manter um computador ligado. `netlify.toml` prepara o build Next.js; não é uma exportação estática e não adiciona outro banco. Publicação ainda não autorizada/realizada. Veja o relatório, limitações e procedimento em [FREE_HOSTING_AUDIT.md](docs/FREE_HOSTING_AUDIT.md).

O Supabase gratuito pode pausar por inatividade: https://supabase.com/docs/guides/platform/free-project-pausing . Não há promessa de disponibilidade contínua em planos gratuitos.

## Conteúdo e professor de IA

`node scripts/import-content.mjs --dry-run` audita o primeiro lote de três aulas completas. Com Supabase configurado, `--apply` importa rascunhos e preserva aulas existentes; não publica nem completa o bootcamp. A produção restante está pendente.

A IA está desligada (`AI_TUTOR_ENABLED=false`) para não gerar custos. Sua ativação requer chave e modelo OpenAI no ambiente do servidor e definição do orçamento. A integração não é coberta pela hospedagem gratuita. A IA orienta e dá pistas, sem poderes para modificar notas ou desbloquear módulos. Histórico e limites ficam no banco: 20 perguntas por aluno/dia, 200 por plataforma/dia, intervalo de 10 segundos e resposta limitada. Falhas também contam para o limite de segurança.

## Pedagogia e segurança

As funções transacionais do banco validam conclusões, tentativas, correções e desbloqueios. Pesos: 20/15/35/30; categorias ausentes contam zero. Concluir aula ou enviar projeto não significa aprovação. Horas são autodeclaradas e limitadas à duração da aula, não tempo comprovado automaticamente. Nunca execute código enviado por alunos no servidor da aplicação.
