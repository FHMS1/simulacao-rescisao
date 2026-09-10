import type { RescisaoOutput, TempoServico } from '../../domain/rescisao/tipos';
import { Abas } from './Abas';
import { Icone } from './Icone';

interface ResultadoRescisaoProps {
  resultado: RescisaoOutput;
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function Linha({ nome, valor }: { nome: string; valor: number }) {
  return (
    <div className="linha-memoria">
      <dt>{nome}</dt>
      <dd className="numeric">{moeda.format(valor)}</dd>
    </div>
  );
}

/** "3 anos e 8 meses" — o contexto que o contador confere antes do valor. */
function descreverTempo({ anos, meses }: TempoServico): string {
  const partes = [
    anos > 0 ? `${anos} ${anos === 1 ? 'ano' : 'anos'}` : undefined,
    meses > 0 ? `${meses} ${meses === 1 ? 'mês' : 'meses'}` : undefined,
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(' e ') : 'menos de um mês';
}

const ROTULO_ALERTA = {
  bloqueante: 'Revisão necessária',
  atencao: 'Atenção',
  info: 'Nota',
} as const;

export function ResultadoRescisao({ resultado }: ResultadoRescisaoProps) {
  const { proventos, descontos, tributacao, fgts } = resultado;

  const memoria = (
    <div className="memoria-grade">
      <dl>
        <h4>Proventos</h4>
        <Linha nome="Saldo de salário" valor={proventos.saldoSalario} />
        <Linha nome="Aviso indenizado" valor={proventos.avisoPrevioPago} />
        <Linha nome="Férias vencidas" valor={proventos.feriasVencidas} />
        <Linha nome="Férias em dobro" valor={proventos.feriasEmDobro} />
        <Linha nome="Férias proporcionais" valor={proventos.feriasProporcionais} />
        <Linha nome="13º proporcional" valor={proventos.decimoTerceiroProporcional} />
      </dl>
      <dl>
        <h4>Descontos</h4>
        <Linha nome="INSS total" valor={tributacao.totalINSS} />
        <Linha nome="IRRF total" valor={tributacao.totalIRRF} />
        <Linha nome="Aviso descontado" valor={descontos.avisoPrevioDesconto} />
        <Linha nome="Faltas" valor={descontos.descontoFaltas} />
        <Linha nome="Adiantamento 13º" valor={descontos.adiantamentoDecimoTerceiro} />
        <Linha nome="Outros descontos" valor={descontos.outrosDescontos} />
      </dl>
    </div>
  );

  const tributos = (
    <>
      <div className="memoria-grade">
        <dl>
          <h4>Competência mensal</h4>
          <Linha nome="Base INSS" valor={tributacao.mensal.baseINSS} />
          <Linha nome="INSS" valor={tributacao.mensal.descontoINSS} />
          <Linha nome="Base IRRF" valor={tributacao.mensal.baseIRRF} />
          <Linha nome="Redução IRRF" valor={tributacao.mensal.reducaoIRRF} />
          <Linha nome="IRRF" valor={tributacao.mensal.descontoIRRF} />
        </dl>
        <dl>
          <h4>13º — tributação exclusiva</h4>
          <Linha nome="Base INSS" valor={tributacao.decimoTerceiro.baseINSS} />
          <Linha nome="INSS" valor={tributacao.decimoTerceiro.descontoINSS} />
          <Linha nome="Base IRRF" valor={tributacao.decimoTerceiro.baseIRRF} />
          <Linha nome="IRRF" valor={tributacao.decimoTerceiro.descontoIRRF} />
        </dl>
      </div>
      <p className="fonte">INSS: {tributacao.mensal.tabelaINSSAplicada.fonte}</p>
      <p className="fonte">IRRF: {tributacao.mensal.tabelaIRRFAplicada.fonte}</p>
    </>
  );

  const memoriaFGTS = (
    <>
      <dl className="memoria-coluna">
        <Linha nome="Depósito do mês" valor={fgts.depositoFGTSMes} />
        <Linha nome="Saldo histórico projetado" valor={fgts.saldoFGTSEstimado} />
        <Linha nome={`Multa estimada (${fgts.aliquotaMulta * 100}%)`} valor={fgts.multaFGTSEstimada} />
      </dl>
      <p className="fonte">
        O saldo é projeção sobre a remuneração informada. A multa real depende do extrato da conta
        vinculada, ao qual o simulador não tem acesso.
      </p>
    </>
  );

  return (
    <section className="resultado" aria-labelledby="resultado-titulo" aria-live="polite">
      <div className="resultado__cabecalho">
        <div>
          <p className="kicker">Estimativa calculada</p>
          <h2 id="resultado-titulo">Resumo da rescisão</h2>
          <p className="resultado__contexto numeric">
            {descreverTempo(resultado.tempoServico)} de contrato · aviso de {resultado.diasAvisoPrevio} dias
          </p>
        </div>
        <button type="button" className="botao-secundario" onClick={() => window.print()}>
          <Icone nome="impressora" tamanho={13} />
          Imprimir / salvar PDF
        </button>
      </div>

      <div className="totais">
        <article className="total">
          <span>
            <Icone nome="seta-cima" tamanho={12} />
            Proventos
          </span>
          <strong className="numeric">{moeda.format(proventos.totalProventos)}</strong>
        </article>
        <article className="total">
          <span>
            <Icone nome="seta-baixo" tamanho={12} />
            Descontos
          </span>
          <strong className="numeric">{moeda.format(descontos.totalDescontos)}</strong>
        </article>
        <article className="total total--principal">
          <span>
            <Icone nome="carteira" tamanho={12} />
            Líquido estimado
          </span>
          <strong className="numeric">{moeda.format(resultado.liquidoEmpregado)}</strong>
          <small>Proventos menos descontos. Não inclui o saque do FGTS.</small>
        </article>
        <article className="total total--linha">
          <span>
            <Icone nome="predio" tamanho={12} />
            Custo total da empresa
          </span>
          <strong className="numeric">{moeda.format(resultado.custoTotalEmpresa)}</strong>
        </article>
      </div>

      <Abas
        rotuloLista="Memória de cálculo"
        abas={[
          { id: 'memoria', rotulo: 'Memória', conteudo: memoria },
          { id: 'tributos', rotulo: 'Tributos', conteudo: tributos },
          { id: 'fgts', rotulo: 'FGTS', conteudo: memoriaFGTS },
        ]}
      />

      {resultado.alertas.length > 0 && (
        <div className="alertas">
          {resultado.alertas.map((alerta, indice) => (
            <p key={`${alerta.nivel}-${indice}`} className={`alerta alerta--${alerta.nivel}`}>
              <Icone nome={alerta.nivel === 'info' ? 'info' : 'alerta'} tamanho={13} />
              <span>
                <strong>{ROTULO_ALERTA[alerta.nivel]}:</strong> {alerta.mensagem}
              </span>
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
