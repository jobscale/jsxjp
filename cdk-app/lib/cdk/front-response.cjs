function handler(event) {
  const response = event.response;

  const chars = '0123456789abcdef';
  let nonce = '';
  for (let i = 0; i < 14; i++) {
    nonce += chars[Math.floor(Math.random() * chars.length)];
  }
  const inlinePolicy = `nonce-${nonce}`;
  const allowCdn = [
    'https://jsdelivr.net',
    'https://esm.sh',
    'https://cloudflare.com',
  ].join(' ');
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-eval' '${inlinePolicy}' ${allowCdn}`,
    "style-src 'self' 'unsafe-inline' https://googleapis.com",
    "font-src 'self' data: https://gstatic.com",
    "img-src 'self' data:",
    "media-src 'self' data:",
    "connect-src 'self' https: wss:",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'self'",
  ];
  response.headers['content-security-policy'] = { value: csp.join('; ') };

  return response; 
}
