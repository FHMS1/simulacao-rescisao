import { calcularSaldoSalario } from '../calcularSaldoSalario';

describe('calcularSaldoSalario', () => {
  it('calcula o salário proporcional usando divisor mensal de 30 dias', () => {
    expect(calcularSaldoSalario({ salarioBase: 3_000, diasTrabalhados: 15 })).toBe(1_500);
  });

  it('retorna zero quando não houve dia trabalhado', () => {
    expect(calcularSaldoSalario({ salarioBase: 3_000, diasTrabalhados: 0 })).toBe(0);
  });

  it('aceita até 31 dias informados no mês de desligamento', () => {
    expect(calcularSaldoSalario({ salarioBase: 3_000, diasTrabalhados: 31 })).toBe(3_100);
  });

  it('rejeita salário negativo e quantidade inválida de dias', () => {
    expect(() => calcularSaldoSalario({ salarioBase: -1, diasTrabalhados: 10 })).toThrow();
    expect(() => calcularSaldoSalario({ salarioBase: 3_000, diasTrabalhados: 32 })).toThrow();
    expect(() => calcularSaldoSalario({ salarioBase: 3_000, diasTrabalhados: 10.5 })).toThrow();
  });
});
