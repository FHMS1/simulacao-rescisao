/* ══════════════════════════════════════════════════════════════
   SIMULADOR DE RESCISÃO CLT — Êxito Contábil
   script.js — Lógica completa de cálculo rescisório
   ══════════════════════════════════════════════════════════════ */

'use strict';

// ══════════════════════════════════════════════════════════════
//  CONFIG — Atualizar aqui todo início de ano
//  Não altere fora deste objeto para facilitar manutenção
// ══════════════════════════════════════════════════════════════
const CONFIG = {

  // Ano das tabelas (para o banner de atualização)
  ano_tabelas: 2026,

  // Salário mínimo vigente
  salario_minimo: 1518.00,

  // Teto previdenciário INSS 2025
  inss_teto: 8475.55,

  // Tabela INSS empregado — progressiva 2025
  inss_faixas: [
    { teto: 1621.00,  aliq: 0.075 },
    { teto: 2902.84,  aliq: 0.09  },
    { teto: 4354.27,  aliq: 0.12  },
    { teto: 8475.55,  aliq: 0.14  },
  ],

  // Tabela IRRF 2026 — base = remuneração tributável - INSS - deduções
  irrf_faixas: [
    { teto: 2428.80,  aliq: 0,      ded: 0      },
    { teto: 2826.65,  aliq: 0.075,  ded: 182.16 },
    { teto: 3751.05,  aliq: 0.15,   ded: 394.16 },
    { teto: 4664.68,  aliq: 0.225,  ded: 675.49 },
    { teto: Infinity, aliq: 0.275,  ded: 908.73 },
  ],

  // Dedução por dependente para IRRF (2026)
  irrf_deducao_dependente: 189.59,

  // Isenção IRRF até R$5.000 (MP 1.294/2024)
  irrf_isencao_teto:       5000.00,
  irrf_reducao_teto:       7350.00,
  irrf_desconto_max:        312.89,
  irrf_reducao_constante:   979.62,
  irrf_reducao_fator:       0.133145,

  // FGTS
  fgts_aliq:  0.08,  // alíquota mensal
  multa_40:   0.40,  // dispensa sem justa causa / rescisão indireta
  multa_20:   0.20,  // acordo 484-A e força maior
  multa_0:    0,     // pedido demissão / justa causa

  // Aviso prévio proporcional
  aviso_base_dias:      30,   // mínimo CLT
  aviso_adicional_dias: 3,    // por ano completo trabalhado
  aviso_maximo_dias:    90,   // teto legal

  // Divisor para salário diário
  divisor_saldo:  30,

  // Horas mensais
  horas_mes: 220,
};

// ══════════════════════════════════════════════════════════════
//  DADOS DE RESCISÃO POR MOTIVO
//  Define quais verbas e multas se aplicam a cada tipo
// ══════════════════════════════════════════════════════════════
const RESCISAO_REGRAS = {
  sem_justa_causa: {
    label: 'Dispensa sem justa causa',
    aviso: true,
    avisoPago: true,          // empresa paga aviso
    multa_fgts: 'multa_40',
    saque_fgts: true,
    seguro_desemprego: true,
    art479: false,
    art480: false,
    acordo484a: false,
    verbas: ['saldo','aviso','ferias_vencidas','ferias_prop','decimo_terceiro','fgts','multa'],
    info: '✅ Direito a aviso prévio indenizado ou trabalhado, multa de 40% do FGTS, saque do FGTS e seguro-desemprego.',
  },
  pedido_demissao: {
    label: 'Pedido de demissão',
    aviso: true,
    avisoPago: false,         // empregado deve cumprir ou sofre desconto
    multa_fgts: 'multa_0',
    saque_fgts: false,
    seguro_desemprego: false,
    art479: false,
    art480: false,
    acordo484a: false,
    verbas: ['saldo','ferias_vencidas','ferias_prop','decimo_terceiro'],
    info: '⚠️ Sem multa de FGTS, sem saque do FGTS e sem seguro-desemprego. O empregado deve cumprir o aviso prévio ou sofrerá desconto proporcional.',
  },
  justa_causa: {
    label: 'Dispensa por justa causa',
    aviso: false,
    avisoPago: false,
    multa_fgts: 'multa_0',
    saque_fgts: false,
    seguro_desemprego: false,
    art479: false,
    art480: false,
    acordo484a: false,
    verbas: ['saldo','ferias_vencidas'],
    info: '🚨 Somente saldo de salário e férias vencidas + 1/3. Sem aviso, sem multa de FGTS, sem saque, sem seguro-desemprego.',
  },
  acordo_484a: {
    label: 'Rescisão por acordo (Art. 484-A)',
    aviso: true,
    avisoPago: true,
    multa_fgts: 'multa_20',
    saque_fgts: true,          // parcial — 80%
    seguro_desemprego: false,
    art479: false,
    art480: false,
    acordo484a: true,
    verbas: ['saldo','aviso_metade','ferias_vencidas','ferias_prop','decimo_terceiro','fgts','multa'],
    info: '⚠️ Acordo mútuo (Art. 484-A CLT): aviso prévio de metade (se indenizado), multa de 20% do FGTS, saque de até 80% do saldo. Sem seguro-desemprego.',
  },
  termino_determinado: {
    label: 'Término normal — contrato por prazo determinado',
    aviso: false,
    avisoPago: false,
    multa_fgts: 'multa_0',
    saque_fgts: true,
    seguro_desemprego: false,
    art479: false,
    art480: false,
    acordo484a: false,
    verbas: ['saldo','ferias_vencidas','ferias_prop','decimo_terceiro','fgts'],
    info: 'ℹ️ Término natural do contrato a prazo. Sem aviso prévio, sem multa de FGTS. Verifique convenção coletiva sobre seguro-desemprego.',
  },
  rescisao_antecipada_emp: {
    label: 'Rescisão antecipada pelo empregador (prazo det.)',
    aviso: false,
    avisoPago: false,
    multa_fgts: 'multa_40',
    saque_fgts: true,
    seguro_desemprego: false,
    art479: true,             // indenização art. 479
    art480: false,
    acordo484a: false,
    verbas: ['saldo','ferias_vencidas','ferias_prop','decimo_terceiro','fgts','multa','art479'],
    info: '⚠️ Rescisão antecipada pelo empregador: multa de 40% do FGTS + indenização do Art. 479 CLT (metade dos salários do restante do contrato). Sem aviso prévio obrigatório.',
  },
  rescisao_antecipada_empregado: {
    label: 'Rescisão antecipada pelo empregado (prazo det.)',
    aviso: false,
    avisoPago: false,
    multa_fgts: 'multa_0',
    saque_fgts: false,
    seguro_desemprego: false,
    art479: false,
    art480: true,             // desconto art. 480
    acordo484a: false,
    verbas: ['saldo','ferias_vencidas','ferias_prop','decimo_terceiro'],
    info: '⚠️ Rescisão antecipada pelo empregado: possível desconto do Art. 480 CLT (prejuízo causado ao empregador, limitado à indenização do Art. 479). Sem multa de FGTS.',
  },
  rescisao_indireta: {
    label: 'Rescisão indireta',
    aviso: true,
    avisoPago: true,
    multa_fgts: 'multa_40',
    saque_fgts: true,
    seguro_desemprego: true,
    art479: false,
    art480: false,
    acordo484a: false,
    verbas: ['saldo','aviso','ferias_vencidas','ferias_prop','decimo_terceiro','fgts','multa'],
    info: '✅ Equivalente à dispensa sem justa causa: aviso prévio, multa 40% FGTS, saque do FGTS e seguro-desemprego. Requer comprovação da falta grave do empregador.',
  },
  culpa_reciproca: {
    label: 'Culpa recíproca / Força maior',
    aviso: false,
    avisoPago: false,
    multa_fgts: 'multa_20',
    saque_fgts: true,
    seguro_desemprego: false,
    art479: false,
    art480: false,
    acordo484a: false,
    verbas: ['saldo','ferias_vencidas','ferias_prop','decimo_terceiro','fgts','multa'],
    info: '⚠️ Cenário controvertido — multa de 20% (jurisprudência diverge). Verifique Súmula 14 TST para culpa recíproca. Para força maior, consultar Arts. 501-502 CLT.',
  },
};

// ══════════════════════════════════════════════════════════════
//  GLOSSÁRIO — termos rescisórios
// ══════════════════════════════════════════════════════════════
const GLOSSARIO = [
  { tag: 'Verbas', titulo: 'Saldo de Salário',
    desc: 'Valor proporcional ao período trabalhado no mês da rescisão. Calculado dividindo o salário por 30 e multiplicando pelos dias efetivamente trabalhados.',
    lei: '📜 CLT, Art. 477 — "Na extinção do contrato de trabalho, o empregador deverá proceder à anotação na CTPS, comunicar a dispensa aos órgãos competentes e pagar as verbas rescisórias."' },
  { tag: 'Verbas', titulo: 'Aviso Prévio Trabalhado',
    desc: 'O empregado continua trabalhando durante o período de aviso. O salário desse período compõe o acerto rescisório normalmente.',
    lei: '📜 CLT, Art. 487 — prazo mínimo de 30 dias. Art. 1º Lei 12.506/2011 — acréscimo de 3 dias por ano completo de serviço, até 90 dias.' },
  { tag: 'Verbas', titulo: 'Aviso Prévio Indenizado',
    desc: 'A empresa dispensa o empregado imediatamente e paga o valor equivalente ao período de aviso. O período conta como tempo de serviço.',
    lei: '📜 CLT, Art. 487, §1º — "A falta do aviso prévio por parte do empregador dá ao empregado o direito aos salários correspondentes ao prazo do aviso."' },
  { tag: 'Desconto', titulo: 'Aviso Prévio Descontado',
    desc: 'Quando o empregado pede demissão mas não cumpre o aviso prévio, o empregador pode descontar o valor correspondente aos dias não cumpridos.',
    lei: '📜 CLT, Art. 487, §2º — "A falta de aviso prévio por parte do empregado dá ao empregador o direito de descontar os salários correspondentes ao prazo respectivo."' },
  { tag: 'Verbas', titulo: 'Férias Vencidas',
    desc: 'Férias que o empregado tinha direito e não gozou antes da rescisão. São sempre pagas na rescisão, independentemente do motivo.',
    lei: '📜 CLT, Art. 146 — "Na cessação do contrato de trabalho, qualquer que seja a sua causa, será devida ao empregado a remuneração simples ou em dobro das férias vencidas."' },
  { tag: 'Verbas', titulo: 'Férias Proporcionais',
    desc: 'Férias calculadas proporcionalmente ao período aquisitivo incompleto no momento da rescisão. Cada mês completo trabalhado equivale a 1/12 das férias.',
    lei: '📜 CLT, Art. 147 — devido em dispensa sem justa causa. Súmula 261 TST — também devido em pedido de demissão.' },
  { tag: 'Verbas', titulo: 'Férias em Dobro',
    desc: 'Férias vencidas que não foram concedidas dentro do período concessivo (até 12 meses após o período aquisitivo). O empregador deve pagar em dobro.',
    lei: '📜 CLT, Art. 137 — "Sempre que as férias forem concedidas após o prazo de que trata o art. 134, o empregador pagará em dobro a respectiva remuneração."' },
  { tag: 'Verbas', titulo: '1/3 Constitucional',
    desc: 'Adicional de um terço sobre o valor das férias (vencidas e proporcionais), garantido constitucionalmente. Sempre acompanha o pagamento de férias.',
    lei: '📜 CF/1988, Art. 7º, XVII — "gozo de férias anuais remuneradas com, pelo menos, um terço a mais do que o salário normal."' },
  { tag: 'Verbas', titulo: '13º Proporcional',
    desc: 'Gratificação natalina proporcional ao número de meses trabalhados no ano. Cada mês completo equivale a 1/12.',
    lei: '📜 Lei 4.090/1962, Art. 3º — "Quando a rescisão do contrato de trabalho se der sem justa causa, no decorrer do ano, o empregado receberá o 13º proporcional."' },
  { tag: 'Verbas', titulo: 'Avos',
    desc: 'Frações de um período anual. 12 avos = período completo. Cada mês trabalhado completo conta como 1 avo. Usado para calcular 13º e férias proporcionais.',
    lei: '📜 Decreto 57.155/1965 — regulamenta o cálculo por avos para 13º salário.' },
  { tag: 'Desconto', titulo: 'DSR sobre Faltas',
    desc: 'Quando há faltas injustificadas, além do desconto do dia faltado, perde-se também o Descanso Semanal Remunerado (DSR) da semana correspondente.',
    lei: '📜 Lei 605/1949 — "Não será devida a remuneração quando, sem motivo justificado, o empregado não tiver trabalhado na semana anterior."' },
  { tag: 'Verbas', titulo: 'Médias de Verbas Variáveis',
    desc: 'Quando o empregado recebe habitualmente verbas variáveis (horas extras, comissões, adicional noturno), essas devem ser integradas nas verbas rescisórias pela média dos últimos 12 meses.',
    lei: '📜 CLT, Art. 487, §5º e Súmula 253 TST — integração da gratificação semestral. OJ 394 SDI-1 TST — integração de horas extras habituais.' },
  { tag: 'FGTS', titulo: 'FGTS Rescisório',
    desc: 'Depósito de 8% sobre as verbas de natureza salarial do mês da rescisão (saldo de salário, 13º proporcional, aviso indenizado quando aplicável).',
    lei: '📜 Lei 8.036/1990, Art. 15. Circular CEF 860/2015 — base de cálculo do FGTS na rescisão.' },
  { tag: 'FGTS', titulo: 'Multa de 40% do FGTS',
    desc: 'Indenização compensatória paga pelo empregador ao empregado dispensado sem justa causa, equivalente a 40% de todos os depósitos do FGTS.',
    lei: '📜 CF/1988, Art. 7º, I. Lei 8.036/1990, Art. 18, §1º — "na dispensa sem justa causa, inclusive a indireta, é devida ao empregado multa de 40%."' },
  { tag: 'FGTS', titulo: 'Multa de 20% do FGTS',
    desc: 'Multa reduzida aplicável na rescisão por acordo mútuo (Art. 484-A CLT) e casos de força maior reconhecida.',
    lei: '📜 CLT, Art. 484-A, II — "pagamento de cinquenta por cento do valor da indenização sobre o saldo do FGTS" (equivalente a 20% do total de depósitos).' },
  { tag: 'Verbas', titulo: 'Seguro-desemprego',
    desc: 'Benefício concedido ao trabalhador dispensado sem justa causa. Não é calculado na ferramenta — apenas informamos o direito. O valor e parcelas dependem do histórico de vínculos.',
    lei: '📜 Lei 7.998/1990 — institui o seguro-desemprego. Resolução CODEFAT.' },
  { tag: 'Verbas', titulo: 'Rescisão por Acordo (484-A)',
    desc: 'Modalidade criada pela Reforma Trabalhista: acordo entre empregado e empregador. Aviso prévio de metade, multa FGTS de 20%, saque parcial de 80%, sem seguro-desemprego.',
    lei: '📜 CLT, Art. 484-A (inserido pela Lei 13.467/2017).' },
  { tag: 'Verbas', titulo: 'Indenização Art. 479 CLT',
    desc: 'Devida pelo empregador quando rescinde antecipadamente contrato por prazo determinado. Equivale à metade dos salários que seriam devidos até o fim do contrato.',
    lei: '📜 CLT, Art. 479 — "Nos contratos que tenham termo estipulado, o empregador que, sem justa causa, despedir o empregado será obrigado a pagar-lhe, a título de indenização, e por metade, a remuneração a que teria direito até o termo do contrato."' },
  { tag: 'Desconto', titulo: 'Desconto Art. 480 CLT',
    desc: 'Pode ser descontado do empregado que rescinde antecipadamente contrato a prazo, caso cause prejuízo ao empregador. Limitado ao valor da indenização do Art. 479.',
    lei: '📜 CLT, Art. 480 — "Havendo termo estipulado, o empregado não se poderá desligar do contrato, sem justa causa, sob pena de ser obrigado a indenizar o empregador dos prejuízos que desse fato lhe resultarem."' },
  { tag: 'Tributação', titulo: 'Verbas Remuneratórias',
    desc: 'Verbas que remuneram o trabalho e compõem a base de cálculo de INSS e IRRF. Ex: saldo de salário, 13º salário, horas extras, adicional noturno.',
    lei: '📜 CLT, Art. 457. IN RFB 971/2009 — define a incidência previdenciária sobre verbas trabalhistas.' },
  { tag: 'Tributação', titulo: 'Verbas Indenizatórias',
    desc: 'Verbas de natureza indenizatória não sofrem incidência de INSS nem IRRF. Ex: aviso prévio indenizado (para FGTS sim), férias indenizadas, multa 40% FGTS.',
    lei: '📜 Solução de Consulta COSIT e jurisprudência TST. Atenção: aviso prévio indenizado incide FGTS (Súmula 305 TST), mas não INSS (STJ).' },
  { tag: 'Tributação', titulo: 'Base de INSS',
    desc: 'Conjunto de verbas de natureza salarial sobre as quais incide a contribuição previdenciária do empregado. Limitada ao teto previdenciário.',
    lei: '📜 Lei 8.212/1991, Art. 20. Tabela progressiva conforme Portaria MPS/MF vigente.' },
  { tag: 'Tributação', titulo: 'Base de IRRF',
    desc: 'Base de cálculo do imposto de renda na rescisão: verbas tributáveis menos INSS, deduções por dependentes e pensão alimentícia.',
    lei: '📜 Lei 7.713/1988. RIR/2018. Instrução Normativa RFB 1.500/2014 — tributação na fonte sobre rendimentos do trabalho.' },
  { tag: 'Resultado', titulo: 'Valor Líquido a Receber',
    desc: 'Total das verbas rescisórias após dedução de todos os descontos (INSS, IRRF, aviso, faltas, adiantamentos, benefícios, etc.).',
    lei: '📜 CLT, Art. 477, §6º — prazo para pagamento: até o 10º dia após a rescisão (com homologação) ou no ato da comunicação.' },
  { tag: 'Resultado', titulo: 'Custo Total da Empresa',
    desc: 'Soma de todos os valores que a empresa efetivamente desembolsa na rescisão: verbas pagas ao empregado + FGTS + multa FGTS + encargos patronais sobre verbas rescisórias.',
    lei: '📜 Lei 8.036/1990. CLT, Arts. 477-484-A. Considera também os depósitos de FGTS das verbas rescisórias.' },
];

// ══════════════════════════════════════════════════════════════
//  UTILITÁRIOS
// ══════════════════════════════════════════════════════════════

/** Formata número como moeda BRL */
const fmt = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Pega valor numérico de um input */
const n = id => parseFloat(document.getElementById(id)?.value) || 0;

/** Pega valor de um select */
const sel = id => document.getElementById(id)?.value || '';

/** Pega se checkbox/select é "sim" */
const isSim = id => document.getElementById(id)?.value === 'sim';

/** Mostra/oculta elemento */
function show(id, visible) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? 'block' : 'none';
}

function showFlex(id, visible) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? 'flex' : 'none';
}

/** Toast de notificação */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

/** Cria linha de resultado */
function criarRR(label, valor, classeValor = '', badgeHtml = '') {
  return `<div class="rr">
    <span class="rl">${label}${badgeHtml}</span>
    <span class="rv ${classeValor}">${fmt(valor)}</span>
  </div>`;
}

/** Badge de natureza */
function badge(tipo) {
  const map = {
    rem:   ['nb-rem',  'Remuneratória'],
    inde:  ['nb-inde', 'Indenizatória'],
    trib:  ['nb-trib', 'Tributável'],
    ntrib: ['nb-ntrib','Não tributável'],
  };
  const [cls, label] = map[tipo] || ['nb-ntrib', tipo];
  return `<span class="nature-badge ${cls}">${label}</span>`;
}

// ══════════════════════════════════════════════════════════════
//  CÁLCULO INSS PROGRESSIVO
// ══════════════════════════════════════════════════════════════
function calcINSS(base) {
  const rem = Math.min(Math.max(0, base), CONFIG.inss_teto);
  let total = 0, ant = 0;
  for (const f of CONFIG.inss_faixas) {
    if (rem <= ant) break;
    total += (Math.min(rem, f.teto) - ant) * f.aliq;
    ant = f.teto;
  }
  return total;
}

// ══════════════════════════════════════════════════════════════
//  CÁLCULO IRRF COM ISENÇÃO ATÉ R$5.000
// ══════════════════════════════════════════════════════════════
function calcIRRF(base) {
  if (base <= 0) return { final: 0, bruto: 0, reducao: 0, cat: 'isento' };

  // Imposto bruto
  let bruto = 0;
  for (const f of CONFIG.irrf_faixas) {
    if (base <= f.teto) {
      bruto = Math.max(0, base * f.aliq - f.ded);
      break;
    }
  }

  // Redução MP 1.294/2024
  let reducao = 0;
  if (base <= CONFIG.irrf_isencao_teto) {
    reducao = Math.min(bruto, CONFIG.irrf_desconto_max);
  } else if (base <= CONFIG.irrf_reducao_teto) {
    reducao = Math.max(0, CONFIG.irrf_reducao_constante - CONFIG.irrf_reducao_fator * base);
    reducao = Math.min(reducao, bruto);
  }

  const final = Math.max(0, bruto - reducao);
  const cat   = final === 0 ? 'isento' : reducao > 0 ? 'reduzido' : 'cheio';
  return { final, bruto, reducao, cat };
}

// ══════════════════════════════════════════════════════════════
//  CALCULAR TEMPO DE SERVIÇO
// ══════════════════════════════════════════════════════════════
function calcularTempoServico() {
  const admStr  = document.getElementById('dataAdmissao')?.value;
  const deslStr = document.getElementById('dataDesligamento')?.value;

  if (!admStr || !deslStr) {
    show('tempo-servico-badge', false);
    return null;
  }

  const adm  = new Date(admStr  + 'T00:00:00');
  const desl = new Date(deslStr + 'T00:00:00');

  if (desl < adm) {
    document.getElementById('tempo-servico-badge').textContent = '⚠️ Data de desligamento anterior à admissão!';
    show('tempo-servico-badge', true);
    return null;
  }

  // Calcular anos, meses e dias
  let anos   = desl.getFullYear() - adm.getFullYear();
  let meses  = desl.getMonth()    - adm.getMonth();
  let dias   = desl.getDate()     - adm.getDate();

  if (dias   < 0) { meses--; dias  += 30; }
  if (meses  < 0) { anos--;  meses += 12; }

  const totalMeses = anos * 12 + meses;
  const anosComp   = anos;

  // Atualiza badge (variável com nome diferente para não conflitar com função badge())
  const badgeEl = document.getElementById('tempo-servico-badge');
  badgeEl.textContent = `⏱ Tempo de serviço: ${anos} ano(s), ${meses} mês(es) e ${dias} dia(s)`;
  show('tempo-servico-badge', true);

  // Atualiza campo de aviso proporcional SEM chamar calcular()
  atualizarDiasAviso(anosComp);

  return { anos, meses, dias, totalMeses, anosComp };
}

// ══════════════════════════════════════════════════════════════
//  ATUALIZAR DIAS DE AVISO PRÉVIO — sem chamar calcular()
// ══════════════════════════════════════════════════════════════
function atualizarDiasAviso(anosCompletos) {
  const dias = Math.min(
    CONFIG.aviso_base_dias + (anosCompletos * CONFIG.aviso_adicional_dias),
    CONFIG.aviso_maximo_dias
  );
  const input = document.getElementById('diasAviso');
  if (input && !input.dataset.manual) {
    input.value = dias;
  }
  const hint = document.getElementById('hint-aviso');
  if (hint) hint.textContent = `📌 Proporcional: ${CONFIG.aviso_base_dias} dias + ${anosCompletos} × 3 dias = ${dias} dias (máx. 90)`;
}

// Wrapper para compatibilidade com onchange das datas
function calcularAviso() {
  const ts = calcularTempoServico();
  if (ts) atualizarDiasAviso(ts.anosComp);
}

// ══════════════════════════════════════════════════════════════
//  CÁLCULO AVOS DE FÉRIAS PROPORCIONAIS
// ══════════════════════════════════════════════════════════════
function calcularAvosFeriasAuto() {
  // Usa dados já calculados em calcular() para evitar loop
  const admStr  = document.getElementById('dataAdmissao')?.value;
  const deslStr = document.getElementById('dataDesligamento')?.value;
  if (!admStr || !deslStr) return 0;
  const adm  = new Date(admStr  + 'T00:00:00');
  const desl = new Date(deslStr + 'T00:00:00');
  let anos  = desl.getFullYear() - adm.getFullYear();
  let meses = desl.getMonth()    - adm.getMonth();
  let dias  = desl.getDate()     - adm.getDate();
  if (dias  < 0) { meses--; }
  if (meses < 0) { anos--;  meses += 12; }
  const totalMeses = anos * 12 + meses;
  const mesesNoAno = totalMeses % 12;
  return mesesNoAno || (totalMeses >= 12 ? 0 : totalMeses);
}

// ══════════════════════════════════════════════════════════════
//  CÁLCULO AVOS DE 13º PROPORCIONAL
// ══════════════════════════════════════════════════════════════
function calcularAvos13Auto() {
  const admStr  = document.getElementById('dataAdmissao')?.value;
  const deslStr = document.getElementById('dataDesligamento')?.value;
  if (!admStr || !deslStr) return 0;

  const adm  = new Date(admStr  + 'T00:00:00');
  const desl = new Date(deslStr + 'T00:00:00');

  // Avos de 13º = meses completos de jan até o mês do desligamento
  // Se admissão for no mesmo ano, conta desde a admissão
  const anoDesl = desl.getFullYear();
  const inicio  = adm.getFullYear() === anoDesl
    ? new Date(adm.getFullYear(), adm.getMonth(), 1)
    : new Date(anoDesl, 0, 1); // 1º de janeiro

  let avos = 0;
  let d = new Date(inicio);
  while (d <= desl) {
    // Conta o mês se trabalhou pelo menos 15 dias nele
    const diasNoMes = desl.getMonth() === d.getMonth() && desl.getFullYear() === d.getFullYear()
      ? desl.getDate()
      : new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

    // No mês de admissão, contar apenas se >= 15 dias após adm
    if (d.getFullYear() === adm.getFullYear() && d.getMonth() === adm.getMonth()) {
      const diasDepoisAdm = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - adm.getDate() + 1;
      if (diasDepoisAdm >= 15) avos++;
    } else {
      if (diasNoMes >= 15) avos++;
    }
    d.setMonth(d.getMonth() + 1);
  }

  return Math.min(avos, 12);
}

// ══════════════════════════════════════════════════════════════
//  TOGGLE FUNCTIONS — controla exibição dos campos condicionais
// ══════════════════════════════════════════════════════════════

function togglePensao() {
  show('bloco-pensao', isSim('temPensao'));
  calcular();
}

function toggleFaltas() {
  const tem = isSim('temFaltas');
  show('fg-qtd-faltas', tem);
  show('fg-dsr-faltas', tem);
  calcular();
}

function toggleFeriasVencidas() {
  const tem = isSim('temFeriasVencidas');
  show('fg-periodos-vencidos', tem);
  show('fg-ferias-dobro', tem);
  calcular();
}

function toggleFeriasDobro() {
  show('fg-periodos-dobro', isSim('temFeriasDobro'));
  calcular();
}

function toggleFeriasProp() {
  show('fg-avos-ferias', isSim('temFeriasProp'));
  calcular();
}

function toggleAbono() {
  show('fg-valor-abono', sel('temAbono') !== 'nao');
  calcular();
}

function toggle13() {
  show('fg-avos-13', isSim('calc13'));
  calcular();
}

function toggleAdiantamento13() {
  show('fg-valor-adiantamento13', isSim('temAdiantamento13'));
  calcular();
}

function toggleMedias() {
  show('bloco-medias', isSim('temMedias'));
  calcular();
}

function onModoMedias() {
  show('fg-qtd-meses', sel('modoMedias') === 'automatico');
  calcular();
}

function onTipoAviso() {
  const tipo   = sel('tipoAviso');
  const motivo = sel('motivoRescisao');

  // Bloco de desconto: só para pedido de demissão
  show('bloco-desconto-aviso', motivo === 'pedido_demissao' && tipo !== 'sem_aviso');
  calcular();
}

function onCumpriuAviso() {
  show('fg-dias-cumpridos', sel('cumpriuAviso') === 'parcial');
  calcular();
}

function onTipoContrato() {
  calcular();
}

// ══════════════════════════════════════════════════════════════
//  ON MOTIVO RESCISÃO — atualiza UI e regras
// ══════════════════════════════════════════════════════════════
function onMotivoRescisao() {
  const motivo = sel('motivoRescisao');
  const regras = RESCISAO_REGRAS[motivo];
  if (!regras) return;

  // Info
  const infoEl = document.getElementById('info-rescisao');
  if (infoEl) {
    infoEl.textContent = regras.info;
    infoEl.style.display = 'block';
  }

  // Verbas disponíveis badges
  const verbasEl = document.getElementById('verbas-disponiveis');
  if (verbasEl) {
    const mapLabels = {
      saldo:          ['vb-provento', 'Saldo de Salário'],
      aviso:          ['vb-provento', 'Aviso Prévio'],
      aviso_metade:   ['vb-provento', 'Aviso Prévio (metade)'],
      ferias_vencidas:['vb-provento', 'Férias Vencidas'],
      ferias_prop:    ['vb-provento', 'Férias Proporcionais'],
      decimo_terceiro:['vb-provento', '13º Proporcional'],
      fgts:           ['vb-fgts',    'FGTS'],
      multa:          ['vb-fgts',    'Multa FGTS'],
      art479:         ['vb-atencao', 'Inden. Art. 479'],
    };
    verbasEl.innerHTML = regras.verbas.map(v => {
      const [cls, lbl] = mapLabels[v] || ['vb-provento', v];
      return `<span class="verba-badge ${cls}">${lbl}</span>`;
    }).join('');
    verbasEl.style.display = 'flex';
  }

  // Aviso prévio: se não tem aviso, oculta bloco
  const blocoAviso = document.querySelector('.card-header + .card-body');
  show('bloco-desconto-aviso',
    motivo === 'pedido_demissao' && sel('tipoAviso') !== 'sem_aviso'
  );

  calcular();
}

// ══════════════════════════════════════════════════════════════
//  CÁLCULO PRINCIPAL
// ══════════════════════════════════════════════════════════════
function calcular() {
  const motivo  = sel('motivoRescisao');
  const regras  = RESCISAO_REGRAS[motivo];
  if (!regras) return;

  const salario = Math.max(0, n('salarioBase'));
  if (salario === 0) return; // não calcula sem salário

  const ts = calcularTempoServico();
  if (!ts) return;

  // ── Médias variáveis ──
  const mediaTotal = isSim('temMedias')
    ? n('mediaHorasExtras') + n('mediaAdicNoturno') + n('mediaComissoes')
      + n('mediaDSR') + n('mediaInsalubridade') + n('mediaPericulosidade')
      + n('mediaOutras')
    : 0;

  // Salário de referência para cálculo (inclui médias)
  const salarioRef = salario + mediaTotal;

  // ─────────────────────────────────────────
  //  BLOCO D — SALDO DE SALÁRIO
  // ─────────────────────────────────────────
  const diasTrab  = Math.max(0, Math.min(31, n('diasTrabalhados')));
  const qtdFaltas = isSim('temFaltas') ? Math.max(0, n('qtdFaltas')) : 0;
  const diasDSR   = isSim('temFaltas') && isSim('descontarDSR')
    ? Math.floor(qtdFaltas / 6) // 1 DSR por semana com falta
    : 0;

  const diasEfetivos   = Math.max(0, diasTrab - qtdFaltas - diasDSR);
  const saldoSalario   = (salario / CONFIG.divisor_saldo) * diasEfetivos;
  const descontoFaltas = (salario / CONFIG.divisor_saldo) * qtdFaltas;
  const descontoDSR    = (salario / CONFIG.divisor_saldo) * diasDSR;
  const outrosDescMes  = Math.max(0, n('outrosDescontosMes'));

  // ─────────────────────────────────────────
  //  BLOCO C — AVISO PRÉVIO
  // ─────────────────────────────────────────
  const tipoAviso   = sel('tipoAviso');
  const diasAviso   = Math.max(0, n('diasAviso'));

  let valorAvisoPago    = 0; // empresa paga ao empregado
  let valorAvisoDesct   = 0; // desconto do empregado (pedido demissão)
  let diasAviso484a     = regras.acordo484a ? Math.floor(diasAviso / 2) : diasAviso;

  if (regras.aviso && tipoAviso !== 'sem_aviso') {
    const salarioDia = salarioRef / CONFIG.divisor_saldo;
    const diasPagos  = regras.acordo484a ? diasAviso484a : diasAviso;

    if (tipoAviso === 'indenizado' || tipoAviso === 'parcial') {
      valorAvisoPago = salarioDia * diasPagos;
    }
    // Pedido de demissão — desconto por aviso não cumprido
    if (motivo === 'pedido_demissao') {
      const cumprimento = sel('cumpriuAviso');
      if (cumprimento === 'nao') {
        valorAvisoDesct = salarioDia * diasAviso;
      } else if (cumprimento === 'parcial') {
        const diasCump  = Math.max(0, n('diasCumpridos'));
        valorAvisoDesct = salarioDia * Math.max(0, diasAviso - diasCump);
      }
    }
  }

  // ─────────────────────────────────────────
  //  BLOCO E — FÉRIAS
  // ─────────────────────────────────────────

  // Férias vencidas
  let valorFeriasVenc = 0;
  let valorFeriasDobro = 0;
  const perVenc  = isSim('temFeriasVencidas') ? Math.max(0, n('periodosVencidos')) : 0;
  const perDobro = (isSim('temFeriasVencidas') && isSim('temFeriasDobro'))
    ? Math.max(0, n('periodosDobro')) : 0;

  // Férias normais: salário + 1/3
  const baseFerias = salarioRef * (1 + 1/3);
  valorFeriasVenc  = baseFerias * Math.max(0, perVenc - perDobro);
  valorFeriasDobro = baseFerias * 2 * perDobro; // dobro já inclui o 1/3

  // Férias proporcionais
  let valorFeriasProp = 0;
  const calcProp = sel('temFeriasProp') !== 'nao';
  if (calcProp) {
    const avosFP = n('avosFeriasProp') > 0
      ? n('avosFeriasProp')
      : calcularAvosFeriasAuto();
    valorFeriasProp = (salarioRef / 12) * avosFP * (1 + 1/3);
  }

  // Abono pecuniário
  const tipoAbono   = sel('temAbono');
  const valorAbono  = tipoAbono !== 'nao' ? Math.max(0, n('valorAbono')) : 0;
  const abonoPagar  = tipoAbono === 'abono'    ? valorAbono : 0;
  const abonoDesct  = tipoAbono === 'desconto' ? valorAbono : 0;

  // ─────────────────────────────────────────
  //  BLOCO F — 13º SALÁRIO
  // ─────────────────────────────────────────
  let valor13 = 0;
  if (isSim('calc13')) {
    const avos13 = n('avos13') > 0 ? n('avos13') : calcularAvos13Auto();
    valor13 = (salarioRef / 12) * avos13;
  }
  const adiant13  = isSim('temAdiantamento13') ? Math.max(0, n('valorAdiantamento13')) : 0;

  // ─────────────────────────────────────────
  //  BLOCO H — DESCONTOS ADICIONAIS
  // ─────────────────────────────────────────
  const descAdiantSal = Math.max(0, n('descAdiantSalario'));
  const descVT        = Math.max(0, n('descVT'));
  const descVA        = Math.max(0, n('descVA'));
  const descConv      = Math.max(0, n('descConvenios'));
  const descEmp       = Math.max(0, n('descEmprestimos'));
  const descOutros    = Math.max(0, n('descOutros'));

  // Pensão alimentícia
  let valorPensao = 0;
  if (isSim('temPensao')) {
    const tipoPensao = sel('tipoPensao');
    const vp         = Math.max(0, n('valorPensao'));
    valorPensao      = tipoPensao === 'percentual' ? salario * (vp / 100) : vp;
  }

  // ─────────────────────────────────────────
  //  BLOCO I — FGTS
  // ─────────────────────────────────────────
  // Base de FGTS na rescisão:
  // - Saldo de salário (remuneratório)
  // - 13º proporcional
  // - Aviso prévio indenizado (Súmula 305 TST)
  // - Médias variáveis

  const baseFGTS = saldoSalario + valor13 + valorAvisoPago + mediaTotal * (diasTrab / 30);
  const fgtsMes  = baseFGTS * CONFIG.fgts_aliq;

  // Multa FGTS — depende do saldo total acumulado (não calculado aqui)
  // Mostramos apenas a alíquota aplicável
  const aliqMulta    = CONFIG[regras.multa_fgts] || 0;
  const saldoFGTSest = salarioRef * CONFIG.fgts_aliq * ts.totalMeses;
  const multaFGTSest = saldoFGTSest * aliqMulta;

  // ─────────────────────────────────────────
  //  BLOCO J — TRIBUTAÇÃO
  // ─────────────────────────────────────────

  // Base INSS: verbas de natureza salarial
  // Saldo de salário + 13º proporcional + médias
  // (Aviso prévio indenizado: NÃO incide INSS — posição majoritária STJ/TST)
  // (Férias: incide INSS — inclusive na rescisão)
  const baseINSS = Math.max(0,
    saldoSalario +
    valor13 +
    valorFeriasVenc / (1 + 1/3) +   // férias sem o 1/3 (apenas remuneração)
    valorFeriasProp / (1 + 1/3) +
    valorFeriasDobro / (1 + 1/3) +
    mediaTotal * (diasTrab / 30)
  );
  const descontoINSS = calcINSS(baseINSS);

  // Base IRRF: verbas tributáveis - INSS - deduções
  // Férias: tributáveis; Aviso indenizado: tributável (IN RFB 1500/2014)
  // Multa FGTS: NÃO tributável
  const deducoesIRRF = descontoINSS
    + (n('qtdDependentes') * CONFIG.irrf_deducao_dependente)
    + valorPensao;

  const baseIRRF = Math.max(0,
    saldoSalario +
    valor13 +
    valorFeriasVenc +
    valorFeriasProp +
    valorFeriasDobro +
    valorAvisoPago +
    abonoPagar +
    mediaTotal * (diasTrab / 30)
    - deducoesIRRF
  );

  const irrf = calcIRRF(baseIRRF);

  // ─────────────────────────────────────────
  //  TOTAIS
  // ─────────────────────────────────────────

  // Total proventos brutos
  const totalProventos =
    saldoSalario +
    valorAvisoPago +
    valorFeriasVenc +
    valorFeriasDobro +
    valorFeriasProp +
    valor13 +
    abonoPagar +
    mediaTotal * (diasTrab / 30);

  // Total descontos
  const totalDescontos =
    descontoINSS +
    irrf.final +
    valorAvisoDesct +
    descontoFaltas +
    descontoDSR +
    adiant13 +
    descAdiantSal +
    descVT +
    descVA +
    descConv +
    descEmp +
    descOutros +
    abonoDesct +
    valorPensao +
    outrosDescMes;

  // Líquido empregado
  const liquidoEmpregado = totalProventos - totalDescontos;

  // Custo empresa:
  // proventos pagos + FGTS rescisório + multa (sobre saldo acumulado — informativo)
  // OBS: Multa do FGTS precisa do saldo acumulado total, que não temos aqui
  // Mostramos a alíquota e calculamos apenas sobre o FGTS do mês
  const custoEmpresa = totalProventos + fgtsMes;

  // ─────────────────────────────────────────
  //  RENDERIZAR RESULTADO
  // ─────────────────────────────────────────
  show('resultado-placeholder', false);
  show('resultado-conteudo',    true);

  // KPIs
  document.getElementById('kpi-bruto').textContent          = fmt(totalProventos);
  document.getElementById('kpi-descontos').textContent      = fmt(totalDescontos);
  document.getElementById('kpi-liquido').textContent        = fmt(liquidoEmpregado);
  document.getElementById('kpi-custo-empresa').textContent  = fmt(custoEmpresa);

  // Resumo
  renderResumo(regras, ts, diasAviso, aliqMulta);

  // Proventos
  renderProventos({
    saldoSalario, valorAvisoPago, valorFeriasVenc, valorFeriasDobro,
    valorFeriasProp, valor13, abonoPagar, mediaTotal, diasTrab, totalProventos
  });

  // Descontos
  renderDescontos({
    descontoINSS, irrf, valorAvisoDesct, descontoFaltas, descontoDSR,
    adiant13, descAdiantSal, descVT, descVA, descConv, descEmp,
    descOutros, abonoDesct, valorPensao, outrosDescMes, totalDescontos,
    baseINSS, baseIRRF
  });

  // FGTS
  renderFGTS({ baseFGTS, fgtsMes, aliqMulta, saldoFGTSest, multaFGTSest, regras, totalMeses: ts.totalMeses });

  // Resultado final
  renderResultadoFinal({ liquidoEmpregado, totalDescontos, totalProventos, custoEmpresa, aliqMulta, fgtsMes, multaFGTSest });

  // Memória de cálculo
  renderMemoria({
    salario, mediaTotal, diasEfetivos, qtdFaltas, diasDSR, saldoSalario,
    diasAviso, valorAvisoPago, valorFeriasVenc, valorFeriasDobro, valorFeriasProp,
    valor13, baseINSS, descontoINSS, baseIRRF, irrf, fgtsMes, totalProventos,
    totalDescontos, liquidoEmpregado
  });

  // Alertas
  renderAlertas(regras, irrf, salario);

  // Salvar para PDF
  window._sim_rescisao = {
    motivo: regras.label, liquidoEmpregado, totalProventos, totalDescontos,
    custoEmpresa, fgtsMes, aliqMulta
  };
}

// ══════════════════════════════════════════════════════════════
//  RENDERIZADORES DE SEÇÕES
// ══════════════════════════════════════════════════════════════

function renderResumo(regras, ts, diasAviso, aliqMulta) {
  const nome = document.getElementById('nomeEmpregado')?.value || '—';
  document.getElementById('resumo-rescisao').innerHTML = `
    <div class="resumo-grid">
      <div class="resumo-item">
        <div class="resumo-item-label">Empregado</div>
        <div class="resumo-item-value">${nome}</div>
      </div>
      <div class="resumo-item">
        <div class="resumo-item-label">Motivo da rescisão</div>
        <div class="resumo-item-value">${regras.label}</div>
      </div>
      <div class="resumo-item">
        <div class="resumo-item-label">Tempo de serviço</div>
        <div class="resumo-item-value">${ts.anos}a ${ts.meses}m ${ts.dias}d</div>
      </div>
      <div class="resumo-item">
        <div class="resumo-item-label">Aviso prévio</div>
        <div class="resumo-item-value">${diasAviso} dias</div>
      </div>
      <div class="resumo-item">
        <div class="resumo-item-label">Multa FGTS</div>
        <div class="resumo-item-value">${(aliqMulta * 100).toFixed(0)}%</div>
      </div>
      <div class="resumo-item">
        <div class="resumo-item-label">Saque FGTS</div>
        <div class="resumo-item-value">${regras.saque_fgts ? (regras.acordo484a ? 'Parcial (80%)' : 'Integral') : 'Não tem direito'}</div>
      </div>
      <div class="resumo-item">
        <div class="resumo-item-label">Seguro-desemprego</div>
        <div class="resumo-item-value">${regras.seguro_desemprego ? '✅ Tem direito' : '❌ Não tem direito'}</div>
      </div>
    </div>`;
}

function renderProventos(v) {
  let html = '';
  if (v.saldoSalario  > 0) html += criarRR('Saldo de salário', v.saldoSalario, 'rv-green', badge('rem'));
  if (v.valorAvisoPago> 0) html += criarRR('Aviso prévio indenizado', v.valorAvisoPago, 'rv-green', badge('inde'));
  if (v.valorFeriasVenc>0) html += criarRR('Férias vencidas + 1/3', v.valorFeriasVenc, 'rv-green', badge('rem'));
  if (v.valorFeriasDobro>0)html += criarRR('Férias vencidas em dobro + 1/3', v.valorFeriasDobro, 'rv-green', badge('rem'));
  if (v.valorFeriasProp>0) html += criarRR('Férias proporcionais + 1/3', v.valorFeriasProp, 'rv-green', badge('rem'));
  if (v.valor13       > 0) html += criarRR('13º salário proporcional', v.valor13, 'rv-green', badge('rem'));
  if (v.abonoPagar    > 0) html += criarRR('Abono pecuniário de férias', v.abonoPagar, 'rv-green', badge('inde'));
  if (v.mediaTotal    > 0) html += criarRR(`Médias variáveis (${v.diasTrab} dias)`, v.mediaTotal * (v.diasTrab/30), 'rv-green', badge('rem'));
  html += `<div class="total-band"><span class="rl">Total de proventos</span><span class="rv">${fmt(v.totalProventos)}</span></div>`;
  document.getElementById('detalhe-proventos').innerHTML = html;
}

function renderDescontos(v) {
  let html = `
    <div class="rr"><span class="rl rv-dim">Base de INSS</span><span class="rv rv-dim">${fmt(v.baseINSS)}</span></div>
    <div class="rr"><span class="rl rv-dim">Base de IRRF</span><span class="rv rv-dim">${fmt(v.baseIRRF)}</span></div>
    <hr class="dv">`;
  if (v.descontoINSS   > 0) html += criarRR('(-) INSS do empregado', v.descontoINSS, 'rv-red');
  if (v.irrf.final     > 0) html += criarRR('(-) IRRF', v.irrf.final, 'rv-red');
  if (v.valorAvisoDesct> 0) html += criarRR('(-) Desconto de aviso prévio não cumprido', v.valorAvisoDesct, 'rv-red');
  if (v.descontoFaltas > 0) html += criarRR('(-) Desconto de faltas', v.descontoFaltas, 'rv-red');
  if (v.descontoDSR    > 0) html += criarRR('(-) DSR sobre faltas', v.descontoDSR, 'rv-red');
  if (v.adiant13       > 0) html += criarRR('(-) Adiantamento de 13º', v.adiant13, 'rv-red');
  if (v.descAdiantSal  > 0) html += criarRR('(-) Adiantamento salarial', v.descAdiantSal, 'rv-red');
  if (v.descVT         > 0) html += criarRR('(-) Vale-transporte', v.descVT, 'rv-red');
  if (v.descVA         > 0) html += criarRR('(-) Vale-alimentação / refeição', v.descVA, 'rv-red');
  if (v.descConv       > 0) html += criarRR('(-) Convênios', v.descConv, 'rv-red');
  if (v.descEmp        > 0) html += criarRR('(-) Empréstimos / Consignado', v.descEmp, 'rv-red');
  if (v.abonoDesct     > 0) html += criarRR('(-) Desconto abono pecuniário', v.abonoDesct, 'rv-red');
  if (v.valorPensao    > 0) html += criarRR('(-) Pensão alimentícia', v.valorPensao, 'rv-red');
  if (v.outrosDescMes  > 0) html += criarRR('(-) Outros descontos', v.outrosDescMes, 'rv-red');
  if (v.descOutros     > 0) html += criarRR(`(-) ${document.getElementById('descOutrosDesc')?.value || 'Outros descontos'}`, v.descOutros, 'rv-red');
  html += `<div class="total-band-red"><span class="rl">Total de descontos</span><span class="rv">${fmt(v.totalDescontos)}</span></div>`;
  document.getElementById('detalhe-descontos').innerHTML = html;
}

function renderFGTS(v) {
  const pct = (v.aliqMulta * 100).toFixed(0);
  let html = `
    ${criarRR('FGTS sobre verbas rescisórias (8%)', v.fgtsMes, 'rv-amber')}
    <hr class="dv">
    <div class="rr">
      <span class="rl">Saldo estimado de FGTS acumulado
        <span class="nature-badge nb-ntrib">Estimativa</span>
      </span>
      <span class="rv rv-amber">${fmt(v.saldoFGTSest)}</span>
    </div>
    <div class="rr">
      <span class="rl">Multa rescisória estimada (${pct}% s/ saldo)
        <span class="nature-badge nb-ntrib">Estimativa</span>
      </span>
      <span class="rv rv-amber">${fmt(v.multaFGTSest)}</span>
    </div>
    <div class="alert-warning" style="margin-top:10px;">
      ℹ️ Estimativa: salário × 8% × ${v.totalMeses} meses trabalhados.
      Não considera reajustes salariais nem rendimentos da conta.
      Confirme o saldo real no app <strong>FGTS Digital</strong>.
    </div>`;

  if (v.regras.saque_fgts) {
    const saqueLabel = v.regras.acordo484a
      ? '✅ Saque parcial permitido — até 80% do saldo da conta vinculada'
      : '✅ Saque integral permitido após homologação da rescisão';
    html += `<div class="alerta-item alerta-verde" style="margin-top:8px;"><span class="alerta-icon">💰</span>${saqueLabel}</div>`;
  } else {
    html += `<div class="alerta-item" style="margin-top:8px;"><span class="alerta-icon">🔒</span>Não há direito ao saque do FGTS nesta modalidade de rescisão.</div>`;
  }

  if (v.regras.seguro_desemprego) {
    html += `<div class="alerta-item alerta-verde" style="margin-top:8px;"><span class="alerta-icon">📋</span>✅ Tem direito ao seguro-desemprego. Solicitar na plataforma gov.br.</div>`;
  }

  document.getElementById('detalhe-fgts').innerHTML = html;
}

function renderResultadoFinal(v) {
  document.getElementById('card-resultado-final').innerHTML = `
    <div class="crf-label">Valor líquido a receber</div>
    <div class="crf-value">${fmt(v.liquidoEmpregado)}</div>
    <div class="crf-grid">
      <div class="crf-item">
        <div class="crf-item-label">Total bruto</div>
        <div class="crf-item-value">${fmt(v.totalProventos)}</div>
      </div>
      <div class="crf-item">
        <div class="crf-item-label">Total descontos</div>
        <div class="crf-item-value">${fmt(v.totalDescontos)}</div>
      </div>
      <div class="crf-item">
        <div class="crf-item-label">FGTS rescisório</div>
        <div class="crf-item-value">${fmt(v.custoEmpresa - v.totalProventos)}</div>
      </div>
      <div class="crf-item">
        <div class="crf-item-label">Custo estimado empresa</div>
        <div class="crf-item-value">${fmt(v.custoEmpresa)}</div>
      </div>
    </div>
    <div class="crf-sub">
      FGTS rescisório: <strong>${fmt(v.fgtsMes)}</strong> ·
      Multa estimada (${(v.aliqMulta*100).toFixed(0)}%): <strong>${fmt(v.multaFGTSest)}</strong>
    </div>`;
}

function renderMemoria(v) {
  const avos13  = n('avos13') > 0    ? n('avos13')    : calcularAvos13Auto();
  const avosFP  = n('avosFeriasProp') > 0 ? n('avosFeriasProp') : calcularAvosFeriasAuto();

  document.getElementById('memoria-calculo').innerHTML = `
    <div class="memoria-titulo">Saldo de Salário</div>
    <div class="memoria-item">
      <strong>Saldo de salário</strong>
      <div class="formula">R$ ${v.salario.toFixed(2)} ÷ 30 × ${v.diasEfetivos} dias = ${fmt(v.saldoSalario)}</div>
      ${v.qtdFaltas > 0 ? `<div class="formula">Desconto faltas: ${v.qtdFaltas} dias × R$ ${(v.salario/30).toFixed(2)}/dia = ${fmt(v.saldoSalario)}</div>` : ''}
      ${v.diasDSR   > 0 ? `<div class="formula">Desconto DSR: ${v.diasDSR} dias × R$ ${(v.salario/30).toFixed(2)}/dia = ${fmt(v.descontoDSR || 0)}</div>` : ''}
    </div>

    <div class="memoria-titulo">Aviso Prévio</div>
    <div class="memoria-item">
      <strong>Aviso prévio indenizado</strong>
      <div class="formula">R$ ${(v.salario + v.mediaTotal).toFixed(2)} ÷ 30 × ${v.diasAviso} dias = ${fmt(v.valorAvisoPago)}</div>
    </div>

    <div class="memoria-titulo">Férias</div>
    <div class="memoria-item">
      <strong>Base de férias</strong> = Salário + médias + 1/3 constitucional
      <div class="formula">R$ ${(v.salario + v.mediaTotal).toFixed(2)} × (1 + 1/3) = ${fmt((v.salario + v.mediaTotal) * (1 + 1/3))}/período</div>
      <strong>Férias proporcionais</strong>: ${avosFP} avos
      <div class="formula">R$ ${(v.salario + v.mediaTotal).toFixed(2)} × (1 + 1/3) ÷ 12 × ${avosFP} = ${fmt(v.valorFeriasProp)}</div>
    </div>

    <div class="memoria-titulo">13º Salário</div>
    <div class="memoria-item">
      <strong>13º proporcional</strong>: ${avos13} avos
      <div class="formula">R$ ${(v.salario + v.mediaTotal).toFixed(2)} ÷ 12 × ${avos13} = ${fmt(v.valor13)}</div>
    </div>

    <div class="memoria-titulo">INSS</div>
    <div class="memoria-item">
      <strong>Base de INSS</strong> = ${fmt(v.baseINSS)}
      <div class="formula">Cálculo progressivo — Tabela INSS 2025</div>
      <strong>INSS apurado</strong> = ${fmt(v.descontoINSS)}
    </div>

    <div class="memoria-titulo">IRRF</div>
    <div class="memoria-item">
      <strong>Base de IRRF</strong> = ${fmt(v.baseIRRF)}
      <div class="formula">Tabela IRRF 2026 + Isenção MP 1.294/2024 (até R$ 5.000)</div>
      <strong>IRRF apurado</strong> = ${fmt(v.irrf.final)}
      ${v.irrf.reducao > 0 ? `<div class="formula">Redução aplicada: ${fmt(v.irrf.reducao)}</div>` : ''}
    </div>

    <div class="memoria-titulo">FGTS</div>
    <div class="memoria-item">
      <strong>Base FGTS rescisório</strong> = ${fmt(v.fgtsMes / CONFIG.fgts_aliq)}
      <div class="formula">Base × 8% = ${fmt(v.fgtsMes)}</div>
    </div>`;
}

function renderAlertas(regras, irrf, salario) {
  const alertas = [
    { tipo: 'aviso', texto: '⚠️ Esta simulação é estimativa. Verifique sempre com o contador responsável antes de emitir a rescisão.' },
    { tipo: 'aviso', texto: '⚠️ Confira as tabelas vigentes de INSS e IRRF. As tabelas desta ferramenta são de 2025/2026.' },
    { tipo: 'aviso', texto: '⚠️ Verifique se há convenção coletiva (CCT/ACT) que altere prazos, valores ou verbas desta rescisão.' },
    { tipo: 'aviso', texto: '⚠️ A multa rescisória de FGTS é calculada sobre o saldo total acumulado — informe o saldo no extrato FGTS Digital.' },
  ];

  if (regras.art479) {
    alertas.push({ tipo: 'vermelho', texto: '🚨 Art. 479 CLT: indenização equivalente à metade dos salários restantes do contrato. Calcule separadamente.' });
  }
  if (regras.art480) {
    alertas.push({ tipo: 'vermelho', texto: '🚨 Art. 480 CLT: possível desconto ao empregado limitado ao valor da indenização do Art. 479. Avalie o prejuízo real.' });
  }
  if (regras.motivo === 'culpa_reciproca') {
    alertas.push({ tipo: 'vermelho', texto: '🚨 Culpa recíproca: cenário juridicamente controvertido. Requer reconhecimento judicial ou acordo homologado. Consulte advogado trabalhista.' });
  }
  if (irrf.cat === 'cheio') {
    alertas.push({ tipo: 'aviso', texto: '⚠️ IRRF: base de cálculo acima de R$ 7.350 — sem redução da MP 1.294/2024. Verifique deduções de dependentes e pensão.' });
  }
  if (salario < CONFIG.salario_minimo) {
    alertas.push({ tipo: 'vermelho', texto: `🚨 Salário informado (${fmt(salario)}) está abaixo do salário mínimo vigente (${fmt(CONFIG.salario_minimo)}). Verifique.` });
  }
  alertas.push({ tipo: 'aviso', texto: '⚠️ Confira no eSocial / FGTS Digital as guias de recolhimento antes de efetuar o pagamento.' });

  document.getElementById('alertas-rescisao').innerHTML = alertas
    .map(a => `<div class="alerta-item alerta-${a.tipo === 'vermelho' ? 'vermelho' : a.tipo === 'verde' ? 'verde' : ''}">
      <span class="alerta-icon">${a.tipo === 'vermelho' ? '🚨' : '⚠️'}</span>
      <span>${a.texto}</span>
    </div>`).join('');
}

// ══════════════════════════════════════════════════════════════
//  TOGGLE MEMÓRIA DE CÁLCULO
// ══════════════════════════════════════════════════════════════
function toggleMemoria() {
  const body     = document.getElementById('memoria-calculo');
  const chevron  = document.getElementById('memoria-chevron');
  const isOpen   = body.style.display !== 'none';
  body.style.display    = isOpen ? 'none' : 'block';
  chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
}

// ══════════════════════════════════════════════════════════════
//  GLOSSÁRIO — renderizar
// ══════════════════════════════════════════════════════════════
function renderGlossario() {
  const chevronSVG = `<svg class="glos-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
  document.getElementById('glos-grid').innerHTML = GLOSSARIO.map(g => `
    <div class="glos-card">
      <div class="glos-trigger" onclick="toggleGlos(this)">
        <div class="glos-trigger-left">
          <span class="glos-tag">${g.tag}</span>
          <h3>${g.titulo}</h3>
        </div>
        ${chevronSVG}
      </div>
      <div class="glos-body">
        <p class="glos-desc">${g.desc}</p>
        <div class="glos-lei">${g.lei}</div>
      </div>
    </div>`).join('');
}

function toggleGlos(trigger) {
  const card   = trigger.closest('.glos-card');
  const isOpen = card.classList.contains('open');
  document.querySelectorAll('.glos-card.open').forEach(c => c.classList.remove('open'));
  if (!isOpen) card.classList.add('open');
}

// ══════════════════════════════════════════════════════════════
//  SALVAR PDF / IMPRIMIR
// ══════════════════════════════════════════════════════════════
function salvarPDF() {
  const s = window._sim_rescisao || {};
  const dataHoje    = new Date().toLocaleDateString('pt-BR');
  const nomeArquivo = `Rescisao-CLT_${(s.motivo || 'simulacao').replace(/\s+/g,'-')}_${dataHoje.replace(/\//g,'-')}.pdf`;

  document.getElementById('pdf-data').textContent   = 'Gerado em: ' + dataHoje;
  document.getElementById('pdf-motivo').textContent = s.motivo || '';

  const header = document.getElementById('pdf-header');
  header.style.display = 'block';

  const ocultar = document.querySelectorAll(
    'header, .hero, footer, .glossario-section, #toast, #banner-atualizacao, .col-inputs, .btn-calcular, .resultado-placeholder'
  );
  ocultar.forEach(el => el.style.display = 'none');

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'padding:16px; background:#f7f9fb; font-family:Sora,sans-serif;';
  const hClone = header.cloneNode(true);
  // Troca logo branca pela azul no PDF (mix-blend-mode não funciona no html2pdf)
  const logoClone = hClone.querySelector('img');
  if (logoClone) logoClone.style.mixBlendMode = 'normal';
  hClone.style.display = 'block';
  wrapper.appendChild(hClone);
  const colResults = document.getElementById('col-results');
  if (colResults) wrapper.appendChild(colResults.cloneNode(true));

  const opcoes = {
    margin:      [6,6,6,6],
    filename:    nomeArquivo,
    image:       { type:'jpeg', quality:0.98 },
    html2canvas: { scale:2, useCORS:true, logging:false },
    jsPDF:       { unit:'mm', format:'a4', orientation:'portrait' },
    pagebreak:   { mode:['avoid-all','css'] }
  };

  html2pdf().set(opcoes).from(wrapper).save()
    .then(() => {
      header.style.display = 'none';
      ocultar.forEach(el => el.style.display = '');
      showToast('✓ PDF gerado com sucesso!');
    })
    .catch(err => {
      console.error(err);
      header.style.display = 'none';
      ocultar.forEach(el => el.style.display = '');
      showToast('Erro ao gerar PDF.');
    });
}

function imprimir() {
  const s         = window._sim_rescisao || {};
  const dataHoje  = new Date().toLocaleDateString('pt-BR');
  document.getElementById('pdf-data').textContent   = 'Gerado em: ' + dataHoje;
  document.getElementById('pdf-motivo').textContent = s.motivo || '';

  const header  = document.getElementById('pdf-header');
  header.style.display = 'block';

  const ocultar = document.querySelectorAll(
    'header, .hero, footer, .glossario-section, #toast, #banner-atualizacao, .col-inputs, .btn-calcular, #banner-atualizacao'
  );
  ocultar.forEach(el => el.style.display = 'none');

  setTimeout(() => {
    window.print();
    setTimeout(() => {
      header.style.display = 'none';
      ocultar.forEach(el => el.style.display = '');
    }, 1000);
  }, 300);
}

// ══════════════════════════════════════════════════════════════
//  EXEMPLO PREENCHIDO
// ══════════════════════════════════════════════════════════════
function preencherExemplo() {
  document.getElementById('nomeEmpregado').value       = 'Maria Oliveira';
  document.getElementById('dataAdmissao').value        = '2020-03-15';
  document.getElementById('dataDesligamento').value    = '2026-04-08';
  document.getElementById('salarioBase').value         = 3800;
  document.getElementById('tipoContrato').value        = 'indeterminado';
  document.getElementById('tipoSalario').value         = 'mensalista';
  document.getElementById('qtdDependentes').value      = 1;
  document.getElementById('temPensao').value           = 'nao';
  document.getElementById('motivoRescisao').value      = 'sem_justa_causa';
  document.getElementById('tipoAviso').value           = 'indenizado';
  document.getElementById('diasTrabalhados').value     = 8;
  document.getElementById('temFaltas').value           = 'nao';
  document.getElementById('temFeriasVencidas').value   = 'nao';
  document.getElementById('temFeriasProp').value       = 'sim';
  document.getElementById('avosFeriasProp').value      = 0;
  document.getElementById('temAbono').value            = 'nao';
  document.getElementById('calc13').value              = 'sim';
  document.getElementById('avos13').value              = 0;
  document.getElementById('temAdiantamento13').value   = 'nao';
  document.getElementById('temMedias').value           = 'nao';

  // Atualiza UI
  togglePensao(); toggleFaltas(); toggleFeriasVencidas();
  toggleFeriasProp(); toggleAbono(); toggle13();
  toggleAdiantamento13(); toggleMedias();
  onMotivoRescisao(); onTipoAviso();

  calcularTempoServico();
  showToast('✓ Exemplo preenchido!');
}

// ══════════════════════════════════════════════════════════════
//  LIMPAR SIMULAÇÃO
// ══════════════════════════════════════════════════════════════
function limpar() {
  const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], textarea');
  inputs.forEach(el => el.value = el.type === 'number' ? (el.id === 'diasAviso' ? 30 : 0) : '');

  const selects = document.querySelectorAll('select');
  selects.forEach(sel => sel.selectedIndex = 0);

  // Reset UI
  togglePensao(); toggleFaltas(); toggleFeriasVencidas();
  toggleFeriasProp(); toggleAbono(); toggle13();
  toggleAdiantamento13(); toggleMedias();
  onMotivoRescisao(); onTipoAviso();

  show('tempo-servico-badge', false);
  show('resultado-placeholder', true);
  show('resultado-conteudo',    false);

  showToast('↺ Simulação limpa');
}

// ══════════════════════════════════════════════════════════════
//  VERIFICAÇÃO DE TABELAS ATUALIZADAS
// ══════════════════════════════════════════════════════════════
function verificarAtualizacao() {
  const anoAtual   = new Date().getFullYear();
  const anoTabelas = CONFIG.ano_tabelas;
  if (anoAtual > anoTabelas) {
    const banner = document.getElementById('banner-atualizacao');
    if (banner) {
      banner.style.display = 'flex';
      banner.querySelector('.banner-ano').textContent =
        `As tabelas de INSS e IRRF são de ${anoTabelas}. Verifique se há atualização para ${anoAtual}.`;
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  renderGlossario();
  onMotivoRescisao();
  verificarAtualizacao();
  // Marca aviso manual quando usuário edita
  document.getElementById('diasAviso')?.addEventListener('input', function() {
    this.dataset.manual = 'true';
  });
});
