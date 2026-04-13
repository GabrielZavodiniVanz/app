/**
 * Serviço para gerenciar níveis de acesso baseados nos produtos comprados
 */

// IDs dos produtos da Kiwify conforme especificação
const PRODUCT_IDS = {
  PRINCIPAL: "89aece00-a51b-11f0-ab58-2f2096ded2ba",
  PRODUTO_1: "2343e890-a538-11f0-98fb-c9aca982ba72", // PACK EXPANSIÓN - MOTIVACIÓN Y JUEGO (ORDER BUMP)
  PRODUTO_2: "44c34a50-a53e-11f0-a7e3-c3b4bfe5981f", // PACK EXPANSIÓN 2 - VALORES Y FE (UPSELL)
  PRODUTO_3: "d614e9f0-a845-11f0-a8cd-a7de6dd83d71", // KIT ESENCIAL - RUTINAS SIN GRITOS (FRONT)
};

// IDs dos produtos da Hotmart (Placeholders - Substituir pelos IDs reais do painel Hotmart)
const HOTMART_PRODUCT_IDS = {
  PRINCIPAL: "2943269", // ⚠️IMPORTANTE: Substituir pelo ID real do Kit Principal
  PRODUTO_1: "7505378", // PACK EXPANSIÓN - MOTIVACIÓN Y JUEGO
  PRODUTO_2: "7518117", // PACK EXPANSIÓN 2 - VALORES Y FE
  PRODUTO_3: "7515543", // KIT ESENCIAL – RUTINAS SIN GRITOS
};

// Nomes amigáveis dos produtos
const PRODUCT_NAMES = {
  PRODUTO_PRINCIPAL: "Kit Niños de Luz (Principal)",
  PRODUTO_1: "PACK EXPANSIÓN - MOTIVACIÓN Y JUEGO",
  PRODUTO_2: "PACK EXPANSIÓN 2 - VALORES Y FE",
  PRODUTO_3: "KIT ESENCIAL - RUTINAS SIN GRITOS",
};

// Categorias de conteúdo
const CONTENT_CATEGORIES = {
  PRINCIPAL: "PRINCIPAL",
  PRINCIPAL_VERTICAL: "PRINCIPAL_VERTICAL",
  PRODUTO_1: "PRODUTO_1",
  PRODUTO_2: "PRODUTO_2",
  PRODUTO_3: "PRODUTO_3",
};

// Nomes amigáveis das categorias de conteúdo
const CATEGORY_NAMES = {
  PRINCIPAL: "Conteúdo do Produto Principal",
  PRINCIPAL_VERTICAL: "KIT NIÑOS DE LUZ - RUTINAS CON AMOR Y FE (Horizontal)",
  PRODUTO_1: "Conteúdo do PACK EXPANSIÓN - MOTIVACIÓN Y JUEGO",
  PRODUTO_2: "Conteúdo do PACK EXPANSIÓN 2 - VALORES Y FE",
  PRODUTO_3: "Conteúdo do KIT ESENCIAL - RUTINAS SIN GRITOS",
};

/**
 * Determina quais produtos o usuário possui com base na lista de compras
 * @param {Array|string|number} products - Array de produtos (Kiwify) ou ID do produto (Hotmart)
 * @returns {Object} - Objeto com as flags de produtos
 */
function determineUserProducts(products) {
  if (!products) {
    return {
      tem_kit_principal: false,
      tem_pack_1: false,
      tem_pack_2: false,
      comprou_produto_3: false,
    };
  }

  let productIds = [];

  if (Array.isArray(products)) {
    // Formato Kiwify: Array de objetos
    productIds = products.map((p) => p.product_id || p.id).filter(Boolean);
  } else {
    // Formato Hotmart: ID único (string ou number)
    productIds = [products.toString()];
  }

  return {
    tem_kit_principal: productIds.includes(PRODUCT_IDS.PRINCIPAL) || productIds.includes(HOTMART_PRODUCT_IDS.PRINCIPAL),
    tem_pack_1: productIds.includes(PRODUCT_IDS.PRODUTO_1) || productIds.includes(HOTMART_PRODUCT_IDS.PRODUTO_1),
    tem_pack_2: productIds.includes(PRODUCT_IDS.PRODUTO_2) || productIds.includes(HOTMART_PRODUCT_IDS.PRODUTO_2),
    comprou_produto_3: productIds.includes(PRODUCT_IDS.PRODUTO_3) || productIds.includes(HOTMART_PRODUCT_IDS.PRODUTO_3),
  };
}

/**
 * NOVA LÓGICA: Determina quais categorias de conteúdo um usuário pode ver
 * baseado nas flags de produtos que ele possui (Modular)
 * @param {Object} user - Objeto do usuário (contendo as flags)
 * @returns {Array} - Array com as categorias permitidas
 */
function getVisibleCategories(user) {
  if (!user) return [];

  // Admin vê tudo
  if (user.role === "admin") {
    return [
      "PRINCIPAL",
      "PRINCIPAL_VERTICAL",
      "PRODUTO_1",
      "PRODUTO_2",
      "PRODUTO_3",
    ];
  }

  let allowedCategories = [];

  // 1. Kit Principal dá acesso ao conteúdo Principal e Vertical
  if (
    user.tem_kit_principal ||
    user.accessLevel === "BASICO" ||
    user.accessLevel === "ACESSO_COMPLETO"
  ) {
    allowedCategories.push("PRINCIPAL", "PRINCIPAL_VERTICAL");
  }

  // 2. Produto 3 (Front) dá acesso ao conteúdo do Produto 3
  // Nota: user.comprou_produto_3 é a flag oficial para este produto
  if (user.comprou_produto_3) {
    allowedCategories.push("PRODUTO_3");
  }

  // 3. Pack 1 dá acesso ao conteúdo do Produto 1
  // Verificamos a nova flag OU o nível antigo para compatibilidade
  if (
    user.tem_pack_1 ||
    user.accessLevel === "INTERMEDIARIO" ||
    user.accessLevel === "ACESSO_COMPLETO"
  ) {
    allowedCategories.push("PRODUTO_1");
  }

  // 4. Pack 2 dá acesso ao conteúdo do Produto 2
  // Verificamos a nova flag OU o nível antigo para compatibilidade
  if (
    user.tem_pack_2 ||
    user.accessLevel === "AVANCADO" ||
    user.accessLevel === "ACESSO_COMPLETO"
  ) {
    allowedCategories.push("PRODUTO_2");
  }

  console.log(
    `👤 Categorias visíveis para usuário ${user.id || user.email}:`,
    allowedCategories,
  );
  return allowedCategories;
}

/**
 * Constrói filtro SQL para categorias de conteúdo
 * @param {Object} user - Objeto do usuário
 * @returns {Object} - Filtro para Sequelize
 */
function buildCategoryFilter(user) {
  const allowedCategories = getVisibleCategories(user);

  if (allowedCategories.length === 0) {
    return {
      categoria_produto: ["INVALID_CATEGORY"],
    };
  }

  return {
    categoria_produto: allowedCategories,
  };
}

/**
 * Obtém todas as categorias de conteúdo disponíveis para o admin
 * @returns {Array} - Array com todas as categorias formatadas
 */
function getAllContentCategories() {
  return Object.entries(CATEGORY_NAMES).map(([key, name]) => ({
    value: key,
    label: name,
  }));
}

// --- FUNÇÕES LEGACY MANTIDAS PARA COMPATIBILIDADE ---
// (Mas não devem ser usadas para lógica nova de acesso)

const ACCESS_LEVELS = {
  NENHUM: "nenhum",
  PRODUTO_PRINCIPAL: "PRODUTO_PRINCIPAL",
  PRODUTO_1: "PRODUTO_1",
  PRODUTO_2: "PRODUTO_2",
  PRODUTO_3: "PRODUTO_3",
};

const PRODUCT_ACCESS_MAPPING = {
  [PRODUCT_IDS.PRINCIPAL]: "BASICO",
  [PRODUCT_IDS.PRODUTO_1]: "INTERMEDIARIO",
  [PRODUCT_IDS.PRODUTO_2]: "AVANCADO",
};

function determineAccessLevel(products) {
  // Determina o accessLevel legacy baseado nos produtos comprados
  // IMPORTANTE: Só retorna 'BASICO' se o Kit Principal foi comprado
  if (!products || !Array.isArray(products)) return 'nenhum';

  // Suporte tanto para array de objetos (Kiwify) quanto array de strings/números (Hotmart formatado)
  const productIds = products.map(p => {
    if (typeof p === 'object') return p.product_id || p.id;
    return p.toString();
  }).filter(Boolean);

  const hasKitPrincipal = productIds.includes(PRODUCT_IDS.PRINCIPAL) || productIds.includes(HOTMART_PRODUCT_IDS.PRINCIPAL);
  const hasPack1 = productIds.includes(PRODUCT_IDS.PRODUTO_1) || productIds.includes(HOTMART_PRODUCT_IDS.PRODUTO_1);
  const hasPack2 = productIds.includes(PRODUCT_IDS.PRODUTO_2) || productIds.includes(HOTMART_PRODUCT_IDS.PRODUTO_2);

  // Se não comprou Kit Principal, não deve ter access level legacy
  if (!hasKitPrincipal && !hasPack1 && !hasPack2) {
    return 'nenhum';
  }

  // Se comprou Kit Principal + ambos packs
  if (hasKitPrincipal && hasPack1 && hasPack2) return 'ACESSO_COMPLETO';
  // Kit Principal + Pack 2 ou Pack 1 + Pack 2
  if ((hasKitPrincipal && hasPack2) || (hasPack1 && hasPack2)) return 'ACESSO_COMPLETO';
  if ((hasKitPrincipal && hasPack1) || (hasPack1)) return 'INTERMEDIARIO';
  if (hasPack2) return 'AVANCADO';
  if (hasKitPrincipal) return 'BASICO';

  return 'nenhum';
}

function determineAccessLevels(products) {
  return ["nenhum"];
}

function getAllAccessLevels() {
  return [];
}

function getProductHierarchy(accessLevel) {
  return 0;
}

function buildAccessFilter(userAccessLevels) {
  return {};
}

module.exports = {
  determineUserProducts,
  getVisibleCategories,
  buildCategoryFilter,
  getAllContentCategories,
  PRODUCT_IDS,
  PRODUCT_NAMES,
  CONTENT_CATEGORIES,
  CATEGORY_NAMES,

  // Legacy exports
  determineAccessLevel,
  determineAccessLevels,
  getAllAccessLevels,
  getProductHierarchy,
  buildAccessFilter,
  ACCESS_LEVELS,
  PRODUCT_ACCESS_MAPPING,
};
