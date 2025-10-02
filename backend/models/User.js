const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // NOVO CAMPO 'ROLE'
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user', // Por padrão, todo novo usuário é um 'user'
    allowNull: false
  }
}, {
  tableName: 'users'
});

module.exports = User;