import { describe, expect, it } from 'vitest';
import { calcularIRRF } from '../calcularIRRF';
import { obterTabelaIRRF } from '../tabelas';

const tabela2026 = obterTabelaIRRF(new Date(2026, 0, 1));

describe('calcularIRRF', () => {
  it('reproduz o exemplo oficial de R$ 5.000 com dedução simplificada e redução total', () => {
    expect(
      calcularIRRF({
        rendimentosTributaveis: 5_000,
        descontoINSS: 501.52,
        dependentes: 0,
        tabela: tabela2026,
        aplicarReducaoMensal: true,
      }),
    ).toMatchObject({
      base: 4_392.8,
      deducaoAplicada: 'simplificada',
      impostoAntesReducao: 312.89,
      reducao: 312.89,
      desconto: 0,
      categoria: 'isento',
    });
  });

  it('aplica a redução parcial pela renda bruta tributável, não pela base', () => {
    expect(
      calcularIRRF({
        rendimentosTributaveis: 6_000,
        descontoINSS: 641.52,
        dependentes: 0,
        tabela: tabela2026,
        aplicarReducaoMensal: true,
      }),
    ).toMatchObject({
      base: 5_358.48,
      deducaoAplicada: 'legal',
      impostoAntesReducao: 564.85,
      reducao: 179.75,
      desconto: 385.1,
      categoria: 'reduzido',
    });
  });

  it('não aplica a redução mensal à tributação exclusiva do 13º', () => {
    expect(
      calcularIRRF({
        rendimentosTributaveis: 5_000,
        descontoINSS: 501.52,
        dependentes: 0,
        tabela: tabela2026,
        aplicarReducaoMensal: false,
      }).desconto,
    ).toBe(312.89);
  });

  it('aceita rendimentos zero e rejeita dependentes inválidos', () => {
    expect(
      calcularIRRF({
        rendimentosTributaveis: 0,
        descontoINSS: 0,
        dependentes: 0,
        tabela: tabela2026,
        aplicarReducaoMensal: true,
      }).desconto,
    ).toBe(0);
    expect(() =>
      calcularIRRF({
        rendimentosTributaveis: 1_000,
        descontoINSS: 0,
        dependentes: -1,
        tabela: tabela2026,
        aplicarReducaoMensal: true,
      }),
    ).toThrow();
  });
});
