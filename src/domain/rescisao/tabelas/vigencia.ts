export interface Vigencia {
  vigenciaInicio: string; // ISO 'YYYY-MM-DD'
  vigenciaFim: string | null; // null = ainda vigente
}

/**
 * Converte uma data para a competência ISO no fuso local.
 *
 * Não use `new Date('2025-12-31')` para comparar vigência: o construtor
 * interpreta a string como UTC, que no fuso do Brasil (UTC-3) vira 30/12 às
 * 21h — uma rescisão no último dia do ano não encontraria a tabela do ano.
 * Comparar strings ISO é lexicograficamente correto e imune a fuso.
 */
export function competenciaISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function selecionarVigencia<T extends Vigencia>(
  tabelas: readonly T[],
  dataReferencia: Date,
): T | undefined {
  const competencia = competenciaISO(dataReferencia);
  return tabelas.find(
    (t) => competencia >= t.vigenciaInicio && (!t.vigenciaFim || competencia <= t.vigenciaFim),
  );
}
