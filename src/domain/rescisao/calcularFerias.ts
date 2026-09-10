import type { DadosFerias } from './tipos';

interface CalcularFeriasInput {
  salarioReferencia: number;
  periodosVencidos: number;
  periodosEmDobro: number;
  avosProporcionais: number;
  abono?: DadosFerias['abono'];
}

interface ResultadoFerias {
  feriasVencidas: number;
  feriasEmDobro: number;
  feriasProporcionais: number;
  abonoPecuniario: number;
  descontoAbono: number;
}

function validarInteiroNaoNegativo(valor: number, campo: string): void {
  if (!Number.isInteger(valor) || valor < 0) {
    throw new Error(`${campo} deve ser um inteiro não negativo`);
  }
}

export function calcularFerias({
  salarioReferencia,
  periodosVencidos,
  periodosEmDobro,
  avosProporcionais,
  abono,
}: CalcularFeriasInput): ResultadoFerias {
  if (!Number.isFinite(salarioReferencia) || salarioReferencia < 0) {
    throw new Error('Salário de referência deve ser um número não negativo');
  }

  validarInteiroNaoNegativo(periodosVencidos, 'Períodos vencidos');
  validarInteiroNaoNegativo(periodosEmDobro, 'Períodos em dobro');
  validarInteiroNaoNegativo(avosProporcionais, 'Avos proporcionais');

  if (periodosEmDobro > periodosVencidos) {
    throw new Error('Períodos em dobro não podem exceder os períodos vencidos');
  }
  if (avosProporcionais > 12) {
    throw new Error('Avos proporcionais deve estar entre 0 e 12');
  }
  if (abono && (!Number.isFinite(abono.valor) || abono.valor < 0)) {
    throw new Error('Valor do abono deve ser um número não negativo');
  }

  const feriasComTerco = salarioReferencia * (4 / 3);
  const periodosSimples = periodosVencidos - periodosEmDobro;

  return {
    feriasVencidas: feriasComTerco * periodosSimples,
    feriasEmDobro: feriasComTerco * 2 * periodosEmDobro,
    feriasProporcionais: (feriasComTerco / 12) * avosProporcionais,
    abonoPecuniario: abono?.tipo === 'a_pagar' ? abono.valor : 0,
    descontoAbono: abono?.tipo === 'desconto_ja_recebido' ? abono.valor : 0,
  };
}
