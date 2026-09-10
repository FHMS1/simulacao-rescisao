import { calcularAvisoPrevio } from '../calcularAvisoPrevio';

describe('calcularAvisoPrevio', () => {
  it('retorna o mínimo de 30 dias sem ano completo', () => {
    expect(calcularAvisoPrevio(0)).toBe(30);
  });

  it('adiciona 3 dias para cada ano completo', () => {
    expect(calcularAvisoPrevio(3)).toBe(39);
  });

  it('limita o aviso prévio a 90 dias', () => {
    expect(calcularAvisoPrevio(20)).toBe(90);
    expect(calcularAvisoPrevio(30)).toBe(90);
  });

  it('rejeita quantidade de anos negativa ou fracionária', () => {
    expect(() => calcularAvisoPrevio(-1)).toThrow('Anos completos deve ser um inteiro não negativo');
    expect(() => calcularAvisoPrevio(1.5)).toThrow(
      'Anos completos deve ser um inteiro não negativo',
    );
  });
});
