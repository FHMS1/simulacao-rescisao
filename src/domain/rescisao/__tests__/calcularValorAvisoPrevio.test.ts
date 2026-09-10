import { calcularValorAvisoPrevio } from '../calcularAvisoPrevio';

describe('calcularValorAvisoPrevio', () => {
  it('paga integralmente o aviso indenizado na dispensa sem justa causa', () => {
    expect(
      calcularValorAvisoPrevio({
        motivo: 'sem_justa_causa',
        tipo: 'indenizado',
        salarioReferencia: 3_000,
        diasAviso: 39,
      }),
    ).toEqual({ avisoPrevioPago: 3_900, avisoPrevioDesconto: 0 });
  });

  it('não lança o aviso trabalhado como provento adicional', () => {
    expect(
      calcularValorAvisoPrevio({
        motivo: 'sem_justa_causa',
        tipo: 'trabalhado',
        salarioReferencia: 3_000,
        diasAviso: 39,
      }),
    ).toEqual({ avisoPrevioPago: 0, avisoPrevioDesconto: 0 });
  });

  it('indeniza somente os dias restantes do aviso parcial', () => {
    expect(
      calcularValorAvisoPrevio({
        motivo: 'sem_justa_causa',
        tipo: 'parcial',
        salarioReferencia: 3_000,
        diasAviso: 39,
        diasCumpridos: 15,
      }),
    ).toEqual({ avisoPrevioPago: 2_400, avisoPrevioDesconto: 0 });
  });

  it('reduz pela metade somente a parcela indenizada no acordo 484-A', () => {
    expect(
      calcularValorAvisoPrevio({
        motivo: 'acordo_484a',
        tipo: 'parcial',
        salarioReferencia: 3_000,
        diasAviso: 39,
        diasCumpridos: 15,
      }),
    ).toEqual({ avisoPrevioPago: 1_200, avisoPrevioDesconto: 0 });
  });

  it('desconta todo o aviso não cumprido no pedido de demissão', () => {
    expect(
      calcularValorAvisoPrevio({
        motivo: 'pedido_demissao',
        tipo: 'sem_aviso',
        salarioReferencia: 3_000,
        diasAviso: 30,
      }),
    ).toEqual({ avisoPrevioPago: 0, avisoPrevioDesconto: 3_000 });
  });

  it('desconta somente os dias restantes no pedido de demissão com cumprimento parcial', () => {
    expect(
      calcularValorAvisoPrevio({
        motivo: 'pedido_demissao',
        tipo: 'parcial',
        salarioReferencia: 3_000,
        diasAviso: 30,
        diasCumpridos: 11,
      }),
    ).toEqual({ avisoPrevioPago: 0, avisoPrevioDesconto: 1_900 });
  });

  it('não gera aviso em dispensa por justa causa', () => {
    expect(
      calcularValorAvisoPrevio({
        motivo: 'justa_causa',
        tipo: 'sem_aviso',
        salarioReferencia: 3_000,
        diasAviso: 0,
      }),
    ).toEqual({ avisoPrevioPago: 0, avisoPrevioDesconto: 0 });
  });

  it('bloqueia motivos que exigem análise de cláusula ou decisão judicial', () => {
    expect(() =>
      calcularValorAvisoPrevio({
        motivo: 'antecipada_empregador_prazo_determinado',
        tipo: 'indenizado',
        salarioReferencia: 3_000,
        diasAviso: 30,
      }),
    ).toThrow('análise manual');
  });

  it('rejeita cumprimento parcial sem quantidade válida de dias cumpridos', () => {
    expect(() =>
      calcularValorAvisoPrevio({
        motivo: 'sem_justa_causa',
        tipo: 'parcial',
        salarioReferencia: 3_000,
        diasAviso: 30,
      }),
    ).toThrow('Dias cumpridos');
    expect(() =>
      calcularValorAvisoPrevio({
        motivo: 'sem_justa_causa',
        tipo: 'parcial',
        salarioReferencia: 3_000,
        diasAviso: 30,
        diasCumpridos: 31,
      }),
    ).toThrow('Dias cumpridos');
  });
});
