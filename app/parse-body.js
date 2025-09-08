export const parseBody = async req => {
  const buffer = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', e => reject(e));
  });

  const contentType = req.headers['content-type'] || '';
  if (contentType.startsWith('application/json')) {
    req.body = JSON.parse(buffer.toString());
    return;
  }
  if (contentType.startsWith('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(buffer.toString());
    req.body = {};
    params.entries().forEach(([key, value]) => { req.body[key] = value; });
    return;
  }
  req.body = '';
};

export default {
  parseBody,
};
