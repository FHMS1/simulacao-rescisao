import { calcularAvosDecimoTerceiro, calcularAvosFerias } from '../calcularAvos';

describe('calcularAvosDecimoTerceiro', () => {
  it('não conta o mês com apenas 14 dias de vínculo', () => {
    expect(calcularAvosDecimoTerceiro('2024-01-01', '2026-04-14')).toBe(3);
  });

  it('conta o mês com 15 dias de vínculo', () => {
    expect(calcularAvosDecimoTerceiro('2024-01-01', '2026-04-15')).toBe(4);
  });

  it('considera a admissão ocorrida durante o ano da rescisão', () => {
    expect(calcularAvosDecimoTerceiro('2026-03-20', '2026-04-30')).toBe(1);
    expect(calcularAvosDecimoTerceiro('2026-03-15', '2026-04-30')).toBe(2);
  });
});

describe('calcularAvosFerias', () => {
  it('não conta fração de 14 dias no período aquisitivo', () => {
    expect(calcularAvosFerias('2025-06-10', '2026-02-23')).toBe(8);
  });

  it('conta fração de 15 dias no período aquisitivo', () => {
    expect(calcularAvosFerias('2025-06-10', '2026-02-24')).toBe(9);
  });

  it('considera somente o período aquisitivo atual após completar um ano', () => {
    expect(calcularAvosFerias('2025-01-01', '2026-03-15')).toBe(3);
  });

  it('retorna zero para vínculo de apenas um dia', () => {
    expect(calcularAvosFerias('2026-09-10', '2026-09-10')).toBe(0);
  });

  it('rejeita data final anterior à admissão', () => {
    expect(() => calcularAvosFerias('2026-09-10', '2026-09-09')).toThrow(
      'anterior à admissão',
    );
  });
});
