/* Definição do checklist — espelha fielmente a planilha CheckListGasOVMS_1_1.xlsx */
'use strict';

const CHECKLIST_DEF = {
  titulo: 'CHECKLIST - MANUTENÇÃO E OBRAS COM INTERFERÊNCIA/PARALELISMO EM REDE DE GÁS',

  /* Informações de Interesse Geral — 20 campos */
  geral: [
    { id: 'os',              num: 1,  label: 'Nº OS',                                            tipo: 'texto' },
    { id: 'contrato',        num: 2,  label: 'Contrato/Contratada',                              tipo: 'texto',
      padrao: '4600060322 / CONSÓRCIO SNJ SANEAMENTO' },
    { id: 'endereco',        num: 3,  label: 'Endereço',                                         tipo: 'texto' },
    { id: 'municipio',       num: 4,  label: 'Município',                                        tipo: 'texto',
      padrao: 'São José dos Campos' },
    { id: 'data',            num: 5,  label: 'Data',                                             tipo: 'data' },
    { id: 'equipe',          num: 6,  label: 'Equipe',                                           tipo: 'texto' },
    { id: 'responsavel',     num: 7,  label: 'Responsável',                                      tipo: 'texto' },
    { id: 'pressaoGas',      num: 8,  label: 'Pressão Rede de Gás',                              tipo: 'opcoes',
      opcoes: ['350 mbar', '4 bar', '7 bar', '17 bar'] },
    { id: 'materialGas',     num: 9,  label: 'Material Rede/Ramal de Gás',                       tipo: 'opcoes',
      opcoes: ['PE', 'Aço'] },
    { id: 'diametroGas',     num: 10, label: 'Diâmetro Rede/Ramal de Gás',                       tipo: 'opcoes',
      opcoes: ['20', '40', '63', '90', '125', '4"', '6"', '8"'] },
    { id: 'diametroAgua',    num: 11, label: 'Diâmetro Rede de Água/Esgoto',                     tipo: 'opcoes',
      opcoes: ['32', '50', '63', '75', '80', '90', '110', '160', '200', '315'] },
    { id: 'materialAgua',    num: 12, label: 'Material Rede de Água/Esgoto',                     tipo: 'opcoes',
      opcoes: ['FF', 'PVC', 'PEAD', 'DEFOFO'] },
    { id: 'imoveisAfetados', num: 13, label: 'Quantidade de Imóveis Afetados (Abastecimento)',   tipo: 'numero' },
    { id: 'hospitais',       num: 14, label: 'Hospitais/Escolas Próximos/Clientes Especiais',    tipo: 'opcoes',
      opcoes: ['Sim', 'Não'] },
    { id: 'distanciaRedes',  num: 15, label: 'Distância entre Redes (m)',                        tipo: 'numero', passo: '0.01' },
    { id: 'profGas',         num: 16, label: 'Profundidade Rede de Gás (m)',                     tipo: 'numero', passo: '0.01' },
    { id: 'profAgua',        num: 17, label: 'Profundidade Rede de Água (m)',                    tipo: 'numero', passo: '0.01' },
    { id: 'criticidade',     num: 18, label: 'Classificação de Criticidade',                     tipo: 'opcoes',
      opcoes: ['Alta', 'Média', 'Baixa'],
      hint: 'Avaliar: duas ou mais redes no local, redes de alta pressão, cruzamentos e esquinas' },
    { id: 'protocoloGas',    num: 19, label: 'Protocolo Concessionária de Gás',                  tipo: 'texto' },
    { id: 'tecnicoGas',      num: 20, label: 'Nome do Técnico Concessionária de Gás',            tipo: 'texto' }
  ],

  /* Frentes de verificação — cada item: OK, Evidência, Foto, Responsável, Observações */
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
        { texto: 'Marcação da rede na superfície' },
        { texto: 'Liberação formal recebida' }
      ]
    },
    {
      id: 'f3',
      titulo: 'FRENTE 3 - INVESTIGAÇÃO EM CAMPO',
      curto: 'Frente 3 · Investigação',
      itens: [
        { texto: 'Abertura de janela de testemunho manual para todos os casos',
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

  assinaturas: [
    { id: 'contratada',    label: 'Responsável Contratada' },
    { id: 'administrador', label: 'Administrador do Contrato' },
    { id: 'gerManutencao', label: 'Gerente de Manutenção' },
    { id: 'gerRegional',   label: 'Gerente/Diretor Regional' }
  ]
};

/* Cria um checklist vazio com os valores padrão da planilha */
function novoChecklist() {
  const geral = {};
  CHECKLIST_DEF.geral.forEach(c => { geral[c.id] = c.padrao || ''; });
  geral.data = new Date().toISOString().slice(0, 10);

  const frentes = {};
  CHECKLIST_DEF.frentes.forEach(f => {
    frentes[f.id] = f.itens.map(() => ({ ok: false, responsavel: '', observacoes: '' }));
  });

  const assinaturas = {};
  CHECKLIST_DEF.assinaturas.forEach(a => { assinaturas[a.id] = { nome: '', img: null }; });

  return {
    id: 'cl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    geral, frentes, assinaturas
  };
}

/* Progresso: itens OK / total de itens das frentes */
function progressoChecklist(cl) {
  let ok = 0, total = 0;
  CHECKLIST_DEF.frentes.forEach(f => {
    (cl.frentes[f.id] || []).forEach(it => { total++; if (it.ok) ok++; });
  });
  return { ok, total, pct: total ? Math.round(ok / total * 100) : 0 };
}
