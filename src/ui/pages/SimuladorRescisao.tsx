import { Badge } from '../components/Badge';
import { SurfaceCard } from '../components/SurfaceCard';
import logoExito from '../../assets/exito-logo.png';
import './simulador-rescisao.css';

const ETAPAS = [
  {
    indice: '01',
    titulo: 'Motor de cálculo',
    descricao:
      'Funções puras de INSS, IRRF, férias, aviso prévio, 13º e FGTS, testáveis sem DOM e com tabelas fiscais versionadas por vigência.',
    ref: 'src/domain/rescisao/ · spec 02 e 04',
    status: { tom: 'atencao' as const, texto: 'Em migração' },
  },
  {
    indice: '02',
    titulo: 'Formulário',
    descricao:
      'Captação dos ~50 campos com visibilidade condicional, validado por um único schema Zod compartilhado com o DTO de entrada do domínio.',
    ref: 'src/ui/forms/ · spec 01 (RF-01 a RF-13)',
    status: { tom: 'neutro' as const, texto: 'Pendente' },
  },
  {
    indice: '03',
    titulo: 'Memória de cálculo e PDF',
    descricao:
      'Resultado auditável indicando a tabela fiscal aplicada e sua fonte legal, com exportação em PDF gerada 100% no navegador.',
    ref: 'spec 01 (RF-17 a RF-20)',
    status: { tom: 'neutro' as const, texto: 'Pendente' },
  },
];

export function SimuladorRescisao() {
  return (
    <div className="pagina">
      <header className="cabecalho">
        <div className="container cabecalho__inner">
          <div className="marca">
            <img src={logoExito} alt="Êxito Contábil" width={320} height={214} />
          </div>
          <Badge>Uso interno</Badge>
        </div>
      </header>

      <main>
        <section className="container hero" aria-labelledby="hero-titulo">
          <div>
            <p className="kicker">Verbas rescisórias · CLT</p>
            <h1 className="hero__titulo" id="hero-titulo">
              Simulador de <em>Rescisão</em>
            </h1>
            <p className="hero__lead">
              Estimativa completa e auditável de verbas rescisórias, com memória de cálculo
              rastreável até a tabela fiscal e a fonte legal que geraram cada número.
            </p>
          </div>
          <div className="hero__avisos">
            <Badge tom="atencao">Estimativa, não é TRCT</Badge>
            <Badge tom="positivo">Dados não saem do navegador</Badge>
          </div>
        </section>

        <section className="container etapas" aria-labelledby="etapas-titulo">
          <div className="etapas__cabecalho">
            <h2 className="etapas__titulo" id="etapas-titulo">
              Migração para Vite + React + TypeScript
            </h2>
            <p className="etapas__nota">3 etapas</p>
          </div>

          <div className="etapas__grade">
            {ETAPAS.map((etapa) => (
              <SurfaceCard
                key={etapa.indice}
                destaque={etapa.status.tom === 'atencao'}
                rotulo={<Badge tom={etapa.status.tom}>{etapa.status.texto}</Badge>}
              >
                <span className="etapa__indice">{etapa.indice}</span>
                <h3 className="surface-card__titulo">{etapa.titulo}</h3>
                <p className="etapa__descricao">{etapa.descricao}</p>
                <p className="etapa__ref">{etapa.ref}</p>
              </SurfaceCard>
            ))}
          </div>
        </section>
      </main>

      <footer className="rodape">
        <div className="container rodape__inner">
          <p>
            Êxito Contábil · ferramenta de apoio à decisão. Não substitui homologação, TRCT oficial
            nem aconselhamento jurídico.
          </p>
          <p className="numeric">v0.1.0</p>
        </div>
      </footer>
    </div>
  );
}
