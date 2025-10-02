const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Video = sequelize.define('Video', {
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
  urlVideo: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true,
      isUrl: true
    }
  },
  urlImagen: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  }
}, {
  tableName: 'videos',
  indexes: [
    {
      fields: ['titulo']
    },
    {
      fields: ['createdAt']
    }
  ],
  hooks: {
    beforeValidate: (video) => {
      if (video.titulo) {
        video.titulo = video.titulo.trim();
      }
      if (video.descripcion) {
        video.descripcion = video.descripcion.trim();
      }
    }
  }
});

module.exports = Video;