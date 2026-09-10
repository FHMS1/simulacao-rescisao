import { describe, expect, it } from 'vitest';
import { obterTabelaINSS, obterTabelaIRRF, TabelaNaoEncontradaError } from '../index';

describe('obterTabelaINSS', () => {
  it('seleciona as tabelas validadas de 2025 e 2026', () => {
    expect(obterTabelaINSS(new Date(2025, 5, 1)).teto).toBe(8_157.41);
    expect(obterTabelaINSS(new Date(2026, 0, 1)).teto).toBe(8_475.55);
  });

  it('lança TabelaNaoEncontradaError em vez de reaproveitar tabela antiga silenciosamente', () => {
    expect(() => obterTabelaINSS(new Date(2027, 0, 1))).toThrow(TabelaNaoEncontradaError);
  });
});

describe('obterTabelaIRRF', () => {
  it('respeita a mudança ocorrida em maio de 2025', () => {
    expect(obterTabelaIRRF(new Date(2025, 3, 30)).deducaoSimplificada).toBe(564.8);
    expect(obterTabelaIRRF(new Date(2025, 4, 1)).deducaoSimplificada).toBe(607.2);
  });

  it('seleciona 2026 com a redução mensal validada', () => {
    expect(obterTabelaIRRF(new Date(2026, 0, 1)).reducaoMensal?.limiteIsencao).toBe(5_000);
  });

  it('lança TabelaNaoEncontradaError em vez de reaproveitar tabela antiga silenciosamente', () => {
    expect(() => obterTabelaIRRF(new Date(2027, 0, 1))).toThrow(TabelaNaoEncontradaError);
  });
});
