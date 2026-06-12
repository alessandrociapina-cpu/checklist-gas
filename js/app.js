/* Checklist Gás — aplicação principal (roteamento e telas) */
'use strict';

const ETAPAS = [
  { id: 'geral', rotulo: 'Informações Gerais' },
  ...CHECKLIST_DEF.frentes.map(f => ({ id: f.id, rotulo: f.curto })),
  { id: 'cadastro', rotulo: 'Atualização Cadastral' },
  { id: 'assinaturas', rotulo: 'Assinaturas' }
];

let clAtual = null;          // checklist em edição
let salvarTimer = null;

const $view = () => document.getElementById('view');
const $topo = () => document.getElementById('topo');

/* ---------- util ---------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtData(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

function avisoSalvo() {
  const el = document.getElementById('aviso-salvo');
  el.classList.add('mostrar');
  clearTimeout(avisoSalvo._t);
  avisoSalvo._t = setTimeout(() => el.classList.remove('mostrar'), 1200);
}

function agendarSalvar() {
  clearTimeout(salvarTimer);
  salvarTimer = setTimeout(async () => {
    if (clAtual) {
      await DB.salvarChecklist(clAtual);
      avisoSalvo();
    }
  }, 400);
}

/* Compressão de foto: redimensiona para no máx. 1280px e converte em JPEG */
function comprimirFoto(arquivo) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(arquivo);
    img.onload = () => {
      const MAX = 1280;
      let { width: w, height: h } = img;
      if (w > MAX || h > MAX) {
        const k = MAX / Math.max(w, h);
        w = Math.round(w * k);
        h = Math.round(h * k);
      }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')); };
    img.src = url;
  });
}

/* Localização GPS atual; resolve null se indisponível/negado (nunca trava o fluxo) */
function obterLocalizacao() {
  return new Promise(resolve => {
    if (!('geolocation' in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        precisao: Math.round(pos.coords.accuracy)
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

/* Anexa fotos a uma chave (item de frente ou registro cadastral) */
function ligarFotos(wrap, itemKey, aoMudar) {
  async function render() {
    const fotos = await DB.fotosDoItem(clAtual.id, itemKey);
    wrap.innerHTML = fotos.map(f => `
      <div class="foto-mini">
        <img src="${f.dataUrl}" alt="Evidência">
        ${f.local ? `<span class="geo-badge" title="📍 ${f.local.lat.toFixed(6)}, ${f.local.lon.toFixed(6)} (±${f.local.precisao} m)">📍</span>` : ''}
        <button class="rm" data-foto="${f.id}" aria-label="Remover foto">✕</button>
      </div>`).join('') +
      `<button class="btn-foto" data-add><span class="cam">📷</span>Adicionar</button>`;
    if (aoMudar) aoMudar(fotos.length);
  }
  render();

  wrap.addEventListener('click', async e => {
    const rm = e.target.closest('[data-foto]');
    if (rm) {
      await DB.excluirFoto(rm.dataset.foto);
      render();
      return;
    }
    if (e.target.closest('[data-add]')) {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.capture = 'environment';
      inp.onchange = async () => {
        if (!inp.files[0]) return;
        try {
          // comprime a imagem e captura o GPS em paralelo
          const [dataUrl, local] = await Promise.all([
            comprimirFoto(inp.files[0]),
            obterLocalizacao()
          ]);
          await DB.salvarFoto({
            id: 'ft_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            checklistId: clAtual.id,
            itemKey,
            dataUrl,
            local,
            criadoEm: new Date().toISOString()
          });
          render();
        } catch {
          alert('Não foi possível processar a imagem.');
        }
      };
      inp.click();
    }
  });
}

/* ---------- roteador ---------- */
async function rotear() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [tela, id, extra] = hash.split('/');
  clearTimeout(salvarTimer);

  if (tela === 'form' && id) {
    clAtual = migrarChecklist(await DB.obterChecklist(id));
    if (!clAtual) { location.hash = '#/'; return; }
    telaFormulario(parseInt(extra, 10) || 0);
  } else if (tela === 'relatorio' && id) {
    const cl = migrarChecklist(await DB.obterChecklist(id));
    if (!cl) { location.hash = '#/'; return; }
    await telaRelatorio(cl);
  } else {
    clAtual = null;
    await telaInicial();
  }
}

function montarTopo(titulo, sub, voltar) {
  $topo().innerHTML = `
    ${voltar ? `<button class="btn-icone" id="btn-voltar" aria-label="Voltar">←</button>` : ''}
    <h1>${esc(titulo)}${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</h1>`;
  if (voltar) document.getElementById('btn-voltar').onclick = () => { location.hash = voltar; };
}

/* ---------- versão e histórico de atualizações ---------- */
let popVersoes = null;

document.addEventListener('click', e => {
  if (popVersoes && !popVersoes.hidden && !popVersoes.contains(e.target)) popVersoes.hidden = true;
});

function montarBadgeVersao() {
  if (popVersoes) { popVersoes.remove(); popVersoes = null; }
  $topo().insertAdjacentHTML('beforeend',
    `<button class="badge-versao" id="badge-versao" aria-label="Versão e histórico de atualizações">v${APP_VERSAO}</button>`);

  const badge = document.getElementById('badge-versao');
  const pop = document.createElement('div');
  pop.className = 'popover-versoes';
  pop.hidden = true;
  pop.innerHTML = `
    <h4>Histórico de atualizações</h4>
    ${HISTORICO_VERSOES.map(v => `
      <div class="versao-bloco">
        <div class="versao-cabeca"><b>v${esc(v.versao)}</b><span>${fmtData(v.data)}</span></div>
        <ul>${v.itens.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      </div>`).join('')}`;
  document.body.appendChild(pop);
  popVersoes = pop;

  let fecharTimer = null;
  let abriuPorHover = 0;
  const abrir = () => {
    clearTimeout(fecharTimer);
    if (pop.hidden) abriuPorHover = Date.now();
    pop.hidden = false;
  };
  const fechar = () => { fecharTimer = setTimeout(() => { pop.hidden = true; }, 250); };

  badge.addEventListener('mouseenter', abrir);
  badge.addEventListener('mouseleave', fechar);
  pop.addEventListener('mouseenter', abrir);
  pop.addEventListener('mouseleave', fechar);
  badge.addEventListener('click', e => {            // toque no celular
    e.stopPropagation();
    clearTimeout(fecharTimer);
    // o toque dispara mouseenter antes do click: não fechar o que acabou de abrir
    if (Date.now() - abriuPorHover < 600) pop.hidden = false;
    else pop.hidden = !pop.hidden;
  });
}

/* ---------- tela inicial ---------- */
async function telaInicial() {
  montarTopo('Checklist Gás', 'Interferência/paralelismo em rede de gás', null);
  montarBadgeVersao();
  const lista = (await DB.listarChecklists()).map(migrarChecklist);

  $view().innerHTML = `
    <input type="search" class="busca" id="busca" placeholder="Buscar por OS, endereço ou responsável…">
    <div id="lista"></div>
    <div class="acoes-home">
      <button class="btn btn-secundario" id="btn-exportar">⬇ Backup JSON</button>
      <button class="btn btn-secundario" id="btn-importar">⬆ Restaurar JSON</button>
    </div>
    <input type="file" id="arq-importar" accept="application/json" hidden>
    <button class="btn btn-primario btn-flutuante" id="btn-novo">＋ Novo checklist</button>`;

  function renderLista(filtro) {
    const f = (filtro || '').toLowerCase();
    const visiveis = lista.filter(cl => {
      const g = cl.geral;
      return !f || [g.os, g.endereco, g.responsavel, g.municipio, g.municipioOutro, g.equipe, g.descricaoServico]
        .some(v => (v || '').toLowerCase().includes(f));
    });
    const alvo = document.getElementById('lista');
    if (!visiveis.length) {
      alvo.innerHTML = `<div class="vazio"><div class="icone-grande">📋</div>
        ${lista.length ? 'Nenhum checklist corresponde à busca.' : 'Nenhum checklist ainda.<br>Toque em <b>＋ Novo checklist</b> para começar.'}</div>`;
      return;
    }
    alvo.innerHTML = visiveis.map(cl => {
      const p = progressoChecklist(cl);
      const completo = p.pct === 100;
      return `
      <div class="cartao-checklist ${completo ? 'concluido' : ''}" data-id="${cl.id}">
        <div class="linha1">
          <span class="os">OS ${esc(cl.geral.os) || 'sem número'}</span>
          <span class="data">${fmtData(cl.geral.data)}</span>
        </div>
        <div class="endereco">${esc(cl.geral.endereco) || 'Endereço não informado'} · ${esc(municipioExibicao(cl.geral))}</div>
        <div class="rodape">
          <div class="barra-prog ${completo ? 'cheia' : ''}"><div style="width:${p.pct}%"></div></div>
          <span class="pct">${p.ok}/${p.total} itens${p.pend ? `<br><span class="pend-aviso">⚠ ${p.pend} sem justif.</span>` : ''}</span>
          <div class="acoes">
            <button data-acao="relatorio" title="Relatório">📄</button>
            <button data-acao="excluir" title="Excluir">🗑</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }
  renderLista('');

  document.getElementById('busca').addEventListener('input', e => renderLista(e.target.value));

  document.getElementById('lista').addEventListener('click', async e => {
    const cartao = e.target.closest('.cartao-checklist');
    if (!cartao) return;
    const id = cartao.dataset.id;
    const acao = e.target.dataset && e.target.dataset.acao;
    if (acao === 'excluir') {
      const cl = lista.find(c => c.id === id);
      if (confirm(`Excluir o checklist da OS ${cl.geral.os || '(sem número)'}? As fotos também serão removidas.`)) {
        await DB.excluirChecklist(id);
        const i = lista.indexOf(cl);
        if (i >= 0) lista.splice(i, 1);
        renderLista(document.getElementById('busca').value);
      }
    } else if (acao === 'relatorio') {
      location.hash = `#/relatorio/${id}`;
    } else {
      location.hash = `#/form/${id}/0`;
    }
  });

  document.getElementById('btn-novo').onclick = async () => {
    const cl = novoChecklist();
    await DB.salvarChecklist(cl);
    location.hash = `#/form/${cl.id}/0`;
  };

  document.getElementById('btn-exportar').onclick = async () => {
    const todos = await DB.listarChecklists();
    const comFotos = [];
    for (const cl of todos) {
      comFotos.push({ checklist: cl, fotos: await DB.fotosDoChecklist(cl.id) });
    }
    const blob = new Blob([JSON.stringify({ app: 'checklist-gas', versao: 1, dados: comFotos })],
      { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup-checklist-gas-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  document.getElementById('btn-importar').onclick = () => document.getElementById('arq-importar').click();
  document.getElementById('arq-importar').addEventListener('change', async e => {
    const arq = e.target.files[0];
    if (!arq) return;
    try {
      const json = JSON.parse(await arq.text());
      if (json.app !== 'checklist-gas' || !Array.isArray(json.dados)) throw new Error('formato');
      for (const reg of json.dados) {
        await DB.salvarChecklist(migrarChecklist(reg.checklist));
        for (const foto of reg.fotos || []) await DB.salvarFoto(foto);
      }
      alert(`Backup restaurado: ${json.dados.length} checklist(s).`);
      rotear();
    } catch {
      alert('Arquivo de backup inválido.');
    }
  });
}

/* ---------- formulário ---------- */
function etapaCompleta(etapa) {
  if (etapa.id === 'geral') return false;
  if (etapa.id === 'assinaturas') {
    return CHECKLIST_DEF.assinaturas.every(a => clAtual.assinaturas[a.id].img);
  }
  if (etapa.id === 'cadastro') {
    const cad = clAtual.cadastro;
    return cad.necessita === 'Não' || (cad.necessita === 'Sim' && cad.registros.length > 0);
  }
  return clAtual.frentes[etapa.id].every(itemJustificado);
}

function telaFormulario(etapaIdx) {
  etapaIdx = Math.min(etapaIdx, ETAPAS.length - 1);
  const etapa = ETAPAS[etapaIdx];
  montarTopo(`OS ${clAtual.geral.os || 'sem número'}`, etapa.rotulo, '#/');

  const chips = ETAPAS.map((e, i) =>
    `<button class="etapa-chip ${i === etapaIdx ? 'ativa' : ''} ${etapaCompleta(e) ? 'completa' : ''}"
      data-etapa="${i}">${esc(e.rotulo)}</button>`).join('');

  let corpo;
  if (etapa.id === 'geral') corpo = htmlEtapaGeral();
  else if (etapa.id === 'cadastro') corpo = htmlEtapaCadastro();
  else if (etapa.id === 'assinaturas') corpo = htmlEtapaAssinaturas();
  else corpo = htmlEtapaFrente(etapa.id);

  $view().innerHTML = `
    <div class="etapas">${chips}</div>
    <div style="padding-top:6px">${corpo}</div>
    <div class="nav-form">
      ${etapaIdx > 0
        ? `<button class="btn btn-secundario" id="btn-ant">← Anterior</button>` : ''}
      ${etapaIdx < ETAPAS.length - 1
        ? `<button class="btn btn-primario" id="btn-prox">Próxima →</button>`
        : `<button class="btn btn-primario" id="btn-relatorio">📄 Gerar relatório</button>`}
    </div>`;

  $view().querySelector('.etapas').addEventListener('click', e => {
    const chip = e.target.closest('.etapa-chip');
    if (chip) location.hash = `#/form/${clAtual.id}/${chip.dataset.etapa}`;
  });
  const btnAnt = document.getElementById('btn-ant');
  if (btnAnt) btnAnt.onclick = () => { location.hash = `#/form/${clAtual.id}/${etapaIdx - 1}`; };
  const btnProx = document.getElementById('btn-prox');
  if (btnProx) btnProx.onclick = () => { location.hash = `#/form/${clAtual.id}/${etapaIdx + 1}`; };
  const btnRel = document.getElementById('btn-relatorio');
  if (btnRel) btnRel.onclick = () => {
    const p = progressoChecklist(clAtual);
    if (p.pend > 0 && !confirm(
      `Atenção: ${p.pend} item(ns) sem OK e sem justificativa.\n` +
      `Itens não marcados precisam ser justificados.\n\nGerar o relatório mesmo assim?`)) return;
    location.hash = `#/relatorio/${clAtual.id}`;
  };

  if (etapa.id === 'geral') ligarEtapaGeral();
  else if (etapa.id === 'cadastro') ligarEtapaCadastro(etapaIdx);
  else if (etapa.id === 'assinaturas') ligarEtapaAssinaturas();
  else ligarEtapaFrente(etapa.id);
}

/* --- etapa: informações gerais --- */
function htmlEtapaGeral() {
  return `<div class="secao-titulo">Informações de Interesse Geral</div>` +
    CHECKLIST_DEF.geral.map((c, idx) => {
      const v = clAtual.geral[c.id];
      let controle;
      if (c.tipo === 'opcoes') {
        controle = `<div class="opcoes" data-campo="${c.id}">` +
          c.opcoes.map(op =>
            `<button class="opcao ${v === op ? 'marcada' : ''}" data-valor="${esc(op)}">${esc(op)}</button>`
          ).join('') + `</div>`;
      } else if (c.tipo === 'multi') {
        controle = `<div class="opcoes" data-campo="${c.id}" data-multi>` +
          c.opcoes.map(op =>
            `<button class="opcao ${(v || []).includes(op) ? 'marcada' : ''}" data-valor="${esc(op)}">${esc(op)}</button>`
          ).join('') + `</div>`;
      } else if (c.tipo === 'select') {
        controle = `<select data-campo="${c.id}" ${c.outro ? `data-tem-outro="${c.outro.id}"` : ''}>
          <option value="">Selecione…</option>
          ${c.opcoes.map(op => `<option value="${esc(op)}" ${v === op ? 'selected' : ''}>${esc(op)}</option>`).join('')}
        </select>` +
          (c.outro ? `<input type="text" class="campo-outro" data-campo="${c.outro.id}"
            placeholder="${esc(c.outro.placeholder)}" value="${esc(clAtual.geral[c.outro.id])}"
            ${v === 'Outros' ? '' : 'hidden'}>` : '');
      } else if (c.tipo === 'areatexto') {
        controle = `<textarea data-campo="${c.id}" placeholder="${esc(c.placeholder || '')}">${esc(v)}</textarea>`;
      } else if (c.tipo === 'numero') {
        controle = `<input type="number" inputmode="decimal" ${c.passo ? `step="${c.passo}"` : ''}
          min="0" data-campo="${c.id}" value="${esc(v)}">`;
      } else if (c.tipo === 'data') {
        controle = `<input type="date" data-campo="${c.id}" value="${esc(v)}">`;
      } else if (c.tipo === 'hora') {
        controle = `<input type="time" data-campo="${c.id}" value="${esc(v)}">`;
      } else {
        controle = `<input type="text" data-campo="${c.id}" value="${esc(v)}">`;
      }
      return `<div class="campo">
        <label class="rotulo"><span class="num">${idx + 1}.</span>${esc(c.label)}</label>
        ${controle}
        ${c.hint ? `<div class="hint">${esc(c.hint)}</div>` : ''}
      </div>`;
    }).join('');
}

function ligarEtapaGeral() {
  $view().querySelectorAll('input[data-campo], select[data-campo], textarea[data-campo]').forEach(inp => {
    inp.addEventListener('input', () => {
      clAtual.geral[inp.dataset.campo] = inp.value;
      if (inp.dataset.temOutro) {
        const campoOutro = inp.closest('.campo').querySelector(`[data-campo="${inp.dataset.temOutro}"]`);
        campoOutro.hidden = inp.value !== 'Outros';
        if (!campoOutro.hidden) campoOutro.focus();
      }
      agendarSalvar();
    });
  });
  $view().querySelectorAll('.opcoes[data-campo]').forEach(grupo => {
    const multi = grupo.hasAttribute('data-multi');
    grupo.addEventListener('click', e => {
      const btn = e.target.closest('.opcao');
      if (!btn) return;
      const campo = grupo.dataset.campo;
      if (multi) {
        const atual = clAtual.geral[campo] || [];
        const i = atual.indexOf(btn.dataset.valor);
        if (i >= 0) atual.splice(i, 1); else atual.push(btn.dataset.valor);
        clAtual.geral[campo] = atual;
        btn.classList.toggle('marcada', i < 0);
      } else {
        // tocar de novo na opção marcada desmarca
        const novo = clAtual.geral[campo] === btn.dataset.valor ? '' : btn.dataset.valor;
        clAtual.geral[campo] = novo;
        grupo.querySelectorAll('.opcao').forEach(b =>
          b.classList.toggle('marcada', b.dataset.valor === novo));
      }
      agendarSalvar();
    });
  });
}

/* --- etapa: frente --- */
function htmlEtapaFrente(fid) {
  const def = CHECKLIST_DEF.frentes.find(f => f.id === fid);
  return `<div class="secao-titulo">${esc(def.titulo)}</div>
    <div class="aviso-regra">Itens não marcados com ✓ precisam obrigatoriamente de justificativa.</div>` +
    def.itens.map((item, i) => {
      const dado = clAtual.frentes[fid][i];
      const pendente = !itemJustificado(dado);
      return `<div class="item-frente ${pendente ? 'sem-just' : ''}" data-item="${i}">
        <div class="cabeca">
          <button class="check ${dado.ok ? 'ok' : ''}" data-acao="ok" aria-label="Marcar OK">✓</button>
          <div class="texto-item">
            <span class="num-item">${i + 1}.</span>${esc(item.texto)}
            ${item.evidencia ? `<br><span class="chip-evid">Evidência: ${esc(item.evidencia)}</span>` : ''}
            ${item.hint ? `<div class="hint">${esc(item.hint)}</div>` : ''}
          </div>
        </div>
        <div class="detalhes">
          <div class="just-bloco" data-just ${dado.ok ? 'hidden' : ''}>
            <label class="just-rotulo">Justificativa obrigatória (item não marcado)</label>
            <textarea data-campo="justificativa" class="${pendente ? 'just-vazia' : ''}"
              placeholder="Por que este item não foi atendido?">${esc(dado.justificativa)}</textarea>
          </div>
          <input type="text" data-campo="responsavel" placeholder="Responsável (nome completo)"
            value="${esc(dado.responsavel)}">
          <textarea data-campo="observacoes" placeholder="Observações">${esc(dado.observacoes)}</textarea>
          <div class="fotos-wrap" data-fotos></div>
        </div>
      </div>`;
    }).join('');
}

function ligarEtapaFrente(fid) {
  $view().querySelectorAll('.item-frente').forEach(el => {
    const i = parseInt(el.dataset.item, 10);
    const dado = clAtual.frentes[fid][i];
    const blocoJust = el.querySelector('[data-just]');
    const txtJust = blocoJust.querySelector('textarea');

    function atualizarPendencia() {
      const pendente = !itemJustificado(dado);
      el.classList.toggle('sem-just', pendente);
      txtJust.classList.toggle('just-vazia', pendente);
    }

    el.querySelector('[data-acao=ok]').onclick = ev => {
      dado.ok = !dado.ok;
      ev.target.classList.toggle('ok', dado.ok);
      blocoJust.hidden = dado.ok;
      atualizarPendencia();
      agendarSalvar();
    };
    el.querySelectorAll('[data-campo]').forEach(inp => {
      inp.addEventListener('input', () => {
        dado[inp.dataset.campo] = inp.value;
        if (inp.dataset.campo === 'justificativa') atualizarPendencia();
        agendarSalvar();
      });
    });

    ligarFotos(el.querySelector('[data-fotos]'), `${fid}:${i}`);
  });
}

/* --- etapa: atualização cadastral --- */
function htmlEtapaCadastro() {
  const cad = clAtual.cadastro;
  const def = CHECKLIST_DEF.cadastro;

  let registros = '';
  if (cad.necessita === 'Sim') {
    registros = cad.registros.map((r, i) => `
      <div class="registro-cad" data-reg="${r.id}">
        <div class="reg-cabeca">
          <h3>Registro ${i + 1}</h3>
          <button class="btn-icone-reg" data-acao="remover" title="Remover registro">🗑</button>
        </div>
        <label class="rotulo">Rede com divergência</label>
        <div class="opcoes" data-campo="rede">
          ${def.redes.map(op =>
            `<button class="opcao ${r.rede === op ? 'marcada' : ''}" data-valor="${esc(op)}">${esc(op)}</button>`).join('')}
        </div>
        <label class="rotulo">Tipo de divergência encontrada</label>
        <div class="opcoes" data-campo="divergencias" data-multi>
          ${def.divergencias.map(op =>
            `<button class="opcao ${(r.divergencias || []).includes(op) ? 'marcada' : ''}" data-valor="${esc(op)}">${esc(op)}</button>`).join('')}
        </div>
        <label class="rotulo">Posição real encontrada na via</label>
        <div class="opcoes" data-campo="posicao">
          ${def.posicoes.map(op =>
            `<button class="opcao ${r.posicao === op ? 'marcada' : ''}" data-valor="${esc(op)}">${esc(op)}</button>`).join('')}
        </div>
        <label class="rotulo">Descrição das alterações cadastrais necessárias</label>
        <textarea data-campo="descricao"
          placeholder="Ex.: rede cadastrada como FF, encontrado PVC; profundidade real 1,20 m (cadastro: 0,90 m); rede no terço adjacente, não no oposto…">${esc(r.descricao)}</textarea>
        <label class="rotulo">Fotos da divergência</label>
        <div class="fotos-wrap" data-fotos></div>
      </div>`).join('') +
      `<button class="btn btn-secundario btn-bloco" id="btn-add-registro">＋ Adicionar registro de divergência</button>`;
  } else if (cad.necessita === 'Não') {
    registros = `<div class="campo cad-ok">✅ Cadastro confere com o encontrado em campo — nenhuma atualização necessária.</div>`;
  }

  return `<div class="secao-titulo">${esc(def.titulo)}</div>
    <div class="campo">
      <label class="rotulo">O cadastro (Sabesp/Comgás) precisa de atualização com base no encontrado em campo?</label>
      <div class="opcoes" data-necessita>
        <button class="opcao ${cad.necessita === 'Sim' ? 'marcada' : ''}" data-valor="Sim">Sim</button>
        <button class="opcao ${cad.necessita === 'Não' ? 'marcada' : ''}" data-valor="Não">Não</button>
      </div>
      <div class="hint">Ex.: material diferente, profundidade diferente, rede no terço adjacente/oposto, no eixo da pista ou na calçada, rede não cadastrada</div>
    </div>
    <div id="registros-cad">${registros}</div>`;
}

function ligarEtapaCadastro(etapaIdx) {
  const cad = clAtual.cadastro;

  $view().querySelector('[data-necessita]').addEventListener('click', async e => {
    const btn = e.target.closest('.opcao');
    if (!btn) return;
    cad.necessita = cad.necessita === btn.dataset.valor ? '' : btn.dataset.valor;
    if (cad.necessita === 'Sim' && !cad.registros.length) {
      cad.registros.push({ id: novoIdRegistro(), rede: '', divergencias: [], posicao: '', descricao: '' });
    }
    await DB.salvarChecklist(clAtual);
    telaFormulario(etapaIdx);
  });

  const btnAdd = document.getElementById('btn-add-registro');
  if (btnAdd) btnAdd.onclick = async () => {
    cad.registros.push({ id: novoIdRegistro(), rede: '', divergencias: [], posicao: '', descricao: '' });
    await DB.salvarChecklist(clAtual);
    telaFormulario(etapaIdx);
  };

  $view().querySelectorAll('.registro-cad').forEach(el => {
    const reg = cad.registros.find(r => r.id === el.dataset.reg);
    if (!reg) return;

    el.querySelector('[data-acao=remover]').onclick = async () => {
      if (!confirm('Remover este registro de divergência? As fotos dele também serão removidas.')) return;
      const fotos = await DB.fotosDoItem(clAtual.id, `cad:${reg.id}`);
      for (const f of fotos) await DB.excluirFoto(f.id);
      cad.registros = cad.registros.filter(r => r.id !== reg.id);
      await DB.salvarChecklist(clAtual);
      telaFormulario(etapaIdx);
    };

    el.querySelectorAll('.opcoes[data-campo]').forEach(grupo => {
      const campo = grupo.dataset.campo;
      const multi = grupo.hasAttribute('data-multi');
      grupo.addEventListener('click', e => {
        const btn = e.target.closest('.opcao');
        if (!btn) return;
        if (multi) {
          const atual = reg[campo] || [];
          const i = atual.indexOf(btn.dataset.valor);
          if (i >= 0) atual.splice(i, 1); else atual.push(btn.dataset.valor);
          reg[campo] = atual;
          btn.classList.toggle('marcada', i < 0);
        } else {
          const novo = reg[campo] === btn.dataset.valor ? '' : btn.dataset.valor;
          reg[campo] = novo;
          grupo.querySelectorAll('.opcao').forEach(b =>
            b.classList.toggle('marcada', b.dataset.valor === novo));
        }
        agendarSalvar();
      });
    });

    el.querySelector('textarea[data-campo=descricao]').addEventListener('input', e => {
      reg.descricao = e.target.value;
      agendarSalvar();
    });

    ligarFotos(el.querySelector('[data-fotos]'), `cad:${reg.id}`);
  });
}

/* --- etapa: assinaturas --- */
function htmlEtapaAssinaturas() {
  return `<div class="secao-titulo">Assinaturas digitais</div>` +
    CHECKLIST_DEF.assinaturas.map(a => {
      const dado = clAtual.assinaturas[a.id];
      return `<div class="cartao-assinatura" data-ass="${a.id}">
        <h3>${esc(a.label)}</h3>
        <input type="text" data-campo="nome" placeholder="Nome completo" value="${esc(dado.nome)}">
        <div class="assinatura-preview" data-preview>
          ${dado.img ? `<img src="${dado.img}" alt="Assinatura">` : 'Toque para assinar'}
        </div>
        ${dado.img ? `<div class="acoes-ass">
          <button class="btn btn-perigo" data-acao="apagar">Apagar assinatura</button>
        </div>` : ''}
      </div>`;
    }).join('');
}

function ligarEtapaAssinaturas() {
  $view().querySelectorAll('.cartao-assinatura').forEach(el => {
    const id = el.dataset.ass;
    const def = CHECKLIST_DEF.assinaturas.find(a => a.id === id);
    const dado = clAtual.assinaturas[id];

    el.querySelector('[data-campo=nome]').addEventListener('input', e => {
      dado.nome = e.target.value;
      agendarSalvar();
    });

    el.querySelector('[data-preview]').onclick = async () => {
      const img = await capturarAssinatura(def.label);
      if (img) {
        dado.img = img;
        await DB.salvarChecklist(clAtual);
        telaFormulario(ETAPAS.length - 1);
      }
    };

    const apagar = el.querySelector('[data-acao=apagar]');
    if (apagar) apagar.onclick = async () => {
      if (!confirm(`Apagar a assinatura de ${def.label}?`)) return;
      dado.img = null;
      await DB.salvarChecklist(clAtual);
      telaFormulario(ETAPAS.length - 1);
    };
  });
}

/* ---------- inicialização ---------- */
window.addEventListener('hashchange', rotear);
window.addEventListener('load', () => {
  rotear();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
