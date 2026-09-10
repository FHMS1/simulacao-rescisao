import { useState } from 'react';
import type { RescisaoInput } from '../../domain/rescisao/schema';
import { useRescisaoForm } from '../forms/useRescisaoForm';
import { Icone } from './Icone';

interface FormularioRescisaoProps {
  onCalcular: (dados: RescisaoInput) => void;
}

const numero = { setValueAs: (valor: string) => (valor === '' ? undefined : Number(valor)) } as const;

export function FormularioRescisao({ onCalcular }: FormularioRescisaoProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitted } } = useRescisaoForm();
  const aviso = watch('avisoPrevio.tipo');
  const feriasProporcionais = watch('ferias.calcularProporcional');
  const integrarVariaveis = watch('verbasVariaveis.integrar');
  const modoVariaveis = watch('verbasVariaveis.modo');
  const [temPensao, setTemPensao] = useState(false);
  const [temAbono, setTemAbono] = useState(false);

  return (
    <form className="formulario" onSubmit={handleSubmit(onCalcular)} noValidate>
      <div className="formulario__intro">
        <div>
          <p className="kicker">Nova simulação</p>
          <h2>Dados da rescisão</h2>
        </div>
        <p>Campos marcados com * são obrigatórios.</p>
      </div>

      <fieldset>
        <legend>
          <span className="passo" aria-hidden="true">1</span>
          Contrato e motivo
        </legend>
        <div className="campos campos--3">
          <label className="campo campo--largo">Nome do empregado <span>Opcional</span><input {...register('dadosGerais.nomeEmpregado')} /></label>
          <label className="campo">Admissão *<input type="date" {...register('dadosGerais.dataAdmissao')} aria-invalid={!!errors.dadosGerais?.dataAdmissao} /></label>
          <label className="campo">Desligamento *<input type="date" {...register('dadosGerais.dataDesligamento')} aria-invalid={!!errors.dadosGerais?.dataDesligamento} /></label>
          <label className="campo">Salário base *<input type="number" min="0" step="0.01" {...register('dadosGerais.salarioBase', numero)} aria-invalid={!!errors.dadosGerais?.salarioBase} /></label>
          <label className="campo">Motivo *<select {...register('motivo')}><option value="sem_justa_causa">Dispensa sem justa causa</option><option value="pedido_demissao">Pedido de demissão</option><option value="justa_causa">Justa causa</option><option value="acordo_484a">Acordo — art. 484-A</option><option value="termino_prazo_determinado">Término de contrato determinado</option><option value="antecipada_empregador_prazo_determinado">Antecipação pelo empregador</option><option value="antecipada_empregado_prazo_determinado">Antecipação pelo empregado</option><option value="rescisao_indireta">Rescisão indireta</option><option value="culpa_reciproca_forca_maior">Culpa recíproca / força maior</option></select></label>
          <label className="campo">Contrato<select {...register('dadosGerais.tipoContrato')}><option value="indeterminado">Prazo indeterminado</option><option value="determinado">Prazo determinado</option></select></label>
          <label className="campo">Tipo de salário<select {...register('dadosGerais.tipoSalario')}><option value="mensalista">Mensalista</option><option value="horista">Horista</option><option value="comissionista">Comissionista</option><option value="misto">Misto</option></select></label>
          <label className="campo">Dependentes IRRF<input type="number" min="0" step="1" {...register('dadosGerais.dependentesIRRF', numero)} /></label>
          {temPensao && <><label className="campo">Tipo de pensão<select {...register('dadosGerais.pensaoAlimenticia.tipo')}><option value="valor_fixo">Valor fixo apurado</option><option value="percentual">Percentual — exige revisão</option></select></label><label className="campo">Valor ou percentual<input type="number" min="0" step="0.01" {...register('dadosGerais.pensaoAlimenticia.valor', numero)} /></label></>}
        </div>
        <div className="opcoes"><label><input type="checkbox" checked={temPensao} onChange={(evento) => { setTemPensao(evento.target.checked); if (!evento.target.checked) setValue('dadosGerais.pensaoAlimenticia', undefined); }} /> Incluir pensão alimentícia</label></div>
        {errors.dadosGerais && <p className="erro" role="alert">Revise salário e datas do contrato.</p>}
      </fieldset>

      <fieldset>
        <legend>
          <span className="passo" aria-hidden="true">2</span>
          Aviso, saldo, férias e 13º
        </legend>
        <div className="campos campos--3">
          <label className="campo">Tipo de aviso<select {...register('avisoPrevio.tipo')}><option value="indenizado">Indenizado</option><option value="trabalhado">Trabalhado</option><option value="parcial">Parcialmente cumprido</option><option value="sem_aviso">Sem aviso</option></select></label>
          {aviso === 'parcial' && <label className="campo">Dias cumpridos *<input type="number" min="0" max="90" {...register('avisoPrevio.diasCumpridos', numero)} /></label>}
          <label className="campo">Dias de aviso <span>Opcional</span><input type="number" min="0" max="90" placeholder="Automático" {...register('avisoPrevio.diasManual', numero)} /></label>
          <label className="campo">Dias trabalhados no mês<input type="number" min="0" max="31" {...register('saldoSalario.diasTrabalhados', numero)} /></label>
          <label className="campo">Faltas injustificadas<input type="number" min="0" max="31" {...register('saldoSalario.faltasInjustificadas', numero)} /></label>
          <label className="campo">Outros descontos do mês<input type="number" min="0" step="0.01" {...register('saldoSalario.outrosDescontosMes', numero)} /></label>
          <label className="campo">Períodos de férias vencidos<input type="number" min="0" step="1" {...register('ferias.periodosVencidos', numero)} /></label>
          <label className="campo">Períodos em dobro<input type="number" min="0" step="1" {...register('ferias.periodosEmDobro', numero)} /></label>
          {feriasProporcionais && <label className="campo">Avos de férias <span>Opcional</span><input type="number" min="0" max="12" placeholder="Automático" {...register('ferias.avosProporcionalManual', numero)} /></label>}
          <label className="campo">Avos do 13º <span>Opcional</span><input type="number" min="0" max="12" placeholder="Automático" {...register('decimoTerceiro.avosManual', numero)} /></label>
          <label className="campo">Adiantamento do 13º<input type="number" min="0" step="0.01" {...register('decimoTerceiro.adiantamentoRecebido', numero)} /></label>
          {temAbono && <><label className="campo">Tratamento do abono<select {...register('ferias.abono.tipo')}><option value="a_pagar">A pagar</option><option value="desconto_ja_recebido">Já recebido — descontar</option></select></label><label className="campo">Valor do abono<input type="number" min="0" step="0.01" {...register('ferias.abono.valor', numero)} /></label></>}
        </div>
        <div className="opcoes">
          <label><input type="checkbox" {...register('ferias.calcularProporcional')} /> Calcular férias proporcionais</label>
          <label><input type="checkbox" {...register('decimoTerceiro.calcular')} /> Calcular 13º proporcional</label>
          <label><input type="checkbox" {...register('saldoSalario.descontarDSRSobreFaltas')} /> Sinalizar DSR sobre faltas</label>
          <label><input type="checkbox" checked={temAbono} onChange={(evento) => { setTemAbono(evento.target.checked); if (!evento.target.checked) setValue('ferias.abono', undefined); }} /> Incluir abono pecuniário</label>
        </div>
      </fieldset>

      <details className="bloco-opcional">
        <summary>
          <span className="passo" aria-hidden="true">3</span>
          Verbas variáveis e outros descontos
        </summary>
        <div className="opcoes"><label><input type="checkbox" {...register('verbasVariaveis.integrar')} /> Integrar médias ao salário de referência</label></div>
        {integrarVariaveis && <div className="campos campos--3">
          <label className="campo">Forma de informação<select {...register('verbasVariaveis.modo')}><option value="valor_informado">Média mensal já apurada</option><option value="media_meses">Totais acumulados — calcular média</option></select></label>
          {modoVariaveis === 'media_meses' && <label className="campo">Quantidade de meses<select {...register('verbasVariaveis.qtdMesesMedia', numero)}><option value="3">3 meses</option><option value="6">6 meses</option><option value="12">12 meses</option></select></label>}
          <label className="campo">Horas extras<input type="number" min="0" step="0.01" {...register('verbasVariaveis.horasExtras', numero)} /></label>
          <label className="campo">Comissões<input type="number" min="0" step="0.01" {...register('verbasVariaveis.comissoes', numero)} /></label>
          <label className="campo">Adicional noturno<input type="number" min="0" step="0.01" {...register('verbasVariaveis.adicionalNoturno', numero)} /></label>
          <label className="campo">DSR sobre variáveis<input type="number" min="0" step="0.01" {...register('verbasVariaveis.dsrSobreVariaveis', numero)} /></label>
          <label className="campo">Insalubridade<input type="number" min="0" step="0.01" {...register('verbasVariaveis.insalubridade', numero)} /></label>
          <label className="campo">Periculosidade<input type="number" min="0" step="0.01" {...register('verbasVariaveis.periculosidade', numero)} /></label>
          <label className="campo">Outras médias<input type="number" min="0" step="0.01" {...register('verbasVariaveis.outras', numero)} /></label>
        </div>}
        <div className="campos campos--3">
          <label className="campo">Adiantamento salarial<input type="number" min="0" step="0.01" {...register('descontosAdicionais.adiantamentoSalarial', numero)} /></label>
          <label className="campo">Vale-transporte<input type="number" min="0" step="0.01" {...register('descontosAdicionais.valeTransporte', numero)} /></label>
          <label className="campo">Vale-alimentação<input type="number" min="0" step="0.01" {...register('descontosAdicionais.valeAlimentacao', numero)} /></label>
          <label className="campo">Convênios<input type="number" min="0" step="0.01" {...register('descontosAdicionais.convenios', numero)} /></label>
          <label className="campo">Consignado<input type="number" min="0" step="0.01" {...register('descontosAdicionais.emprestimosConsignado', numero)} /></label>
          <label className="campo">Outros<input type="number" min="0" step="0.01" {...register('descontosAdicionais.outros', numero)} /></label>
        </div>
      </details>

      {isSubmitted && Object.keys(errors).length > 0 && <p className="erro" role="alert">Existem campos inválidos ou incompletos. Revise os blocos acima.</p>}

      <div className="formulario__acao">
        <p>
          <Icone nome="cadeado" tamanho={12} />
          O cálculo acontece somente neste dispositivo.
        </p>
        <button type="submit">
          <Icone nome="calculadora" tamanho={15} />
          Calcular rescisão
        </button>
      </div>
    </form>
  );
}
