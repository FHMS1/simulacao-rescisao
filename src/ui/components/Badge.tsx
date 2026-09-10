import type { ReactNode } from 'react';
import './badge.css';
import { Icone, type NomeIcone } from './Icone';

export type BadgeTom = 'neutro' | 'positivo' | 'atencao' | 'bloqueante';

interface BadgeProps {
  tom?: BadgeTom;
  /** Quando ausente, a badge usa um ponto simples como marcador. */
  icone?: NomeIcone;
  children: ReactNode;
}

export function Badge({ tom = 'neutro', icone, children }: BadgeProps) {
  return (
    <span className={`badge badge--${tom}`}>
      {icone ? <Icone nome={icone} tamanho={12} /> : <span className="badge__ponto" aria-hidden="true" />}
      {children}
    </span>
  );
}
