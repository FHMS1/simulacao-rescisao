import { describe, expect, it } from 'vitest';
import { calcularIndenizacaoTermoAntecipado } from '../calcularIndenizacaoTermoAntecipado';

describe('calcularIndenizacaoTermoAntecipado', () => {
  it('paga metade da remuneração dos dias que faltam para o termo (art. 479)', () => {
    // 30 dias restantes × R$ 3.000/mês ÷ 2 = R$ 1.500
    const resultado = calcularIndenizacaoTermoAntecipado({
      salarioReferencia: 3000,
      dataDesligamento: '2026-03-01',
      dataTerminoPrevista: '2026-03-31',
    });
    expect(resultado.diasRestantes).toBe(30);
    expect(resultado.valorArt479).toBe(1500);
  });

  it('retorna zero quando o contrato já chegou ao termo', () => {
    const resultado = calcularIndenizacaoTermoAntecipado({
      salarioReferencia: 3000,
      dataDesligamento: '2026-03-31',
      dataTerminoPrevista: '2026-03-31',
    });
    expect(resultado.diasRestantes).toBe(0);
    expect(resultado.valorArt479).toBe(0);
    expect(resultado.tetoArt480).toBe(0);
  });

  it('não é afetado pela troca do horário de verão ao contar os dias', () => {
    const resultado = calcularIndenizacaoTermoAntecipado({
      salarioReferencia: 3000,
      dataDesligamento: '2026-01-01',
      dataTerminoPrevista: '2026-12-31',
    });
    expect(resultado.diasRestantes).toBe(364);
  });

  it('limita o desconto do art. 480 a um mês de remuneração (art. 477, §5º)', () => {
    // 180 dias restantes: art. 479 = 9.000, mas o desconto não passa de 3.000.
    const resultado = calcularIndenizacaoTermoAntecipado({
      salarioReferencia: 3000,
      dataDesligamento: '2026-01-01',
      dataTerminoPrevista: '2026-06-30',
    });
    expect(resultado.valorArt479).toBe(9000);
    expect(resultado.tetoArt480).toBe(3000);
  });

  it('rejeita remuneração negativa', () => {
    expect(() =>
      calcularIndenizacaoTermoAntecipado({
        salarioReferencia: -1,
        dataDesligamento: '2026-01-01',
        dataTerminoPrevista: '2026-02-01',
      }),
    ).toThrow();
  });
});
