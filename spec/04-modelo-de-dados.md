# Spec 04 — Modelo de Dados

O contrato de entrada é definido uma única vez em `domain/rescisao/schema.ts`: o schema Zod valida os dados e `z.infer` gera `RescisaoInput`. Os DTOs de saída permanecem em `domain/rescisao/tipos.ts`.

## 1. Entrada — `RescisaoInput`

```ts
export type MotivoRescisao =
  | 'sem_justa_causa'
  | 'pedido_demissao'
  | 'justa_causa'
  | 'acordo_484a'
  | 'termino_prazo_determinado'
  | 'antecipada_empregador_prazo_determinado'
  | 'antecipada_empregado_prazo_determinado'
  | 'rescisao_indireta'
  | 'culpa_reciproca_forca_maior';

export type TipoAvisoPrevio = 'indenizado' | 'trabalhado' | 'parcial' | 'sem_aviso';
export type TipoSalario = 'mensalista' | 'horista' | 'comissionista' | 'misto';
export type TipoContrato = 'indeterminado' | 'determinado';

export interface DadosGerais {
  nomeEmpregado?: string;
  dataAdmissao: string; // ISO 'YYYY-MM-DD'
  dataDesligamento: string;
  salarioBase: number;
  tipoContrato: TipoContrato;
  tipoSalario: TipoSalario;
  dependentesIRRF: number;
  pensaoAlimenticia?: {
    tipo: 'valor_fixo' | 'percentual';
    valor: number;
  };
  observacaoConvencaoColetiva?: string;
}

export interface DadosAvisoPrevio {
  tipo: TipoAvisoPrevio;
  diasManual?: number; // sobrescreve o cálculo automático, se informado
  cumprimento?: 'integral' | 'parcial' | 'nao_cumpriu'; // relevante em pedido_demissao
  diasCumpridos?: number;
}

export interface DadosSaldoSalario {
  diasTrabalhados: number;
  faltasInjustificadas?: number;
  descontarDSRSobreFaltas: boolean;
  outrosDescontosMes: number;
}

export interface DadosFerias {
  periodosVencidos: number;
  periodosEmDobro: number;
  calcularProporcional: boolean;
  avosProporcionalManual?: number; // sobrescreve cálculo automático
  abono?: {
    tipo: 'a_pagar' | 'desconto_ja_recebido';
    valor: number;
  };
}

export interface DadosDecimoTerceiro {
  calcular: boolean;
  avosManual?: number;
  adiantamentoRecebido?: number;
}

export interface VerbasVariaveis {
  integrar: boolean;
  modo: 'valor_informado' | 'media_meses';
  qtdMesesMedia?: 3 | 6 | 12;
  horasExtras?: number;
  adicionalNoturno?: number;
  comissoes?: number;
  dsrSobreVariaveis?: number;
  insalubridade?: number;
  periculosidade?: number;
  outras?: number;
}

export interface DescontosAdicionais {
  adiantamentoSalarial?: number;
  valeTransporte?: number;
  valeAlimentacao?: number;
  convenios?: number;
  emprestimosConsignado?: number;
  outros?: number;
  descricaoOutros?: string;
}

export interface RescisaoInput {
  motivo: MotivoRescisao;
  dadosGerais: DadosGerais;
  avisoPrevio: DadosAvisoPrevio;
  saldoSalario: DadosSaldoSalario;
  ferias: DadosFerias;
  decimoTerceiro: DadosDecimoTerceiro;
  verbasVariaveis: VerbasVariaveis;
  descontosAdicionais: DescontosAdicionais;
  dataPagamento?: string; // usado no RF-22 (multa por atraso) — planejado
}
```

## 2. Saída — `RescisaoOutput`

```ts
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
```

## 3. Ponto de entrada único do domínio

```ts
export function calcularRescisao(input: RescisaoInput): RescisaoOutput {
  // orquestra as funções de domain/rescisao/*.ts
  // é a ÚNICA função de domain/ chamada pela camada ui/
}
```

Nenhum componente React deve importar `calcularINSS`, `calcularFerias` etc. diretamente — sempre via `calcularRescisao`. Isso mantém um único ponto de contrato entre `domain/` e `ui/`, e permite refatorar o orquestrador internamente sem quebrar a UI.
