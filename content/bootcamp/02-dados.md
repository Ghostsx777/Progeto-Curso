# Dados, variáveis e cálculos

## Objetivos
Representar números, textos e valores lógicos; distinguir `const` e `let`; calcular uma média respeitando parênteses; reconhecer que texto contendo dígitos não é automaticamente um número. Distribua a hora entre leitura (20 minutos), experimentação (15) e exercícios (25).

## Pré-requisitos
Concluir a aula de programas e algoritmos. Você deve conseguir abrir o console, definir uma função e chamá-la com valores. Se ainda confunde entrada com saída, repita o orçamento de material escolar antes de avançar.

## Explicação
Dados são representações de informações. Para um programa, a idade `18`, o nome `"Ana"` e a afirmação `true` têm naturezas diferentes. JavaScript chama essas naturezas de tipos. Nesta aula usaremos `number` para números, `string` para texto e `boolean` para verdadeiro ou falso.

Escrevemos números sem aspas: `18`, `7.5`, `0`. O separador decimal do código é o ponto, mesmo que na escrita cotidiana você use vírgula. Escrevemos textos entre aspas, como `"18"`. Esse texto tem dois caracteres; não é a mesma representação que o número 18. `true` e `false` são valores lógicos, sem aspas. O texto `"false"` não é o booleano `false`.

Uma variável nos permite dar um nome a um valor. `const nome = "Ana"` cria uma associação que não pode ser reatribuída. `let tentativas = 0` permite que depois escrevamos `tentativas = tentativas + 1`. Use `const` quando não pretende reatribuir e `let` quando a mudança faz parte do algoritmo. Essa distinção não significa que `const` torna qualquer objeto imutável; veremos objetos mais adiante.

O sinal `=` faz uma atribuição. Ele não pergunta se dois valores são iguais. Em `tentativas = tentativas + 1`, primeiro calculamos o lado direito usando o valor atual; depois guardamos o novo resultado. Se antes era 0, passa a ser 1. A comparação entre valores será tratada na próxima aula.

## Conceitos e diagrama
```text
nome do dado        tipo          exemplo
nomeAluno           string        "Ana"
nota                number        82
entregaConcluida     boolean       true
```
Os operadores `+`, `-`, `*` e `/` representam soma, subtração, multiplicação e divisão quando aplicados a números. Multiplicação e divisão têm prioridade sobre soma e subtração. Parênteses tornam explícita a ordem desejada.

Para a média de duas notas, somamos as notas e dividimos essa soma por dois. `80 + 60 / 2` produz 110, pois calcula primeiro 60 dividido por 2. `(80 + 60) / 2` produz 70, o resultado esperado. O problema precisa definir se essa média é simples ou ponderada; não escolha uma fórmula apenas porque parece familiar.

## Exemplo executável
Digite no console:
```javascript
function mediaDeNotas(primeira, segunda) {
  return (primeira + segunda) / 2;
}
```
Execute `mediaDeNotas(80, 60)`. Resultado esperado: `70`. Depois experimente `mediaDeNotas(65, 85)`: o esperado é `75`. Os parâmetros deste exemplo devem ser números finitos de 0 a 100. A função mostra apenas a fórmula; a validação será acrescentada na próxima aula.

## Explicação do código
Os dois parâmetros recebem as notas. Os parênteses dentro do `return` agrupam a soma. `/ 2` divide o resultado por dois porque existem exatamente duas notas. A função devolve um número e não altera seus argumentos. Trocar os nomes por `a` e `b` não muda a matemática, mas reduz a clareza sobre o que está sendo calculado.

Teste `typeof 80` e `typeof "80"` no console. O primeiro retorna `"number"` e o segundo, `"string"`. Agora observe `"80" + "60"`: o resultado é o texto `"8060"`, uma concatenação. Uma função que espera números pode gerar resultados errados ao receber textos. Dados de formulários frequentemente chegam como texto; será necessário converter e validar, não apenas presumir que estejam corretos.

## Exercício guiado
Declare `const primeiraNota = 70` e `const segundaNota = 90`. Chame `mediaDeNotas(primeiraNota, segundaNota)` e confira 80. Tente reatribuir `primeiraNota = 75`: o console deverá indicar que não é permitido reatribuir uma constante. Esse erro não é uma reprovação; ele informa que a operação não combina com a declaração escolhida.

Agora use um nome novo, `let notaEmRevisao = 60`. Reatribua para 75 e confira o valor. Não redeclare várias vezes um mesmo `const` no mesmo console; use nomes novos ou uma aba limpa se encontrar erro de identificador já declarado.

## Exercícios independentes
1. Classifique `"100"`, `100`, `false` e `"false"` pelos três tipos apresentados.
2. Calcule manualmente e confira as médias de 0 e 100, 70 e 70, 55 e 75.
3. Explique com suas palavras por que `primeira + segunda / 2` não implementa a média.
4. Planeje variáveis para um produto: nome, preço, quantidade e indicação de disponibilidade. Escolha o tipo de cada uma e justifique.

## Desafio prático
Crie uma função para calcular a média de três notas. Antes de programar, escreva a fórmula e três exemplos com resultados esperados, incluindo todas as notas iguais. Depois implemente e confira. Explique por que dividir por dois seria errado neste problema. Critérios: soma agrupada corretamente, divisão pela quantidade correta e exemplos com resultados conferidos.

## Erros comuns e boas práticas
Não coloque aspas em números que pretende somar. Não use vírgula como separador decimal no código. Não suponha que um resultado do tipo número prova que a entrada era válida: JavaScript pode fazer conversões inesperadas. Escolha nomes descritivos, mantenha as unidades claras e separe a fórmula da futura validação de entradas.

## Resumo
Tipos ajudam a representar a natureza dos dados. Variáveis nomeiam valores; `const` e `let` expressam a intenção de reatribuição. Parênteses preservam a fórmula desejada. Dados vindos de fora do programa precisam ser interpretados e validados antes de entrar em cálculos.

## Verificação de aprendizagem
1. Qual é a média de 55 e 75? **65**: a soma é 130, dividida por dois.
2. O que faz `=`? **Atribui um valor; não compara.**
3. `"7" + "3"` produz 10? **Não. Produz o texto "73".**
4. Qual declaração escolher para um contador que será incrementado? **`let`**, pois haverá reatribuição.

## Referências e revisão
Retome o exemplo de entrada/processamento/saída da aula anterior e identifique os tipos de suas entradas. O arquivo `content/bootcamp/examples/02-dados.mjs` contém a função testada. Na próxima aula, adicionaremos decisões para recusar entradas que não atendem aos requisitos.
