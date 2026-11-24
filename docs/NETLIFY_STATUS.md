# Publicação — 18/11/2026

Endereço oficial: https://devpachtacademy.netlify.app

- Adaptador Next.js explícito corrigiu os erros 404. Página inicial e login responderam 200; áreas privadas redirecionaram ao login.
- Configurados no painel: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL e AI_TUTOR_ENABLED=false.
- SUPABASE_SERVICE_ROLE_KEY salva como Secret, somente no contexto Production (escopos Builds, Functions e Runtime disponíveis no plano). Nenhuma senha de banco enviada à hospedagem.
- Este commit inicia nova publicação para incorporar as variáveis. Login autenticado ainda depende da inicialização do proprietário e da verificação seguinte.
- Não houve ativação de plano pago ou IA.

## Continuação em 19/11/2026

- Nova publicação concluída: / e /login retornam 200 sem aviso de configuração; /painel e /admin retornam 307 para /login; /nova-senha retorna 200.
- Site URL do Supabase atualizado para a origem HTTPS acima. Allowlist contém somente /auth/confirm e /nova-senha dessa origem.
- Proprietário criado via Auth API. Login real com credencial inicial aleatória e leitura da função admin confirmados; sessão de verificação encerrada. A credencial aleatória não foi armazenada. Link temporário para definição de senha salvo exclusivamente em arquivo local ignorado pelo Git.
- Erro real identificado: app_metadata pode ser gravado pelo Auth após INSERT. Migração 011 valida a linha final no COMMIT, preservando atomicidade, bloqueios e rejeição de cadastro sem convite. Migração 010 concede somente execução dos triggers ao papel interno Auth; essa permissão isolada não corrigia o problema de metadados.
- Novo teste do fluxo INSERT/UPDATE/COMMIT aprovado. Testes afetados de convite único/expiração, revogação, rollback e capacidade aprovados. Não houve repetição da suíte inteira.
- O painel exige SMTP próprio para editar os templates de email. Nenhum provedor foi contratado ou configurado.

Pendências: usuário definir senha e validar sessão no navegador; SMTP e templates para convidados/recuperação; testes E2E de email e concorrência. Curso completo e demais recursos continuam conforme IMPLEMENTATION_STATUS.md. Esta etapa não conclui o produto inteiro.

## Mudança de domínio
A configuração versionada de produção define NEXT_PUBLIC_APP_URL=https://devpachtacademy.netlify.app. Convites, confirmação de cadastro e recuperação usam essa variável no build. A navegação interna usa caminhos relativos. O callback de Auth redireciona dentro da origem da requisição.

No Supabase, configurar Site URL como https://devpachtacademy.netlify.app e permitir os destinos exatos https://devpachtacademy.netlify.app/auth/confirm e https://devpachtacademy.netlify.app/nova-senha. A configuração remota e a entrega de emails reais precisam de verificação autenticada. Para convites já distribuídos e ainda válidos, preservar /convite/ e o token ao trocar o domínio.

Verificação HTTP: início, login e recuperação retornaram 200. Painel e administração redirecionaram ao login; callback sem token redirecionou ao login no novo domínio.
