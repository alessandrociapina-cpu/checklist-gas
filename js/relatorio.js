/* Módulo de relatório — reproduz o layout da planilha e permite imprimir/salvar em PDF */
'use strict';

async function telaRelatorio(cl) {
  montarTopo(`Relatório · OS ${cl.geral.os || 'sem número'}`, null, `#/form/${cl.id}/0`);

  const fotos = await DB.fotosDoChecklist(cl.id);
  const fotosPorItem = {};
  fotos.forEach(f => { (fotosPorItem[f.itemKey] = fotosPorItem[f.itemKey] || []).push(f); });

  const p = progressoChecklist(cl);

  const valorGeral = c => {
    const v = cl.geral[c.id];
    if (!v) return '<span class="rel-num">—</span>';
    if (c.tipo === 'data') return esc(fmtData(v));
    return esc(v);
  };

  const tabelaGeral = `
    <table class="rel-tabela">
      ${CHECKLIST_DEF.geral.map(c => `
        <tr>
          <td class="rel-num" style="width:28px">${c.num}</td>
          <th style="width:42%">${esc(c.label)}</th>
          <td>${valorGeral(c)}</td>
        </tr>`).join('')}
    </table>`;

  const secoesFrentes = CHECKLIST_DEF.frentes.map(f => {
    const linhas = f.itens.map((item, i) => {
      const d = cl.frentes[f.id][i];
      const fts = fotosPorItem[`${f.id}:${i}`] || [];
      return `
        <tr>
          <td class="rel-num centro">${i + 1}</td>
          <td>${esc(item.texto)}${item.evidencia ? `<br><small class="rel-num">Evidência: ${esc(item.evidencia)}</small>` : ''}</td>
          <td class="${d.ok ? 'ok-sim' : 'ok-nao'}">${d.ok ? '✔' : '✕'}</td>
          <td class="centro">${fts.length ? `${fts.length} foto(s)` : '—'}</td>
          <td>${esc(d.responsavel) || '—'}</td>
          <td>${esc(d.observacoes) || '—'}</td>
        </tr>`;
    }).join('');

    const galerias = f.itens.map((item, i) => {
      const fts = fotosPorItem[`${f.id}:${i}`] || [];
      if (!fts.length) return '';
      return `<div class="rel-foto-rotulo">Item ${i + 1} — ${esc(item.texto)}</div>
        <div class="rel-fotos">${fts.map(ft => `<img src="${ft.dataUrl}" alt="Evidência">`).join('')}</div>`;
    }).join('');

    const okFrente = cl.frentes[f.id].filter(d => d.ok).length;
    return `
      <div class="rel-secao">
        <h3>${esc(f.titulo)} <span style="float:right">${okFrente}/${f.itens.length}</span></h3>
        <table class="rel-tabela">
          <tr><th style="width:24px">#</th><th>Item</th><th style="width:34px">OK</th>
              <th style="width:64px">Foto</th><th style="width:18%">Responsável</th><th style="width:22%">Observações</th></tr>
          ${linhas}
        </table>
        ${galerias}
      </div>`;
  }).join('');

  const assinaturas = CHECKLIST_DEF.assinaturas.map(a => {
    const d = cl.assinaturas[a.id];
    return `<div class="rel-ass">
      ${d.img ? `<img src="${d.img}" alt="Assinatura">` : `<div class="pendente">Pendente</div>`}
      <div class="nome">${esc(d.nome) || '&nbsp;'}</div>
      <div class="papel">${esc(a.label)}</div>
    </div>`;
  }).join('');

  $view().innerHTML = `
    <div class="acoes-relatorio">
      <button class="btn btn-primario" id="btn-pdf">🖨 Imprimir / Salvar PDF</button>
      <button class="btn btn-secundario" id="btn-compartilhar">📤 Compartilhar</button>
    </div>
    <div class="relatorio" id="relatorio">
      <div class="rel-cabecalho">
        <h2>${esc(CHECKLIST_DEF.titulo)}</h2>
        <div class="rel-meta">OS ${esc(cl.geral.os) || '—'} · ${esc(cl.geral.municipio) || '—'} · ${fmtData(cl.geral.data)}
          · Gerado em ${new Date().toLocaleString('pt-BR')}</div>
      </div>

      <div class="rel-resumo">
        <div class="cartao-resumo">
          <div class="valor ${p.pct === 100 ? 'completo' : ''}">${p.pct}%</div>
          <div class="desc">Concluído</div>
        </div>
        <div class="cartao-resumo">
          <div class="valor">${p.ok}/${p.total}</div>
          <div class="desc">Itens OK</div>
        </div>
        <div class="cartao-resumo">
          <div class="valor">${fotos.length}</div>
          <div class="desc">Fotos</div>
        </div>
        <div class="cartao-resumo">
          <div class="valor">${esc(cl.geral.criticidade) || '—'}</div>
          <div class="desc">Criticidade</div>
        </div>
      </div>

      <div class="rel-secao">
        <h3>Informações de Interesse Geral</h3>
        ${tabelaGeral}
      </div>

      ${secoesFrentes}

      <div class="rel-secao">
        <h3>Assinaturas</h3>
        <div class="rel-assinaturas">${assinaturas}</div>
      </div>
    </div>`;

  document.getElementById('btn-pdf').onclick = () => window.print();

  document.getElementById('btn-compartilhar').onclick = async () => {
    const resumo =
      `${CHECKLIST_DEF.titulo}\n` +
      `OS: ${cl.geral.os || '—'} | ${cl.geral.endereco || ''} - ${cl.geral.municipio || ''}\n` +
      `Data: ${fmtData(cl.geral.data)} | Responsável: ${cl.geral.responsavel || '—'}\n` +
      `Criticidade: ${cl.geral.criticidade || '—'} | Progresso: ${p.ok}/${p.total} itens (${p.pct}%)\n` +
      CHECKLIST_DEF.frentes.map(f => {
        const ok = cl.frentes[f.id].filter(d => d.ok).length;
        return `${f.curto}: ${ok}/${f.itens.length}`;
      }).join(' | ');
    if (navigator.share) {
      try { await navigator.share({ title: `Checklist Gás - OS ${cl.geral.os || ''}`, text: resumo }); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(resumo);
      alert('Resumo copiado para a área de transferência.');
    }
  };
}
