import type { ReactNode } from 'react';

/**
 * Conjunto de ícones desenhado no próprio projeto, em traço de 24×24.
 *
 * Por que não uma biblioteca: o `AGENTS.md` (seção 6) proíbe dependência
 * externa via `<script src>` sem SRI e sem justificar por que o que já está
 * no `package.json` não resolve. São ~12 ícones decorativos — um pacote CDN
 * inteiro (ou uma dependência nova) custaria mais do que estes paths.
 *
 * Todos são decorativos: acompanham um rótulo de texto e ficam
 * `aria-hidden`. Se algum dia um ícone for a única informação de um
 * controle, o rótulo acessível vai no elemento pai, não aqui.
 */
export type NomeIcone =
  | 'sol'
  | 'lua'
  | 'calculadora'
  | 'impressora'
  | 'documento'
  | 'escudo'
  | 'selo'
  | 'alerta'
  | 'info'
  | 'cadeado'
  | 'carteira'
  | 'predio'
  | 'seta-cima'
  | 'seta-baixo'
  | 'recomecar';

const DESENHOS: Record<NomeIcone, ReactNode> = {
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  lua: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  calculadora: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v4M8 19h4" />
    </>
  ),
  impressora: (
    <>
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
    </>
  ),
  documento: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  selo: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.2l2.4 2.4 4.6-4.9" />
    </>
  ),
  alerta: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  cadeado: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  carteira: (
    <>
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5" />
      <path d="M17 13h.01" />
    </>
  ),
  predio: (
    <>
      <path d="M4 22V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v18" />
      <path d="M15 9h3a2 2 0 0 1 2 2v11M2 22h20M8 6h.01M11 6h.01M8 10h.01M11 10h.01M8 14h.01M11 14h.01" />
    </>
  ),
  'seta-cima': (
    <>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </>
  ),
  'seta-baixo': (
    <>
      <path d="M7 7l10 10" />
      <path d="M17 8v9H8" />
    </>
  ),
  recomecar: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
};

interface IconeProps {
  nome: NomeIcone;
  /** Aresta do ícone em px. O traço acompanha, para não engrossar em tamanhos pequenos. */
  tamanho?: number;
}

export function Icone({ nome, tamanho = 15 }: IconeProps) {
  return (
    <svg
      className="icone"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={tamanho <= 13 ? 2.2 : 1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {DESENHOS[nome]}
    </svg>
  );
}
