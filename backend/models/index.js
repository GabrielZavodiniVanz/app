// Importar todos os modelos para garantir que o Sequelize os conheça
require('./User');
require('./Video');
require('./Document');

module.exports = {
  User: require('./User'),
  Video: require('./Video'),
  Document: require('./Document')
};
