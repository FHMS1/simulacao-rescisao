import type { RescisaoInput } from '../../domain/rescisao/schema';
import type { Alerta, RescisaoOutput, TempoServico } from '../../domain/rescisao/tipos';
import { rotuloMotivo } from '../forms/motivos';
import { Abas } from './Abas';
import { Icone } from './Icone';
import './botao.css';
import './cartao.css';
import './resultado-rescisao.css';

interface ResultadoRescisaoProps {
  resultado: RescisaoOutput;
  /** Dados digitados — identificam o caso no PDF. */
  dados?: RescisaoInput;
  geradoEm?: Date;
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

/** '2026-10-09' → '09/10/2026', sem passar por Date (evita deslocamento de fuso). */
function dataBR(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : iso;
}

interface LinhaProps {
  nome: string;
  valor: number;
  total?: boolean;
}

function Linha({ nome, valor, total = false }: LinhaProps) {
  const zerada = !total && valor === 0;
  const classe = ['linha-memoria', total && 'linha-memoria--total', zerada && 'linha-memoria--zero']
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classe}>
      <dt>{nome}</dt>
      {/* Parcela zerada vira um traço: a linha segue na lista (a memória é
          completa), mas o olho não tropeça em fileiras de "R$ 0,00". O leitor
          de tela continua ouvindo o valor por extenso. */}
      <dd className="numeric">
        {zerada ? (
          <>
            <span aria-hidden="true">—</span>
            <span className="sr-only">{moeda.format(0)}</span>
          </>
        ) : (
          moeda.format(valor)
        )}
      </dd>
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

/** O que impede a conclusão vem antes do que apenas orienta. */
const ORDEM_ALERTA: Record<Alerta['nivel'], number> = { bloqueante: 0, atencao: 1, info: 2 };

export function ResultadoRescisao({ resultado, dados, geradoEm }: ResultadoRescisaoProps) {
  const { proventos, descontos, tributacao, fgts } = resultado;
  const alertas = [...resultado.alertas].sort((a, b) => ORDEM_ALERTA[a.nivel] - ORDEM_ALERTA[b.nivel]);

  // Parcelas condicionais entram só quando existem: a lista fica enxuta, mas o
  // total sempre fecha com o que está à vista.
  const memoria = (
    <div className="memoria-grade">
      <section className="memoria-coluna" aria-labelledby="memoria-proventos">
        <h4 id="memoria-proventos">Proventos</h4>
        <dl className="memoria-lista">
          <Linha nome="Saldo de salário" valor={proventos.saldoSalario} />
          <Linha nome="Aviso indenizado" valor={proventos.avisoPrevioPago} />
          <Linha nome="Férias vencidas" valor={proventos.feriasVencidas} />
          <Linha nome="Férias em dobro" valor={proventos.feriasEmDobro} />
          <Linha nome="Férias proporcionais" valor={proventos.feriasProporcionais} />
          <Linha nome="13º proporcional" valor={proventos.decimoTerceiroProporcional} />
          {proventos.abonoPecuniario > 0 && (
            <Linha nome="Abono pecuniário" valor={proventos.abonoPecuniario} />
          )}
          {proventos.incentivoPDV > 0 && <Linha nome="Incentivo do PDV" valor={proventos.incentivoPDV} />}
          {proventos.indenizacaoArt479 > 0 && (
            <Linha nome="Indenização art. 479" valor={proventos.indenizacaoArt479} />
          )}
          <Linha nome="Total de proventos" valor={proventos.totalProventos} total />
        </dl>
      </section>
      <section className="memoria-coluna" aria-labelledby="memoria-descontos">
        <h4 id="memoria-descontos">Descontos</h4>
        <dl className="memoria-lista">
          <Linha nome="INSS total" valor={tributacao.totalINSS} />
          <Linha nome="IRRF total" valor={tributacao.totalIRRF} />
          <Linha nome="Aviso descontado" valor={descontos.avisoPrevioDesconto} />
          <Linha nome="Faltas" valor={descontos.descontoFaltas} />
          <Linha nome="Adiantamento 13º" valor={descontos.adiantamentoDecimoTerceiro} />
          {descontos.descontoAbonoPecuniario > 0 && (
            <Linha nome="Abono já recebido" valor={descontos.descontoAbonoPecuniario} />
          )}
          {descontos.pensaoAlimenticia > 0 && (
            <Linha nome="Pensão alimentícia" valor={descontos.pensaoAlimenticia} />
          )}
          {descontos.indenizacaoArt480 > 0 && (
            <Linha nome="Indenização art. 480" valor={descontos.indenizacaoArt480} />
          )}
          <Linha nome="Outros descontos" valor={descontos.outrosDescontos} />
          <Linha nome="Total de descontos" valor={descontos.totalDescontos} total />
        </dl>
      </section>
    </div>
  );

  const tributos = (
    <>
      <div className="memoria-grade">
        <section className="memoria-coluna" aria-labelledby="tributos-mensal">
          <h4 id="tributos-mensal">Competência mensal</h4>
          <dl className="memoria-lista">
            <Linha nome="Base INSS" valor={tributacao.mensal.baseINSS} />
            <Linha nome="INSS" valor={tributacao.mensal.descontoINSS} />
            <Linha nome="Base IRRF" valor={tributacao.mensal.baseIRRF} />
            <Linha nome="Redução IRRF" valor={tributacao.mensal.reducaoIRRF} />
            <Linha nome="IRRF" valor={tributacao.mensal.descontoIRRF} />
          </dl>
        </section>
        <section className="memoria-coluna" aria-labelledby="tributos-13">
          <h4 id="tributos-13">13º — tributação exclusiva</h4>
          <dl className="memoria-lista">
            <Linha nome="Base INSS" valor={tributacao.decimoTerceiro.baseINSS} />
            <Linha nome="INSS" valor={tributacao.decimoTerceiro.descontoINSS} />
            <Linha nome="Base IRRF" valor={tributacao.decimoTerceiro.baseIRRF} />
            <Linha nome="IRRF" valor={tributacao.decimoTerceiro.descontoIRRF} />
          </dl>
        </section>
      </div>
      <p className="fonte">INSS: {tributacao.mensal.tabelaINSSAplicada.fonte}</p>
      <p className="fonte">IRRF: {tributacao.mensal.tabelaIRRFAplicada.fonte}</p>
    </>
  );

  const memoriaFGTS = (
    <>
      <dl className="memoria-lista memoria-lista--estreita">
        <Linha nome="Depósito do mês" valor={fgts.depositoFGTSMes} />
        <Linha nome="Saldo histórico projetado" valor={fgts.saldoFGTSEstimado} />
        <Linha nome={`Multa estimada (${Math.round(fgts.aliquotaMulta * 100)}%)`} valor={fgts.multaFGTSEstimada} />
      </dl>
      <p className="fonte">
        O saldo é projeção sobre a remuneração informada. A multa real depende do extrato da conta
        vinculada, ao qual o simulador não tem acesso.
      </p>
    </>
  );

  return (
    <section className="resultado" aria-labelledby="resultado-titulo" aria-live="polite">
      {/* Identificação do caso: só aparece no papel (ver resultado-rescisao.css). */}
      <header className="impressao-cabecalho">
        <div className="impressao-cabecalho__linha">
          <div>
            <p className="kicker">Estimativa · CLT</p>
            <p className="impressao-cabecalho__titulo">Simulação de rescisão</p>
          </div>
          {geradoEm && <p className="impressao-cabecalho__data">Gerado em {dataHora.format(geradoEm)}</p>}
        </div>
        {dados && (
          <dl className="impressao-dados">
            <div>
              <dt>Empregado</dt>
              <dd>{dados.dadosGerais.nomeEmpregado || 'Não informado'}</dd>
            </div>
            <div>
              <dt>Motivo</dt>
              <dd>{rotuloMotivo(dados.motivo)}</dd>
            </div>
            <div>
              <dt>Salário base</dt>
              <dd className="numeric">{moeda.format(dados.dadosGerais.salarioBase)}</dd>
            </div>
            <div>
              <dt>Admissão</dt>
              <dd className="numeric">{dataBR(dados.dadosGerais.dataAdmissao)}</dd>
            </div>
            <div>
              <dt>Desligamento</dt>
              <dd className="numeric">{dataBR(dados.dadosGerais.dataDesligamento)}</dd>
            </div>
            <div>
              <dt>Tempo de contrato · aviso</dt>
              <dd>
                {descreverTempo(resultado.tempoServico)} · {resultado.diasAvisoPrevio} dias
              </dd>
            </div>
          </dl>
        )}
      </header>

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
        <article className="total total--principal">
          <span>
            <Icone nome="carteira" tamanho={12} />
            Líquido estimado
          </span>
          <strong className="numeric">{moeda.format(resultado.liquidoEmpregado)}</strong>
          <small>Proventos menos descontos. Não inclui o saque do FGTS.</small>
        </article>
        <article className="total total--entrada">
          <span>
            <Icone nome="seta-cima" tamanho={12} />
            Proventos
          </span>
          <strong className="numeric">{moeda.format(proventos.totalProventos)}</strong>
        </article>
        <article className="total total--saida">
          <span>
            <Icone nome="seta-baixo" tamanho={12} />
            Descontos
          </span>
          <strong className="numeric">{moeda.format(descontos.totalDescontos)}</strong>
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

      {alertas.length > 0 && (
        <div className="alertas">
          {alertas.map((alerta, indice) => (
            <p key={`${alerta.nivel}-${indice}`} className={`alerta alerta--${alerta.nivel}`}>
              <Icone nome={alerta.nivel === 'info' ? 'info' : 'alerta'} tamanho={13} />
              <span>
                <strong>{ROTULO_ALERTA[alerta.nivel]}:</strong> {alerta.mensagem}
                {alerta.fonte && <span className="alerta__fonte">Fonte: {alerta.fonte}</span>}
              </span>
            </p>
          ))}
        </div>
      )}

      <footer className="impressao-rodape">
        <p>
          Documento gerado por simulador de apoio à decisão. Valores estimados, sujeitos a conferência.
        </p>
      </footer>
    </section>
  );
}
