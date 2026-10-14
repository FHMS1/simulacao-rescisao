import type { MotivoRescisao } from '../../domain/rescisao/schema';

/** Motivos na ordem em que aparecem no seletor, com o rótulo exibido na tela e no PDF. */
export const MOTIVOS: ReadonlyArray<readonly [MotivoRescisao, string]> = [
  ['sem_justa_causa', 'Dispensa sem justa causa'],
  ['pedido_demissao', 'Pedido de demissão'],
  ['justa_causa', 'Justa causa'],
  ['acordo_484a', 'Acordo — art. 484-A'],
  ['termino_prazo_determinado', 'Término de contrato determinado'],
  ['antecipada_empregador_prazo_determinado', 'Antecipação pelo empregador'],
  ['antecipada_empregado_prazo_determinado', 'Antecipação pelo empregado'],
  ['rescisao_indireta', 'Rescisão indireta'],
  ['culpa_reciproca', 'Culpa recíproca (Súmula 14 TST)'],
  ['forca_maior', 'Força maior (art. 502)'],
  ['falecimento', 'Falecimento do empregado'],
  ['aposentadoria_voluntaria', 'Aposentadoria voluntária'],
  ['pdv', 'PDV (demissão voluntária)'],
];

export function rotuloMotivo(motivo: MotivoRescisao): string {
  return MOTIVOS.find(([valor]) => valor === motivo)?.[1] ?? motivo;
}
