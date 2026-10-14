import { arredondarCentavos } from './dinheiro';

interface CalcularDSRInput {
  /** Horas extras + comissões + adicional noturno do período. */
  baseVariaveis: number;
  diasUteis: number;
  diasDescanso: number;
}

/**
 * DSR sobre verbas variáveis: base ÷ dias úteis × domingos e feriados do mês
 * (Lei 605/1949, art. 7º; Súmulas 172 e 27 do TST).
 * Insalubridade e periculosidade são fixas e já remuneram o descanso: ficam fora da base.
 */
export function calcularDSR({ baseVariaveis, diasUteis, diasDescanso }: CalcularDSRInput): number {
  if (!Number.isFinite(baseVariaveis) || baseVariaveis < 0) {
    throw new Error('Base de variáveis deve ser um número não negativo');
  }
  if (!Number.isInteger(diasUteis) || diasUteis < 1 || diasUteis > 31) {
    throw new Error('Dias úteis deve ser um inteiro entre 1 e 31');
  }
  if (!Number.isInteger(diasDescanso) || diasDescanso < 0 || diasDescanso > 10) {
    throw new Error('Dias de descanso deve ser um inteiro entre 0 e 10');
  }
  return arredondarCentavos((baseVariaveis / diasUteis) * diasDescanso);
}
