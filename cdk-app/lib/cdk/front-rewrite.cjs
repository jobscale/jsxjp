function handler(event) {
  var request = event.request;

  if (request.method === 'OPTIONS') {
    return {
      statusCode: 200,
      statusDescription: 'OK',
      headers: {
        'access-control-allow-origin': { value: '*' },
        'access-control-allow-methods': { value: 'GET, HEAD' },
        'access-control-allow-headers': { value: '*' },
        'access-control-max-age': { value: '86400' },
      },
    };
  }

  if (request.uri.endsWith('/')) {
    request.uri = request.uri + 'index.html';
  } else if (!request.uri.includes('.')) {
    request.uri = request.uri + '/index.html';
  }

  return request;
}
