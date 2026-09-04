function handler(event) {
  const request = event.request;
  const method = request.method;
  const uri = request.uri;

  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      statusDescription: 'OK',
      headers: {
        'access-control-allow-origin': { value: '*' },
        'access-control-allow-methods': { value: 'GET, HEAD' },
        'access-control-allow-headers': { value: 'Content-Type' },
        'access-control-max-age': { value: '86400' },
      },
    };
  }

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (!uri.includes('.')) {
    request.uri = uri + '/index.html';
  }

  return request;
}
