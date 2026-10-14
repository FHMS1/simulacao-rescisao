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

## 3.2. Indenização por rescisão antecipada de contrato a termo (arts. 479 e 480)

- **Art. 479 (empregador rompe antes do termo)**: indenização igual à **metade da remuneração** a que o empregado teria direito até o término do contrato. Entra como provento (`proventos.indenizacaoArt479`).
- **Art. 480 (empregado rompe antes do termo)**: indenização ao empregador pelos prejuízos comprovados, **limitada ao valor do art. 479**. O simulador não conhece o prejuízo real: lança o **teto** como desconto (`descontos.indenizacaoArt480`) e emite alerta. O desconto na rescisão também respeita o limite de **um mês de remuneração** (CLT, art. 477, §5º).
- **Cálculo**: `salarioReferencia ÷ 30 × dias corridos entre o desligamento e o término previsto ÷ 2`, com a remuneração de referência igual à usada nas demais verbas (salário base + médias integradas). A contagem em dias reutiliza a convenção de 30 dias do aviso prévio.
- **Cláusula assecuratória (art. 481)**: quando existe e o direito de rescindir antecipadamente é exercido, aplicam-se as regras do contrato por prazo indeterminado (Súmula 163 TST). O simulador **não** calcula a indenização dos arts. 479/480 e trata o desligamento como dispensa sem justa causa (se o empregador rompeu) ou pedido de demissão (se o empregado rompeu), com aviso prévio e multa do FGTS correspondentes.
- **Sem cláusula assecuratória**: não há aviso prévio (`diasAvisoPrevio = 0`).
- **Incidência**: tratada como indenização — fora das bases de INSS (Decreto 3.048/1999, art. 214, §9º), de IRRF (Lei 7.713/1988, art. 6º, V) e de FGTS. **Controverso — confirmar com Fabio**: a premissa está implementada e sinalizada em alerta no resultado; deve ser validada antes de uso com clientes. A multa de 40% do FGTS sobre o saldo, quando devida, continua conforme a seção 4.

## 3.3. DSR sobre verbas variáveis

- **Base**: horas extras + comissões + adicional noturno. Insalubridade e periculosidade ficam fora, pois são parcelas fixas que já remuneram o descanso (Lei 605/1949, art. 7º; Súmulas 172 e 27 do TST).
- **Fórmula**: `base ÷ dias úteis × domingos e feriados do mês`, arredondado a centavos.
- Quando o cálculo automático é solicitado, o resultado **substitui** o DSR digitado e integra a média de referência (spec 02, tabela de incidência — mesma natureza das verbas que reflete).
- No modo "totais acumulados de N meses", a proporção de dias do mês informado é aplicada ao total acumulado — aproximação sinalizada em alerta. Para exatidão, calcule o DSR mês a mês e informe o valor.

## 3.4. PDV

- O incentivo é lançado como provento indenizatório, fora das bases de INSS, IRRF e FGTS (Súmula 215 STJ; Decreto 3.048/1999, art. 214, §9º). **Controverso — confirmar com Fabio**: depende da natureza do plano; o simulador alerta.
- Aviso e multa do FGTS seguem o regulamento do plano e são informados pelo usuário.

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
| Culpa recíproca (CLT, art. 484; Súmula 14 TST) | 20% | Integral | A confirmar conforme entendimento aplicável |
| Força maior (CLT, art. 502; Lei 8.036/1990, art. 18, §2º) | 20% | Integral | A confirmar conforme entendimento aplicável |
| Falecimento do empregado | 0% | Integral, pelos dependentes habilitados (Lei 6.858/1980) | Não se aplica |
| Aposentadoria voluntária | 0% | Permitido (Lei 8.036/1990, art. 20, III) | Não tem direito |
| PDV | Conforme o regulamento do plano (0%, 20% ou 40%) | Integral | A confirmar conforme o plano |

**Verbas por motivo (além do FGTS):**

| Motivo | Aviso prévio | 13º proporcional | Férias proporcionais |
|---|---|---|---|
| Culpa recíproca | Pela metade, se indenizado (Súmula 14 TST) | 50% | 50% — **controverso, confirmar com Fabio**; o simulador alerta |
| Força maior | Não é devido | 100% | 100% |
| Falecimento | Não é devido | 100% | 100% (vencidas e proporcionais), pagas aos dependentes |
| Aposentadoria voluntária | Como pedido de demissão (desconto se não cumprido) | 100% | 100% |
| PDV | Conforme o plano informado | 100% | 100% |

Os percentuais de 50% incidem sobre o **valor** da verba, não sobre os avos, para não distorcer a metade por arredondamento (ex.: 7 avos × 0,5).

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
- CLT, arts. 477 (§§5º, 6º e 8º), 479, 480, 481, 484, 484-A, 501 e 502
- Lei 605/1949, art. 7º; Lei 6.858/1980
- Súmulas 14, 27, 163 e 172 do TST; Súmula 215 do STJ; STF, ADI 1721
- Lei 8.036/1990, arts. 18, §2º, e 20, III
- Lei 8.036/1990 (FGTS), art. 18
- Manual de Orientação do eSocial para o Empregador Doméstico (critério operacional de 15 dias para férias proporcionais)
- ADCT, art. 10, II, "b"
- Lei 8.213/1991, art. 118

**Processo de manutenção**: se uma nova regra tributária ou trabalhista for adicionada ao sistema, ela entra nesta tabela com a fonte legal correspondente **antes** de virar código. Se a fonte não estiver clara ou for controversa (há entendimento divergente entre STJ/TST/doutrina), isso deve ser registrado explicitamente aqui como "controverso — confirmar com Fabio" em vez de escolher silenciosamente uma interpretação.
