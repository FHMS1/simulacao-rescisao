import { TABELAS_INSS, type TabelaINSS } from './inss';
import { TABELAS_IRRF, type TabelaIRRF } from './irrf';
import { TabelaNaoEncontradaError } from './erros';
import { selecionarVigencia } from './vigencia';

export function obterTabelaINSS(dataReferencia: Date): TabelaINSS {
  const tabela = selecionarVigencia(TABELAS_INSS, dataReferencia);
  if (!tabela) throw new TabelaNaoEncontradaError('INSS', dataReferencia);
  return tabela;
}

export function obterTabelaIRRF(dataReferencia: Date): TabelaIRRF {
  const tabela = selecionarVigencia(TABELAS_IRRF, dataReferencia);
  if (!tabela) throw new TabelaNaoEncontradaError('IRRF', dataReferencia);
  return tabela;
}

export { TabelaNaoEncontradaError } from './erros';
export { competenciaISO, selecionarVigencia } from './vigencia';
export type { FaixaINSS, TabelaINSS } from './inss';
export type { FaixaIRRF, TabelaIRRF } from './irrf';
