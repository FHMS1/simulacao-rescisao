export interface FaixaINSS {
  teto: number;
  aliquota: number;
}

export interface TabelaINSS {
  vigenciaInicio: string; // ISO 'YYYY-MM-DD'
  vigenciaFim: string | null; // null = ainda vigente
  fonte: string; // ex.: 'Portaria Interministerial MPS/MF nº 13/2026'
  faixas: FaixaINSS[];
  teto: number;
}

export const TABELAS_INSS: TabelaINSS[] = [
  {
    vigenciaInicio: '2025-01-01',
    vigenciaFim: '2025-12-31',
    fonte: 'Portaria Interministerial MPS/MF nº 6, de 10/01/2025',
    teto: 8_157.41,
    faixas: [
      { teto: 1_518, aliquota: 0.075 },
      { teto: 2_793.88, aliquota: 0.09 },
      { teto: 4_190.83, aliquota: 0.12 },
      { teto: 8_157.41, aliquota: 0.14 },
    ],
  },
  {
    vigenciaInicio: '2026-01-01',
    vigenciaFim: '2026-12-31',
    fonte: 'Portaria Interministerial MPS/MF nº 13, de 09/01/2026',
    teto: 8_475.55,
    faixas: [
      { teto: 1_621, aliquota: 0.075 },
      { teto: 2_902.84, aliquota: 0.09 },
      { teto: 4_354.27, aliquota: 0.12 },
      { teto: 8_475.55, aliquota: 0.14 },
    ],
  },
];
