import { calcularTempoServico } from '../calcularTempoServico';

describe('calcularTempoServico', () => {
  it('calcula anos, meses e dias usando o calendário real', () => {
    expect(calcularTempoServico('2023-01-15', '2026-02-28')).toEqual({
      anos: 3,
      meses: 1,
      dias: 13,
      totalMeses: 37,
    });
  });

  it('considera corretamente o dia 29 de fevereiro em ano bissexto', () => {
    expect(calcularTempoServico('2023-01-15', '2028-02-29')).toEqual({
      anos: 5,
      meses: 1,
      dias: 14,
      totalMeses: 61,
    });
  });

  it('não gera valores negativos em contrato curto no mesmo mês', () => {
    expect(calcularTempoServico('2026-09-01', '2026-09-10')).toEqual({
      anos: 0,
      meses: 0,
      dias: 9,
      totalMeses: 0,
    });
  });

  it('mantém dias não negativos ao atravessar um mês mais curto', () => {
    expect(calcularTempoServico('2026-01-31', '2026-03-01')).toEqual({
      anos: 0,
      meses: 1,
      dias: 1,
      totalMeses: 1,
    });
  });

  it('retorna zero quando admissão e desligamento são no mesmo dia', () => {
    expect(calcularTempoServico('2026-09-10', '2026-09-10')).toEqual({
      anos: 0,
      meses: 0,
      dias: 0,
      totalMeses: 0,
    });
  });

  it('rejeita data inexistente e desligamento anterior à admissão', () => {
    expect(() => calcularTempoServico('2026-02-30', '2026-03-01')).toThrow('Data inválida');
    expect(() => calcularTempoServico('2026-09-10', '2026-09-09')).toThrow(
      'A data de desligamento não pode ser anterior à admissão',
    );
  });
});
