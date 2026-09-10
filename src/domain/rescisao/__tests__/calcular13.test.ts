import { calcular13 } from '../calcular13';

describe('calcular13', () => {
  it('calcula o décimo terceiro proporcional pelos avos informados', () => {
    expect(calcular13({ salarioReferencia: 3_600, avos: 6 })).toEqual({
      decimoTerceiroProporcional: 1_800,
      adiantamentoRecebido: 0,
    });
  });

  it('mantém o adiantamento separado do provento calculado', () => {
    expect(calcular13({ salarioReferencia: 3_600, avos: 6, adiantamentoRecebido: 500 })).toEqual({
      decimoTerceiroProporcional: 1_800,
      adiantamentoRecebido: 500,
    });
  });

  it('retorna zero para zero avos', () => {
    expect(calcular13({ salarioReferencia: 3_600, avos: 0 })).toEqual({
      decimoTerceiroProporcional: 0,
      adiantamentoRecebido: 0,
    });
  });

  it('rejeita avos fora de 0 a 12 e valores monetários negativos', () => {
    expect(() => calcular13({ salarioReferencia: 3_600, avos: 13 })).toThrow();
    expect(() => calcular13({ salarioReferencia: -1, avos: 6 })).toThrow();
    expect(() =>
      calcular13({ salarioReferencia: 3_600, avos: 6, adiantamentoRecebido: -1 }),
    ).toThrow();
  });
});
