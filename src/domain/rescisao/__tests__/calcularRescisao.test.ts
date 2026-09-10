import { describe, expect, it } from 'vitest';
import { calcularRescisao } from '../calcularRescisao';
import { entradaBase } from './support/entradaBase';

describe('calcularRescisao', () => {
  it('orquestra dispensa sem justa causa e mantém 13º em tributação separada', () => {
    const resultado = calcularRescisao(entradaBase());

    expect(resultado.diasAvisoPrevio).toBe(39);
    expect(resultado.proventos.avisoPrevioPago).toBe(5_850);
    expect(resultado.fgts.aliquotaMulta).toBe(0.4);
    expect(resultado.tributacao.mensal.rendimentosTributaveis).toBe(1_500);
    expect(resultado.tributacao.decimoTerceiro.rendimentosTributaveis).toBeGreaterThan(0);
    expect(resultado.tributacao.mensal.rendimentosTributaveis).not.toBe(
      resultado.proventos.totalProventos,
    );
    expect(resultado.alertas.at(-1)?.mensagem).toContain('Estimativa');
  });

  it('desconta aviso não cumprido no pedido de demissão', () => {
    const entrada = entradaBase();
    entrada.motivo = 'pedido_demissao';
    entrada.avisoPrevio = { tipo: 'sem_aviso', cumprimento: 'nao_cumpriu' };
    const resultado = calcularRescisao(entrada);
    expect(resultado.descontos.avisoPrevioDesconto).toBe(5_850);
    expect(resultado.fgts.aliquotaMulta).toBe(0);
  });

  it('não concede parcelas proporcionais nem aviso na justa causa', () => {
    const entrada = entradaBase();
    entrada.motivo = 'justa_causa';
    entrada.avisoPrevio = { tipo: 'sem_aviso' };
    const resultado = calcularRescisao(entrada);
    expect(resultado.diasAvisoPrevio).toBe(0);
    expect(resultado.proventos.feriasProporcionais).toBe(0);
    expect(resultado.proventos.decimoTerceiroProporcional).toBe(0);
  });

  it('sinaliza motivos que exigem decisão humana sem inventar o aviso', () => {
    const entrada = entradaBase();
    entrada.motivo = 'culpa_reciproca_forca_maior';
    const resultado = calcularRescisao(entrada);
    expect(resultado.proventos.avisoPrevioPago).toBe(0);
    expect(resultado.alertas.some((alerta) => alerta.nivel === 'bloqueante')).toBe(true);
  });

  it('integra somente valores monetários da média e não os soma duas vezes ao bruto', () => {
    const entrada = entradaBase();
    entrada.verbasVariaveis = {
      integrar: true,
      modo: 'media_meses',
      qtdMesesMedia: 12,
      horasExtras: 3_600,
      comissoes: 2_400,
    };
    entrada.ferias = { ...entrada.ferias, calcularProporcional: false, periodosVencidos: 0 };
    entrada.decimoTerceiro = { calcular: false };
    entrada.avisoPrevio = { tipo: 'trabalhado' };
    const resultado = calcularRescisao(entrada);
    expect(resultado.proventos.mediasIntegradas).toBe(500);
    expect(resultado.proventos.saldoSalario).toBe(1_666.67);
    expect(resultado.proventos.totalProventos).toBe(1_666.67);
  });
});
