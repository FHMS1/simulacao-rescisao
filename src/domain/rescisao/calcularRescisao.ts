import { calcular13 } from './calcular13';
import { calcularAvosDecimoTerceiro, calcularAvosFerias } from './calcularAvos';
import { calcularAvisoPrevio, calcularValorAvisoPrevio } from './calcularAvisoPrevio';
import { arredondarCentavos } from './dinheiro';
import { calcularDSR } from './calcularDSR';
import { calcularFerias } from './calcularFerias';
import { calcularIndenizacaoTermoAntecipado } from './calcularIndenizacaoTermoAntecipado';
import { calcularFGTS } from './calcularFGTS';
import { calcularINSS } from './calcularINSS';
import { calcularIRRF } from './calcularIRRF';
import { calcularSaldoSalario } from './calcularSaldoSalario';
import { calcularTempoServico } from './calcularTempoServico';
import { obterRegraPorMotivo, type RegraPorMotivo } from './regrasPorMotivo';
import { rescisaoInputSchema, type RescisaoInput } from './schema';
import { obterTabelaINSS, obterTabelaIRRF } from './tabelas';
import type { Alerta, MotivoRescisao, RescisaoOutput, TributacaoCompetencia } from './tipos';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

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
  const regraDoMotivo = obterRegraPorMotivo(input.motivo);
  const pdv = input.motivo === 'pdv' ? input.pdv : undefined;
  const tempoServico = calcularTempoServico(dadosGerais.dataAdmissao, dadosGerais.dataDesligamento);
  // Contrato a termo rescindido antes do prazo: sem cláusula assecuratória (CLT,
  // art. 481) vale a indenização dos arts. 479/480 e não há aviso prévio; com a
  // cláusula valem as regras do contrato indeterminado, que dependem do caso.
  const termoAntecipado = regraDoMotivo.artigoEspecial !== null;
  const comClausulaAssecuratoria = termoAntecipado && dadosGerais.clausulaAssecuratoria === true;
  const aplicaIndenizacaoTermo = termoAntecipado && !comClausulaAssecuratoria;
  // Com cláusula assecuratória a rescisão segue as regras do contrato por prazo
  // indeterminado (CLT, art. 481; Súmula 163 TST), conforme quem a promoveu.
  const motivoEfetivo: MotivoRescisao = comClausulaAssecuratoria
    ? input.motivo === 'antecipada_empregador_prazo_determinado'
      ? 'sem_justa_causa'
      : 'pedido_demissao'
    : input.motivo;
  const regraBase = obterRegraPorMotivo(motivoEfetivo);
  // No PDV, aviso e multa do FGTS vêm do regulamento do plano informado.
  const regra: RegraPorMotivo = pdv
    ? {
        ...regraBase,
        aliquotaMultaFGTS: pdv.multaFGTS,
        tratamentoAviso: pdv.pagaAvisoIndenizado ? 'pago_empregador' : 'nao_aplicavel',
      }
    : regraBase;
  const exigeAnaliseManual = regra.exigeAnaliseManual && !aplicaIndenizacaoTermo;
  const diasAvisoPrevio =
    avisoPrevio.diasManual ??
    (regra.tratamentoAviso === 'nao_aplicavel' || aplicaIndenizacaoTermo
      ? 0
      : calcularAvisoPrevio(tempoServico.anos));

  if (exigeAnaliseManual) {
    alertas.push({
      nivel: 'bloqueante',
      mensagem: 'Este motivo depende de cláusula contratual ou decisão jurídica. O aviso e as parcelas controvertidas não foram estimados.',
    });
  }

  const dsrAutomatico = input.verbasVariaveis.integrar ? input.verbasVariaveis.dsrAutomatico : undefined;
  const dsrSobreVariaveis = dsrAutomatico
    ? calcularDSR({
        baseVariaveis: somarValores({
          horasExtras: input.verbasVariaveis.horasExtras,
          adicionalNoturno: input.verbasVariaveis.adicionalNoturno,
          comissoes: input.verbasVariaveis.comissoes,
        }),
        diasUteis: dsrAutomatico.diasUteis,
        diasDescanso: dsrAutomatico.diasDescanso,
      })
    : input.verbasVariaveis.dsrSobreVariaveis;
  if (dsrAutomatico) {
    alertas.push({
      nivel: 'info',
      mensagem: `DSR calculado automaticamente: ${moeda.format(dsrSobreVariaveis ?? 0)} (dias úteis ${dsrAutomatico.diasUteis}, descansos ${dsrAutomatico.diasDescanso}). Em médias de vários meses, a mesma proporção foi aplicada ao total acumulado.`,
      fonte: 'Lei 605/1949, art. 7º; Súmulas 172 e 27 do TST',
    });
  }

  const totalVariaveis = somarValores({
        horasExtras: input.verbasVariaveis.horasExtras,
        adicionalNoturno: input.verbasVariaveis.adicionalNoturno,
        comissoes: input.verbasVariaveis.comissoes,
        dsrSobreVariaveis,
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
  // `regra.exigeAnaliseManual` (e não a variável local) é proposital: nos termos
  // antecipados sem cláusula não há aviso a estimar.
  if (!regra.exigeAnaliseManual) {
    aviso = calcularValorAvisoPrevio({
      motivo: motivoEfetivo,
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
    avosProporcionais: avosFerias,
    abono: ferias.abono,
  });

  const avos13 = decimoTerceiro.calcular
    ? decimoTerceiro.avosManual ?? calcularAvosDecimoTerceiro(dadosGerais.dataAdmissao, dataFinalContagem)
    : 0;
  const resultado13 = calcular13({
    salarioReferencia,
    avos: avos13,
    adiantamentoRecebido: decimoTerceiro.adiantamentoRecebido,
  });

  let indenizacaoArt479 = 0;
  let indenizacaoArt480 = 0;
  if (aplicaIndenizacaoTermo && dadosGerais.dataTerminoPrevista) {
    const indenizacao = calcularIndenizacaoTermoAntecipado({
      salarioReferencia,
      dataDesligamento: dadosGerais.dataDesligamento,
      dataTerminoPrevista: dadosGerais.dataTerminoPrevista,
    });
    if (regra.artigoEspecial === '479') {
      indenizacaoArt479 = indenizacao.valorArt479;
      alertas.push({
        nivel: 'atencao',
        mensagem: `Indenização do art. 479 estimada sobre ${indenizacao.diasRestantes} dias restantes de contrato. Tratada como indenizatória, sem incidência de INSS, IRRF e FGTS — premissa pendente de validação do responsável técnico.`,
        fonte: 'CLT, art. 479; Lei 7.713/1988, art. 6º, V; Decreto 3.048/1999, art. 214, §9º',
      });
    } else {
      indenizacaoArt480 = indenizacao.tetoArt480;
      alertas.push({
        nivel: 'atencao',
        mensagem: 'O valor do art. 480 é o teto: o empregador deve comprovar o prejuízo real, e o desconto na rescisão não pode passar de um mês de remuneração. Ajuste o valor se o prejuízo apurado for menor.',
        fonte: 'CLT, arts. 477 §5º e 480',
      });
    }
  } else if (comClausulaAssecuratoria) {
    alertas.push({
      nivel: 'atencao',
      mensagem: 'Com cláusula assecuratória, a indenização dos arts. 479/480 não se aplica: o desligamento seguiu as regras de contrato por prazo indeterminado, inclusive aviso prévio.',
      fonte: 'CLT, art. 481; Súmula 163 do TST',
    });
  }

  if (input.motivo === 'culpa_reciproca') {
    alertas.push({
      nivel: 'atencao',
      mensagem: 'Culpa recíproca depende de reconhecimento judicial. Aviso, 13º e férias proporcionais foram pagos pela metade, e a multa do FGTS foi de 20%. A redução das férias proporcionais é entendimento controverso — confirmar com o responsável técnico.',
      fonte: 'CLT, art. 484; Súmula 14 do TST',
    });
  } else if (input.motivo === 'forca_maior') {
    alertas.push({
      nivel: 'atencao',
      mensagem: 'Força maior exige a extinção da empresa ou do estabelecimento. Sem aviso prévio, com multa de 20% do FGTS.',
      fonte: 'CLT, arts. 501 e 502; Lei 8.036/1990, art. 18, §2º',
    });
  } else if (input.motivo === 'falecimento') {
    alertas.push({
      nivel: 'atencao',
      mensagem: 'As verbas são pagas aos dependentes habilitados perante a Previdência (ou, na falta deles, aos sucessores por alvará), assim como o saque do FGTS. Sem aviso prévio e sem multa de 40%.',
      fonte: 'Lei 6.858/1980; CLT, art. 483, §2º',
    });
  } else if (input.motivo === 'aposentadoria_voluntaria') {
    alertas.push({
      nivel: 'atencao',
      mensagem: 'Tratada como pedido de demissão do aposentado. A aposentadoria por si só não extingue o contrato; aposentadoria por invalidez suspende o contrato e não se calcula aqui.',
      fonte: 'STF, ADI 1721; Lei 8.036/1990, art. 20, III',
    });
  } else if (pdv) {
    alertas.push({
      nivel: 'atencao',
      mensagem: 'Incentivo do PDV tratado como indenização, fora das bases de INSS, IRRF e FGTS. Aviso e multa do FGTS seguem o regulamento do plano informado — premissa pendente de validação do responsável técnico.',
      fonte: 'Súmula 215 do STJ; Decreto 3.048/1999, art. 214, §9º',
    });
  }

  const proventosSemTotal = {
    saldoSalario: saldoBruto,
    avisoPrevioPago: aviso.avisoPrevioPago,
    feriasVencidas: arredondarCentavos(resultadoFerias.feriasVencidas),
    feriasEmDobro: arredondarCentavos(resultadoFerias.feriasEmDobro),
    feriasProporcionais: arredondarCentavos(resultadoFerias.feriasProporcionais * percentualFerias),
    decimoTerceiroProporcional: arredondarCentavos(
      resultado13.decimoTerceiroProporcional * (regra.percentualDecimoTerceiro ?? 0),
    ),
    abonoPecuniario: arredondarCentavos(resultadoFerias.abonoPecuniario),
    mediasIntegradas,
    indenizacaoArt479,
    incentivoPDV: arredondarCentavos(pdv?.valorIncentivo ?? 0),
  };
  const totalProventos = somarValores({
    saldoSalario: proventosSemTotal.saldoSalario,
    avisoPrevioPago: proventosSemTotal.avisoPrevioPago,
    feriasVencidas: proventosSemTotal.feriasVencidas,
    feriasEmDobro: proventosSemTotal.feriasEmDobro,
    feriasProporcionais: proventosSemTotal.feriasProporcionais,
    decimoTerceiroProporcional: proventosSemTotal.decimoTerceiroProporcional,
    abonoPecuniario: proventosSemTotal.abonoPecuniario,
    indenizacaoArt479: proventosSemTotal.indenizacaoArt479,
    incentivoPDV: proventosSemTotal.incentivoPDV,
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
    indenizacaoArt480,
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
