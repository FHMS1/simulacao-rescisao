import type { TempoServico } from './tipos';

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

function compararDatas(a: DataCivil, b: DataCivil): number {
  return a.ano - b.ano || a.mes - b.mes || a.dia - b.dia;
}

function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function adicionarAnos(data: DataCivil, quantidade: number): DataCivil {
  const ano = data.ano + quantidade;
  return { ano, mes: data.mes, dia: Math.min(data.dia, diasNoMes(ano, data.mes)) };
}

function adicionarMeses(data: DataCivil, quantidade: number): DataCivil {
  const indiceMes = data.ano * 12 + data.mes - 1 + quantidade;
  const ano = Math.floor(indiceMes / 12);
  const mes = (indiceMes % 12) + 1;
  return { ano, mes, dia: Math.min(data.dia, diasNoMes(ano, mes)) };
}

function diferencaEmDias(inicio: DataCivil, fim: DataCivil): number {
  const inicioUTC = Date.UTC(inicio.ano, inicio.mes - 1, inicio.dia);
  const fimUTC = Date.UTC(fim.ano, fim.mes - 1, fim.dia);
  return (fimUTC - inicioUTC) / 86_400_000;
}

export function calcularTempoServico(
  dataAdmissao: string,
  dataDesligamento: string,
): TempoServico {
  const admissao = lerDataISO(dataAdmissao);
  const desligamento = lerDataISO(dataDesligamento);

  if (compararDatas(desligamento, admissao) < 0) {
    throw new Error('A data de desligamento não pode ser anterior à admissão');
  }

  let anos = desligamento.ano - admissao.ano;
  if (compararDatas(adicionarAnos(admissao, anos), desligamento) > 0) anos -= 1;

  const aniversarioAnual = adicionarAnos(admissao, anos);
  let meses = 0;
  while (compararDatas(adicionarMeses(aniversarioAnual, meses + 1), desligamento) <= 0) {
    meses += 1;
  }

  const aniversarioMensal = adicionarMeses(aniversarioAnual, meses);
  const dias = diferencaEmDias(aniversarioMensal, desligamento);

  return {
    anos,
    meses,
    dias,
    totalMeses: anos * 12 + meses,
  };
}
