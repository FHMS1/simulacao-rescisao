import type { ReactNode } from 'react';
import './surface-card.css';

interface SurfaceCardProps {
  rotulo?: ReactNode;
  destaque?: boolean;
  children: ReactNode;
}

export function SurfaceCard({ rotulo, destaque = false, children }: SurfaceCardProps) {
  return (
    <article className={`surface-card${destaque ? ' surface-card--destaque' : ''}`}>
      {rotulo && <div className="surface-card__rotulo">{rotulo}</div>}
      {children}
    </article>
  );
}
