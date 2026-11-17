# Estado verificável

## Base encontrada
ZIP com página inicial, regras pedagógicas e duas migrações SQL. Sem runtime, package.json, autenticação ou painéis. A base foi ampliada sem gerador nem substituição desnecessária.

## Implementado no código
- Fundação Next.js, TypeScript, Tailwind e layout dark responsivo; página inicial preservada.
- Supabase SSR, proteção server-side, login/logout, confirmação e recuperação de senha.
- Convites com hash, expiração, revogação, email opcional e consumo transacional no trigger Auth.
- Convites com data/hora precisa, estados disponível/utilizado/expirado/revogado, conta consumidora e datas completas; consumo/revogação irreversíveis e rollback de cadastro testado localmente.
- Inicialização privada de um único proprietário.
- Painéis com consultas reais, formação, aulas Markdown, anotações privadas, submissões e histórico.
- Gestão de convites, pesquisa de alunos, bloqueio, correção manual e exceções justificadas.
- Editor administrativo de módulos, aulas Markdown com pré-visualização e atividades; rascunhos/publicação, ordenação e auditoria. Critérios e estrutura são protegidos quando já existem progresso ou entregas.
- Página administrativa de histórico com as 100 ações mais recentes.
- Migração 003: cursos, isolamento, progressão no banco, recuperação, auditoria e funções de certificados.
- Testes PostgreSQL/RLS e regras pedagógicas; CI sem publicação.
- Matrículas por curso; área de estudo do proprietário respeita os mesmos bloqueios, sem autoaprovação de entregas. Abertura/fechamento de matrículas no catálogo é explícita e auditada.
- Professor de IA implementado com contexto da aula, histórico privado, cotas persistentes e integração Responses API. Desativado por padrão; ainda sem teste de chamada real.
- Limite transacional de dez contas incluindo proprietário (migração 008).
- Preparação de build para Netlify Free, diagnóstico de configuração sem segredos e relatório de hospedagem.
- Primeiro lote didático: três aulas de lógica (3 horas previstas), exemplos executáveis testados, exercícios e questionários comentados; importação como rascunhos sem sobrescrever aulas existentes.

## Limites de verificação
- Supabase conectado e nove migrações aplicadas em 17/11/2026. Triggers e RLS verificados no PostgreSQL remoto com fixtures revertidas; login via navegador, emails, bootstrap e fluxos completos ainda não validados.
- Testes locais usam PostgreSQL PGlite e esquema Auth mínimo.
- Não houve revisão visual em navegador ou testes completos de acessibilidade/dispositivos.
- Não houve deploy, domínio, backups ou operação em produção. A preferência atual é hospedagem gratuita para dez pessoas, com Netlify + Supabase, substituindo a preferência anterior por VPS. Os limites de planos gratuitos impedem promessa de disponibilidade contínua.

## Falta para cumprir o documento mestre
- Configuração avançada de regras, versionamento de cursos em andamento e criação de outras formações pela interface.
- Validação E2E das matrículas e da experiência do proprietário como aluno. Projetos com correção humana precisam de avaliação independente; a IA não concede aprovação oficial.
- Restante do currículo didático de 234 horas, provas, projetos e recuperação; três aulas não equivalem ao curso completo.
- Correção automática e execução isolada de código.
- Relatórios e perfil detalhado, inatividade e notificações.
- Certificado PDF e página pública: existem funções de banco, mas não recurso completo.
- Biblioteca, glossário, calendário, dúvidas, portfólio e gamificação.
- MFA obrigatório, proteção adicional contra abuso e testes de concorrência.
- E2E com Supabase real, SMTP, acessibilidade e responsividade.
- Backups testados, privacidade/retenção, monitorização e publicação autorizada.

Não considerar etapas dependentes de serviços concluídas só porque o build passa. Não admitir alunos reais ainda.

## Verificações locais desta versão
- A suíte anterior de 23 testes foi aprovada ao implementar matrículas. Nesta continuação foram executados apenas 8 testes novos/pendentes: tutor e capacidade (5), conteúdo (2), publicação do catálogo (1). Não houve repetição da suíte inteira.
- Build de produção com verificação TypeScript.
- Páginas públicas responderam HTTP 200; áreas privadas redirecionaram ao login no ambiente sem Supabase.
- Repositório conectado a Ghostsx777/Progeto-Curso. A pasta de trabalho atual é devpath-github; devpath-academy contém a cópia anterior à ligação ao GitHub.
- `check:setup` confirmou Auth acessível e tabelas remotas disponíveis. Cadastro público ainda habilitado na configuração Auth e precisa ser desativado (o trigger já rejeita conta sem convite). Concorrência com dez sessões reais, SMTP e API OpenAI permanecem sem validação externa.

## Nova referência de produto
O anexo recebido está preservado em `docs/MASTER_SPECIFICATION_REFERENCE.txt`. A comparação com o código e a precedência da regra de convite de uso único estão em `docs/SPECIFICATION_AUDIT.md`. Nenhuma exceção de reutilização de convite será implementada.
As decisões mais recentes de hospedagem, limites e verificação estão em `docs/FREE_HOSTING_AUDIT.md`, que prevalece sobre a preferência histórica por VPS.
