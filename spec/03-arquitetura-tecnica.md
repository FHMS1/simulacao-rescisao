# Spec 03 — Arquitetura Técnica

## 1. Visão geral das camadas

```
domain/   → regras de negócio puras, sem DOM, sem React, 100% testável isoladamente
ui/       → formulário, componentes visuais, chama domain/ e renderiza o resultado
```

A `ui/` depende de `domain/`. `domain/` nunca depende de `ui/`. Esta é a regra de dependência que torna o motor de cálculo reutilizável em outros projetos do Fabio (ex.: `scmo-clt`, `simulador-pfxpj`) no futuro, caso vire um pacote compartilhado — decisão ainda não tomada, mas a separação de camadas é o que deixa essa porta aberta sem custo adicional agora.

## 2. Por que essa separação (não é só estilo)

Na versão anterior, a função `calcular()` lia inputs do DOM, calculava e renderizava tudo junto, numa função de ~280 linhas. Consequência prática: não dava pra escrever `expect(calcularINSS(4200)).toBe(x)` sem montar um DOM inteiro. Isso também escondeu o bug de base tributária (ver `specs/02`) porque a lógica fiscal nunca foi isolada o suficiente para ser revisada de forma independente da UI.

## 3. `domain/rescisao/tabelas/` — tabelas fiscais versionadas por vigência

Nunca uma constante fixa tipo `const INSS_TETO = 8475.55`. Sempre uma lista com vigência:

```ts
export interface FaixaINSS {
  teto: number;
  aliquota: number;
}

export interface TabelaINSS {
  vigenciaInicio: string; // ISO 'YYYY-MM-DD'
  vigenciaFim: string | null; // null = ainda vigente
  fonte: string; // ex.: 'Portaria Interministerial MPS/MF nº 13/2026'
  faixas: FaixaINSS[];
  teto: number;
}

export const TABELAS_INSS: TabelaINSS[] = [
  {
    vigenciaInicio: '2025-01-01',
    vigenciaFim: '2025-12-31',
    fonte: 'Portaria Interministerial MPS/MF nº XX/2025',
    teto: 8157.41,
    faixas: [ /* ... */ ],
  },
  {
    vigenciaInicio: '2026-01-01',
    vigenciaFim: null,
    fonte: 'Portaria Interministerial MPS/MF nº 13/2026',
    teto: 8475.55,
    faixas: [ /* ... */ ],
  },
];

export function obterTabelaINSS(dataReferencia: Date): TabelaINSS {
  const tabela = selecionarVigencia(TABELAS_INSS, dataReferencia);
  if (!tabela) throw new TabelaNaoEncontradaError('INSS', dataReferencia);
  return tabela;
}
```

Mesmo padrão para `TABELAS_IRRF`. O campo `fonte` é obrigatório — é o que alimenta a memória de cálculo (RF-18) e permite auditar de onde veio cada número.

**Comparação de vigência é feita por string ISO, nunca por objeto `Date`** (`tabelas/vigencia.ts`). `new Date('2025-12-31')` é interpretado como UTC e, no fuso do Brasil (UTC−3), resulta em 30/12 às 21h — uma rescisão no último dia do ano não encontrava a tabela daquele ano e caía em `TabelaNaoEncontradaError`. Como `YYYY-MM-DD` ordena corretamente na comparação lexicográfica, comparar strings resolve o problema sem depender de fuso:

```ts
export function selecionarVigencia<T extends Vigencia>(
  tabelas: readonly T[],
  dataReferencia: Date,
): T | undefined {
  const competencia = competenciaISO(dataReferencia); // data local, não UTC
  return tabelas.find(
    t => competencia >= t.vigenciaInicio && (!t.vigenciaFim || competencia <= t.vigenciaFim),
  );
}
```

Coberto por teste de regressão em `tabelas/__tests__/vigencia.test.ts`.

**`TabelaNaoEncontradaError`**: erro customizado, lançado (não engolido silenciosamente) quando não existe tabela cadastrada para a data de referência. É a substituição do antigo banner cosmético `verificarAtualizacao()`, que só avisava mas deixava o cálculo continuar com a tabela velha.

## 4. Atualização de tabelas fiscais — processo, não automação cega

**Contexto**: INSS e IRRF são publicados por Portaria/Lei no Diário Oficial da União, sem API pública estruturada. Fazer scraping automático do DOU e aplicar o valor direto no sistema é uma automação inadequada aqui: se o formato do documento mudar ou o parser errar, o sistema aplica silenciosamente um número fiscal errado em cálculos usados com clientes reais.

**Processo adotado**:

1. **Dado versionado, não hardcoded** (seção 3 acima) — adicionar uma tabela nova é editar `tabelas/inss.ts`/`tabelas/irrf.ts`, sem tocar em lógica de cálculo.
2. **Falha explícita, não silenciosa** — `obterTabelaINSS`/`obterTabelaIRRF` lançam erro se a competência não tiver tabela cadastrada, em vez de reutilizar a tabela mais antiga por padrão.
3. **Automação do lembrete, não da aplicação** — um workflow agendado (recomendado: n8n, já usado pelo Fabio no projeto Hermes) roda entre dezembro e janeiro de cada ano e envia notificação (WhatsApp/e-mail) lembrando de verificar a publicação da nova Portaria e cadastrar a tabela. **A leitura da Portaria e a validação do número são sempre feitas por uma pessoa habilitada (Fabio ou quem ele delegar)** — nunca por um script que aplica o valor sem revisão.
4. Cada tabela cadastrada registra a fonte (`fonte`) para auditoria futura.

## 5. Formulário — React Hook Form + Zod

- O formulário tem ~50 campos com visibilidade condicional (ex.: campos de pensão só aparecem se "tem pensão" = sim). `useState` por campo geraria excesso de re-renders e lógica de exibição espalhada.
- React Hook Form usa campos não controlados por padrão + `watch()` para as condicionais, o que é mais performático nesse volume de campos.
- O schema Zod que valida o formulário deve ser a mesma fonte de tipo (`z.infer<typeof schema>`) usada como `RescisaoInput` no `domain/` — ver `specs/04-modelo-de-dados.md`. Isso evita duas definições divergentes do mesmo formato de dado.

## 6. Testes

- **Vitest** para tudo em `domain/` — cada função de cálculo tem `__tests__` cobrindo: caso normal, caso de borda citado em `specs/05`, e (quando aplicável) o caso que corrigiu um bug histórico (para virar teste de regressão).
- **Testing Library** apenas para fluxos de integração do formulário (ex.: "marcar férias em dobro exibe o campo de períodos"), não para testar valor de cálculo — isso é responsabilidade do teste de `domain/`.
- Nenhum PR que altera `domain/` é aceito sem teste correspondente.

## 7. PDF e recursos externos

- `html2pdf.js` continua vindo de CDN (`cdnjs`), mas com atributos `integrity` (SRI) e `crossorigin="anonymous"` no `<script>`, para mitigar risco de supply-chain caso o CDN seja comprometido.
- Nenhuma chamada de rede é feita com os dados do formulário (nome, salário) — a geração de PDF é 100% local no navegador.

## 8. Decisões técnicas registradas (e seus porquês)

| Decisão | Alternativa considerada | Por que esta opção |
|---|---|---|
| TypeScript estrito | JavaScript puro | Domínio lida com dinheiro e legislação; erros de tipo pegos em build (ex.: esquecer campo na base de cálculo) evitam bugs silenciosos em produção |
| React Hook Form + Zod | `useState` por campo | ~50 campos condicionais tornam `useState` espalhado insustentável; RHF reduz re-renders e centraliza validação |
| Tabelas versionadas por vigência | Constante única por ano | Permite recalcular rescisões antigas e evita reescrever lógica todo ano |
| Vitest | Jest | Roda nativo no Vite, zero configuração adicional, mesma API do Jest |
| Automação de lembrete (não de aplicação) para tabelas fiscais | Scraping automático do DOU | Fonte oficial não é estruturada (PDF/texto); aplicar valor sem revisão humana é risco fiscal inaceitável para uma ferramenta usada com clientes reais |
