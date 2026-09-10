import { calcularTempoServico } from './calcularTempoServico';

interface DataCivil {
  ano: number;
  mes: number;
  dia: number;
}

const FORMATO_DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

function lerDataISO(valor: string): DataCivil {
  const partes = FORMATO_DATA_ISO.exec(valor);
  if (!partes) throw new Error(`Data inválida: ${valor}`);

  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    throw new Error(`Data inválida: ${valor}`);
  }
  return { ano, mes, dia };
}

function paraUTC(data: DataCivil): number {
  return Date.UTC(data.ano, data.mes - 1, data.dia);
}

function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

export function calcularAvosDecimoTerceiro(
  dataAdmissao: string,
  dataFinalContagem: string,
): number {
  calcularTempoServico(dataAdmissao, dataFinalContagem);
  const admissao = lerDataISO(dataAdmissao);
  const fim = lerDataISO(dataFinalContagem);
  const inicioAno = { ano: fim.ano, mes: 1, dia: 1 };
  const inicio = paraUTC(admissao) > paraUTC(inicioAno) ? admissao : inicioAno;
  let avos = 0;

  for (let mes = inicio.mes; mes <= fim.mes; mes += 1) {
    const primeiroDia = mes === inicio.mes ? inicio.dia : 1;
    const ultimoDia = mes === fim.mes ? fim.dia : diasNoMes(fim.ano, mes);
    if (ultimoDia - primeiroDia + 1 >= 15) avos += 1;
  }

  return avos;
}

export function calcularAvosFerias(dataAdmissao: string, dataFinalContagem: string): number {
  const tempo = calcularTempoServico(dataAdmissao, dataFinalContagem);
  const avoDaFracao = tempo.dias >= 14 ? 1 : 0;
  return Math.min(tempo.meses + avoDaFracao, 12);
}
