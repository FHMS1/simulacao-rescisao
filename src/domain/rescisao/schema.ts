import { z } from 'zod';

const dataISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida');
const dinheiro = z.number().finite().nonnegative();
const inteiroNaoNegativo = z.number().int().nonnegative();

export const motivosRescisao = [
  'sem_justa_causa',
  'pedido_demissao',
  'justa_causa',
  'acordo_484a',
  'termino_prazo_determinado',
  'antecipada_empregador_prazo_determinado',
  'antecipada_empregado_prazo_determinado',
  'rescisao_indireta',
  'culpa_reciproca_forca_maior',
] as const;

export const rescisaoInputSchema = z
  .object({
    motivo: z.enum(motivosRescisao),
    dadosGerais: z.object({
      nomeEmpregado: z.string().trim().max(120).optional(),
      dataAdmissao: dataISO,
      dataDesligamento: dataISO,
      salarioBase: dinheiro.positive('O salário deve ser maior que zero'),
      tipoContrato: z.enum(['indeterminado', 'determinado']),
      tipoSalario: z.enum(['mensalista', 'horista', 'comissionista', 'misto']),
      dependentesIRRF: inteiroNaoNegativo,
      pensaoAlimenticia: z
        .object({ tipo: z.enum(['valor_fixo', 'percentual']), valor: dinheiro })
        .optional(),
      observacaoConvencaoColetiva: z.string().trim().max(500).optional(),
    }),
    avisoPrevio: z.object({
      tipo: z.enum(['indenizado', 'trabalhado', 'parcial', 'sem_aviso']),
      diasManual: inteiroNaoNegativo.max(90).optional(),
      cumprimento: z.enum(['integral', 'parcial', 'nao_cumpriu']).optional(),
      diasCumpridos: inteiroNaoNegativo.max(90).optional(),
    }),
    saldoSalario: z.object({
      diasTrabalhados: inteiroNaoNegativo.max(31),
      faltasInjustificadas: inteiroNaoNegativo.max(31).optional(),
      descontarDSRSobreFaltas: z.boolean(),
      outrosDescontosMes: dinheiro,
    }),
    ferias: z.object({
      periodosVencidos: inteiroNaoNegativo,
      periodosEmDobro: inteiroNaoNegativo,
      calcularProporcional: z.boolean(),
      avosProporcionalManual: inteiroNaoNegativo.max(12).optional(),
      abono: z.object({ tipo: z.enum(['a_pagar', 'desconto_ja_recebido']), valor: dinheiro }).optional(),
    }),
    decimoTerceiro: z.object({
      calcular: z.boolean(),
      avosManual: inteiroNaoNegativo.max(12).optional(),
      adiantamentoRecebido: dinheiro.optional(),
    }),
    verbasVariaveis: z.object({
      integrar: z.boolean(),
      modo: z.enum(['valor_informado', 'media_meses']),
      qtdMesesMedia: z.union([z.literal(3), z.literal(6), z.literal(12)]).optional(),
      horasExtras: dinheiro.optional(),
      adicionalNoturno: dinheiro.optional(),
      comissoes: dinheiro.optional(),
      dsrSobreVariaveis: dinheiro.optional(),
      insalubridade: dinheiro.optional(),
      periculosidade: dinheiro.optional(),
      outras: dinheiro.optional(),
    }),
    descontosAdicionais: z.object({
      adiantamentoSalarial: dinheiro.optional(),
      valeTransporte: dinheiro.optional(),
      valeAlimentacao: dinheiro.optional(),
      convenios: dinheiro.optional(),
      emprestimosConsignado: dinheiro.optional(),
      outros: dinheiro.optional(),
      descricaoOutros: z.string().trim().max(200).optional(),
    }),
    dataPagamento: dataISO.optional(),
  })
  .superRefine((dados, contexto) => {
    if (dados.dadosGerais.dataDesligamento < dados.dadosGerais.dataAdmissao) {
      contexto.addIssue({
        code: 'custom',
        path: ['dadosGerais', 'dataDesligamento'],
        message: 'A data de desligamento não pode ser anterior à admissão',
      });
    }
    if (dados.ferias.periodosEmDobro > dados.ferias.periodosVencidos) {
      contexto.addIssue({
        code: 'custom',
        path: ['ferias', 'periodosEmDobro'],
        message: 'Períodos em dobro não podem superar os vencidos',
      });
    }
    if (dados.avisoPrevio.tipo === 'parcial' && dados.avisoPrevio.diasCumpridos === undefined) {
      contexto.addIssue({
        code: 'custom',
        path: ['avisoPrevio', 'diasCumpridos'],
        message: 'Informe quantos dias do aviso foram cumpridos',
      });
    }
    if (
      dados.verbasVariaveis.integrar &&
      dados.verbasVariaveis.modo === 'media_meses' &&
      dados.verbasVariaveis.qtdMesesMedia === undefined
    ) {
      contexto.addIssue({
        code: 'custom',
        path: ['verbasVariaveis', 'qtdMesesMedia'],
        message: 'Informe a quantidade de meses usada na média',
      });
    }
  });

export type RescisaoInput = z.infer<typeof rescisaoInputSchema>;
export type MotivoRescisao = RescisaoInput['motivo'];
export type TipoAvisoPrevio = RescisaoInput['avisoPrevio']['tipo'];
export type TipoSalario = RescisaoInput['dadosGerais']['tipoSalario'];
export type TipoContrato = RescisaoInput['dadosGerais']['tipoContrato'];
export type DadosGerais = RescisaoInput['dadosGerais'];
export type DadosAvisoPrevio = RescisaoInput['avisoPrevio'];
export type DadosSaldoSalario = RescisaoInput['saldoSalario'];
export type DadosFerias = RescisaoInput['ferias'];
export type DadosDecimoTerceiro = RescisaoInput['decimoTerceiro'];
export type VerbasVariaveis = RescisaoInput['verbasVariaveis'];
export type DescontosAdicionais = RescisaoInput['descontosAdicionais'];
