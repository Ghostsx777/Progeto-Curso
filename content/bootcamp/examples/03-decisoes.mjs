export function resultadoDaAvaliacao(nota) {
  if (typeof nota !== "number" || !Number.isFinite(nota) || nota < 0 || nota > 100) {
    return "Nota inválida";
  }
  if (nota >= 70) {
    return "Aprovado";
  }
  return "Revisar e tentar novamente";
}
