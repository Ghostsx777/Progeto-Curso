# Estado verificável

## Base encontrada
ZIP com página inicial, regras pedagógicas e duas migrações SQL. Sem runtime, package.json, autenticação ou painéis. A base foi ampliada sem gerador nem substituição desnecessária.

## Implementado no código
- Fundação Next.js, TypeScript, Tailwind e layout dark responsivo; página inicial preservada.
- Supabase SSR, proteção server-side, login/logout, confirmação e recuperação de senha.
- Convites com hash, expiração, revogação, email opcional e consumo transacional no trigger Auth.
- Inicialização privada de um único proprietário.
- Painéis com consultas reais, formação, aulas Markdown, anotações privadas, submissões e histórico.
- Gestão de convites, pesquisa de alunos, bloqueio, correção manual e exceções justificadas.
- Editor administrativo de módulos, aulas Markdown com pré-visualização e atividades; rascunhos/publicação, ordenação e auditoria. Critérios e estrutura são protegidos quando já existem progresso ou entregas.
- Página administrativa de histórico com as 100 ações mais recentes.
- Migração 003: cursos, isolamento, progressão no banco, recuperação, auditoria e funções de certificados.
- Testes PostgreSQL/RLS e regras pedagógicas; CI sem publicação.

## Limites de verificação
- Ainda não há Supabase configurado: login real, emails, bootstrap e fluxos completos não foram validados nesse serviço.
- Testes locais usam PostgreSQL PGlite e esquema Auth mínimo.
- Não houve revisão visual em navegador ou testes completos de acessibilidade/dispositivos.
- Não houve deploy, domínio, backups ou operação em produção.

## Falta para cumprir o documento mestre
- Configuração avançada de regras, versionamento de cursos em andamento e criação de outras formações pela interface.
- Currículo didático completo de 234 horas, exercícios, provas, projetos e recuperação.
- Correção automática e execução isolada de código.
- Relatórios e perfil detalhado, inatividade e notificações.
- Certificado PDF e página pública: existem funções de banco, mas não recurso completo.
- Biblioteca, glossário, calendário, dúvidas, portfólio e gamificação.
- MFA obrigatório, proteção adicional contra abuso e testes de concorrência.
- E2E com Supabase real, SMTP, acessibilidade e responsividade.
- Backups testados, privacidade/retenção, monitorização e publicação autorizada.

Não considerar etapas dependentes de serviços concluídas só porque o build passa. Não admitir alunos reais ainda.

## Verificações locais desta versão
- 14 testes de regras, validação e PostgreSQL/RLS; dados exclusivamente fictícios.
- Build de produção com verificação TypeScript.
- Páginas públicas responderam HTTP 200; áreas privadas redirecionaram ao login no ambiente sem Supabase.
- Repositório conectado a Ghostsx777/Progeto-Curso. A pasta de trabalho atual é devpath-github; devpath-academy contém a cópia anterior à ligação ao GitHub.
