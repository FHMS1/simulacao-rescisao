import { calcularFGTS } from '../calcularFGTS';

describe('calcularFGTS', () => {
  it('calcula depósito rescisório e multa estimada de 40%', () => {
    expect(
      calcularFGTS({
        baseFGTSMes: 5_000,
        salarioReferencia: 3_000,
        totalMeses: 24,
        aliquotaMulta: 0.4,
      }),
    ).toEqual({
      baseFGTSMes: 5_000,
      depositoFGTSMes: 400,
      aliquotaMulta: 0.4,
      saldoFGTSEstimado: 5_760,
      multaFGTSEstimada: 2_304,
    });
  });

  it('aplica multa de 20% no acordo ou hipótese correspondente', () => {
    expect(
      calcularFGTS({
        baseFGTSMes: 3_000,
        salarioReferencia: 3_000,
        totalMeses: 12,
        aliquotaMulta: 0.2,
      }).multaFGTSEstimada,
    ).toBe(576);
  });

  it('mantém a multa zerada quando o motivo não prevê indenização compensatória', () => {
    expect(
      calcularFGTS({
        baseFGTSMes: 3_000,
        salarioReferencia: 3_000,
        totalMeses: 12,
        aliquotaMulta: 0,
      }).multaFGTSEstimada,
    ).toBe(0);
  });

  it('retorna tudo zerado para base, salário e período zerados', () => {
    expect(
      calcularFGTS({
        baseFGTSMes: 0,
        salarioReferencia: 0,
        totalMeses: 0,
        aliquotaMulta: 0,
      }),
    ).toEqual({
      baseFGTSMes: 0,
      depositoFGTSMes: 0,
      aliquotaMulta: 0,
      saldoFGTSEstimado: 0,
      multaFGTSEstimada: 0,
    });
  });

  it('rejeita valores negativos, meses fracionários e alíquota desconhecida', () => {
    expect(() =>
      calcularFGTS({
        baseFGTSMes: -1,
        salarioReferencia: 3_000,
        totalMeses: 12,
        aliquotaMulta: 0.4,
      }),
    ).toThrow();
    expect(() =>
      calcularFGTS({
        baseFGTSMes: 3_000,
        salarioReferencia: 3_000,
        totalMeses: 12.5,
        aliquotaMulta: 0.4,
      }),
    ).toThrow();
    expect(() =>
      calcularFGTS({
        baseFGTSMes: 3_000,
        salarioReferencia: 3_000,
        totalMeses: 12,
        aliquotaMulta: 0.3,
      }),
    ).toThrow();
  });
});
