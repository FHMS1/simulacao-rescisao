// DTOs de entrada/saída do motor de cálculo de rescisão.
// Fonte da verdade: spec/04-modelo-de-dados.md — qualquer mudança de campo
// aqui exige atualizar a spec no mesmo commit (ver AGENTS.md, seção 5).

export type {
  DadosAvisoPrevio,
  DadosDecimoTerceiro,
  DadosFerias,
  DadosGerais,
  DadosSaldoSalario,
  DescontosAdicionais,
  MotivoRescisao,
  RescisaoInput,
  TipoAvisoPrevio,
  TipoContrato,
  TipoSalario,
  VerbasVariaveis,
} from './schema';

export interface TempoServico {
  anos: number;
  meses: number;
  dias: number;
  totalMeses: number;
}

export interface TributacaoCompetencia {
  rendimentosTributaveis: number;
  baseINSS: number;
  descontoINSS: number;
  baseIRRF: number;
  deducoesLegaisIRRF: number;
  deducaoSimplificadaIRRF: number;
  deducaoIRRFAplicada: 'legal' | 'simplificada';
  impostoIRRFAntesReducao: number;
  reducaoIRRF: number;
  descontoIRRF: number;
  categoriaIRRF: 'isento' | 'reduzido' | 'cheio';
  tabelaINSSAplicada: { vigenciaInicio: string; fonte: string };
  tabelaIRRFAplicada: { vigenciaInicio: string; fonte: string };
}

export interface TributacaoDetalhada {
  mensal: TributacaoCompetencia;
  decimoTerceiro: TributacaoCompetencia;
  totalINSS: number;
  totalIRRF: number;
}

export interface ProventosDetalhados {
  saldoSalario: number;
  avisoPrevioPago: number;
  feriasVencidas: number;
  feriasEmDobro: number;
  feriasProporcionais: number;
  decimoTerceiroProporcional: number;
  abonoPecuniario: number;
  mediasIntegradas: number;
  totalProventos: number;
}

export interface DescontosDetalhados {
  descontoINSS: number;
  descontoIRRF: number;
  avisoPrevioDesconto: number; // pedido de demissão sem cumprir aviso
  descontoFaltas: number;
  descontoDSR: number;
  adiantamentoDecimoTerceiro: number;
  descontoAbonoPecuniario: number;
  pensaoAlimenticia: number;
  outrosDescontos: number;
  totalDescontos: number;
}

export interface FGTSRescisorio {
  baseFGTSMes: number;
  depositoFGTSMes: number;
  aliquotaMulta: number; // 0, 0.20 ou 0.40
  saldoFGTSEstimado: number; // estimativa — ver spec/02, seção 4
  multaFGTSEstimada: number;
}

export interface Alerta {
  nivel: 'info' | 'atencao' | 'bloqueante';
  mensagem: string;
  fonte?: string; // referência legal, quando aplicável
}

export interface RescisaoOutput {
  tempoServico: TempoServico;
  diasAvisoPrevio: number;
  proventos: ProventosDetalhados;
  descontos: DescontosDetalhados;
  tributacao: TributacaoDetalhada;
  fgts: FGTSRescisorio;
  liquidoEmpregado: number;
  custoTotalEmpresa: number;
  alertas: Alerta[];
}
