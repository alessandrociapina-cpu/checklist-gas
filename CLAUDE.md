# CLAUDE.md

Instruções para o Claude Code ao trabalhar neste repositório.

## O que é este projeto

**Checklist Gás** — PWA de campo para fiscais da Sabesp acompanharem serviços de
manutenção/obras de água e esgoto com interferência ou paralelismo em rede de gás.
A estrutura do formulário espelha fielmente a planilha `CheckListGasOVMS_1_1.xlsx`
(checklist OVMS): Informações de Interesse Geral + 4 frentes de verificação +
atualização cadastral + 4 assinaturas digitais.

Publicado via **GitHub Pages** (branch `main`, pasta raiz):
`https://alessandrociapina-cpu.github.io/checklist-gas/`

## Arquitetura

App estático, **sem build, sem dependências externas** (sem CDN — precisa funcionar
100% offline em campo). JavaScript puro, dados locais no aparelho.

| Arquivo | Papel |
|---|---|
| `index.html` | ponto de entrada; carrega os scripts na ordem: versao → data → db → assinatura → relatorio → app |
| `js/versao.js` | `APP_VERSAO` e `HISTORICO_VERSOES` (changelog exibido no selo da tela inicial) |
| `js/data.js` | **fonte única da definição do checklist** (campos, opções, frentes, hints) + `novoChecklist()`, `migrarChecklist()`, `progressoChecklist()` |
| `js/db.js` | persistência em IndexedDB (stores `checklists` e `fotos`) |
| `js/app.js` | roteador por hash (`#/`, `#/form/:id/:etapa`, `#/relatorio/:id`), telas, autosave |
| `js/assinatura.js` | modal de assinatura em canvas |
| `js/relatorio.js` | relatório espelhando a planilha; PDF via `window.print()` |
| `sw.js` | service worker cache-first (`CACHE = 'checklist-gas-vN'`) |
| `css/style.css` | mobile-first + estilos de impressão (`@media print`) |

## Convenções obrigatórias

1. **Idioma**: todo texto de interface, comentários e mensagens de commit em **português (pt-BR)**.
2. **A cada release**:
   - incrementar `APP_VERSAO` em `js/versao.js` e adicionar entrada no **topo** de `HISTORICO_VERSOES`;
   - incrementar a versão do cache em `sw.js` (`checklist-gas-vN`) — sem isso o usuário não recebe a atualização;
   - se criar arquivo novo, adicioná-lo à lista `ARQUIVOS` do `sw.js`.
3. **Retrocompatibilidade**: ao adicionar/renomear campos no modelo de dados, atualizar
   `migrarChecklist()` em `js/data.js` (checklists antigos e backups JSON precisam continuar abrindo).
   IDs de campos existentes **não mudam** (ex.: assinatura `contratada` tem rótulo "Responsável Sabesp",
   campo `data` é "Data de Início do Serviço") — só o `label` muda.
4. **Campos do formulário** são definidos apenas em `js/data.js`; o formulário e o relatório
   renderizam a partir da definição. Não duplicar rótulos no código das telas.
5. **Fotos** são vinculadas por `itemKey` (`f1:0` … `f4:4` para frentes, `cad:<idRegistro>` para
   atualização cadastral) no store `fotos`.

## Fluxo de publicação

1. Desenvolver e commitar no branch de trabalho da sessão.
2. **Antes de criar o PR**: `git fetch origin main && git merge -s ours origin/main`
   (os PRs são mergeados por **squash**, então sem isso o PR seguinte acusa conflito add/add).
3. Push, criar PR para `main` e mergear por squash — o GitHub Pages publica automaticamente.

## Validação

Sem suíte de testes no repositório; validar com teste de ponta a ponta usando o Playwright
global (`/opt/node22/lib/node_modules/playwright`) contra `python3 -m http.server`:
criar checklist, preencher campos, marcar itens/justificativas, gerar relatório e conferir
o conteúdo, além de `node --check` em todos os `.js`. Não introduzir erros de console.

## Decisões de produto já tomadas

- Itens das frentes **não marcados com OK exigem justificativa** (destaque vermelho; pendências
  aparecem no relatório como "ITEM NÃO ATENDIDO — SEM JUSTIFICATIVA").
- Dados são locais por aparelho; compartilhamento entre pessoas é via backup/restauração JSON.
- PDF do relatório usa a impressão nativa do navegador (sem bibliotecas).
- Município "Outros" abre campo de digitação manual (`municipioOutro`).
