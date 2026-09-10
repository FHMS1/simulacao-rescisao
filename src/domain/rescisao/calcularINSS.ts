import { arredondarCentavos } from './dinheiro';
import type { TabelaINSS } from './tabelas';

export interface ParcelaINSS {
  baseFaixa: number;
  aliquota: number;
  contribuicao: number;
}

export interface ResultadoINSS {
  base: number;
  desconto: number;
  parcelas: ParcelaINSS[];
}

export function calcularINSS(base: number, tabela: TabelaINSS): ResultadoINSS {
  if (!Number.isFinite(base) || base < 0) throw new Error('Base do INSS deve ser não negativa');

  const baseLimitada = Math.min(base, tabela.teto);
  let tetoAnterior = 0;
  const parcelas: ParcelaINSS[] = [];

  for (const faixa of tabela.faixas) {
    const baseFaixa = arredondarCentavos(
      Math.max(0, Math.min(baseLimitada, faixa.teto) - tetoAnterior),
    );
    if (baseFaixa > 0) {
      parcelas.push({
        baseFaixa,
        aliquota: faixa.aliquota,
        contribuicao: arredondarCentavos(baseFaixa * faixa.aliquota),
      });
    }
    tetoAnterior = faixa.teto;
    if (baseLimitada <= faixa.teto) break;
  }

  return {
    base: arredondarCentavos(baseLimitada),
    desconto: arredondarCentavos(parcelas.reduce((total, parcela) => total + parcela.contribuicao, 0)),
    parcelas,
  };
}
