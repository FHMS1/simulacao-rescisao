import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlternadorTema } from './AlternadorTema';

describe('AlternadorTema', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.tema;
  });

  it('aplica o tema no <html>, que é o que seleciona a paleta', async () => {
    const user = userEvent.setup();
    render(<AlternadorTema />);
    expect(document.documentElement.dataset.tema).toBe('escuro');

    await user.click(screen.getByRole('button', { name: /tema claro/i }));
    expect(document.documentElement.dataset.tema).toBe('claro');

    await user.click(screen.getByRole('button', { name: /tema escuro/i }));
    expect(document.documentElement.dataset.tema).toBe('escuro');
  });

  it('persiste a escolha para a próxima sessão', async () => {
    const user = userEvent.setup();
    render(<AlternadorTema />);
    await user.click(screen.getByRole('button', { name: /tema claro/i }));
    expect(localStorage.getItem('exito:tema')).toBe('claro');
  });

  it('adota o tema que o script inline já pintou, sem piscar', () => {
    document.documentElement.dataset.tema = 'claro';
    render(<AlternadorTema />);
    // Se ignorasse o atributo, montaria em escuro e trocaria a tela na hidratação.
    expect(screen.getByRole('button', { name: /tema escuro/i })).toBeInTheDocument();
    expect(document.documentElement.dataset.tema).toBe('claro');
  });
});
