# Spec 05 — Critérios de Aceite e Casos de Teste

Estes cenários são a base mínima de teste antes de considerar qualquer implementação do motor de cálculo pronta. Valores devem ser conferidos manualmente (calculadora/planilha) por Fabio antes de virarem asserção fixa em teste — os números abaixo são estruturas de cenário, não gabarito fechado, e devem ser preenchidos/validados durante a implementação.

## 1. Casos por motivo de rescisão (obrigatórios)

Para cada `MotivoRescisao`, deve existir pelo menos um teste de `calcularRescisao` cobrindo:

- **Dispensa sem justa causa**: empregado com salário de R$ 4.500, 3 anos completos de casa, sem médias variáveis, sem dependentes.
  - Deve gerar: aviso prévio de 30 + (3×3) = 39 dias; multa FGTS 40%; direito a seguro-desemprego; férias proporcionais e 13º proporcional **fora** da base de INSS/IRRF (só o saldo de salário e o 13º entram nessas bases — ver `spec/02`).
- **Pedido de demissão, sem cumprir aviso prévio**: verificar que o desconto de aviso não cumprido é aplicado corretamente e que não há multa de FGTS nem direito a seguro-desemprego.
- **Justa causa**: sem aviso prévio, sem multa FGTS, sem saque de FGTS, sem 13º proporcional (regra a confirmar com Fabio — há entendimento de que 13º proporcional não é devido em justa causa; registrar fonte antes de implementar).
- **Acordo art. 484-A**: aviso pela metade quando indenizado, multa FGTS 20%, saque de 80% do FGTS, sem seguro-desemprego.
- **Rescisão indireta**: mesmo tratamento de verbas que dispensa sem justa causa (multa 40%, saque integral, direito a seguro-desemprego).

## 2. Casos de borda de data (regressão do bug de aproximação de 30 dias)

- Admissão em `2023-01-15`, desligamento em `2026-02-28` (ano não bissexto) — o cálculo de tempo de serviço deve usar a diferença real de calendário, não a aproximação `dias += 30` da versão anterior, que gerava erro em meses curtos.
- Mesmo teste repetido com desligamento em `2028-02-29` (ano bissexto), para garantir que fevereiro bissexto não quebra o cálculo.
- Admissão e desligamento no mesmo mês (contrato curtíssimo, menos de 30 dias) — verificar que férias e 13º proporcionais não geram avos negativos nem `NaN`.

## 3. Casos de base tributária (regressão do bug de INSS/IRRF)

Estes são os testes mais importantes do projeto — cobrem exatamente o erro histórico corrigido:

- Dado um cenário com saldo de salário, férias vencidas + proporcionais + 1/3, e aviso prévio indenizado, **a base de IRRF não pode incluir nenhum valor de férias nem o aviso prévio indenizado**. Only saldo de salário, 13º proporcional e aviso prévio *trabalhado* (quando houver) entram.
- Mesmo cenário para `baseINSS`: férias não podem compor a base.
- Teste explícito comparando `baseIRRF` calculada com uma soma manual que só inclui as verbas tributáveis listadas em `spec/02`, para servir de teste de regressão caso alguém reintroduza o bug no futuro.

## 4. Casos de tabela fiscal versionada

- `obterTabelaINSS(new Date('2025-06-01'))` deve retornar a tabela de 2025, não a de 2026.
- `obterTabelaINSS(new Date('2027-01-01'))`, sem tabela de 2027 cadastrada, deve lançar `TabelaNaoEncontradaError`, não retornar a tabela de 2026 por padrão silenciosamente.
- Adicionar uma tabela nova não pode alterar o resultado de nenhum teste que usa datas de competências anteriores (teste de não-regressão ao adicionar tabela).

## 5. Casos de verbas variáveis

- Médias integradas corretamente às bases de saldo/13º (tributáveis) e **não** às bases de férias indenizadas (isentas), conforme a tabela de incidência de `spec/02`.
- Modo "cálculo pela média dos meses" (3/6/12) — ainda não implementado na versão vanilla; ao implementar, precisa de fixture de teste com valores mensais de entrada e média esperada.

## 6. Casos de UI (Testing Library, não substituem os testes de domain)

- Selecionar "sim" em "tem pensão alimentícia" exibe os campos de tipo e valor; selecionar "não" os oculta e zera o valor considerado no cálculo.
- Alterar data de admissão/desligamento atualiza o badge de tempo de serviço e os dias de aviso prévio sugeridos, sem exigir clique em "calcular".
- Envio do formulário com salário zerado não deve gerar cálculo (mantém o placeholder de resultado), e deve indicar ao usuário por que não calculou — a versão anterior falhava silenciosamente (`if (salario === 0) return;` sem feedback).

## 7. Definição de pronto (Definition of Done) para qualquer alteração no motor de cálculo

Uma alteração em `domain/rescisao/` só é considerada concluída quando:

1. Tem teste unitário cobrindo o caso principal e pelo menos um caso de borda.
2. A tabela de incidência em `spec/02` foi consultada e, se a mudança envolve uma verba nova, a tabela foi atualizada com a fonte legal correspondente.
3. Todos os testes existentes continuam passando (não apenas o novo).
4. Se o comportamento observável mudou, a spec correspondente (`01`, `02` ou `04`) foi atualizada no mesmo commit/PR.
