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
  },
  accessLevel: {
    type: DataTypes.ENUM('nenhum', 'BASICO', 'INTERMEDIARIO', 'AVANCADO', 'ACESSO_COMPLETO'),
    defaultValue: 'BASICO',
    allowNull: false,
    validate: {
      isIn: [['nenhum', 'BASICO', 'INTERMEDIARIO', 'AVANCADO', 'ACESSO_COMPLETO']]
    }
  },
  resetPasswordToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  comprou_produto_3: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Indica se o usuário comprou o Produto 3 (upsell)'
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