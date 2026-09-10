import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimuladorRescisao } from './SimuladorRescisao';

describe('SimuladorRescisao', () => {
  it('exibe campo condicional para aviso parcial', async () => {
    const user = userEvent.setup();
    render(<SimuladorRescisao />);
    expect(screen.queryByLabelText(/dias cumpridos/i)).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/tipo de aviso/i), 'parcial');
    expect(screen.getByLabelText(/dias cumpridos/i)).toBeInTheDocument();
  });

  it('calcula e apresenta resultado auditável pela interação do usuário', async () => {
    const user = userEvent.setup();
    render(<SimuladorRescisao />);
    await user.type(screen.getByLabelText(/admissão/i), '2023-01-01');
    await user.clear(screen.getByLabelText(/desligamento/i));
    await user.type(screen.getByLabelText(/desligamento/i), '2026-09-10');
    await user.clear(screen.getByLabelText(/salário base/i));
    await user.type(screen.getByLabelText(/salário base/i), '4500');
    await user.click(screen.getByRole('button', { name: /calcular rescisão/i }));

    expect(await screen.findByRole('heading', { name: /resumo da rescisão/i })).toBeInTheDocument();
    expect(screen.getByText(/portaria interministerial mps\/mf nº 13/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar pdf/i })).toBeInTheDocument();
  });

  it('informa por que salário zero não gera cálculo', async () => {
    const user = userEvent.setup();
    render(<SimuladorRescisao />);
    await user.type(screen.getByLabelText(/admissão/i), '2023-01-01');
    await user.click(screen.getByRole('button', { name: /calcular rescisão/i }));
    expect(await screen.findByText(/revise salário e datas do contrato/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /resumo da rescisão/i })).not.toBeInTheDocument();
  });
});
