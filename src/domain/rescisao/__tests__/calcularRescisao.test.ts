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

  it('paga pela metade aviso, 13º e férias proporcionais na culpa recíproca (Súmula 14 TST)', () => {
    const integral = calcularRescisao(entradaBase());
    const entrada = entradaBase();
    entrada.motivo = 'culpa_reciproca';
    const resultado = calcularRescisao(entrada);

    expect(resultado.proventos.avisoPrevioPago).toBeCloseTo(integral.proventos.avisoPrevioPago / 2, 2);
    expect(resultado.proventos.decimoTerceiroProporcional).toBeCloseTo(
      integral.proventos.decimoTerceiroProporcional / 2,
      2,
    );
    expect(resultado.proventos.feriasProporcionais).toBeCloseTo(
      integral.proventos.feriasProporcionais / 2,
      2,
    );
    expect(resultado.fgts.aliquotaMulta).toBe(0.2);
    expect(resultado.alertas.some((alerta) => alerta.mensagem.includes('controverso'))).toBe(true);
  });

  it('não paga aviso na força maior e aplica multa de 20%', () => {
    const entrada = entradaBase();
    entrada.motivo = 'forca_maior';
    const resultado = calcularRescisao(entrada);
    expect(resultado.proventos.avisoPrevioPago).toBe(0);
    expect(resultado.diasAvisoPrevio).toBe(0);
    expect(resultado.fgts.aliquotaMulta).toBe(0.2);
  });

  it('no falecimento paga as verbas integrais sem aviso nem multa do FGTS', () => {
    const entrada = entradaBase();
    entrada.motivo = 'falecimento';
    const resultado = calcularRescisao(entrada);
    expect(resultado.proventos.avisoPrevioPago).toBe(0);
    expect(resultado.proventos.feriasProporcionais).toBeGreaterThan(0);
    expect(resultado.proventos.decimoTerceiroProporcional).toBeGreaterThan(0);
    expect(resultado.fgts.multaFGTSEstimada).toBe(0);
  });

  it('trata a aposentadoria voluntária como pedido de demissão, sem multa', () => {
    const entrada = entradaBase();
    entrada.motivo = 'aposentadoria_voluntaria';
    entrada.avisoPrevio = { tipo: 'sem_aviso' };
    const resultado = calcularRescisao(entrada);
    expect(resultado.descontos.avisoPrevioDesconto).toBeGreaterThan(0);
    expect(resultado.fgts.multaFGTSEstimada).toBe(0);
  });

  describe('PDV', () => {
    function entradaPDV() {
      const entrada = entradaBase();
      entrada.motivo = 'pdv';
      entrada.pdv = { valorIncentivo: 20_000, multaFGTS: 0.4, pagaAvisoIndenizado: true };
      return entrada;
    }

    it('soma o incentivo aos proventos sem alterar as bases tributárias', () => {
      const comPlano = calcularRescisao(entradaPDV());
      const semIncentivo = entradaPDV();
      semIncentivo.pdv = { valorIncentivo: 0, multaFGTS: 0.4, pagaAvisoIndenizado: true };
      const base = calcularRescisao(semIncentivo);

      expect(comPlano.proventos.incentivoPDV).toBe(20_000);
      expect(comPlano.proventos.totalProventos).toBe(base.proventos.totalProventos + 20_000);
      expect(comPlano.tributacao.totalINSS).toBe(base.tributacao.totalINSS);
      expect(comPlano.tributacao.totalIRRF).toBe(base.tributacao.totalIRRF);
      expect(comPlano.fgts.baseFGTSMes).toBe(base.fgts.baseFGTSMes);
    });

    it('segue a multa e o aviso definidos pelo regulamento do plano', () => {
      const entrada = entradaPDV();
      entrada.pdv = { valorIncentivo: 5_000, multaFGTS: 0, pagaAvisoIndenizado: false };
      const resultado = calcularRescisao(entrada);
      expect(resultado.fgts.aliquotaMulta).toBe(0);
      expect(resultado.proventos.avisoPrevioPago).toBe(0);
    });

    it('exige os dados do plano', () => {
      const entrada = entradaPDV();
      delete entrada.pdv;
      expect(() => calcularRescisao(entrada)).toThrow();
    });
  });

  describe('DSR automático sobre variáveis', () => {
    it('calcula o DSR e o integra à média, sem tocar insalubridade e periculosidade', () => {
      const entrada = entradaBase();
      entrada.verbasVariaveis = {
        integrar: true,
        modo: 'valor_informado',
        horasExtras: 500,
        comissoes: 500,
        insalubridade: 300,
        dsrSobreVariaveis: 9_999, // ignorado: o cálculo automático prevalece
        dsrAutomatico: { diasUteis: 25, diasDescanso: 5 },
      };
      const resultado = calcularRescisao(entrada);
      // DSR = (500 + 500) ÷ 25 × 5 = 200 → média = 500 + 500 + 300 + 200
      expect(resultado.proventos.mediasIntegradas).toBe(1_500);
      expect(resultado.alertas.some((alerta) => alerta.mensagem.includes('DSR calculado'))).toBe(true);
    });

    it('mantém o DSR informado quando o cálculo automático não é solicitado', () => {
      const entrada = entradaBase();
      entrada.verbasVariaveis = {
        integrar: true,
        modo: 'valor_informado',
        horasExtras: 500,
        dsrSobreVariaveis: 100,
      };
      expect(calcularRescisao(entrada).proventos.mediasIntegradas).toBe(600);
    });
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

  describe('contrato a termo rescindido antes do prazo', () => {
    function termoAntecipado(
      motivo: 'antecipada_empregador_prazo_determinado' | 'antecipada_empregado_prazo_determinado',
    ) {
      const entrada = entradaBase();
      entrada.motivo = motivo;
      entrada.dadosGerais.tipoContrato = 'determinado';
      entrada.dadosGerais.dataTerminoPrevista = '2026-12-10'; // 91 dias após o desligamento
      return entrada;
    }

    it('soma a indenização do art. 479 aos proventos, sem aviso e fora das bases tributárias', () => {
      const comIndenizacao = calcularRescisao(termoAntecipado('antecipada_empregador_prazo_determinado'));
      const semPrazoRestante = termoAntecipado('antecipada_empregador_prazo_determinado');
      semPrazoRestante.dadosGerais.dataTerminoPrevista = '2026-09-10';
      const base = calcularRescisao(semPrazoRestante);

      // 4.500 / 30 × 91 dias ÷ 2
      expect(comIndenizacao.proventos.indenizacaoArt479).toBe(6_825);
      expect(comIndenizacao.proventos.avisoPrevioPago).toBe(0);
      expect(comIndenizacao.diasAvisoPrevio).toBe(0);
      expect(comIndenizacao.proventos.totalProventos).toBe(base.proventos.totalProventos + 6_825);
      expect(comIndenizacao.tributacao.totalINSS).toBe(base.tributacao.totalINSS);
      expect(comIndenizacao.tributacao.totalIRRF).toBe(base.tributacao.totalIRRF);
      expect(comIndenizacao.fgts.baseFGTSMes).toBe(base.fgts.baseFGTSMes);
      expect(comIndenizacao.alertas.some((alerta) => alerta.nivel === 'bloqueante')).toBe(false);
    });

    it('lança o art. 480 como desconto, limitado a um mês de remuneração', () => {
      const resultado = calcularRescisao(termoAntecipado('antecipada_empregado_prazo_determinado'));
      expect(resultado.descontos.indenizacaoArt480).toBe(4_500);
      expect(resultado.proventos.indenizacaoArt479).toBe(0);
    });

    it('com cláusula assecuratória (art. 481) segue as regras do contrato indeterminado', () => {
      const entrada = termoAntecipado('antecipada_empregador_prazo_determinado');
      entrada.dadosGerais.clausulaAssecuratoria = true;
      const resultado = calcularRescisao(entrada);
      expect(resultado.proventos.indenizacaoArt479).toBe(0);
      expect(resultado.proventos.avisoPrevioPago).toBeGreaterThan(0);
      expect(resultado.fgts.aliquotaMulta).toBe(0.4);
      expect(resultado.alertas.some((alerta) => alerta.nivel === 'bloqueante')).toBe(false);
    });

    it('com cláusula assecuratória, o empregado que rompe responde pelo aviso não cumprido', () => {
      const entrada = termoAntecipado('antecipada_empregado_prazo_determinado');
      entrada.dadosGerais.clausulaAssecuratoria = true;
      entrada.avisoPrevio = { tipo: 'sem_aviso' };
      const resultado = calcularRescisao(entrada);
      expect(resultado.descontos.indenizacaoArt480).toBe(0);
      expect(resultado.descontos.avisoPrevioDesconto).toBeGreaterThan(0);
      expect(resultado.fgts.aliquotaMulta).toBe(0);
    });

    it('exige a data de término prevista, posterior ou igual ao desligamento', () => {
      const entrada = termoAntecipado('antecipada_empregador_prazo_determinado');
      delete entrada.dadosGerais.dataTerminoPrevista;
      expect(() => calcularRescisao(entrada)).toThrow();
      entrada.dadosGerais.dataTerminoPrevista = '2026-09-01';
      expect(() => calcularRescisao(entrada)).toThrow();
    });
  });
});
