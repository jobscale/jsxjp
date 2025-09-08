// cookieParser
const cookieParser = req => {
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
    writeHead: res.writeHead,
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
      hook.writeHead.apply(res, args);
    },
  };
  res.writeHead = hook.listener;
  res.setCookie = hook.setCookie;
};

export const parseCookies = (req, res) => {
  cookieParser(req);
  createCookieManager(res);
};

export default {
  parseCookies,
};
