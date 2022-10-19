const Sequelize = require('sequelize');

const { database } = require('../../config/database');

const tableName = 'user';

module.exports = database.define(tableName, {
  login: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  hash: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  lastLogin: {
    type: Sequelize.DATE,
  },
}, { tableName });
