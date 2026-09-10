import { describe, expect, it } from 'vitest';
import { rescisaoInputSchema } from '../schema';
import { entradaBase } from './support/entradaBase';

describe('rescisaoInputSchema', () => {
  it('aceita um contrato completo válido', () => {
    expect(rescisaoInputSchema.safeParse(entradaBase()).success).toBe(true);
  });

  it('rejeita salário zero e desligamento anterior à admissão', () => {
    const entrada = entradaBase();
    entrada.dadosGerais.salarioBase = 0;
    entrada.dadosGerais.dataDesligamento = '2022-12-31';
    const resultado = rescisaoInputSchema.safeParse(entrada);
    expect(resultado.success).toBe(false);
    if (!resultado.success) expect(resultado.error.issues).toHaveLength(2);
  });

  it('exige dias cumpridos no aviso parcial', () => {
    const entrada = entradaBase();
    entrada.avisoPrevio = { tipo: 'parcial' };
    expect(rescisaoInputSchema.safeParse(entrada).success).toBe(false);
  });
});
