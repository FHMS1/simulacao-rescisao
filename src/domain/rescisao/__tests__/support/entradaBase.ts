import type { RescisaoInput } from '../../schema';

export function entradaBase(): RescisaoInput {
  return {
    motivo: 'sem_justa_causa',
    dadosGerais: {
      dataAdmissao: '2023-01-01',
      dataDesligamento: '2026-09-10',
      salarioBase: 4_500,
      tipoContrato: 'indeterminado',
      tipoSalario: 'mensalista',
      dependentesIRRF: 0,
    },
    avisoPrevio: { tipo: 'indenizado' },
    saldoSalario: {
      diasTrabalhados: 10,
      faltasInjustificadas: 0,
      descontarDSRSobreFaltas: false,
      outrosDescontosMes: 0,
    },
    ferias: {
      periodosVencidos: 1,
      periodosEmDobro: 0,
      calcularProporcional: true,
    },
    decimoTerceiro: { calcular: true, adiantamentoRecebido: 0 },
    verbasVariaveis: { integrar: false, modo: 'valor_informado' },
    descontosAdicionais: {},
  };
}
