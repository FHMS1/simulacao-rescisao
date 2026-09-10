import { describe, expect, it } from 'vitest';
import { competenciaISO, selecionarVigencia } from '../vigencia';

const TABELAS = [
  { vigenciaInicio: '2025-01-01', vigenciaFim: '2025-12-31', id: '2025' },
  { vigenciaInicio: '2026-01-01', vigenciaFim: null, id: '2026' },
];

describe('selecionarVigencia', () => {
  it('encontra a tabela da competência no meio do período', () => {
    expect(selecionarVigencia(TABELAS, new Date(2025, 5, 15))?.id).toBe('2025');
  });

  // Regressão: `new Date('2025-12-31')` vira 30/12 21h em UTC-3 e fazia a
  // rescisão do último dia do ano cair fora de qualquer vigência.
  it('inclui o último dia da vigência mesmo em fuso negativo', () => {
    expect(selecionarVigencia(TABELAS, new Date(2025, 11, 31))?.id).toBe('2025');
  });

  it('inclui o primeiro dia da vigência', () => {
    expect(selecionarVigencia(TABELAS, new Date(2026, 0, 1))?.id).toBe('2026');
  });

  it('aceita vigência aberta (vigenciaFim null)', () => {
    expect(selecionarVigencia(TABELAS, new Date(2030, 2, 10))?.id).toBe('2026');
  });

  it('devolve undefined quando a competência é anterior a toda tabela', () => {
    expect(selecionarVigencia(TABELAS, new Date(2024, 11, 31))).toBeUndefined();
  });

  it('devolve undefined quando não há tabela cadastrada', () => {
    expect(selecionarVigencia([], new Date(2025, 5, 15))).toBeUndefined();
  });
});

describe('competenciaISO', () => {
  it('usa a data local, não a data UTC', () => {
    expect(competenciaISO(new Date(2025, 11, 31))).toBe('2025-12-31');
  });
});
