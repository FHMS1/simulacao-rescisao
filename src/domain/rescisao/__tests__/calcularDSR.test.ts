import { describe, expect, it } from 'vitest';
import { calcularDSR } from '../calcularDSR';

describe('calcularDSR', () => {
  it('divide a base pelos dias úteis e multiplica pelos descansos', () => {
    // 1.000 ÷ 25 × 5 = 200
    expect(calcularDSR({ baseVariaveis: 1000, diasUteis: 25, diasDescanso: 5 })).toBe(200);
  });

  it('retorna zero sem variáveis ou sem dias de descanso', () => {
    expect(calcularDSR({ baseVariaveis: 0, diasUteis: 25, diasDescanso: 5 })).toBe(0);
    expect(calcularDSR({ baseVariaveis: 1000, diasUteis: 26, diasDescanso: 0 })).toBe(0);
  });

  it('arredonda para centavos', () => {
    expect(calcularDSR({ baseVariaveis: 100, diasUteis: 26, diasDescanso: 4 })).toBe(15.38);
  });

  it('rejeita dias inválidos', () => {
    expect(() => calcularDSR({ baseVariaveis: 100, diasUteis: 0, diasDescanso: 4 })).toThrow();
    expect(() => calcularDSR({ baseVariaveis: 100, diasUteis: 26, diasDescanso: 11 })).toThrow();
    expect(() => calcularDSR({ baseVariaveis: -1, diasUteis: 26, diasDescanso: 4 })).toThrow();
  });
});
