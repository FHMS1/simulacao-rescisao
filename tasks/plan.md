# Plano de implementação — link público do simulador

Objetivo: entregar o simulador completo, client-side, testado e publicado no GitHub Pages, preservando a separação entre domínio e UI definida no `AGENTS.md`.

## Fases

1. **Contratos e especificações**
   - Resolver a fonte única de tipos/validação entre domínio e formulário.
   - Separar tributação mensal da tributação exclusiva do 13º.
   - Documentar arredondamento e memória de cálculo.
   - Verificação: TypeScript e specs coerentes, sem dependência de React/DOM em `domain/`.

2. **Tabelas fiscais versionadas**
   - Registrar INSS e IRRF por vigência e fonte oficial.
   - Dependência: validação humana explícita dos valores por Fabio.
   - Verificação: seleção correta nas datas-limite de cada vigência.

3. **Tributos**
   - Implementar INSS progressivo mensal e separado sobre 13º.
   - Implementar IRRF, deduções legais/simplificada e redução vigente.
   - Verificação: casos oficiais, zero e limites de faixa.

4. **Motor completo**
   - Completar descontos, médias, projeções e verbas previstas nas specs.
   - Criar `calcularRescisao()` como único ponto público do domínio.
   - Verificação: cenários por motivo e suíte completa.

5. **Formulário React**
   - Criar schema Zod compartilhado, React Hook Form e campos condicionais.
   - Verificação: validação, acessibilidade e ausência de lógica fiscal na UI.

6. **Resultado auditável e PDF**
   - Renderizar totais, memória, tabela/fonte aplicadas, alertas e aviso de estimativa.
   - Exportar/imprimir PDF no navegador, sem transmitir dados.
   - Verificação: conteúdo visual, impressão e segurança do texto do usuário.

7. **Certificação e publicação**
   - Rodar testes, build e fluxo completo em navegador.
   - Publicar commit revisado e confirmar o artefato efetivamente servido pelo Pages.
   - Verificação: URL pública contém o formulário funcional e produz resultado/PDF.

## Restrições

- Nenhum valor fiscal será publicado sem validação humana explícita.
- Nenhum dado digitado sairá do navegador.
- Mudanças de comportamento terão spec e teste no mesmo commit.
- A publicação só será declarada concluída após verificação do link público.
