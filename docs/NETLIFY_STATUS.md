# Publicação — 18/11/2026

Endereço: https://heroic-puppy-838831.netlify.app

- Adaptador Next.js explícito corrigiu os erros 404. Página inicial e login responderam 200; áreas privadas redirecionaram ao login.
- Configurados no painel: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL e AI_TUTOR_ENABLED=false.
- SUPABASE_SERVICE_ROLE_KEY salva como Secret, somente no contexto Production (escopos Builds, Functions e Runtime disponíveis no plano). Nenhuma senha de banco enviada à hospedagem.
- Este commit inicia nova publicação para incorporar as variáveis. Login autenticado ainda depende da inicialização do proprietário e da verificação seguinte.
- Não houve ativação de plano pago ou IA.

Pendências: URL e templates Auth, criação do proprietário, definição privada da senha, SMTP para convidados e testes E2E correspondentes. Curso completo e demais recursos continuam conforme IMPLEMENTATION_STATUS.md.
