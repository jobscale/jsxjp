function handler(event) {
  const request = event.request;
  const method = request.method;
  const uri = request.uri;

  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      statusDescription: 'No Content',
      headers: {
        'access-control-allow-origin': { value: '*' },
        'access-control-allow-methods': { value: 'GET, HEAD, POST' },
        'access-control-allow-headers': { value: 'Content-Type' },
        'access-control-expose-headers': { value: 'X-User, X-Address, Date, Server' },
        'access-control-allow-credentials': { value: 'true' },
        'access-control-max-age': { value: '86400' },
      },
    };
  }

  if (uri.endsWith('/')) {
    request.uri += 'index.html';
  } else if (!uri.includes('.')) {
    return {
      statusCode: 307,
      statusDescription: 'Temporary Redirect',
      headers: {
        'location': { value: `${uri}/` },
      },
    };
  }

  return request;
}
