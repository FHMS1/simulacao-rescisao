import { useRef, useState } from 'react';
import { calcularRescisao } from '../../domain/rescisao/calcularRescisao';
import type { RescisaoInput } from '../../domain/rescisao/schema';
import type { RescisaoOutput } from '../../domain/rescisao/tipos';
import { Badge } from '../components/Badge';
import { FormularioRescisao } from '../components/FormularioRescisao';
import { Icone } from '../components/Icone';
import { ResultadoRescisao } from '../components/ResultadoRescisao';
import { AlternadorTema } from '../tema/AlternadorTema';
import './simulador-rescisao.css';

interface Simulacao {
  resultado: RescisaoOutput;
  dados: RescisaoInput;
  geradoEm: Date;
}

export function SimuladorRescisao() {
  const [simulacao, setSimulacao] = useState<Simulacao>();
  const [erro, setErro] = useState<string>();
  const resultadoRef = useRef<HTMLDivElement>(null);

  function calcular(dados: RescisaoInput) {
    try {
      setSimulacao({ resultado: calcularRescisao(dados), dados, geradoEm: new Date() });
      setErro(undefined);
      requestAnimationFrame(() => resultadoRef.current?.focus());
    } catch (causa) {
      setSimulacao(undefined);
      setErro(causa instanceof Error ? causa.message : 'Não foi possível concluir a simulação.');
    }
  }

  return (
    <div className="pagina">
      <a className="pular" href="#simulacao">
        Ir para o simulador
      </a>
      <header className="cabecalho">
        <div className="container cabecalho__inner">
          <span className="marca" aria-hidden="true">
            <Icone nome="calculadora" tamanho={18} />
          </span>
          <span className="cabecalho__divisor" aria-hidden="true" />
          <nav className="trilha" aria-label="Trilha de navegação">
            <span>Departamento pessoal</span>
            <span aria-hidden="true">/</span>
            <span className="trilha__atual">Simulador de rescisão</span>
          </nav>
          <span className="cabecalho__espaco" />
          <Badge>Uso interno</Badge>
          <AlternadorTema />
        </div>
      </header>

      <main>
        <section className="container hero" aria-labelledby="hero-titulo">
          <p className="kicker">Verbas rescisórias · CLT</p>
          <h1 className="hero__titulo" id="hero-titulo">
            Simulador de <em>rescisão</em>
          </h1>
          <p className="hero__lead">
            Estimativa auditável, com separação das bases mensais e do 13º e indicação das tabelas
            fiscais aplicadas.
          </p>
          <div className="hero__avisos">
            <Badge tom="atencao" icone="alerta">
              Estimativa, não é TRCT
            </Badge>
            <Badge tom="positivo" icone="escudo">
              Dados não saem do navegador
            </Badge>
            <Badge tom="positivo" icone="selo">
              Tabelas 2025–2026 validadas
            </Badge>
          </div>
        </section>

        <section className="container area-trabalho" id="simulacao" aria-label="Simulação de rescisão">
          <FormularioRescisao onCalcular={calcular} />

          <div className="area-trabalho__saida">
            {erro && (
              <p className="erro-global" role="alert">
                <Icone nome="alerta" tamanho={13} />
                <span>{erro}</span>
              </p>
            )}
            <div className="area-trabalho__foco" ref={resultadoRef} tabIndex={-1}>
              {simulacao ? (
                <ResultadoRescisao
                  resultado={simulacao.resultado}
                  dados={simulacao.dados}
                  geradoEm={simulacao.geradoEm}
                />
              ) : (
                <div className="resultado-vazio">
                  <span className="resultado-vazio__icone" aria-hidden="true">
                    <Icone nome="documento" tamanho={20} />
                  </span>
                  <h2>Pronto para calcular</h2>
                  <p>
                    Preencha salário, datas e motivo. O resumo, a memória auditável e as tabelas
                    aplicadas aparecem aqui.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="rodape">
        <div className="container rodape__inner">
          <p>Ferramenta de apoio. Não substitui TRCT, eSocial ou análise jurídica.</p>
          <p className="numeric">v1.1.0</p>
        </div>
      </footer>
    </div>
  );
}
