# Spec 02 — Regras de Negócio Tributárias e Trabalhistas

Este documento é a fonte de verdade sobre **o que entra ou não na base de INSS e IRRF**, e sobre as demais regras trabalhistas que o motor de cálculo precisa respeitar. Qualquer implementação de `domain/rescisao/` deve ser conferida contra este documento, não contra memória ou "o que parece certo".

## 1. Histórico do bug (por que este documento existe)

A primeira versão do simulador (vanilla JS) incluía as férias (vencidas, proporcionais e em dobro) e o aviso prévio indenizado na base de cálculo do IRRF, e uma parte das férias na base do INSS. Isso está **incorreto** e superestimava sistematicamente o imposto retido em rescisões sem justa causa. A causa raiz foi a ausência de uma fonte única e citada de regras — a lógica foi escrita com base em "o que parecia razoável" em vez de checar a legislação/jurisprudência. Este documento existe para que isso não se repita.

## 2. Tabela de incidência por verba

| Verba | INSS | IRRF | FGTS (base 8%) | Fonte |
|---|---|---|---|---|
| Saldo de salário | Incide | Incide | Incide | Regra geral — natureza salarial |
| Aviso prévio **trabalhado** | Incide | Incide | Incide | Natureza salarial — é salário normal do período |
| Aviso prévio **indenizado** | **Não incide** | **Não incide** | Incide | INSS: posição majoritária STJ/TST (não é salário, é indenização). IRRF: Lei 7.713/88, art. 6º, V. FGTS: Súmula 305/TST — o aviso indenizado projeta o contrato para fins de FGTS e tempo de serviço |
| Férias **vencidas** (indenizadas na rescisão) + 1/3 | **Não incide** | **Não incide** | Incide | Decreto 3.048/99, art. 214, §9º (não integra salário de contribuição). IRRF: Súmula 386/STJ + IN RFB 1.500/2014, art. 62 |
| Férias **proporcionais** (indenizadas) + 1/3 | **Não incide** | **Não incide** | Incide | Mesmas fontes acima — mesma natureza indenizatória |
| Férias em **dobro** + 1/3 | **Não incide** | **Não incide** | Incide | Mesma natureza indenizatória; o dobro é penalidade ao empregador, não altera a natureza da verba |
| Férias **gozadas** durante o contrato (não é o caso rescisório, mas fica registrado para não confundir) | Incide | Incide (exceto o 1/3, cuja incidência de contribuição foi validada pelo STF no RE 1072485 para fins previdenciários — **conferir com Fabio antes de aplicar isso a caso de folha mensal, fora do escopo deste simulador**) | Incide | — |
| 13º salário (proporcional, na rescisão) | Incide | Incide, com **tributação exclusiva na fonte separada do salário do mês** (não soma à base do IRRF do saldo/aviso) | Incide | Regra geral — natureza salarial, mas tabela e base calculadas separadamente |
| Multa de 40%/20% do FGTS | Não incide | Não incide | N/A (é sobre o saldo do FGTS, não gera novo depósito) | Natureza indenizatória |
| Saque do FGTS (principal) | Não incide | Não incide | N/A | Lei 8.036/90 |
| Abono pecuniário de férias | Não incide | Não incide | A confirmar caso a caso | IN RFB 1.500/2014, art. 62 (mesma lógica das férias indenizadas) |
| Verbas variáveis integradas (horas extras, comissões, adicional noturno, insalubridade, periculosidade) usadas para compor a média de saldo/aviso/férias/13º | Segue a natureza da verba principal que estão compondo | Segue a natureza da verba principal que estão compondo | Segue a natureza da verba principal | Regra de integração — a média entra na base de cada verba conforme a incidência daquela verba (ex.: média integrada ao 13º sofre INSS/IRRF; média integrada às férias indenizadas, não) |

**Regra derivada importante**: como férias indenizadas (vencidas + proporcionais + dobro) **não entram em nenhuma base tributável**, a implementação de `calcularINSS`/`calcularIRRF` no `domain/` deve montar a base somando apenas: saldo de salário + aviso prévio trabalhado (se houver) + 13º proporcional + médias variáveis integradas a essas verbas. Nada de férias entra ali. Isso deve ser coberto por teste explícito (ver `spec/05`).

## 3. Aviso prévio proporcional

- Base: 30 dias corridos + 3 dias por ano completo de serviço, limitado a 90 dias — **Lei 12.506/2011**.
- No acordo do art. 484-A CLT, quando o aviso é indenizado, é pago pela metade (art. 484-A, §1º, I, CLT).
- O aviso trabalhado não é lançado como provento adicional da rescisão, pois sua remuneração é paga normalmente durante o período trabalhado.
- No aviso parcialmente cumprido, somente os dias restantes são indenizados pelo empregador ou descontados do empregado, conforme o motivo do desligamento.
- No pedido de demissão sem cumprimento do aviso, são descontados os dias não cumpridos.
- No acordo do art. 484-A, a redução pela metade incide somente sobre a parcela indenizada restante; a parcela efetivamente trabalhada mantém sua remuneração normal.

## 3.1. Contagem de avos

- Para o 13º salário, cada mês com pelo menos 15 dias de vínculo conta como um avo, conforme o art. 1º, §2º, da Lei 4.090/1962.
- Para férias proporcionais, a fração igual ou superior a 15 dias dentro do período aquisitivo conta como um avo.
- A contagem recebe uma data final de vínculo. Quando houver projeção do aviso prévio indenizado, o orquestrador deve fornecer a data projetada, evitando que a função de avos decida implicitamente se a projeção se aplica.

## 4. Multa do FGTS por motivo de rescisão

| Motivo | Multa FGTS | Saque FGTS | Seguro-desemprego |
|---|---|---|---|
| Dispensa sem justa causa | 40% | Integral | Tem direito (respeitados os requisitos) |
| Pedido de demissão | 0% | Não tem direito | Não tem direito |
| Dispensa por justa causa | 0% | Não tem direito | Não tem direito |
| Acordo (art. 484-A) | 20% | Parcial (80%) | Não tem direito |
| Término de contrato por prazo determinado | 0% | Integral, observada a sistemática de saque escolhida pelo trabalhador | Não tem direito |
| Rescisão antecipada pelo empregador (prazo determinado) | 40%, além da indenização do art. 479 CLT | Integral, observada a sistemática de saque escolhida pelo trabalhador | A confirmar conforme os requisitos legais |
| Rescisão antecipada pelo empregado (prazo determinado) | Indenização do art. 480 CLT ao empregador (situação inversa) | Não tem direito | Não tem direito |
| Rescisão indireta | 40% | Integral | Tem direito |
| Culpa recíproca / força maior | 20% | Integral, observada a sistemática de saque escolhida pelo trabalhador | A confirmar conforme entendimento aplicável |

**Fontes operacionais para contratos a termo**: a extinção normal permite movimentar a conta vinculada conforme o art. 20, IX, da Lei 8.036/1990. Na rescisão antecipada por iniciativa do empregador, o Manual do FGTS Digital, versão 1.40 de 27/02/2026, classifica o desligamento com multa rescisória de 40%. A existência de cláusula assecuratória do art. 481 da CLT pode alterar o tratamento do aviso prévio e deve ser confirmada no caso concreto.

**Nota de implementação**: a multa do FGTS exibida pelo simulador é uma **estimativa** baseada em depósitos mensais projetados (`salarioRef × 8% × meses trabalhados`), porque o sistema não tem acesso ao extrato real da conta vinculada (que pode ter saques anteriores, rendimentos, diferenças de época de depósito). Isso deve continuar explícito na interface (RF-15/RF-18) — nunca apresentar esse número como definitivo.

## 5. Multa por atraso no pagamento da rescisão

- **CLT, art. 477, §6º**: o pagamento das verbas rescisórias deve ocorrer até 10 dias corridos contados a partir do término do contrato.
- **CLT, art. 477, §8º**: o descumprimento do prazo gera multa equivalente a um salário do empregado, em favor deste.
- Esta regra ainda não está implementada no simulador (RF-22, planejado) — quando implementada, o cálculo precisa da data efetiva de pagamento como input, comparada à data de desligamento.

## 6. Estabilidades provisórias (alerta, não bloqueio automático)

Situações que impedem ou restringem a dispensa sem justa causa e que o simulador deve **sinalizar como alerta obrigatório** antes de prosseguir (RF-23, planejado), sem tentar decidir automaticamente se a estabilidade se aplica (isso exige avaliação humana):

- Gestante (estabilidade da confirmação da gravidez até 5 meses após o parto — art. 10, II, "b", ADCT).
- Membro da CIPA eleito (art. 165 CLT).
- Empregado acidentado (estabilidade de 12 meses após o retorno — art. 118, Lei 8.213/91).
- Outras previstas em convenção/acordo coletivo do cliente específico — **não genéricas o suficiente para hardcodar; tratar via campo de observação/CCT**.

## 7. Fontes legais citadas neste documento

- Lei 7.713/1988, art. 6º, V
- Decreto 3.048/1999 (Regulamento da Previdência Social), art. 214, §9º
- Instrução Normativa RFB nº 1.500/2014, art. 62
- Súmula 386/STJ
- Súmula 305/TST
- Lei 12.506/2011
- Lei 4.090/1962, art. 1º, §§1º e 2º
- CLT, arts. 477 (§§6º e 8º), 479, 480, 484-A
- Lei 8.036/1990 (FGTS), art. 18
- Manual de Orientação do eSocial para o Empregador Doméstico (critério operacional de 15 dias para férias proporcionais)
- ADCT, art. 10, II, "b"
- Lei 8.213/1991, art. 118

**Processo de manutenção**: se uma nova regra tributária ou trabalhista for adicionada ao sistema, ela entra nesta tabela com a fonte legal correspondente **antes** de virar código. Se a fonte não estiver clara ou for controversa (há entendimento divergente entre STJ/TST/doutrina), isso deve ser registrado explicitamente aqui como "controverso — confirmar com Fabio" em vez de escolher silenciosamente uma interpretação.
