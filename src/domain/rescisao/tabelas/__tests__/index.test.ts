import { describe, expect, it } from 'vitest';
import { obterTabelaINSS, obterTabelaIRRF, TabelaNaoEncontradaError } from '../index';

describe('obterTabelaINSS', () => {
  it('lança TabelaNaoEncontradaError em vez de reaproveitar tabela antiga silenciosamente', () => {
    expect(() => obterTabelaINSS(new Date('2026-01-01'))).toThrow(TabelaNaoEncontradaError);
  });
});

describe('obterTabelaIRRF', () => {
  it('lança TabelaNaoEncontradaError em vez de reaproveitar tabela antiga silenciosamente', () => {
    expect(() => obterTabelaIRRF(new Date('2026-01-01'))).toThrow(TabelaNaoEncontradaError);
  });
});
