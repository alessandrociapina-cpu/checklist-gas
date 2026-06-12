/* Definição do checklist — espelha a planilha CheckListGasOVMS_1_1.xlsx + melhorias de campo */
'use strict';

const MUNICIPIOS = [
  'São José dos Campos', 'Caçapava', 'Monteiro Lobato', 'Jambeiro', 'Igaratá', 'Santa Branca'
];

const CHECKLIST_DEF = {
  titulo: 'CHECKLIST - MANUTENÇÃO E OBRAS COM INTERFERÊNCIA/PARALELISMO EM REDE DE GÁS',

  /* Informações de Interesse Geral (numeração calculada pela posição) */
  geral: [
    { id: 'os',              label: 'Nº OS',                                          tipo: 'texto' },
    { id: 'descricaoServico', label: 'Descrição do Serviço Solicitado',               tipo: 'areatexto',
      placeholder: 'Descreva o serviço…' },
    { id: 'contrato',        label: 'Contrato/Contratada',                            tipo: 'select',
      opcoes: [
        '4600060322 / CONSÓRCIO SNJ SANEAMENTO',
        '4600060683 / CONSÓRCIO SANEAVALE SANEAMENTO',
        '4600059744 / CONSÓRCIO GVP'
      ],
      padrao: '4600060322 / CONSÓRCIO SNJ SANEAMENTO' },
    { id: 'endereco',        label: 'Endereço',                                       tipo: 'texto' },
    { id: 'municipio',       label: 'Município',                                      tipo: 'select',
      opcoes: [...MUNICIPIOS, 'Outros'], padrao: 'São José dos Campos',
      outro: { id: 'municipioOutro', placeholder: 'Digite o nome do município' } },
    { id: 'data',            label: 'Data de Início do Serviço',                      tipo: 'data' },
    { id: 'horaInicio',      label: 'Hora de Início do Serviço',                      tipo: 'hora' },
    { id: 'dataFim',         label: 'Data de Fim do Serviço',                         tipo: 'data' },
    { id: 'horaFim',         label: 'Hora de Fim do Serviço',                         tipo: 'hora' },
    { id: 'equipe',          label: 'Equipe Contratada',                              tipo: 'texto' },
    { id: 'responsavel',     label: 'Fiscal Sabesp',                                  tipo: 'texto' },
    { id: 'pressaoGas',      label: 'Pressão Rede de Gás',                            tipo: 'opcoes',
      opcoes: ['350 mbar', '4 bar', '7 bar', '17 bar'] },
    { id: 'materialGas',     label: 'Material Rede/Ramal de Gás',                     tipo: 'opcoes',
      opcoes: ['PE', 'Aço'] },
    { id: 'diametroGas',     label: 'Diâmetro Rede/Ramal de Gás',                     tipo: 'opcoes',
      opcoes: ['20', '40', '63', '90', '125', '4"', '6"', '8"'] },
    { id: 'diametroAgua',    label: 'Diâmetro Rede de Água/Esgoto',                   tipo: 'opcoes',
      opcoes: ['32', '50', '63', '75', '80', '90', '110', '160', '200', '315'] },
    { id: 'materialAgua',    label: 'Material Rede de Água/Esgoto',                   tipo: 'opcoes',
      opcoes: ['FF', 'PVC', 'PEAD', 'DEFOFO', 'Cerâmica'] },
    { id: 'imoveisAfetados', label: 'Quantidade de Imóveis Afetados (Abastecimento)', tipo: 'numero' },
    { id: 'hospitais',       label: 'Hospitais/Escolas Próximos/Clientes Especiais',  tipo: 'opcoes',
      opcoes: ['Sim', 'Não'] },
    { id: 'hospitaisObs',    label: 'Observações (Hospitais/Escolas/Clientes Especiais)', tipo: 'areatexto',
      placeholder: 'Ex.: morador com necessidades especiais, acessibilidade do imóvel, cliente que não pode ter abastecimento interrompido…' },
    { id: 'distanciaRedes',  label: 'Distância entre Redes (m)',                      tipo: 'numero', passo: '0.01' },
    { id: 'profGas',         label: 'Profundidade Rede de Gás (m)',                   tipo: 'numero', passo: '0.01' },
    { id: 'profAgua',        label: 'Profundidade Rede de Água (m)',                  tipo: 'numero', passo: '0.01' },
    { id: 'outrasInterf',    label: 'Outras Interferências na Via',                   tipo: 'multi',
      opcoes: ['Rede Elétrica', 'Telefonia/Fibra Óptica', 'Galeria de Águas Pluviais (GAP)', 'Drenagem', 'Outras'],
      hint: 'Marque todas as interferências de terceiros identificadas no local' },
    { id: 'outrasInterfDet', label: 'Detalhamento das Outras Interferências',         tipo: 'texto' },
    { id: 'criticidade',     label: 'Classificação de Criticidade',                   tipo: 'opcoes',
      opcoes: ['Alta', 'Média', 'Baixa'],
      hint: 'Avaliar: duas ou mais redes no local, redes de alta pressão, cruzamentos e esquinas' },
    { id: 'protocoloGas',    label: 'Protocolo Concessionária de Gás',                tipo: 'texto' },
    { id: 'tecnicoGas',      label: 'Nome do Técnico Concessionária de Gás (quando for acionado)', tipo: 'texto' }
  ],

  /* Frentes — cada item: OK, justificativa (obrigatória se não OK), responsável, observações, fotos */
  frentes: [
    {
      id: 'f1',
      titulo: 'FRENTE 1 - ANÁLISE PRÉVIA PARA REALIZAÇÃO DA OBRA EMERGENCIAL',
      curto: 'Frente 1 · Análise Prévia',
      itens: [
        { texto: 'Preenchimento da APR', evidencia: 'Documento' },
        { texto: 'Baixa cadastro Comgás', evidencia: 'Print',
          hint: 'Comprovar a baixa oficial com print' },
        { texto: 'Baixa cadastro rede de água',
          hint: 'SIGNOS' },
        { texto: 'Análise de interferência/Demarcação da rede de água/esgoto na via/passeio',
          evidencia: 'Foto' },
        { texto: 'Avaliação de criticidade preliminar',
          hint: 'Avaliar: duas ou mais redes no local, redes de alta pressão, cruzamentos e esquinas, imóveis do entorno' }
      ]
    },
    {
      id: 'f2',
      titulo: 'FRENTE 2 - PARTICIPAÇÃO DA CONCESSIONÁRIA DE GÁS',
      curto: 'Frente 2 · Concessionária',
      itens: [
        { texto: 'Acionamento/Protocolo registrado' },
        { texto: 'Presença do técnico em campo' },
        { texto: 'Marcação da rede na superfície pelo técnico da concessionária de gás' },
        { texto: 'Liberação formal recebida' }
      ]
    },
    {
      id: 'f3',
      titulo: 'FRENTE 3 - INVESTIGAÇÃO EM CAMPO',
      curto: 'Frente 3 · Investigação',
      itens: [
        { texto: 'Sondagem Manual para todos os casos',
          hint: 'Não usar retroescavadeira' },
        { texto: 'Utilização de haste de sondagem com ponteira de nylon' },
        { texto: 'Identificação da rede de gás' },
        { texto: 'Identificação da rede de água' },
        { texto: 'Medição de profundidades e afastamentos' }
      ]
    },
    {
      id: 'f4',
      titulo: 'FRENTE 4 - EXECUÇÃO E ENCERRAMENTO',
      curto: 'Frente 4 · Execução',
      itens: [
        { texto: 'Escavação Manual' },
        { texto: 'Reparo executado Rede Sabesp' },
        { texto: 'Integridade da rede de gás verificada' },
        { texto: 'Recomposição realizada' },
        { texto: 'Relatório final anexado' }
      ]
    }
  ],

  /* Atualização cadastral — divergências encontradas em campo vs. cadastro (Sabesp/Comgás) */
  cadastro: {
    titulo: 'ATUALIZAÇÃO CADASTRAL',
    redes: ['Água', 'Esgoto', 'Gás'],
    divergencias: [
      'Material diferente do cadastro',
      'Profundidade diferente',
      'Diâmetro diferente',
      'Posição na via diferente',
      'Rede não cadastrada',
      'Outra divergência'
    ],
    posicoes: ['Terço adjacente', 'Terço oposto', 'Eixo da pista', 'Calçada/Passeio']
  },

  assinaturas: [
    { id: 'contratada',    label: 'Responsável Sabesp' },
    { id: 'administrador', label: 'Administrador do Contrato' },
    { id: 'gerManutencao', label: 'Gerente de Manutenção' },
    { id: 'gerRegional',   label: 'Gerente/Diretor Regional' }
  ]
};

function novoIdRegistro() {
  return 'rg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function itemFrenteVazio() {
  return { ok: false, justificativa: '', responsavel: '', observacoes: '' };
}

/* Cria um checklist vazio com os valores padrão */
function novoChecklist() {
  const geral = {};
  CHECKLIST_DEF.geral.forEach(c => {
    geral[c.id] = c.tipo === 'multi' ? [] : (c.padrao || '');
    if (c.outro) geral[c.outro.id] = '';
  });
  geral.data = new Date().toISOString().slice(0, 10);

  const frentes = {};
  CHECKLIST_DEF.frentes.forEach(f => {
    frentes[f.id] = f.itens.map(itemFrenteVazio);
  });

  const assinaturas = {};
  CHECKLIST_DEF.assinaturas.forEach(a => { assinaturas[a.id] = { nome: '', img: null }; });

  return {
    id: 'cl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    geral, frentes, assinaturas,
    cadastro: { necessita: '', registros: [] }
  };
}

/* Garante que checklists antigos (ou de backup) tenham os campos novos */
function migrarChecklist(cl) {
  if (!cl) return cl;
  cl.geral = cl.geral || {};
  CHECKLIST_DEF.geral.forEach(c => {
    if (cl.geral[c.id] === undefined) cl.geral[c.id] = c.tipo === 'multi' ? [] : '';
    if (c.outro && cl.geral[c.outro.id] === undefined) cl.geral[c.outro.id] = '';
  });
  cl.frentes = cl.frentes || {};
  CHECKLIST_DEF.frentes.forEach(f => {
    if (!Array.isArray(cl.frentes[f.id])) cl.frentes[f.id] = f.itens.map(itemFrenteVazio);
    cl.frentes[f.id].forEach(it => { if (it.justificativa === undefined) it.justificativa = ''; });
  });
  if (!cl.cadastro) cl.cadastro = { necessita: '', registros: [] };
  if (!Array.isArray(cl.cadastro.registros)) cl.cadastro.registros = [];
  cl.assinaturas = cl.assinaturas || {};
  CHECKLIST_DEF.assinaturas.forEach(a => {
    if (!cl.assinaturas[a.id]) cl.assinaturas[a.id] = { nome: '', img: null };
  });
  return cl;
}

function itemJustificado(it) {
  return it.ok || (it.justificativa || '').trim() !== '';
}

/* Município para exibição: usa o digitado quando a opção é "Outros" */
function municipioExibicao(geral) {
  return geral.municipio === 'Outros'
    ? (geral.municipioOutro || 'Outros')
    : geral.municipio;
}

/* Progresso: itens OK / total e pendências (sem OK e sem justificativa) */
function progressoChecklist(cl) {
  let ok = 0, total = 0, pend = 0;
  CHECKLIST_DEF.frentes.forEach(f => {
    (cl.frentes[f.id] || []).forEach(it => {
      total++;
      if (it.ok) ok++;
      else if (!(it.justificativa || '').trim()) pend++;
    });
  });
  return { ok, total, pend, pct: total ? Math.round(ok / total * 100) : 0 };
}
