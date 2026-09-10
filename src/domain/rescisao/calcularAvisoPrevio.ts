import { obterRegraPorMotivo } from './regrasPorMotivo';
import type { MotivoRescisao, TipoAvisoPrevio } from './tipos';

const DIAS_MINIMOS = 30;
const DIAS_POR_ANO_COMPLETO = 3;
const DIAS_MAXIMOS = 90;

export function calcularAvisoPrevio(anosCompletos: number): number {
  if (!Number.isInteger(anosCompletos) || anosCompletos < 0) {
    throw new Error('Anos completos deve ser um inteiro não negativo');
  }

  return Math.min(DIAS_MINIMOS + anosCompletos * DIAS_POR_ANO_COMPLETO, DIAS_MAXIMOS);
}

interface CalcularValorAvisoPrevioInput {
  motivo: MotivoRescisao;
  tipo: TipoAvisoPrevio;
  salarioReferencia: number;
  diasAviso: number;
  diasCumpridos?: number;
}

interface ResultadoAvisoPrevio {
  avisoPrevioPago: number;
  avisoPrevioDesconto: number;
}

const SEM_VALOR: ResultadoAvisoPrevio = {
  avisoPrevioPago: 0,
  avisoPrevioDesconto: 0,
};

export function calcularValorAvisoPrevio({
  motivo,
  tipo,
  salarioReferencia,
  diasAviso,
  diasCumpridos,
}: CalcularValorAvisoPrevioInput): ResultadoAvisoPrevio {
  if (!Number.isFinite(salarioReferencia) || salarioReferencia < 0) {
    throw new Error('Salário de referência deve ser um número não negativo');
  }
  if (!Number.isInteger(diasAviso) || diasAviso < 0 || diasAviso > DIAS_MAXIMOS) {
    throw new Error('Dias de aviso deve ser um inteiro entre 0 e 90');
  }
  if (
    tipo === 'parcial' &&
    (!Number.isInteger(diasCumpridos) || diasCumpridos === undefined || diasCumpridos < 0 || diasCumpridos > diasAviso)
  ) {
    throw new Error('Dias cumpridos deve ser um inteiro entre 0 e os dias de aviso');
  }

  const regra = obterRegraPorMotivo(motivo);
  if (regra.exigeAnaliseManual) {
    throw new Error('Este motivo exige análise manual do aviso prévio');
  }
  if (regra.tratamentoAviso === 'nao_aplicavel' || tipo === 'trabalhado') {
    return { ...SEM_VALOR };
  }

  const diasRestantes = tipo === 'parcial' ? diasAviso - (diasCumpridos ?? 0) : diasAviso;
  const valorRestante = (salarioReferencia / 30) * diasRestantes;

  if (regra.tratamentoAviso === 'descontavel_empregado') {
    if (tipo === 'indenizado') {
      throw new Error('Aviso indenizado não é aplicável ao pedido de demissão');
    }
    return { avisoPrevioPago: 0, avisoPrevioDesconto: valorRestante };
  }

  if (tipo === 'sem_aviso') {
    throw new Error('Ausência de aviso não é aplicável a este motivo de desligamento');
  }

  const percentualPago = regra.tratamentoAviso === 'pago_metade_empregador' ? 0.5 : 1;
  return {
    avisoPrevioPago: valorRestante * percentualPago,
    avisoPrevioDesconto: 0,
  };
}
