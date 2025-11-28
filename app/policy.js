const app = {
  login: (max = 30, min = 3) => new RegExp(`^[-+@.a-zA-Z0-9]{${min},${max}}$`),
  base32: () => /^[A-Za-z2-7]+$/,
};

export const login = app.login();
export const base32 = app.base32();

export default { login, base32 };
