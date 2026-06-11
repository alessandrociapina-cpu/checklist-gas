/* Versão do aplicativo e histórico de atualizações (mais recente primeiro) */
'use strict';

const APP_VERSAO = '1.3.0';

const HISTORICO_VERSOES = [
  {
    versao: '1.3.0',
    data: '2026-06-11',
    itens: [
      'Contrato/Contratada em menu de seleção, incluído o contrato 4600060683 / Consórcio Saneavale Saneamento',
      'Novo campo Descrição do Serviço Solicitado (abaixo do Nº OS)',
      'Opção "Outros" na lista de municípios, com digitação manual do nome'
    ]
  },
  {
    versao: '1.2.0',
    data: '2026-06-10',
    itens: [
      'Exibição da versão do aplicativo na tela inicial',
      'Janela com histórico das últimas atualizações (passe o mouse ou toque na versão)'
    ]
  },
  {
    versao: '1.1.0',
    data: '2026-06-10',
    itens: [
      'Município em menu de seleção (SJC, Caçapava, Monteiro Lobato, Jambeiro, Igaratá, Santa Branca)',
      'Justificativa obrigatória para itens não marcados com ✓, com destaque no relatório',
      'Material Cerâmica nas opções de rede de água/esgoto',
      'Campos de horário de início e término do serviço',
      'Outras interferências na via (rede elétrica, telefonia/fibra, GAP, drenagem)',
      'Nova etapa de Atualização Cadastral com registros de divergência e fotos'
    ]
  },
  {
    versao: '1.0.0',
    data: '2026-06-10',
    itens: [
      'Versão inicial: checklist completo da planilha (informações gerais + 4 frentes)',
      'Fotos de evidência, assinaturas digitais e relatório com impressão/PDF',
      'Funcionamento 100% offline (PWA) e backup/restauração em JSON'
    ]
  }
];
