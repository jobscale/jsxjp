const login = (max = 30, min = 3) => new RegExp(`^[-+@.a-zA-Z0-9]{${min},${max}}$`);

module.exports = {
  login: login(),
};
