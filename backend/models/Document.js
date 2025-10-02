const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  urlDocumento: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'URL para o arquivo PDF ou outro documento'
  },
  urlImagen: {
    type: DataTypes.STRING,
    // MUDANÇA AQUI: de 'false' para 'true' (ou adicione se não existir)
    allowNull: true,
    comment: 'URL para a imagem de capa do documento'
  }
}, {
  tableName: 'documents'
});

module.exports = Document;