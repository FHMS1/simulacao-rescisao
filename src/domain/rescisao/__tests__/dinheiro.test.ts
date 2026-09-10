import { describe, expect, it } from 'vitest';
import { arredondarCentavos } from '../dinheiro';

describe('arredondarCentavos', () => {
  it('corrige a representação binária em valores terminados em meio centavo', () => {
    expect(arredondarCentavos(1_621 * 0.075)).toBe(121.58);
  });

  it('arredonda valores negativos de forma simétrica', () => {
    expect(arredondarCentavos(-10.125)).toBe(-10.13);
  });

  it('rejeita valores não finitos', () => {
    expect(() => arredondarCentavos(Number.NaN)).toThrow();
  });
});
