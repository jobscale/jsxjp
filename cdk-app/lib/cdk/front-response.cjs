function handler(event) {
  const response = event.response;

  const chars = '0123456789abcdef';
  let nonce = '';
  for (let i = 0; i < 14; i++) {
    nonce += chars[Math.floor(Math.random() * chars.length)];
  }
  const inlinePolicy = `nonce-${nonce}`;
  const scheme = 'https: wss:';
  const allowCdn = [
    'https://cdn.jsdelivr.net',
    'https://esm.sh',
    'https://cdnjs.cloudflare.com',
  ].join(' ');
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-eval' '${inlinePolicy}' ${allowCdn}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src 'self' https://www.google.com",
    "img-src 'self' data:",
    "media-src 'self' data:",
    `connect-src 'self' ${scheme}`,
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'self'",
  ];
  response.headers['content-security-policy'] = { value: csp.join('; ') };
  response.headers['permissions-policy'] = { value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()' };
  response.headers['referrer-policy'] = { value: 'strict-origin-when-cross-origin' };
  response.headers['strict-transport-security'] = { value: 'max-age=31536000; includeSubdomains; preload' };
  response.headers['x-content-type-options'] = { value: 'nosniff' };
  response.headers['x-frame-options'] = { value: 'SAMEORIGIN' };
  response.headers['x-xss-protection'] = { value: '1; mode=block' };

  response.headers['access-control-allow-origin'] = { value: '*' };
  response.headers['access-control-allow-methods'] = { value: 'GET, HEAD, POST' };
  response.headers['access-control-allow-headers'] = { value: 'Content-Type' };
  response.headers['access-control-expose-headers'] = { value: 'X-User, X-Address, Date, Server' };
  response.headers['access-control-allow-credentials'] = { value: 'true' };
  response.headers['access-control-max-age'] = { value: '86400' };
  response.headers['timing-allow-origin'] = { value: '*' };

  return response; 
}
