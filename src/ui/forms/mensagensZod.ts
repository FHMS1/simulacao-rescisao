import { z } from 'zod';

/**
 * Mensagens em português para os erros genéricos do Zod ("Required",
 * "Expected number, received nan"), que apareceriam em inglês nos campos.
 *
 * Fica na UI e não no schema porque é apresentação: o contrato do domínio não
 * muda. Mensagens definidas no próprio schema (ex.: "O salário deve ser maior
 * que zero") têm precedência sobre este mapa e continuam valendo.
 */
z.setErrorMap((erro, contexto) => {
  switch (erro.code) {
    case z.ZodIssueCode.invalid_type:
      return {
        message: erro.received === 'undefined' ? 'Campo obrigatório' : 'Informe um valor válido',
      };
    case z.ZodIssueCode.too_small:
      return { message: 'O valor está abaixo do permitido' };
    case z.ZodIssueCode.too_big:
      return { message: 'O valor está acima do permitido' };
    default:
      return { message: contexto.defaultError };
  }
});
