const path = require('path');

const loader = require;
const db = {
  users: path.resolve(__dirname, '../../db/users.json'),
};

class User {
  async findAll(options) {
    const { where } = options || {};
    delete loader.cache[db.users];
    const { users } = loader(db.users);
    return users.filter(user => {
      const entries = Object.entries(where || {});
      const finds = entries.filter(([key, value]) => user[key] === value);
      return entries.length === finds.length;
    });
  }

  async findOne(options) {
    const { where } = options || {};
    delete loader.cache[db.users];
    const { users } = loader(db.users);
    return users.find(user => {
      const entries = Object.entries(where || {});
      const finds = entries.filter(([key, value]) => user[key] === value);
      return entries.length === finds.length;
    });
  }
}

module.exports = {
  User,
  userModel: new User(),
};
