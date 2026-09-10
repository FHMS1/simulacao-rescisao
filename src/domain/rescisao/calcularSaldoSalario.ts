interface CalcularSaldoSalarioInput {
  salarioBase: number;
  diasTrabalhados: number;
}

export function calcularSaldoSalario({
  salarioBase,
  diasTrabalhados,
}: CalcularSaldoSalarioInput): number {
  if (!Number.isFinite(salarioBase) || salarioBase < 0) {
    throw new Error('Salário base deve ser um número não negativo');
  }

  if (!Number.isInteger(diasTrabalhados) || diasTrabalhados < 0 || diasTrabalhados > 31) {
    throw new Error('Dias trabalhados deve ser um inteiro entre 0 e 31');
  }

  return (salarioBase / 30) * diasTrabalhados;
}
