export const parseBody = async req => {
  const buffer = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', e => reject(e));
  });

  if (!buffer.length) {
    req.body = '';
    return;
  }

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
  if (!contentType.startsWith('multipart/form-data')) {
    req.body = '';
    return;
  }
  const boundary = Buffer.from(`--${contentType.split('boundary=')[1]}`);
  const parts = [];
  let current = buffer.indexOf(boundary) + boundary.length + 2; // skip initial boundary + \r\n
  while (current < buffer.length) {
    const nextBoundary = buffer.indexOf(boundary, current);
    if (nextBoundary === -1) break;
    const part = buffer.slice(current, nextBoundary - 2); // exclude \r\n before boundary
    parts.push(part);
    current = nextBoundary + boundary.length + 2;
  }
  req.files = [];
  parts.forEach(part => {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) return;
    const header = part.slice(0, headerEnd).toString();
    const content = part.slice(headerEnd + 4); // skip \r\n\r\n
    const dispositionMatch = header.match(/name="(.+?)"(?:; filename="(.+?)")?/);
    if (!dispositionMatch) return;
    const [, fieldname, filename] = dispositionMatch;
    if (!filename) return;
    const mimetypeMatch = header.match(/Content-Type: (.+)/);
    const mimetype = mimetypeMatch ? mimetypeMatch[1].trim() : 'application/octet-stream';
    req.files.push({
      fieldname,
      originalname: filename,
      buffer: content,
      mimetype,
    });
  });
};

export default {
  parseBody,
};
