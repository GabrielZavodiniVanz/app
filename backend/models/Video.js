const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Video = sequelize.define('Video', {
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  urlVideo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  urlImagen: {
    type: DataTypes.STRING,
    // MUDANÇA AQUI: de 'false' para 'true'
    allowNull: true 
  }
}, {
  tableName: 'videos'
});

module.exports = Video;