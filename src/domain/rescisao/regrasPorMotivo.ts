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
  culpa_reciproca_forca_maior: {
    tratamentoAviso: 'depende_decisao_judicial',
    aliquotaMultaFGTS: 0.2,
    percentualSaqueFGTS: 1,
    temSeguroDesemprego: null,
    percentualFeriasProporcionais: null,
    percentualDecimoTerceiro: null,
    artigoEspecial: null,
    exigeAnaliseManual: true,
  },
};

export function obterRegraPorMotivo(motivo: MotivoRescisao): Readonly<RegraPorMotivo> {
  return REGRAS_POR_MOTIVO[motivo];
}
