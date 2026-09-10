import { describe, expect, it } from 'vitest';
import { calcularINSS } from '../calcularINSS';
import { obterTabelaINSS } from '../tabelas';

const tabela2026 = obterTabelaINSS(new Date(2026, 0, 1));

describe('calcularINSS', () => {
  it('calcula progressivamente e expõe cada faixa da memória', () => {
    expect(calcularINSS(5_000, tabela2026)).toEqual({
      base: 5_000,
      desconto: 501.52,
      parcelas: [
        { baseFaixa: 1_621, aliquota: 0.075, contribuicao: 121.58 },
        { baseFaixa: 1_281.84, aliquota: 0.09, contribuicao: 115.37 },
        { baseFaixa: 1_451.43, aliquota: 0.12, contribuicao: 174.17 },
        { baseFaixa: 645.73, aliquota: 0.14, contribuicao: 90.4 },
      ],
    });
  });

  it('limita a base ao teto previdenciário', () => {
    expect(calcularINSS(20_000, tabela2026).base).toBe(8_475.55);
  });

  it('aceita base zero e rejeita base negativa', () => {
    expect(calcularINSS(0, tabela2026)).toEqual({ base: 0, desconto: 0, parcelas: [] });
    expect(() => calcularINSS(-1, tabela2026)).toThrow();
  });
});
