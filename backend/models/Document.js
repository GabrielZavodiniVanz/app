const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  titulo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [3, 100],
      notEmpty: true
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000]
    }
  },
  urlDocumento: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'URL para o arquivo PDF ou outro documento',
    validate: {
      notEmpty: true,
      isUrl: true
    }
  },
  urlImagen: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL para a imagem de capa do documento',
    validate: {
      isValidUrl(value) {
        if (value && value.trim() !== '') {
          try {
            new URL(value);
          } catch (e) {
            throw new Error('URL da imagem inválida');
          }
        }
      }
    }
  },
  categoria_produto: {
    type: DataTypes.ENUM('PRINCIPAL', 'PRINCIPAL_VERTICAL', 'PRODUTO_1', 'PRODUTO_2', 'PRODUTO_3'),
    defaultValue: 'PRINCIPAL',
    allowNull: false,
    validate: {
      isIn: [['PRINCIPAL', 'PRINCIPAL_VERTICAL', 'PRODUTO_1', 'PRODUTO_2', 'PRODUTO_3']]
    }
  }
}, {
  tableName: 'documents',
  indexes: [
    {
      fields: ['titulo']
    },
    {
      fields: ['createdAt']
    }
  ],
  hooks: {
    beforeValidate: (document) => {
      if (document.titulo) {
        document.titulo = document.titulo.trim();
      }
      if (document.descripcion) {
        document.descripcion = document.descripcion.trim();
      }
    }
  }
});

module.exports = Document;