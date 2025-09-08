// parseCookies
const parseCookies = req => {
  if (req.cookies) return;
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    if (!cookie) return;
    const [name, ...rest] = cookie.trim().split('=');
    cookies[name] = decodeURIComponent(rest.join('='));
  });
  req.cookies = cookies;
};

// createCookieManager
const createCookieManager = res => {
  if (res.setCookie) return;
  const cookies = [];
  const hook = {
    end: res.end,
    setCookie(name, value, options = {}) {
      const parts = [`${name}=${encodeURIComponent(value)}`];
      if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
      if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
      if (options.domain) parts.push(`Domain=${options.domain}`);
      parts.push(`Path=${options.path || '/'}`);
      if (options.secure) parts.push('Secure');
      if (options.httpOnly) parts.push('HttpOnly');
      if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
      cookies.push(parts.join('; '));
    },
    listener(...args) {
      if (cookies.length > 0) {
        res.setHeader('Set-Cookie', cookies);
      }
      hook.end.apply(res, args);
    },
  };
  res.end = hook.listener;
  res.setCookie = hook.setCookie;
};

export const manageCookie = (req, res) => {
  parseCookies(req);
  createCookieManager(res);
};

// 使用例
export function reqHandler(req) {
  parseCookies(req);
  const { token } = req.cookies;
  return token;
}

// 使用例
export function resHandler(req, res) {
  createCookieManager(res);

  // 任意のタイミングで呼び出せる
  res.setCookie('token', 'abc123', { httpOnly: true, secure: true });
  res.setCookie('session', 'xyz789', { path: '/', sameSite: 'Lax' });

  res.statusCode = 200;
  res.end('OK');
}
