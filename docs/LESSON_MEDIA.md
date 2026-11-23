# Recursos didáticos — implementação local, 20/11/2026

Nenhuma migração, publicação de conteúdo, push ou deploy foi realizado nesta etapa.
O conteúdo continua em `lessons.body_md`, protegido pelas permissões existentes.

## Uso pelo administrador

Em Conteúdos, abra uma aula e expanda “Inserir e organizar recursos didáticos”.
Escolha imagem, vídeo YouTube, diagrama, código explicado, laboratório, caixa de atenção,
glossário ou referência. Preencha os campos e escolha o trecho após o qual inserir.
Use Editar/Subir/Descer para organizar os blocos. O Markdown continua editável.
“Visualizar” utiliza o mesmo leitor do aluno e não salva nem publica.
Salve com Publicado desmarcado para guardar um rascunho. Para publicar é necessário
confirmar a revisão; o servidor valida os blocos e verifica as referências HTTPS.
Links inacessíveis, privados ou que recusam HEAD impedem publicação, mas não o rascunho.
Objetivos e seções continuam sendo escritos no Markdown; títulos alimentam o sumário.
O tempo estimado utiliza o campo de duração já existente.

## Recursos e limites

- Imagens por URL: descrição alternativa, legenda, três larguras, alinhamento e zoom por
  diálogo com Escape. Carregamento tardio, dimensionamento responsivo e sem referenciador.
  Não há upload novo nem geração de versões menores: otimize o arquivo original.
  Permitidos raster em /media, Supabase deste projeto, Wikimedia e images.unsplash.com;
  o caminho precisa terminar em PNG/JPG/JPEG/WebP/AVIF/GIF. SVG externo é recusado.
- YouTube: incorporação oficial youtube-nocookie, somente após clique, sem autoplay.
  Disponibilidade, restrições regionais e permissão de incorporação dependem do autor.
- Mermaid: importação dinâmica, modo strict, limite de texto/arestas, sem links/HTML/configurações
  embutidas; resultado exibido em iframe sem scripts. Descrição textual disponível.
- Código: JavaScript, TypeScript, HTML/XML, CSS, SQL, Python e JSON, copiar, numeração,
  destaque de linhas, explicação, entrada/saída. Outras linguagens aparecem como texto seguro.
- HTML/CSS: apenas elementos/atributos inertes autorizados; iframe sem scripts nem origem
  compartilhada; CSP impede rede. Links, imagens, formulários, scripts e navegação são removidos.
- JavaScript: Worker dentro de iframe de origem opaca, sem rede/DOM/cookies; limite de
  execução de 1 segundo e saída de 8 mil caracteres/100 linhas. Exemplos síncronos apenas.
  Não é um contêiner com quota rígida de memória: não utilizar como ambiente hostil de produção.
- SQL: simulador didático limitado a SELECT sobre três registros fictícios. Não é PostgreSQL
  nem acessa o banco da plataforma. Algoritmo: demonstração de ordenação de três números.
- Verificação de saída dos laboratórios é autoestudo e nunca altera notas/progresso oficial.
- Referências: título, descrição, origem e link. Verificação no servidor com DNS/endereço
  IPv4 validado e fixado, redirecionamentos revalidados, limites de tempo/quantidade.
  Endereços especiais são recusados conservadoramente; não suporta destinos somente IPv6.
- Indicador de leitura é visual e não conclui a aula. Navegação anterior/próxima dentro do módulo.

## Arquivos

Componentes: lesson-content.tsx, lesson-diagram.tsx, lesson-playground.tsx, media-builder.tsx,
markdown-editor.tsx, content-form.tsx. Integração: painel/aula/[id]/page.tsx,
admin/content-actions.ts, globals.css. Bibliotecas locais: lesson-media.ts, playground.ts,
check-references.ts, lesson-review.ts. Dependências e lock atualizados; testes e configuração Playwright adicionados.
A rota /dev/lesson-preview exige desenvolvimento e LESSON_PREVIEW=true; retorna 404 em produção.
Não usa alunos reais e não grava no Supabase. Sua imagem é fornecida pelo teste de navegador.

## Dependências e custos

Adicionadas mermaid, highlight.js, unified e remark-parse; @playwright/test apenas para testes.
Sem serviço pago ou cobrança por uso introduzidos. Mermaid usa modo strict conforme
https://mermaid.js.org/config/usage.html (consultado em 20/11/2026).

## Verificação

`npm test`: 36 testes passaram, incluindo RLS/convites/publicação em banco local PGlite.
Testes novos: URLs, HTML indevido, blocos, referências privadas, SQL e envelope JavaScript.
A validação visual utiliza Edge sem interface, em 390 e 1280 pixels; vídeo é interceptado
no teste determinístico para verificar carregamento por clique e ausência de autoplay.
Persistência/publicação remotas não foram exercitadas para respeitar a proibição de alterações.
Isso não conclui o conteúdo do bootcamp: a produção das aulas restantes é trabalho separado.

Resultados finais locais: TypeScript aprovado; compilação de produção aprovada com Webpack.
O comando build agora usa `next build --webpack`, alternativa suportada, pois o Turbopack
falhou internamente ao iniciar o processo CSS nesta máquina. A configuração Netlify permanece.
Editor/preview/reordenação e ausência de rolagem horizontal passaram em 390 e 1280 pixels.
Zoom, copiar, Mermaid, JS (incluindo loop infinito), HTML sanitizado, SQL e ordenação verificados.
Verificador real de referência MDN retornou sucesso. Reprodução audiovisual real do YouTube
não foi confirmada; o teste determinístico valida a integração e não a disponibilidade do vídeo.
Para repetir somente UI: `npm run test:browser` (Edge instalado; servidor local automático).

Também passou o teste de rascunho/revisão/referências na publicação (5 testes novos no total).
Capturas de celular conferidas visualmente; sem estouro horizontal.

Produção local: página inicial HTTP 200; /dev/lesson-preview HTTP 404. Servidores de teste encerrados.
