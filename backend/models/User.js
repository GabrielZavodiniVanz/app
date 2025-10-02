const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [2, 50],
      notEmpty: true,
      is: /^[a-zA-ZÀ-ÿ\s]+$/
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      len: [5, 100]
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
    allowNull: false,
    validate: {
      isIn: [['user', 'admin']]
    }
  }
}, {
  tableName: 'users',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    }
  ],
  hooks: {
    beforeValidate: (user) => {
      if (user.name) {
        user.name = user.name.trim();
      }
      if (user.email) {
        user.email = user.email.trim().toLowerCase();
      }
    }
  }
});

module.exports = User;