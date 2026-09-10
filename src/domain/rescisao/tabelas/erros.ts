// Ver spec/03-arquitetura-tecnica.md, seção 3: falha explícita, nunca
// reaproveitar silenciosamente a tabela mais antiga.
export class TabelaNaoEncontradaError extends Error {
  constructor(
    public readonly tabela: 'INSS' | 'IRRF',
    public readonly dataReferencia: Date,
  ) {
    super(
      `Nenhuma tabela de ${tabela} cadastrada para a competência ${dataReferencia.toISOString().slice(0, 10)}. ` +
        'Cadastre a tabela vigente em domain/rescisao/tabelas/ antes de calcular esta rescisão.',
    );
    this.name = 'TabelaNaoEncontradaError';
  }
}
