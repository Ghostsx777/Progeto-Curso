# Checklist de segurança antes de produção

- [ ] Criar o projeto Supabase e configurar Auth.
- [ ] Desativar cadastro público; permitir apenas convite.
- [ ] Criar o primeiro admin manualmente e proteger MFA.
- [ ] Nunca expor a service role key no cliente.
- [ ] Validar tokens de convite no servidor, armazenar somente hash, expirar e consumir atomicamente.
- [ ] Testar RLS com duas contas de aluno e uma conta admin.
- [ ] Garantir que aluno A não lê dados de aluno B.
- [ ] Garantir que aluno não consegue alterar nota, papel, aprovação ou estado de módulo.
- [ ] Fazer desbloqueio de módulos no servidor.
- [ ] Limitar tentativas e aplicar proteção contra abuso.
- [ ] Configurar backups, monitorização e recuperação.
- [ ] Publicar política de privacidade e retenção de dados.
- [ ] Testar exportação e eliminação de dados conforme obrigações legais aplicáveis.
- [ ] Revisão de segurança independente antes de aceitar utilizadores reais.
