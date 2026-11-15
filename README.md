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

A criação Auth consome o convite na mesma transação PostgreSQL. Token aleatório de 32 bytes; somente SHA-256 no banco. Emails de alunos não são confirmados arbitrariamente pelo servidor.

## Testar

`npm test`, `npm run typecheck` e `npm run build`.

Os testes usam PostgreSQL embarcado PGlite com roles e RLS reais; somente o esquema Auth é simulado. O teste omite a extensão pgcrypto porque UUID já existe nativamente no PGlite; não altera o SQL de produção. Contas usam example.invalid. Isso não substitui testes com Supabase Auth real, SMTP, navegador e concorrência em produção.

## Hospedagem posterior

CI no GitHub executa testes e build, sem deploy. O projeto suporta Vercel + Supabase ou servidor Node.js próprio. GitHub Pages não executa Server Actions. A publicação não foi autorizada e não foi realizada. Configure HTTPS, backups, SMTP e monitorização antes da produção.

O Supabase gratuito pode pausar por inatividade: https://supabase.com/docs/guides/platform/free-project-pausing . Não há promessa de disponibilidade contínua em planos gratuitos.

## Pedagogia e segurança

As funções transacionais do banco validam conclusões, tentativas, correções e desbloqueios. Pesos: 20/15/35/30; categorias ausentes contam zero. Concluir aula ou enviar projeto não significa aprovação. Horas são autodeclaradas e limitadas à duração da aula, não tempo comprovado automaticamente. Nunca execute código enviado por alunos no servidor da aplicação.
