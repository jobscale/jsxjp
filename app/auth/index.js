import jws from 'jws';

const alg = 'HS384';
const complement = {
  secret: 'secret',
  payload: {},
};

export class Auth {
  sign(payload, secret) {
    const header = { alg, payload };
    const params = {
      header,
      payload: payload || complement.payload,
      secret: secret || complement.secret,
    };
    return jws.sign(params);
  }

  verify(signature, secret) {
    return jws.verify(signature, alg, secret);
  }

  decode(signature) {
    const decoded = jws.decode(signature, { json: true });
    return decoded?.payload;
  }
}

export const auth = new Auth();

export default {
  Auth,
  auth,
};
