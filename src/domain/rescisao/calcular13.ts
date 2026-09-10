interface Calcular13Input {
  salarioReferencia: number;
  avos: number;
  adiantamentoRecebido?: number;
}

interface Resultado13 {
  decimoTerceiroProporcional: number;
  adiantamentoRecebido: number;
}

export function calcular13({
  salarioReferencia,
  avos,
  adiantamentoRecebido = 0,
}: Calcular13Input): Resultado13 {
  if (!Number.isFinite(salarioReferencia) || salarioReferencia < 0) {
    throw new Error('Salário de referência deve ser um número não negativo');
  }
  if (!Number.isInteger(avos) || avos < 0 || avos > 12) {
    throw new Error('Avos deve ser um inteiro entre 0 e 12');
  }
  if (!Number.isFinite(adiantamentoRecebido) || adiantamentoRecebido < 0) {
    throw new Error('Adiantamento recebido deve ser um número não negativo');
  }

  return {
    decimoTerceiroProporcional: (salarioReferencia / 12) * avos,
    adiantamentoRecebido,
  };
}
