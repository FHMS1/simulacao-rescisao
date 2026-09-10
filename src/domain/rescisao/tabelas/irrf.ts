// TODO(migração): portar as tabelas reais de IRRF que já estavam em uso na
// versão vanilla (ver `git show <commit-antes-da-migração>:js/script.js`) e
// validá-las contra a Instrução Normativa/Lei oficial citada em cada
// `fonte`, antes de usar em produção — ver AGENTS.md, seção 6, e spec/03,
// seção 4. Não preencher valores "de cabeça".

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
  faixas: FaixaIRRF[];
}

export const TABELAS_IRRF: TabelaIRRF[] = [];
