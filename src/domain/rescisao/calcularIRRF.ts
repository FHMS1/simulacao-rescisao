import { arredondarCentavos } from './dinheiro';
import type { FaixaIRRF, TabelaIRRF } from './tabelas';

interface CalcularIRRFInput {
  rendimentosTributaveis: number;
  descontoINSS: number;
  dependentes: number;
  pensaoAlimenticia?: number;
  tabela: TabelaIRRF;
  aplicarReducaoMensal: boolean;
}

export interface ResultadoIRRF {
  rendimentosTributaveis: number;
  base: number;
  deducoesLegais: number;
  deducaoSimplificada: number;
  deducaoAplicada: 'legal' | 'simplificada';
  aliquota: number;
  parcelaDeduzir: number;
  impostoAntesReducao: number;
  reducao: number;
  desconto: number;
  categoria: 'isento' | 'reduzido' | 'cheio';
}

function obterFaixa(base: number, faixas: readonly FaixaIRRF[]): FaixaIRRF {
  const faixa = faixas.find((item) => item.limiteSuperior === null || base <= item.limiteSuperior);
  if (!faixa) throw new Error('Tabela IRRF não possui faixa aplicável');
  return faixa;
}

export function calcularIRRF({
  rendimentosTributaveis,
  descontoINSS,
  dependentes,
  pensaoAlimenticia = 0,
  tabela,
  aplicarReducaoMensal,
}: CalcularIRRFInput): ResultadoIRRF {
  if (!Number.isFinite(rendimentosTributaveis) || rendimentosTributaveis < 0)
    throw new Error('Rendimentos tributáveis devem ser não negativos');
  if (!Number.isFinite(descontoINSS) || descontoINSS < 0)
    throw new Error('Desconto do INSS deve ser não negativo');
  if (!Number.isInteger(dependentes) || dependentes < 0)
    throw new Error('Dependentes deve ser um inteiro não negativo');
  if (!Number.isFinite(pensaoAlimenticia) || pensaoAlimenticia < 0)
    throw new Error('Pensão alimentícia deve ser não negativa');

  const deducoesLegais = arredondarCentavos(
    descontoINSS + dependentes * tabela.deducaoPorDependente + pensaoAlimenticia,
  );
  const usarSimplificada = tabela.deducaoSimplificada > deducoesLegais;
  const deducaoEscolhida = usarSimplificada ? tabela.deducaoSimplificada : deducoesLegais;
  const base = arredondarCentavos(Math.max(0, rendimentosTributaveis - deducaoEscolhida));
  const faixa = obterFaixa(base, tabela.faixas);
  const impostoAntesReducao = arredondarCentavos(
    Math.max(0, base * faixa.aliquota - faixa.parcelaDeduzir),
  );

  let reducao = 0;
  const regra = aplicarReducaoMensal ? tabela.reducaoMensal : undefined;
  if (regra && rendimentosTributaveis <= regra.limiteIsencao) {
    reducao = impostoAntesReducao;
  } else if (regra && rendimentosTributaveis <= regra.limiteReducao) {
    reducao = arredondarCentavos(
      Math.min(impostoAntesReducao, regra.parcela - regra.coeficiente * rendimentosTributaveis),
    );
  }

  const desconto = arredondarCentavos(Math.max(0, impostoAntesReducao - reducao));
  return {
    rendimentosTributaveis: arredondarCentavos(rendimentosTributaveis),
    base,
    deducoesLegais,
    deducaoSimplificada: tabela.deducaoSimplificada,
    deducaoAplicada: usarSimplificada ? 'simplificada' : 'legal',
    aliquota: faixa.aliquota,
    parcelaDeduzir: faixa.parcelaDeduzir,
    impostoAntesReducao,
    reducao,
    desconto,
    categoria: desconto === 0 ? 'isento' : reducao > 0 ? 'reduzido' : 'cheio',
  };
}
