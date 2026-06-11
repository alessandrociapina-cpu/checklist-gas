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
    if (c.tipo === 'multi') return (v && v.length) ? esc(v.join(', ')) : '<span class="rel-num">—</span>';
    if (!v) return '<span class="rel-num">—</span>';
    if (c.tipo === 'data') return esc(fmtData(v));
    if (c.outro && v === 'Outros') return esc(cl.geral[c.outro.id] || 'Outros');
    return esc(v);
  };

  const tabelaGeral = `
    <table class="rel-tabela">
      ${CHECKLIST_DEF.geral.map((c, idx) => `
        <tr>
          <td class="rel-num" style="width:28px">${idx + 1}</td>
          <th style="width:42%">${esc(c.label)}</th>
          <td>${valorGeral(c)}</td>
        </tr>`).join('')}
    </table>`;

  const secoesFrentes = CHECKLIST_DEF.frentes.map(f => {
    const linhas = f.itens.map((item, i) => {
      const d = cl.frentes[f.id][i];
      const fts = fotosPorItem[`${f.id}:${i}`] || [];
      const just = (d.justificativa || '').trim();
      const blocoJust = d.ok ? '' :
        (just
          ? `<div class="rel-just">Justificativa: ${esc(just)}</div>`
          : `<div class="rel-just rel-just-pend">⚠ ITEM NÃO ATENDIDO — SEM JUSTIFICATIVA</div>`);
      return `
        <tr>
          <td class="rel-num centro">${i + 1}</td>
          <td>${esc(item.texto)}${item.evidencia ? `<br><small class="rel-num">Evidência: ${esc(item.evidencia)}</small>` : ''}${blocoJust}</td>
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

  /* Atualização cadastral */
  const cad = cl.cadastro || { necessita: '', registros: [] };
  let secaoCadastro;
  if (cad.necessita === 'Sim' && cad.registros.length) {
    const linhasCad = cad.registros.map((r, i) => `
      <tr>
        <td class="rel-num centro">${i + 1}</td>
        <td>${esc(r.rede) || '—'}</td>
        <td>${(r.divergencias || []).length ? esc(r.divergencias.join(', ')) : '—'}</td>
        <td>${esc(r.posicao) || '—'}</td>
        <td>${esc(r.descricao) || '—'}</td>
      </tr>`).join('');
    const galeriasCad = cad.registros.map((r, i) => {
      const fts = fotosPorItem[`cad:${r.id}`] || [];
      if (!fts.length) return '';
      return `<div class="rel-foto-rotulo">Registro ${i + 1} — ${esc(r.rede) || 'rede não informada'}</div>
        <div class="rel-fotos">${fts.map(ft => `<img src="${ft.dataUrl}" alt="Divergência">`).join('')}</div>`;
    }).join('');
    secaoCadastro = `
      <table class="rel-tabela">
        <tr><th style="width:24px">#</th><th style="width:64px">Rede</th><th>Divergências</th>
            <th style="width:18%">Posição na via</th><th style="width:34%">Alterações necessárias</th></tr>
        ${linhasCad}
      </table>
      ${galeriasCad}`;
  } else if (cad.necessita === 'Não') {
    secaoCadastro = `<p class="rel-cad-ok">✔ Cadastro confere com o encontrado em campo — nenhuma atualização necessária.</p>`;
  } else {
    secaoCadastro = `<p class="rel-num">Não avaliado.</p>`;
  }

  const assinaturas = CHECKLIST_DEF.assinaturas.map(a => {
    const d = cl.assinaturas[a.id];
    return `<div class="rel-ass">
      ${d.img ? `<img src="${d.img}" alt="Assinatura">` : `<div class="pendente">Pendente</div>`}
      <div class="nome">${esc(d.nome) || '&nbsp;'}</div>
      <div class="papel">${esc(a.label)}</div>
    </div>`;
  }).join('');

  const horario = (cl.geral.horaInicio || cl.geral.horaFim)
    ? ` · ${cl.geral.horaInicio || '—'} às ${cl.geral.horaFim || '—'}` : '';

  $view().innerHTML = `
    <div class="acoes-relatorio">
      <button class="btn btn-primario" id="btn-pdf">🖨 Imprimir / Salvar PDF</button>
      <button class="btn btn-secundario" id="btn-compartilhar">📤 Compartilhar</button>
    </div>
    <div class="relatorio" id="relatorio">
      <div class="rel-cabecalho">
        <h2>${esc(CHECKLIST_DEF.titulo)}</h2>
        <div class="rel-meta">OS ${esc(cl.geral.os) || '—'} · ${esc(municipioExibicao(cl.geral)) || '—'} · ${fmtData(cl.geral.data)}${esc(horario)}
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
          <div class="valor ${p.pend ? 'pendente-num' : 'completo'}">${p.pend}</div>
          <div class="desc">Sem justificativa</div>
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
        <h3>Atualização Cadastral</h3>
        ${secaoCadastro}
      </div>

      <div class="rel-secao">
        <h3>Assinaturas</h3>
        <div class="rel-assinaturas">${assinaturas}</div>
      </div>
    </div>`;

  document.getElementById('btn-pdf').onclick = () => window.print();

  document.getElementById('btn-compartilhar').onclick = async () => {
    const resumo =
      `${CHECKLIST_DEF.titulo}\n` +
      `OS: ${cl.geral.os || '—'} | ${cl.geral.endereco || ''} - ${municipioExibicao(cl.geral) || ''}\n` +
      (cl.geral.descricaoServico ? `Serviço: ${cl.geral.descricaoServico}\n` : '') +
      `Data: ${fmtData(cl.geral.data)}${horario} | Responsável: ${cl.geral.responsavel || '—'}\n` +
      `Criticidade: ${cl.geral.criticidade || '—'} | Progresso: ${p.ok}/${p.total} itens (${p.pct}%)` +
      (p.pend ? ` | ⚠ ${p.pend} item(ns) sem justificativa` : '') + '\n' +
      CHECKLIST_DEF.frentes.map(f => {
        const ok = cl.frentes[f.id].filter(d => d.ok).length;
        return `${f.curto}: ${ok}/${f.itens.length}`;
      }).join(' | ') +
      (cad.necessita === 'Sim' ? `\nAtualização cadastral: ${cad.registros.length} registro(s) de divergência` : '');
    if (navigator.share) {
      try { await navigator.share({ title: `Checklist Gás - OS ${cl.geral.os || ''}`, text: resumo }); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(resumo);
      alert('Resumo copiado para a área de transferência.');
    }
  };
}
