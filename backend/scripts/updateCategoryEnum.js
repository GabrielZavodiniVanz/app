const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

async function updateEnum() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('🔄 Atualizando ENUM de categoria_produto na tabela documents...');
    await queryInterface.changeColumn('documents', 'categoria_produto', {
      type: DataTypes.ENUM('PRINCIPAL', 'PRINCIPAL_VERTICAL', 'PRODUTO_1', 'PRODUTO_2', 'PRODUTO_3'),
      allowNull: false,
      defaultValue: 'PRINCIPAL'
    });
    console.log('✅ ENUM atualizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao atualizar ENUM:', error);
  } finally {
    await sequelize.close();
  }
}

updateEnum();

