import { calcular13 } from './calcular13';
import { calcularAvosDecimoTerceiro, calcularAvosFerias } from './calcularAvos';
import { calcularAvisoPrevio, calcularValorAvisoPrevio } from './calcularAvisoPrevio';
import { arredondarCentavos } from './dinheiro';
import { calcularFerias } from './calcularFerias';
import { calcularFGTS } from './calcularFGTS';
import { calcularINSS } from './calcularINSS';
import { calcularIRRF } from './calcularIRRF';
import { calcularSaldoSalario } from './calcularSaldoSalario';
import { calcularTempoServico } from './calcularTempoServico';
import { obterRegraPorMotivo } from './regrasPorMotivo';
import { rescisaoInputSchema, type RescisaoInput } from './schema';
import { obterTabelaINSS, obterTabelaIRRF } from './tabelas';
import type { Alerta, RescisaoOutput, TributacaoCompetencia } from './tipos';

function dataLocal(dataISO: string): Date {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  return new Date(ano ?? 0, (mes ?? 1) - 1, dia ?? 1);
}

function adicionarDias(dataISO: string, dias: number): string {
  const data = dataLocal(dataISO);
  data.setDate(data.getDate() + dias);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function somarValores(objeto: object): number {
  return arredondarCentavos(
    Object.values(objeto).reduce<number>(
      (total, valor) => total + (typeof valor === 'number' ? valor : 0),
      0,
    ),
  );
}

function montarTributacao(
  rendimentos: number,
  dataReferencia: Date,
  dependentes: number,
  pensao: number,
  aplicarReducaoMensal: boolean,
): TributacaoCompetencia {
  const tabelaINSS = obterTabelaINSS(dataReferencia);
  const tabelaIRRF = obterTabelaIRRF(dataReferencia);
  const inss = calcularINSS(rendimentos, tabelaINSS);
  const irrf = calcularIRRF({
    rendimentosTributaveis: rendimentos,
    descontoINSS: inss.desconto,
    dependentes,
    pensaoAlimenticia: pensao,
    tabela: tabelaIRRF,
    aplicarReducaoMensal,
  });

  return {
    rendimentosTributaveis: irrf.rendimentosTributaveis,
    baseINSS: inss.base,
    descontoINSS: inss.desconto,
    baseIRRF: irrf.base,
    deducoesLegaisIRRF: irrf.deducoesLegais,
    deducaoSimplificadaIRRF: irrf.deducaoSimplificada,
    deducaoIRRFAplicada: irrf.deducaoAplicada,
    impostoIRRFAntesReducao: irrf.impostoAntesReducao,
    reducaoIRRF: irrf.reducao,
    descontoIRRF: irrf.desconto,
    categoriaIRRF: irrf.categoria,
    tabelaINSSAplicada: { vigenciaInicio: tabelaINSS.vigenciaInicio, fonte: tabelaINSS.fonte },
    tabelaIRRFAplicada: { vigenciaInicio: tabelaIRRF.vigenciaInicio, fonte: tabelaIRRF.fonte },
  };
}

export function calcularRescisao(entrada: RescisaoInput): RescisaoOutput {
  const input = rescisaoInputSchema.parse(entrada);
  const { dadosGerais, avisoPrevio, saldoSalario, ferias, decimoTerceiro } = input;
  const alertas: Alerta[] = [];
  const regra = obterRegraPorMotivo(input.motivo);
  const tempoServico = calcularTempoServico(dadosGerais.dataAdmissao, dadosGerais.dataDesligamento);
  const diasAvisoPrevio =
    avisoPrevio.diasManual ??
    (regra.tratamentoAviso === 'nao_aplicavel' ? 0 : calcularAvisoPrevio(tempoServico.anos));

  if (regra.exigeAnaliseManual) {
    alertas.push({
      nivel: 'bloqueante',
      mensagem: 'Este motivo depende de cláusula contratual ou decisão jurídica. O aviso e as parcelas controvertidas não foram estimados.',
    });
  }

  const totalVariaveis = somarValores({
        horasExtras: input.verbasVariaveis.horasExtras,
        adicionalNoturno: input.verbasVariaveis.adicionalNoturno,
        comissoes: input.verbasVariaveis.comissoes,
        dsrSobreVariaveis: input.verbasVariaveis.dsrSobreVariaveis,
        insalubridade: input.verbasVariaveis.insalubridade,
        periculosidade: input.verbasVariaveis.periculosidade,
        outras: input.verbasVariaveis.outras,
      });
  const mediasIntegradas = input.verbasVariaveis.integrar
    ? arredondarCentavos(
        input.verbasVariaveis.modo === 'media_meses'
          ? totalVariaveis / (input.verbasVariaveis.qtdMesesMedia ?? 1)
          : totalVariaveis,
      )
    : 0;
  const salarioReferencia = arredondarCentavos(dadosGerais.salarioBase + mediasIntegradas);
  const saldoBruto = arredondarCentavos(
    calcularSaldoSalario({ salarioBase: salarioReferencia, diasTrabalhados: saldoSalario.diasTrabalhados }),
  );
  const descontoFaltas = arredondarCentavos(
    (salarioReferencia / 30) * (saldoSalario.faltasInjustificadas ?? 0),
  );

  let aviso = { avisoPrevioPago: 0, avisoPrevioDesconto: 0 };
  if (!regra.exigeAnaliseManual) {
    aviso = calcularValorAvisoPrevio({
      motivo: input.motivo,
      tipo: avisoPrevio.tipo,
      salarioReferencia,
      diasAviso: diasAvisoPrevio,
      diasCumpridos: avisoPrevio.diasCumpridos,
    });
  }
  aviso = {
    avisoPrevioPago: arredondarCentavos(aviso.avisoPrevioPago),
    avisoPrevioDesconto: arredondarCentavos(aviso.avisoPrevioDesconto),
  };

  const diasProjetados = aviso.avisoPrevioPago > 0
    ? avisoPrevio.tipo === 'parcial'
      ? diasAvisoPrevio - (avisoPrevio.diasCumpridos ?? 0)
      : diasAvisoPrevio
    : 0;
  const dataFinalContagem = adicionarDias(dadosGerais.dataDesligamento, diasProjetados);
  const avosFerias = ferias.calcularProporcional
    ? ferias.avosProporcionalManual ?? calcularAvosFerias(dadosGerais.dataAdmissao, dataFinalContagem)
    : 0;
  const percentualFerias = regra.percentualFeriasProporcionais ?? 0;
  const resultadoFerias = calcularFerias({
    salarioReferencia,
    periodosVencidos: ferias.periodosVencidos,
    periodosEmDobro: ferias.periodosEmDobro,
    avosProporcionais: Math.round(avosFerias * percentualFerias),
    abono: ferias.abono,
  });

  const avos13 = decimoTerceiro.calcular
    ? decimoTerceiro.avosManual ?? calcularAvosDecimoTerceiro(dadosGerais.dataAdmissao, dataFinalContagem)
    : 0;
  const resultado13 = calcular13({
    salarioReferencia,
    avos: Math.round(avos13 * (regra.percentualDecimoTerceiro ?? 0)),
    adiantamentoRecebido: decimoTerceiro.adiantamentoRecebido,
  });

  const proventosSemTotal = {
    saldoSalario: saldoBruto,
    avisoPrevioPago: aviso.avisoPrevioPago,
    feriasVencidas: arredondarCentavos(resultadoFerias.feriasVencidas),
    feriasEmDobro: arredondarCentavos(resultadoFerias.feriasEmDobro),
    feriasProporcionais: arredondarCentavos(resultadoFerias.feriasProporcionais),
    decimoTerceiroProporcional: arredondarCentavos(resultado13.decimoTerceiroProporcional),
    abonoPecuniario: arredondarCentavos(resultadoFerias.abonoPecuniario),
    mediasIntegradas,
  };
  const totalProventos = somarValores({
    saldoSalario: proventosSemTotal.saldoSalario,
    avisoPrevioPago: proventosSemTotal.avisoPrevioPago,
    feriasVencidas: proventosSemTotal.feriasVencidas,
    feriasEmDobro: proventosSemTotal.feriasEmDobro,
    feriasProporcionais: proventosSemTotal.feriasProporcionais,
    decimoTerceiroProporcional: proventosSemTotal.decimoTerceiroProporcional,
    abonoPecuniario: proventosSemTotal.abonoPecuniario,
  });

  let pensao = 0;
  if (dadosGerais.pensaoAlimenticia?.tipo === 'valor_fixo') {
    pensao = dadosGerais.pensaoAlimenticia.valor;
  } else if (dadosGerais.pensaoAlimenticia?.tipo === 'percentual') {
    alertas.push({
      nivel: 'bloqueante',
      mensagem: 'Pensão percentual exige a base definida no título judicial. Informe um valor fixo já apurado para incluí-la.',
    });
  }

  if (saldoSalario.descontarDSRSobreFaltas && (saldoSalario.faltasInjustificadas ?? 0) > 0) {
    alertas.push({
      nivel: 'atencao',
      mensagem: 'O DSR sobre faltas depende da jornada e do calendário. Nenhum desconto automático de DSR foi aplicado.',
    });
  }

  const dataReferencia = dataLocal(dadosGerais.dataDesligamento);
  const tributacaoMensal = montarTributacao(
    arredondarCentavos(Math.max(0, saldoBruto - descontoFaltas)),
    dataReferencia,
    dadosGerais.dependentesIRRF,
    pensao,
    true,
  );
  const tributacao13 = montarTributacao(
    proventosSemTotal.decimoTerceiroProporcional,
    dataReferencia,
    dadosGerais.dependentesIRRF,
    0,
    false,
  );
  const totalINSS = arredondarCentavos(tributacaoMensal.descontoINSS + tributacao13.descontoINSS);
  const totalIRRF = arredondarCentavos(tributacaoMensal.descontoIRRF + tributacao13.descontoIRRF);
  const outrosDescontos = arredondarCentavos(
    saldoSalario.outrosDescontosMes + somarValores(input.descontosAdicionais),
  );
  const descontosSemTotal = {
    descontoINSS: totalINSS,
    descontoIRRF: totalIRRF,
    avisoPrevioDesconto: aviso.avisoPrevioDesconto,
    descontoFaltas,
    descontoDSR: 0,
    adiantamentoDecimoTerceiro: arredondarCentavos(resultado13.adiantamentoRecebido),
    descontoAbonoPecuniario: arredondarCentavos(resultadoFerias.descontoAbono),
    pensaoAlimenticia: arredondarCentavos(pensao),
    outrosDescontos,
  };
  const totalDescontos = somarValores(descontosSemTotal);

  const baseFGTSMes = arredondarCentavos(
    saldoBruto + aviso.avisoPrevioPago + proventosSemTotal.decimoTerceiroProporcional,
  );
  const fgtsBruto = calcularFGTS({
    baseFGTSMes,
    salarioReferencia,
    totalMeses: tempoServico.totalMeses,
    aliquotaMulta: regra.aliquotaMultaFGTS,
  });
  const fgts = {
    ...fgtsBruto,
    depositoFGTSMes: arredondarCentavos(fgtsBruto.depositoFGTSMes),
    saldoFGTSEstimado: arredondarCentavos(fgtsBruto.saldoFGTSEstimado),
    multaFGTSEstimada: arredondarCentavos(fgtsBruto.multaFGTSEstimada),
  };

  alertas.push({
    nivel: 'info',
    mensagem: 'Estimativa sem validade de TRCT. Confira CCT, extrato real do FGTS e eventos do eSocial antes de concluir a rescisão.',
  });

  return {
    tempoServico,
    diasAvisoPrevio,
    proventos: { ...proventosSemTotal, totalProventos },
    descontos: { ...descontosSemTotal, totalDescontos },
    tributacao: {
      mensal: tributacaoMensal,
      decimoTerceiro: tributacao13,
      totalINSS,
      totalIRRF,
    },
    fgts,
    liquidoEmpregado: arredondarCentavos(totalProventos - totalDescontos),
    custoTotalEmpresa: arredondarCentavos(totalProventos + fgts.depositoFGTSMes + fgts.multaFGTSEstimada),
    alertas,
  };
}
