import type { ReactNode } from 'react';
import './badge.css';

export type BadgeTom = 'neutro' | 'positivo' | 'atencao' | 'bloqueante';

interface BadgeProps {
  tom?: BadgeTom;
  children: ReactNode;
}

export function Badge({ tom = 'neutro', children }: BadgeProps) {
  return (
    <span className={`badge badge--${tom}`}>
      <span className="badge__dot" aria-hidden="true" />
      {children}
    </span>
  );
}
