import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import './abas.css';

export interface Aba {
  id: string;
  rotulo: string;
  conteudo: ReactNode;
}

interface AbasProps {
  abas: Aba[];
  /** Rótulo acessível do conjunto — descreve o que as abas dividem. */
  rotuloLista: string;
}

/**
 * Abas no padrão ARIA (tablist/tab/tabpanel), com seleção automática ao
 * navegar por setas.
 *
 * Todos os painéis ficam no DOM o tempo todo, e os inativos são escondidos
 * pelo atributo `hidden`. Isso é deliberado: a impressão (RF-20) precisa sair
 * com a memória de cálculo inteira, não só com a aba aberta na tela — e
 * `abas.css` reverte o `hidden` dentro de `@media print`. Desmontar o painel
 * inativo economizaria pouco e quebraria o PDF, que é o entregável levado ao
 * cliente.
 */
export function Abas({ abas, rotuloLista }: AbasProps) {
  const prefixo = useId();
  const [ativa, definirAtiva] = useState(() => abas[0]?.id);
  const botoes = useRef(new Map<string, HTMLButtonElement>());

  const idAba = (id: string) => `${prefixo}-aba-${id}`;
  const idPainel = (id: string) => `${prefixo}-painel-${id}`;

  function aoTeclar(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const destinos: Record<string, number> = {
      ArrowRight: indice + 1,
      ArrowLeft: indice - 1,
      Home: 0,
      End: abas.length - 1,
    };
    const destino = destinos[evento.key];
    if (destino === undefined) return;

    evento.preventDefault();
    // `noUncheckedIndexedAccess` está ligado: o índice é sempre válido pelo
    // módulo, mas o compilador não sabe disso.
    const proxima = abas[(destino + abas.length) % abas.length];
    if (!proxima) return;

    definirAtiva(proxima.id);
    botoes.current.get(proxima.id)?.focus();
  }

  return (
    <div className="abas">
      <div className="abas__lista" role="tablist" aria-label={rotuloLista}>
        {abas.map((aba, indice) => {
          const selecionada = aba.id === ativa;
          return (
            <button
              key={aba.id}
              ref={(elemento) => {
                if (elemento) botoes.current.set(aba.id, elemento);
                else botoes.current.delete(aba.id);
              }}
              type="button"
              role="tab"
              id={idAba(aba.id)}
              className="abas__gatilho"
              aria-selected={selecionada}
              aria-controls={idPainel(aba.id)}
              /* Roving tabindex: o Tab entra e sai do conjunto de uma vez;
                 dentro dele, a navegação é por setas. */
              tabIndex={selecionada ? 0 : -1}
              onClick={() => definirAtiva(aba.id)}
              onKeyDown={(evento) => aoTeclar(evento, indice)}
            >
              {aba.rotulo}
            </button>
          );
        })}
      </div>

      {abas.map((aba) => (
        <div
          key={aba.id}
          role="tabpanel"
          id={idPainel(aba.id)}
          className="abas__painel"
          aria-labelledby={idAba(aba.id)}
          hidden={aba.id !== ativa}
          tabIndex={0}
        >
          {/* Na tela o título da seção é a própria aba; no papel, as abas
              somem e cada painel precisa se identificar. */}
          <h3 className="abas__titulo-impresso">{aba.rotulo}</h3>
          {aba.conteudo}
        </div>
      ))}
    </div>
  );
}
