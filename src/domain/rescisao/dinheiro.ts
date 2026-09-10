export function arredondarCentavos(valor: number): number {
  if (!Number.isFinite(valor)) throw new Error('Valor monetário deve ser finito');
  const toleranciaBinaria = Math.sign(valor || 1) * 1e-9;
  return Math.round((valor + toleranciaBinaria) * 100) / 100;
}
