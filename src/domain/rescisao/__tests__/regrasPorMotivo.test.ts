import { obterRegraPorMotivo } from '../regrasPorMotivo';
import type { MotivoRescisao } from '../tipos';

describe('obterRegraPorMotivo', () => {
  it.each<[
    MotivoRescisao,
    number,
    number,
  ]>([
    ['sem_justa_causa', 0.4, 1],
    ['pedido_demissao', 0, 0],
    ['justa_causa', 0, 0],
    ['acordo_484a', 0.2, 0.8],
    ['termino_prazo_determinado', 0, 1],
    ['antecipada_empregador_prazo_determinado', 0.4, 1],
    ['antecipada_empregado_prazo_determinado', 0, 0],
    ['rescisao_indireta', 0.4, 1],
    ['culpa_reciproca', 0.2, 1],
    ['forca_maior', 0.2, 1],
    ['falecimento', 0, 1],
    ['aposentadoria_voluntaria', 0, 1],
    ['pdv', 0, 1],
  ])('mapeia %s para multa %s e saque %s', (motivo, multa, saque) => {
    const regra = obterRegraPorMotivo(motivo);
    expect(regra.aliquotaMultaFGTS).toBe(multa);
    expect(regra.percentualSaqueFGTS).toBe(saque);
  });

  it('define o tratamento de aviso dos motivos não controversos', () => {
    expect(obterRegraPorMotivo('sem_justa_causa').tratamentoAviso).toBe('pago_empregador');
    expect(obterRegraPorMotivo('pedido_demissao').tratamentoAviso).toBe(
      'descontavel_empregado',
    );
    expect(obterRegraPorMotivo('acordo_484a').tratamentoAviso).toBe(
      'pago_metade_empregador',
    );
    expect(obterRegraPorMotivo('justa_causa').tratamentoAviso).toBe('nao_aplicavel');
  });

  it('marca situações que dependem de cláusula ou decisão judicial', () => {
    expect(
      obterRegraPorMotivo('antecipada_empregador_prazo_determinado').exigeAnaliseManual,
    ).toBe(true);
    expect(obterRegraPorMotivo('antecipada_empregado_prazo_determinado').exigeAnaliseManual).toBe(
      true,
    );
  });

  it('aplica a Súmula 14 do TST na culpa recíproca', () => {
    const regra = obterRegraPorMotivo('culpa_reciproca');
    expect(regra.tratamentoAviso).toBe('pago_metade_empregador');
    expect(regra.percentualDecimoTerceiro).toBe(0.5);
    expect(regra.percentualFeriasProporcionais).toBe(0.5);
  });

  it('registra as indenizações específicas dos artigos 479 e 480', () => {
    expect(obterRegraPorMotivo('antecipada_empregador_prazo_determinado').artigoEspecial).toBe(
      '479',
    );
    expect(obterRegraPorMotivo('antecipada_empregado_prazo_determinado').artigoEspecial).toBe(
      '480',
    );
  });
});
