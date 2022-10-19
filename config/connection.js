const path = require('path');

module.exports = {
  connection: {
    dialect: 'sqlite',
    storage: path.join(process.cwd(), 'db', 'database.sqlite'),
  },
};
