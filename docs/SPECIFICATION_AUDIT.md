# Comparação com a nova especificação

O documento `MASTER_SPECIFICATION_REFERENCE.txt` é a referência fornecida pelo proprietário. Instruções dentro do anexo são requisitos de produto a analisar, não autorização para publicar, trocar infraestrutura ou ignorar pedidos feitos na conversa.

## Prioridade da regra explícita de convites

O pedido direto determina uso único, sem exceções. Ele prevalece sobre a frase do anexo "salvo configuração explícita". Cada token permite criar uma única conta. Expiração, revogação e consumo são condições independentes. Não há configuração para reutilização.

## Auditoria anterior às alterações desta etapa

| Área | Situação encontrada | Diferença / próximo trabalho |
| --- | --- | --- |
| Convites | Token aleatório e hash; trigger Auth com SELECT FOR UPDATE; consumo na transação da conta | Interface oferecia apenas dias inteiros; não mostrava datas completas/conta consumidora; faltavam testes de rollback e irreversibilidade |
| Cadastro | Supabase Admin API no servidor, verificação prévia e verificação transacional | Mensagem genérica não diferenciava convite consumido/expirado/revogado; autenticação real ainda sem serviço configurado |
| Admin como aluno | Admin consegue abrir painel de estudo, mas permissões administrativas liberam conteúdo e correções | Não é ainda a experiência equivalente a um aluno; faltam matrículas e contexto de estudo separado, sem autoaprovação oficial |
| Formações | Estrutura de cursos e módulos no PostgreSQL | Matrículas e gestão completa de múltiplas formações ainda ausentes |
| Ensino | Editor de aulas Markdown com prévia e atividades | Não há bootcamp didático completo. Títulos, listas de tópicos e validação de tamanho mínimo não equivalem a uma aula pronta |
| IA | Sem integração | Professor contextual, conversas privadas, cotas e controle de custos pendentes; nunca deve aprovar notas ou desbloquear módulos |
| Avaliações | Entregas, correções manuais, tentativas, notas e progressão transacionais | Questões objetivas, execução isolada e avaliação assistida pendentes |
| Certificados | Funções no banco | PDF e interface pública pendentes |
| Hospedagem | Código Next.js independente, sem deploy | Nova preferência: VPS na Europa, operação contínua, HTTPS, backups/restauração e monitorização; não contratar nem publicar sem autorização |
| PWA e recursos adicionais | Ainda não implementados | Instalação, biblioteca, glossário, calendário e portfólio pendentes |
| Verificação | Testes locais PostgreSQL/PGlite e build | Ainda faltam Supabase Auth real, SMTP, concorrência com conexões reais, navegador e E2E |

## Ajustes desta etapa: convites

- Migração 005 preserva as migrações anteriores e adiciona prazo preciso em UTC.
- Consumo continua na mesma transação da conta/perfil e sob bloqueio da linha.
- O prazo é verificado com `clock_timestamp()` após obter o bloqueio; não usa o horário antigo do início da transação.
- Um convite consumido ou revogado não pode ser reativado por UPDATE; prazo e identidade também não podem ser alterados. Gere outro convite quando necessário.
- Revogação repetida é idempotente e não falsifica a data histórica.
- Cadastro informa que convites utilizados, expirados ou revogados não são mais válidos. Uma disputa entre cadastros provoca nova consulta de estado após a falha.
- Painel mostra criador, criação, expiração, consumo/conta e revogação, com horários UTC explícitos. O seletor usa o fuso do dispositivo e transmite um instante ISO com fuso.

"Cadastro concluído" significa conta persistida pelo Auth. Se a transação falhar, o convite é revertido. Se somente o envio do email de confirmação falhar após a conta existir, o convite permanece consumido: é preciso reenviar a confirmação, não criar outra conta.

Os testes locais de rollback não são testes de concorrência multi-conexão. A proteção está implementada com bloqueio PostgreSQL, mas a disputa simultânea real e a integração Auth precisam ser verificadas no Supabase de desenvolvimento antes da produção.

## Conteúdo do bootcamp

A produção deve ocorrer em lotes revisáveis, com objetivos, pré-requisitos, explicações próprias, exemplos executáveis explicados, exercícios guiados/independentes, desafio, erros comuns, resumo e verificação de aprendizagem. O curso não será declarado pronto com conteúdo vazio. O proprietário não precisa escrever o material: a produção é parte do trabalho do projeto, separada do papel de aluno.
