import type { RescisaoOutput } from '../../domain/rescisao/tipos';

interface ResultadoRescisaoProps { resultado: RescisaoOutput }
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function Linha({ nome, valor }: { nome: string; valor: number }) {
  return <div className="linha-memoria"><dt>{nome}</dt><dd className="numeric">{moeda.format(valor)}</dd></div>;
}

export function ResultadoRescisao({ resultado }: ResultadoRescisaoProps) {
  return (
    <section className="resultado" aria-labelledby="resultado-titulo" aria-live="polite">
      <div className="resultado__cabecalho">
        <div><p className="kicker">Estimativa calculada</p><h2 id="resultado-titulo">Resumo da rescisão</h2></div>
        <button type="button" className="botao-secundario" onClick={() => window.print()}>Imprimir / salvar PDF</button>
      </div>
      <div className="totais">
        <article><span>Proventos</span><strong>{moeda.format(resultado.proventos.totalProventos)}</strong></article>
        <article><span>Descontos</span><strong>{moeda.format(resultado.descontos.totalDescontos)}</strong></article>
        <article className="total-principal"><span>Líquido estimado</span><strong>{moeda.format(resultado.liquidoEmpregado)}</strong></article>
        <article><span>Custo empresa</span><strong>{moeda.format(resultado.custoTotalEmpresa)}</strong></article>
      </div>
      <div className="memorias">
        <details open><summary>Proventos e descontos</summary><div className="memoria-grade"><dl><Linha nome="Saldo de salário" valor={resultado.proventos.saldoSalario} /><Linha nome="Aviso indenizado" valor={resultado.proventos.avisoPrevioPago} /><Linha nome="Férias vencidas" valor={resultado.proventos.feriasVencidas} /><Linha nome="Férias em dobro" valor={resultado.proventos.feriasEmDobro} /><Linha nome="Férias proporcionais" valor={resultado.proventos.feriasProporcionais} /><Linha nome="13º proporcional" valor={resultado.proventos.decimoTerceiroProporcional} /></dl><dl><Linha nome="INSS total" valor={resultado.tributacao.totalINSS} /><Linha nome="IRRF total" valor={resultado.tributacao.totalIRRF} /><Linha nome="Aviso descontado" valor={resultado.descontos.avisoPrevioDesconto} /><Linha nome="Faltas" valor={resultado.descontos.descontoFaltas} /><Linha nome="Adiantamento 13º" valor={resultado.descontos.adiantamentoDecimoTerceiro} /><Linha nome="Outros descontos" valor={resultado.descontos.outrosDescontos} /></dl></div></details>
        <details><summary>Tributação e fontes</summary><div className="memoria-grade"><dl><h3>Competência mensal</h3><Linha nome="Base INSS" valor={resultado.tributacao.mensal.baseINSS} /><Linha nome="INSS" valor={resultado.tributacao.mensal.descontoINSS} /><Linha nome="Base IRRF" valor={resultado.tributacao.mensal.baseIRRF} /><Linha nome="Redução IRRF" valor={resultado.tributacao.mensal.reducaoIRRF} /><Linha nome="IRRF" valor={resultado.tributacao.mensal.descontoIRRF} /></dl><dl><h3>13º — tributação exclusiva</h3><Linha nome="Base INSS" valor={resultado.tributacao.decimoTerceiro.baseINSS} /><Linha nome="INSS" valor={resultado.tributacao.decimoTerceiro.descontoINSS} /><Linha nome="Base IRRF" valor={resultado.tributacao.decimoTerceiro.baseIRRF} /><Linha nome="IRRF" valor={resultado.tributacao.decimoTerceiro.descontoIRRF} /></dl></div><p className="fonte">INSS: {resultado.tributacao.mensal.tabelaINSSAplicada.fonte}</p><p className="fonte">IRRF: {resultado.tributacao.mensal.tabelaIRRFAplicada.fonte}</p></details>
        <details><summary>FGTS estimado</summary><dl><Linha nome="Depósito do mês" valor={resultado.fgts.depositoFGTSMes} /><Linha nome="Saldo histórico projetado" valor={resultado.fgts.saldoFGTSEstimado} /><Linha nome={`Multa estimada (${resultado.fgts.aliquotaMulta * 100}%)`} valor={resultado.fgts.multaFGTSEstimada} /></dl><p className="fonte">A multa real depende do extrato da conta vinculada.</p></details>
      </div>
      <div className="alertas">{resultado.alertas.map((alerta, indice) => <p key={`${alerta.nivel}-${indice}`} className={`alerta alerta--${alerta.nivel}`}><strong>{alerta.nivel === 'bloqueante' ? 'Revisão necessária' : alerta.nivel === 'atencao' ? 'Atenção' : 'Nota'}:</strong> {alerta.mensagem}</p>)}</div>
    </section>
  );
}
