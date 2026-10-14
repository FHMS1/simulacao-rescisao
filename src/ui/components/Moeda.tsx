import { forwardRef, type InputHTMLAttributes } from 'react';

/**
 * Campo de valor em reais: prefixo "R$" fixo e placeholder "0,00".
 *
 * Continua um `<input type="number">` — o teclado numérico do celular e a
 * validação nativa seguem funcionando, e o valor chega ao formulário já como
 * número. O prefixo é só apresentação (pseudo-elemento em formulario-rescisao.css),
 * então não entra no valor digitado nem na leitura por leitor de tela, que
 * recebe o rótulo do campo.
 *
 * `forwardRef` é necessário porque o `register` do React Hook Form entrega um
 * `ref` que precisa chegar ao `<input>`.
 */
export const Moeda = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Moeda(props, ref) {
    return (
      <span className="moeda">
        <input
          ref={ref}
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="0,00"
          {...props}
        />
      </span>
    );
  },
);
