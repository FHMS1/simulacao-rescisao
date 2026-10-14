import { useEffect, useState } from 'react';
import type { RescisaoInput } from '../../domain/rescisao/schema';
import { MOTIVOS } from '../forms/motivos';
import { useRescisaoForm } from '../forms/useRescisaoForm';
import { Icone } from './Icone';
import { Moeda } from './Moeda';
import './botao.css';
import './cartao.css';
import './formulario-rescisao.css';

interface FormularioRescisaoProps {
  onCalcular: (dados: RescisaoInput) => void;
}

const numero = { setValueAs: (valor: string) => (valor === '' ? undefined : Number(valor)) } as const;
// O schema exige este valor, mas quem preenche pode deixá-lo em branco: vazio vale zero.
const zeroSeVazio = { setValueAs: (valor: string) => (valor === '' ? 0 : Number(valor)) } as const;

/** Mensagem de validação ligada ao campo por `aria-describedby`. */
function ErroCampo({ id, mensagem }: { id: string; mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <span className="erro-campo" id={id}>
      {mensagem}
    </span>
  );
}

/** Atributos que ligam o campo à sua mensagem de erro e ao estado inválido. */
function ligacaoErro(id: string, mensagem?: string) {
  return { 'aria-invalid': mensagem ? true : undefined, 'aria-describedby': mensagem ? id : undefined } as const;
}

export function FormularioRescisao({ onCalcular }: FormularioRescisaoProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitted, isSubmitting },
  } = useRescisaoForm();
  const motivo = watch('motivo');
  const termoAntecipado =
    motivo === 'antecipada_empregador_prazo_determinado' ||
    motivo === 'antecipada_empregado_prazo_determinado';
  // Campos de PDV só valem para este motivo; ao trocar, o objeto parcial sairia
  // inválido no schema e bloquearia o cálculo dos demais motivos.
  useEffect(() => {
    if (motivo !== 'pdv') setValue('pdv', undefined);
  }, [motivo, setValue]);
  const aviso = watch('avisoPrevio.tipo');
  const feriasProporcionais = watch('ferias.calcularProporcional');
  const integrarVariaveis = watch('verbasVariaveis.integrar');
  const modoVariaveis = watch('verbasVariaveis.modo');
  const [temPensao, setTemPensao] = useState(false);
  const [temAbono, setTemAbono] = useState(false);
  const [dsrAuto, setDsrAuto] = useState(false);
  const [blocoAberto, setBlocoAberto] = useState(false);

  // O DSR automático só existe junto com a integração das médias; ao desligá-la,
  // os dois campos somem e não podem deixar valores vazios que o schema rejeitaria.
  useEffect(() => {
    if (!integrarVariaveis) {
      setDsrAuto(false);
      setValue('verbasVariaveis.dsrAutomatico', undefined);
    }
  }, [integrarVariaveis, setValue]);

  const erroAdmissao = errors.dadosGerais?.dataAdmissao?.message;
  const erroDesligamento = errors.dadosGerais?.dataDesligamento?.message;
  const erroSalario = errors.dadosGerais?.salarioBase?.message;
  const erroTermino = errors.dadosGerais?.dataTerminoPrevista?.message;
  const erroDiasCumpridos = errors.avisoPrevio?.diasCumpridos?.message;
  const erroIncentivo = errors.pdv?.valorIncentivo?.message;
  const erroDiasUteis = errors.verbasVariaveis?.dsrAutomatico?.diasUteis?.message;
  const erroDescanso = errors.verbasVariaveis?.dsrAutomatico?.diasDescanso?.message;

  // Um erro dentro do bloco recolhido seria invisível: o bloco abre sozinho.
  const erroNoBloco = Boolean(errors.verbasVariaveis || errors.descontosAdicionais);

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
          <span className="etapa__titulo">
            <span className="passo" aria-hidden="true">1</span>
            <span>
              Contrato e motivo
              <small>Quem é o empregado, o período do contrato e por que ele termina.</small>
            </span>
          </span>
        </legend>
        <div className="campos">
          <label className="campo campo--largo">Nome do empregado <span>Opcional</span><input {...register('dadosGerais.nomeEmpregado')} autoComplete="off" /></label>
          <div>
            <label className="campo">Admissão *<input type="date" {...register('dadosGerais.dataAdmissao')} {...ligacaoErro('erro-admissao', erroAdmissao)} /></label>
            <ErroCampo id="erro-admissao" mensagem={erroAdmissao} />
          </div>
          <div>
            <label className="campo">Desligamento *<input type="date" {...register('dadosGerais.dataDesligamento')} {...ligacaoErro('erro-desligamento', erroDesligamento)} /></label>
            <ErroCampo id="erro-desligamento" mensagem={erroDesligamento} />
          </div>
          <div>
            <label className="campo">Salário base *<Moeda {...register('dadosGerais.salarioBase', numero)} {...ligacaoErro('erro-salario', erroSalario)} /></label>
            <ErroCampo id="erro-salario" mensagem={erroSalario} />
          </div>
          <label className="campo">Motivo *<select {...register('motivo')}>{MOTIVOS.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}</select></label>
          <label className="campo">Contrato<select {...register('dadosGerais.tipoContrato')}><option value="indeterminado">Prazo indeterminado</option><option value="determinado">Prazo determinado</option></select></label>
          <label className="campo">Tipo de salário<select {...register('dadosGerais.tipoSalario')}><option value="mensalista">Mensalista</option><option value="horista">Horista</option><option value="comissionista">Comissionista</option><option value="misto">Misto</option></select></label>
          <label className="campo">Dependentes IRRF<input type="number" min="0" step="1" inputMode="numeric" {...register('dadosGerais.dependentesIRRF', numero)} /></label>
          {termoAntecipado && (
            <div className="campo--condicional">
              <label className="campo">Término previsto do contrato *<input type="date" {...register('dadosGerais.dataTerminoPrevista')} {...ligacaoErro('erro-termino', erroTermino)} /></label>
              <ErroCampo id="erro-termino" mensagem={erroTermino} />
            </div>
          )}
          {motivo === 'pdv' && (
            <>
              <div className="campo--condicional">
                <label className="campo">Incentivo do PDV *<Moeda {...register('pdv.valorIncentivo', numero)} {...ligacaoErro('erro-incentivo', erroIncentivo)} /></label>
                <ErroCampo id="erro-incentivo" mensagem={erroIncentivo} />
              </div>
              <label className="campo campo--condicional">Multa do FGTS no plano<select {...register('pdv.multaFGTS', { setValueAs: Number })}><option value="0">Sem multa</option><option value="0.2">20%</option><option value="0.4">40%</option></select></label>
            </>
          )}
          {temPensao && (
            <>
              <label className="campo campo--condicional">Tipo de pensão<select {...register('dadosGerais.pensaoAlimenticia.tipo')}><option value="valor_fixo">Valor fixo apurado</option><option value="percentual">Percentual — exige revisão</option></select></label>
              <label className="campo campo--condicional">Valor ou percentual<input type="number" min="0" step="0.01" inputMode="decimal" {...register('dadosGerais.pensaoAlimenticia.valor', numero)} /></label>
            </>
          )}
        </div>
        <div className="opcoes">
          {motivo === 'pdv' && <label className="campo--condicional"><input type="checkbox" {...register('pdv.pagaAvisoIndenizado')} /> Plano prevê pagamento do aviso indenizado</label>}
          {termoAntecipado && <label className="campo--condicional"><input type="checkbox" {...register('dadosGerais.clausulaAssecuratoria')} /> Contrato tem cláusula assecuratória (art. 481)</label>}
          <label><input type="checkbox" checked={temPensao} onChange={(evento) => { setTemPensao(evento.target.checked); if (!evento.target.checked) setValue('dadosGerais.pensaoAlimenticia', undefined); }} /> Incluir pensão alimentícia</label>
        </div>
        {errors.dadosGerais && <p className="erro" role="alert"><Icone nome="alerta" tamanho={13} /><span>Revise salário e datas do contrato.</span></p>}
      </fieldset>

      <fieldset>
        <legend>
          <span className="etapa__titulo">
            <span className="passo" aria-hidden="true">2</span>
            <span>
              Aviso, saldo, férias e 13º
              <small>Como o aviso foi cumprido e quais parcelas entram na rescisão.</small>
            </span>
          </span>
        </legend>
        <div className="campos">
          <label className="campo">Tipo de aviso<select {...register('avisoPrevio.tipo')}><option value="indenizado">Indenizado</option><option value="trabalhado">Trabalhado</option><option value="parcial">Parcialmente cumprido</option><option value="sem_aviso">Sem aviso</option></select></label>
          {aviso === 'parcial' && (
            <div className="campo--condicional">
              <label className="campo">Dias cumpridos *<input type="number" min="0" max="90" inputMode="numeric" {...register('avisoPrevio.diasCumpridos', numero)} {...ligacaoErro('erro-dias-cumpridos', erroDiasCumpridos)} /></label>
              <ErroCampo id="erro-dias-cumpridos" mensagem={erroDiasCumpridos} />
            </div>
          )}
          <label className="campo">Dias de aviso <span>Opcional</span><input type="number" min="0" max="90" inputMode="numeric" placeholder="Automático" {...register('avisoPrevio.diasManual', numero)} /></label>
          <label className="campo">Dias trabalhados no mês<input type="number" min="0" max="31" inputMode="numeric" {...register('saldoSalario.diasTrabalhados', numero)} /></label>
          <label className="campo">Faltas injustificadas<input type="number" min="0" max="31" inputMode="numeric" {...register('saldoSalario.faltasInjustificadas', numero)} /></label>
          <label className="campo">Outros descontos do mês<Moeda {...register('saldoSalario.outrosDescontosMes', zeroSeVazio)} /></label>
          <label className="campo">Períodos de férias vencidos<input type="number" min="0" step="1" inputMode="numeric" {...register('ferias.periodosVencidos', numero)} /></label>
          <label className="campo">Períodos em dobro<input type="number" min="0" step="1" inputMode="numeric" {...register('ferias.periodosEmDobro', numero)} /></label>
          {feriasProporcionais && <label className="campo campo--condicional">Avos de férias <span>Opcional</span><input type="number" min="0" max="12" inputMode="numeric" placeholder="Automático" {...register('ferias.avosProporcionalManual', numero)} /></label>}
          <label className="campo">Avos do 13º <span>Opcional</span><input type="number" min="0" max="12" inputMode="numeric" placeholder="Automático" {...register('decimoTerceiro.avosManual', numero)} /></label>
          <label className="campo">Adiantamento do 13º<Moeda {...register('decimoTerceiro.adiantamentoRecebido', numero)} /></label>
          {temAbono && (
            <>
              <label className="campo campo--condicional">Tratamento do abono<select {...register('ferias.abono.tipo')}><option value="a_pagar">A pagar</option><option value="desconto_ja_recebido">Já recebido — descontar</option></select></label>
              <label className="campo campo--condicional">Valor do abono<Moeda {...register('ferias.abono.valor', numero)} /></label>
            </>
          )}
        </div>
        <div className="opcoes">
          <label><input type="checkbox" {...register('ferias.calcularProporcional')} /> Calcular férias proporcionais</label>
          <label><input type="checkbox" {...register('decimoTerceiro.calcular')} /> Calcular 13º proporcional</label>
          <label><input type="checkbox" {...register('saldoSalario.descontarDSRSobreFaltas')} /> Sinalizar DSR sobre faltas</label>
          <label><input type="checkbox" checked={temAbono} onChange={(evento) => { setTemAbono(evento.target.checked); if (!evento.target.checked) setValue('ferias.abono', undefined); }} /> Incluir abono pecuniário</label>
        </div>
      </fieldset>

      <details
        className="bloco-opcional"
        open={blocoAberto || erroNoBloco}
        onToggle={(evento) => setBlocoAberto(evento.currentTarget.open)}
      >
        <summary>
          <span className="etapa__titulo">
            <span className="passo" aria-hidden="true">3</span>
            <span>
              Verbas variáveis e outros descontos
              <small>Opcional — médias de horas extras, comissões e descontos do mês.</small>
            </span>
          </span>
          <span className="bloco-opcional__seta"><Icone nome="seta-direita" tamanho={16} /></span>
        </summary>
        <div className="bloco-opcional__corpo">
          <div className="opcoes"><label><input type="checkbox" {...register('verbasVariaveis.integrar')} /> Integrar médias ao salário de referência</label></div>
          {integrarVariaveis && (
            <div className="campos campo--condicional">
              <label className="campo">Forma de informação<select {...register('verbasVariaveis.modo')}><option value="valor_informado">Média mensal já apurada</option><option value="media_meses">Totais acumulados — calcular média</option></select></label>
              {modoVariaveis === 'media_meses' && <label className="campo campo--condicional">Quantidade de meses<select {...register('verbasVariaveis.qtdMesesMedia', numero)}><option value="3">3 meses</option><option value="6">6 meses</option><option value="12">12 meses</option></select></label>}
              <label className="campo">Horas extras<Moeda {...register('verbasVariaveis.horasExtras', numero)} /></label>
              <label className="campo">Comissões<Moeda {...register('verbasVariaveis.comissoes', numero)} /></label>
              <label className="campo">Adicional noturno<Moeda {...register('verbasVariaveis.adicionalNoturno', numero)} /></label>
              <label className="campo">DSR sobre variáveis<Moeda {...register('verbasVariaveis.dsrSobreVariaveis', numero)} /></label>
              <label className="campo">Insalubridade<Moeda {...register('verbasVariaveis.insalubridade', numero)} /></label>
              <label className="campo">Periculosidade<Moeda {...register('verbasVariaveis.periculosidade', numero)} /></label>
              <label className="campo">Outras médias<Moeda {...register('verbasVariaveis.outras', numero)} /></label>
              {dsrAuto && (
                <>
                  <div className="campo--condicional">
                    <label className="campo">Dias úteis do mês *<input type="number" min="1" max="31" step="1" inputMode="numeric" {...register('verbasVariaveis.dsrAutomatico.diasUteis', numero)} {...ligacaoErro('erro-dias-uteis', erroDiasUteis)} /></label>
                    <ErroCampo id="erro-dias-uteis" mensagem={erroDiasUteis} />
                  </div>
                  <div className="campo--condicional">
                    <label className="campo">Domingos e feriados *<input type="number" min="0" max="10" step="1" inputMode="numeric" {...register('verbasVariaveis.dsrAutomatico.diasDescanso', numero)} {...ligacaoErro('erro-descanso', erroDescanso)} /></label>
                    <ErroCampo id="erro-descanso" mensagem={erroDescanso} />
                  </div>
                </>
              )}
              <div className="opcoes campo--largo"><label><input type="checkbox" checked={dsrAuto} onChange={(evento) => { setDsrAuto(evento.target.checked); if (!evento.target.checked) setValue('verbasVariaveis.dsrAutomatico', undefined); }} /> Calcular DSR automaticamente (substitui o valor digitado)</label></div>
            </div>
          )}
          <p className="bloco-opcional__subtitulo">Descontos adicionais</p>
          <div className="campos">
            <label className="campo">Adiantamento salarial<Moeda {...register('descontosAdicionais.adiantamentoSalarial', numero)} /></label>
            <label className="campo">Vale-transporte<Moeda {...register('descontosAdicionais.valeTransporte', numero)} /></label>
            <label className="campo">Vale-alimentação<Moeda {...register('descontosAdicionais.valeAlimentacao', numero)} /></label>
            <label className="campo">Convênios<Moeda {...register('descontosAdicionais.convenios', numero)} /></label>
            <label className="campo">Consignado<Moeda {...register('descontosAdicionais.emprestimosConsignado', numero)} /></label>
            <label className="campo">Outros<Moeda {...register('descontosAdicionais.outros', numero)} /></label>
          </div>
        </div>
      </details>

      {isSubmitted && Object.keys(errors).length > 0 && (
        <p className="erro" role="alert">
          <Icone nome="alerta" tamanho={13} />
          <span>Existem campos inválidos ou incompletos. Revise os blocos acima.</span>
        </p>
      )}

      <div className="formulario__acao">
        <p>
          <Icone nome="cadeado" tamanho={12} />
          O cálculo acontece somente neste dispositivo.
        </p>
        <button type="submit" className="botao-primario" aria-busy={isSubmitting}>
          <span className="botao__rotulo">
            <Icone nome="calculadora" tamanho={15} />
            Calcular rescisão
          </span>
          {isSubmitting && <span className="botao__spinner" aria-hidden="true" />}
        </button>
      </div>
    </form>
  );
}
