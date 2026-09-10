import { Icone } from '../components/Icone';
import './alternador-tema.css';
import { useTema } from './useTema';

export function AlternadorTema() {
  const { tema, alternar } = useTema();
  const rotulo = tema === 'escuro' ? 'Ativar tema claro' : 'Ativar tema escuro';

  return (
    <button type="button" className="alternador-tema" onClick={alternar} aria-label={rotulo} title={rotulo}>
      <Icone nome={tema === 'escuro' ? 'sol' : 'lua'} tamanho={15} />
    </button>
  );
}
