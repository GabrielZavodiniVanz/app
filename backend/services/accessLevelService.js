/**
 * Serviço para gerenciar níveis de acesso baseados nos produtos comprados
 */

// IDs dos produtos da Kiwify conforme especificação
const PRODUCT_IDS = {
  PRINCIPAL: '89aece00-a51b-11f0-ab58-2f2096ded2ba',
  PRODUTO_1: '2343e890-a538-11f0-98fb-c9aca982ba72',
  PRODUTO_2: '44c34a50-a53e-11f0-a7e3-c3b4bfe5981f'
};

// Níveis de acesso disponíveis
const ACCESS_LEVELS = {
  NENHUM: 'nenhum',
  BASICO: 'BASICO',
  INTERMEDIARIO: 'INTERMEDIARIO', 
  AVANCADO: 'AVANCADO',
  ACESSO_COMPLETO: 'ACESSO_COMPLETO'
};

/**
 * Determina o nível de acesso baseado nos produtos comprados
 * @param {Array} products - Array de produtos da compra
 * @returns {string} - Nível de acesso determinado
 */
function determineAccessLevel(products) {
  if (!products || !Array.isArray(products)) {
    console.log('⚠️ Nenhum produto fornecido, usando nível "nenhum"');
    return 'nenhum';
  }

  // 1. Extrai a lista de IDs dos produtos comprados no webhook
  const idsDosProdutosComprados = products.map(product => product.product_id || product.id).filter(Boolean);
  
  console.log('📦 IDs dos produtos comprados:', idsDosProdutosComprados);

  let nivelDeAcesso = 'nenhum'; // Valor padrão

  // 2. Verifica as combinações para definir o nível de acesso
  // Cenário 1: Comprou TUDO (Principal + Produto 1 + Produto 2)
  if (idsDosProdutosComprados.includes(PRODUCT_IDS.PRINCIPAL) && 
      idsDosProdutosComprados.includes(PRODUCT_IDS.PRODUTO_1) && 
      idsDosProdutosComprados.includes(PRODUCT_IDS.PRODUTO_2)) {
    nivelDeAcesso = 'ACESSO_COMPLETO';
    console.log('🎯 Acesso COMPLETO: Principal + Produto 1 + Produto 2');
  }
  // Cenário 2: Comprou o Principal + Produto 2
  else if (idsDosProdutosComprados.includes(PRODUCT_IDS.PRINCIPAL) && 
           idsDosProdutosComprados.includes(PRODUCT_IDS.PRODUTO_2)) {
    nivelDeAcesso = 'AVANCADO';
    console.log('🎯 Acesso AVANÇADO: Principal + Produto 2');
  }
  // Cenário 3: Comprou o Principal + Produto 1
  else if (idsDosProdutosComprados.includes(PRODUCT_IDS.PRINCIPAL) && 
           idsDosProdutosComprados.includes(PRODUCT_IDS.PRODUTO_1)) {
    nivelDeAcesso = 'INTERMEDIARIO';
    console.log('🎯 Acesso INTERMEDIÁRIO: Principal + Produto 1');
  }
  // Cenário 4: Comprou APENAS o Principal
  else if (idsDosProdutosComprados.includes(PRODUCT_IDS.PRINCIPAL)) {
    nivelDeAcesso = 'BASICO';
    console.log('🎯 Acesso BÁSICO: Apenas Principal');
  }
  else {
    console.log('⚠️ Produto principal não encontrado, usando nível "nenhum"');
  }

  // 3. Retorna o nível de acesso para ser usado no cadastro do usuário
  return nivelDeAcesso;
}

/**
 * Obtém todos os níveis de acesso disponíveis
 * @returns {Array} - Array com todos os níveis
 */
function getAllAccessLevels() {
  return Object.values(ACCESS_LEVELS);
}

/**
 * Obtém a hierarquia de níveis de acesso
 * @returns {Object} - Objeto com a hierarquia
 */
function getAccessLevelHierarchy() {
  return {
    [ACCESS_LEVELS.NENHUM]: 0,
    [ACCESS_LEVELS.BASICO]: 1,
    [ACCESS_LEVELS.INTERMEDIARIO]: 2,
    [ACCESS_LEVELS.AVANCADO]: 3,
    [ACCESS_LEVELS.ACESSO_COMPLETO]: 4
  };
}

/**
 * Constrói filtro SQL para níveis de acesso (abordagem simplificada)
 * @param {string} userAccessLevel - Nível de acesso do usuário
 * @returns {Object} - Filtro para Sequelize
 */
function buildAccessFilter(userAccessLevel) {
  // Mapear níveis de usuário para níveis de conteúdo que podem ver
  // Cada nível vê o conteúdo do PRINCIPAL (BASICO) + seu nível específico
  const accessMapping = {
    'nenhum': ['nenhum'],
    'BASICO': ['BASICO'],                           // Básico vê apenas conteúdo básico (PRINCIPAL)
    'INTERMEDIARIO': ['BASICO', 'INTERMEDIARIO'],   // Intermediário vê PRINCIPAL + INTERMEDIARIO
    'AVANCADO': ['BASICO', 'AVANCADO'],             // Avançado vê PRINCIPAL + AVANCADO
    'ACESSO_COMPLETO': ['BASICO', 'INTERMEDIARIO', 'AVANCADO', 'ACESSO_COMPLETO'] // Completo vê tudo
  };
  
  const allowedLevels = accessMapping[userAccessLevel] || ['nenhum'];
  
  
  return {
    accessLevel: allowedLevels
  };
}

module.exports = {
  determineAccessLevel,
  getAllAccessLevels,
  getAccessLevelHierarchy,
  buildAccessFilter,
  PRODUCT_IDS,
  ACCESS_LEVELS
};
