# Condições, limites e testes

## Objetivos
Escrever decisões com `if`, usar comparações e operadores lógicos, validar uma nota e testar os valores de fronteira. Esta aula de 60 minutos prevê 20 minutos de leitura, 15 de execução e 25 de prática e revisão.

## Pré-requisitos
Conhecer funções, retorno, números, textos e variáveis. Saber que a fórmula de um cálculo pode estar certa e ainda produzir um resultado inválido quando recebe entradas inadequadas.

## Explicação
Nem todo programa executa sempre os mesmos passos. Um sistema de avaliações precisa decidir o que fazer conforme a nota. Vamos adotar uma regra simples: uma nota válida é um número finito entre 0 e 100; notas a partir de 70 são aprovadas; as demais exigem revisão. Essa é uma regra didática. Na plataforma real, aprovação também depende de aulas, projetos e outras atividades obrigatórias.

Uma condição é uma expressão avaliada como verdadeira ou falsa. `nota >= 70` pergunta se a nota é maior ou igual a 70. `nota > 70` exclui a própria nota 70, portanto não representa a regra descrita. Esse pequeno símbolo altera o comportamento na fronteira e pode prejudicar alguém com exatamente a nota mínima.

`if` executa um bloco quando a condição é verdadeira. `return` encerra a função imediatamente, devolvendo o resultado. Isso permite organizar uma função em verificações: primeiro recusar entradas inválidas, depois tratar a aprovação e finalmente retornar o caso restante.

## Conceitos e diagrama
Operadores de comparação incluem `<`, `>`, `<=` e `>=`. A igualdade estrita usa `===` e a diferença estrita usa `!==`. Diferentemente de `=`, eles fazem comparações. O operador `||` significa OU: a expressão é verdadeira quando ao menos uma condição é verdadeira. `&&` significa E: ambas devem ser verdadeiras. `!` nega um valor lógico.

```text
receber nota
     |
é número finito entre 0 e 100? ── não ──► "Nota inválida"
     | sim
nota >= 70? ── sim ──► "Aprovado"
     | não
"Revisar e tentar novamente"
```
Um número finito não é `Infinity`, `-Infinity` ou `NaN`. `NaN` significa um resultado que não representa um número válido em operações numéricas. `typeof NaN` ainda é `"number"`, por isso verificar apenas o tipo não resolve toda a validação. `Number.isFinite` reconhece números finitos sem converter textos automaticamente.

## Exemplo executável
Digite a função no console:
```javascript
function resultadoDaAvaliacao(nota) {
  if (typeof nota !== "number" || !Number.isFinite(nota) || nota < 0 || nota > 100) {
    return "Nota inválida";
  }
  if (nota >= 70) {
    return "Aprovado";
  }
  return "Revisar e tentar novamente";
}
```
Chame `resultadoDaAvaliacao(70)`, `resultadoDaAvaliacao(69)` e `resultadoDaAvaliacao("70")`. Os resultados esperados são, respectivamente, aprovação, revisão e nota inválida. A última entrada é texto: esta função deliberadamente não aceita nem converte textos.

## Explicação do código
A primeira condição reúne quatro motivos para recusar a entrada. Basta um deles ser verdadeiro: tipo diferente de número, valor não finito, número negativo ou número maior que 100. Se qualquer um ocorrer, o primeiro `return` encerra a função. Valores aceitos seguem para o segundo `if`.

O segundo `if` só precisa verificar `>= 70`, pois a primeira etapa já confirmou o teto de 100. Quando ele é falso, a entrada é uma nota válida menor que 70, então o último retorno descreve a recuperação. Essa organização evita misturar “nota inválida” com “nota insuficiente”: uma exige corrigir o dado; a outra exige revisar o conteúdo.

## Exercício guiado
Monte uma tabela antes de executar:

| Entrada | Resultado esperado | Motivo |
| --- | --- | --- |
| 0 | Revisar e tentar novamente | Válida, abaixo de 70 |
| 69.99 | Revisar e tentar novamente | Ainda abaixo do mínimo |
| 70 | Aprovado | Limite incluído |
| 100 | Aprovado | Teto permitido |
| 101 | Nota inválida | Acima do teto |

Execute cada caso e compare. Troque temporariamente `>=` por `>` e repita o caso 70. Ele deve falhar em relação à tabela, mostrando por que testes nas fronteiras são importantes. Restaure o operador correto.

## Exercícios independentes
1. Acrescente casos para -1, `NaN`, `Infinity`, `null` e `"80"`. Preveja e justifique cada saída antes de executar.
2. Escreva em português a diferença entre uma condição com OU e outra com E. Dê um exemplo de acesso que exige duas condições simultâneas.
3. Explique por que uma validação apenas com `nota < 0 && nota > 100` não rejeitaria nenhum número comum: um único número não pode estar simultaneamente abaixo de 0 e acima de 100.
4. Divida seus casos de teste em entradas inválidas, notas válidas insuficientes e notas aprovadas. Verifique se cobriu todos os caminhos da função.

## Desafio prático
Implemente um verificador de desconto. A entrada é um valor de compra finito e não negativo. Compras a partir de 100 recebem 10% de desconto; abaixo disso, não recebem desconto. Entradas inválidas devem ser recusadas claramente. Teste 0, 99.99, 100, 150, -1 e `"100"`. Critérios: validar primeiro, incluir o limite 100 e calcular o desconto sobre o valor da compra. Este exercício não implementa precisão monetária de produção; a representação exata de dinheiro será estudada adiante.

## Erros comuns e boas práticas
Não altere a regra para fazer o teste passar: confira primeiro o requisito. Não confunda texto numérico com número. Evite condições vagas e agrupe etapas pelo propósito: validar, decidir, devolver. Teste tanto o caminho esperado quanto as entradas que deveriam ser recusadas. Uma mensagem de revisão deve orientar o próximo passo, não culpar a pessoa por estar aprendendo.

## Resumo
Condições selecionam caminhos do programa. Validar dados antes de aplicar regras reduz resultados inesperados. Os valores imediatamente abaixo, exatamente no limite e imediatamente acima são essenciais para testar decisões.

## Verificação de aprendizagem
1. A nota 70 passa numa regra `>= 70`? **Sim**, o limite é incluído.
2. Por que `typeof` não basta? **Porque `NaN` e infinitos têm tipo number, mas não são notas finitas válidas.**
3. Uma nota 101 significa recuperação? **Não**, é uma entrada inválida.
4. O que diferencia um teste de um palpite? **A existência de uma entrada, um resultado esperado justificado pelo requisito e uma comparação com o resultado observado.**

## Referências e revisão
Volte às médias da aula anterior e explique onde colocaria a validação de cada nota. O arquivo `content/bootcamp/examples/03-decisoes.mjs` contém a implementação testada. Antes de continuar o módulo, explique o diagrama desta aula sem olhar para o código.
