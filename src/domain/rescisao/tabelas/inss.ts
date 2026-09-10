// TODO(migração): portar as tabelas reais de INSS que já estavam em uso na
// versão vanilla (ver `git show <commit-antes-da-migração>:js/script.js`) e
// validá-las contra a Portaria oficial citada em cada `fonte`, antes de usar
// em produção — ver AGENTS.md, seção 6, e spec/03, seção 4. Não preencher
// valores "de cabeça".

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

export const TABELAS_INSS: TabelaINSS[] = [];
