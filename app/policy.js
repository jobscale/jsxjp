const login = (max = 30, min = 3) => new RegExp(`^[-+@.a-zA-Z0-9]{${min},${max}}$`);
const base32 = () => new RegExp(`^[A-Za-z2-7]+$`);

module.exports = {
  login: login(),
  base32: base32(),
};
