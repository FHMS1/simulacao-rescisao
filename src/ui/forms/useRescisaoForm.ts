import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { rescisaoInputSchema, type RescisaoInput } from '../../domain/rescisao/schema';

const hoje = new Date();
const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

export function useRescisaoForm() {
  return useForm<RescisaoInput>({
    resolver: zodResolver(rescisaoInputSchema),
    defaultValues: {
      motivo: 'sem_justa_causa',
      dadosGerais: {
        nomeEmpregado: '',
        dataAdmissao: '',
        dataDesligamento: dataHoje,
        salarioBase: 0,
        tipoContrato: 'indeterminado',
        tipoSalario: 'mensalista',
        dependentesIRRF: 0,
      },
      avisoPrevio: { tipo: 'indenizado' },
      saldoSalario: {
        diasTrabalhados: hoje.getDate(),
        faltasInjustificadas: 0,
        descontarDSRSobreFaltas: false,
        outrosDescontosMes: 0,
      },
      ferias: {
        periodosVencidos: 0,
        periodosEmDobro: 0,
        calcularProporcional: true,
      },
      decimoTerceiro: { calcular: true, adiantamentoRecebido: 0 },
      verbasVariaveis: { integrar: false, modo: 'valor_informado' },
      descontosAdicionais: {},
    },
    mode: 'onBlur',
  });
}
