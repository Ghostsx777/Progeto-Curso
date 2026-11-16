# Auditoria de publicação — 16/11/2026

## 1. O que existe
Next.js 16 App Router, React, TypeScript, Tailwind e Supabase SSR/Auth/PostgreSQL. A aplicação usa Server Actions e precisa de runtime de servidor; GitHub Pages/exportação HTML não atendem. Não há Firebase, segundo banco ou dependência de disco local para progresso. `netlify.toml` prepara o build, mas não cria/publica site.

As matrículas e o modo de estudo do proprietário foram implementados. Na área de estudo, os bloqueios valem também para ele e sua própria entrega não pode ser corrigida por ele. O tutor possui contexto limitado da aula, histórico privado, consentimento, limites persistentes e acesso à Responses API somente pelo servidor. Não possui ferramentas administrativas.

## 2. Configuração real encontrada
`.env.local` ausente e as quatro variáveis Supabase/aplicação ausentes no ambiente verificado. `npm run check:setup` confirmou configuração incompleta. Não foi possível testar Supabase remoto, SMTP, login, recuperação ou sessões simultâneas. Não afirmar que o banco já está funcionando.

## 3. Correções e conclusão do trabalho pendente
- Finalização da integração e testes locais pendentes do tutor, com desativação explícita por padrão (`AI_TUTOR_ENABLED=false`). Não houve chamada paga.
- Matrículas separadas por conta e curso; área de estudo aplica acesso pedagógico mesmo ao proprietário.
- Limite de dez contas incluindo o proprietário, validado por trigger com bloqueio transacional. Contas bloqueadas continuam contando. Não exclui contas preexistentes caso um banco tenha mais de dez; apenas impede novas admissões.
- Convites continuam com uso único, expiração, revogação, consumo transacional e proteção contra reativação.
- Configuração de build para Netlify e diagnóstico sem exibir segredos.

## 4. Dez pessoas simultaneamente
A arquitetura é apropriada para uma turma pequena: sessões independentes e banco centralizado. O limite de dez é de contas cadastradas, não de computadores conectados. Os testes locais verificam permissão e lotação, mas NÃO são teste de carga de dez sessões reais. Essa confirmação exige o projeto Supabase e um ambiente hospedado de teste.

## 5. Compartilhamento e persistência
Conteúdos publicados são compartilhados; progresso, notas, anotações e conversas são privados por conta. Consultas leem o Supabase e as mutações persistem nele. Alterações aparecem ao consultar/recarregar a página; não existe sincronização instantânea via Realtime nem edição colaborativa. Uma correção administrativa fica disponível para o aluno na consulta seguinte. Persistência após trocar de dispositivo está projetada, mas ainda sem E2E remoto.

## 6. Hospedagem recomendada
Netlify Free para a aplicação e Supabase Free para Auth/PostgreSQL, preservando a implementação existente. Não adicionar Netlify Database nem Firebase. A aplicação hospedada funciona sem o computador do proprietário ligado e pode usar endereço gratuito `nome.netlify.app` com HTTPS. Compatibilidade oficial inclui App Router, SSR, Server Actions e Route Handlers; a adaptação concreta do build deve ser conferida no primeiro deploy autorizado.

A preferência atual por gratuito substitui a preferência anterior por VPS. Nenhum VPS, domínio ou plano será contratado. Gratuito não significa disponibilidade contínua garantida: há limites de quota, inatividade e possíveis cold starts.

## 7. Custos e limites consultados
| Serviço | Previsão para início | Limites relevantes |
| --- | --- | --- |
| Netlify Free | US$ 0/mês, dentro da cota | 300 créditos/mês; deploy de produção custa 15 créditos, além de tráfego e computação. Ao atingir limites, sites podem pausar. Sem ativar plano pago/autorrecarregamento. |
| Supabase Free | US$ 0/mês, dentro da cota | 500 MB de banco; 50 mil usuários ativos/mês; 5 GB de saída. Pausa por baixa atividade e ausência de backups automáticos no Free. |
| Professor de IA | US$ 0 enquanto desativado | API não é incluída nesta hospedagem. Se ativada, custo depende de modelo e tokens; 20 perguntas/aluno/dia e 200 no total são limites de uso, não garantia de orçamento monetário. |
| Email de autenticação | A definir antes de convidar pessoas | SMTP padrão Supabase é restrito e inadequado para a turma. É necessário configurar um provedor SMTP, avaliar sua cota gratuita e verificar remetente. Não presumir envio gratuito ilimitado nem comprar domínio. |

Dez pessoas não garantem consumo baixo: downloads, tamanho das páginas e frequência de uso contam. Não executar pings artificiais para contornar pausa. Revise os planos no dia da publicação.

Fontes oficiais consultadas:
- https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
- https://www.netlify.com/pricing/
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://supabase.com/docs/guides/auth/auth-smtp
- https://developers.openai.com/api/reference/resources/responses/methods/create

## 8. Como obter o link (ainda depende de autorização)
1. Criar/configurar Supabase de desenvolvimento. Aplicar as migrações em ordem; não reaplicar migrações já executadas. Configurar confirmação de email, cadastro público desativado, SMTP e templates descritos no README.
2. Preencher `.env.local` localmente. Rodar `npm run check:setup`. Criar o proprietário pelo procedimento privado e testar convite, login, recuperação e isolamento com contas fictícias. Nunca compartilhar a chave de serviço no chat ou no GitHub.
3. Validar o lote de conteúdo com `node scripts/import-content.mjs --dry-run`. Importar com `--apply` apenas quando o banco estiver configurado; o importador cria rascunhos, preserva aulas existentes e recusa módulos já utilizados. O bootcamp não fica completo por importar esse lote.
4. Após autorização de publicação, importar `Ghostsx777/Progeto-Curso` no Netlify Free. Build `npm run build`, saída `.next`, Node 24. Confirmar detecção do adaptador Next.js. Não habilitar um segundo banco nem adicionar cobrança.
5. Configurar as variáveis no painel Netlify. URL e chave pública participam do build/runtime; a chave de serviço e qualquer chave OpenAI são segredos de servidor. Manter `AI_TUTOR_ENABLED=false` para custo zero de IA.
6. Definir `NEXT_PUBLIC_APP_URL` para a URL HTTPS atribuída. Atualizar Site URL e redirect allowlist do Supabase para `/auth/confirm` e `/nova-senha` nessa origem. Não usar curingas amplos.
7. Testar em duas redes e navegadores distintos: cadastro por convites diferentes, tentativa de reutilização, login, persistência, dados privados, correção e recuperação. Testar disputa simultânea pelo mesmo convite e pela última vaga em banco de teste.
8. Só então distribuir o link aos convidados. Um push no GitHub pode disparar deploy após vincular o Netlify; configurar a política de publicação antes de vincular para não publicar sem querer.

## Conteúdo educacional
Antes desta etapa não havia aulas completas versionadas. O primeiro lote contém três aulas de 60 minutos (3 horas previstas), exemplos executáveis e testes: programas/algoritmos, dados/cálculos, decisões/validação. Os exemplos são exercícios didáticos; suas limitações são explicitadas nas aulas.

O bootcamp de 234 horas NÃO está completo. Faltam as demais aulas, avaliações oficiais, projetos, recuperação e revisão pedagógica ampla. Os questionários deste lote são de autoestudo com respostas comentadas, não um motor de provas automáticas. A auditoria estrutural não certifica a qualidade pedagógica sozinha. Não anunciar o curso como concluído.

## Pendências que não dependem apenas de build
Supabase real; SMTP; E2E e concorrência multi-conexão; primeira execução do adaptador Netlify; avaliação visual/mobile; restante do currículo; certificados PDF; recursos complementares; backups/restauração testados. O tutor está implementado e testado localmente, mas a chamada real à OpenAI depende de configuração e custos autorizados. Não houve publicação nesta etapa.
