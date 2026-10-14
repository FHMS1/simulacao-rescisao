import type { MotivoRescisao } from './tipos';

export type TratamentoAviso =
  | 'pago_empregador'
  | 'pago_metade_empregador'
  | 'descontavel_empregado'
  | 'nao_aplicavel'
  | 'depende_clausula_assecuratoria'
  | 'depende_decisao_judicial';

export interface RegraPorMotivo {
  tratamentoAviso: TratamentoAviso;
  aliquotaMultaFGTS: 0 | 0.2 | 0.4;
  percentualSaqueFGTS: 0 | 0.8 | 1;
  temSeguroDesemprego: boolean | null;
  percentualFeriasProporcionais: 0 | 0.5 | 1 | null;
  percentualDecimoTerceiro: 0 | 0.5 | 1 | null;
  artigoEspecial: '479' | '480' | null;
  exigeAnaliseManual: boolean;
}

const REGRAS_POR_MOTIVO: Readonly<Record<MotivoRescisao, Readonly<RegraPorMotivo>>> = {
  sem_justa_causa: {
    tratamentoAviso: 'pago_empregador',
    aliquotaMultaFGTS: 0.4,
    percentualSaqueFGTS: 1,
    temSeguroDesemprego: true,
    percentualFeriasProporcionais: 1,
    percentualDecimoTerceiro: 1,
    artigoEspecial: null,
    exigeAnaliseManual: false,
  },
  pedido_demissao: {
    tratamentoAviso: 'descontavel_empregado',
    aliquotaMultaFGTS: 0,
    percentualSaqueFGTS: 0,
    temSeguroDesemprego: false,
    percentualFeriasProporcionais: 1,
    percentualDecimoTerceiro: 1,
    artigoEspecial: null,
    exigeAnaliseManual: false,
  },
  justa_causa: {
    tratamentoAviso: 'nao_aplicavel',
    aliquotaMultaFGTS: 0,
    percentualSaqueFGTS: 0,
    temSeguroDesemprego: false,
    percentualFeriasProporcionais: 0,
    percentualDecimoTerceiro: 0,
    artigoEspecial: null,
    exigeAnaliseManual: false,
  },
  acordo_484a: {
    tratamentoAviso: 'pago_metade_empregador',
    aliquotaMultaFGTS: 0.2,
    percentualSaqueFGTS: 0.8,
    temSeguroDesemprego: false,
    percentualFeriasProporcionais: 1,
    percentualDecimoTerceiro: 1,
    artigoEspecial: null,
    exigeAnaliseManual: false,
  },
  termino_prazo_determinado: {
    tratamentoAviso: 'nao_aplicavel',
    aliquotaMultaFGTS: 0,
    percentualSaqueFGTS: 1,
    temSeguroDesemprego: false,
    percentualFeriasProporcionais: 1,
    percentualDecimoTerceiro: 1,
    artigoEspecial: null,
    exigeAnaliseManual: false,
  },
  antecipada_empregador_prazo_determinado: {
    tratamentoAviso: 'depende_clausula_assecuratoria',
    aliquotaMultaFGTS: 0.4,
    percentualSaqueFGTS: 1,
    temSeguroDesemprego: null,
    percentualFeriasProporcionais: 1,
    percentualDecimoTerceiro: 1,
    artigoEspecial: '479',
    exigeAnaliseManual: true,
  },
  antecipada_empregado_prazo_determinado: {
    tratamentoAviso: 'depende_clausula_assecuratoria',
    aliquotaMultaFGTS: 0,
    percentualSaqueFGTS: 0,
    temSeguroDesemprego: false,
    percentualFeriasProporcionais: 1,
    percentualDecimoTerceiro: 1,
    artigoEspecial: '480',
    exigeAnaliseManual: true,
  },
  rescisao_indireta: {
    tratamentoAviso: 'pago_empregador',
    aliquotaMultaFGTS: 0.4,
    percentualSaqueFGTS: 1,
    temSeguroDesemprego: true,
    percentualFeriasProporcionais: 1,
    percentualDecimoTerceiro: 1,
    artigoEspecial: null,
    exigeAnaliseManual: false,
  },
  // Súmula 14 TST + CLT, art. 484: culpa recíproca reconhecida em juízo reduz à
  // metade o aviso, o 13º e a multa do FGTS (20%). Férias proporcionais pela
  // metade é entendimento controverso — o orquestrador emite alerta.
  culpa_reciproca: {
    tratamentoAviso: 'pago_metade_empregador',
    aliquotaMultaFGTS: 0.2,
    percentualSaqueFGTS: 1,
    temSeguroDesemprego: null,
    percentualFeriasProporcionais: 0.5,
    percentualDecimoTerceiro: 0.5,
    artigoEspecial: null,
    exigeAnaliseManual: false,
  },
  // CLT, art. 502 e Lei 8.036/1990, art. 18, §2º: extinção da empresa por força
  // maior — sem aviso, multa do FGTS de 20%.
  forca_maior: {
    tratamentoAviso: 'nao_aplicavel',
    aliquotaMultaFGTS: 0.2,
    percentualSaqueFGTS: 1,
    temSeguroDesemprego: null,
    percentualFeriasProporcionais: 1,
    percentualDecimoTerceiro: 1,
    artigoEspecial: null,
    exigeAnaliseManual: false,
  },
  // Lei 6.858/1980: verbas pagas aos dependentes habilitados; sem aviso e sem
  // multa — o contrato se extingue sem iniciativa do empregador (CLT, art. 483, §2º).
  falecimento: {
    tratamentoAviso: 'nao_aplicavel',
    aliquotaMultaFGTS: 0,
    percentualSaqueFGTS: 1,
    temSeguroDesemprego: false,
    percentualFeriasProporcionais: 1,
    percentualDecimoTerceiro: 1,
    artigoEspecial: null,
    exigeAnaliseManual: false,
  },
  // Tratada como pedido de demissão; saque do FGTS permitido na aposentadoria
  // (Lei 8.036/1990, art. 20, III), sem multa rescisória.
  aposentadoria_voluntaria: {
    tratamentoAviso: 'descontavel_empregado',
    aliquotaMultaFGTS: 0,
    percentualSaqueFGTS: 1,
    temSeguroDesemprego: false,
    percentualFeriasProporcionais: 1,
    percentualDecimoTerceiro: 1,
    artigoEspecial: null,
    exigeAnaliseManual: false,
  },
  // Aviso e multa do FGTS dependem do regulamento do plano: o orquestrador
  // substitui estes valores pelos informados em `pdv`.
  pdv: {
    tratamentoAviso: 'pago_empregador',
    aliquotaMultaFGTS: 0,
    percentualSaqueFGTS: 1,
    temSeguroDesemprego: null,
    percentualFeriasProporcionais: 1,
    percentualDecimoTerceiro: 1,
    artigoEspecial: null,
    exigeAnaliseManual: false,
  },

};

export function obterRegraPorMotivo(motivo: MotivoRescisao): Readonly<RegraPorMotivo> {
  return REGRAS_POR_MOTIVO[motivo];
}
