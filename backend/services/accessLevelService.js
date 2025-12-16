/**
 * Serviço para gerenciar níveis de acesso baseados nos produtos comprados
 */

// IDs dos produtos da Kiwify conforme especificação
const PRODUCT_IDS = {
  PRINCIPAL: '89aece00-a51b-11f0-ab58-2f2096ded2ba',
  PRODUTO_1: '2343e890-a538-11f0-98fb-c9aca982ba72', //PACK 1 - Juego de las Elecciones y Stickers
  PRODUTO_2: '44c34a50-a53e-11f0-a7e3-c3b4bfe5981f', //PACK EXTRA 2  - Versículos con Amor y Color
  PRODUTO_3: 'd614e9f0-a845-11f0-a8cd-a7de6dd83d71'  //Colorea con Fe + Granja Didáctica -- PRODUTO 3 - Upsell
};

// Níveis de acesso baseados nos produtos
const ACCESS_LEVELS = {
  NENHUM: 'nenhum',
  PRODUTO_PRINCIPAL: 'PRODUTO_PRINCIPAL',
  PRODUTO_1: 'PRODUTO_1',
  PRODUTO_2: 'PRODUTO_2',
  PRODUTO_3: 'PRODUTO_3'
};

// Mapeamento de produtos para níveis de acesso (CORRIGIDO para accessLevels tradicionais)
const PRODUCT_ACCESS_MAPPING = {
  [PRODUCT_IDS.PRINCIPAL]: 'BASICO',           // Kit Niños de Luz → BASICO
  [PRODUCT_IDS.PRODUTO_1]: 'INTERMEDIARIO',   // Pack Extra 1 → INTERMEDIARIO
  [PRODUCT_IDS.PRODUTO_2]: 'AVANCADO'         // Pack Extra 2 → AVANCADO
};

// Nomes amigáveis dos produtos
const PRODUCT_NAMES = {
  PRODUTO_PRINCIPAL: 'Kit Niños de Luz (Principal)',
  PRODUTO_1: 'PACK 1 - Juego de las Elecciones y Stickers',
  PRODUTO_2: 'Versículos con Amor y Color (Pack 2)',
  PRODUTO_3: 'Colorea con Fe + Granja Didáctica'
};

// Categorias de conteúdo (nova estrutura)
const CONTENT_CATEGORIES = {
  PRINCIPAL: 'PRINCIPAL',
  PRINCIPAL_VERTICAL: 'PRINCIPAL_VERTICAL',
  PRODUTO_1: 'PRODUTO_1',
  PRODUTO_2: 'PRODUTO_2',
  PRODUTO_3: 'PRODUTO_3'
};

// Nomes amigáveis das categorias de conteúdo
const CATEGORY_NAMES = {
  PRINCIPAL: 'Conteúdo do Produto Principal',
  PRINCIPAL_VERTICAL: 'KIT NIÑOS DE LUZ - RUTINAS CON AMOR Y FE (Horizontal)',
  PRODUTO_1: 'Conteúdo do Produto 1 (Adicional)',
  PRODUTO_2: 'Conteúdo do Produto 2 (Adicional)',
  PRODUTO_3: 'Conteúdo do Colorea con Fe + Granja Didáctica'
};

/**
 * Determina os níveis de acesso baseado nos produtos comprados
 * @param {Array} products - Array de produtos da compra
 * @returns {Array} - Array com os níveis de acesso dos produtos comprados
 */
function determineAccessLevels(products) {
  if (!products || !Array.isArray(products)) {
    console.log('⚠️ Nenhum produto fornecido, usando nível "nenhum"');
    return ['nenhum'];
  }

  // 1. Extrai a lista de IDs dos produtos comprados no webhook
  const idsDosProdutosComprados = products.map(product => product.product_id || product.id).filter(Boolean);

  console.log('📦 IDs dos produtos comprados:', idsDosProdutosComprados);

  // 2. Mapeia os IDs para níveis de acesso
  const niveisDeAcesso = idsDosProdutosComprados
    .map(productId => PRODUCT_ACCESS_MAPPING[productId])
    .filter(Boolean); // Remove valores undefined

  // 3. Se não encontrou nenhum produto válido, retorna 'nenhum'
  if (niveisDeAcesso.length === 0) {
    console.log('⚠️ Nenhum produto válido encontrado, usando nível "nenhum"');
    return ['nenhum'];
  }

  console.log('🎯 Níveis de acesso determinados:', niveisDeAcesso);
  return niveisDeAcesso;
}

/**
 * Função legacy para compatibilidade - determina o accessLevel mais alto
 * @param {Array} products - Array de produtos da compra
 * @returns {string} - AccessLevel mais alto baseado nos produtos comprados
 */
function determineAccessLevel(products) {
  if (!products || !Array.isArray(products)) {
    console.log('⚠️ Nenhum produto fornecido, usando nível "nenhum"');
    return 'nenhum';
  }

  // 1. Extrai a lista de IDs dos produtos comprados no webhook
  const idsDosProdutosComprados = products.map(product => product.product_id || product.id).filter(Boolean);

  console.log('📦 IDs dos produtos comprados:', idsDosProdutosComprados);

  // 2. Mapeia os IDs para accessLevels tradicionais
  const accessLevels = idsDosProdutosComprados
    .map(productId => PRODUCT_ACCESS_MAPPING[productId])
    .filter(Boolean); // Remove valores undefined

  // 3. Se não encontrou nenhum produto válido, retorna 'nenhum'
  if (accessLevels.length === 0) {
    console.log('⚠️ Nenhum produto válido encontrado, usando nível "nenhum"');
    return 'nenhum';
  }

  // 4. Verifica se tem todos os produtos (ACESSO_COMPLETO)
  const hasAllProducts = accessLevels.includes('BASICO') &&
    accessLevels.includes('INTERMEDIARIO') &&
    accessLevels.includes('AVANCADO');

  if (hasAllProducts) {
    console.log('🏆 Usuário tem todos os produtos - ACESSO_COMPLETO');
    return 'ACESSO_COMPLETO';
  }

  // 5. Determina o accessLevel mais alto (hierarquia: BASICO < INTERMEDIARIO < AVANCADO)
  const hierarchy = {
    'BASICO': 1,
    'INTERMEDIARIO': 2,
    'AVANCADO': 3
  };

  const highestLevel = accessLevels.reduce((highest, current) => {
    return hierarchy[current] > hierarchy[highest] ? current : highest;
  }, accessLevels[0]);

  console.log(`🎯 AccessLevels encontrados: ${accessLevels.join(', ')}`);
  console.log(`🏆 AccessLevel mais alto determinado: ${highestLevel}`);

  return highestLevel;
}

/**
 * Obtém todos os níveis de acesso disponíveis com nomes amigáveis
 * @returns {Array} - Array com todos os níveis formatados para o frontend
 */
function getAllAccessLevels() {
  const result = Object.entries(PRODUCT_NAMES).map(([key, name]) => ({
    value: key,
    label: name,
    hierarchy: getProductHierarchy(key)
  }));
  console.log('🔍 getAllAccessLevels() retornando:', result);
  return result;
}

/**
 * Obtém a hierarquia dos produtos (para ordenação)
 * @returns {Object} - Objeto com a hierarquia
 */
function getProductHierarchy(accessLevel) {
  const hierarchy = {
    [ACCESS_LEVELS.NENHUM]: 0,
    [ACCESS_LEVELS.PRODUTO_PRINCIPAL]: 1,
    [ACCESS_LEVELS.PRODUTO_1]: 2,
    [ACCESS_LEVELS.PRODUTO_2]: 3
  };
  return hierarchy[accessLevel] || 0;
}

/**
 * Constrói filtro SQL para níveis de acesso baseado nos produtos (LEGACY)
 * @param {Array} userAccessLevels - Array com os níveis de acesso do usuário
 * @returns {Object} - Filtro para Sequelize
 */
function buildAccessFilter(userAccessLevels) {
  // Se não há níveis de acesso ou é 'nenhum', só pode ver conteúdo público
  if (!userAccessLevels || userAccessLevels.length === 0 || userAccessLevels.includes('nenhum')) {
    return {
      accessLevel: ['nenhum']
    };
  }

  // Usuário pode ver conteúdo dos produtos que comprou
  return {
    accessLevel: userAccessLevels
  };
}

/**
 * NOVA LÓGICA: Determina quais categorias de conteúdo um usuário pode ver
 * baseado no seu accessLevel e se comprou o PRODUTO_3
 * @param {string} userAccessLevel - Nível de acesso do usuário
 * @param {boolean} comprouProduto3 - Se o usuário comprou o produto 3 (upsell)
 * @returns {Array} - Array com as categorias permitidas
 */
function getVisibleCategories(userAccessLevel, comprouProduto3 = false) {
  let allowedCategories = [];
  const principalCategories = ['PRINCIPAL', 'PRINCIPAL_VERTICAL'];

  // LÓGICA CORRETA: Baseada nos accessLevels tradicionais
  switch (userAccessLevel) {
    case 'BASICO':
      // Usuário básico pode ver apenas conteúdo principal
      allowedCategories = [...principalCategories];
      break;
    case 'INTERMEDIARIO':
      // Usuário intermediário pode ver conteúdo principal + produto 1
      allowedCategories = [...principalCategories, 'PRODUTO_1'];
      break;
    case 'AVANCADO':
      // Usuário avançado pode ver conteúdo principal + produto 2
      allowedCategories = [...principalCategories, 'PRODUTO_2'];
      break;
    case 'ACESSO_COMPLETO':
      // Usuário com acesso completo pode ver todo conteúdo
      allowedCategories = [...principalCategories, 'PRODUTO_1', 'PRODUTO_2'];
      break;
    case 'admin':
      // Admin vê todas as categorias, incluindo PRODUTO_3
      allowedCategories = [...principalCategories, 'PRODUTO_1', 'PRODUTO_2', 'PRODUTO_3'];
      break;
    default:
      // Usuário sem acesso ou nível inválido não vê nada
      allowedCategories = [];
  }

  // Adiciona PRODUTO_3 se o usuário comprou o upsell
  if (comprouProduto3 && !allowedCategories.includes('PRODUTO_3')) {
    allowedCategories.push('PRODUTO_3');
  }

  console.log(`👤 Usuário com accessLevel '${userAccessLevel}' e comprouProduto3: ${comprouProduto3} pode ver categorias:`, allowedCategories);
  return allowedCategories;
}

/**
 * NOVA LÓGICA: Constrói filtro SQL para categorias de conteúdo
 * @param {string} userAccessLevel - Nível de acesso do usuário
 * @param {boolean} comprouProduto3 - Se o usuário comprou o produto 3 (upsell)
 * @returns {Object} - Filtro para Sequelize
 */
function buildCategoryFilter(userAccessLevel, comprouProduto3 = false) {
  const allowedCategories = getVisibleCategories(userAccessLevel, comprouProduto3);

  if (allowedCategories.length === 0) {
    // Usuário sem acesso - retorna filtro que não encontra nada
    return {
      categoria_produto: ['INVALID_CATEGORY'] // Categoria que não existe
    };
  }

  return {
    categoria_produto: allowedCategories
  };
}

/**
 * Obtém todas as categorias de conteúdo disponíveis para o admin
 * @returns {Array} - Array com todas as categorias formatadas
 */
function getAllContentCategories() {
  return Object.entries(CATEGORY_NAMES).map(([key, name]) => ({
    value: key,
    label: name
  }));
}

module.exports = {
  // Funções legacy (mantidas para compatibilidade)
  determineAccessLevel,
  determineAccessLevels,
  getAllAccessLevels,
  getProductHierarchy,
  buildAccessFilter,

  // Novas funções para categorização
  getVisibleCategories,
  buildCategoryFilter,
  getAllContentCategories,

  // Constantes
  PRODUCT_IDS,
  ACCESS_LEVELS,
  PRODUCT_NAMES,
  PRODUCT_ACCESS_MAPPING,
  CONTENT_CATEGORIES,
  CATEGORY_NAMES
};
