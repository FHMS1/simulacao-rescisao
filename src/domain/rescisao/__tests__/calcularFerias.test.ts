import { calcularFerias } from '../calcularFerias';

describe('calcularFerias', () => {
  it('separa períodos vencidos simples, em dobro e férias proporcionais', () => {
    expect(
      calcularFerias({
        salarioReferencia: 3_600,
        periodosVencidos: 2,
        periodosEmDobro: 1,
        avosProporcionais: 6,
      }),
    ).toEqual({
      feriasVencidas: 4_800,
      feriasEmDobro: 9_600,
      feriasProporcionais: 2_400,
      abonoPecuniario: 0,
      descontoAbono: 0,
    });
  });

  it('retorna todas as verbas zeradas quando não há períodos, avos ou abono', () => {
    expect(
      calcularFerias({
        salarioReferencia: 3_600,
        periodosVencidos: 0,
        periodosEmDobro: 0,
        avosProporcionais: 0,
      }),
    ).toEqual({
      feriasVencidas: 0,
      feriasEmDobro: 0,
      feriasProporcionais: 0,
      abonoPecuniario: 0,
      descontoAbono: 0,
    });
  });

  it('classifica o abono como provento ou desconto conforme informado', () => {
    const comum = {
      salarioReferencia: 3_600,
      periodosVencidos: 0,
      periodosEmDobro: 0,
      avosProporcionais: 0,
    };

    expect(calcularFerias({ ...comum, abono: { tipo: 'a_pagar', valor: 500 } })).toMatchObject({
      abonoPecuniario: 500,
      descontoAbono: 0,
    });
    expect(
      calcularFerias({ ...comum, abono: { tipo: 'desconto_ja_recebido', valor: 500 } }),
    ).toMatchObject({ abonoPecuniario: 0, descontoAbono: 500 });
  });

  it('rejeita avos fora de 0 a 12 e períodos em dobro acima dos vencidos', () => {
    const comum = { salarioReferencia: 3_600, periodosVencidos: 1, periodosEmDobro: 0 };
    expect(() => calcularFerias({ ...comum, avosProporcionais: 13 })).toThrow();
    expect(() =>
      calcularFerias({ ...comum, periodosEmDobro: 2, avosProporcionais: 0 }),
    ).toThrow();
  });
});
