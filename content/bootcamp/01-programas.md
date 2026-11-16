# Programas, algoritmos e resultados

## Objetivos
Ao terminar, você deverá distinguir programa e algoritmo, descrever entrada/processamento/saída e prever o resultado de um cálculo antes de executá-lo. Reserve 15 minutos para leitura, 15 para experimentar e 30 para exercícios e revisão.

## Pré-requisitos
Nenhum conhecimento de programação. Você precisa de um navegador em um computador. No celular, leia e resolva o pseudocódigo; deixe a execução no console para um computador. Não precisa instalar ferramentas nesta aula.

## Explicação
Um computador executa instruções. Ele não entende automaticamente a intenção de quem escreveu essas instruções. Se você pede para multiplicar dois valores, ele multiplica; não percebe que você queria somar. Programar envolve definir um problema, representar os dados, escrever passos e conferir se o resultado atende ao problema.

Hardware é a parte física, como processador, memória e teclado. Software são os programas e os dados que usamos. O sistema operacional, por exemplo Windows ou Linux, coordena recursos e permite executar outros programas. O navegador é um programa que consegue interpretar páginas e executar JavaScript, a linguagem que experimentaremos.

Um algoritmo é uma sequência organizada de passos para resolver uma tarefa. Pode existir em linguagem natural, desenho ou código. Um programa é uma implementação executável desses passos em uma linguagem. O mesmo algoritmo pode ser escrito em JavaScript, Python ou outra linguagem.

Imagine calcular uma compra de três cadernos, cada um custando 12 unidades monetárias. O problema informa o preço de um caderno e a quantidade. O algoritmo multiplica os dois. O resultado é 36. A entrada não é o total: são os dados a partir dos quais o total será calculado.

## Conceitos e diagrama
```text
ENTRADA                 PROCESSAMENTO             SAÍDA
preço = 12     ──────►   preço × quantidade  ────►  total = 36
quantidade = 3
```
Uma variável é um nome associado a um valor. Nesta aula, `preco` e `quantidade` nomeiam entradas. Uma função é um trecho reutilizável de programa: recebe entradas e pode devolver uma saída. Ela evita reescrever o mesmo cálculo para cada compra. Vamos aprofundar esses conceitos nas aulas seguintes.

Em pseudocódigo, uma notação para pensar sem se preocupar com uma linguagem específica:
```text
receber preço
receber quantidade
calcular total como preço multiplicado por quantidade
mostrar total
```
Observe que a ordem importa. Não conseguimos calcular um total usando uma quantidade que ainda não foi definida. Ao escrever passos, substitua expressões vagas como “calcular corretamente” por operações que outra pessoa consiga seguir.

## Exemplo executável
Abra uma aba vazia no navegador e suas ferramentas de desenvolvimento: normalmente F12 ou o menu “Inspecionar”. Selecione a aba Console. Digite você mesmo o exemplo. Não desative proteções de colagem do navegador. Execute apenas código que compreende e nunca cole comandos desconhecidos em páginas com contas abertas.

```javascript
function totalCompra(preco, quantidade) {
  return preco * quantidade;
}
```
Depois digite `totalCompra(12, 3)` e pressione Enter. O resultado esperado é `36`. Digite `totalCompra(5, 4)`: deverá obter `20`. Se o console mostrar `undefined` imediatamente após definir a função, isso não indica falha; definir a função e chamá-la são etapas distintas.

## Explicação do código
`function` anuncia a definição de uma função. `totalCompra` é o nome escolhido. Os parênteses contêm os parâmetros, nomes que receberão os valores fornecidos quando chamarmos a função. As chaves delimitam o corpo. O símbolo `*` significa multiplicação. `return` devolve o resultado ao código que chamou a função. A função calcula, mas não desenha uma página nem salva a compra num banco.

Na chamada `totalCompra(12, 3)`, o primeiro argumento vai para `preco`; o segundo, para `quantidade`. Usar nomes claros ajuda a entender o papel de cada valor. O exemplo pressupõe números não negativos; ele ainda não valida entradas. Reconhecer essa limitação faz parte da leitura do programa.

## Exercício guiado
Antes de executar, escreva o resultado previsto para uma compra de 8 unidades a 4 cada. Depois chame a função e compare. O esperado é 32. Agora mantenha o preço 4 e troque a quantidade por 0. O resultado 0 representa uma compra sem itens, não um erro do computador.

Modifique o cálculo temporariamente para `preco + quantidade`. A chamada com 4 e 8 retorna 12. O programa continua executando, mas resolve outro problema. Esse é um erro de lógica: executar sem mensagem de erro não prova que a solução está correta. Restaure a multiplicação.

## Exercícios independentes
1. Descreva entrada, processamento e saída de uma calculadora de idade que recebe ano de nascimento e ano atual. Explique por que ela pode errar antes do aniversário.
2. Preveja os resultados de `totalCompra(2, 6)`, `totalCompra(0, 7)` e `totalCompra(10, 1)` e depois confira.
3. Escreva pseudocódigo para calcular o perímetro de um retângulo a partir da largura e da altura. Desenhe o retângulo para justificar a fórmula.

## Desafio prático
Planeje um orçamento de material escolar com dois produtos. Para cada produto, registre preço e quantidade; calcule cada subtotal e depois some os subtotais. Use a função duas vezes. Entregue os dados de entrada, os passos e o total esperado. Critério: outra pessoa deve conseguir reproduzir o cálculo sem adivinhar nenhum dado.

## Erros comuns e boas práticas
Não confunda algoritmo com linguagem: JavaScript implementa passos, mas não decide quais passos resolvem seu problema. Não confunda nome com valor: `preco` pode receber números diferentes em chamadas diferentes. Faça uma previsão antes de executar, mude uma coisa por vez e mantenha um registro do que esperava e do que observou.

## Resumo
Programar é transformar um problema em passos verificáveis. Entrada são os dados recebidos; processamento são as operações; saída é o resultado. Uma função permite aplicar o mesmo cálculo a entradas diferentes. Um resultado plausível ainda precisa ser conferido.

## Verificação de aprendizagem
1. Qual é a saída para preço 6 e quantidade 5? **30**, porque multiplicamos preço unitário pela quantidade.
2. “Calcule o valor” é uma instrução suficientemente precisa? **Não**; é preciso definir quais dados e operações serão usados.
3. Um programa sem erros de sintaxe está necessariamente correto? **Não**; pode executar um algoritmo que não atende ao problema.
4. Como descobrir se houve um erro de lógica? **Comparando resultados com exemplos cujo resultado foi calculado independentemente.**

## Referências e revisão
Revise o diagrama de entrada/processamento/saída antes de continuar. Consulte o glossário desta própria aula: algoritmo, programa, variável, função, parâmetro e retorno. O exemplo também está no arquivo `content/bootcamp/examples/01-programas.mjs` do projeto e possui testes automatizados.
