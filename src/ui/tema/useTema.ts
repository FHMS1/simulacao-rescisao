import { useCallback, useEffect, useState } from 'react';

export type Tema = 'claro' | 'escuro';

/**
 * Chave e atributo são espelhados pelo script inline de `index.html`, que
 * aplica o tema antes da primeira pintura. Mudou aqui, mude lá.
 */
const CHAVE_ARMAZENAMENTO = 'exito:tema';

function ehTema(valor: unknown): valor is Tema {
  return valor === 'claro' || valor === 'escuro';
}

function lerTemaSalvo(): Tema | undefined {
  try {
    const salvo = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    return ehTema(salvo) ? salvo : undefined;
  } catch {
    // Navegação privativa pode bloquear o acesso ao localStorage. Não é erro
    // recuperável nem reportável: o tema apenas deixa de persistir entre
    // sessões, e a preferência do sistema assume.
    return undefined;
  }
}

function temaDoSistema(): Tema {
  if (typeof window.matchMedia !== 'function') return 'escuro';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'escuro';
}

function temaInicial(): Tema {
  // O script inline já resolveu o tema e o gravou no <html>; reaproveitar esse
  // valor evita que o React monte com um tema diferente do que está pintado.
  const jaAplicado = document.documentElement.dataset.tema;
  if (ehTema(jaAplicado)) return jaAplicado;
  return lerTemaSalvo() ?? temaDoSistema();
}

/**
 * Estado do tema claro/escuro. A fonte da verdade visual é o atributo
 * `data-tema` no <html> — é ele que seleciona a paleta em `tokens.css`.
 */
export function useTema() {
  const [tema, definirTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    try {
      localStorage.setItem(CHAVE_ARMAZENAMENTO, tema);
    } catch {
      // Ver `lerTemaSalvo`: sem persistência, o tema vale só para esta sessão.
    }
  }, [tema]);

  const alternar = useCallback(() => {
    definirTema((atual) => (atual === 'escuro' ? 'claro' : 'escuro'));
  }, []);

  return { tema, alternar };
}
