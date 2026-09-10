# AGENTS.md — Simulador de Rescisão CLT (Êxito Contábil)

Este arquivo é a fonte única de verdade para qualquer agente de IA (Claude Code, Copilot, ou outro) que for trabalhar neste repositório. Leia-o inteiro antes de tocar em qualquer arquivo. Se uma instrução aqui conflitar com o que parece "óbvio" ao olhar o código, **esta documentação prevalece** — o código pode estar no meio de uma migração e ainda não refletir o padrão-alvo.

As especificações detalhadas (regras de negócio, arquitetura, modelo de dados, critérios de aceite) estão em `spec/`. Este arquivo dá o contexto geral e o processo de trabalho; as `spec/` dão o detalhe técnico e jurídico.

---

## 1. O que é este projeto

Um simulador de rescisão de contrato de trabalho CLT, usado internamente pelo escritório de contabilidade **Êxito Contábil** para gerar estimativas de verbas rescisórias (saldo de salário, aviso prévio, férias, 13º, FGTS, INSS, IRRF) e apresentar memória de cálculo para clientes.

**Não é**: um sistema de folha de pagamento, um substituto do eSocial, nem um gerador de TRCT (Termo de Rescisão) com validade jurídica formal. É uma ferramenta de **estimativa e apoio à decisão**, sempre rotulada como tal na interface.

**Estado atual**: em migração de uma versão vanilla JS/HTML monolítica (`js/script.js`, ~1300 linhas, tudo acoplado ao DOM) para uma stack **Vite + React + TypeScript**, com o motor de cálculo extraído como camada independente. Ver `spec/03-arquitetura-tecnica.md` para os detalhes da arquitetura-alvo.

---

## 2. Stack técnica (alvo da migração)

- **Build**: Vite
- **UI**: React 18+, TypeScript estrito (`strict: true`, sem `any` não justificado)
- **Formulário**: React Hook Form + Zod (o schema Zod é a mesma fonte de validação do formulário e de tipagem do DTO de entrada do motor de cálculo — não duplicar validação)
- **Testes**: Vitest (unitário, principalmente sobre `domain/`) + Testing Library (integração de formulário)
- **PDF/impressão**: mantém `html2pdf.js`, mas com atributo `integrity` (SRI) no `<script>` — ver seção 6
- **Sem backend nesta fase**: tudo roda client-side. Se um backend for introduzido no futuro (ex.: para versionar tabelas fiscais via API), isso será uma decisão registrada em nova spec, não uma suposição implícita.

---

## 3. Princípio arquitetural inegociável: `domain/` não conhece DOM nem React

A versão anterior deste projeto tinha toda a lógica fiscal misturada com leitura de `document.getElementById` dentro da mesma função de ~280 linhas. Isso a tornava impossível de testar isoladamente e escondia erros de regra de negócio dentro de código de renderização — foi assim que um erro real de base de cálculo de INSS/IRRF passou despercebido (ver `spec/02-regras-de-negocio-tributarias.md`, seção "Histórico do bug").

Por isso, esta é a regra mais importante do projeto:

> **Nenhuma função dentro de `src/domain/` pode importar React, acessar `document`/`window`, ou depender de qualquer coisa fora de `src/domain/`.**
> Toda função de `domain/` recebe um objeto de entrada tipado e devolve um objeto de saída tipado. Sem efeito colateral, sem leitura de estado global.

Isso não é estilo — é o que permite testar `calcularIRRF({ base: 4200 })` e comparar com um valor calculado à mão, sem precisar montar formulário nenhum. Qualquer PR que misture cálculo fiscal com JSX/DOM deve ser rejeitado nesse ponto, independente do resto da qualidade do código.

---

## 4. Estrutura de pastas

```
src/
├── domain/
│   └── rescisao/
│       ├── tabelas/
│       │   ├── inss.ts          # tabelas INSS versionadas por vigência
│       │   ├── irrf.ts          # tabelas IRRF versionadas por vigência
│       │   └── index.ts         # obterTabelaINSS(data), obterTabelaIRRF(data)
│       ├── calcularINSS.ts
│       ├── calcularIRRF.ts
│       ├── calcularTempoServico.ts
│       ├── calcularSaldoSalario.ts
│       ├── calcularAvos.ts
│       ├── calcularFerias.ts
│       ├── calcularAvisoPrevio.ts
│       ├── calcular13.ts
│       ├── calcularFGTS.ts
│       ├── regrasPorMotivo.ts   # equivalente ao antigo RESCISAO_REGRAS
│       ├── calcularRescisao.ts  # orquestrador — único ponto de entrada público do domain
│       ├── tipos.ts             # DTOs — ver spec/04-modelo-de-dados.md
│       └── __tests__/
├── ui/
│   ├── components/               # apresentacionais, sem lógica de negócio
│   ├── forms/
│   │   ├── schema.ts             # schema Zod do formulário
│   │   └── useRescisaoForm.ts
│   └── pages/
│       └── SimuladorRescisao.tsx
└── App.tsx

spec/                              # especificações — ver seção 7 deste documento
AGENTS.md
CLAUDE.md
```

Qualquer arquivo novo com lógica de cálculo entra em `domain/`. Qualquer arquivo novo com JSX entra em `ui/`. Não existe meio-termo — se você não sabe em qual pasta um código deveria entrar, é sinal de que ele está misturando responsabilidades e deveria ser dividido em dois arquivos antes de ser escrito.

---

## 5. Processo de trabalho para qualquer demanda (spec-driven)

Este projeto segue desenvolvimento orientado a especificação. Isso significa: **a spec é escrita/atualizada antes do código**, e o código implementa exatamente o que a spec descreve — não mais, não menos.

Ao receber qualquer demanda (bug, feature, refatoração), siga esta ordem:

1. **Leia a spec relevante em `spec/`** antes de abrir qualquer arquivo de código. Se a demanda envolve regra fiscal, comece por `spec/02-regras-de-negocio-tributarias.md`.
2. **Se a demanda envolve uma regra tributária/trabalhista nova ou uma mudança de regra existente**, ela precisa ter uma fonte legal citada (lei, súmula, IN, decreto) antes de virar código. Não implemente uma regra fiscal "porque parece certo" — se a fonte não estiver clara, pare e pergunte ao Fabio antes de prosseguir. Erros aqui viram responsabilidade profissional do escritório com clientes reais.
3. **Atualize ou crie a spec primeiro** se a demanda muda comportamento (nova verba, nova exceção, novo tipo de rescisão). A spec desatualizada é pior que a ausência de spec, porque engana o próximo agente/dev que ler.
4. **Implemente no `domain/` primeiro, com teste.** Nenhuma lógica de cálculo é aceita sem teste unitário cobrindo pelo menos: caso normal, caso zero/vazio, e um caso de borda citado na spec.
5. **Só depois conecte à UI.** A camada `ui/` nunca decide *quanto* algo vale — ela só chama `calcularRescisao()` e renderiza o resultado.
6. **Rode a suíte de testes inteira antes de considerar a tarefa concluída**, não só o teste novo.
7. **Se o comportamento mudou, a spec correspondente é atualizada no mesmo PR/commit** — spec e código não podem divergir por mais de um commit de diferença.

---

## 6. O que NUNCA fazer neste projeto

- **Nunca** inserir dado vindo de input do usuário em `innerHTML`/`dangerouslySetInnerHTML` sem sanitização. (Isso já foi um bug real na versão anterior, no campo "nome do empregado".)
- **Nunca** hardcodar um valor de tabela fiscal (INSS, IRRF, salário mínimo, teto) direto numa função de cálculo. Todo valor fiscal vem de `domain/rescisao/tabelas/`, resolvido pela data de referência — ver `spec/03-arquitetura-tecnica.md`.
- **Nunca** sobrescrever uma tabela fiscal antiga ao cadastrar uma nova. Tabelas são adicionadas com vigência, nunca substituídas — isso é o que permite recalcular rescisões de anos anteriores.
- **Nunca** assumir de cabeça se uma verba entra ou não na base de INSS/IRRF. Consulte a tabela de incidência em `spec/02-regras-de-negocio-tributarias.md` — ela existe exatamente porque essa é a parte do sistema mais fácil de errar silenciosamente.
- **Nunca** adicionar uma dependência externa (biblioteca de cálculo, CDN de terceiro) sem `integrity`/SRI quando servida via `<script src>`, e sem justificar por que não dá pra resolver com o que já está no `package.json`.
- **Nunca** usar `any` em `domain/` para "resolver rápido" um erro de tipo. Se o tipo está difícil de expressar, o modelo de dados provavelmente precisa ser revisto — não contornado.
- **Nunca** publicar um número de cálculo de tabela fiscal (INSS/IRRF/FGTS) sem que ele tenha sido validado contra a Portaria/Lei oficial por uma pessoa (Fabio ou quem ele delegar). Scraping automático de Diário Oficial para *aplicar* valores automaticamente é proibido neste projeto — ver `spec/03-arquitetura-tecnica.md`, seção "Atualização de tabelas fiscais", para o processo correto (automação de lembrete, não de aplicação).

---

## 7. Índice das specs

| Arquivo | Conteúdo |
|---|---|
| `spec/01-visao-geral-e-requisitos-funcionais.md` | Objetivo do produto, público, requisitos funcionais numerados, fora de escopo |
| `spec/02-regras-de-negocio-tributarias.md` | Tabela de incidência de INSS/IRRF/FGTS por verba, com fonte legal de cada regra |
| `spec/03-arquitetura-tecnica.md` | Estrutura de camadas, DTOs, decisões técnicas e seus porquês, processo de atualização de tabelas fiscais |
| `spec/04-modelo-de-dados.md` | Interfaces TypeScript de entrada/saída do motor de cálculo |
| `spec/05-criterios-de-aceite-e-casos-de-teste.md` | Cenários de teste com valores esperados, por tipo de rescisão |

---

## 8. Privacidade e dados

O simulador processa nome e salário de terceiros (empregados de clientes do escritório). Nesta fase (sem backend), os dados não saem do navegador — mantenha assim a menos que uma decisão explícita de introduzir backend seja tomada e documentada em spec própria. Não adicione analytics, telemetria ou qualquer chamada de rede que envolva os dados digitados no formulário sem aprovação explícita do Fabio.

---

## 9. Contexto de quem mantém o projeto

Mantido por Fabio Henrique de Moura Silva — contador (Ciências Contábeis, atuação avançada em tributário/trabalhista/societário) cursando Análise e Desenvolvimento de Sistemas, em nível iniciante/intermediário em programação mas buscando nível avançado. Isso significa duas coisas práticas para qualquer IA trabalhando aqui:

- **Nas partes de regra fiscal/trabalhista**, pode assumir conhecimento avançado — não precisa explicar o que é FGTS ou como funciona o Simples Nacional.
- **Nas partes de arquitetura de software/React/TypeScript**, explique o raciocínio por trás de decisões técnicas não triviais (por que separar camadas, por que um padrão em vez de outro, quais trade-offs existem) em vez de só entregar o código pronto — o objetivo declarado é aprender engenharia de software de verdade através deste projeto, não só ter o simulador funcionando.
