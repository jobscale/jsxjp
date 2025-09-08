export const parseFiles = async req => {
  const buffer = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', e => reject(e));
  });

  const contentType = req.headers['content-type'] || '';
  if (!contentType.startsWith('multipart/form-data')) return;
  const boundary = `--${contentType.split('boundary=')[1]}`;
  const parts = buffer.toString().split(boundary).slice(1, -1);
  req.files = [];
  parts.forEach(part => {
    const headerEnd = part.indexOf('\r\n\r\n');
    const header = part.slice(0, headerEnd);
    const dispositionMatch = header.match(/name="(.+?)"(?:; filename="(.+?)")?/);
    if (!dispositionMatch) return;
    const [, fieldname, filename] = dispositionMatch;
    if (!filename) return;
    const mimetypeMatch = header.match(/Content-Type: (.+)/);
    const mimetype = mimetypeMatch ? mimetypeMatch[1].trim() : 'application/octet-stream';
    const partStart = buffer.indexOf(part);
    const contentStart = partStart + headerEnd + 4;
    const contentEnd = partStart + part.lastIndexOf('\r\n');
    const fileBuffer = buffer.slice(contentStart, contentEnd);
    req.files.push({ fieldname, originalname: filename, buffer: fileBuffer, mimetype });
  });
};

export default {
  parseFiles,
};
