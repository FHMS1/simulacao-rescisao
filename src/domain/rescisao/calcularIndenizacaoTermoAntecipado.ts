import { arredondarCentavos } from './dinheiro';

const DIAS_COMERCIAIS_MES = 30;

export interface CalcularIndenizacaoTermoAntecipadoInput {
  /** Remuneração mensal de referência (salário base + médias integradas). */
  salarioReferencia: number;
  dataDesligamento: string;
  dataTerminoPrevista: string;
}

export interface IndenizacaoTermoAntecipado {
  diasRestantes: number;
  /** Metade da remuneração devida até o termo — teto comum aos arts. 479 e 480. */
  valorArt479: number;
  /** Teto do desconto ao empregado: o art. 480 limita-se ao do art. 479 e o art. 477, §5º, a um mês. */
  tetoArt480: number;
}

function diasEntre(inicioISO: string, fimISO: string): number {
  const [anoI = 0, mesI = 1, diaI = 1] = inicioISO.split('-').map(Number);
  const [anoF = 0, mesF = 1, diaF = 1] = fimISO.split('-').map(Number);
  const milissegundosPorDia = 86_400_000;
  return Math.round(
    (Date.UTC(anoF, mesF - 1, diaF) - Date.UTC(anoI, mesI - 1, diaI)) / milissegundosPorDia,
  );
}

/**
 * Indenização por rescisão antecipada de contrato a termo (CLT, arts. 479 e 480).
 * Ver spec/02-regras-de-negocio-tributarias.md, seção 3.2.
 *
 * O prazo restante é contado em dias corridos entre o desligamento e o termo e
 * valorado pela convenção de 30 dias por mês — a mesma do aviso prévio.
 */
export function calcularIndenizacaoTermoAntecipado({
  salarioReferencia,
  dataDesligamento,
  dataTerminoPrevista,
}: CalcularIndenizacaoTermoAntecipadoInput): IndenizacaoTermoAntecipado {
  if (!Number.isFinite(salarioReferencia) || salarioReferencia < 0) {
    throw new Error('Salário de referência deve ser um número não negativo');
  }

  const diasRestantes = Math.max(0, diasEntre(dataDesligamento, dataTerminoPrevista));
  const valorArt479 = arredondarCentavos(
    ((salarioReferencia / DIAS_COMERCIAIS_MES) * diasRestantes) / 2,
  );
  const tetoArt480 = arredondarCentavos(Math.min(valorArt479, salarioReferencia));

  return { diasRestantes, valorArt479, tetoArt480 };
}
