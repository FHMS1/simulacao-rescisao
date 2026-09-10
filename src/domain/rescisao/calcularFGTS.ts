import type { FGTSRescisorio } from './tipos';

interface CalcularFGTSInput {
  baseFGTSMes: number;
  salarioReferencia: number;
  totalMeses: number;
  aliquotaMulta: number;
}

const ALIQUOTA_FGTS = 0.08;
const ALIQUOTAS_MULTA_VALIDAS = [0, 0.2, 0.4];

function validarValorNaoNegativo(valor: number, campo: string): void {
  if (!Number.isFinite(valor) || valor < 0) {
    throw new Error(`${campo} deve ser um número não negativo`);
  }
}

export function calcularFGTS({
  baseFGTSMes,
  salarioReferencia,
  totalMeses,
  aliquotaMulta,
}: CalcularFGTSInput): FGTSRescisorio {
  validarValorNaoNegativo(baseFGTSMes, 'Base do FGTS do mês');
  validarValorNaoNegativo(salarioReferencia, 'Salário de referência');
  if (!Number.isInteger(totalMeses) || totalMeses < 0) {
    throw new Error('Total de meses deve ser um inteiro não negativo');
  }
  if (!ALIQUOTAS_MULTA_VALIDAS.includes(aliquotaMulta)) {
    throw new Error('Alíquota da multa deve ser 0, 0.2 ou 0.4');
  }

  const saldoFGTSEstimado = salarioReferencia * ALIQUOTA_FGTS * totalMeses;

  return {
    baseFGTSMes,
    depositoFGTSMes: baseFGTSMes * ALIQUOTA_FGTS,
    aliquotaMulta,
    saldoFGTSEstimado,
    multaFGTSEstimada: saldoFGTSEstimado * aliquotaMulta,
  };
}
