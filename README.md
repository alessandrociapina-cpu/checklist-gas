# Checklist Gás

PWA para checklist de campo de **manutenção e obras com interferência/paralelismo em rede de gás** (serviços de água e esgoto), baseado fielmente na planilha `CheckListGasOVMS_1_1.xlsx`.

## Funcionalidades

- **Informações de Interesse Geral** — os 20 campos da planilha (OS, contrato, endereço, pressão da rede de gás, materiais e diâmetros das redes, criticidade, protocolo da concessionária etc.), com opções de toque rápido e valores padrão pré-preenchidos.
- **4 Frentes de verificação** (19 itens no total), cada item com:
  - marcação **OK**;
  - campo de **responsável** e **observações**;
  - **fotos de evidência** pela câmera ou galeria (com compressão automática);
  - dicas de orientação da planilha (ex.: "não usar retroescavadeira").
  1. Análise Prévia para Realização da Obra Emergencial
  2. Participação da Concessionária de Gás
  3. Investigação em Campo
  4. Execução e Encerramento
- **Assinaturas digitais** desenhadas na tela para os 4 papéis (Responsável Contratada, Administrador do Contrato, Gerente de Manutenção, Gerente/Diretor Regional).
- **Relatório** — espelha o layout da planilha com resumo de completude, tabelas das frentes, galeria de fotos e assinaturas; impressão/salvamento em **PDF** pelo navegador e compartilhamento do resumo.
- **Backup** — exportação e restauração de todos os dados (incluindo fotos) em JSON.
- **100% offline** — dados em IndexedDB no aparelho e app shell em cache via Service Worker; instalável na tela inicial (PWA).

## Como usar

O app é estático — basta servir os arquivos por HTTPS (ou `localhost`):

```bash
# desenvolvimento local
python3 -m http.server 8080
# abrir http://localhost:8080
```

### Publicação no GitHub Pages

Em **Settings → Pages**, selecione o branch desejado e a pasta `/ (root)`. O app ficará disponível em `https://<usuario>.github.io/checklist-gas/`.

## Estrutura

```
index.html              ponto de entrada
manifest.webmanifest    manifesto PWA
sw.js                   service worker (cache offline)
css/style.css           estilos (mobile-first + impressão)
js/data.js              definição do checklist (espelho da planilha)
js/db.js                persistência (IndexedDB: checklists e fotos)
js/app.js               telas: lista, formulário por etapas, autosave
js/assinatura.js        captura de assinatura (canvas)
js/relatorio.js         geração do relatório/PDF
icons/                  ícones do app
```
