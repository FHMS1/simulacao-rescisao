export interface FaixaIRRF {
  limiteSuperior: number | null; // null = última faixa, sem teto
  aliquota: number;
  parcelaDeduzir: number;
}

export interface TabelaIRRF {
  vigenciaInicio: string; // ISO 'YYYY-MM-DD'
  vigenciaFim: string | null; // null = ainda vigente
  fonte: string; // ex.: 'IN RFB nº XXXX/2026'
  deducaoPorDependente: number;
  deducaoSimplificada: number;
  reducaoMensal?: {
    limiteIsencao: number;
    limiteReducao: number;
    parcela: number;
    coeficiente: number;
  };
  faixas: FaixaIRRF[];
}

const FAIXAS_JAN_ABR_2025: FaixaIRRF[] = [
  { limiteSuperior: 2_259.2, aliquota: 0, parcelaDeduzir: 0 },
  { limiteSuperior: 2_826.65, aliquota: 0.075, parcelaDeduzir: 169.44 },
  { limiteSuperior: 3_751.05, aliquota: 0.15, parcelaDeduzir: 381.44 },
  { limiteSuperior: 4_664.68, aliquota: 0.225, parcelaDeduzir: 662.77 },
  { limiteSuperior: null, aliquota: 0.275, parcelaDeduzir: 896 },
];

const FAIXAS_DESDE_MAI_2025: FaixaIRRF[] = [
  { limiteSuperior: 2_428.8, aliquota: 0, parcelaDeduzir: 0 },
  { limiteSuperior: 2_826.65, aliquota: 0.075, parcelaDeduzir: 182.16 },
  { limiteSuperior: 3_751.05, aliquota: 0.15, parcelaDeduzir: 394.16 },
  { limiteSuperior: 4_664.68, aliquota: 0.225, parcelaDeduzir: 675.49 },
  { limiteSuperior: null, aliquota: 0.275, parcelaDeduzir: 908.73 },
];

export const TABELAS_IRRF: TabelaIRRF[] = [
  {
    vigenciaInicio: '2025-01-01',
    vigenciaFim: '2025-04-30',
    fonte: 'Medida Provisória nº 1.206/2024 e tabela IRRF RFB 2025',
    deducaoPorDependente: 189.59,
    deducaoSimplificada: 564.8,
    faixas: FAIXAS_JAN_ABR_2025,
  },
  {
    vigenciaInicio: '2025-05-01',
    vigenciaFim: '2025-12-31',
    fonte: 'Lei nº 15.191/2025 e tabela IRRF RFB 2025',
    deducaoPorDependente: 189.59,
    deducaoSimplificada: 607.2,
    faixas: FAIXAS_DESDE_MAI_2025,
  },
  {
    vigenciaInicio: '2026-01-01',
    vigenciaFim: '2026-12-31',
    fonte: 'Lei nº 15.270/2025 e tabela IRRF RFB 2026',
    deducaoPorDependente: 189.59,
    deducaoSimplificada: 607.2,
    reducaoMensal: {
      limiteIsencao: 5_000,
      limiteReducao: 7_350,
      parcela: 978.62,
      coeficiente: 0.133145,
    },
    faixas: FAIXAS_DESDE_MAI_2025,
  },
];
