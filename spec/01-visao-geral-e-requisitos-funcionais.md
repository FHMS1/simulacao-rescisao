# Spec 01 — Visão Geral e Requisitos Funcionais

## 1. Objetivo do produto

Fornecer ao escritório Êxito Contábil (e, por extensão, aos clientes do escritório) uma estimativa completa e auditável de verbas rescisórias de um contrato CLT, cobrindo:

- proventos (saldo de salário, aviso prévio, férias, 13º, verbas variáveis);
- descontos (INSS, IRRF, faltas, adiantamentos, pensão alimentícia, outros);
- FGTS rescisório e multa aplicável;
- memória de cálculo detalhada e auditável;
- alertas sobre riscos e pontos de atenção jurídica.

**Não-objetivo**: o simulador não gera o TRCT oficial, não substitui homologação quando exigida por convenção coletiva, não integra com eSocial, e não constitui aconselhamento jurídico definitivo. Isso deve permanecer explícito na interface (ver RF-18).

## 2. Público-alvo

- Uso primário: colaboradores do escritório Êxito Contábil, para simular cenários antes de fechar uma rescisão com o cliente.
- Uso secundário possível (não confirmado como requisito ainda): compartilhamento do PDF gerado com o cliente final como material de apoio à decisão.

## 3. Requisitos funcionais

Numeração estável — ao alterar um requisito, não reutilize o número de um requisito removido; marque como `[REMOVIDO]` e explique o motivo.

### Bloco A — Dados gerais
- **RF-01**: O sistema deve capturar nome do empregado (opcional), datas de admissão e desligamento, salário base, tipo de contrato (indeterminado/determinado), tipo de salário (mensalista/horista/comissionista/misto), número de dependentes para IRRF, e informação de pensão alimentícia (percentual ou valor fixo).
- **RF-02**: O sistema deve calcular automaticamente o tempo de serviço (anos, meses, dias) a partir das datas de admissão e desligamento, usando diferença de calendário real — **não** aproximação de 30 dias por mês (ver `spec/05`, caso de teste de borda em fevereiro).

### Bloco B — Motivo do desligamento
- **RF-03**: O sistema deve suportar, no mínimo, os seguintes motivos de rescisão, cada um com seu próprio conjunto de verbas/multas aplicáveis (detalhado em `spec/02`):
  dispensa sem justa causa; pedido de demissão; dispensa por justa causa; rescisão por acordo (art. 484-A CLT); término de contrato por prazo determinado; rescisão antecipada pelo empregador (prazo determinado); rescisão antecipada pelo empregado (prazo determinado); rescisão indireta; culpa recíproca/força maior.

### Bloco C — Aviso prévio
- **RF-04**: Calcular dias de aviso prévio proporcional conforme Lei 12.506/2011 (30 dias + 3 dias por ano completo de serviço, limitado a 90 dias).
- **RF-05**: Suportar aviso prévio indenizado, trabalhado, parcialmente cumprido, e ausência de aviso (conforme aplicável ao motivo).
- **RF-06**: No acordo do art. 484-A, o aviso prévio (quando indenizado) é pago pela metade.

### Bloco D — Saldo de salário
- **RF-07**: Calcular saldo de salário pelos dias efetivamente trabalhados no mês da rescisão, descontando faltas injustificadas e, quando aplicável, o DSR proporcional às faltas.

### Bloco E — Férias
- **RF-08**: Calcular férias vencidas (com opção de período em dobro) e férias proporcionais, ambas com o terço constitucional.
- **RF-09**: Suportar abono pecuniário (a pagar ou já recebido/a descontar).
- **RF-10**: Calcular avos de férias proporcionais automaticamente a partir das datas, considerando como avo a fração igual ou superior a 15 dias no período aquisitivo, com opção de sobrescrever manualmente. Quando houver projeção do aviso indenizado, a data final projetada deve ser usada na contagem.

### Bloco F — 13º salário
- **RF-11**: Calcular 13º proporcional pelos avos do ano corrente, considerando como mês integral a fração igual ou superior a 15 dias de trabalho, com opção de sobrescrever manualmente, e descontar adiantamento já recebido. Quando houver projeção do aviso indenizado, a data final projetada deve ser usada na contagem.

### Bloco G — Verbas variáveis
- **RF-12**: Permitir integrar médias de horas extras, adicional noturno, comissões, DSR sobre variáveis, insalubridade, periculosidade e outras verbas. No modo direto, os campos recebem as médias mensais já apuradas; no modo 3/6/12 meses, recebem os totais acumulados no período e o motor divide a soma pela quantidade selecionada.

### Bloco H — Descontos adicionais
- **RF-13**: Suportar descontos de adiantamento salarial, vale-transporte, vale-alimentação, convênios, empréstimos/consignado e outros descontos com descrição livre.

### Tributação e FGTS
- **RF-14**: Calcular INSS e IRRF aplicando corretamente as isenções por natureza indenizatória das verbas — ver tabela de incidência completa em `spec/02-regras-de-negocio-tributarias.md`. Este requisito é o que corrige o bug histórico do projeto (verbas indenizatórias sendo tributadas indevidamente).
- **RF-15**: Calcular FGTS do mês rescisório e estimar a multa (40%/20%/0%) conforme o motivo, deixando explícito na interface que a multa real depende do saldo total acumulado em conta, que o sistema não tem acesso (é uma estimativa, não o extrato real).
- **RF-16**: Selecionar automaticamente a tabela de INSS/IRRF vigente com base na data de referência do cálculo (competência), suportando tabelas de anos anteriores — ver `spec/03`.

### Saída e transparência
- **RF-17**: Exibir resumo com valor bruto, total de descontos, líquido a receber e custo total para a empresa.
- **RF-18**: Exibir memória de cálculo detalhada, indicando explicitamente qual tabela fiscal (com vigência) foi usada, e reforçar visualmente que o resultado é uma estimativa, não documento com validade jurídica formal.
- **RF-19**: Exibir alertas relevantes (ex.: tabela fiscal desatualizada, situação de possível estabilidade provisória, atraso no pagamento sujeito a multa do art. 477 §8º CLT).
- **RF-20**: Exportar resultado em PDF e permitir impressão direta.

### Requisitos funcionais planejados (ainda não implementados — ver backlog)
- **RF-21 (planejado)**: Estimar valor e número de parcelas do seguro-desemprego, quando aplicável ao motivo da rescisão.
- **RF-22 (planejado)**: Alertar sobre multa do art. 477, §8º, CLT quando a data de pagamento informada for posterior a 10 dias corridos do desligamento.
- **RF-23 (planejado)**: Sinalizar alerta de possível estabilidade provisória (gestante, CIPA, acidente de trabalho) antes de permitir simular dispensa sem justa causa, exigindo confirmação explícita do usuário para prosseguir.

## 4. Requisitos não funcionais

- **RNF-01 (testabilidade)**: Toda regra de cálculo em `domain/` deve ser testável sem DOM, sem mocks de `window`, sem servidor.
- **RNF-02 (privacidade)**: Dados digitados não podem trafegar para fora do navegador sem decisão explícita documentada.
- **RNF-03 (auditabilidade)**: Todo resultado deve ser rastreável até a tabela fiscal e a regra que o gerou (ver RF-18).
- **RNF-04 (manutenção anual)**: Adicionar uma nova tabela fiscal anual não pode exigir alterar código de cálculo, apenas adicionar dado em `domain/rescisao/tabelas/`.
- **RNF-05 (acessibilidade)**: Formulário deve ser operável por teclado e ter labels associados a todos os campos (a versão vanilla já usa `aria-label` em alguns pontos — manter e estender na migração).

## 5. Fora de escopo (explícito)

- Geração de TRCT com validade jurídica formal / assinatura eletrônica.
- Integração com eSocial ou sistemas de folha de pagamento de terceiros.
- Cálculo de rescisão para categorias com regras muito distintas (empregado doméstico, rural, aprendiz, estagiário) — a menos que uma spec própria seja criada para isso.
- Multiusuário, autenticação, ou qualquer backend nesta fase.
