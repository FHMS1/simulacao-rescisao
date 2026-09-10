import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Abas } from './Abas';

const ABAS = [
  { id: 'memoria', rotulo: 'Memória', conteudo: <p>linhas da memória</p> },
  { id: 'tributos', rotulo: 'Tributos', conteudo: <p>bases de INSS</p> },
  { id: 'fgts', rotulo: 'FGTS', conteudo: <p>multa estimada</p> },
];

function montar() {
  return render(<Abas abas={ABAS} rotuloLista="Memória de cálculo" />);
}

describe('Abas', () => {
  it('abre na primeira aba e esconde as demais', () => {
    montar();
    expect(screen.getByRole('tab', { name: 'Memória' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('linhas da memória')).toBeVisible();
    expect(screen.getByText('bases de INSS')).not.toBeVisible();
  });

  it('troca de painel ao clicar numa aba', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('tab', { name: 'FGTS' }));

    expect(screen.getByRole('tab', { name: 'FGTS' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('multa estimada')).toBeVisible();
    expect(screen.getByText('linhas da memória')).not.toBeVisible();
  });

  it('navega pelas setas do teclado e circula nas pontas', async () => {
    const user = userEvent.setup();
    montar();
    await user.tab();
    expect(screen.getByRole('tab', { name: 'Memória' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Tributos' })).toHaveFocus();
    expect(screen.getByText('bases de INSS')).toBeVisible();

    // Da primeira para trás deve chegar na última, não travar.
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'FGTS' })).toHaveFocus();
  });

  it('mantém todos os painéis no DOM para a impressão sair completa', () => {
    // RF-20: o PDF precisa das três memórias, não só da aba aberta. Se algum
    // dia os painéis inativos forem desmontados, este teste quebra primeiro.
    montar();
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(3);
    expect(screen.getByText('bases de INSS')).toBeInTheDocument();
    expect(screen.getByText('multa estimada')).toBeInTheDocument();
  });
});
