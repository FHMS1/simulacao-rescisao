import { useRef, useState } from 'react';
import logoExito from '../../assets/exito-logo.png';
import { calcularRescisao } from '../../domain/rescisao/calcularRescisao';
import type { RescisaoInput } from '../../domain/rescisao/schema';
import type { RescisaoOutput } from '../../domain/rescisao/tipos';
import { Badge } from '../components/Badge';
import { FormularioRescisao } from '../components/FormularioRescisao';
import { ResultadoRescisao } from '../components/ResultadoRescisao';
import './simulador-rescisao.css';

export function SimuladorRescisao() {
  const [resultado, setResultado] = useState<RescisaoOutput>();
  const [erro, setErro] = useState<string>();
  const resultadoRef = useRef<HTMLDivElement>(null);

  function calcular(dados: RescisaoInput) {
    try {
      setResultado(calcularRescisao(dados));
      setErro(undefined);
      requestAnimationFrame(() => resultadoRef.current?.focus());
    } catch (causa) {
      setResultado(undefined);
      setErro(causa instanceof Error ? causa.message : 'Não foi possível concluir a simulação.');
    }
  }

  return (
    <div className="pagina">
      <header className="cabecalho"><div className="container cabecalho__inner"><img className="marca" src={logoExito} alt="Êxito Contábil" width={320} height={214} /><Badge>Uso interno</Badge></div></header>
      <main>
        <section className="container hero" aria-labelledby="hero-titulo">
          <div><p className="kicker">Verbas rescisórias · CLT</p><h1 className="hero__titulo" id="hero-titulo">Simulador de <em>Rescisão</em></h1><p className="hero__lead">Estimativa auditável, com separação das bases mensais e do 13º e indicação das tabelas fiscais aplicadas.</p></div>
          <div className="hero__avisos"><Badge tom="atencao">Estimativa, não é TRCT</Badge><Badge tom="positivo">Dados não saem do navegador</Badge><Badge tom="positivo">Tabelas 2025–2026 validadas</Badge></div>
        </section>
        <section className="container area-trabalho" aria-label="Simulação de rescisão">
          <FormularioRescisao onCalcular={calcular} />
          {erro && <p className="erro-global" role="alert">{erro}</p>}
          <div ref={resultadoRef} tabIndex={-1}>{resultado ? <ResultadoRescisao resultado={resultado} /> : <div className="resultado-vazio"><p className="kicker">Resultado</p><h2>Pronto para calcular</h2><p>Preencha os dados do contrato. O resumo e a memória auditável aparecerão aqui.</p></div>}</div>
        </section>
      </main>
      <footer className="rodape"><div className="container rodape__inner"><p>Êxito Contábil · ferramenta de apoio. Não substitui TRCT, eSocial ou análise jurídica.</p><p className="numeric">v1.0.0</p></div></footer>
    </div>
  );
}
